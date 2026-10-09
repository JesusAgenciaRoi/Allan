import type { Difficulty, MuscleGroupId, ReportType, StageId } from '../types/domain';

// Grupos musculares configurables. Para añadir uno: amplía MuscleGroupId en types/domain.ts,
// añádelo aquí y (modo conectado) inserta la fila en la tabla public.muscle_groups.
export const MUSCLE_GROUPS: { id: MuscleGroupId; label: string }[] = [
  { id: 'pecho', label: 'Pecho' },
  { id: 'espalda', label: 'Espalda' },
  { id: 'hombros', label: 'Hombros' },
  { id: 'biceps', label: 'Bíceps' },
  { id: 'triceps', label: 'Tríceps' },
  { id: 'antebrazos', label: 'Antebrazos' },
  { id: 'core', label: 'Abdomen / core' },
  { id: 'gluteos', label: 'Glúteos' },
  { id: 'cuadriceps', label: 'Cuádriceps' },
  { id: 'isquiotibiales', label: 'Isquiotibiales' },
  { id: 'gemelos', label: 'Gemelos' },
  { id: 'trapecio', label: 'Trapecio' },
  { id: 'lumbares', label: 'Lumbares' },
  { id: 'cuerpo_completo', label: 'Cuerpo completo' },
];

export const muscleLabel = (id: MuscleGroupId) => MUSCLE_GROUPS.find((m) => m.id === id)?.label ?? id;

export const DIFFICULTIES: { id: Difficulty; label: string }[] = [
  { id: 'basico', label: 'Básico' },
  { id: 'intermedio', label: 'Intermedio' },
  { id: 'avanzado', label: 'Avanzado' },
];

export const difficultyLabel = (d: Difficulty | null) => DIFFICULTIES.find((x) => x.id === d)?.label ?? '—';

export const STAGES: { id: StageId; label: string }[] = [
  { id: 'calentamiento', label: 'Calentamiento' },
  { id: 'basico', label: 'Trabajo básico' },
  { id: 'accesorio', label: 'Trabajo accesorio' },
  { id: 'finalizador', label: 'Finalizador' },
  { id: 'otro', label: 'Otro' },
];

export const stageLabel = (s: StageId) => STAGES.find((x) => x.id === s)?.label ?? s;

export const REPORT_TYPES: { id: ReportType; label: string }[] = [
  { id: 'molestia', label: 'Molestia' },
  { id: 'dolor', label: 'Dolor' },
  { id: 'fatiga', label: 'Fatiga' },
  { id: 'limitacion', label: 'Limitación' },
  { id: 'dificultad', label: 'Dificultad técnica' },
  { id: 'otro', label: 'Otro' },
];

export const reportTypeLabel = (t: ReportType) => REPORT_TYPES.find((x) => x.id === t)?.label ?? t;

export const BODY_AREAS = [
  'Cuello',
  'Hombro izquierdo',
  'Hombro derecho',
  'Codo / brazo',
  'Muñeca / mano',
  'Zona lumbar',
  'Espalda alta',
  'Cadera',
  'Rodilla izquierda',
  'Rodilla derecha',
  'Tobillo / pie',
  'General',
  'Otra',
];
