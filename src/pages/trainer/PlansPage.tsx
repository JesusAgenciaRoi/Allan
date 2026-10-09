import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useService } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';
import { DemoBadge, EmptyState, ErrorBlock, LoadingBlock, Notice } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { allWeeks } from '../../lib/plan';
import type { TrainingPlan } from '../../types/domain';

export default function PlansPage() {
  const service = useService();
  const run = useAction();
  const navigate = useNavigate();
  const [importing, setImporting] = useState(false);
  const data = useQuery(async (s) => {
    const [plans, clients] = await Promise.all([s.listPlans(), s.listClients()]);
    return { plans, clients };
  });
  useEffect(() => {
    document.title = 'Planes — AF Team';
  }, []);

  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (!data.data) return <LoadingBlock rows={3} />;
  const { plans, clients } = data.data;
  const templates = plans.filter((p) => !p.clientId);
  const assigned = plans.filter((p) => p.clientId);
  const clientName = (id: string | null) => clients.find((c) => c.id === id)?.fullName ?? '—';

  const PlanCard = ({ p }: { p: TrainingPlan }) => {
    const weeks = allWeeks(p);
    const sessions = weeks.reduce((n, w) => n + w.week.sessions.length, 0);
    return (
      <li className="card stack" style={{ ['--stack' as string]: '10px' }}>
        <div className="row row--between">
          <h3 className="card__title" style={{ fontSize: '1.1rem' }}>
            {p.name}
          </h3>
          <div className="row" style={{ gap: 6 }}>
            <span className={`badge ${p.status === 'activo' ? 'badge--ok' : p.status === 'archivado' ? '' : 'badge--warn'}`}>{p.status}</span>
            <DemoBadge show={p.isDemo} />
          </div>
        </div>
        <p className="small muted">
          {p.mesocycles.flatMap((m) => m.phases).map((ph) => ph.name).join(' → ')} · {weeks.length} semanas · {sessions} sesiones definidas
        </p>
        {p.clientId && <p className="small">Cliente: {clientName(p.clientId)}</p>}
        {p.source && <p className="small muted">Origen: {p.source}</p>}
        <div className="row">
          <Link to={`/app/entrenador/planes/${p.id}`} className="btn btn--sm btn--outline-gold">
            <Icon name="edit" size={14} /> {p.clientId ? 'Ver / editar' : 'Revisar y editar'}
          </Link>
          <button
            type="button"
            className="btn btn--sm"
            onClick={async () => {
              let copy: TrainingPlan | undefined;
              const ok = await run(async () => {
                copy = await service.duplicatePlan(p.id, `${p.name} (copia)`);
              }, 'Plan duplicado como plantilla.');
              if (ok && copy) navigate(`/app/entrenador/planes/${copy.id}`);
            }}
          >
            Duplicar como plantilla
          </button>
        </div>
      </li>
    );
  };

  return (
    <div className="stack" style={{ ['--stack' as string]: '22px' }}>
      <div className="page-head">
        <div>
          <span className="eyebrow">Programación</span>
          <h1 className="page-title">Planes de entrenamiento</h1>
          <p className="page-sub">Plantillas → revisar → asignar a un cliente (se crea una copia propia).</p>
        </div>
        {service.importSampleData && (
          <button
            type="button"
            className="btn btn--outline-gold"
            disabled={importing}
            onClick={async () => {
              setImporting(true);
              await run(() => service.importSampleData!(), 'Biblioteca y plan de ejemplo importados a tu cuenta.');
              setImporting(false);
            }}
          >
            {importing && <span className="spinner" aria-hidden="true" />}
            Importar plan de ejemplo (Excel)
          </button>
        )}
      </div>
      <Notice>
        La plantilla importada del Excel es un <strong>ejemplo</strong>, no una rutina por defecto. Revisa los avisos de importación
        (cargas con varios valores, tempos, columnas G/H) antes de asignarla. Informe completo: <code>docs/EXCEL_IMPORT_REPORT.md</code>.
      </Notice>
      <section aria-labelledby="tpl-t" className="stack">
        <h2 id="tpl-t" className="card__title">
          Plantillas ({templates.length})
        </h2>
        {templates.length ? (
          <ul className="list client-grid">
            {templates.map((p) => (
              <PlanCard key={p.id} p={p} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Sin plantillas">Importa el plan de ejemplo o duplica un plan asignado.</EmptyState>
        )}
      </section>
      <section aria-labelledby="as-t" className="stack">
        <h2 id="as-t" className="card__title">
          Asignados a clientes ({assigned.length})
        </h2>
        {assigned.length ? (
          <ul className="list client-grid">
            {assigned.map((p) => (
              <PlanCard key={p.id} p={p} />
            ))}
          </ul>
        ) : (
          <EmptyState title="Ningún plan asignado">Asigna una plantilla desde la ficha de un cliente o desde el editor del plan.</EmptyState>
        )}
      </section>
    </div>
  );
}
