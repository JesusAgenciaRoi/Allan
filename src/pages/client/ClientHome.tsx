import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClientData } from './useClientData';
import { EmptyState, ErrorBlock, LoadingBlock, ReportStatusBadge } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { ExerciseMediaView } from '../../components/ExerciseMediaView';
import { PrescriptionParamsGrid } from '../../components/plan/PrescriptionCard';
import { activeExercises, nextSession, relativeTime } from '../../lib/plan';
import { reportTypeLabel } from '../../content/muscleGroups';

export default function ClientHome() {
  const data = useClientData();
  useEffect(() => {
    document.title = 'Hoy — AF Team';
  }, []);
  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (data.data === undefined) return <LoadingBlock rows={4} />;
  if (data.data === null) return <EmptyState title="Tu cuenta aún no está vinculada">Pide a tu entrenador que te dé de alta como cliente.</EmptyState>;
  const { client, plan, exercises, logs, reports, changes } = data.data;
  const exById = new Map(exercises.map((e) => [e.id, e]));
  const next = plan ? nextSession(plan, logs.filter((l) => l.planId === plan.id)) : null;
  const inProgress = next?.session ? logs.find((l) => l.sessionId === next.session!.id && l.status === 'en_progreso') : undefined;
  const list = next?.session ? activeExercises(next.session) : [];
  const nextEx = list.find((e) => e.stage !== 'calentamiento') ?? list[0];
  const total = next?.week.sessions.length ?? 0;
  const pct = total ? Math.round(((next?.completedCount ?? 0) / total) * 100) : 0;
  const lastResponses = reports.filter((r) => r.responses.length).slice(0, 2);

  return (
    <div className="stack" style={{ ['--stack' as string]: '18px' }}>
      <div>
        <span className="eyebrow">Hola, {client.fullName.split(' ')[0]}</span>
        <h1 className="page-title">Tu entrenamiento</h1>
      </div>

      {!plan ? (
        <EmptyState title="Sin plan asignado">Tu entrenador todavía no te ha asignado un plan. Te avisaremos cuando lo haga.</EmptyState>
      ) : !next ? (
        <EmptyState title="Plan completado">Has terminado todas las semanas de tu plan. ¡Buen trabajo!</EmptyState>
      ) : (
        <section className="today" aria-labelledby="today-t">
          <div className="row row--between" style={{ flexWrap: 'nowrap', alignItems: 'flex-start' }}>
            <div>
              <span className="eyebrow">
                Semana {next.week.number} · {next.phase.name}
              </span>
              <h2 id="today-t" className="today__title">
                {next.session ? next.session.title : 'Semana completada'}
              </h2>
              <p className="small muted">
                Entrenamiento de hoy = siguiente sesión pendiente de la semana · esquema {next.week.scheme ?? '—'}
              </p>
            </div>
            <div className="ring" style={{ ['--p' as string]: pct }} role="img" aria-label={`${next.completedCount} de ${total} sesiones de la semana completadas`}>
              <span className="ring__label">
                {next.completedCount}/{total}
              </span>
            </div>
          </div>
          {next.session ? (
            <>
              {nextEx && (
                <div className="next-ex">
                  <ExerciseMediaView media={nextEx.exerciseId ? exById.get(nextEx.exerciseId)?.media : null} title={nextEx.name} aspect="1 / 1" />
                  <div style={{ minWidth: 0 }}>
                    <p className="small gold">Siguiente ejercicio</p>
                    <p style={{ fontWeight: 700 }}>{nextEx.name}</p>
                    <p className="small muted">
                      {nextEx.sets ?? '—'} × {nextEx.reps ?? '—'} · {nextEx.load ?? 'sin peso'} · {nextEx.rirRpe ?? ''}
                    </p>
                  </div>
                </div>
              )}
              <Link to={`/app/cliente/sesion/${next.session.id}`} className="btn btn--gold btn--lg btn--block">
                <Icon name="play" size={18} /> {inProgress ? 'Continuar sesión' : 'Empezar sesión'}
              </Link>
            </>
          ) : (
            <p className="muted">Has completado todas las sesiones de esta semana. Tu entrenador marcará la siguiente.</p>
          )}
        </section>
      )}

      <Link to="/app/cliente/reportes?nuevo=1" className="card card-link card--alert row" style={{ flexWrap: 'nowrap' }}>
        <span className="list-item__icon list-item__icon--danger">
          <Icon name="alert" />
        </span>
        <span style={{ flex: 1 }}>
          <span className="card__title" style={{ fontSize: '1.1rem' }}>
            Informar molestia o dificultad
          </span>
          <span className="small muted" style={{ display: 'block' }}>
            Dolor, fatiga, limitaciones… tu entrenador lo verá al momento.
          </span>
        </span>
        <Icon name="arrowRight" size={20} />
      </Link>

      {next?.session && list.length > 0 && (
        <section className="card stack" aria-labelledby="preview-t">
          <h2 id="preview-t" className="card__title">
            Vista previa de la sesión
          </h2>
          <ul className="list">
            {list.map((pe) => (
              <li key={pe.id} className="list-item">
                <span className="list-item__body">
                  <span className="list-item__title">{pe.name}</span>
                  <PrescriptionParamsGrid pe={pe} />
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid-2 grid-2--even">
        <section className="card stack" aria-labelledby="changes-t">
          <h2 id="changes-t" className="card__title">
            Cambios recientes en tu rutina
          </h2>
          {changes.length === 0 ? (
            <p className="muted">Sin cambios.</p>
          ) : (
            <ul className="list">
              {changes.slice(0, 4).map((c) => (
                <li key={c.id} className="list-item">
                  <span className="list-item__icon">
                    <Icon name={c.kind === 'sustituido' ? 'swap' : c.kind === 'retirado' ? 'trash' : 'edit'} />
                  </span>
                  <span className="list-item__body">
                    <span className="list-item__title">{c.summary}</span>
                    <span className="list-item__meta">{relativeTime(c.createdAt)}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card stack" aria-labelledby="resp-t">
          <h2 id="resp-t" className="card__title">
            Respuestas de tu entrenador
          </h2>
          {lastResponses.length === 0 ? (
            <p className="muted">Todavía no hay respuestas.</p>
          ) : (
            <ul className="list">
              {lastResponses.map((r) => (
                <li key={r.id}>
                  <Link to="/app/cliente/reportes" className="list-item">
                    <span className="list-item__body">
                      <span className="list-item__title">
                        {reportTypeLabel(r.type)} {r.bodyArea && `· ${r.bodyArea}`}
                      </span>
                      <span className="list-item__meta gold">«{r.responses[r.responses.length - 1].message}»</span>
                    </span>
                    <ReportStatusBadge status={r.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
