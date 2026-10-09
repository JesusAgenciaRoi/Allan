import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useClientData } from './useClientData';
import { DemoBadge, EmptyState, ErrorBlock, LoadingBlock } from '../../components/ui';
import { LogDetail } from '../../components/LogDetail';
import { relativeTime } from '../../lib/plan';

export default function HistoryPage() {
  const data = useClientData();
  useEffect(() => {
    document.title = 'Historial — AF Team';
  }, []);
  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (data.data === undefined) return <LoadingBlock rows={4} />;
  if (!data.data) return <EmptyState title="Cuenta no vinculada" />;
  const { logs, plans } = data.data;
  const completed = logs.filter((l) => l.status === 'completada');
  const last30 = completed.filter((l) => Date.now() - new Date(l.completedAt ?? 0).getTime() < 30 * 864e5).length;
  const sets = completed.reduce((n, l) => n + l.exercises.reduce((m, e) => m + e.sets.filter((s) => s.done).length, 0), 0);

  return (
    <div className="stack" style={{ ['--stack' as string]: '18px' }}>
      <div>
        <span className="eyebrow">Progreso</span>
        <h1 className="page-title">Historial</h1>
      </div>
      <div className="stats">
        <div className="stat stat--gold">
          <span className="stat__value">{completed.length}</span>
          <span className="stat__label">Sesiones completadas</span>
        </div>
        <div className="stat">
          <span className="stat__value">{last30}</span>
          <span className="stat__label">Últimos 30 días</span>
        </div>
        <div className="stat">
          <span className="stat__value">{sets}</span>
          <span className="stat__label">Series registradas</span>
        </div>
        <div className="stat">
          <span className="stat__value">{logs.length - completed.length}</span>
          <span className="stat__label">En progreso</span>
        </div>
      </div>
      {logs.length === 0 ? (
        <EmptyState title="Aún no has registrado sesiones" action={<Link to="/app/cliente" className="btn btn--gold">Ir al entrenamiento de hoy</Link>} />
      ) : (
        logs.map((l) => (
          <details key={l.id} className="session-block">
            <summary>
              <span>
                <span className="session-block__title">
                  Semana {l.weekNumber ?? '—'} · {l.sessionTitle}
                </span>
                <span className="small muted"> · {relativeTime(l.completedAt ?? l.startedAt)}</span>
              </span>
              <span className="row" style={{ gap: 6 }}>
                <DemoBadge show={l.isDemo} />
                <span className={`badge ${l.status === 'completada' ? 'badge--ok' : 'badge--warn'}`}>{l.status === 'completada' ? 'Completada' : 'En progreso'}</span>
              </span>
            </summary>
            <div className="session-block__body">
              {l.status === 'en_progreso' && (
                <Link to={`/app/cliente/sesion/${l.sessionId}`} className="btn btn--sm btn--outline-gold">
                  Continuar registro
                </Link>
              )}
              <LogDetail log={l} plans={plans} />
            </div>
          </details>
        ))
      )}
    </div>
  );
}
