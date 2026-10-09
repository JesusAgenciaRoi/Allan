// Implementación DEMO del DataService.
// - Datos ficticios en memoria; se copian a sessionStorage para sobrevivir a una recarga de la MISMA pestaña.
// - No hay persistencia real ni servidor. Los permisos se comprueban aquí solo para imitar las reglas de RLS
//   del modo conectado (no es una medida de seguridad: todo ocurre en el navegador).
// - Los archivos subidos son vistas previas locales (blob:) que se pierden al recargar.

import type {
  ActivityItem,
  AppNotification,
  Client,
  Exercise,
  ExerciseInput,
  ExerciseMedia,
  Framing,
  PlanChange,
  PrescribedExercise,
  Profile,
  Role,
  TrainingPlan,
  TrainingWeek,
  WellbeingReport,
  WorkoutLog,
} from '../types/domain';
import { buildDemoState, DEMO_CLIENT_USER, DEMO_STATE_VERSION, DEMO_TRAINER, type DemoState } from '../data/demo/seed';
import { activeExercises, allWeeks, clonePlan, findPrescription, findSession, findWeek, setCount, uid } from '../lib/plan';
import { normalizeFraming } from '../lib/framing';
import { validateMediaFile } from '../lib/validation';
import { readMediaSize } from '../lib/media';
import { stageLabel } from '../content/muscleGroups';
import {
  PermissionError,
  ValidationError,
  type ChangeEvent,
  type ClientInput,
  type DataService,
  type PrescriptionParams,
  type ReportFilter,
  type ReportInput,
  type UploadProgress,
} from './types';

const STORAGE_KEY = 'afteam-demo-state';
const SESSION_KEY = 'afteam-demo-session';

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v)) as T;
const now = () => new Date().toISOString();

function safeGet(key: string): string | null {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(key: string, value: string | null) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, value);
  } catch {
    /* almacenamiento no disponible: la demo sigue en memoria */
  }
}

export class DemoService implements DataService {
  readonly mode = 'demo' as const;
  readonly liveUpdatesLabel =
    'Modo demo: los avisos aparecen al instante dentro de esta pestaña porque todo ocurre en tu navegador. No es tiempo real entre dispositivos.';

  private state: DemoState;
  private profile: Profile | null;
  private listeners = new Set<(e: ChangeEvent) => void>();
  private authListeners = new Set<(p: Profile | null) => void>();
  /** blob: creados en esta pestaña (no persistentes). */
  private blobUrls = new Map<string, string>();

  constructor(private latencyMs = 120) {
    this.state = this.load();
    const sid = safeGet(SESSION_KEY);
    this.profile = this.state.profiles.find((p) => p.id === sid) ?? null;
  }

  // ---------- infraestructura ----------
  private load(): DemoState {
    const raw = safeGet(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as DemoState;
        if (parsed.version === DEMO_STATE_VERSION) return parsed;
      } catch {
        /* estado corrupto: se regenera */
      }
    }
    return buildDemoState();
  }

  private persist(entity: ChangeEvent['entity']) {
    // Las vistas previas blob: no sobreviven a una recarga: se guardan marcadas como no disponibles.
    const snapshot = clone(this.state);
    for (const ex of snapshot.exercises) {
      if (ex.media && ex.media.url.startsWith('blob:')) ex.media = { ...ex.media, url: '', persisted: false };
    }
    safeSet(STORAGE_KEY, JSON.stringify(snapshot));
    this.emit({ source: 'local', entity });
  }

  private emit(e: ChangeEvent) {
    for (const l of this.listeners) l(e);
  }

  private async wait() {
    if (this.latencyMs > 0) await new Promise((r) => setTimeout(r, this.latencyMs));
  }

  private requireUser(): Profile {
    if (!this.profile) throw new PermissionError('Tu sesión ha caducado. Vuelve a iniciar sesión.');
    return this.profile;
  }
  private requireTrainer(): Profile {
    const p = this.requireUser();
    if (p.role !== 'trainer') throw new PermissionError();
    return p;
  }
  private myClient(): Client | null {
    const p = this.profile;
    if (!p || p.role !== 'client') return null;
    return this.state.clients.find((c) => c.userId === p.id) ?? null;
  }
  private requireClient(): Client {
    const c = this.myClient();
    if (!c) throw new PermissionError();
    return c;
  }
  /** El entrenador accede a sus clientes; el cliente solo a sí mismo. */
  private canSeeClient(clientId: string): boolean {
    const p = this.profile;
    if (!p) return false;
    const c = this.state.clients.find((x) => x.id === clientId);
    if (!c) return false;
    return p.role === 'trainer' ? c.trainerId === p.id : c.userId === p.id;
  }
  private canSeePlan(plan: TrainingPlan): boolean {
    const p = this.profile;
    if (!p) return false;
    if (p.role === 'trainer') return plan.ownerId === p.id;
    const me = this.myClient();
    return !!me && plan.clientId === me.id;
  }
  private planOf(id: string): TrainingPlan {
    const plan = this.state.plans.find((p) => p.id === id);
    if (!plan || !this.canSeePlan(plan)) throw new PermissionError('Plan no encontrado.');
    return plan;
  }
  private planContaining(pred: (plan: TrainingPlan) => boolean): TrainingPlan {
    const plan = this.state.plans.find(pred);
    if (!plan || !this.canSeePlan(plan)) throw new PermissionError('Elemento no encontrado.');
    return plan;
  }
  private notify(n: Omit<AppNotification, 'id' | 'createdAt' | 'readAt' | 'isDemo'>) {
    this.state.notifications.unshift({ ...n, id: uid('ntf'), createdAt: now(), readAt: null, isDemo: true });
  }
  private clientUserId(clientId: string | null): string | null {
    return this.state.clients.find((c) => c.id === clientId)?.userId ?? null;
  }
  private recordChange(plan: TrainingPlan, c: Omit<PlanChange, 'id' | 'planId' | 'clientId' | 'createdAt'>) {
    const change: PlanChange = { ...c, id: uid('chg'), planId: plan.id, clientId: plan.clientId, createdAt: now() };
    this.state.planChanges.unshift(change);
    plan.updatedAt = change.createdAt;
    const userId = this.clientUserId(plan.clientId);
    if (userId) {
      this.notify({
        recipientId: userId,
        type: 'rutina',
        title: 'Tu rutina ha cambiado',
        body: c.summary,
        link: c.sessionId ? `/app/cliente/sesion/${c.sessionId}` : '/app/cliente/rutina',
      });
    }
  }

  // ---------- público ----------
  async submitContactRequest() {
    await this.wait();
    return { persisted: false };
  }

  // ---------- sesión ----------
  async getCurrentProfile() {
    return this.profile;
  }
  async signInWithPassword(): Promise<Profile> {
    throw new ValidationError(
      'El acceso con correo y contraseña requiere configurar Supabase. En modo demo usa los botones de acceso demo.',
    );
  }
  async signInDemo(role: Role) {
    await this.wait();
    this.profile = role === 'trainer' ? DEMO_TRAINER : DEMO_CLIENT_USER;
    safeSet(SESSION_KEY, this.profile.id);
    for (const l of this.authListeners) l(this.profile);
    return this.profile;
  }
  async signOut() {
    this.profile = null;
    safeSet(SESSION_KEY, null);
    for (const l of this.authListeners) l(null);
  }
  onAuthChange(cb: (p: Profile | null) => void) {
    this.authListeners.add(cb);
    return () => this.authListeners.delete(cb);
  }
  async resetDemo() {
    for (const url of this.blobUrls.values()) URL.revokeObjectURL(url);
    this.blobUrls.clear();
    this.state = buildDemoState();
    this.persist('all');
  }

  // ---------- clientes ----------
  async listClients() {
    await this.wait();
    const p = this.requireTrainer();
    return clone(this.state.clients.filter((c) => c.trainerId === p.id));
  }
  async getClient(id: string) {
    await this.wait();
    return this.canSeeClient(id) ? clone(this.state.clients.find((c) => c.id === id) ?? null) : null;
  }
  async getMyClient() {
    await this.wait();
    return clone(this.myClient());
  }
  async saveClient(input: ClientInput, id?: string) {
    await this.wait();
    const p = this.requireTrainer();
    if (!input.fullName.trim()) throw new ValidationError('El nombre es obligatorio.');
    if (id) {
      const c = this.state.clients.find((x) => x.id === id && x.trainerId === p.id);
      if (!c) throw new PermissionError('Cliente no encontrado.');
      Object.assign(c, input);
      this.persist('clients');
      return clone(c);
    }
    const c: Client = { ...input, id: uid('cli'), trainerId: p.id, userId: null, activePlanId: null, isDemo: true };
    this.state.clients.push(c);
    this.persist('clients');
    return clone(c);
  }

  // ---------- biblioteca ----------
  async listExercises() {
    await this.wait();
    this.requireUser();
    return clone(this.state.exercises);
  }
  async getExercise(id: string) {
    await this.wait();
    this.requireUser();
    return clone(this.state.exercises.find((e) => e.id === id) ?? null);
  }
  async saveExercise(input: ExerciseInput, id?: string) {
    await this.wait();
    const p = this.requireTrainer();
    if (!input.title.trim()) throw new ValidationError('El título es obligatorio.');
    const dup = this.state.exercises.find(
      (e) => e.id !== id && e.title.trim().toLowerCase() === input.title.trim().toLowerCase(),
    );
    if (dup) throw new ValidationError('Ya existe un ejercicio con ese título.');
    const secondary = input.secondaryMuscles.filter((m) => m !== input.primaryMuscle);
    if (id) {
      const ex = this.state.exercises.find((e) => e.id === id && e.ownerId === p.id);
      if (!ex) throw new PermissionError('Ejercicio no encontrado.');
      Object.assign(ex, input, { secondaryMuscles: secondary, updatedAt: now() });
      this.persist('exercises');
      return clone(ex);
    }
    const ex: Exercise = {
      ...input,
      secondaryMuscles: secondary,
      id: uid('ex'),
      ownerId: p.id,
      media: null,
      createdAt: now(),
      updatedAt: now(),
      isDemo: true,
    };
    this.state.exercises.unshift(ex);
    this.persist('exercises');
    return clone(ex);
  }
  async deleteExercise(id: string) {
    await this.wait();
    const p = this.requireTrainer();
    const used = this.state.plans.some((plan) =>
      allWeeks(plan).some(({ week }) => week.sessions.some((s) => s.exercises.some((e) => e.exerciseId === id && !e.removedAt))),
    );
    if (used) {
      throw new ValidationError(
        'Este ejercicio está asignado en algún plan. Desactívalo en lugar de borrarlo, o retíralo antes de los planes.',
      );
    }
    const idx = this.state.exercises.findIndex((e) => e.id === id && e.ownerId === p.id);
    if (idx < 0) throw new PermissionError('Ejercicio no encontrado.');
    this.state.exercises.splice(idx, 1);
    this.persist('exercises');
  }
  async uploadExerciseMedia(exerciseId: string, file: File, framing: Framing, onProgress?: (p: UploadProgress) => void) {
    const p = this.requireTrainer();
    const ex = this.state.exercises.find((e) => e.id === exerciseId && e.ownerId === p.id);
    if (!ex) throw new PermissionError('Ejercicio no encontrado.');
    const check = validateMediaFile(file);
    if (!check.ok) throw new ValidationError(check.error!);
    // Lectura local con progreso real (no hay subida a servidor en demo).
    await new Promise<void>((resolve, reject) => {
      const reader = new FileReader();
      reader.onprogress = (e) => onProgress?.({ loaded: e.loaded, total: e.total || file.size });
      reader.onerror = () => reject(new ValidationError('No se pudo leer el archivo.'));
      reader.onload = () => resolve();
      reader.readAsArrayBuffer(file);
    });
    onProgress?.({ loaded: file.size, total: file.size });
    const old = this.blobUrls.get(exerciseId);
    if (old) URL.revokeObjectURL(old);
    const url = URL.createObjectURL(file);
    this.blobUrls.set(exerciseId, url);
    const dims = await readMediaSize(url, file.type);
    const media: ExerciseMedia = {
      id: uid('media'),
      exerciseId,
      url,
      storagePath: null,
      mimeType: file.type,
      sizeBytes: file.size,
      width: dims?.width ?? null,
      height: dims?.height ?? null,
      framing: normalizeFraming(framing),
      persisted: false,
    };
    ex.media = media;
    ex.updatedAt = now();
    this.persist('exercises');
    return clone(media);
  }
  async saveMediaFraming(exerciseId: string, framing: Framing) {
    await this.wait();
    const p = this.requireTrainer();
    const ex = this.state.exercises.find((e) => e.id === exerciseId && e.ownerId === p.id);
    if (!ex?.media) throw new ValidationError('El ejercicio no tiene archivo de demostración.');
    ex.media.framing = normalizeFraming(framing);
    ex.updatedAt = now();
    this.persist('exercises');
  }
  async removeExerciseMedia(exerciseId: string) {
    await this.wait();
    const p = this.requireTrainer();
    const ex = this.state.exercises.find((e) => e.id === exerciseId && e.ownerId === p.id);
    if (!ex) throw new PermissionError('Ejercicio no encontrado.');
    const old = this.blobUrls.get(exerciseId);
    if (old) URL.revokeObjectURL(old);
    this.blobUrls.delete(exerciseId);
    ex.media = null;
    ex.updatedAt = now();
    this.persist('exercises');
  }

  // ---------- planes ----------
  async listPlans() {
    await this.wait();
    this.requireUser();
    return clone(this.state.plans.filter((p) => this.canSeePlan(p)));
  }
  async getPlan(id: string) {
    await this.wait();
    const plan = this.state.plans.find((p) => p.id === id);
    return plan && this.canSeePlan(plan) ? clone(plan) : null;
  }
  async savePlanMeta(id: string, patch: { name?: string; description?: string; status?: TrainingPlan['status'] }) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planOf(id);
    if (patch.name !== undefined && !patch.name.trim()) throw new ValidationError('El nombre del plan es obligatorio.');
    Object.assign(plan, patch, { updatedAt: now() });
    this.persist('plans');
  }
  async duplicatePlan(id: string, name: string) {
    await this.wait();
    const t = this.requireTrainer();
    const src = this.planOf(id);
    const copy = clonePlan(src, { prefix: uid('cp'), clientId: null, name, now: now() });
    copy.ownerId = t.id;
    copy.status = 'borrador';
    this.state.plans.push(copy);
    this.persist('plans');
    return clone(copy);
  }
  async assignPlan(planId: string, clientId: string) {
    await this.wait();
    const t = this.requireTrainer();
    const src = this.planOf(planId);
    const client = this.state.clients.find((c) => c.id === clientId && c.trainerId === t.id);
    if (!client) throw new PermissionError('Cliente no encontrado.');
    const copy = clonePlan(src, {
      prefix: uid('as'),
      clientId,
      name: `${src.name} — ${client.fullName.split(' ')[0]}`,
      now: now(),
    });
    copy.ownerId = t.id;
    copy.status = 'activo';
    // El plan anterior queda archivado (se conserva el historial).
    for (const p of this.state.plans) if (p.clientId === clientId && p.status === 'activo') p.status = 'archivado';
    this.state.plans.push(copy);
    client.activePlanId = copy.id;
    this.recordChange(copy, {
      sessionId: null,
      prescribedExerciseId: null,
      kind: 'asignado',
      summary: `Nuevo plan asignado: ${copy.name}`,
      before: null,
      after: null,
      relatedReportId: null,
    });
    this.persist('plans');
    return clone(copy);
  }
  async setCurrentWeek(planId: string, weekId: string) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planOf(planId);
    if (!findWeek(plan, weekId)) throw new ValidationError('Semana no encontrada.');
    plan.currentWeekId = weekId;
    plan.updatedAt = now();
    this.persist('plans');
  }
  async updateWeek(weekId: string, patch: Partial<Pick<TrainingWeek, 'status' | 'scheme' | 'notes'>>) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planContaining((p) => !!findWeek(p, weekId));
    Object.assign(findWeek(plan, weekId)!.week, patch);
    plan.updatedAt = now();
    this.persist('plans');
  }
  async addSession(weekId: string, title: string) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planContaining((p) => !!findWeek(p, weekId));
    const week = findWeek(plan, weekId)!.week;
    week.sessions.push({
      id: uid('ses'),
      weekId,
      order: week.sessions.length + 1,
      title: title.trim() || `Sesión ${week.sessions.length + 1}`,
      exercises: [],
      reviewFlags: [],
    });
    this.persist('plans');
  }
  async copyWeekSessions(fromWeekId: string, toWeekId: string) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planContaining((p) => !!findWeek(p, fromWeekId) && !!findWeek(p, toWeekId));
    const from = findWeek(plan, fromWeekId)!.week;
    const to = findWeek(plan, toWeekId)!.week;
    if (to.sessions.length) throw new ValidationError('La semana de destino ya tiene sesiones.');
    to.sessions = from.sessions.map((s) => {
      const sid = uid('ses');
      return {
        ...clone(s),
        id: sid,
        weekId: to.id,
        reviewFlags: [`Copiada de la semana ${from.number}.`],
        exercises: activeExercises(s).map((e) => ({ ...clone(e), id: uid('pe'), sessionId: sid })),
      };
    });
    to.notes = to.notes ? `${to.notes} · Sesiones copiadas de la semana ${from.number}` : `Sesiones copiadas de la semana ${from.number}`;
    this.persist('plans');
  }
  async updatePrescription(id: string, patch: Partial<PrescriptionParams>, opts?: { reason?: string; relatedReportId?: string | null }) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planContaining((p) => !!findPrescription(p, id));
    const { pe, session, week } = findPrescription(plan, id)!;
    const before: Partial<PrescribedExercise> = {};
    const after: Partial<PrescribedExercise> = {};
    for (const k of Object.keys(patch) as (keyof PrescriptionParams)[]) {
      const v = patch[k] as string | null;
      if ((pe[k] ?? null) !== (v ?? null)) {
        (before as Record<string, unknown>)[k] = pe[k];
        (after as Record<string, unknown>)[k] = v;
      }
    }
    if (!Object.keys(after).length) return;
    Object.assign(pe, patch);
    this.recordChange(plan, {
      sessionId: session.id,
      prescribedExerciseId: pe.id,
      kind: 'editado',
      summary: `Semana ${week.number} · ${session.title} · ${pe.name}: ${describeDiff(before, after)}${opts?.reason ? ` — ${opts.reason}` : ''}`,
      before,
      after,
      relatedReportId: opts?.relatedReportId ?? null,
    });
    this.persist('plans');
  }
  async addPrescription(sessionId: string, exerciseId: string, params: Partial<PrescriptionParams>) {
    await this.wait();
    this.requireTrainer();
    const ex = this.state.exercises.find((e) => e.id === exerciseId);
    if (!ex) throw new ValidationError('Ejercicio no encontrado en la biblioteca.');
    const plan = this.planContaining((p) => !!findSession(p, sessionId));
    const { session, week } = findSession(plan, sessionId)!;
    const pe: PrescribedExercise = {
      id: uid('pe'),
      sessionId,
      order: Math.max(0, ...session.exercises.map((e) => e.order)) + 1,
      stage: params.stage ?? 'accesorio',
      exerciseId,
      name: ex.title,
      sets: params.sets ?? null,
      reps: params.reps ?? null,
      load: params.load ?? null,
      rirRpe: params.rirRpe ?? null,
      suggestedLoad: params.suggestedLoad ?? null,
      suggestedLoadAlt: null,
      tempo: params.tempo ?? null,
      rest: params.rest ?? null,
      notes: params.notes ?? null,
      raw: null,
      reviewFlags: [],
      removedAt: null,
    };
    session.exercises.push(pe);
    this.recordChange(plan, {
      sessionId,
      prescribedExerciseId: pe.id,
      kind: 'anadido',
      summary: `Semana ${week.number} · ${session.title}: añadido ${ex.title} (${stageLabel(pe.stage)}).`,
      before: null,
      after: pe,
      relatedReportId: null,
    });
    this.persist('plans');
  }
  async replacePrescriptionExercise(id: string, exerciseId: string, reason?: string, relatedReportId?: string | null) {
    await this.wait();
    this.requireTrainer();
    const ex = this.state.exercises.find((e) => e.id === exerciseId);
    if (!ex) throw new ValidationError('Ejercicio no encontrado en la biblioteca.');
    const plan = this.planContaining((p) => !!findPrescription(p, id));
    const { pe, session, week } = findPrescription(plan, id)!;
    // Se conserva la prescripción anterior (retirada) y se crea una nueva con los mismos parámetros.
    const replacement: PrescribedExercise = { ...clone(pe), id: uid('pe'), exerciseId, name: ex.title, raw: null, reviewFlags: [], removedAt: null };
    pe.removedAt = now();
    session.exercises.push(replacement);
    replacement.order = pe.order;
    this.recordChange(plan, {
      sessionId: session.id,
      prescribedExerciseId: replacement.id,
      kind: 'sustituido',
      summary: `Semana ${week.number} · ${session.title}: ${pe.name} → ${ex.title}${reason ? ` — ${reason}` : ''}`,
      before: { exerciseId: pe.exerciseId, name: pe.name },
      after: { exerciseId, name: ex.title },
      relatedReportId: relatedReportId ?? null,
    });
    this.persist('plans');
  }
  async removePrescription(id: string, reason?: string, relatedReportId?: string | null) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planContaining((p) => !!findPrescription(p, id));
    const { pe, session, week } = findPrescription(plan, id)!;
    pe.removedAt = now();
    this.recordChange(plan, {
      sessionId: session.id,
      prescribedExerciseId: pe.id,
      kind: 'retirado',
      summary: `Semana ${week.number} · ${session.title}: retirado ${pe.name}${reason ? ` — ${reason}` : ''}`,
      before: { name: pe.name },
      after: null,
      relatedReportId: relatedReportId ?? null,
    });
    this.persist('plans');
  }
  async movePrescription(id: string, direction: -1 | 1) {
    await this.wait();
    this.requireTrainer();
    const plan = this.planContaining((p) => !!findPrescription(p, id));
    const { session } = findPrescription(plan, id)!;
    const list = activeExercises(session);
    const i = list.findIndex((e) => e.id === id);
    const j = i + direction;
    if (j < 0 || j >= list.length) return;
    const a = list[i];
    const b = list[j];
    [a.order, b.order] = [b.order, a.order];
    if (a.order === b.order) a.order += direction;
    this.persist('plans');
  }
  async listPlanChanges(planId: string) {
    await this.wait();
    this.planOf(planId);
    return clone(this.state.planChanges.filter((c) => c.planId === planId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  // ---------- registros ----------
  async listWorkoutLogs(clientId?: string) {
    await this.wait();
    const p = this.requireUser();
    let logs = this.state.logs;
    if (p.role === 'client') logs = logs.filter((l) => l.clientId === this.myClient()?.id);
    else logs = logs.filter((l) => this.canSeeClient(l.clientId));
    if (clientId) logs = logs.filter((l) => l.clientId === clientId);
    return clone([...logs].sort((a, b) => (b.completedAt ?? b.startedAt).localeCompare(a.completedAt ?? a.startedAt)));
  }
  async getOrStartWorkoutLog(sessionId: string) {
    await this.wait();
    const client = this.requireClient();
    const existing = this.state.logs.find((l) => l.clientId === client.id && l.sessionId === sessionId && l.status === 'en_progreso');
    if (existing) return clone(existing);
    const plan = this.planContaining((pl) => pl.clientId === client.id && !!findSession(pl, sessionId));
    const { session, week } = findSession(plan, sessionId)!;
    const log: WorkoutLog = {
      id: uid('log'),
      clientId: client.id,
      planId: plan.id,
      sessionId,
      sessionTitle: session.title,
      weekNumber: week.number,
      status: 'en_progreso',
      startedAt: now(),
      completedAt: null,
      notes: '',
      isDemo: true,
      exercises: activeExercises(session).map((e) => ({
        prescribedExerciseId: e.id,
        completed: false,
        notes: '',
        sets: Array.from({ length: setCount(e) }, (_, k) => ({ setNumber: k + 1, weight: '', reps: '', effort: '', done: false })),
      })),
    };
    // No se guarda hasta que el cliente registre algo (evita sesiones vacías).
    return log;
  }
  async saveWorkoutLog(log: WorkoutLog) {
    await this.wait();
    const client = this.requireClient();
    if (log.clientId !== client.id) throw new PermissionError();
    const i = this.state.logs.findIndex((l) => l.id === log.id);
    if (i >= 0 && this.state.logs[i].status === 'completada') throw new ValidationError('La sesión ya está finalizada.');
    if (i >= 0) this.state.logs[i] = clone(log);
    else this.state.logs.push(clone(log));
    this.persist('logs');
  }
  async completeWorkoutLog(log: WorkoutLog) {
    await this.wait();
    const client = this.requireClient();
    if (log.clientId !== client.id) throw new PermissionError();
    const done: WorkoutLog = { ...clone(log), status: 'completada', completedAt: now() };
    const i = this.state.logs.findIndex((l) => l.id === log.id);
    if (i >= 0) this.state.logs[i] = done;
    else this.state.logs.push(done);
    const completed = done.exercises.filter((e) => e.completed).length;
    this.notify({
      recipientId: client.trainerId,
      type: 'sesion_completada',
      title: `Sesión completada: ${client.fullName}`,
      body: `Semana ${done.weekNumber ?? '—'} · ${done.sessionTitle} · ${completed}/${done.exercises.length} ejercicios`,
      link: `/app/entrenador/clientes/${client.id}?tab=sesiones`,
    });
    this.persist('logs');
  }

  // ---------- reportes ----------
  async listReports(filter: ReportFilter = {}) {
    await this.wait();
    const p = this.requireUser();
    let list = this.state.reports.filter((r) => (p.role === 'client' ? r.clientId === this.myClient()?.id : this.canSeeClient(r.clientId)));
    if (filter.clientId) list = list.filter((r) => r.clientId === filter.clientId);
    if (filter.status === 'abiertos') list = list.filter((r) => r.status !== 'respondido');
    else if (filter.status) list = list.filter((r) => r.status === filter.status);
    if (filter.type) list = list.filter((r) => r.type === filter.type);
    if (filter.from) list = list.filter((r) => r.createdAt >= filter.from!);
    if (filter.to) list = list.filter((r) => r.createdAt <= `${filter.to}T23:59:59`);
    return clone([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  async createReport(input: ReportInput) {
    await this.wait();
    const client = this.requireClient();
    if (!input.description.trim()) throw new ValidationError('Describe brevemente lo que notas.');
    if (input.level < 0 || input.level > 10) throw new ValidationError('El nivel debe estar entre 0 y 10.');
    const r: WellbeingReport = {
      ...input,
      description: input.description.trim().slice(0, 2000),
      id: uid('rep'),
      clientId: client.id,
      status: 'pendiente',
      createdAt: now(),
      reviewedAt: null,
      responses: [],
      isDemo: true,
    };
    this.state.reports.unshift(r);
    this.notify({
      recipientId: client.trainerId,
      type: 'reporte',
      title: `Nuevo reporte: ${client.fullName}`,
      body: `${input.type} · ${input.bodyArea || 'sin zona'} · nivel ${input.level}/10${input.exerciseName ? ` · ${input.exerciseName}` : ''}`,
      link: `/app/entrenador/reportes?id=${r.id}`,
    });
    this.persist('reports');
    return clone(r);
  }
  async markReportReviewed(id: string) {
    await this.wait();
    this.requireTrainer();
    const r = this.state.reports.find((x) => x.id === id && this.canSeeClient(x.clientId));
    if (!r) throw new PermissionError('Reporte no encontrado.');
    if (r.status === 'pendiente') r.status = 'revisado';
    r.reviewedAt = r.reviewedAt ?? now();
    this.persist('reports');
  }
  async respondToReport(id: string, message: string, adjustment: string) {
    await this.wait();
    const t = this.requireTrainer();
    const r = this.state.reports.find((x) => x.id === id && this.canSeeClient(x.clientId));
    if (!r) throw new PermissionError('Reporte no encontrado.');
    if (!message.trim()) throw new ValidationError('Escribe una respuesta para el cliente.');
    r.responses.push({ id: uid('resp'), reportId: id, trainerId: t.id, message: message.trim(), adjustment: adjustment.trim(), createdAt: now() });
    r.status = 'respondido';
    r.reviewedAt = r.reviewedAt ?? now();
    const userId = this.clientUserId(r.clientId);
    if (userId) {
      this.notify({
        recipientId: userId,
        type: 'respuesta',
        title: 'Tu entrenador respondió a tu reporte',
        body: message.trim().slice(0, 120),
        link: '/app/cliente/reportes',
      });
    }
    this.persist('reports');
  }

  // ---------- notificaciones ----------
  async listNotifications() {
    await this.wait();
    const p = this.requireUser();
    return clone(this.state.notifications.filter((n) => n.recipientId === p.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }
  async markNotificationRead(id: string) {
    const p = this.requireUser();
    const n = this.state.notifications.find((x) => x.id === id && x.recipientId === p.id);
    if (n && !n.readAt) {
      n.readAt = now();
      this.persist('notifications');
    }
  }
  async markAllNotificationsRead() {
    const p = this.requireUser();
    for (const n of this.state.notifications) if (n.recipientId === p.id && !n.readAt) n.readAt = now();
    this.persist('notifications');
  }
  async getActivity(): Promise<ActivityItem[]> {
    await this.wait();
    this.requireTrainer();
    const name = (id: string) => this.state.clients.find((c) => c.id === id)?.fullName ?? 'Cliente';
    const items: ActivityItem[] = [];
    for (const r of this.state.reports.filter((x) => this.canSeeClient(x.clientId))) {
      items.push({
        id: `a-${r.id}`,
        at: r.createdAt,
        kind: 'reporte',
        clientId: r.clientId,
        clientName: name(r.clientId),
        text: `informó ${r.type} (${r.bodyArea || 'sin zona'}, ${r.level}/10)`,
        link: `/app/entrenador/reportes?id=${r.id}`,
        highlight: r.status === 'pendiente',
      });
      for (const resp of r.responses) {
        items.push({
          id: `a-${resp.id}`,
          at: resp.createdAt,
          kind: 'respuesta',
          clientId: r.clientId,
          clientName: name(r.clientId),
          text: 'recibió tu respuesta a un reporte',
          link: `/app/entrenador/reportes?id=${r.id}`,
          highlight: false,
        });
      }
    }
    for (const l of this.state.logs.filter((x) => x.status === 'completada' && this.canSeeClient(x.clientId))) {
      items.push({
        id: `a-${l.id}`,
        at: l.completedAt ?? l.startedAt,
        kind: 'sesion',
        clientId: l.clientId,
        clientName: name(l.clientId),
        text: `completó Semana ${l.weekNumber ?? '—'} · ${l.sessionTitle}`,
        link: `/app/entrenador/clientes/${l.clientId}?tab=sesiones`,
        highlight: false,
      });
    }
    for (const c of this.state.planChanges.filter((x) => x.clientId && this.canSeeClient(x.clientId))) {
      items.push({
        id: `a-${c.id}`,
        at: c.createdAt,
        kind: 'rutina',
        clientId: c.clientId!,
        clientName: name(c.clientId!),
        text: c.summary,
        link: `/app/entrenador/clientes/${c.clientId}?tab=rutina`,
        highlight: false,
      });
    }
    return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, 25);
  }

  subscribe(cb: (e: ChangeEvent) => void) {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

function describeDiff(before: Partial<PrescribedExercise>, after: Partial<PrescribedExercise>): string {
  const labels: Record<string, string> = {
    sets: 'series',
    reps: 'reps',
    load: 'peso',
    rirRpe: 'RIR/RPE',
    suggestedLoad: 'carga sugerida',
    tempo: 'tempo',
    rest: 'descanso',
    notes: 'notas',
    stage: 'etapa',
  };
  return Object.keys(after)
    .map((k) => {
      const b = (before as Record<string, unknown>)[k];
      const a = (after as Record<string, unknown>)[k];
      return k === 'notes' ? 'notas actualizadas' : `${labels[k] ?? k} ${b ?? '—'} → ${a ?? '—'}`;
    })
    .join(', ');
}
