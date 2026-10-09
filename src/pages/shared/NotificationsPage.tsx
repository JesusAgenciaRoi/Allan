import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData, useQuery } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';
import { DemoBadge, EmptyState, ErrorBlock, LoadingBlock } from '../../components/ui';
import { Icon, type IconName } from '../../components/Icon';
import { formatDate, relativeTime } from '../../lib/plan';
import type { NotificationType } from '../../types/domain';

const ICON: Record<NotificationType, IconName> = { reporte: 'alert', sesion_completada: 'check', respuesta: 'chat', rutina: 'edit' };
const LABEL: Record<NotificationType, string> = {
  reporte: 'Reporte',
  sesion_completada: 'Sesión completada',
  respuesta: 'Respuesta del entrenador',
  rutina: 'Rutina',
};

export default function NotificationsPage() {
  const { service } = useData();
  const run = useAction();
  const navigate = useNavigate();
  const list = useQuery((s) => s.listNotifications());
  useEffect(() => {
    document.title = 'Notificaciones — AF Team';
  }, []);
  const unread = list.data?.filter((n) => !n.readAt).length ?? 0;

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Bandeja</span>
          <h1 className="page-title">Notificaciones</h1>
          <p className="page-sub small">{service?.liveUpdatesLabel} No se envían notificaciones push al sistema operativo.</p>
        </div>
        <button type="button" className="btn btn--sm" disabled={!unread} onClick={() => run(() => service!.markAllNotificationsRead(), 'Todas marcadas como leídas.')}>
          <Icon name="check" size={16} /> Marcar todas como leídas
        </button>
      </div>
      {list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <LoadingBlock rows={4} />
      ) : list.data.length === 0 ? (
        <EmptyState title="Sin notificaciones">Aquí verás reportes, sesiones completadas, respuestas y cambios de rutina.</EmptyState>
      ) : (
        <ul className="list">
          {list.data.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                className={`list-item ${n.readAt ? '' : 'list-item--unread'} ${!n.readAt && n.type === 'reporte' ? 'list-item--highlight' : ''}`}
                style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }}
                onClick={async () => {
                  if (!n.readAt) await service!.markNotificationRead(n.id);
                  if (n.link) navigate(n.link);
                }}
              >
                <span className={`list-item__icon ${n.type === 'reporte' ? 'list-item__icon--danger' : ''}`}>
                  <Icon name={ICON[n.type]} />
                </span>
                <span className="list-item__body">
                  <span className="list-item__title">
                    {!n.readAt && <span className="sr-only">No leída: </span>}
                    {n.title}
                  </span>
                  <span className="list-item__meta">{n.body}</span>
                  <span className="list-item__meta" title={formatDate(n.createdAt, true)}>
                    {LABEL[n.type]} · {relativeTime(n.createdAt)}
                  </span>
                </span>
                <span className="stack" style={{ ['--stack' as string]: '4px', justifyItems: 'end' }}>
                  {!n.readAt && <span className="badge badge--gold">Nueva</span>}
                  <DemoBadge show={n.isDemo} />
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
