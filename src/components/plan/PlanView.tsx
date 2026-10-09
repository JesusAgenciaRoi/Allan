import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Exercise, PrescribedExercise, TrainingPlan, TrainingSession, WeekStatus } from '../../types/domain';
import { activeExercises, allWeeks, currentWeek, findWeek } from '../../lib/plan';
import { STAGES } from '../../content/muscleGroups';
import { ConfirmDialog, EmptyState, Notice, weekStatusLabel } from '../ui';
import { Icon } from '../Icon';
import { PrescriptionCard } from './PrescriptionCard';
import { PrescriptionEditModal } from './PrescriptionEditModal';
import { ExercisePickerModal } from './ExercisePicker';
import { useService } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';

type Dialog =
  | { kind: 'edit'; pe: PrescribedExercise }
  | { kind: 'replace'; pe: PrescribedExercise }
  | { kind: 'remove'; pe: PrescribedExercise }
  | { kind: 'add'; session: TrainingSession }
  | { kind: 'add-params'; session: TrainingSession; exercise: Exercise }
  | null;

/**
 * Vista de un plan por fases → semanas → sesiones → ejercicios.
 * mode="trainer" permite editar; mode="client" es de solo lectura con acceso a registrar cada sesión.
 */
export function PlanView({
  plan,
  exercises,
  mode,
  reportedPeIds,
  focusPeId,
  relatedReportId,
  completedSessionIds,
}: {
  plan: TrainingPlan;
  exercises: Exercise[];
  mode: 'trainer' | 'client';
  reportedPeIds?: Set<string>;
  focusPeId?: string | null;
  relatedReportId?: string | null;
  completedSessionIds?: Set<string>;
}) {
  const service = useService();
  const run = useAction();
  const weeks = useMemo(() => allWeeks(plan), [plan]);
  const focusWeekId = useMemo(() => {
    if (!focusPeId) return null;
    for (const { week } of weeks) if (week.sessions.some((s) => s.exercises.some((e) => e.id === focusPeId))) return week.id;
    return null;
  }, [focusPeId, weeks]);
  const [weekId, setWeekId] = useState<string | null>(focusWeekId ?? currentWeek(plan)?.week.id ?? weeks[0]?.week.id ?? null);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [copyFrom, setCopyFrom] = useState('');
  const [newSession, setNewSession] = useState('');

  useEffect(() => {
    if (focusWeekId) setWeekId(focusWeekId);
  }, [focusWeekId]);
  useEffect(() => {
    if (!focusPeId) return;
    const t = setTimeout(() => document.getElementById(`pe-${focusPeId}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
    return () => clearTimeout(t);
  }, [focusPeId, weekId]);

  const exById = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const sel = findWeek(plan, weekId);
  const trainer = mode === 'trainer';
  const curId = plan.currentWeekId;

  return (
    <div className="stack">
      {plan.mesocycles.map((m) => (
        <div key={m.id} className="stack" style={{ ['--stack' as string]: '12px' }}>
          {m.objective && <p className="muted">Objetivo del mesociclo: {m.objective}</p>}
          {m.phases.map((p) => (
            <section key={p.id} className="phase" aria-label={`Fase ${p.name}`}>
              <div className="phase__head">
                <h3 className="phase__name">{p.name}</h3>
                <p className="small muted">{p.objective ?? 'Sin objetivo indicado'}</p>
              </div>
              <div className="weeks-strip" role="group" aria-label={`Semanas de ${p.name}`}>
                {p.weeks.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    className={`week-pill ${w.id === curId ? 'week-pill--current' : ''}`}
                    aria-pressed={w.id === weekId}
                    onClick={() => setWeekId(w.id)}
                  >
                    <span className="week-pill__n">Sem {w.number}</span>
                    <span className="week-pill__s">{w.scheme ?? '—'}</span>
                    <span className="week-pill__s">
                      {w.id === curId ? 'Actual' : weekStatusLabel(w.status)}
                      {w.sessions.length ? ` · ${w.sessions.length} ses.` : ''}
                    </span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>
      ))}

      {sel && (
        <section className="stack" aria-label={`Semana ${sel.week.number}`}>
          <div className="card stack" style={{ ['--stack' as string]: '10px' }}>
            <div className="card__head" style={{ marginBottom: 0 }}>
              <h3 className="card__title">
                Semana {sel.week.number} · {sel.phase.name}
              </h3>
              <div className="row">
                {sel.week.id === curId && <span className="badge badge--gold">Semana actual</span>}
                <span className="badge">{weekStatusLabel(sel.week.status)}</span>
              </div>
            </div>
            <p className="small muted">
              Esquema: <strong>{sel.week.scheme ?? 'sin esquema'}</strong>
              {sel.week.notes && <> · {sel.week.notes}</>}
              {sel.week.sourceSheet && <> · Origen: hoja «{sel.week.sourceSheet}»</>}
            </p>
            {trainer && (
              <div className="row">
                {sel.week.id !== curId && (
                  <button type="button" className="btn btn--sm btn--outline-gold" onClick={() => run(() => service.setCurrentWeek(plan.id, sel.week.id), 'Semana actual actualizada.')}>
                    Marcar como semana actual
                  </button>
                )}
                <label className="sr-only" htmlFor="week-status">
                  Estado de la semana
                </label>
                <select
                  id="week-status"
                  className="select input--sm"
                  style={{ width: 'auto' }}
                  value={sel.week.status}
                  onChange={(e) => run(() => service.updateWeek(sel.week.id, { status: e.target.value as WeekStatus }), 'Estado actualizado.')}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_curso">En curso</option>
                  <option value="completado">Completado</option>
                </select>
              </div>
            )}
          </div>

          {sel.week.sessions.length === 0 ? (
            <EmptyState title="Semana sin sesiones definidas">
              {trainer ? (
                <span className="stack" style={{ ['--stack' as string]: '10px', justifyItems: 'center' }}>
                  <span>El Excel no define sesiones para esta semana; no se han inventado. Puedes copiar las de otra semana o crear una.</span>
                  <span className="row" style={{ justifyContent: 'center' }}>
                    <label className="sr-only" htmlFor="copy-from">
                      Copiar sesiones desde
                    </label>
                    <select id="copy-from" className="select input--sm" style={{ width: 'auto' }} value={copyFrom} onChange={(e) => setCopyFrom(e.target.value)}>
                      <option value="">Copiar desde…</option>
                      {weeks
                        .filter((w) => w.week.sessions.length > 0)
                        .map((w) => (
                          <option key={w.week.id} value={w.week.id}>
                            Semana {w.week.number}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn--sm btn--outline-gold"
                      disabled={!copyFrom}
                      onClick={() => run(() => service.copyWeekSessions(copyFrom, sel.week.id), 'Sesiones copiadas. Revísalas y ajusta las cargas.')}
                    >
                      Copiar
                    </button>
                  </span>
                </span>
              ) : (
                'Tu entrenador todavía no ha definido las sesiones de esta semana.'
              )}
            </EmptyState>
          ) : (
            sel.week.sessions.map((s, i) => {
              const list = activeExercises(s);
              const done = completedSessionIds?.has(s.id);
              return (
                <details key={s.id} className="session-block" open={trainer ? i === 0 || list.some((e) => e.id === focusPeId) : false}>
                  <summary>
                    <span>
                      <span className="session-block__title">{s.title}</span>
                      <span className="small muted"> · {list.length} ejercicios</span>
                    </span>
                    {done && <span className="badge badge--ok">Completada</span>}
                  </summary>
                  <div className="session-block__body">
                    {s.reviewFlags.length > 0 && trainer && (
                      <Notice kind="warn" icon="!">
                        {s.reviewFlags.join(' ')}
                      </Notice>
                    )}
                    {mode === 'client' && (
                      <Link to={`/app/cliente/sesion/${s.id}`} className="btn btn--gold btn--block">
                        <Icon name="play" size={16} /> {done ? 'Ver / registrar de nuevo' : 'Abrir y registrar sesión'}
                      </Link>
                    )}
                    {STAGES.map((st) => {
                      const items = list.filter((e) => e.stage === st.id);
                      if (!items.length) return null;
                      return (
                        <div key={st.id} className="stack" style={{ ['--stack' as string]: '8px' }}>
                          <p className="stage-label">{st.label}</p>
                          {items.map((pe) => {
                            const idx = list.indexOf(pe);
                            return (
                              <PrescriptionCard
                                key={pe.id}
                                pe={pe}
                                exercise={pe.exerciseId ? exById.get(pe.exerciseId) : undefined}
                                showFlags={trainer}
                                reported={reportedPeIds?.has(pe.id)}
                                actions={
                                  trainer
                                    ? {
                                        onEdit: () => setDialog({ kind: 'edit', pe }),
                                        onReplace: () => setDialog({ kind: 'replace', pe }),
                                        onRemove: () => setDialog({ kind: 'remove', pe }),
                                        onMove: (d) => run(() => service.movePrescription(pe.id, d)),
                                        isFirst: idx === 0,
                                        isLast: idx === list.length - 1,
                                      }
                                    : undefined
                                }
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                    {trainer && (
                      <button type="button" className="btn btn--outline-gold" onClick={() => setDialog({ kind: 'add', session: s })}>
                        <Icon name="plus" size={16} /> Añadir ejercicio de la biblioteca
                      </button>
                    )}
                    {trainer && s.exercises.some((e) => e.removedAt) && (
                      <details className="raw">
                        <summary>Historial: {s.exercises.filter((e) => e.removedAt).length} ejercicio(s) retirado(s)</summary>
                        <ul className="flags" style={{ color: 'var(--c-muted)' }}>
                          {s.exercises
                            .filter((e) => e.removedAt)
                            .map((e) => (
                              <li key={e.id}>
                                {e.name} — retirado {new Date(e.removedAt!).toLocaleDateString('es-ES')}
                              </li>
                            ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </details>
              );
            })
          )}

          {trainer && (
            <form
              className="row"
              onSubmit={async (e) => {
                e.preventDefault();
                if (await run(() => service.addSession(sel.week.id, newSession), 'Sesión añadida.')) setNewSession('');
              }}
            >
              <label className="sr-only" htmlFor="new-session">
                Título de la nueva sesión
              </label>
              <input id="new-session" className="input" style={{ flex: 1, minWidth: 180 }} placeholder="Título de la nueva sesión (opcional)" value={newSession} onChange={(e) => setNewSession(e.target.value)} />
              <button type="submit" className="btn">
                <Icon name="plus" size={16} /> Añadir sesión
              </button>
            </form>
          )}
        </section>
      )}

      {dialog?.kind === 'edit' && (
        <PrescriptionEditModal
          pe={dialog.pe}
          title={`Editar · ${dialog.pe.name}`}
          withReason={!!plan.clientId}
          onClose={() => setDialog(null)}
          onSave={(params, reason) =>
            run(() => service.updatePrescription(dialog.pe.id, params, { reason, relatedReportId }), 'Prescripción actualizada. El cliente verá el cambio.')
          }
        />
      )}
      {dialog?.kind === 'replace' && (
        <ExercisePickerModal
          title={`Sustituir «${dialog.pe.name}»`}
          onClose={() => setDialog(null)}
          onPick={async (ex) => {
            const ok = await run(
              () => service.replacePrescriptionExercise(dialog.pe.id, ex.id, relatedReportId ? 'ajuste tras tu reporte' : undefined, relatedReportId),
              `Sustituido por ${ex.title}. Se conservan los parámetros y el historial.`,
            );
            if (ok) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'remove' && (
        <ConfirmDialog
          title="Retirar ejercicio"
          danger
          confirmLabel="Retirar"
          message={`«${dialog.pe.name}» dejará de aparecer en la sesión. Se conserva en el historial y en los registros ya hechos.`}
          onCancel={() => setDialog(null)}
          onConfirm={async () => {
            if (await run(() => service.removePrescription(dialog.pe.id, undefined, relatedReportId), 'Ejercicio retirado.')) setDialog(null);
          }}
        />
      )}
      {dialog?.kind === 'add' && (
        <ExercisePickerModal
          title={`Añadir a «${dialog.session.title}»`}
          onClose={() => setDialog(null)}
          onPick={(ex) => setDialog({ kind: 'add-params', session: dialog.session, exercise: ex })}
        />
      )}
      {dialog?.kind === 'add-params' && (
        <PrescriptionEditModal
          title={`Parámetros · ${dialog.exercise.title}`}
          onClose={() => setDialog(null)}
          onSave={(params) => run(() => service.addPrescription(dialog.session.id, dialog.exercise.id, params), `${dialog.exercise.title} añadido.`)}
        />
      )}
    </div>
  );
}
