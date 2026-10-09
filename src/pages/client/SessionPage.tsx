import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useService } from '../../state/DataContext';
import { useToast } from '../../state/ToastContext';
import { useClientData } from './useClientData';
import { ConfirmDialog, EmptyState, ErrorBlock, LoadingBlock, Notice } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { ExerciseMediaView } from '../../components/ExerciseMediaView';
import { PrescriptionParamsGrid } from '../../components/plan/PrescriptionCard';
import { activeExercises, findSession } from '../../lib/plan';
import { stageLabel } from '../../content/muscleGroups';
import type { ExerciseLog, WorkoutLog } from '../../types/domain';

export default function SessionPage() {
  const { sessionId = '' } = useParams();
  const service = useService();
  const toast = useToast();
  const data = useClientData();
  const [log, setLog] = useState<WorkoutLog | null>(null);
  const [loadError, setLoadError] = useState<Error | null>(null);
  const [saveState, setSaveState] = useState<'idle' | 'dirty' | 'saving' | 'saved' | 'error'>('idle');
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finished, setFinished] = useState<WorkoutLog | null>(null);
  const [busy, setBusy] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    let alive = true;
    setLog(null);
    setFinished(null);
    service
      .getOrStartWorkoutLog(sessionId)
      .then((l) => alive && setLog(l))
      .catch((e: Error) => alive && setLoadError(e));
    return () => {
      alive = false;
    };
  }, [service, sessionId]);

  // Autoguardado del progreso (no se pierde lo registrado si se cierra la pantalla).
  useEffect(() => {
    if (saveState !== 'dirty' || !log) return;
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setSaveState('saving');
      try {
        await service.saveWorkoutLog(log);
        setSaveState('saved');
      } catch (e) {
        setSaveState('error');
        toast('error', (e as Error).message);
      }
    }, 1200);
    return () => window.clearTimeout(timer.current);
  }, [log, saveState, service, toast]);

  const ctx = useMemo(() => {
    const plan = data.data?.plan;
    if (!plan) return null;
    return findSession(plan, sessionId);
  }, [data.data?.plan, sessionId]);

  useEffect(() => {
    if (ctx) document.title = `${ctx.session.title} — AF Team`;
  }, [ctx]);

  if (data.error || loadError) return <ErrorBlock error={(data.error ?? loadError)!} onRetry={data.reload} />;
  if (data.data === undefined || (!log && !finished)) return <LoadingBlock rows={4} />;
  if (!ctx)
    return (
      <EmptyState title="Sesión no encontrada" action={<Link to="/app/cliente/rutina" className="btn">Ir a mi rutina</Link>}>
        Puede que tu entrenador haya cambiado el plan.
      </EmptyState>
    );

  const exById = new Map((data.data?.exercises ?? []).map((e) => [e.id, e]));
  const list = activeExercises(ctx.session);

  if (finished) {
    const done = finished.exercises.filter((e) => e.completed).length;
    return (
      <div className="card card--gold celebrate" role="status">
        <svg className="celebrate__ring" viewBox="0 0 120 120" aria-hidden="true">
          <circle className="track" cx="60" cy="60" r="52" />
          <circle className="bar" cx="60" cy="60" r="52" style={{ ['--to' as string]: 327 - (327 * done) / Math.max(1, finished.exercises.length) }} />
          <path className="celebrate__check" d="M40 62 l13 13 l27 -29" />
        </svg>
        <h1 className="page-title">¡Sesión completada!</h1>
        <p className="muted">
          {ctx.session.title} · {done}/{finished.exercises.length} ejercicios marcados. Tu entrenador ha recibido el aviso
          {service.mode === 'demo' ? ' (demo: dentro de esta pestaña)' : ''}.
        </p>
        <div className="row" style={{ justifyContent: 'center' }}>
          <Link to="/app/cliente" className="btn btn--gold">
            Volver a hoy
          </Link>
          <Link to="/app/cliente/historial" className="btn">
            Ver historial
          </Link>
          <Link to={`/app/cliente/reportes?nuevo=1&sesion=${ctx.session.id}`} className="btn btn--danger">
            Informar molestia
          </Link>
        </div>
      </div>
    );
  }
  if (!log) return null;

  const update = (peId: string, fn: (x: ExerciseLog) => ExerciseLog) => {
    setLog((l) => (l ? { ...l, exercises: l.exercises.map((x) => (x.prescribedExerciseId === peId ? fn(x) : x)) } : l));
    setSaveState('dirty');
  };
  const completed = log.exercises.filter((e) => e.completed).length;
  const pct = log.exercises.length ? Math.round((completed / log.exercises.length) * 100) : 0;
  const activeIdx = list.findIndex((pe) => !log.exercises.find((x) => x.prescribedExerciseId === pe.id)?.completed);

  const finish = async () => {
    setBusy(true);
    window.clearTimeout(timer.current);
    try {
      await service.completeWorkoutLog(log);
      setFinished(log);
      window.scrollTo({ top: 0 });
    } catch (e) {
      toast('error', (e as Error).message);
    } finally {
      setBusy(false);
      setConfirmFinish(false);
    }
  };

  return (
    <div className="player">
      <div>
        <Link to="/app/cliente/rutina" className="breadcrumb">
          <Icon name="arrowLeft" size={16} /> Mi rutina
        </Link>
        <span className="eyebrow" style={{ display: 'block' }}>
          Semana {ctx.week.number} · {ctx.phase.name}
        </span>
        <h1 className="page-title">{ctx.session.title}</h1>
      </div>

      <div className="player__progress">
        <div style={{ flex: 1 }}>
          <div className="row row--between small">
            <span>
              {completed}/{log.exercises.length} ejercicios
            </span>
            <span className="muted" aria-live="polite">
              {saveState === 'saving' ? 'Guardando…' : saveState === 'saved' ? 'Progreso guardado' : saveState === 'error' ? 'Error al guardar' : saveState === 'dirty' ? 'Cambios sin guardar' : ''}
            </span>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progreso de la sesión">
            <div className="progress__bar" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <Notice kind="plain">
        Registra lo que <strong>realmente</strong> hiciste. Lo programado se mantiene para comparar. Si algo duele, para y{' '}
        <Link to={`/app/cliente/reportes?nuevo=1&sesion=${ctx.session.id}`}>avisa a tu entrenador</Link>.
      </Notice>

      {list.map((pe, i) => {
        const ex = pe.exerciseId ? exById.get(pe.exerciseId) : undefined;
        const entry = log.exercises.find((x) => x.prescribedExerciseId === pe.id);
        if (!entry) return null;
        const steps = ex?.procedure.split('\n').filter(Boolean) ?? [];
        return (
          <article key={pe.id} className={`ex-log ${ex?.media ? '' : 'ex-log--nomedia'} ${entry.completed ? 'ex-log--done' : i === activeIdx ? 'ex-log--active' : ''}`} aria-labelledby={`t-${pe.id}`}>
            {ex?.media && (
              <div className="ex-log__media">
                <ExerciseMediaView media={ex.media} title={ex.title} aspect="4 / 3" lazy={i > 1} />
              </div>
            )}
            <div className="ex-log__body">
              <div>
                <p className="stage-label" style={{ marginTop: 0 }}>
                  {i + 1}. {stageLabel(pe.stage)}
                </p>
                <h2 id={`t-${pe.id}`} className="ex-log__title">
                  {pe.name}
                </h2>
              </div>
              <PrescriptionParamsGrid pe={pe} />
              {pe.notes && (
                <p className="small">
                  <strong className="gold">Indicaciones:</strong> {pe.notes}
                </p>
              )}
              {steps.length > 0 && (
                <details>
                  <summary className="small gold" style={{ cursor: 'pointer', minHeight: 32, display: 'flex', alignItems: 'center' }}>
                    Procedimiento
                  </summary>
                  <ol className="procedure">
                    {steps.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                  {ex?.technicalCues && <p className="small muted">Claves: {ex.technicalCues}</p>}
                </details>
              )}

              <fieldset className="sets" style={{ border: 0, padding: 0, margin: 0 }}>
                <legend className="field__label" style={{ marginBottom: 6 }}>
                  Tu registro
                </legend>
                <div className="set-row" aria-hidden="true">
                  <span />
                  <span className="set-row__head">Peso (kg)</span>
                  <span className="set-row__head">Reps</span>
                  <span className="set-row__head">RIR/RPE</span>
                  <span />
                </div>
                {entry.sets.map((s, k) => (
                  <div key={s.setNumber} className="set-row">
                    <span className="set-row__n" aria-hidden="true">
                      {s.setNumber}
                    </span>
                    <input
                      className="input input--sm"
                      inputMode="decimal"
                      aria-label={`Serie ${s.setNumber}: peso usado`}
                      placeholder={pe.load && /^\d/.test(pe.load) && !/[/*]/.test(pe.load) ? pe.load : '—'}
                      maxLength={20}
                      value={s.weight}
                      onChange={(e) => update(pe.id, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === k ? { ...y, weight: e.target.value } : y)) }))}
                    />
                    <input
                      className="input input--sm"
                      inputMode="numeric"
                      aria-label={`Serie ${s.setNumber}: repeticiones hechas`}
                      placeholder={pe.reps && /^\d+$/.test(pe.reps) ? pe.reps : '—'}
                      maxLength={20}
                      value={s.reps}
                      onChange={(e) => update(pe.id, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === k ? { ...y, reps: e.target.value } : y)) }))}
                    />
                    <input
                      className="input input--sm"
                      aria-label={`Serie ${s.setNumber}: esfuerzo (RIR o RPE)`}
                      maxLength={20}
                      value={s.effort}
                      onChange={(e) => update(pe.id, (x) => ({ ...x, sets: x.sets.map((y, j) => (j === k ? { ...y, effort: e.target.value } : y)) }))}
                    />
                    <button
                      type="button"
                      className="set-check"
                      aria-pressed={s.done}
                      aria-label={`Serie ${s.setNumber} ${s.done ? 'hecha' : 'pendiente'}`}
                      onClick={() =>
                        update(pe.id, (x) => {
                          const sets = x.sets.map((y, j) => (j === k ? { ...y, done: !y.done } : y));
                          return { ...x, sets, completed: sets.every((y) => y.done) ? true : x.completed };
                        })
                      }
                    >
                      <Icon name="check" size={18} />
                    </button>
                  </div>
                ))}
              </fieldset>

              <label className="sr-only" htmlFor={`n-${pe.id}`}>
                Notas sobre {pe.name}
              </label>
              <input
                id={`n-${pe.id}`}
                className="input"
                placeholder="Nota (opcional): sensaciones, ajustes…"
                maxLength={1000}
                value={entry.notes}
                onChange={(e) => update(pe.id, (x) => ({ ...x, notes: e.target.value }))}
              />
              <div className="row">
                <button
                  type="button"
                  className={`btn ${entry.completed ? 'btn--gold' : 'btn--outline-gold'}`}
                  aria-pressed={entry.completed}
                  onClick={() => update(pe.id, (x) => ({ ...x, completed: !x.completed }))}
                >
                  <Icon name="check" size={16} /> {entry.completed ? 'Completado' : 'Marcar completado'}
                </button>
                <Link
                  to={`/app/cliente/reportes?nuevo=1&sesion=${ctx.session.id}&ejercicio=${pe.id}`}
                  className="btn btn--sm btn--danger"
                >
                  <Icon name="alert" size={14} /> Molestia aquí
                </Link>
              </div>
            </div>
          </article>
        );
      })}

      <section className="card stack">
        <label className="field__label" htmlFor="log-notes">
          Notas de la sesión
        </label>
        <textarea
          id="log-notes"
          className="textarea"
          maxLength={2000}
          value={log.notes}
          onChange={(e) => {
            setLog({ ...log, notes: e.target.value });
            setSaveState('dirty');
          }}
        />
        <button type="button" className="btn btn--gold btn--lg btn--block" onClick={() => setConfirmFinish(true)}>
          <Icon name="check" size={18} /> Finalizar sesión
        </button>
      </section>

      {confirmFinish && (
        <ConfirmDialog
          title="Finalizar sesión"
          confirmLabel="Finalizar"
          busy={busy}
          message={
            completed < log.exercises.length
              ? `Has marcado ${completed} de ${log.exercises.length} ejercicios. Se guardará tal cual y se avisará a tu entrenador.`
              : 'Se guardará tu registro y se avisará a tu entrenador.'
          }
          onCancel={() => setConfirmFinish(false)}
          onConfirm={finish}
        />
      )}
    </div>
  );
}
