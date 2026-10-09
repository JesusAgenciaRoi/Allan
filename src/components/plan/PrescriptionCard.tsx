import { KV } from '../ui';
import { ExerciseMediaView } from '../ExerciseMediaView';
import { Icon } from '../Icon';
import type { Exercise, PrescribedExercise } from '../../types/domain';

export function PrescriptionParamsGrid({ pe }: { pe: PrescribedExercise }) {
  return (
    <div className="kv">
      <KV k="Series" v={pe.sets} />
      <KV k="Reps" v={pe.reps} />
      <KV k="Peso (prescrito)" v={pe.load} />
      <KV k="RIR / RPE" v={pe.rirRpe} />
      <KV k="Carga sugerida" v={[pe.suggestedLoad, pe.suggestedLoadAlt].filter(Boolean).join(' | ') || null} title={pe.suggestedLoadAlt ? 'Dos valores en el Excel (columnas G y H)' : undefined} />
      <KV k="Tempo" v={pe.tempo} />
      <KV k="Descanso" v={pe.rest} />
    </div>
  );
}

export interface PrescriptionActions {
  onEdit: () => void;
  onReplace: () => void;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
  isFirst: boolean;
  isLast: boolean;
}

export function PrescriptionCard({
  pe,
  exercise,
  showFlags,
  reported,
  actions,
}: {
  pe: PrescribedExercise;
  exercise?: Exercise;
  showFlags?: boolean;
  reported?: boolean;
  actions?: PrescriptionActions;
}) {
  const flagged = showFlags && pe.reviewFlags.length > 0;
  return (
    <article className={`pe ${flagged ? 'pe--flagged' : ''} ${reported ? 'pe--reported' : ''}`} id={`pe-${pe.id}`}>
      <div className="pe__head">
        <ExerciseMediaView media={exercise?.media} title={exercise?.title ?? pe.name} aspect="1 / 1" />
        <div style={{ minWidth: 0 }}>
          <p className="pe__name">{pe.name}</p>
          {exercise && exercise.title.toLowerCase() !== pe.name.toLowerCase() && <p className="small muted">Biblioteca: {exercise.title}</p>}
          {!pe.exerciseId && <p className="small muted">Bloque libre (sin ficha de biblioteca)</p>}
          <div className="row" style={{ marginTop: 4, gap: 6 }}>
            {reported && (
              <span className="badge badge--danger">
                <Icon name="alert" size={12} /> Molestia reportada
              </span>
            )}
            {flagged && <span className="badge badge--warn">{pe.reviewFlags.length} aviso(s) de importación</span>}
          </div>
        </div>
      </div>
      <PrescriptionParamsGrid pe={pe} />
      {pe.notes && (
        <p className="small">
          <strong className="gold">Notas:</strong> {pe.notes}
        </p>
      )}
      {flagged && (
        <details className="raw">
          <summary>Revisar datos de importación</summary>
          <ul className="flags">
            {pe.reviewFlags.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
          {pe.raw && <pre>{JSON.stringify(pe.raw, null, 1)}</pre>}
        </details>
      )}
      {actions && (
        <div className="pe__actions">
          <button type="button" className="btn btn--sm" onClick={actions.onEdit}>
            <Icon name="edit" size={14} /> Editar
          </button>
          <button type="button" className="btn btn--sm" onClick={actions.onReplace}>
            <Icon name="swap" size={14} /> Sustituir
          </button>
          <button type="button" className="btn btn--sm btn--icon" aria-label={`Subir ${pe.name}`} disabled={actions.isFirst} onClick={() => actions.onMove(-1)}>
            <Icon name="up" size={14} />
          </button>
          <button type="button" className="btn btn--sm btn--icon" aria-label={`Bajar ${pe.name}`} disabled={actions.isLast} onClick={() => actions.onMove(1)}>
            <Icon name="down" size={14} />
          </button>
          <button type="button" className="btn btn--sm btn--danger" onClick={actions.onRemove}>
            <Icon name="trash" size={14} /> Retirar
          </button>
        </div>
      )}
    </article>
  );
}
