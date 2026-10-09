// Importa el Excel de planificación a JSON normalizado + informe de ambigüedades.
//   npm run import:excel                      (usa "Kevin y Rasta plani.xlsx")
//   npx tsx scripts/import-excel.ts ruta.xlsx
//
// Salidas:
//   src/data/generated/excel-plan.json   → plan plantilla (datos demo) usado por el modo demo
//   docs/EXCEL_IMPORT_REPORT.md          → avisos de revisión celda a celda
//   supabase/seed/excel-plan.json        → mismo plan para sembrar el modo conectado (opcional)

import ExcelJS from 'exceljs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';
import { collectFlags, parsePlanWorkbook, type GridCell, type GridSheet } from '../src/lib/excel/parsePlan';
import { resolveDemoExercise } from '../src/data/demo/exercises';

const file = process.argv[2] ?? 'Kevin y Rasta plani.xlsx';

function toGridCell(v: ExcelJS.CellValue): GridCell {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  if (typeof v === 'boolean') return String(v);
  if (v instanceof Date) {
    // Excel guarda horas como fracción de día con base 1899-12-30. Recuperamos h:m:s en UTC.
    const h = v.getUTCHours();
    const m = v.getUTCMinutes();
    const s = v.getUTCSeconds();
    return { excelTime: `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`, h, m, s };
  }
  if (typeof v === 'object' && 'formula' in v) {
    const res = (v as ExcelJS.CellFormulaValue).result;
    const r = res === undefined || res === null || typeof res === 'object' ? null : (res as string | number);
    return { formula: String((v as ExcelJS.CellFormulaValue).formula), result: typeof r === 'boolean' ? String(r) : r };
  }
  if (typeof v === 'object' && 'richText' in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((t) => t.text).join('');
  }
  if (typeof v === 'object' && 'text' in v) return String((v as { text: unknown }).text);
  return String(v);
}

async function main() {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(resolve(file));
  const sheets: GridSheet[] = [];
  wb.eachSheet((ws) => {
    const cells: Record<string, GridCell> = {};
    ws.eachRow({ includeEmpty: false }, (row) => {
      row.eachCell({ includeEmpty: false }, (cell) => {
        // Solo celdas "maestras": exceljs replica el valor en las celdas combinadas.
        if (cell.isMerged && cell.master.address !== cell.address) return;
        const g = toGridCell(cell.value);
        if (g !== null && !(typeof g === 'string' && g.trim() === '')) cells[cell.address] = g;
      });
    });
    const merges = ((ws.model as unknown as { merges?: string[] }).merges ?? []).slice();
    sheets.push({ name: ws.name, cells, merges });
  });

  console.log('Hojas:', sheets.map((s) => `${s.name} (${Object.keys(s.cells).length} celdas)`).join(', '));

  const plan = parsePlanWorkbook(sheets, {
    planId: 'tpl-excel',
    ownerId: 'demo-trainer',
    planName: 'Mesociclo Hipertrofia → Fuerza (importado)',
    sourceFile: basename(file),
    resolveExercise: resolveDemoExercise,
    now: '2026-09-01T10:00:00.000Z',
  });

  const out = resolve('src/data/generated/excel-plan.json');
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(plan, null, 2) + '\n', 'utf8');
  const seedOut = resolve('supabase/seed/excel-plan.json');
  mkdirSync(dirname(seedOut), { recursive: true });
  writeFileSync(seedOut, JSON.stringify(plan, null, 2) + '\n', 'utf8');

  const flags = collectFlags(plan);
  const weeks = plan.mesocycles.flatMap((m) => m.phases.flatMap((p) => p.weeks));
  const lines: string[] = [
    '# Informe de importación del Excel',
    '',
    `Archivo: \`${basename(file)}\` — generado por \`scripts/import-excel.ts\`. **No editar a mano**: vuelve a ejecutar \`npm run import:excel\`.`,
    '',
    '## Estructura detectada',
    '',
    '| Fase | Objetivo | Semanas | Esquemas | Estado (según Excel) |',
    '|---|---|---|---|---|',
    ...plan.mesocycles[0].phases.map(
      (p) =>
        `| ${p.name} | ${p.objective ?? '_(sin objetivo)_'} | ${p.weeks.map((w) => w.number).join(', ')} | ${p.weeks
          .map((w) => w.scheme ?? (w.notes ? `«${w.notes}»` : '—'))
          .join(' · ')} | ${p.weeks.map((w) => w.status).join(', ')} |`,
    ),
    '',
    `Semanas con sesiones: ${weeks.filter((w) => w.sessions.length).map((w) => `S${w.number} (hoja ${w.sourceSheet})`).join(', ')}.`,
    '',
    '## Notas generales',
    '',
    ...plan.importNotes.map((n) => `- ${n}`),
    '',
    `## Avisos por ejercicio (${flags.length})`,
    '',
    '| Dónde | Aviso |',
    '|---|---|',
    ...flags.map((f) => `| ${f.where} | ${f.flag.replace(/\|/g, '\\|')} |`),
    '',
  ];
  const report = resolve('docs/EXCEL_IMPORT_REPORT.md');
  mkdirSync(dirname(report), { recursive: true });
  writeFileSync(report, lines.join('\n'), 'utf8');

  console.log(`Plan: ${weeks.length} semanas, ${weeks.reduce((n, w) => n + w.sessions.length, 0)} sesiones, ${flags.length} avisos.`);
  console.log(`→ ${out}\n→ ${report}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
