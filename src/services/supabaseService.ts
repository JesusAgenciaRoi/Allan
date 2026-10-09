// Implementación CONECTADA del DataService (Supabase: Auth + Postgres con RLS + Storage + Realtime).
// Los permisos los impone la base de datos (ver supabase/migrations). Este código solo traduce filas ↔ dominio.

import { createClient, type RealtimeChannel, type SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config';
import type {
  ActivityItem,
  AppNotification,
  Client,
  Exercise,
  ExerciseInput,
  ExerciseMedia,
  Framing,
  Mesocycle,
  PlanChange,
  PrescribedExercise,
  Profile,
  TrainingPhase,
  TrainingPlan,
  TrainingSession,
  TrainingWeek,
  WellbeingReport,
  WorkoutLog,
} from '../types/domain';
import { activeExercises, findPrescription, findSession, findWeek, setCount } from '../lib/plan';
import { normalizeFraming } from '../lib/framing';
import { storagePathFor, validateMediaFile } from '../lib/validation';
import { readMediaSize } from '../lib/media';
import { stageLabel } from '../content/muscleGroups';
import {
  PermissionError,
  ValidationError,
  type ChangeEvent,
  type ClientInput,
  type ContactInput,
  type DataService,
  type PrescriptionParams,
  type ReportFilter,
  type ReportInput,
  type UploadProgress,
} from './types';
import excelPlan from '../data/generated/excel-plan.json';
import { buildDemoExercises } from '../data/demo/exercises';

type Row = Record<string, unknown>;
const s = (v: unknown) => (v === null || v === undefined ? null : String(v));
const str = (v: unknown) => (v === null || v === undefined ? '' : String(v));

/** Traduce errores de PostgREST/Auth a mensajes claros sin filtrar detalles internos. */
function fail(error: { message?: string; code?: string } | null, fallback = 'No se pudo completar la operación.'): never {
  const code = error?.code ?? '';
  if (code === '42501' || /row-level security|permission denied/i.test(error?.message ?? '')) throw new PermissionError();
  if (code === '23505') throw new ValidationError('Ya existe un registro con esos datos (duplicado).');
  if (code === '23503') throw new ValidationError('No se puede completar: hay datos relacionados que lo impiden.');
  if (code === '23514') throw new ValidationError('Algún dato no cumple las reglas (longitud o valor permitido).');
  if (code === 'PGRST301' || /jwt expired/i.test(error?.message ?? '')) {
    throw new PermissionError('Tu sesión ha caducado. Vuelve a iniciar sesión.');
  }
  if (import.meta.env.DEV) console.warn('[supabase]', code, error?.message);
  throw new Error(fallback);
}

const PLAN_SELECT = `*, mesocycles(*, training_phases(*, training_weeks(*, training_sessions(*, prescribed_exercises(*)))))`;

export class SupabaseService implements DataService {
  readonly mode = 'supabase' as const;
  readonly liveUpdatesLabel = 'Conectado: los avisos llegan en tiempo real (Supabase Realtime).';
  private sb: SupabaseClient;
  private profile: Profile | null = null;
  private listeners = new Set<(e: ChangeEvent) => void>();
  private channel: RealtimeChannel | null = null;

  constructor() {
    this.sb = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  }

  // ---------- público ----------
  async submitContactRequest(input: ContactInput) {
    const { error } = await this.sb.from('contact_requests').insert({
      name: input.name,
      email: input.email,
      phone: input.phone,
      goal: input.goal,
      message: input.message,
    });
    if (error) fail(error);
    return { persisted: true };
  }

  // ---------- sesión ----------
  private async loadProfile(userId: string, email?: string): Promise<Profile | null> {
    const { data, error } = await this.sb.from('profiles').select('id, full_name, role').eq('id', userId).maybeSingle();
    if (error) fail(error);
    if (!data) return null;
    return { id: data.id, fullName: data.full_name, role: data.role, email };
  }
  private async uid(): Promise<string> {
    if (this.profile) return this.profile.id;
    const p = await this.getCurrentProfile();
    if (!p) throw new PermissionError('Tu sesión ha caducado. Vuelve a iniciar sesión.');
    return p.id;
  }
  async getCurrentProfile() {
    const { data } = await this.sb.auth.getSession();
    const user = data.session?.user;
    if (!user) {
      this.profile = null;
      return null;
    }
    if (this.profile?.id !== user.id) this.profile = await this.loadProfile(user.id, user.email);
    this.ensureRealtime();
    return this.profile;
  }
  async signInWithPassword(email: string, password: string) {
    const { data, error } = await this.sb.auth.signInWithPassword({ email, password });
    if (error || !data.user) throw new ValidationError('Correo o contraseña incorrectos.');
    const p = await this.loadProfile(data.user.id, data.user.email);
    if (!p) throw new PermissionError('Tu cuenta no tiene perfil. Contacta con tu entrenador.');
    this.profile = p;
    this.ensureRealtime();
    return p;
  }
  async signInDemo(): Promise<Profile> {
    throw new ValidationError('El acceso demo está deshabilitado cuando Supabase está configurado.');
  }
  async signOut() {
    await this.sb.auth.signOut();
    this.profile = null;
    if (this.channel) await this.sb.removeChannel(this.channel);
    this.channel = null;
  }
  onAuthChange(cb: (p: Profile | null) => void) {
    const { data } = this.sb.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        this.profile = null;
        cb(null);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // Diferido: no llamar a Supabase dentro del callback (recomendación de supabase-js).
        setTimeout(() => void this.getCurrentProfile().then(cb), 0);
      }
    });
    return () => data.subscription.unsubscribe();
  }

  private ensureRealtime() {
    if (this.channel || !this.profile) return;
    const me = this.profile;
    this.channel = this.sb
      .channel(`afteam-${me.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `recipient_id=eq.${me.id}` }, () =>
        this.emit({ source: 'realtime', entity: 'notifications' }),
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wellbeing_reports' }, () =>
        this.emit({ source: 'realtime', entity: 'reports' }),
      )
      .subscribe();
  }
  private emit(e: ChangeEvent) {
    for (const l of this.listeners) l(e);
  }
  subscribe(cb: (e: ChangeEvent) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
  private changed(entity: ChangeEvent['entity']) {
    this.emit({ source: 'local', entity });
  }

  // ---------- clientes ----------
  private mapClient(r: Row, notes = ''): Client {
    return {
      id: str(r.id),
      trainerId: str(r.trainer_id),
      userId: s(r.user_id),
      fullName: str(r.full_name),
      email: str(r.email),
      phone: str(r.phone),
      status: r.status as Client['status'],
      startDate: str(r.start_date),
      adminNotes: notes,
      activePlanId: s(r.active_plan_id),
      isDemo: false,
    };
  }
  async listClients() {
    const { data, error } = await this.sb.from('clients').select('*, client_private_notes(notes)').order('full_name');
    if (error) fail(error);
    return (data ?? []).map((r) => this.mapClient(r, notesOf(r)));
  }
  async getClient(id: string) {
    const isTrainer = (await this.getCurrentProfile())?.role === 'trainer';
    const { data, error } = await this.sb
      .from('clients')
      .select(isTrainer ? '*, client_private_notes(notes)' : '*')
      .eq('id', id)
      .maybeSingle();
    if (error) fail(error);
    return data ? this.mapClient(data as unknown as Row, notesOf(data as unknown as Row)) : null;
  }
  async getMyClient() {
    const uid = await this.uid();
    const { data, error } = await this.sb.from('clients').select('*').eq('user_id', uid).maybeSingle();
    if (error) fail(error);
    return data ? this.mapClient(data) : null;
  }
  async saveClient(input: ClientInput, id?: string) {
    const trainerId = await this.uid();
    const row = {
      full_name: input.fullName.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      status: input.status,
      start_date: input.startDate,
    };
    const q = id
      ? this.sb.from('clients').update(row).eq('id', id).select().single()
      : this.sb.from('clients').insert({ ...row, trainer_id: trainerId }).select().single();
    const { data, error } = await q;
    if (error) fail(error);
    const { error: e2 } = await this.sb
      .from('client_private_notes')
      .upsert({ client_id: data.id, notes: input.adminNotes, updated_at: new Date().toISOString() });
    if (e2) fail(e2);
    this.changed('clients');
    return this.mapClient(data, input.adminNotes);
  }

  async inviteClient(clientId: string) {
    const { data, error } = await this.sb.functions.invoke('invite-client', { body: { clientId } });
    if (error) throw new Error('No se pudo enviar la invitación. ¿Está desplegada la Edge Function invite-client?');
    if (data?.error) throw new ValidationError(String(data.error));
    this.changed('clients');
  }

  // ---------- biblioteca ----------
  private async signMedia(rows: Row[]): Promise<Map<string, string>> {
    const paths = rows.map((m) => s(m.storage_path)).filter((p): p is string => !!p);
    const out = new Map<string, string>();
    if (!paths.length) return out;
    const { data, error } = await this.sb.storage.from(config.mediaBucket).createSignedUrls(paths, 60 * 60);
    if (error) return out;
    for (const d of data ?? []) if (d.path && d.signedUrl) out.set(d.path, d.signedUrl);
    return out;
  }
  private mapMedia(m: Row | null, signed: Map<string, string>): ExerciseMedia | null {
    if (!m) return null;
    const path = s(m.storage_path);
    return {
      id: str(m.id),
      exerciseId: str(m.exercise_id),
      url: path ? (signed.get(path) ?? '') : str(m.public_path),
      storagePath: path,
      mimeType: str(m.mime_type),
      sizeBytes: Number(m.size_bytes ?? 0),
      width: m.width === null ? null : Number(m.width),
      height: m.height === null ? null : Number(m.height),
      framing: normalizeFraming({ fit: m.fit as Framing['fit'], posX: Number(m.pos_x), posY: Number(m.pos_y), scale: Number(m.scale) }),
      persisted: true,
    };
  }
  private mapExercise(r: Row, signed: Map<string, string>): Exercise {
    const media = Array.isArray(r.exercise_media) ? (r.exercise_media[0] as Row | undefined) : (r.exercise_media as Row | null);
    return {
      id: str(r.id),
      ownerId: str(r.owner_id),
      title: str(r.title),
      primaryMuscle: r.primary_muscle as Exercise['primaryMuscle'],
      secondaryMuscles: (r.secondary_muscles as Exercise['secondaryMuscles']) ?? [],
      procedure: str(r.procedure),
      technicalCues: str(r.technical_cues),
      commonMistakes: str(r.common_mistakes),
      equipment: str(r.equipment),
      difficulty: (r.difficulty as Exercise['difficulty']) ?? null,
      movementPattern: str(r.movement_pattern),
      active: Boolean(r.active),
      media: this.mapMedia(media ?? null, signed),
      createdAt: str(r.created_at),
      updatedAt: str(r.updated_at),
      isDemo: false,
    };
  }
  async listExercises() {
    const { data, error } = await this.sb.from('exercise_library').select('*, exercise_media(*)').order('title');
    if (error) fail(error);
    const rows = data ?? [];
    const signed = await this.signMedia(rows.flatMap((r) => (r.exercise_media ? [].concat(r.exercise_media) : [])));
    return rows.map((r) => this.mapExercise(r, signed));
  }
  async getExercise(id: string) {
    const { data, error } = await this.sb.from('exercise_library').select('*, exercise_media(*)').eq('id', id).maybeSingle();
    if (error) fail(error);
    if (!data) return null;
    const signed = await this.signMedia(data.exercise_media ? [].concat(data.exercise_media) : []);
    return this.mapExercise(data, signed);
  }
  async saveExercise(input: ExerciseInput, id?: string) {
    const owner = await this.uid();
    const row = {
      title: input.title.trim(),
      primary_muscle: input.primaryMuscle,
      secondary_muscles: input.secondaryMuscles.filter((m) => m !== input.primaryMuscle),
      procedure: input.procedure,
      technical_cues: input.technicalCues,
      common_mistakes: input.commonMistakes,
      equipment: input.equipment,
      difficulty: input.difficulty,
      movement_pattern: input.movementPattern,
      active: input.active,
    };
    const q = id
      ? this.sb.from('exercise_library').update(row).eq('id', id).select('*, exercise_media(*)').single()
      : this.sb.from('exercise_library').insert({ ...row, owner_id: owner }).select('*, exercise_media(*)').single();
    const { data, error } = await q;
    if (error) fail(error);
    this.changed('exercises');
    return this.mapExercise(data, new Map());
  }
  async deleteExercise(id: string) {
    const { data: media } = await this.sb.from('exercise_media').select('storage_path').eq('exercise_id', id).maybeSingle();
    const { error } = await this.sb.from('exercise_library').delete().eq('id', id);
    if (error) {
      if (error.code === '23503') {
        throw new ValidationError('Este ejercicio está asignado en algún plan. Desactívalo en lugar de borrarlo.');
      }
      fail(error);
    }
    if (media?.storage_path) await this.sb.storage.from(config.mediaBucket).remove([media.storage_path]);
    this.changed('exercises');
  }
  async uploadExerciseMedia(exerciseId: string, file: File, framing: Framing, onProgress?: (p: UploadProgress) => void) {
    const owner = await this.uid();
    const check = validateMediaFile(file);
    if (!check.ok) throw new ValidationError(check.error!);
    const path = storagePathFor(owner, exerciseId, check.ext!);
    await this.uploadWithProgress(path, file, onProgress);
    const local = URL.createObjectURL(file);
    const dims = await readMediaSize(local, file.type);
    URL.revokeObjectURL(local);
    const { data: prev } = await this.sb.from('exercise_media').select('storage_path').eq('exercise_id', exerciseId).maybeSingle();
    const f = normalizeFraming(framing);
    const { data, error } = await this.sb
      .from('exercise_media')
      .upsert(
        {
          exercise_id: exerciseId,
          storage_path: path,
          public_path: null,
          mime_type: file.type,
          size_bytes: file.size,
          width: dims?.width ?? null,
          height: dims?.height ?? null,
          fit: f.fit,
          pos_x: f.posX,
          pos_y: f.posY,
          scale: f.scale,
        },
        { onConflict: 'exercise_id' },
      )
      .select()
      .single();
    if (error) {
      await this.sb.storage.from(config.mediaBucket).remove([path]);
      fail(error);
    }
    // El archivo anterior se elimina solo tras guardar el nuevo (reemplazo seguro).
    if (prev?.storage_path && prev.storage_path !== path) await this.sb.storage.from(config.mediaBucket).remove([prev.storage_path]);
    const signed = await this.signMedia([data]);
    this.changed('exercises');
    return this.mapMedia(data, signed)!;
  }
  /** XHR directo al endpoint de Storage para poder mostrar el progreso real de subida. */
  private async uploadWithProgress(path: string, file: File, onProgress?: (p: UploadProgress) => void) {
    const { data } = await this.sb.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw new PermissionError('Tu sesión ha caducado. Vuelve a iniciar sesión.');
    const url = `${config.supabaseUrl}/storage/v1/object/${config.mediaBucket}/${path.split('/').map(encodeURIComponent).join('/')}`;
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      xhr.setRequestHeader('apikey', config.supabaseAnonKey);
      xhr.setRequestHeader('x-upsert', 'false');
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.upload.onprogress = (e) => onProgress?.({ loaded: e.loaded, total: e.total || file.size });
      xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) return resolve();
        if (xhr.status === 413) return reject(new ValidationError(`El archivo supera el máximo de ${config.maxUploadMb} MB.`));
        if (xhr.status === 401 || xhr.status === 403) return reject(new PermissionError());
        if (xhr.status === 415 || xhr.status === 400) return reject(new ValidationError('El servidor rechazó el tipo de archivo.'));
        reject(new Error('No se pudo subir el archivo.'));
      };
      xhr.send(file);
    });
  }
  async saveMediaFraming(exerciseId: string, framing: Framing) {
    const f = normalizeFraming(framing);
    const { error } = await this.sb
      .from('exercise_media')
      .update({ fit: f.fit, pos_x: f.posX, pos_y: f.posY, scale: f.scale })
      .eq('exercise_id', exerciseId);
    if (error) fail(error);
    this.changed('exercises');
  }
  async removeExerciseMedia(exerciseId: string) {
    const { data } = await this.sb.from('exercise_media').select('storage_path').eq('exercise_id', exerciseId).maybeSingle();
    const { error } = await this.sb.from('exercise_media').delete().eq('exercise_id', exerciseId);
    if (error) fail(error);
    if (data?.storage_path) await this.sb.storage.from(config.mediaBucket).remove([data.storage_path]);
    this.changed('exercises');
  }

  // ---------- planes ----------
  private mapPlan(r: Row): TrainingPlan {
    const sortBy = <T extends Row>(arr: unknown, key = 'sort') => ((arr as T[]) ?? []).slice().sort((a, b) => Number(a[key]) - Number(b[key]));
    const mesocycles: Mesocycle[] = sortBy(r.mesocycles).map((m) => ({
      id: str(m.id),
      planId: str(m.plan_id),
      order: Number(m.sort),
      name: str(m.name),
      objective: s(m.objective),
      phases: sortBy(m.training_phases).map(
        (p): TrainingPhase => ({
          id: str(p.id),
          mesocycleId: str(p.mesocycle_id),
          order: Number(p.sort),
          name: str(p.name),
          objective: s(p.objective),
          weeks: sortBy(p.training_weeks, 'number').map(
            (w): TrainingWeek => ({
              id: str(w.id),
              phaseId: str(w.phase_id),
              number: Number(w.number),
              status: w.status as TrainingWeek['status'],
              scheme: s(w.scheme),
              notes: s(w.notes),
              sourceSheet: s(w.source_sheet),
              sessions: sortBy(w.training_sessions).map(
                (ss): TrainingSession => ({
                  id: str(ss.id),
                  weekId: str(ss.week_id),
                  order: Number(ss.sort),
                  title: str(ss.title),
                  reviewFlags: (ss.review_flags as string[]) ?? [],
                  exercises: sortBy(ss.prescribed_exercises).map(
                    (e): PrescribedExercise => ({
                      id: str(e.id),
                      sessionId: str(e.session_id),
                      order: Number(e.sort),
                      stage: e.stage as PrescribedExercise['stage'],
                      exerciseId: s(e.exercise_id),
                      name: str(e.name),
                      sets: s(e.sets),
                      reps: s(e.reps),
                      load: s(e.load),
                      rirRpe: s(e.rir_rpe),
                      suggestedLoad: s(e.suggested_load),
                      suggestedLoadAlt: s(e.suggested_load_alt),
                      tempo: s(e.tempo),
                      rest: s(e.rest),
                      notes: s(e.notes),
                      raw: (e.raw as PrescribedExercise['raw']) ?? null,
                      reviewFlags: (e.review_flags as string[]) ?? [],
                      removedAt: s(e.removed_at),
                    }),
                  ),
                }),
              ),
            }),
          ),
        }),
      ),
    }));
    return {
      id: str(r.id),
      ownerId: str(r.owner_id),
      clientId: s(r.client_id),
      name: str(r.name),
      description: str(r.description),
      status: r.status as TrainingPlan['status'],
      source: s(r.source),
      templateId: s(r.template_id),
      currentWeekId: s(r.current_week_id),
      mesocycles,
      importNotes: (r.import_notes as string[]) ?? [],
      createdAt: str(r.created_at),
      updatedAt: str(r.updated_at),
      isDemo: false,
    };
  }
  async listPlans() {
    const { data, error } = await this.sb.from('training_plans').select(PLAN_SELECT).order('updated_at', { ascending: false });
    if (error) fail(error);
    return (data ?? []).map((r) => this.mapPlan(r));
  }
  async getPlan(id: string) {
    const { data, error } = await this.sb.from('training_plans').select(PLAN_SELECT).eq('id', id).maybeSingle();
    if (error) fail(error);
    return data ? this.mapPlan(data) : null;
  }
  async savePlanMeta(id: string, patch: { name?: string; description?: string; status?: TrainingPlan['status'] }) {
    const { error } = await this.sb.from('training_plans').update(patch).eq('id', id);
    if (error) fail(error);
    this.changed('plans');
  }

  /**
   * Inserta un árbol de plan completo con ids nuevos. Se usa para duplicar, asignar e importar.
   * Nota: no es una transacción única; si falla a mitad, el plan parcial queda como borrador y puede borrarse.
   */
  private async insertPlanTree(plan: TrainingPlan, opts: { clientId: string | null; name: string; status: TrainingPlan['status']; templateId: string | null; exerciseMap?: (id: string | null, name: string) => string | null }) {
    const owner = await this.uid();
    const nid = () => crypto.randomUUID();
    const ids = new Map<string, string>();
    const map = (old: string) => {
      const n = nid();
      ids.set(old, n);
      return n;
    };
    const planId = nid();
    const { error: e0 } = await this.sb.from('training_plans').insert({
      id: planId,
      owner_id: owner,
      client_id: opts.clientId,
      template_id: opts.templateId,
      name: opts.name,
      description: plan.description,
      status: 'borrador',
      source: plan.source,
      import_notes: plan.importNotes,
    });
    if (e0) fail(e0);
    const mesos: Row[] = [];
    const phases: Row[] = [];
    const weeks: Row[] = [];
    const sessions: Row[] = [];
    const pes: Row[] = [];
    for (const m of plan.mesocycles) {
      const mid = map(m.id);
      mesos.push({ id: mid, plan_id: planId, sort: m.order, name: m.name, objective: m.objective });
      for (const p of m.phases) {
        const pid = map(p.id);
        phases.push({ id: pid, mesocycle_id: mid, sort: p.order, name: p.name, objective: p.objective });
        for (const w of p.weeks) {
          const wid = map(w.id);
          weeks.push({ id: wid, phase_id: pid, number: w.number, status: w.status, scheme: w.scheme, notes: w.notes, source_sheet: w.sourceSheet });
          for (const ss of w.sessions) {
            const sid = map(ss.id);
            sessions.push({ id: sid, week_id: wid, sort: ss.order, title: ss.title, review_flags: ss.reviewFlags });
            for (const e of activeExercises(ss)) {
              pes.push({
                id: map(e.id),
                session_id: sid,
                sort: e.order,
                stage: e.stage,
                exercise_id: opts.exerciseMap ? opts.exerciseMap(e.exerciseId, e.name) : e.exerciseId,
                name: e.name,
                sets: e.sets,
                reps: e.reps,
                load: e.load,
                rir_rpe: e.rirRpe,
                suggested_load: e.suggestedLoad,
                suggested_load_alt: e.suggestedLoadAlt,
                tempo: e.tempo,
                rest: e.rest,
                notes: e.notes,
                raw: e.raw,
                review_flags: e.reviewFlags,
              });
            }
          }
        }
      }
    }
    for (const [table, rows] of [
      ['mesocycles', mesos],
      ['training_phases', phases],
      ['training_weeks', weeks],
      ['training_sessions', sessions],
      ['prescribed_exercises', pes],
    ] as const) {
      for (let i = 0; i < rows.length; i += 500) {
        const { error } = await this.sb.from(table).insert(rows.slice(i, i + 500));
        if (error) fail(error);
      }
    }
    const currentWeek = plan.currentWeekId ? (ids.get(plan.currentWeekId) ?? null) : null;
    const { error: e1 } = await this.sb.from('training_plans').update({ status: opts.status, current_week_id: currentWeek }).eq('id', planId);
    if (e1) fail(e1);
    this.changed('plans');
    return (await this.getPlan(planId))!;
  }
  async duplicatePlan(id: string, name: string) {
    const src = await this.getPlan(id);
    if (!src) throw new PermissionError('Plan no encontrado.');
    return this.insertPlanTree(src, { clientId: null, name, status: 'borrador', templateId: src.id });
  }
  async assignPlan(planId: string, clientId: string) {
    const src = await this.getPlan(planId);
    const client = await this.getClient(clientId);
    if (!src || !client) throw new PermissionError('Plan o cliente no encontrado.');
    await this.sb.from('training_plans').update({ status: 'archivado' }).eq('client_id', clientId).eq('status', 'activo');
    const copy = await this.insertPlanTree(src, {
      clientId,
      name: `${src.name} — ${client.fullName.split(' ')[0]}`,
      status: 'activo',
      templateId: src.id,
    });
    const { error } = await this.sb.from('clients').update({ active_plan_id: copy.id }).eq('id', clientId);
    if (error) fail(error);
    await this.insertChange(copy, { kind: 'asignado', summary: `Nuevo plan asignado: ${copy.name}` });
    return copy;
  }
  /** Importa la biblioteca y el plan de ejemplo (Excel) a la cuenta del entrenador conectado. */
  async importSampleData(): Promise<string> {
    const owner = await this.uid();
    const existing = await this.listExercises();
    const byTitle = new Map(existing.map((e) => [e.title.toLowerCase(), e.id]));
    const demoIdToReal = new Map<string, string>();
    for (const ex of buildDemoExercises(owner)) {
      let id = byTitle.get(ex.title.toLowerCase());
      if (!id) {
        const created = await this.saveExercise(ex);
        id = created.id;
        if (ex.media) {
          const f = ex.media.framing;
          const { error } = await this.sb.from('exercise_media').insert({
            exercise_id: id,
            public_path: ex.media.url,
            mime_type: ex.media.mimeType,
            size_bytes: ex.media.sizeBytes,
            width: ex.media.width,
            height: ex.media.height,
            fit: f.fit,
            pos_x: f.posX,
            pos_y: f.posY,
            scale: f.scale,
          });
          if (error) fail(error);
        }
      }
      demoIdToReal.set(ex.id, id);
    }
    const tpl = excelPlan as unknown as TrainingPlan;
    const plan = await this.insertPlanTree(tpl, {
      clientId: null,
      name: tpl.name,
      status: 'borrador',
      templateId: null,
      exerciseMap: (demoId) => (demoId ? (demoIdToReal.get(demoId) ?? null) : null),
    });
    this.changed('all');
    return plan.id;
  }
  async setCurrentWeek(planId: string, weekId: string) {
    const { error } = await this.sb.from('training_plans').update({ current_week_id: weekId }).eq('id', planId);
    if (error) fail(error);
    this.changed('plans');
  }
  async updateWeek(weekId: string, patch: Partial<Pick<TrainingWeek, 'status' | 'scheme' | 'notes'>>) {
    const { error } = await this.sb.from('training_weeks').update(patch).eq('id', weekId);
    if (error) fail(error);
    this.changed('plans');
  }
  async addSession(weekId: string, title: string) {
    const { count } = await this.sb.from('training_sessions').select('id', { count: 'exact', head: true }).eq('week_id', weekId);
    const n = (count ?? 0) + 1;
    const { error } = await this.sb.from('training_sessions').insert({ week_id: weekId, sort: n, title: title.trim() || `Sesión ${n}` });
    if (error) fail(error);
    this.changed('plans');
  }
  async copyWeekSessions(fromWeekId: string, toWeekId: string) {
    const plan = await this.planWith((p) => !!findWeek(p, fromWeekId));
    const from = findWeek(plan, fromWeekId)!.week;
    const to = findWeek(plan, toWeekId);
    if (!to) throw new ValidationError('Semana no encontrada.');
    if (to.week.sessions.length) throw new ValidationError('La semana de destino ya tiene sesiones.');
    for (const ss of from.sessions) {
      const sid = crypto.randomUUID();
      const { error } = await this.sb
        .from('training_sessions')
        .insert({ id: sid, week_id: toWeekId, sort: ss.order, title: ss.title, review_flags: [`Copiada de la semana ${from.number}.`] });
      if (error) fail(error);
      const rows = activeExercises(ss).map((e) => ({
        session_id: sid,
        sort: e.order,
        stage: e.stage,
        exercise_id: e.exerciseId,
        name: e.name,
        sets: e.sets,
        reps: e.reps,
        load: e.load,
        rir_rpe: e.rirRpe,
        suggested_load: e.suggestedLoad,
        suggested_load_alt: e.suggestedLoadAlt,
        tempo: e.tempo,
        rest: e.rest,
        notes: e.notes,
        raw: e.raw,
        review_flags: e.reviewFlags,
      }));
      if (rows.length) {
        const { error: e2 } = await this.sb.from('prescribed_exercises').insert(rows);
        if (e2) fail(e2);
      }
    }
    this.changed('plans');
  }
  private async planWith(pred: (p: TrainingPlan) => boolean): Promise<TrainingPlan> {
    const plans = await this.listPlans();
    const plan = plans.find(pred);
    if (!plan) throw new PermissionError('Elemento no encontrado.');
    return plan;
  }
  private async insertChange(
    plan: TrainingPlan,
    c: Partial<Omit<PlanChange, 'id' | 'planId' | 'clientId' | 'createdAt'>> & { kind: PlanChange['kind']; summary: string },
  ) {
    const { error } = await this.sb.from('plan_changes').insert({
      plan_id: plan.id,
      client_id: plan.clientId,
      session_id: c.sessionId ?? null,
      prescribed_exercise_id: c.prescribedExerciseId ?? null,
      kind: c.kind,
      summary: c.summary.slice(0, 500),
      before: c.before ?? null,
      after: c.after ?? null,
      related_report_id: c.relatedReportId ?? null,
    });
    if (error) fail(error);
  }
  async updatePrescription(id: string, patch: Partial<PrescriptionParams>, opts?: { reason?: string; relatedReportId?: string | null }) {
    const plan = await this.planWith((p) => !!findPrescription(p, id));
    const { pe, session, week } = findPrescription(plan, id)!;
    const cols: Record<keyof PrescriptionParams, string> = {
      sets: 'sets', reps: 'reps', load: 'load', rirRpe: 'rir_rpe', suggestedLoad: 'suggested_load',
      tempo: 'tempo', rest: 'rest', notes: 'notes', stage: 'stage',
    };
    const row: Row = {};
    const before: Row = {};
    const after: Row = {};
    for (const k of Object.keys(patch) as (keyof PrescriptionParams)[]) {
      if ((pe[k] ?? null) === (patch[k] ?? null)) continue;
      row[cols[k]] = patch[k] ?? null;
      before[k] = pe[k];
      after[k] = patch[k];
    }
    if (!Object.keys(row).length) return;
    const { error } = await this.sb.from('prescribed_exercises').update(row).eq('id', id);
    if (error) fail(error);
    const detail = Object.keys(after).map((k) => (k === 'notes' ? 'notas actualizadas' : `${k} ${before[k] ?? '—'} → ${after[k] ?? '—'}`)).join(', ');
    await this.insertChange(plan, {
      kind: 'editado',
      sessionId: session.id,
      prescribedExerciseId: id,
      summary: `Semana ${week.number} · ${session.title} · ${pe.name}: ${detail}${opts?.reason ? ` — ${opts.reason}` : ''}`,
      before: before as Partial<PrescribedExercise>,
      after: after as Partial<PrescribedExercise>,
      relatedReportId: opts?.relatedReportId ?? null,
    });
    this.changed('plans');
  }
  async addPrescription(sessionId: string, exerciseId: string, params: Partial<PrescriptionParams>) {
    const plan = await this.planWith((p) => !!findSession(p, sessionId));
    const { session, week } = findSession(plan, sessionId)!;
    const ex = await this.getExercise(exerciseId);
    if (!ex) throw new ValidationError('Ejercicio no encontrado en la biblioteca.');
    const { data, error } = await this.sb
      .from('prescribed_exercises')
      .insert({
        session_id: sessionId,
        sort: Math.max(0, ...session.exercises.map((e) => e.order)) + 1,
        stage: params.stage ?? 'accesorio',
        exercise_id: exerciseId,
        name: ex.title,
        sets: params.sets ?? null,
        reps: params.reps ?? null,
        load: params.load ?? null,
        rir_rpe: params.rirRpe ?? null,
        suggested_load: params.suggestedLoad ?? null,
        tempo: params.tempo ?? null,
        rest: params.rest ?? null,
        notes: params.notes ?? null,
      })
      .select('id')
      .single();
    if (error) fail(error);
    await this.insertChange(plan, {
      kind: 'anadido',
      sessionId,
      prescribedExerciseId: data.id,
      summary: `Semana ${week.number} · ${session.title}: añadido ${ex.title} (${stageLabel(params.stage ?? 'accesorio')}).`,
    });
    this.changed('plans');
  }
  async replacePrescriptionExercise(id: string, exerciseId: string, reason?: string, relatedReportId?: string | null) {
    const plan = await this.planWith((p) => !!findPrescription(p, id));
    const { pe, session, week } = findPrescription(plan, id)!;
    const ex = await this.getExercise(exerciseId);
    if (!ex) throw new ValidationError('Ejercicio no encontrado en la biblioteca.');
    const { error: e1 } = await this.sb.from('prescribed_exercises').update({ removed_at: new Date().toISOString() }).eq('id', id);
    if (e1) fail(e1);
    const { data, error } = await this.sb
      .from('prescribed_exercises')
      .insert({
        session_id: session.id, sort: pe.order, stage: pe.stage, exercise_id: exerciseId, name: ex.title,
        sets: pe.sets, reps: pe.reps, load: pe.load, rir_rpe: pe.rirRpe, suggested_load: pe.suggestedLoad,
        tempo: pe.tempo, rest: pe.rest, notes: pe.notes,
      })
      .select('id')
      .single();
    if (error) fail(error);
    await this.insertChange(plan, {
      kind: 'sustituido',
      sessionId: session.id,
      prescribedExerciseId: data.id,
      summary: `Semana ${week.number} · ${session.title}: ${pe.name} → ${ex.title}${reason ? ` — ${reason}` : ''}`,
      before: { exerciseId: pe.exerciseId, name: pe.name },
      after: { exerciseId, name: ex.title },
      relatedReportId: relatedReportId ?? null,
    });
    this.changed('plans');
  }
  async removePrescription(id: string, reason?: string, relatedReportId?: string | null) {
    const plan = await this.planWith((p) => !!findPrescription(p, id));
    const { pe, session, week } = findPrescription(plan, id)!;
    const { error } = await this.sb.from('prescribed_exercises').update({ removed_at: new Date().toISOString() }).eq('id', id);
    if (error) fail(error);
    await this.insertChange(plan, {
      kind: 'retirado',
      sessionId: session.id,
      prescribedExerciseId: id,
      summary: `Semana ${week.number} · ${session.title}: retirado ${pe.name}${reason ? ` — ${reason}` : ''}`,
      relatedReportId: relatedReportId ?? null,
    });
    this.changed('plans');
  }
  async movePrescription(id: string, direction: -1 | 1) {
    const plan = await this.planWith((p) => !!findPrescription(p, id));
    const { session } = findPrescription(plan, id)!;
    const list = activeExercises(session);
    const i = list.findIndex((e) => e.id === id);
    const j = i + direction;
    if (j < 0 || j >= list.length) return;
    let [a, b] = [list[i].order, list[j].order];
    if (a === b) b = a + direction;
    const r1 = await this.sb.from('prescribed_exercises').update({ sort: b }).eq('id', list[i].id);
    const r2 = await this.sb.from('prescribed_exercises').update({ sort: a }).eq('id', list[j].id);
    if (r1.error) fail(r1.error);
    if (r2.error) fail(r2.error);
    this.changed('plans');
  }
  async listPlanChanges(planId: string) {
    const { data, error } = await this.sb.from('plan_changes').select('*').eq('plan_id', planId).order('created_at', { ascending: false });
    if (error) fail(error);
    return (data ?? []).map(
      (r): PlanChange => ({
        id: r.id,
        planId: r.plan_id,
        clientId: r.client_id,
        sessionId: r.session_id,
        prescribedExerciseId: r.prescribed_exercise_id,
        kind: r.kind,
        summary: r.summary,
        before: r.before,
        after: r.after,
        relatedReportId: r.related_report_id,
        createdAt: r.created_at,
      }),
    );
  }

  // ---------- registros ----------
  private mapLog(r: Row): WorkoutLog {
    const ex = (r.workout_exercise_logs as Row[]) ?? [];
    return {
      id: str(r.id),
      clientId: str(r.client_id),
      planId: str(r.plan_id),
      sessionId: str(r.session_id),
      sessionTitle: str(r.session_title),
      weekNumber: r.week_number === null ? null : Number(r.week_number),
      status: r.status as WorkoutLog['status'],
      startedAt: str(r.started_at),
      completedAt: s(r.completed_at),
      notes: str(r.notes),
      isDemo: false,
      exercises: ex.map((e) => ({
        prescribedExerciseId: str(e.prescribed_exercise_id),
        completed: Boolean(e.completed),
        notes: str(e.notes),
        sets: ((e.set_logs as Row[]) ?? [])
          .map((x) => ({ setNumber: Number(x.set_number), weight: str(x.weight), reps: str(x.reps), effort: str(x.effort), done: Boolean(x.done) }))
          .sort((a, b) => a.setNumber - b.setNumber),
      })),
    };
  }
  async listWorkoutLogs(clientId?: string) {
    let q = this.sb.from('workout_logs').select('*, workout_exercise_logs(*, set_logs(*))').order('started_at', { ascending: false });
    if (clientId) q = q.eq('client_id', clientId);
    const { data, error } = await q;
    if (error) fail(error);
    return (data ?? []).map((r) => this.mapLog(r));
  }
  async getOrStartWorkoutLog(sessionId: string) {
    const client = await this.getMyClient();
    if (!client) throw new PermissionError();
    const { data } = await this.sb
      .from('workout_logs')
      .select('*, workout_exercise_logs(*, set_logs(*))')
      .eq('client_id', client.id)
      .eq('session_id', sessionId)
      .eq('status', 'en_progreso')
      .maybeSingle();
    const plan = await this.planWith((p) => !!findSession(p, sessionId));
    const { session, week } = findSession(plan, sessionId)!;
    const base: WorkoutLog = data
      ? this.mapLog(data)
      : {
          id: crypto.randomUUID(),
          clientId: client.id,
          planId: plan.id,
          sessionId,
          sessionTitle: session.title,
          weekNumber: week.number,
          status: 'en_progreso',
          startedAt: new Date().toISOString(),
          completedAt: null,
          notes: '',
          isDemo: false,
          exercises: [],
        };
    // Garantiza una entrada por ejercicio vigente.
    for (const e of activeExercises(session)) {
      if (!base.exercises.some((x) => x.prescribedExerciseId === e.id)) {
        base.exercises.push({
          prescribedExerciseId: e.id,
          completed: false,
          notes: '',
          sets: Array.from({ length: setCount(e) }, (_, k) => ({ setNumber: k + 1, weight: '', reps: '', effort: '', done: false })),
        });
      }
    }
    return base;
  }
  private async writeLog(log: WorkoutLog, complete: boolean) {
    const { error } = await this.sb.from('workout_logs').upsert({
      id: log.id,
      client_id: log.clientId,
      plan_id: log.planId,
      session_id: log.sessionId,
      session_title: log.sessionTitle,
      week_number: log.weekNumber,
      status: 'en_progreso',
      started_at: log.startedAt,
      notes: log.notes,
    });
    if (error) fail(error);
    const { data: exRows, error: e2 } = await this.sb
      .from('workout_exercise_logs')
      .upsert(
        log.exercises.map((e) => ({ workout_log_id: log.id, prescribed_exercise_id: e.prescribedExerciseId, completed: e.completed, notes: e.notes })),
        { onConflict: 'workout_log_id,prescribed_exercise_id' },
      )
      .select('id, prescribed_exercise_id');
    if (e2) fail(e2);
    const idByPe = new Map((exRows ?? []).map((r) => [r.prescribed_exercise_id as string, r.id as string]));
    const sets = log.exercises.flatMap((e) =>
      e.sets.map((x) => ({ exercise_log_id: idByPe.get(e.prescribedExerciseId), set_number: x.setNumber, weight: x.weight, reps: x.reps, effort: x.effort, done: x.done })),
    );
    if (sets.length) {
      const { error: e3 } = await this.sb.from('set_logs').upsert(sets, { onConflict: 'exercise_log_id,set_number' });
      if (e3) fail(e3);
    }
    if (complete) {
      const { error: e4 } = await this.sb.from('workout_logs').update({ status: 'completada', completed_at: new Date().toISOString() }).eq('id', log.id);
      if (e4) fail(e4);
    }
    this.changed('logs');
  }
  async saveWorkoutLog(log: WorkoutLog) {
    await this.writeLog(log, false);
  }
  async completeWorkoutLog(log: WorkoutLog) {
    await this.writeLog(log, true);
  }

  // ---------- reportes ----------
  private mapReport(r: Row): WellbeingReport {
    return {
      id: str(r.id),
      clientId: str(r.client_id),
      type: r.type as WellbeingReport['type'],
      bodyArea: str(r.body_area),
      level: Number(r.level),
      description: str(r.description),
      sessionId: s(r.session_id),
      prescribedExerciseId: s(r.prescribed_exercise_id),
      exerciseName: s(r.exercise_name),
      workoutLogId: s(r.workout_log_id),
      status: r.status as WellbeingReport['status'],
      createdAt: str(r.created_at),
      reviewedAt: s(r.reviewed_at),
      isDemo: false,
      responses: ((r.trainer_responses as Row[]) ?? [])
        .map((x) => ({ id: str(x.id), reportId: str(x.report_id), trainerId: str(x.trainer_id), message: str(x.message), adjustment: str(x.adjustment), createdAt: str(x.created_at) }))
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    };
  }
  async listReports(filter: ReportFilter = {}) {
    let q = this.sb.from('wellbeing_reports').select('*, trainer_responses(*)').order('created_at', { ascending: false });
    if (filter.clientId) q = q.eq('client_id', filter.clientId);
    if (filter.status === 'abiertos') q = q.neq('status', 'respondido');
    else if (filter.status) q = q.eq('status', filter.status);
    if (filter.type) q = q.eq('type', filter.type);
    if (filter.from) q = q.gte('created_at', filter.from);
    if (filter.to) q = q.lte('created_at', `${filter.to}T23:59:59`);
    const { data, error } = await q;
    if (error) fail(error);
    return (data ?? []).map((r) => this.mapReport(r));
  }
  async createReport(input: ReportInput) {
    const client = await this.getMyClient();
    if (!client) throw new PermissionError();
    const { data, error } = await this.sb
      .from('wellbeing_reports')
      .insert({
        client_id: client.id,
        type: input.type,
        body_area: input.bodyArea,
        level: input.level,
        description: input.description.trim(),
        session_id: input.sessionId,
        prescribed_exercise_id: input.prescribedExerciseId,
        exercise_name: input.exerciseName,
        workout_log_id: input.workoutLogId,
      })
      .select('*, trainer_responses(*)')
      .single();
    if (error) fail(error);
    this.changed('reports');
    return this.mapReport(data);
  }
  async markReportReviewed(id: string) {
    const { error } = await this.sb
      .from('wellbeing_reports')
      .update({ status: 'revisado', reviewed_at: new Date().toISOString() })
      .eq('id', id)
      .eq('status', 'pendiente');
    if (error) fail(error);
    this.changed('reports');
  }
  async respondToReport(id: string, message: string, adjustment: string) {
    if (!message.trim()) throw new ValidationError('Escribe una respuesta para el cliente.');
    const { error } = await this.sb.from('trainer_responses').insert({ report_id: id, message: message.trim(), adjustment: adjustment.trim() });
    if (error) fail(error);
    this.changed('reports');
  }

  // ---------- notificaciones ----------
  async listNotifications() {
    const { data, error } = await this.sb.from('notifications').select('*').order('created_at', { ascending: false }).limit(100);
    if (error) fail(error);
    return (data ?? []).map(
      (r): AppNotification => ({
        id: r.id, recipientId: r.recipient_id, type: r.type, title: r.title, body: r.body, link: r.link,
        createdAt: r.created_at, readAt: r.read_at, isDemo: false,
      }),
    );
  }
  async markNotificationRead(id: string) {
    const { error } = await this.sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('id', id).is('read_at', null);
    if (error) fail(error);
    this.changed('notifications');
  }
  async markAllNotificationsRead() {
    const uid = await this.uid();
    const { error } = await this.sb.from('notifications').update({ read_at: new Date().toISOString() }).eq('recipient_id', uid).is('read_at', null);
    if (error) fail(error);
    this.changed('notifications');
  }
  async getActivity(): Promise<ActivityItem[]> {
    const [clients, reports, logs] = await Promise.all([this.listClients(), this.listReports(), this.listWorkoutLogs()]);
    const name = (id: string) => clients.find((c) => c.id === id)?.fullName ?? 'Cliente';
    const items: ActivityItem[] = [
      ...reports.map((r) => ({
        id: `a-${r.id}`, at: r.createdAt, kind: 'reporte' as const, clientId: r.clientId, clientName: name(r.clientId),
        text: `informó ${r.type} (${r.bodyArea || 'sin zona'}, ${r.level}/10)`, link: `/app/entrenador/reportes?id=${r.id}`,
        highlight: r.status === 'pendiente',
      })),
      ...logs.filter((l) => l.status === 'completada').map((l) => ({
        id: `a-${l.id}`, at: l.completedAt ?? l.startedAt, kind: 'sesion' as const, clientId: l.clientId, clientName: name(l.clientId),
        text: `completó Semana ${l.weekNumber ?? '—'} · ${l.sessionTitle}`, link: `/app/entrenador/clientes/${l.clientId}?tab=sesiones`,
        highlight: false,
      })),
    ];
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
  }
}

function notesOf(r: Row): string {
  const n = r.client_private_notes as Row | Row[] | null | undefined;
  if (!n) return '';
  return Array.isArray(n) ? str(n[0]?.notes) : str(n.notes);
}
