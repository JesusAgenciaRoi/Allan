import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useData, useQuery } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';
import {
  Avatar,
  ClientStatusBadge,
  DemoBadge,
  EmptyState,
  ErrorBlock,
  KV,
  LevelBadge,
  LoadingBlock,
  Notice,
  ReportStatusBadge,
} from '../../components/ui';
import { Icon } from '../../components/Icon';
import { PlanView } from '../../components/plan/PlanView';
import { LogDetail } from '../../components/LogDetail';
import { ClientFormModal } from './ClientForm';
import { currentWeek, findPrescription, formatDate, relativeTime } from '../../lib/plan';
import { reportTypeLabel } from '../../content/muscleGroups';

const TABS = [
  { id: 'resumen', label: 'Resumen' },
  { id: 'rutina', label: 'Rutina' },
  { id: 'sesiones', label: 'Sesiones' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'cambios', label: 'Cambios' },
] as const;
type Tab = (typeof TABS)[number]['id'];

export default function ClientDetailPage() {
  const { id = '' } = useParams();
  const [params, setParams] = useSearchParams();
  const tab = (params.get('tab') as Tab) ?? 'resumen';
  const { service } = useData();
  const run = useAction();
  const [editing, setEditing] = useState(false);
  const [assignId, setAssignId] = useState('');
  const data = useQuery(
    async (s) => {
      const client = await s.getClient(id);
      if (!client) return null;
      const [plans, exercises, logs, reports] = await Promise.all([s.listPlans(), s.listExercises(), s.listWorkoutLogs(id), s.listReports({ clientId: id })]);
      const plan = plans.find((p) => p.id === client.activePlanId) ?? null;
      const changes = plan ? await s.listPlanChanges(plan.id) : [];
      return { client, plans, exercises, logs, reports, plan, changes };
    },
    [id],
  );
  useEffect(() => {
    if (data.data?.client) document.title = `${data.data.client.fullName} — AF Team`;
  }, [data.data?.client]);

  const reportedPeIds = useMemo(
    () => new Set((data.data?.reports ?? []).filter((r) => r.status !== 'respondido' && r.prescribedExerciseId).map((r) => r.prescribedExerciseId!)),
    [data.data?.reports],
  );

  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (data.data === undefined) return <LoadingBlock rows={4} />;
  if (data.data === null)
    return (
      <EmptyState title="Cliente no encontrado" action={<Link to="/app/entrenador/clientes" className="btn">Volver a clientes</Link>}>
        No existe o no tienes acceso.
      </EmptyState>
    );
  const { client, plans, exercises, logs, reports, plan, changes } = data.data;
  const templates = plans.filter((p) => p.clientId === null && p.status !== 'archivado');
  const pastPlans = plans.filter((p) => p.clientId === client.id && p.id !== plan?.id);
  const cw = plan ? currentWeek(plan) : null;
  const pending = reports.filter((r) => r.status === 'pendiente').length;

  // Progresión de cargas: máximo peso registrado por ejercicio y sesión.
  const progression = (() => {
    const map = new Map<string, { name: string; points: { date: string; best: number }[] }>();
    for (const l of [...logs].reverse()) {
      if (l.status !== 'completada') continue;
      const pl = plans.find((p) => p.id === l.planId);
      for (const ex of l.exercises) {
        const pe = pl ? findPrescription(pl, ex.prescribedExerciseId)?.pe : undefined;
        const key = pe?.exerciseId ?? pe?.name;
        const best = Math.max(...ex.sets.map((s) => Number.parseFloat(s.weight.replace(',', '.'))).filter((n) => Number.isFinite(n)));
        if (!key || !Number.isFinite(best)) continue;
        const entry = map.get(key) ?? { name: pe!.name, points: [] };
        entry.points.push({ date: l.completedAt ?? l.startedAt, best });
        map.set(key, entry);
      }
    }
    return [...map.values()].filter((e) => e.points.length > 0);
  })();

  return (
    <div>
      <Link to="/app/entrenador/clientes" className="breadcrumb">
        <Icon name="arrowLeft" size={16} /> Clientes
      </Link>
      <div className="page-head">
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <Avatar name={client.fullName} />
          <div>
            <h1 className="page-title">{client.fullName}</h1>
            <div className="row" style={{ marginTop: 6 }}>
              <ClientStatusBadge status={client.status} />
              {pending > 0 && <span className="badge badge--danger">{pending} reporte(s) pendiente(s)</span>}
              <DemoBadge show={client.isDemo} />
            </div>
          </div>
        </div>
        <button type="button" className="btn" onClick={() => setEditing(true)}>
          <Icon name="edit" size={16} /> Editar ficha
        </button>
      </div>

      <div className="tabs" role="tablist" aria-label="Secciones de la ficha">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            className="tab"
            aria-selected={tab === t.id}
            onClick={() => setParams({ tab: t.id }, { replace: true })}
          >
            {t.label}
            {t.id === 'reportes' && pending > 0 ? ` (${pending})` : ''}
          </button>
        ))}
      </div>

      {tab === 'resumen' && (
        <div className="grid-2">
          <section className="card stack">
            <h2 className="card__title">Ficha</h2>
            <div className="kv">
              <KV k="Correo" v={client.email} />
              <KV k="Teléfono" v={client.phone} />
              <KV k="Alta" v={formatDate(client.startDate)} />
              <KV k="Cuenta app" v={client.userId ? 'Vinculada' : 'Sin cuenta'} />
            </div>
            <div>
              <p className="field__label">Notas administrativas (privadas)</p>
              <p className="muted" style={{ whiteSpace: 'pre-wrap' }}>
                {client.adminNotes || 'Sin notas.'}
              </p>
            </div>
            {!client.userId &&
              (service?.inviteClient ? (
                <button type="button" className="btn btn--outline-gold" onClick={() => run(() => service.inviteClient!(client.id), 'Invitación enviada por correo.')}>
                  Invitar a la app por correo
                </button>
              ) : (
                <Notice kind="plain">
                  En modo demo no se envían invitaciones. Con Supabase, el botón «Invitar» envía un correo (Edge Function «invite-client»).
                </Notice>
              ))}
          </section>
          <section className="card stack">
            <h2 className="card__title">Plan y progreso</h2>
            {plan ? (
              <>
                <p>
                  <strong>{plan.name}</strong>
                </p>
                <p className="muted small">
                  {cw ? `Fase ${cw.phase.name} · Semana ${cw.week.number} (${cw.week.scheme ?? 'sin esquema'})` : 'Sin semana actual'}
                </p>
                <button type="button" className="btn btn--outline-gold" onClick={() => setParams({ tab: 'rutina' })}>
                  Ver y editar rutina
                </button>
              </>
            ) : (
              <p className="muted">Sin plan asignado.</p>
            )}
            <div className="field">
              <label className="field__label" htmlFor="assign">
                {plan ? 'Asignar otro plan (el actual se archiva)' : 'Asignar plan'}
              </label>
              <div className="row" style={{ flexWrap: 'nowrap' }}>
                <select id="assign" className="select" value={assignId} onChange={(e) => setAssignId(e.target.value)}>
                  <option value="">Elige una plantilla…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn btn--gold"
                  disabled={!assignId}
                  onClick={async () => {
                    if (await run(() => service!.assignPlan(assignId, client.id), 'Plan asignado. El cliente recibirá un aviso.')) setAssignId('');
                  }}
                >
                  Asignar
                </button>
              </div>
              <span className="field__hint">Se crea una copia para este cliente: editarla no cambia la plantilla.</span>
            </div>
            {pastPlans.length > 0 && <p className="small muted">Planes anteriores conservados: {pastPlans.map((p) => p.name).join(', ')}</p>}
            {progression.length > 0 && (
              <div>
                <p className="field__label">Progresión de cargas (máximo registrado)</p>
                <ul className="list">
                  {progression.slice(0, 6).map((p) => (
                    <li key={p.name} className="list-item">
                      <span className="list-item__body">
                        <span className="list-item__title">{p.name}</span>
                        <span className="list-item__meta">{p.points.map((x) => `${x.best} kg`).join(' → ')}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'rutina' &&
        (plan ? (
          <PlanView plan={plan} exercises={exercises} mode="trainer" reportedPeIds={reportedPeIds} focusPeId={params.get('pe')} relatedReportId={params.get('reporte')} />
        ) : (
          <EmptyState title="Sin plan asignado">Asigna una plantilla desde la pestaña Resumen.</EmptyState>
        ))}

      {tab === 'sesiones' &&
        (logs.length === 0 ? (
          <EmptyState title="Sin sesiones registradas">Cuando el cliente registre entrenamientos aparecerán aquí.</EmptyState>
        ) : (
          <div className="stack">
            {logs.map((l) => (
              <details key={l.id} className="session-block">
                <summary>
                  <span>
                    <span className="session-block__title">
                      Semana {l.weekNumber ?? '—'} · {l.sessionTitle}
                    </span>
                    <span className="small muted"> · {relativeTime(l.completedAt ?? l.startedAt)}</span>
                  </span>
                  <span className={`badge ${l.status === 'completada' ? 'badge--ok' : 'badge--warn'}`}>{l.status === 'completada' ? 'Completada' : 'En progreso'}</span>
                </summary>
                <div className="session-block__body">
                  <LogDetail log={l} plans={plans} />
                </div>
              </details>
            ))}
          </div>
        ))}

      {tab === 'reportes' &&
        (reports.length === 0 ? (
          <EmptyState title="Sin reportes">El cliente no ha informado molestias ni dificultades.</EmptyState>
        ) : (
          <ul className="list">
            {reports.map((r) => (
              <li key={r.id}>
                <Link to={`/app/entrenador/reportes?id=${r.id}`} className={`list-item ${r.status === 'pendiente' ? 'list-item--highlight' : ''}`}>
                  <span className="list-item__body">
                    <span className="list-item__title">
                      {reportTypeLabel(r.type)} {r.bodyArea && `· ${r.bodyArea}`} {r.exerciseName && `· ${r.exerciseName}`}
                    </span>
                    <span className="list-item__meta">
                      {formatDate(r.createdAt, true)} · {r.description.slice(0, 90)}
                      {r.description.length > 90 ? '…' : ''}
                    </span>
                    {r.responses.length > 0 && <span className="list-item__meta gold">Respuesta: {r.responses[r.responses.length - 1].message.slice(0, 80)}</span>}
                  </span>
                  <span className="stack" style={{ ['--stack' as string]: '4px', justifyItems: 'end' }}>
                    <ReportStatusBadge status={r.status} />
                    <LevelBadge level={r.level} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ))}

      {tab === 'cambios' &&
        (changes.length === 0 ? (
          <EmptyState title="Sin cambios registrados" />
        ) : (
          <ul className="list">
            {changes.map((c) => (
              <li key={c.id} className="list-item">
                <span className="list-item__icon">
                  <Icon name={c.kind === 'retirado' ? 'trash' : c.kind === 'sustituido' ? 'swap' : 'edit'} />
                </span>
                <span className="list-item__body">
                  <span className="list-item__title">{c.summary}</span>
                  <span className="list-item__meta">
                    {formatDate(c.createdAt, true)}
                    {c.relatedReportId && ' · vinculado a un reporte'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ))}

      {editing && <ClientFormModal client={client} onClose={() => setEditing(false)} onSaved={() => setEditing(false)} />}
    </div>
  );
}
