import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useService } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';
import { DemoBadge, EmptyState, ErrorBlock, Field, LoadingBlock, Notice } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { PlanView } from '../../components/plan/PlanView';
import type { PlanStatus, TrainingPlan } from '../../types/domain';
import { formatDate } from '../../lib/plan';

export default function PlanEditorPage() {
  const { id = '' } = useParams();
  const data = useQuery(
    async (s) => {
      const [plan, exercises, clients] = await Promise.all([s.getPlan(id), s.listExercises(), s.listClients()]);
      return { plan, exercises, clients };
    },
    [id],
  );
  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (!data.data) return <LoadingBlock rows={4} />;
  if (!data.data.plan)
    return (
      <EmptyState title="Plan no encontrado" action={<Link to="/app/entrenador/planes" className="btn">Volver</Link>}>
        No existe o no tienes acceso.
      </EmptyState>
    );
  return <Editor plan={data.data.plan} exercises={data.data.exercises} clients={data.data.clients} />;
}

function Editor({ plan, exercises, clients }: { plan: TrainingPlan; exercises: import('../../types/domain').Exercise[]; clients: import('../../types/domain').Client[] }) {
  const service = useService();
  const run = useAction();
  const navigate = useNavigate();
  const [meta, setMeta] = useState({ name: plan.name, description: plan.description, status: plan.status });
  const [clientId, setClientId] = useState('');
  useEffect(() => {
    document.title = `${plan.name} — AF Team`;
  }, [plan.name]);
  useEffect(() => setMeta({ name: plan.name, description: plan.description, status: plan.status }), [plan.name, plan.description, plan.status]);
  const client = clients.find((c) => c.id === plan.clientId);

  return (
    <div className="stack" style={{ ['--stack' as string]: '18px' }}>
      <div>
        <Link to="/app/entrenador/planes" className="breadcrumb">
          <Icon name="arrowLeft" size={16} /> Planes
        </Link>
        <div className="page-head" style={{ marginBottom: 0 }}>
          <div>
            <h1 className="page-title">{plan.name}</h1>
            <div className="row" style={{ marginTop: 6 }}>
              <span className="badge">{plan.clientId ? `Asignado a ${client?.fullName ?? 'cliente'}` : 'Plantilla'}</span>
              <DemoBadge show={plan.isDemo} />
              <span className="small muted">Actualizado {formatDate(plan.updatedAt, true)}</span>
            </div>
          </div>
        </div>
      </div>

      <section className="card stack">
        <div className="form-grid form-grid--2">
          <Field label="Nombre" htmlFor="pl-name">
            <input id="pl-name" className="input" maxLength={160} value={meta.name} onChange={(e) => setMeta({ ...meta, name: e.target.value })} />
          </Field>
          <Field label="Estado" htmlFor="pl-status">
            <select id="pl-status" className="select" value={meta.status} onChange={(e) => setMeta({ ...meta, status: e.target.value as PlanStatus })}>
              <option value="borrador">Borrador</option>
              <option value="activo">Activo</option>
              <option value="archivado">Archivado</option>
            </select>
          </Field>
          <Field label="Descripción" htmlFor="pl-desc" className="span-all">
            <textarea id="pl-desc" className="textarea" maxLength={2000} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn btn--gold" onClick={() => run(() => service.savePlanMeta(plan.id, meta), 'Plan actualizado.')}>
            Guardar datos del plan
          </button>
        </div>
      </section>

      {!plan.clientId && (
        <section className="card card--gold stack" aria-labelledby="assign-t">
          <h2 id="assign-t" className="card__title">
            Asignar a un cliente
          </h2>
          <p className="small muted">Se crea una copia independiente para el cliente; esta plantilla no cambia.</p>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <label className="sr-only" htmlFor="pl-client">
              Cliente
            </label>
            <select id="pl-client" className="select" value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">Elige un cliente…</option>
              {clients
                .filter((c) => c.status !== 'inactivo')
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn btn--gold"
              disabled={!clientId}
              onClick={async () => {
                if (await run(() => service.assignPlan(plan.id, clientId), 'Plan asignado. El cliente recibirá un aviso.')) {
                  navigate(`/app/entrenador/clientes/${clientId}?tab=rutina`);
                }
              }}
            >
              Asignar
            </button>
          </div>
        </section>
      )}

      {plan.importNotes.length > 0 && (
        <details className="card">
          <summary className="card__title" style={{ cursor: 'pointer', minHeight: 32 }}>
            Notas de importación ({plan.importNotes.length})
          </summary>
          <ul className="flags" style={{ marginTop: 10 }}>
            {plan.importNotes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </details>
      )}
      {plan.isDemo && !plan.clientId && (
        <Notice kind="warn" icon="!">
          Datos de ejemplo importados del Excel. Las cargas con varios valores se conservan como texto: revísalas antes de asignar.
        </Notice>
      )}

      <PlanView plan={plan} exercises={exercises} mode="trainer" />
    </div>
  );
}
