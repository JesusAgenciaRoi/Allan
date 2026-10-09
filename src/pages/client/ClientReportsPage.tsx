import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useService } from '../../state/DataContext';
import { useToast } from '../../state/ToastContext';
import { useClientData } from './useClientData';
import { DemoBadge, EmptyState, ErrorBlock, Field, LevelBadge, LoadingBlock, ReportStatusBadge } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { SafetyNotice } from '../../components/SafetyNotice';
import { BODY_AREAS, REPORT_TYPES, reportTypeLabel } from '../../content/muscleGroups';
import { activeExercises, allWeeks, findPrescription, findSession, formatDate } from '../../lib/plan';
import type { ReportType } from '../../types/domain';

export default function ClientReportsPage() {
  const data = useClientData();
  const [params, setParams] = useSearchParams();
  const [open, setOpen] = useState(params.get('nuevo') === '1');
  useEffect(() => {
    document.title = 'Mis reportes — AF Team';
  }, []);
  useEffect(() => {
    if (params.get('nuevo') === '1') setOpen(true);
  }, [params]);

  if (data.error) return <ErrorBlock error={data.error} onRetry={data.reload} />;
  if (data.data === undefined) return <LoadingBlock rows={3} />;
  if (!data.data) return <EmptyState title="Cuenta no vinculada" />;
  const { reports } = data.data;

  return (
    <div className="stack" style={{ ['--stack' as string]: '18px' }}>
      <div className="page-head" style={{ marginBottom: 0 }}>
        <div>
          <span className="eyebrow">Comunicación</span>
          <h1 className="page-title">Molestias y reportes</h1>
        </div>
        {!open && (
          <button type="button" className="btn btn--gold" onClick={() => setOpen(true)}>
            <Icon name="plus" size={18} /> Nuevo reporte
          </button>
        )}
      </div>

      {open && (
        <ReportForm
          defaultSession={params.get('sesion')}
          defaultPe={params.get('ejercicio')}
          onDone={() => {
            setOpen(false);
            setParams({}, { replace: true });
          }}
        />
      )}

      <section className="stack" aria-labelledby="mine-t">
        <h2 id="mine-t" className="card__title">
          Mis reportes
        </h2>
        {reports.length === 0 ? (
          <EmptyState title="No has enviado reportes">Si algo te molesta o te cuesta, cuéntaselo a tu entrenador.</EmptyState>
        ) : (
          <ul className="list">
            {reports.map((r) => (
              <li key={r.id} className={`card stack ${r.status === 'respondido' ? '' : ''}`} style={{ ['--stack' as string]: '8px' }}>
                <div className="row row--between">
                  <strong>
                    {reportTypeLabel(r.type)} {r.bodyArea && `· ${r.bodyArea}`}
                  </strong>
                  <span className="row" style={{ gap: 6 }}>
                    <LevelBadge level={r.level} />
                    <ReportStatusBadge status={r.status} />
                    <DemoBadge show={r.isDemo} />
                  </span>
                </div>
                <p className="small muted">
                  {formatDate(r.createdAt, true)}
                  {r.exerciseName && ` · ${r.exerciseName}`}
                </p>
                <p>{r.description}</p>
                {r.responses.map((x) => (
                  <div key={x.id} className="notice notice--gold">
                    <span className="notice__icon">
                      <Icon name="chat" size={16} />
                    </span>
                    <div>
                      <strong>Tu entrenador:</strong> {x.message}
                      {x.adjustment && (
                        <p className="small" style={{ marginTop: 4 }}>
                          <strong>Ajuste:</strong> {x.adjustment}
                        </p>
                      )}
                      <p className="small muted">{formatDate(x.createdAt, true)}</p>
                    </div>
                  </div>
                ))}
                {r.status === 'revisado' && <p className="small muted">Tu entrenador lo ha revisado; pronto recibirás respuesta.</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function ReportForm({ defaultSession, defaultPe, onDone }: { defaultSession: string | null; defaultPe: string | null; onDone: () => void }) {
  const service = useService();
  const toast = useToast();
  const data = useClientData();
  const plan = data.data?.plan ?? null;
  const [type, setType] = useState<ReportType>('molestia');
  const [bodyArea, setBodyArea] = useState('');
  const [level, setLevel] = useState(3);
  const [description, setDescription] = useState('');
  const [sessionId, setSessionId] = useState(defaultSession ?? '');
  const [peId, setPeId] = useState(defaultPe ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const sessions = useMemo(() => (plan ? allWeeks(plan).flatMap(({ week }) => week.sessions.map((s) => ({ s, week }))) : []), [plan]);
  const sessionExercises = useMemo(() => {
    if (!plan || !sessionId) return [];
    const f = findSession(plan, sessionId);
    return f ? activeExercises(f.session) : [];
  }, [plan, sessionId]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Describe brevemente lo que notas.');
      document.getElementById('r-desc')?.focus();
      return;
    }
    setBusy(true);
    try {
      const pe = plan && peId ? findPrescription(plan, peId)?.pe : undefined;
      await service.createReport({
        type,
        bodyArea,
        level,
        description,
        sessionId: sessionId || null,
        prescribedExerciseId: pe?.id ?? null,
        exerciseName: pe?.name ?? null,
        workoutLogId: null,
      });
      toast('success', 'Reporte enviado. Tu entrenador ha recibido un aviso.');
      onDone();
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card card--alert stack" onSubmit={submit} noValidate aria-labelledby="new-rep-t">
      <h2 id="new-rep-t" className="card__title">
        Nuevo reporte para tu entrenador
      </h2>
      <SafetyNotice level={level} type={type} audience="client" />
      <div className="field">
        <span className="field__label" id="r-type-l">
          Tipo
        </span>
        <div className="chips" role="radiogroup" aria-labelledby="r-type-l" style={{ flexWrap: 'wrap' }}>
          {REPORT_TYPES.map((t) => (
            <button key={t.id} type="button" role="radio" aria-checked={type === t.id} aria-pressed={type === t.id} className="chip" onClick={() => setType(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="form-grid form-grid--2">
        <Field label="Zona del cuerpo (opcional)" htmlFor="r-area">
          <select id="r-area" className="select" value={bodyArea} onChange={(e) => setBodyArea(e.target.value)}>
            <option value="">Sin indicar</option>
            {BODY_AREAS.map((a) => (
              <option key={a}>{a}</option>
            ))}
          </select>
        </Field>
        <Field label={`Nivel de molestia: ${level}/10`} htmlFor="r-level" hint="0 = nada · 10 = máximo imaginable">
          <input id="r-level" className="range" type="range" min={0} max={10} step={1} value={level} onChange={(e) => setLevel(Number(e.target.value))} />
          <span className="level-scale" aria-hidden="true">
            <span>0</span>
            <span>5</span>
            <span>10</span>
          </span>
        </Field>
        <Field label="Sesión relacionada (opcional)" htmlFor="r-session">
          <select
            id="r-session"
            className="select"
            value={sessionId}
            onChange={(e) => {
              setSessionId(e.target.value);
              setPeId('');
            }}
          >
            <option value="">Ninguna</option>
            {sessions.map(({ s, week }) => (
              <option key={s.id} value={s.id}>
                Semana {week.number} · {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Ejercicio relacionado (opcional)" htmlFor="r-ex">
          <select id="r-ex" className="select" value={peId} onChange={(e) => setPeId(e.target.value)} disabled={!sessionExercises.length}>
            <option value="">{sessionExercises.length ? 'Ninguno' : 'Elige antes una sesión'}</option>
            {sessionExercises.map((pe) => (
              <option key={pe.id} value={pe.id}>
                {pe.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="¿Qué notas?" htmlFor="r-desc" error={error} className="span-all" hint="Cuándo aparece, en qué movimiento, si mejora o empeora…">
          <textarea
            id="r-desc"
            className="textarea"
            maxLength={2000}
            value={description}
            aria-invalid={!!error}
            onChange={(e) => {
              setDescription(e.target.value);
              setError(null);
            }}
          />
        </Field>
      </div>
      <div className="form-actions">
        <button type="button" className="btn" onClick={onDone}>
          Cancelar
        </button>
        <button type="submit" className="btn btn--gold" disabled={busy}>
          {busy && <span className="spinner" aria-hidden="true" />}
          Enviar a mi entrenador
        </button>
      </div>
    </form>
  );
}
