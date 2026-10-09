import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '../../state/DataContext';
import { Avatar, ClientStatusBadge, DemoBadge, EmptyState, ErrorBlock, LoadingBlock } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { ClientFormModal } from './ClientForm';
import { relativeTime } from '../../lib/plan';

type Filter = 'todos' | 'activo' | 'pausado' | 'inactivo' | 'pendientes' | 'recientes';

export default function ClientsPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const [q, setQ] = useState('');
  const filter = (params.get('estado') as Filter) ?? 'todos';
  const creating = params.get('nuevo') === '1';
  const data = useQuery(async (s) => {
    const [clients, reports, logs, plans] = await Promise.all([s.listClients(), s.listReports(), s.listWorkoutLogs(), s.listPlans()]);
    return { clients, reports, logs, plans };
  });
  useEffect(() => {
    document.title = 'Clientes — AF Team';
  }, []);

  const rows = useMemo(() => {
    if (!data.data) return [];
    const { clients, reports, logs, plans } = data.data;
    const weekAgo = Date.now() - 7 * 864e5;
    return clients
      .map((c) => {
        const pending = reports.filter((r) => r.clientId === c.id && r.status === 'pendiente').length;
        const last = logs.filter((l) => l.clientId === c.id).map((l) => l.completedAt ?? l.startedAt).sort().pop() ?? null;
        const plan = plans.find((p) => p.id === c.activePlanId);
        return { c, pending, last, plan, recent: last ? new Date(last).getTime() > weekAgo : false };
      })
      .filter(({ c, pending, recent }) => {
        if (q && !c.fullName.toLowerCase().includes(q.toLowerCase().trim())) return false;
        if (filter === 'pendientes') return pending > 0;
        if (filter === 'recientes') return recent;
        if (filter === 'todos') return true;
        return c.status === filter;
      })
      .sort((a, b) => b.pending - a.pending || a.c.fullName.localeCompare(b.c.fullName));
  }, [data.data, q, filter]);

  const setFilter = (f: Filter) => {
    const p = new URLSearchParams(params);
    if (f === 'todos') p.delete('estado');
    else p.set('estado', f);
    setParams(p, { replace: true });
  };
  const closeCreate = () => {
    const p = new URLSearchParams(params);
    p.delete('nuevo');
    setParams(p, { replace: true });
  };

  const filters: { id: Filter; label: string }[] = [
    { id: 'todos', label: 'Todos' },
    { id: 'activo', label: 'Activos' },
    { id: 'pausado', label: 'Pausados' },
    { id: 'inactivo', label: 'Inactivos' },
    { id: 'pendientes', label: 'Con reportes pendientes' },
    { id: 'recientes', label: 'Actividad reciente' },
  ];

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Gestión</span>
          <h1 className="page-title">Clientes</h1>
        </div>
        <button type="button" className="btn btn--gold" onClick={() => setParams({ nuevo: '1' })}>
          <Icon name="plus" size={18} /> Nuevo cliente
        </button>
      </div>
      <div className="toolbar">
        <label className="sr-only" htmlFor="client-search">
          Buscar cliente por nombre
        </label>
        <input id="client-search" className="input" type="search" placeholder="Buscar por nombre…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="chips" role="group" aria-label="Filtrar clientes" style={{ marginBottom: 16 }}>
        {filters.map((f) => (
          <button key={f.id} type="button" className="chip" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
            {f.label}
          </button>
        ))}
      </div>

      {data.error ? (
        <ErrorBlock error={data.error} onRetry={data.reload} />
      ) : !data.data ? (
        <LoadingBlock rows={4} />
      ) : rows.length === 0 ? (
        <EmptyState
          title={data.data.clients.length ? 'Ningún cliente coincide' : 'Aún no hay clientes'}
          action={
            data.data.clients.length ? undefined : (
              <button type="button" className="btn btn--gold" onClick={() => setParams({ nuevo: '1' })}>
                Crear el primero
              </button>
            )
          }
        >
          {data.data.clients.length ? 'Prueba con otro nombre o filtro.' : 'Crea un cliente para asignarle un plan.'}
        </EmptyState>
      ) : (
        <ul className="client-grid list" aria-label="Lista de clientes">
          {rows.map(({ c, pending, last, plan }) => (
            <li key={c.id}>
              <Link to={`/app/entrenador/clientes/${c.id}`} className={`card card-link client-card ${pending ? 'card--alert' : ''}`}>
                <div className="row" style={{ flexWrap: 'nowrap' }}>
                  <Avatar name={c.fullName} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p className="list-item__title">{c.fullName}</p>
                    <p className="small muted" style={{ overflowWrap: 'anywhere' }}>
                      {c.email}
                    </p>
                  </div>
                  <DemoBadge show={c.isDemo} />
                </div>
                <div className="row">
                  <ClientStatusBadge status={c.status} />
                  {pending > 0 && (
                    <span className="badge badge--danger">
                      {pending} reporte{pending > 1 ? 's' : ''} pendiente{pending > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
                <p className="small muted">
                  {plan ? `Plan: ${plan.name}` : 'Sin plan asignado'} · Última actividad: {last ? relativeTime(last) : '—'}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {creating && <ClientFormModal onClose={closeCreate} onSaved={(c) => navigate(`/app/entrenador/clientes/${c.id}`)} />}
    </div>
  );
}
