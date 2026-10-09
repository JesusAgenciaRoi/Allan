import { useEffect, useId, useRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import type { ClientStatus, ReportStatus, WeekStatus } from '../types/domain';

export function BrandMark({ to = '/', label = 'AF Team — inicio' }: { to?: string; label?: string }) {
  return (
    <Link to={to} className="brand" aria-label={label}>
      <span className="brand__af" aria-hidden="true">
        AF
      </span>
      <span className="brand__team" aria-hidden="true">
        TEAM
      </span>
    </Link>
  );
}

export function Spinner({ label = 'Cargando' }: { label?: string }) {
  return (
    <span role="status" className="row">
      <span className="spinner" aria-hidden="true" />
      <span className="sr-only">{label}</span>
    </span>
  );
}

export function Skeleton({ h = 20, w = '100%', style }: { h?: number | string; w?: number | string; style?: React.CSSProperties }) {
  return <div className="skeleton" style={{ height: h, width: w, ...style }} aria-hidden="true" />;
}

export function LoadingBlock({ rows = 3 }: { rows?: number }) {
  return (
    <div className="stack" aria-busy="true" aria-label="Cargando contenido">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} h={72} />
      ))}
    </div>
  );
}

export function ErrorBlock({ error, onRetry }: { error: Error; onRetry?: () => void }) {
  return (
    <div className="notice notice--danger" role="alert">
      <span className="notice__icon">!</span>
      <div className="stack" style={{ ['--stack' as string]: '8px' }}>
        <span>{error.message || 'No se pudieron cargar los datos.'}</span>
        {onRetry && (
          <button type="button" className="btn btn--sm btn--danger" onClick={onRetry}>
            Reintentar
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, children, action }: { title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="empty">
      <p className="empty__title">{title}</p>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function Notice({ kind = 'gold', children, icon = 'i' }: { kind?: 'gold' | 'danger' | 'warn' | 'ok' | 'plain'; children: ReactNode; icon?: string }) {
  return (
    <div className={`notice ${kind === 'plain' ? '' : `notice--${kind}`}`}>
      <span className="notice__icon" aria-hidden="true">
        {icon}
      </span>
      <div>{children}</div>
    </div>
  );
}

export function DemoBadge({ show = true }: { show?: boolean }) {
  if (!show) return null;
  return (
    <span className="badge badge--demo" title="Dato de demostración (ficticio)">
      Demo
    </span>
  );
}

const CLIENT_STATUS: Record<ClientStatus, { label: string; cls: string }> = {
  activo: { label: 'Activo', cls: 'badge--ok' },
  pausado: { label: 'Pausado', cls: 'badge--warn' },
  inactivo: { label: 'Inactivo', cls: '' },
};
export function ClientStatusBadge({ status }: { status: ClientStatus }) {
  const s = CLIENT_STATUS[status];
  return (
    <span className={`badge ${s.cls}`}>
      <span className="dot" aria-hidden="true" />
      {s.label}
    </span>
  );
}

const REPORT_STATUS: Record<ReportStatus, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'badge--danger' },
  revisado: { label: 'Revisado', cls: 'badge--warn' },
  respondido: { label: 'Respondido', cls: 'badge--ok' },
};
export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  const s = REPORT_STATUS[status];
  return <span className={`badge ${s.cls}`}>{s.label}</span>;
}

const WEEK_STATUS: Record<WeekStatus, string> = { pendiente: 'Pendiente', en_curso: 'En curso', completado: 'Completado' };
export function weekStatusLabel(s: WeekStatus) {
  return WEEK_STATUS[s];
}

export function LevelBadge({ level }: { level: number }) {
  const cls = level >= 7 ? 'badge--danger' : level >= 4 ? 'badge--warn' : 'badge--ok';
  return <span className={`badge ${cls}`}>Nivel {level}/10</span>;
}

export function Avatar({ name }: { name: string }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <span className="avatar" aria-hidden="true">
      {initials || '?'}
    </span>
  );
}

/** Modal accesible: foco atrapado, Escape para cerrar, devuelve el foco al cerrar. */
export function Modal({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const el = ref.current;
    const focusables = () =>
      Array.from(
        el?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])') ?? [],
      ).filter((x) => !x.hasAttribute('disabled'));
    (focusables()[1] ?? focusables()[0])?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeRef.current();
      if (e.key === 'Tab') {
        const f = focusables();
        if (!f.length) return;
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
      prev?.focus?.();
    };
  }, []);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} className={`modal ${wide ? 'modal--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <div className="modal__head">
          <h2 className="modal__title" id={titleId}>
            {title}
          </h2>
          <button type="button" className="btn btn--ghost btn--icon" onClick={onClose} aria-label="Cerrar">
            <Icon name="close" size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  busy,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  danger?: boolean;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      <div className="stack">
        <div className="muted">{message}</div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onCancel}>
            Cancelar
          </button>
          <button type="button" className={`btn ${danger ? 'btn--danger-solid' : 'btn--gold'}`} onClick={onConfirm} disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  htmlFor,
  className,
}: {
  label: string;
  hint?: ReactNode;
  error?: string | null;
  children: ReactNode;
  htmlFor: string;
  className?: string;
}) {
  return (
    <div className={`field ${className ?? ''}`}>
      <label className="field__label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && !error && (
        <span className="field__hint" id={`${htmlFor}-hint`}>
          {hint}
        </span>
      )}
      {error && (
        <span className="field__error" id={`${htmlFor}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}

export function KV({ k, v, title }: { k: string; v: string | null | undefined; title?: string }) {
  return (
    <div className="kv__item" title={title}>
      <span className="kv__k">{k}</span>
      <span className={`kv__v ${v ? '' : 'kv__v--empty'}`}>{v || '—'}</span>
    </div>
  );
}
