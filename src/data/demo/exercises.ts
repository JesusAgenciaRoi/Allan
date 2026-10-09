// Biblioteca de ejercicios de DEMOSTRACIÓN. Textos orientativos y editables: el entrenador debe revisarlos.
// Los GIF son animaciones esquemáticas generadas por scripts/generate-assets.py (sin derechos de terceros).

import type { Difficulty, Exercise, Framing, MuscleGroupId } from '../../types/domain';
import { normalizeKey } from '../../lib/excel/parsePlan';

const GIFS = {
  sentadilla: { file: 'sentadilla-vertical.gif', w: 360, h: 480, size: 34_000 },
  pesoMuerto: { file: 'peso-muerto-vertical.gif', w: 360, h: 480, size: 34_000 },
  banca: { file: 'press-banca-horizontal.gif', w: 480, h: 300, size: 33_000 },
  remo: { file: 'remo-horizontal.gif', w: 480, h: 300, size: 31_000 },
  laterales: { file: 'elevaciones-laterales-vertical.gif', w: 360, h: 480, size: 45_000 },
  triceps: { file: 'extension-triceps-horizontal.gif', w: 480, h: 300, size: 29_000 },
} as const;

type GifKey = keyof typeof GIFS;

interface Seed {
  id: string;
  title: string;
  primary: MuscleGroupId;
  secondary?: MuscleGroupId[];
  steps: string[];
  cues?: string;
  mistakes?: string;
  equipment: string;
  difficulty: Difficulty;
  pattern: string;
  gif?: GifKey;
  framing?: Partial<Framing>;
  /** Nombres con los que aparece en el Excel (para vincular la importación). */
  aliases?: string[];
}

const SEEDS: Seed[] = [
  {
    id: 'ex-sentadilla-high-bar',
    title: 'Sentadilla alta (high bar)',
    primary: 'cuadriceps',
    secondary: ['gluteos', 'core'],
    steps: [
      'Coloca la barra sobre los trapecios y sal del rack con dos pasos cortos.',
      'Pies a la anchura de los hombros, puntas ligeramente abiertas.',
      'Desciende controlando el tempo, rodillas en la línea de los pies y torso firme.',
      'Sube empujando el suelo hasta la extensión completa.',
    ],
    cues: 'Respira y bloquea el abdomen antes de cada repetición.',
    mistakes: 'Rodillas que colapsan hacia dentro; perder la tensión abajo.',
    equipment: 'Barra',
    difficulty: 'intermedio',
    pattern: 'Sentadilla',
    gif: 'sentadilla',
    aliases: ['Sentadilla alta (High Bar)'],
  },
  {
    id: 'ex-sentadilla-tempo',
    title: 'Sentadilla con tempo técnico',
    primary: 'cuadriceps',
    secondary: ['gluteos'],
    steps: [
      'Misma ejecución que la sentadilla con barra.',
      'Respeta el tempo indicado en la prescripción (bajada lenta, pausa, subida).',
      'Prioriza la técnica por encima de la carga.',
    ],
    equipment: 'Barra',
    difficulty: 'intermedio',
    pattern: 'Sentadilla',
    gif: 'sentadilla',
    framing: { fit: 'cover', posY: 40, scale: 1.15 },
    aliases: ['Sentadilla Tempo Tecnico'],
  },
  {
    id: 'ex-sentadilla-zercher',
    title: 'Sentadilla Zercher',
    primary: 'cuadriceps',
    secondary: ['core', 'espalda'],
    steps: [
      'Sujeta la barra en el pliegue de los codos, pegada al cuerpo.',
      'Desciende manteniendo el pecho alto.',
      'Sube sin dejar que la barra se separe del tronco.',
    ],
    equipment: 'Barra',
    difficulty: 'avanzado',
    pattern: 'Sentadilla',
    gif: 'sentadilla',
    aliases: ['Sentadilla Zercher'],
  },
  {
    id: 'ex-sentadilla-hack',
    title: 'Sentadilla hack',
    primary: 'cuadriceps',
    secondary: ['gluteos'],
    steps: [
      'Apoya la espalda en el respaldo y coloca los pies en la plataforma.',
      'Libera los seguros y desciende controlando.',
      'Empuja la plataforma sin bloquear bruscamente las rodillas.',
    ],
    equipment: 'Máquina',
    difficulty: 'basico',
    pattern: 'Sentadilla',
    aliases: ['Sentadilla hack'],
  },
  {
    id: 'ex-press-cerrado',
    title: 'Press de banca agarre cerrado',
    primary: 'triceps',
    secondary: ['pecho', 'hombros'],
    steps: [
      'Túmbate en el banco con los ojos bajo la barra.',
      'Agarre algo más estrecho que los hombros, escápulas juntas.',
      'Baja la barra al pecho con los codos cerca del cuerpo.',
      'Empuja hasta extender los brazos.',
    ],
    equipment: 'Barra',
    difficulty: 'intermedio',
    pattern: 'Empuje horizontal',
    gif: 'banca',
    aliases: ['Press plano cerrado'],
  },
  {
    id: 'ex-press-inclinado-mancuernas',
    title: 'Press inclinado con mancuernas',
    primary: 'pecho',
    secondary: ['hombros', 'triceps'],
    steps: [
      'Banco a 30–45°. Mancuernas a la altura del pecho.',
      'Empuja hacia arriba juntando ligeramente las mancuernas.',
      'Desciende controlando hasta notar el estiramiento.',
    ],
    equipment: 'Mancuernas',
    difficulty: 'basico',
    pattern: 'Empuje inclinado',
    gif: 'banca',
    framing: { fit: 'cover', posX: 35, posY: 50, scale: 1.3 },
    aliases: ['Inclinado Mancuernas'],
  },
  {
    id: 'ex-press-militar',
    title: 'Press militar estricto',
    primary: 'hombros',
    secondary: ['triceps', 'core'],
    steps: [
      'De pie, barra sobre la parte alta del pecho.',
      'Aprieta glúteos y abdomen.',
      'Empuja la barra en línea recta por encima de la cabeza sin impulso de piernas.',
    ],
    equipment: 'Barra',
    difficulty: 'intermedio',
    pattern: 'Empuje vertical',
    aliases: ['Press Militar Estricto'],
  },
  {
    id: 'ex-extension-cuadriceps',
    title: 'Extensión de cuádriceps',
    primary: 'cuadriceps',
    steps: [
      'Ajusta el respaldo para que la rodilla quede alineada con el eje de la máquina.',
      'Extiende las piernas por completo y aprieta arriba.',
      'Baja de forma controlada.',
    ],
    equipment: 'Máquina',
    difficulty: 'basico',
    pattern: 'Aislamiento',
    aliases: ['Extension de cuadriceps'],
  },
  {
    id: 'ex-peso-muerto-rigidas',
    title: 'Peso muerto piernas rígidas',
    primary: 'isquiotibiales',
    secondary: ['gluteos', 'lumbares'],
    steps: [
      'De pie con la barra, rodillas casi extendidas.',
      'Lleva la cadera atrás manteniendo la espalda neutra.',
      'Baja hasta notar tensión en los isquiotibiales y vuelve arriba.',
    ],
    equipment: 'Barra',
    difficulty: 'intermedio',
    pattern: 'Bisagra de cadera',
    gif: 'pesoMuerto',
    aliases: ['Peso muerto Piernas rigidas'],
  },
  {
    id: 'ex-peso-muerto-deficit',
    title: 'Peso muerto en déficit',
    primary: 'espalda',
    secondary: ['isquiotibiales', 'gluteos'],
    steps: [
      'Súbete a una plataforma baja; barra sobre la mitad del pie.',
      'Agarra la barra y tensa la espalda antes de despegar.',
      'Empuja el suelo y extiende cadera y rodillas a la vez.',
    ],
    equipment: 'Barra',
    difficulty: 'avanzado',
    pattern: 'Bisagra de cadera',
    gif: 'pesoMuerto',
    framing: { fit: 'cover', posY: 70, scale: 1.2 },
    aliases: ['Peso muerto Deficit'],
  },
  {
    id: 'ex-rumano-mancuernas',
    title: 'Peso muerto rumano con mancuernas',
    primary: 'isquiotibiales',
    secondary: ['gluteos'],
    steps: [
      'Mancuernas delante de los muslos.',
      'Desliza las mancuernas por las piernas llevando la cadera atrás.',
      'Vuelve a la posición inicial apretando glúteos.',
    ],
    equipment: 'Mancuernas',
    difficulty: 'basico',
    pattern: 'Bisagra de cadera',
    gif: 'pesoMuerto',
    aliases: ['Rumano mancuernas'],
  },
  {
    id: 'ex-fondos',
    title: 'Fondos lastrados o en máquina',
    primary: 'triceps',
    secondary: ['pecho', 'hombros'],
    steps: [
      'Sujétate en las paralelas con los brazos extendidos.',
      'Desciende flexionando los codos hasta una profundidad cómoda.',
      'Empuja hasta extender de nuevo.',
    ],
    equipment: 'Paralelas / máquina',
    difficulty: 'intermedio',
    pattern: 'Empuje vertical',
    aliases: ['Fondos lastrados o en maquina'],
  },
  {
    id: 'ex-elevaciones-laterales',
    title: 'Elevaciones laterales',
    primary: 'hombros',
    steps: [
      'De pie, mancuernas a los lados.',
      'Eleva los brazos lateralmente hasta la altura de los hombros.',
      'Baja lentamente sin balancear el tronco.',
    ],
    equipment: 'Mancuernas',
    difficulty: 'basico',
    pattern: 'Aislamiento',
    gif: 'laterales',
    aliases: ['Vuelos laterales'],
  },
  {
    id: 'ex-press-frances-w',
    title: 'Press francés con barra W de pie',
    primary: 'triceps',
    steps: [
      'De pie, barra W por encima de la cabeza.',
      'Flexiona los codos llevando la barra detrás de la cabeza.',
      'Extiende sin abrir los codos.',
    ],
    equipment: 'Barra W',
    difficulty: 'intermedio',
    pattern: 'Aislamiento',
    gif: 'triceps',
    aliases: ['Frances con W parado'],
  },
  {
    id: 'ex-extension-triceps-polea',
    title: 'Extensión de tríceps',
    primary: 'triceps',
    steps: [
      'Codos pegados al cuerpo.',
      'Extiende los brazos por completo.',
      'Vuelve de forma controlada sin mover los codos.',
    ],
    equipment: 'Polea',
    difficulty: 'basico',
    pattern: 'Aislamiento',
    gif: 'triceps',
    framing: { fit: 'cover', posX: 50, posY: 30, scale: 1.4 },
    aliases: ['Extrension de Triceps', 'Extension de Triceps'],
  },
  {
    id: 'ex-remo-pendlay',
    title: 'Remo Pendlay',
    primary: 'espalda',
    secondary: ['biceps', 'lumbares'],
    steps: [
      'Torso casi paralelo al suelo, barra apoyada en el suelo.',
      'Tira de la barra explosivamente hacia el abdomen.',
      'Devuelve la barra al suelo en cada repetición.',
    ],
    equipment: 'Barra',
    difficulty: 'avanzado',
    pattern: 'Tracción horizontal',
    gif: 'remo',
    aliases: ['Remo Pendlay'],
  },
  {
    id: 'ex-remo-seal',
    title: 'Remo Seal (apoyado) + barra W',
    primary: 'espalda',
    secondary: ['biceps'],
    steps: [
      'Túmbate boca abajo en un banco alto.',
      'Tira de las mancuernas o de la barra W hacia el banco.',
      'Baja controlando sin despegar el pecho.',
    ],
    equipment: 'Banco / mancuernas / barra W',
    difficulty: 'intermedio',
    pattern: 'Tracción horizontal',
    gif: 'remo',
    framing: { fit: 'contain', posX: 50, posY: 50, scale: 1 },
    aliases: ['Remo Seal (APOYADO)+ Barra W'],
  },
  {
    id: 'ex-jalon-pecho',
    title: 'Jalón al pecho amplio + alternado',
    primary: 'espalda',
    secondary: ['biceps'],
    steps: [
      'Agarre amplio, muslos bloqueados bajo el soporte.',
      'Lleva la barra a la parte alta del pecho bajando los hombros.',
      'Alterna con la variante unilateral según indique el entrenador.',
    ],
    equipment: 'Polea',
    difficulty: 'basico',
    pattern: 'Tracción vertical',
    aliases: ['Jalon al pecho amplio+ Alternado'],
  },
  {
    id: 'ex-dominadas',
    title: 'Dominadas',
    primary: 'espalda',
    secondary: ['biceps', 'core'],
    steps: [
      'Cuélgate de la barra con agarre prono.',
      'Tira hasta que la barbilla supere la barra.',
      'Baja hasta la extensión completa.',
    ],
    equipment: 'Barra de dominadas',
    difficulty: 'intermedio',
    pattern: 'Tracción vertical',
    aliases: ['Dominadas'],
  },
  {
    id: 'ex-hip-thrust',
    title: 'Hip thrust con pausa',
    primary: 'gluteos',
    secondary: ['isquiotibiales'],
    steps: [
      'Espalda alta apoyada en un banco, barra sobre la cadera.',
      'Eleva la cadera hasta alinear tronco y muslos.',
      'Mantén la pausa arriba y baja controlando.',
    ],
    equipment: 'Barra',
    difficulty: 'basico',
    pattern: 'Extensión de cadera',
    aliases: ['Hip Truhst PAUSA', 'Hip Thrust PAUSA'],
  },
  {
    id: 'ex-curl-femoral-sentado',
    title: 'Curl femoral sentado',
    primary: 'isquiotibiales',
    steps: [
      'Ajusta la máquina con la rodilla alineada al eje.',
      'Flexiona las rodillas llevando el rodillo hacia abajo.',
      'Vuelve lentamente.',
    ],
    equipment: 'Máquina',
    difficulty: 'basico',
    pattern: 'Aislamiento',
    aliases: ['Flexora Sentado'],
  },
  {
    id: 'ex-mancuerna-circo',
    title: 'Mancuerna de circo',
    primary: 'hombros',
    secondary: ['core', 'cuerpo_completo'],
    steps: [
      'Lleva la mancuerna al hombro con una sola mano.',
      'Usa un leve impulso de piernas para subirla por encima de la cabeza.',
      'Estabiliza arriba y baja controlando.',
    ],
    equipment: 'Mancuerna de circo',
    difficulty: 'avanzado',
    pattern: 'Empuje vertical',
    aliases: ['Mancuerna de circo'],
  },
  {
    id: 'ex-encogimientos-hexagonal',
    title: 'Encogimientos con barra hexagonal',
    primary: 'trapecio',
    secondary: ['antebrazos'],
    steps: [
      'De pie dentro de la barra hexagonal.',
      'Eleva los hombros hacia las orejas sin flexionar los codos.',
      'Mantén un instante y baja.',
    ],
    equipment: 'Barra hexagonal',
    difficulty: 'basico',
    pattern: 'Aislamiento',
    aliases: ['Trapecios Hexagonal'],
  },
  {
    id: 'ex-saltos-cajon',
    title: 'Saltos al cajón + EMOM',
    primary: 'cuerpo_completo',
    secondary: ['cuadriceps', 'gluteos'],
    steps: [
      'Salta al cajón aterrizando suave con ambos pies.',
      'Baja caminando, no saltando.',
      'Completa el EMOM indicado en la prescripción.',
    ],
    equipment: 'Cajón',
    difficulty: 'intermedio',
    pattern: 'Pliometría',
    aliases: ['Saltos al cajon+ EMOM 5'],
  },
  {
    id: 'ex-curl-biceps-barra',
    title: 'Curl de bíceps con barra',
    primary: 'biceps',
    secondary: ['antebrazos'],
    steps: ['Codos pegados al tronco.', 'Flexiona hasta arriba sin balanceo.', 'Baja controlando.'],
    equipment: 'Barra',
    difficulty: 'basico',
    pattern: 'Aislamiento',
  },
  {
    id: 'ex-gemelos-pie',
    title: 'Elevación de gemelos de pie',
    primary: 'gemelos',
    steps: ['Puntas sobre un escalón.', 'Sube de puntillas al máximo.', 'Baja hasta estirar el gemelo.'],
    equipment: 'Máquina / escalón',
    difficulty: 'basico',
    pattern: 'Aislamiento',
  },
  {
    id: 'ex-plancha',
    title: 'Plancha frontal',
    primary: 'core',
    steps: ['Antebrazos en el suelo bajo los hombros.', 'Cuerpo alineado, glúteos y abdomen activos.', 'Mantén el tiempo indicado.'],
    equipment: 'Peso corporal',
    difficulty: 'basico',
    pattern: 'Antiextensión',
  },
];

const DEMO_DATE = '2026-09-01T10:00:00.000Z';

export function buildDemoExercises(ownerId: string): Exercise[] {
  return SEEDS.map((s) => {
    const gif = s.gif ? GIFS[s.gif] : null;
    return {
      id: s.id,
      ownerId,
      title: s.title,
      primaryMuscle: s.primary,
      secondaryMuscles: s.secondary ?? [],
      procedure: s.steps.join('\n'),
      technicalCues: s.cues ?? '',
      commonMistakes: s.mistakes ?? '',
      equipment: s.equipment,
      difficulty: s.difficulty,
      movementPattern: s.pattern,
      active: true,
      media: gif
        ? {
            id: `media-${s.id}`,
            exerciseId: s.id,
            url: `/media/exercises/${gif.file}`,
            storagePath: null,
            mimeType: 'image/gif',
            sizeBytes: gif.size,
            width: gif.w,
            height: gif.h,
            framing: { fit: 'contain', posX: 50, posY: 50, scale: 1, ...s.framing },
            persisted: true,
          }
        : null,
      createdAt: DEMO_DATE,
      updatedAt: DEMO_DATE,
      isDemo: true,
    };
  });
}

const ALIAS_INDEX = new Map<string, { id: string; title: string }>();
for (const s of SEEDS) {
  for (const name of [s.title, ...(s.aliases ?? [])]) ALIAS_INDEX.set(normalizeKey(name), { id: s.id, title: s.title });
}

/** Vincula un nombre del Excel con un ejercicio de la biblioteca demo. */
export function resolveDemoExercise(name: string): { id: string; title: string } | null {
  return ALIAS_INDEX.get(normalizeKey(name)) ?? null;
}
