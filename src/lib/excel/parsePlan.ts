// Conversión del Excel de planificación (formato AF Team) a un plan normalizado.
// Es una función pura que trabaja sobre una "rejilla" de celdas: el script scripts/import-excel.ts
// lee el .xlsx y llama a esta función. Así la lógica se puede probar sin el archivo.

import type {
  Mesocycle,
  PrescribedExercise,
  RawValue,
  StageId,
  TrainingPhase,
  TrainingPlan,
  TrainingSession,
  TrainingWeek,
  WeekStatus,
} from '../../types/domain';

export type GridCell =
  | string
  | number
  | null
  | { excelTime: string; h: number; m: number; s: number }
  | { formula: string; result: RawValue };

export interface GridSheet {
  name: string;
  /** Celdas por coordenada ("A1", "B2"...). Solo celdas con valor. */
  cells: Record<string, GridCell>;
  /** Rangos combinados ("A2:A9"). */
  merges: string[];
}

export interface ParseOptions {
  planId?: string;
  ownerId?: string;
  planName?: string;
  sourceFile?: string;
  /** Devuelve el id de la biblioteca para un nombre del Excel, o null. */
  resolveExercise?: (name: string) => { id: string; title: string } | null;
  now?: string;
}

const COLS = 'ABCDEFGHIJKL'.split('');

function colIndex(col: string): number {
  return COLS.indexOf(col);
}

function splitRef(ref: string): { col: string; row: number } {
  const m = /^([A-Z]+)(\d+)$/.exec(ref);
  if (!m) throw new Error(`Referencia inválida: ${ref}`);
  return { col: m[1], row: Number(m[2]) };
}

interface MergeRange {
  c1: number;
  r1: number;
  c2: number;
  r2: number;
  topLeft: string;
}

function parseMerges(merges: string[]): MergeRange[] {
  return merges.map((range) => {
    const [a, b] = range.split(':');
    const s = splitRef(a);
    const e = splitRef(b ?? a);
    return { c1: colIndex(s.col), r1: s.row, c2: colIndex(e.col), r2: e.row, topLeft: a };
  });
}

class SheetReader {
  private merges: MergeRange[];
  constructor(private sheet: GridSheet) {
    this.merges = parseMerges(sheet.merges);
  }
  get name() {
    return this.sheet.name;
  }
  /** Valor literal de la celda (sin propagar combinaciones). */
  raw(col: string, row: number): GridCell {
    return this.sheet.cells[`${col}${row}`] ?? null;
  }
  /** Valor teniendo en cuenta celdas combinadas (devuelve el de la esquina superior izquierda). */
  value(col: string, row: number): GridCell {
    const direct = this.raw(col, row);
    if (direct !== null) return direct;
    const m = this.mergeAt(col, row);
    return m ? (this.sheet.cells[m.topLeft] ?? null) : null;
  }
  mergeAt(col: string, row: number): MergeRange | null {
    const c = colIndex(col);
    return this.merges.find((m) => c >= m.c1 && c <= m.c2 && row >= m.r1 && row <= m.r2) ?? null;
  }
  maxRow(): number {
    let max = 0;
    for (const ref of Object.keys(this.sheet.cells)) max = Math.max(max, splitRef(ref).row);
    for (const m of this.merges) max = Math.max(max, m.r2);
    return max;
  }
}

/** Convierte un valor de celda en texto limpio, o null si está vacío (NUNCA 0 por defecto). */
export function cellText(v: GridCell): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return formatNumber(v);
  if (typeof v === 'string') {
    const t = v.replace(/\s+/g, ' ').trim();
    return t === '' ? null : t;
  }
  if ('excelTime' in v) return v.excelTime;
  if ('formula' in v) return v.result === null ? null : cellText(v.result);
  return null;
}

function rawOf(v: GridCell): RawValue {
  if (v === null || typeof v === 'string' || typeof v === 'number') return v;
  if ('excelTime' in v) return v.excelTime;
  return `=${v.formula}`;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : String(Math.round(n * 100) / 100);
}

/** El Excel guardó tempos tipo "1-2-1" como horas (1:02:01). Los recuperamos. */
export function tempoFromCell(v: GridCell): { tempo: string | null; flag: string | null } {
  if (v && typeof v === 'object' && 'excelTime' in v) {
    const tempo = `${v.h}-${v.m}-${v.s}`;
    return {
      tempo,
      flag: `Tempo leído como hora de Excel (${v.excelTime}) y convertido a ${tempo}. Confirmar.`,
    };
  }
  return { tempo: cellText(v), flag: null };
}

const STAGE_MAP: Record<string, StageId> = {
  calentamiento: 'calentamiento',
  'trabajo basico': 'basico',
  'trabajo básico': 'basico',
  'trabajo accesorio': 'accesorio',
  finalizador: 'finalizador',
};

export function normalizeKey(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function stageOf(label: string | null): StageId {
  if (!label) return 'otro';
  return STAGE_MAP[normalizeKey(label)] ?? 'otro';
}

const SCHEME_RE = /^(\d+)\s*[xX]\s*(\d+)$/;

function weekStatus(s: string | null): WeekStatus {
  const k = s ? normalizeKey(s) : '';
  if (k.startsWith('complet')) return 'completado';
  if (k.includes('curso')) return 'en_curso';
  return 'pendiente';
}

/** Hoja "S1S2" → [1,2]; "s3" → [3]. */
export function weeksFromSheetName(name: string): number[] {
  const nums = [...name.matchAll(/s\s*(\d+)/gi)].map((m) => Number(m[1]));
  return nums;
}

function isNumericLike(s: string | null): boolean {
  return s !== null && /^\d+(\.\d+)?$/.test(s);
}

function loadFlags(label: string, value: string | null): string[] {
  if (!value) return [];
  const flags: string[] = [];
  if (/kev/i.test(value)) {
    flags.push(`${label}: contiene una referencia a una persona ("kev"); podría ser la carga individual de un atleta.`);
  }
  if (/[/*]/.test(value) || /\d\s*[-x]\s*\d/i.test(value)) {
    flags.push(`${label} con varios valores ("${value}"): conservado tal cual, sin interpretar.`);
  } else if (!isNumericLike(value) && !/^\d+(\.\d+)?\s*kg$/i.test(value)) {
    flags.push(`${label} con texto ("${value}"): conservado tal cual.`);
  }
  return flags;
}

export function parsePlanWorkbook(sheets: GridSheet[], opts: ParseOptions = {}): TrainingPlan {
  const now = opts.now ?? new Date().toISOString();
  const planId = opts.planId ?? 'tpl-excel';
  const importNotes: string[] = [];
  const meso = sheets.find((s) => normalizeKey(s.name) === 'mesociclo');
  if (!meso) throw new Error('No se encontró la hoja MESOCICLO');

  const mesoId = `${planId}-m1`;
  const phases = parseMesocycleSheet(new SheetReader(meso), mesoId, importNotes);

  const weeksByNumber = new Map<number, TrainingWeek>();
  for (const p of phases) for (const w of p.weeks) weeksByNumber.set(w.number, w);

  for (const sheet of sheets) {
    if (sheet === meso) continue;
    const weekNums = weeksFromSheetName(sheet.name);
    if (weekNums.length === 0) {
      importNotes.push(`Hoja "${sheet.name}" ignorada: no se pudo deducir a qué semana(s) corresponde.`);
      continue;
    }
    if (weekNums.length > 1) {
      importNotes.push(
        `La hoja "${sheet.name}" se aplica a las semanas ${weekNums.join(' y ')} (deducido del nombre de la hoja). Ambas semanas reciben la misma prescripción.`,
      );
    }
    for (const n of weekNums) {
      const week = weeksByNumber.get(n);
      if (!week) {
        importNotes.push(`La hoja "${sheet.name}" menciona la semana ${n}, que no existe en MESOCICLO.`);
        continue;
      }
      week.sourceSheet = sheet.name;
      week.sessions = parseSessionSheet(new SheetReader(sheet), week.id, opts.resolveExercise);
    }
  }

  const missing = [...weeksByNumber.values()].filter((w) => w.sessions.length === 0).map((w) => w.number);
  if (missing.length) {
    importNotes.push(
      `Semanas sin sesiones definidas en el Excel: ${compressRanges(missing)}. No se han inventado; el entrenador debe completarlas.`,
    );
  }

  const mesocycle: Mesocycle = {
    id: mesoId,
    planId,
    order: 1,
    name: 'Mesociclo Hipertrofia → Fuerza',
    objective: null,
    phases,
  };
  importNotes.push(
    'El Excel no indica un objetivo global del mesociclo; solo objetivos por fase (columna "Objetivo del Meso").',
  );

  const firstPending = [...weeksByNumber.values()]
    .sort((a, b) => a.number - b.number)
    .find((w) => w.status !== 'completado');

  return {
    id: planId,
    ownerId: opts.ownerId ?? 'demo-trainer',
    clientId: null,
    name: opts.planName ?? 'Plan importado del Excel',
    description:
      'Planificación importada del Excel de ejemplo. Datos de demostración: revisa y edita antes de asignarla.',
    status: 'borrador',
    source: opts.sourceFile ?? null,
    templateId: null,
    currentWeekId: firstPending?.id ?? null,
    mesocycles: [mesocycle],
    importNotes,
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  };
}

function compressRanges(nums: number[]): string {
  const sorted = [...nums].sort((a, b) => a - b);
  const parts: string[] = [];
  let start = sorted[0];
  let prev = sorted[0];
  for (let i = 1; i <= sorted.length; i++) {
    const n = sorted[i];
    if (n === prev + 1) {
      prev = n;
      continue;
    }
    parts.push(start === prev ? `${start}` : `${start}–${prev}`);
    start = n;
    prev = n;
  }
  return parts.join(', ');
}

function parseMesocycleSheet(r: SheetReader, mesoId: string, notes: string[]): TrainingPhase[] {
  const phases: TrainingPhase[] = [];
  const last = r.maxRow();
  for (let row = 2; row <= last; row++) {
    const weekLabel = cellText(r.raw('C', row));
    const m = weekLabel ? /semana\s*(\d+)/i.exec(weekLabel) : null;
    if (!m) continue;
    const number = Number(m[1]);
    const phaseName = cellText(r.value('A', row)) ?? 'Sin fase';
    const objective = cellText(r.value('B', row));
    let phase = phases[phases.length - 1];
    if (!phase || normalizeKey(phase.name) !== normalizeKey(phaseName)) {
      const order = phases.length + 1;
      phase = {
        id: `${mesoId}-p${order}`,
        mesocycleId: mesoId,
        order,
        name: titleCase(phaseName),
        objective,
        weeks: [],
      };
      if (!objective) notes.push(`La fase "${phase.name}" no tiene objetivo en el Excel (celda B${row} vacía).`);
      phases.push(phase);
    }
    const schemeRaw = cellText(r.raw('E', row));
    let scheme: string | null = null;
    const weekNotes: string[] = [];
    if (schemeRaw && SCHEME_RE.test(schemeRaw)) {
      const sm = SCHEME_RE.exec(schemeRaw)!;
      scheme = `${sm[1]}x${sm[2]}`;
    } else if (schemeRaw) {
      weekNotes.push(schemeRaw);
      notes.push(`Semana ${number}: la celda E${row} ("${schemeRaw}") no es un esquema series×reps; se guarda como nota.`);
    }
    for (const col of ['F', 'G', 'H']) {
      const v = r.raw(col, row);
      if (v && typeof v === 'object' && 'formula' in v) {
        notes.push(
          `Semana ${number}: la celda ${col}${row} contiene la fórmula "=${v.formula}" con resultado vacío; ignorada.`,
        );
        continue;
      }
      const t = cellText(v);
      if (t) weekNotes.push(t);
    }
    phase.weeks.push({
      id: `${mesoId}-w${number}`,
      phaseId: phase.id,
      number,
      status: weekStatus(cellText(r.raw('D', row))),
      scheme,
      notes: weekNotes.length ? weekNotes.join(' · ') : null,
      sourceSheet: null,
      sessions: [],
    });
  }
  return phases;
}

function titleCase(s: string): string {
  const t = s.trim();
  return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
}

function parseSessionSheet(
  r: SheetReader,
  weekId: string,
  resolve: ParseOptions['resolveExercise'],
): TrainingSession[] {
  const sessions: TrainingSession[] = [];
  const last = r.maxRow();
  const st: { current: TrainingSession | null; prev: PrescribedExercise | null } = { current: null, prev: null };

  const newSession = (title: string, flags: string[]) => {
    const order = sessions.length + 1;
    st.current = { id: `${weekId}-s${order}`, weekId, order, title, exercises: [], reviewFlags: flags };
    sessions.push(st.current);
    st.prev = null;
  };

  for (let row = 1; row <= last; row++) {
    const a = cellText(r.raw('A', row));
    const b = cellText(r.raw('B', row));
    if (a && normalizeKey(a) === 'etapa') {
      if (!st.current) {
        newSession('Sesión 1', [
          `El título de la primera sesión no aparece en la hoja "${r.name}"; se ha nombrado "Sesión 1".`,
        ]);
      }
      continue;
    }
    if (a && /^sesi[oó]n\s*\d+/i.test(normalizeKey(a)) && !b) {
      newSession(a.replace(/\s+/g, ' ').trim(), []);
      continue;
    }
    if (!st.current) continue;
    const session: TrainingSession = st.current;

    const cells: Record<string, GridCell> = {};
    let hasAny = false;
    for (const col of 'BCDEFGHIJK'.split('')) {
      const v = r.raw(col, row);
      cells[col] = v;
      if (cellText(v) !== null) hasAny = true;
    }
    if (!hasAny) continue;

    // Fila sin ejercicio (p. ej. C44:C46): texto asociado al ejercicio anterior.
    if (!b) {
      const extra = Object.entries(cells)
        .map(([, v]) => cellText(v))
        .filter(Boolean)
        .join(' ');
      if (st.prev) {
        const p: PrescribedExercise = st.prev;
        p.notes = p.notes ? `${p.notes} · ${extra}` : extra;
        p.reviewFlags.push(
          `Texto de la fila ${row} ("${extra}") sin ejercicio propio: se ha añadido a las notas de este ejercicio.`,
        );
        p.raw = { ...(p.raw ?? {}), [`fila${row}`]: extra };
      }
      continue;
    }

    const flags: string[] = [];
    const stageLabel = cellText(r.value('A', row));
    const raw: Record<string, RawValue> = { fila: row, hoja: r.name, etapa: stageLabel };
    const headers: Record<string, string> = {
      B: 'Ejercicio',
      C: 'Series',
      D: 'Reps',
      E: 'Peso',
      F: 'RIR/RPE',
      G: 'Carga sugerida (G)',
      H: 'Carga sugerida (H)',
      I: 'Tempo',
      J: 'Descanso',
      K: 'Notas',
    };
    for (const [col, v] of Object.entries(cells)) if (v !== null) raw[headers[col]] = rawOf(v);

    let load = cellText(cells.E);
    let notes = cellText(cells.K);
    const mergeE = r.mergeAt('E', row);
    if (load && mergeE && mergeE.c2 >= colIndex('J')) {
      flags.push(`"${load}" ocupa las columnas E–J combinadas; se guarda como indicación en notas, no como carga.`);
      notes = notes ? `${notes} · ${load}` : load;
      load = null;
    }

    const sets = cellText(cells.C);
    const reps = cellText(cells.D);
    if (sets && !isNumericLike(sets)) flags.push(`Series no numéricas ("${sets}").`);
    if (reps && !isNumericLike(reps)) flags.push(`Repeticiones no numéricas ("${reps}").`);
    flags.push(...loadFlags('Peso', load));
    const suggestedLoad = cellText(cells.G);
    const suggestedLoadAlt = cellText(cells.H);
    flags.push(...loadFlags('Carga sugerida', suggestedLoad));
    if (suggestedLoadAlt) {
      flags.push(
        'Hay dos valores bajo "Carga sugerida" (columnas G y H): significado a confirmar (¿progresión? ¿otro atleta?).',
      );
    }
    const { tempo, flag: tempoFlag } = tempoFromCell(cells.I);
    if (tempoFlag) flags.push(tempoFlag);

    const linked = resolve ? resolve(b) : null;
    if (linked && normalizeKey(linked.title) !== normalizeKey(b)) {
      flags.push(`Nombre conservado del Excel; vinculado al ejercicio de biblioteca "${linked.title}".`);
    }

    const ex: PrescribedExercise = {
      id: `${session.id}-e${session.exercises.length + 1}`,
      sessionId: session.id,
      order: session.exercises.length + 1,
      stage: stageOf(stageLabel),
      exerciseId: linked?.id ?? null,
      name: b,
      sets,
      reps,
      load,
      rirRpe: cellText(cells.F),
      suggestedLoad,
      suggestedLoadAlt,
      tempo,
      rest: cellText(cells.J),
      notes,
      raw,
      reviewFlags: flags,
      removedAt: null,
    };
    session.exercises.push(ex);
    st.prev = ex;
  }
  return sessions;
}

/** Lista plana de avisos para el informe de importación. */
export function collectFlags(plan: TrainingPlan): { where: string; flag: string }[] {
  const out: { where: string; flag: string }[] = [];
  for (const m of plan.mesocycles)
    for (const p of m.phases)
      for (const w of p.weeks)
        for (const s of w.sessions) {
          for (const f of s.reviewFlags) out.push({ where: `Semana ${w.number} · ${s.title}`, flag: f });
          for (const e of s.exercises)
            for (const f of e.reviewFlags) out.push({ where: `Semana ${w.number} · ${s.title} · ${e.name}`, flag: f });
        }
  return out;
}
