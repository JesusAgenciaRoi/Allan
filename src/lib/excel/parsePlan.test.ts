import { describe, expect, it } from 'vitest';
import { cellText, parsePlanWorkbook, tempoFromCell, weeksFromSheetName, type GridSheet } from './parsePlan';
import excelPlan from '../../data/generated/excel-plan.json';
import type { TrainingPlan } from '../../types/domain';
import { allWeeks } from '../plan';

const meso: GridSheet = {
  name: 'MESOCICLO',
  merges: ['A2:A3', 'B2:B3'],
  cells: {
    B1: 'Objetivo del Meso',
    A2: 'HIPERTROFIA',
    B2: 'Generar hipertrofia',
    C2: 'Semana 1',
    D2: 'Completado',
    E2: '4x10',
    C3: 'Semana 2',
    D3: 'Pendiente',
    E3: 'Cierre del bloque',
    A4: 'Peaking',
    C4: 'Semana 3',
    D4: 'Pendiente',
    E4: '3X2',
    H4: { formula: '$B$3', result: null },
  },
};

const s1s2: GridSheet = {
  name: 'S1S2',
  merges: ['A2:A3', 'E3:J3'],
  cells: {
    A1: 'Etapa',
    B1: 'Ejercicio',
    A2: 'Calentamiento',
    B2: 'Movilidad',
    B3: 'Circuito de abdomen',
    C3: '4 VUELTAS',
    E3: 'SIN DESCANSO',
    A4: 'Trabajo basico',
    B4: 'Sentadilla',
    C4: 4,
    D4: 10,
    E4: 100,
    F4: '@7',
    I4: { excelTime: '1:02:01', h: 1, m: 2, s: 1 },
    J4: '2 Minutos',
    B5: 'Inclinado',
    C5: 4,
    D5: 12,
    E5: '24/26/28/30',
    G5: '75/80',
    H5: '80/85',
    A6: 'Sesión 2 Variantes',
    A7: 'Etapa',
    A8: 'Finalizador',
    B8: 'Saltos',
    C8: 'maximo en 5 Minutos',
    C9: 'SENTADILLAS/ LAGARTIJAS',
  },
};

describe('parsePlanWorkbook', () => {
  const plan = parsePlanWorkbook([meso, s1s2], { now: '2026-01-01T00:00:00Z' });
  const weeks = allWeeks(plan);

  it('lee fases, semanas, estados y esquemas sin inventar', () => {
    expect(plan.mesocycles[0].phases.map((p) => p.name)).toEqual(['Hipertrofia', 'Peaking']);
    expect(weeks.map((w) => [w.week.number, w.week.status, w.week.scheme])).toEqual([
      [1, 'completado', '4x10'],
      [2, 'pendiente', null],
      [3, 'pendiente', '3x2'],
    ]);
    expect(weeks[1].week.notes).toBe('Cierre del bloque');
    expect(plan.importNotes.some((n) => n.includes('fórmula'))).toBe(true);
    expect(plan.importNotes.some((n) => n.includes('"Peaking" no tiene objetivo'))).toBe(true);
  });

  it('aplica la hoja S1S2 a las semanas 1 y 2 y deja la 3 sin sesiones', () => {
    expect(weeks[0].week.sessions).toHaveLength(2);
    expect(weeks[1].week.sessions).toHaveLength(2);
    expect(weeks[2].week.sessions).toHaveLength(0);
    expect(weeks[0].week.sessions[0].title).toBe('Sesión 1');
    expect(weeks[0].week.sessions[0].reviewFlags[0]).toMatch(/no aparece/);
    expect(weeks[0].week.sessions[1].title).toBe('Sesión 2 Variantes');
  });

  it('conserva valores originales y marca ambigüedades', () => {
    const [warm, abs, squat, incl] = weeks[0].week.sessions[0].exercises;
    expect(warm.stage).toBe('calentamiento');
    expect(abs.stage).toBe('calentamiento');
    expect(abs.load).toBeNull();
    expect(abs.notes).toBe('SIN DESCANSO');
    expect(squat).toMatchObject({ stage: 'basico', sets: '4', reps: '10', load: '100', rirRpe: '@7', tempo: '1-2-1' });
    expect(squat.reviewFlags.join(' ')).toMatch(/Tempo leído como hora/);
    expect(incl.load).toBe('24/26/28/30');
    expect(incl.suggestedLoad).toBe('75/80');
    expect(incl.suggestedLoadAlt).toBe('80/85');
    expect(incl.reviewFlags.join(' ')).toMatch(/varios valores/);
    expect(incl.raw?.['Peso']).toBe('24/26/28/30');
  });

  it('no convierte celdas vacías en cero', () => {
    const incl = weeks[0].week.sessions[0].exercises[3];
    expect(incl.rirRpe).toBeNull();
    expect(incl.tempo).toBeNull();
  });

  it('asocia texto huérfano al ejercicio anterior', () => {
    const saltos = weeks[0].week.sessions[1].exercises[0];
    expect(saltos.notes).toContain('SENTADILLAS/ LAGARTIJAS');
    expect(saltos.reviewFlags.join(' ')).toMatch(/sin ejercicio propio/);
  });
});

describe('helpers', () => {
  it('weeksFromSheetName', () => {
    expect(weeksFromSheetName('S1S2')).toEqual([1, 2]);
    expect(weeksFromSheetName('s3')).toEqual([3]);
    expect(weeksFromSheetName('Notas')).toEqual([]);
  });
  it('cellText / tempo', () => {
    expect(cellText(47.5)).toBe('47.5');
    expect(cellText('  ')).toBeNull();
    expect(tempoFromCell({ excelTime: '3:01:01', h: 3, m: 1, s: 1 }).tempo).toBe('3-1-1');
  });
});

describe('plan generado desde el Excel real', () => {
  const plan = excelPlan as unknown as TrainingPlan;
  const weeks = allWeeks(plan);
  it('tiene 21 semanas en 6 fases y sesiones solo en las semanas 1–4', () => {
    expect(weeks).toHaveLength(21);
    expect(plan.mesocycles[0].phases.map((p) => p.name)).toEqual(['Hipertrofia', 'Volumen', 'Fuerza', 'Peaking', 'Tapering', 'Testeo']);
    expect(weeks.filter((w) => w.week.sessions.length).map((w) => w.week.number)).toEqual([1, 2, 3, 4]);
    expect(weeks.every((w) => w.week.sessions.length === 0 || w.week.sessions.length === 4)).toBe(true);
  });
  it('distingue S3 y S4 en las celdas donde difieren', () => {
    const w3 = weeks[2].week.sessions[1].exercises.find((e) => e.name.startsWith('Fondos'))!;
    const w4 = weeks[3].week.sessions[1].exercises.find((e) => e.name.startsWith('Fondos'))!;
    expect(w3.load).toBe('115/maquina');
    expect(w4.load).toBe('105/maquina');
  });
});
