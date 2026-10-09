// Tipos de dominio compartidos por el modo demo y el modo conectado (Supabase).

export type Role = 'trainer' | 'client';

export interface Profile {
  id: string;
  fullName: string;
  role: Role;
  email?: string;
}

export type ClientStatus = 'activo' | 'pausado' | 'inactivo';

export interface Client {
  id: string;
  trainerId: string;
  /** Usuario de auth vinculado (null si aún no tiene cuenta). */
  userId: string | null;
  fullName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  startDate: string; // ISO date
  adminNotes: string;
  /** Plan asignado actualmente (copia propia del cliente). */
  activePlanId: string | null;
  isDemo: boolean;
}

// ---------- Biblioteca de ejercicios ----------

export type MuscleGroupId =
  | 'pecho'
  | 'espalda'
  | 'hombros'
  | 'biceps'
  | 'triceps'
  | 'antebrazos'
  | 'core'
  | 'gluteos'
  | 'cuadriceps'
  | 'isquiotibiales'
  | 'gemelos'
  | 'cuerpo_completo'
  | 'trapecio'
  | 'lumbares';

export type Difficulty = 'basico' | 'intermedio' | 'avanzado';

export type FitMode = 'contain' | 'cover';

/** Parámetros de presentación. El archivo original NUNCA se recodifica. */
export interface Framing {
  fit: FitMode;
  /** Posición del punto focal en % (0–100), equivalente a object-position. */
  posX: number;
  posY: number;
  /** Zoom adicional aplicado con transform: scale (1–3). */
  scale: number;
}

export const DEFAULT_FRAMING: Framing = { fit: 'contain', posX: 50, posY: 50, scale: 1 };

export interface ExerciseMedia {
  id: string;
  exerciseId: string;
  /** URL pública o firmada (conectado), ruta pública (demo) o blob: (demo, no persistente). */
  url: string;
  storagePath: string | null;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  framing: Framing;
  /** false = vista previa local que se pierde al recargar (modo demo). */
  persisted: boolean;
}

export interface Exercise {
  id: string;
  ownerId: string;
  title: string;
  primaryMuscle: MuscleGroupId;
  secondaryMuscles: MuscleGroupId[];
  /** Pasos del procedimiento, uno por línea. */
  procedure: string;
  technicalCues: string;
  commonMistakes: string;
  equipment: string;
  difficulty: Difficulty | null;
  movementPattern: string;
  active: boolean;
  media: ExerciseMedia | null;
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

export type ExerciseInput = Omit<Exercise, 'id' | 'ownerId' | 'media' | 'createdAt' | 'updatedAt' | 'isDemo'>;

// ---------- Planificación ----------

export type StageId = 'calentamiento' | 'basico' | 'accesorio' | 'finalizador' | 'otro';

export type WeekStatus = 'pendiente' | 'en_curso' | 'completado';

export type PlanStatus = 'borrador' | 'activo' | 'archivado';

/** Valor de celda tal cual venía del origen (Excel u otro). */
export type RawValue = string | number | null;

export interface PrescribedExercise {
  id: string;
  sessionId: string;
  order: number;
  stage: StageId;
  /** Ejercicio de biblioteca vinculado (puede ser null si es un bloque libre, p. ej. calentamiento). */
  exerciseId: string | null;
  /** Nombre mostrado en la prescripción (se conserva el del Excel). */
  name: string;
  sets: string | null;
  reps: string | null;
  /** Carga PRESCRITA (columna "Peso"). No es lo ejecutado. */
  load: string | null;
  rirRpe: string | null;
  /** Carga sugerida (columna G). */
  suggestedLoad: string | null;
  /** Segunda columna de carga sugerida (H) — significado a confirmar. */
  suggestedLoadAlt: string | null;
  tempo: string | null;
  rest: string | null;
  notes: string | null;
  /** Valores originales para comparar/corregir la importación. */
  raw: Record<string, RawValue> | null;
  /** Avisos para revisión manual. */
  reviewFlags: string[];
  /** Retirado por el entrenador (se conserva para historial). */
  removedAt: string | null;
}

export interface TrainingSession {
  id: string;
  weekId: string;
  order: number;
  title: string;
  exercises: PrescribedExercise[];
  reviewFlags: string[];
}

export interface TrainingWeek {
  id: string;
  phaseId: string;
  number: number;
  status: WeekStatus;
  /** Esquema orientativo de la semana (p. ej. "4x10"). */
  scheme: string | null;
  notes: string | null;
  /** Hoja de origen de las sesiones, si la hubiera. */
  sourceSheet: string | null;
  sessions: TrainingSession[];
}

export interface TrainingPhase {
  id: string;
  mesocycleId: string;
  order: number;
  name: string;
  objective: string | null;
  weeks: TrainingWeek[];
}

export interface Mesocycle {
  id: string;
  planId: string;
  order: number;
  name: string;
  objective: string | null;
  phases: TrainingPhase[];
}

export interface TrainingPlan {
  id: string;
  ownerId: string;
  /** null = plantilla del entrenador; si tiene valor, es la copia asignada a ese cliente. */
  clientId: string | null;
  name: string;
  description: string;
  status: PlanStatus;
  source: string | null;
  /** Plantilla de la que se copió. */
  templateId: string | null;
  currentWeekId: string | null;
  mesocycles: Mesocycle[];
  importNotes: string[];
  createdAt: string;
  updatedAt: string;
  isDemo: boolean;
}

/** Registro de cambios en la prescripción (para historial y "cambios recientes" del cliente). */
export interface PlanChange {
  id: string;
  planId: string;
  clientId: string | null;
  sessionId: string | null;
  prescribedExerciseId: string | null;
  kind: 'editado' | 'sustituido' | 'retirado' | 'anadido' | 'reordenado' | 'asignado';
  summary: string;
  before: Partial<PrescribedExercise> | null;
  after: Partial<PrescribedExercise> | null;
  relatedReportId: string | null;
  createdAt: string;
}

// ---------- Registro de entrenamientos ----------

export interface SetLog {
  setNumber: number;
  weight: string;
  reps: string;
  effort: string; // RIR/RPE real
  done: boolean;
}

export interface ExerciseLog {
  prescribedExerciseId: string;
  completed: boolean;
  notes: string;
  sets: SetLog[];
}

export interface WorkoutLog {
  id: string;
  clientId: string;
  planId: string;
  sessionId: string;
  /** Copia del título por si la sesión cambia después. */
  sessionTitle: string;
  weekNumber: number | null;
  status: 'en_progreso' | 'completada';
  startedAt: string;
  completedAt: string | null;
  notes: string;
  exercises: ExerciseLog[];
  isDemo: boolean;
}

// ---------- Reportes de bienestar ----------

export type ReportType = 'molestia' | 'dolor' | 'fatiga' | 'limitacion' | 'dificultad' | 'otro';
export type ReportStatus = 'pendiente' | 'revisado' | 'respondido';

export interface TrainerResponse {
  id: string;
  reportId: string;
  trainerId: string;
  message: string;
  adjustment: string;
  createdAt: string;
}

export interface WellbeingReport {
  id: string;
  clientId: string;
  type: ReportType;
  bodyArea: string;
  /** 0–10 */
  level: number;
  description: string;
  sessionId: string | null;
  prescribedExerciseId: string | null;
  /** Nombre del ejercicio en el momento del reporte (se conserva aunque cambie la rutina). */
  exerciseName: string | null;
  workoutLogId: string | null;
  status: ReportStatus;
  createdAt: string;
  reviewedAt: string | null;
  responses: TrainerResponse[];
  isDemo: boolean;
}

// ---------- Notificaciones ----------

export type NotificationType = 'reporte' | 'sesion_completada' | 'respuesta' | 'rutina';

export interface AppNotification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  /** Ruta interna de la app (sin datos personales). */
  link: string;
  createdAt: string;
  readAt: string | null;
  isDemo: boolean;
}

export interface ActivityItem {
  id: string;
  at: string;
  kind: 'reporte' | 'sesion' | 'respuesta' | 'rutina';
  clientId: string;
  clientName: string;
  text: string;
  link: string;
  highlight: boolean;
}
