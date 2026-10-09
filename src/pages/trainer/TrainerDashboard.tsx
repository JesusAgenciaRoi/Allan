import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useData, useQuery } from '../../state/DataContext';
import { EmptyState, ErrorBlock, LevelBadge, LoadingBlock, Notice, ReportStatusBadge } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { relativeTime } from '../../lib/plan';
import { reportTypeLabel } from '../../content/muscleGroups';
import { useToast } from '../../state/ToastContext';

export default function TrainerDashboard() {
  const { service, profile } = useData();
  const toast = useToast();
  const data = useQuery(async (s) => {
    const [clients, reports, logs, activity] = await Promise.all([
      s.listClients(),
      s.listReports(),
      s.listWorkoutLogs(),
      s.getActivity(),
    ]);
    return { clients, reports, logs, activity };
  });
  useEffect(() => {
    document.title = 'Panel del entrenador — AF Team';
  }, []);

  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (!data.data) return <LoadingBlock rows={4} />;
  const { clients, reports, logs, activity } = data.data;
  const name = (id: string) => clients.find((c) => c.id === id)?.fullName ?? 'Cliente';
  const active = clients.filter((c) => c.status === 'activo').length;
  const weekAgo = Date.now() - 7 * 864e5;
  const recentSessions = logs.filter((l) => l.status === 'completada' && new Date(l.completedAt ?? 0).getTime() > weekAgo).length;
  const pending = reports.filter((r) => r.status === 'pendiente');
  const painAlerts = pending.filter((r) => ['molestia', 'dolor', 'limitacion'].includes(r.type));

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px' }}>
      <div className="page-head">
        <div>
          <span className="eyebrow">Panel del entrenador</span>
          <h1 className="page-title">Hola, {profile?.fullName.split(' ')[0]}</h1>
        </div>
        <p className="small muted" style={{ maxWidth: 360 }}>
          {service?.liveUpdatesLabel}
        </p>
      </div>

      {/* Molestias primero: flujo prioritario */}
      {painAlerts.length > 0 && (
        <section className="card card--alert stack" aria-labelledby="alerts-t">
          <div className="card__head" style={{ marginBottom: 0 }}>
            <h2 id="alerts-t" className="card__title">
              <Icon name="alert" size={20} className="gold" /> Molestias nuevas ({painAlerts.length})
            </h2>
            <Link to="/app/entrenador/reportes?estado=pendiente" className="btn btn--sm btn--danger">
              Revisar todas
            </Link>
          </div>
          <ul className="list">
            {painAlerts.slice(0, 4).map((r) => (
              <li key={r.id}>
                <Link to={`/app/entrenador/reportes?id=${r.id}`} className="list-item list-item--highlight">
                  <span className="list-item__icon list-item__icon--danger">
                    <Icon name="alert" />
                  </span>
                  <span className="list-item__body">
                    <span className="list-item__title">
                      {name(r.clientId)} · {reportTypeLabel(r.type)} {r.bodyArea && `· ${r.bodyArea}`}
                    </span>
                    <span className="list-item__meta">
                      {r.exerciseName ? `${r.exerciseName} · ` : ''}
                      {relativeTime(r.createdAt)}
                    </span>
                  </span>
                  <LevelBadge level={r.level} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="stats">
        <Link to="/app/entrenador/clientes?estado=activo" className="stat stat--gold">
          <span className="stat__value">{active}</span>
          <span className="stat__label">Clientes activos</span>
        </Link>
        <Link to="/app/entrenador/clientes" className="stat">
          <span className="stat__value">{recentSessions}</span>
          <span className="stat__label">Sesiones (7 días)</span>
        </Link>
        <Link to="/app/entrenador/reportes?estado=pendiente" className={`stat ${pending.length ? 'stat--alert' : ''}`}>
          <span className="stat__value">{pending.length}</span>
          <span className="stat__label">Reportes pendientes</span>
        </Link>
        <Link to="/app/entrenador/reportes?estado=pendiente" className={`stat ${painAlerts.length ? 'stat--alert' : ''}`}>
          <span className="stat__value">{painAlerts.length}</span>
          <span className="stat__label">Alertas de molestias</span>
        </Link>
      </div>

      <section aria-labelledby="quick-t">
        <h2 id="quick-t" className="sr-only">
          Accesos rápidos
        </h2>
        <div className="quick-actions">
          <Link to="/app/entrenador/clientes?nuevo=1" className="btn btn--gold">
            <Icon name="plus" size={18} /> Crear cliente
          </Link>
          <Link to="/app/entrenador/planes" className="btn btn--outline-gold">
            <Icon name="calendar" size={18} /> Asignar rutina
          </Link>
          <Link to="/app/entrenador/ejercicios/nuevo" className="btn btn--outline-gold">
            <Icon name="upload" size={18} /> Subir ejercicio
          </Link>
        </div>
      </section>

      <div className="grid-2">
        <section className="card" aria-labelledby="act-t">
          <div className="card__head">
            <h2 id="act-t" className="card__title">
              Actividad reciente
            </h2>
          </div>
          {activity.length === 0 ? (
            <EmptyState title="Sin actividad todavía">
              Cuando tus clientes registren sesiones o envíen reportes, aparecerán aquí.
            </EmptyState>
          ) : (
            <ul className="list">
              {activity.slice(0, 10).map((a) => (
                <li key={a.id}>
                  <Link to={a.link} className={`list-item ${a.highlight ? 'list-item--highlight' : ''}`}>
                    <span className={`list-item__icon ${a.kind === 'reporte' ? 'list-item__icon--danger' : ''}`}>
                      <Icon name={a.kind === 'reporte' ? 'alert' : a.kind === 'sesion' ? 'check' : a.kind === 'respuesta' ? 'chat' : 'edit'} />
                    </span>
                    <span className="list-item__body">
                      <span className="list-item__title">
                        {a.clientName} <span className="muted">{a.text}</span>
                      </span>
                      <span className="list-item__meta">{relativeTime(a.at)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card" aria-labelledby="rep-t">
          <div className="card__head">
            <h2 id="rep-t" className="card__title">
              Reportes abiertos
            </h2>
            <Link to="/app/entrenador/reportes" className="btn btn--sm btn--ghost">
              Ver todos
            </Link>
          </div>
          {reports.filter((r) => r.status !== 'respondido').length === 0 ? (
            <EmptyState title="Todo al día">No hay reportes pendientes de revisar.</EmptyState>
          ) : (
            <ul className="list">
              {reports
                .filter((r) => r.status !== 'respondido')
                .slice(0, 6)
                .map((r) => (
                  <li key={r.id}>
                    <Link to={`/app/entrenador/reportes?id=${r.id}`} className="list-item">
                      <span className="list-item__body">
                        <span className="list-item__title">
                          {name(r.clientId)} · {reportTypeLabel(r.type)}
                        </span>
                        <span className="list-item__meta">{relativeTime(r.createdAt)}</span>
                      </span>
                      <ReportStatusBadge status={r.status} />
                    </Link>
                  </li>
                ))}
            </ul>
          )}
        </section>
      </div>

      {clients.length === 0 && (
        <Notice>
          Aún no tienes clientes. Crea el primero con «Crear cliente».
          {service?.importSampleData && (
            <>
              {' '}
              También puedes{' '}
              <button
                type="button"
                className="link-btn"
                onClick={async () => {
                  try {
                    await service.importSampleData!();
                    toast('success', 'Biblioteca y plan de ejemplo importados.');
                  } catch (e) {
                    toast('error', (e as Error).message);
                  }
                }}
              >
                importar la biblioteca y el plan de ejemplo del Excel
              </button>
              .
            </>
          )}
        </Notice>
      )}
    </div>
  );
}
