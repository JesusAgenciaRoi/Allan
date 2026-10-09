import type {
  ActivityItem,
  AppNotification,
  Client,
  ClientStatus,
  Exercise,
  ExerciseInput,
  ExerciseMedia,
  Framing,
  PlanChange,
  PlanStatus,
  PrescribedExercise,
  Profile,
  ReportType,
  Role,
  TrainingPlan,
  TrainingWeek,
  WellbeingReport,
  WorkoutLog,
} from '../types/domain';

export type DataMode = 'demo' | 'supabase';

export interface ClientInput {
  fullName: string;
  email: string;
  phone: string;
  status: ClientStatus;
  startDate: string;
  adminNotes: string;
}

export type PrescriptionParams = Pick<
  PrescribedExercise,
  'sets' | 'reps' | 'load' | 'rirRpe' | 'suggestedLoad' | 'tempo' | 'rest' | 'notes' | 'stage'
>;

export interface ReportInput {
  type: ReportType;
  bodyArea: string;
  level: number;
  description: string;
  sessionId: string | null;
  prescribedExerciseId: string | null;
  exerciseName: string | null;
  workoutLogId: string | null;
}

export interface ReportFilter {
  clientId?: string;
  status?: WellbeingReport['status'] | 'abiertos';
  type?: ReportType;
  from?: string;
  to?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
}

/** Evento de cambio para refrescar vistas. `realtime` indica que viene del servidor (Supabase Realtime). */
export interface ChangeEvent {
  source: 'local' | 'realtime';
  entity: 'notifications' | 'reports' | 'logs' | 'plans' | 'clients' | 'exercises' | 'all';
}

export interface ContactInput {
  name: string;
  email: string;
  phone: string;
  goal: string;
  message: string;
}

export interface DataService {
  readonly mode: DataMode;

  // --- Público ---
  /** Formulario de contacto. persisted=false en demo (no se envía a ningún sitio). */
  submitContactRequest(input: ContactInput): Promise<{ persisted: boolean }>;

  // --- Sesión ---
  getCurrentProfile(): Promise<Profile | null>;
  signInWithPassword(email: string, password: string): Promise<Profile>;
  signInDemo(role: Role): Promise<Profile>;
  signOut(): Promise<void>;
  /** Notifica cambios de sesión (login, logout, expiración). */
  onAuthChange(cb: (p: Profile | null) => void): () => void;

  // --- Clientes ---
  listClients(): Promise<Client[]>;
  getClient(id: string): Promise<Client | null>;
  getMyClient(): Promise<Client | null>;
  saveClient(input: ClientInput, id?: string): Promise<Client>;

  // --- Biblioteca ---
  listExercises(): Promise<Exercise[]>;
  getExercise(id: string): Promise<Exercise | null>;
  saveExercise(input: ExerciseInput, id?: string): Promise<Exercise>;
  deleteExercise(id: string): Promise<void>;
  uploadExerciseMedia(
    exerciseId: string,
    file: File,
    framing: Framing,
    onProgress?: (p: UploadProgress) => void,
  ): Promise<ExerciseMedia>;
  saveMediaFraming(exerciseId: string, framing: Framing): Promise<void>;
  removeExerciseMedia(exerciseId: string): Promise<void>;

  // --- Planes ---
  listPlans(): Promise<TrainingPlan[]>;
  getPlan(id: string): Promise<TrainingPlan | null>;
  savePlanMeta(id: string, patch: { name?: string; description?: string; status?: PlanStatus }): Promise<void>;
  duplicatePlan(id: string, name: string): Promise<TrainingPlan>;
  assignPlan(planId: string, clientId: string): Promise<TrainingPlan>;
  setCurrentWeek(planId: string, weekId: string): Promise<void>;
  updateWeek(weekId: string, patch: Partial<Pick<TrainingWeek, 'status' | 'scheme' | 'notes'>>): Promise<void>;
  addSession(weekId: string, title: string): Promise<void>;
  copyWeekSessions(fromWeekId: string, toWeekId: string): Promise<void>;
  updatePrescription(
    id: string,
    patch: Partial<PrescriptionParams>,
    opts?: { reason?: string; relatedReportId?: string | null },
  ): Promise<void>;
  addPrescription(sessionId: string, exerciseId: string, params: Partial<PrescriptionParams>): Promise<void>;
  replacePrescriptionExercise(id: string, exerciseId: string, reason?: string, relatedReportId?: string | null): Promise<void>;
  removePrescription(id: string, reason?: string, relatedReportId?: string | null): Promise<void>;
  movePrescription(id: string, direction: -1 | 1): Promise<void>;
  listPlanChanges(planId: string): Promise<PlanChange[]>;

  // --- Registro de sesiones ---
  listWorkoutLogs(clientId?: string): Promise<WorkoutLog[]>;
  getOrStartWorkoutLog(sessionId: string): Promise<WorkoutLog>;
  saveWorkoutLog(log: WorkoutLog): Promise<void>;
  completeWorkoutLog(log: WorkoutLog): Promise<void>;

  // --- Reportes ---
  listReports(filter?: ReportFilter): Promise<WellbeingReport[]>;
  createReport(input: ReportInput): Promise<WellbeingReport>;
  markReportReviewed(id: string): Promise<void>;
  respondToReport(id: string, message: string, adjustment: string): Promise<void>;

  // --- Notificaciones y actividad ---
  listNotifications(): Promise<AppNotification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  getActivity(): Promise<ActivityItem[]>;

  /** Suscripción a cambios (Realtime en modo conectado; eventos locales en demo). */
  subscribe(cb: (e: ChangeEvent) => void): () => void;
  /** Descripción honesta del mecanismo de actualización (para mostrar en la UI). */
  readonly liveUpdatesLabel: string;

  /** Solo demo: restablece los datos de ejemplo. */
  resetDemo?(): Promise<void>;
  /** Solo conectado: importa la biblioteca y el plan de ejemplo del Excel a la cuenta del entrenador. */
  importSampleData?(): Promise<string>;
  /** Solo conectado: envía invitación por correo (Edge Function invite-client). */
  inviteClient?(clientId: string): Promise<void>;
}

export class PermissionError extends Error {
  constructor(message = 'No tienes permiso para realizar esta acción.') {
    super(message);
    this.name = 'PermissionError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
