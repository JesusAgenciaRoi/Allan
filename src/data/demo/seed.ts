// Datos de DEMOSTRACIÓN (ficticios). Nunca se usan en modo conectado.
import excelPlan from '../generated/excel-plan.json';
import type {
  AppNotification,
  Client,
  Exercise,
  PlanChange,
  Profile,
  TrainingPlan,
  WellbeingReport,
  WorkoutLog,
} from '../../types/domain';
import { buildDemoExercises } from './exercises';
import { activeExercises, allWeeks, clonePlan, setCount } from '../../lib/plan';

export const DEMO_TRAINER: Profile = { id: 'demo-trainer', fullName: 'Entrenador AF (demo)', role: 'trainer' };
export const DEMO_CLIENT_USER: Profile = { id: 'demo-client-user', fullName: 'Mateo Ríos (demo)', role: 'client' };

export interface DemoState {
  version: number;
  profiles: Profile[];
  clients: Client[];
  exercises: Exercise[];
  plans: TrainingPlan[];
  planChanges: PlanChange[];
  logs: WorkoutLog[];
  reports: WellbeingReport[];
  notifications: AppNotification[];
}

export const DEMO_STATE_VERSION = 3;

const daysAgo = (d: number, h = 9) => {
  const t = new Date();
  t.setDate(t.getDate() - d);
  t.setHours(h, 15, 0, 0);
  return t.toISOString();
};

export function buildDemoState(): DemoState {
  const template = excelPlan as unknown as TrainingPlan;
  const exercises = buildDemoExercises(DEMO_TRAINER.id);

  const clientPlan = clonePlan(template, { prefix: 'cli1', clientId: 'cli-1', now: daysAgo(30) });
  clientPlan.name = 'Mesociclo Hipertrofia → Fuerza — Mateo';
  clientPlan.status = 'activo';
  clientPlan.description = 'Copia asignada a partir de la plantilla importada del Excel (datos demo).';

  const clients: Client[] = [
    {
      id: 'cli-1',
      trainerId: DEMO_TRAINER.id,
      userId: DEMO_CLIENT_USER.id,
      fullName: 'Mateo Ríos',
      email: 'mateo.demo@example.com',
      phone: '600 000 001',
      status: 'activo',
      startDate: daysAgo(40).slice(0, 10),
      adminNotes: 'Cliente demo. Experiencia previa en fuerza. Objetivo: hipertrofia y luego fuerza.',
      activePlanId: clientPlan.id,
      isDemo: true,
    },
    {
      id: 'cli-2',
      trainerId: DEMO_TRAINER.id,
      userId: null,
      fullName: 'Lucía Fernández',
      email: 'lucia.demo@example.com',
      phone: '600 000 002',
      status: 'activo',
      startDate: daysAgo(12).slice(0, 10),
      adminNotes: 'Cliente demo. Pendiente de asignar plan.',
      activePlanId: null,
      isDemo: true,
    },
    {
      id: 'cli-3',
      trainerId: DEMO_TRAINER.id,
      userId: null,
      fullName: 'Diego Martín',
      email: 'diego.demo@example.com',
      phone: '',
      status: 'pausado',
      startDate: daysAgo(120).slice(0, 10),
      adminNotes: 'Cliente demo. Pausa temporal por viaje.',
      activePlanId: null,
      isDemo: true,
    },
    {
      id: 'cli-4',
      trainerId: DEMO_TRAINER.id,
      userId: null,
      fullName: 'Carla Gómez',
      email: 'carla.demo@example.com',
      phone: '600 000 004',
      status: 'inactivo',
      startDate: daysAgo(300).slice(0, 10),
      adminNotes: 'Cliente demo. Baja.',
      activePlanId: null,
      isDemo: true,
    },
  ];

  // Registros ejecutados de ejemplo para la semana 3 (las semanas 1–3 figuran como completadas en el Excel).
  const weeks = allWeeks(clientPlan);
  const w3 = weeks.find((w) => w.week.number === 3)!.week;
  const w4 = weeks.find((w) => w.week.number === 4)!.week;
  const logs: WorkoutLog[] = w3.sessions.slice(0, 4).map((s, i) => ({
    id: `log-demo-${i + 1}`,
    clientId: 'cli-1',
    planId: clientPlan.id,
    sessionId: s.id,
    sessionTitle: s.title,
    weekNumber: 3,
    status: 'completada',
    startedAt: daysAgo(14 - i * 2, 18),
    completedAt: daysAgo(14 - i * 2, 19),
    notes: i === 1 ? 'Buena sesión, el tempo técnico cuesta.' : '',
    isDemo: true,
    exercises: activeExercises(s)
      .filter((e) => e.stage !== 'calentamiento')
      .map((e) => ({
        prescribedExerciseId: e.id,
        completed: true,
        notes: '',
        sets: Array.from({ length: setCount(e) }, (_, k) => {
          const n = Number(e.load);
          const weight = Number.isFinite(n) && e.load ? String(k >= 2 ? n + 2.5 : n) : '';
          return { setNumber: k + 1, weight, reps: e.reps && /^\d+$/.test(e.reps) ? e.reps : '', effort: '', done: true };
        }),
      })),
  }));

  const militar = w4.sessions[0].exercises.find((e) => e.exerciseId === 'ex-press-militar')!;
  const w3Militar = w3.sessions[0].exercises.find((e) => e.exerciseId === 'ex-press-militar')!;

  const reports: WellbeingReport[] = [
    {
      id: 'rep-demo-1',
      clientId: 'cli-1',
      type: 'molestia',
      bodyArea: 'Hombro derecho',
      level: 4,
      description:
        'En el press militar noto un pinchazo en la parte delantera del hombro al bajar la barra. Desaparece al parar.',
      sessionId: w4.sessions[0].id,
      prescribedExerciseId: militar.id,
      exerciseName: militar.name,
      workoutLogId: null,
      status: 'pendiente',
      createdAt: daysAgo(0, 8),
      reviewedAt: null,
      responses: [],
      isDemo: true,
    },
    {
      id: 'rep-demo-2',
      clientId: 'cli-1',
      type: 'fatiga',
      bodyArea: 'General',
      level: 3,
      description: 'Semana con poco descanso, llegué cansado a la sesión 3.',
      sessionId: w3.sessions[2].id,
      prescribedExerciseId: null,
      exerciseName: null,
      workoutLogId: 'log-demo-3',
      status: 'respondido',
      createdAt: daysAgo(10, 20),
      reviewedAt: daysAgo(9, 10),
      responses: [
        {
          id: 'resp-demo-1',
          reportId: 'rep-demo-2',
          trainerId: DEMO_TRAINER.id,
          message: 'Gracias por avisar. Prioriza dormir bien esta semana; si la fatiga sigue, lo comentamos y ajustamos el volumen.',
          adjustment: 'Sin cambios en la rutina por ahora.',
          createdAt: daysAgo(9, 10),
        },
      ],
      isDemo: true,
    },
  ];

  const planChanges: PlanChange[] = [
    {
      id: 'chg-demo-0',
      planId: clientPlan.id,
      clientId: 'cli-1',
      sessionId: null,
      prescribedExerciseId: null,
      kind: 'asignado',
      summary: 'Plan asignado a partir de la plantilla importada del Excel.',
      before: null,
      after: null,
      relatedReportId: null,
      createdAt: daysAgo(30),
    },
    {
      id: 'chg-demo-1',
      planId: clientPlan.id,
      clientId: 'cli-1',
      sessionId: w3.sessions[0].id,
      prescribedExerciseId: w3Militar.id,
      kind: 'editado',
      summary: 'Semana 3 · Press Militar Estricto: nota técnica añadida.',
      before: { notes: w3Militar.notes },
      after: { notes: 'Glúteos y abdomen apretados, sin arquear la zona lumbar.' },
      relatedReportId: null,
      createdAt: daysAgo(15),
    },
  ];
  w3Militar.notes = 'Glúteos y abdomen apretados, sin arquear la zona lumbar.';

  const notifications: AppNotification[] = [
    {
      id: 'ntf-demo-1',
      recipientId: DEMO_TRAINER.id,
      type: 'reporte',
      title: 'Nueva molestia: Mateo Ríos',
      body: 'Hombro derecho · nivel 4/10 · Press Militar Estricto',
      link: '/app/entrenador/reportes?id=rep-demo-1',
      createdAt: daysAgo(0, 8),
      readAt: null,
      isDemo: true,
    },
    {
      id: 'ntf-demo-2',
      recipientId: DEMO_TRAINER.id,
      type: 'sesion_completada',
      title: 'Sesión completada: Mateo Ríos',
      body: `Semana 3 · ${w3.sessions[3].title}`,
      link: '/app/entrenador/clientes/cli-1?tab=sesiones',
      createdAt: daysAgo(8, 19),
      readAt: daysAgo(8, 21),
      isDemo: true,
    },
    {
      id: 'ntf-demo-3',
      recipientId: DEMO_CLIENT_USER.id,
      type: 'respuesta',
      title: 'Tu entrenador respondió a tu reporte',
      body: 'Fatiga · General',
      link: '/app/cliente/reportes',
      createdAt: daysAgo(9, 10),
      readAt: daysAgo(9, 12),
      isDemo: true,
    },
    {
      id: 'ntf-demo-4',
      recipientId: DEMO_CLIENT_USER.id,
      type: 'rutina',
      title: 'Rutina actualizada',
      body: 'Semana 3 · Press Militar Estricto: nota técnica añadida.',
      link: '/app/cliente/rutina',
      createdAt: daysAgo(15),
      readAt: daysAgo(15),
      isDemo: true,
    },
  ];

  return {
    version: DEMO_STATE_VERSION,
    profiles: [DEMO_TRAINER, DEMO_CLIENT_USER],
    clients,
    exercises,
    plans: [template, clientPlan],
    planChanges,
    logs,
    reports,
    notifications,
  };
}
