import { beforeEach, describe, expect, it } from 'vitest';
import { DemoService } from './demoService';
import { PermissionError } from './types';
import { activeExercises, allWeeks } from '../lib/plan';

describe('DemoService: flujo cliente → reporte → entrenador → respuesta/ajuste', () => {
  let s: DemoService;
  beforeEach(() => {
    sessionStorage.clear();
    s = new DemoService(0);
  });

  it('exige sesión y respeta los roles', async () => {
    await expect(s.listClients()).rejects.toBeInstanceOf(PermissionError);
    await s.signInDemo('client');
    await expect(s.listClients()).rejects.toBeInstanceOf(PermissionError);
    await expect(s.saveExercise({} as never)).rejects.toBeInstanceOf(PermissionError);
    const plans = await s.listPlans();
    expect(plans.every((p) => p.clientId === 'cli-1')).toBe(true); // no ve plantillas ni planes ajenos
  });

  it('flujo completo', async () => {
    // Cliente registra una sesión e informa una molestia
    await s.signInDemo('client');
    const me = (await s.getMyClient())!;
    const plan = (await s.getPlan(me.activePlanId!))!;
    const week = allWeeks(plan).find((w) => w.week.id === plan.currentWeekId)!.week;
    const session = week.sessions[0];
    const log = await s.getOrStartWorkoutLog(session.id);
    log.exercises[3].sets[0] = { setNumber: 1, weight: '72.5', reps: '9', effort: 'RIR 2', done: true };
    log.exercises[3].completed = true;
    await s.completeWorkoutLog(log);
    const pe = activeExercises(session).find((e) => e.exerciseId === 'ex-press-inclinado-mancuernas')!;
    const prescribedBefore = pe.load;
    const rep = await s.createReport({
      type: 'dolor',
      bodyArea: 'Hombro derecho',
      level: 7,
      description: 'Pinchazo',
      sessionId: session.id,
      prescribedExerciseId: pe.id,
      exerciseName: pe.name,
      workoutLogId: null,
    });

    // Entrenador recibe avisos
    await s.signInDemo('trainer');
    const ntf = await s.listNotifications();
    expect(ntf.filter((n) => !n.readAt).map((n) => n.type)).toEqual(expect.arrayContaining(['reporte', 'sesion_completada']));
    const pending = await s.listReports({ status: 'pendiente' });
    expect(pending.map((r) => r.id)).toContain(rep.id);

    // Revisa, sustituye el ejercicio y responde
    await s.markReportReviewed(rep.id);
    await s.replacePrescriptionExercise(pe.id, 'ex-elevaciones-laterales', 'ajuste', rep.id);
    await s.respondToReport(rep.id, 'Paramos el inclinado', 'Sustituido por elevaciones laterales');
    const after = (await s.listReports()).find((r) => r.id === rep.id)!;
    expect(after.status).toBe('respondido');

    const updated = (await s.getPlan(plan.id))!;
    const sess = allWeeks(updated).flatMap((w) => w.week.sessions).find((x) => x.id === session.id)!;
    const old = sess.exercises.find((e) => e.id === pe.id)!;
    expect(old.removedAt).not.toBeNull(); // se conserva para historial
    const repl = activeExercises(sess).find((e) => e.exerciseId === 'ex-elevaciones-laterales')!;
    expect(repl.load).toBe(prescribedBefore); // mismos parámetros prescritos
    const changes = await s.listPlanChanges(plan.id);
    expect(changes[0]).toMatchObject({ kind: 'sustituido', relatedReportId: rep.id });

    // Lo ejecutado no sobrescribe lo prescrito
    const logs = await s.listWorkoutLogs('cli-1');
    const done = logs.find((l) => l.id === log.id)!;
    expect(done.exercises[3].sets[0].weight).toBe('72.5');
    expect(activeExercises(sess)[3].load).not.toBe('72.5');

    // El cliente ve la respuesta y el cambio
    await s.signInDemo('client');
    const cn = await s.listNotifications();
    expect(cn.filter((n) => !n.readAt).map((n) => n.type)).toEqual(expect.arrayContaining(['respuesta', 'rutina']));
    const mine = (await s.listReports()).find((r) => r.id === rep.id)!;
    expect(mine.responses[0].message).toBe('Paramos el inclinado');
  });

  it('asignar una plantilla crea una copia independiente', async () => {
    await s.signInDemo('trainer');
    const copy = await s.assignPlan('tpl-excel', 'cli-2');
    expect(copy.clientId).toBe('cli-2');
    expect(copy.templateId).toBe('tpl-excel');
    const first = allWeeks(copy)[0].week.sessions[0].exercises[3];
    await s.updatePrescription(first.id, { load: '999' });
    const tpl = (await s.getPlan('tpl-excel'))!;
    expect(allWeeks(tpl)[0].week.sessions[0].exercises[3].load).not.toBe('999');
  });
});
