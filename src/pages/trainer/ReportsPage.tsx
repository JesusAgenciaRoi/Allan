import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useService } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';
import { EmptyState, ErrorBlock, Field, LevelBadge, LoadingBlock, ReportStatusBadge, DemoBadge } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { SafetyNotice } from '../../components/SafetyNotice';
import { REPORT_TYPES, reportTypeLabel } from '../../content/muscleGroups';
import { formatDate, relativeTime } from '../../lib/plan';
import type { ReportFilter } from '../../services/types';
import type { WellbeingReport } from '../../types/domain';

export default function ReportsPage() {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get('id');
  const filter: ReportFilter = {
    clientId: params.get('cliente') || undefined,
    status: (params.get('estado') as ReportFilter['status']) || undefined,
    type: (params.get('tipo') as ReportFilter['type']) || undefined,
    from: params.get('desde') || undefined,
    to: params.get('hasta') || undefined,
  };
  const key = params.toString();
  const data = useQuery(async (s) => {
    const [reports, clients, all] = await Promise.all([s.listReports(filter), s.listClients(), s.listReports()]);
    return { reports, clients, all };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => {
    document.title = 'Reportes — AF Team';
  }, []);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const selected = useMemo(() => data.data?.all.find((r) => r.id === selectedId) ?? null, [data.data, selectedId]);
  const name = (id: string) => data.data?.clients.find((c) => c.id === id)?.fullName ?? 'Cliente';

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Seguimiento</span>
          <h1 className="page-title">Reportes y molestias</h1>
          <p className="page-sub">Prioridad: revisar y responder cada molestia informada.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-grid form-grid--3">
          <Field label="Cliente" htmlFor="f-client">
            <select id="f-client" className="select" value={filter.clientId ?? ''} onChange={(e) => setParam('cliente', e.target.value)}>
              <option value="">Todos</option>
              {data.data?.clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.fullName}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Estado" htmlFor="f-status">
            <select id="f-status" className="select" value={filter.status ?? ''} onChange={(e) => setParam('estado', e.target.value)}>
              <option value="">Todos</option>
              <option value="abiertos">Abiertos (sin responder)</option>
              <option value="pendiente">Pendientes</option>
              <option value="revisado">Revisados</option>
              <option value="respondido">Respondidos</option>
            </select>
          </Field>
          <Field label="Tipo" htmlFor="f-type">
            <select id="f-type" className="select" value={filter.type ?? ''} onChange={(e) => setParam('tipo', e.target.value)}>
              <option value="">Todos</option>
              {REPORT_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Desde" htmlFor="f-from">
            <input id="f-from" className="input" type="date" value={filter.from ?? ''} onChange={(e) => setParam('desde', e.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="f-to">
            <input id="f-to" className="input" type="date" value={filter.to ?? ''} onChange={(e) => setParam('hasta', e.target.value)} />
          </Field>
          <div className="field" style={{ alignSelf: 'end' }}>
            <button type="button" className="btn" onClick={() => setParams(selectedId ? { id: selectedId } : {}, { replace: true })}>
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {data.error ? (
        <ErrorBlock error={data.error} onRetry={data.reload} />
      ) : !data.data ? (
        <LoadingBlock rows={3} />
      ) : (
        <div className="grid-2 grid-2--even">
          <section aria-label="Lista de reportes">
            {data.data.reports.length === 0 ? (
              <EmptyState title="No hay reportes con estos filtros" />
            ) : (
              <ul className="list">
                {data.data.reports.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      className={`list-item ${r.status === 'pendiente' ? 'list-item--highlight' : ''}`}
                      style={{ width: '100%', textAlign: 'left', cursor: 'pointer', outline: r.id === selectedId ? '2px solid var(--c-gold)' : undefined }}
                      aria-current={r.id === selectedId ? 'true' : undefined}
                      onClick={() => setParam('id', r.id)}
                    >
                      <span className={`list-item__icon ${r.status === 'pendiente' ? 'list-item__icon--danger' : ''}`}>
                        <Icon name="alert" />
                      </span>
                      <span className="list-item__body">
                        <span className="list-item__title">
                          {name(r.clientId)} · {reportTypeLabel(r.type)}
                        </span>
                        <span className="list-item__meta">
                          {r.bodyArea || 'Sin zona'} {r.exerciseName && `· ${r.exerciseName}`} · {relativeTime(r.createdAt)}
                        </span>
                      </span>
                      <span className="stack" style={{ ['--stack' as string]: '4px', justifyItems: 'end' }}>
                        <ReportStatusBadge status={r.status} />
                        <LevelBadge level={r.level} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
          <section aria-label="Detalle del reporte">
            {selected ? (
              <ReportDetail report={selected} clientName={name(selected.clientId)} />
            ) : (
              <EmptyState title="Selecciona un reporte">Verás el detalle, el ejercicio relacionado y podrás responder.</EmptyState>
            )}
          </section>
        </div>
      )}
    </div>
  );
}

function ReportDetail({ report: r, clientName }: { report: WellbeingReport; clientName: string }) {
  const service = useService();
  const run = useAction();
  const [message, setMessage] = useState('');
  const [adjustment, setAdjustment] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMessage('');
    setAdjustment('');
    setError(null);
  }, [r.id]);

  const respond = async (e: FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      setError('Escribe una respuesta para el cliente.');
      return;
    }
    if (await run(() => service.respondToReport(r.id, message, adjustment), 'Respuesta enviada. El cliente recibirá un aviso.')) {
      setMessage('');
      setAdjustment('');
    }
  };

  const routineLink = `/app/entrenador/clientes/${r.clientId}?tab=rutina${r.prescribedExerciseId ? `&pe=${r.prescribedExerciseId}` : ''}&reporte=${r.id}`;

  return (
    <article className={`card stack report-detail ${r.status === 'pendiente' ? 'card--alert' : ''}`}>
      <div className="card__head" style={{ marginBottom: 0 }}>
        <h2 className="card__title">
          {reportTypeLabel(r.type)} · {clientName}
        </h2>
        <div className="row">
          <ReportStatusBadge status={r.status} />
          <DemoBadge show={r.isDemo} />
        </div>
      </div>
      <div className="kv">
        <div className="kv__item">
          <span className="kv__k">Fecha</span>
          <span className="kv__v">{formatDate(r.createdAt, true)}</span>
        </div>
        <div className="kv__item">
          <span className="kv__k">Zona</span>
          <span className="kv__v">{r.bodyArea || '—'}</span>
        </div>
        <div className="kv__item">
          <span className="kv__k">Nivel</span>
          <span className="kv__v">{r.level}/10</span>
        </div>
        <div className="kv__item">
          <span className="kv__k">Ejercicio</span>
          <span className="kv__v">{r.exerciseName ?? '—'}</span>
        </div>
      </div>
      <p style={{ whiteSpace: 'pre-wrap' }}>{r.description}</p>
      <SafetyNotice level={r.level} type={r.type} audience="trainer" />
      <div className="row">
        {r.sessionId && (
          <Link to={routineLink} className="btn btn--outline-gold btn--sm">
            <Icon name="eye" size={16} /> Ver ejercicio en la rutina y ajustar
          </Link>
        )}
        <Link to={`/app/entrenador/clientes/${r.clientId}`} className="btn btn--sm">
          Ficha del cliente
        </Link>
        {r.status === 'pendiente' && (
          <button type="button" className="btn btn--sm" onClick={() => run(() => service.markReportReviewed(r.id), 'Marcado como revisado.')}>
            <Icon name="check" size={16} /> Marcar revisado
          </button>
        )}
      </div>

      {r.responses.length > 0 && (
        <div className="stack" style={{ ['--stack' as string]: '8px' }}>
          <p className="field__label">Respuestas enviadas</p>
          {r.responses.map((x) => (
            <div key={x.id} className="pe">
              <p>{x.message}</p>
              {x.adjustment && (
                <p className="small">
                  <strong className="gold">Ajuste:</strong> {x.adjustment}
                </p>
              )}
              <p className="small muted">{formatDate(x.createdAt, true)}</p>
            </div>
          ))}
        </div>
      )}

      <form className="stack" onSubmit={respond} noValidate>
        <Field label="Respuesta al cliente" htmlFor="resp-msg" error={error}>
          <textarea
            id="resp-msg"
            className="textarea"
            maxLength={2000}
            value={message}
            aria-invalid={!!error}
            onChange={(e) => {
              setMessage(e.target.value);
              setError(null);
            }}
          />
        </Field>
        <Field label="Ajuste realizado (opcional)" htmlFor="resp-adj" hint="Ej.: sustituido el press militar por elevaciones laterales en la semana 4.">
          <input id="resp-adj" className="input" maxLength={300} value={adjustment} onChange={(e) => setAdjustment(e.target.value)} />
        </Field>
        <button type="submit" className="btn btn--gold">
          Enviar respuesta
        </button>
      </form>
    </article>
  );
}
