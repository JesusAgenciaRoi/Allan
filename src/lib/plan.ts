import type {
  PrescribedExercise,
  TrainingPhase,
  TrainingPlan,
  TrainingSession,
  TrainingWeek,
  WorkoutLog,
} from '../types/domain';

export function allWeeks(plan: TrainingPlan): { week: TrainingWeek; phase: TrainingPhase }[] {
  return plan.mesocycles.flatMap((m) => m.phases.flatMap((phase) => phase.weeks.map((week) => ({ week, phase }))));
}

export function findWeek(plan: TrainingPlan, weekId: string | null) {
  if (!weekId) return null;
  return allWeeks(plan).find((w) => w.week.id === weekId) ?? null;
}

export function findSession(plan: TrainingPlan, sessionId: string) {
  for (const { week, phase } of allWeeks(plan)) {
    const session = week.sessions.find((s) => s.id === sessionId);
    if (session) return { session, week, phase };
  }
  return null;
}

export function findPrescription(plan: TrainingPlan, peId: string) {
  for (const { week, phase } of allWeeks(plan)) {
    for (const session of week.sessions) {
      const pe = session.exercises.find((e) => e.id === peId);
      if (pe) return { pe, session, week, phase };
    }
  }
  return null;
}

/** Ejercicios vigentes (los retirados se conservan para historial pero no se muestran al cliente). */
export function activeExercises(session: TrainingSession): PrescribedExercise[] {
  return session.exercises.filter((e) => !e.removedAt).sort((a, b) => a.order - b.order);
}

export function currentWeek(plan: TrainingPlan) {
  return findWeek(plan, plan.currentWeekId) ?? allWeeks(plan).find((w) => w.week.status !== 'completado') ?? null;
}

/**
 * "Entrenamiento de hoy": el Excel no asigna sesiones a días concretos, así que se toma
 * la primera sesión de la semana actual que aún no tenga un registro completado.
 */
export function nextSession(plan: TrainingPlan, logs: WorkoutLog[]) {
  const cw = currentWeek(plan);
  if (!cw) return null;
  const done = new Set(logs.filter((l) => l.status === 'completada').map((l) => l.sessionId));
  const session = cw.week.sessions.find((s) => !done.has(s.id)) ?? null;
  return { ...cw, session, completedCount: cw.week.sessions.filter((s) => done.has(s.id)).length };
}

let counter = 0;
export function uid(prefix = 'id'): string {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  counter += 1;
  return `${prefix}-${rnd}${counter.toString(36)}`;
}

/** Copia profunda con ids nuevos (la copia del cliente no modifica la plantilla). */
export function clonePlan(plan: TrainingPlan, opts: { prefix: string; clientId: string | null; name?: string; now: string }): TrainingPlan {
  const idMap = new Map<string, string>();
  const nid = (old: string) => {
    const n = `${opts.prefix}-${old}`;
    idMap.set(old, n);
    return n;
  };
  const copy: TrainingPlan = JSON.parse(JSON.stringify(plan));
  const newPlanId = nid(copy.id);
  copy.id = newPlanId;
  copy.clientId = opts.clientId;
  copy.templateId = plan.id;
  copy.name = opts.name ?? plan.name;
  copy.createdAt = opts.now;
  copy.updatedAt = opts.now;
  for (const m of copy.mesocycles) {
    m.id = nid(m.id);
    m.planId = newPlanId;
    for (const p of m.phases) {
      p.id = nid(p.id);
      p.mesocycleId = m.id;
      for (const w of p.weeks) {
        w.id = nid(w.id);
        w.phaseId = p.id;
        for (const s of w.sessions) {
          s.id = nid(s.id);
          s.weekId = w.id;
          for (const e of s.exercises) {
            e.id = nid(e.id);
            e.sessionId = s.id;
          }
        }
      }
    }
  }
  copy.currentWeekId = plan.currentWeekId ? (idMap.get(plan.currentWeekId) ?? null) : null;
  return copy;
}

export function formatDate(iso: string | null | undefined, withTime = false): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  });
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'ahora';
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d < 30) return `hace ${d} ${d === 1 ? 'día' : 'días'}`;
  return formatDate(iso);
}

/** Número de series a registrar: si "sets" no es numérico (p. ej. "4 VUELTAS"), se usa 1 bloque libre. */
export function setCount(pe: PrescribedExercise): number {
  const n = Number.parseInt(pe.sets ?? '', 10);
  return Number.isFinite(n) && n > 0 && n <= 12 ? n : 1;
}
