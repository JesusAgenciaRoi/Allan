import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery, useService } from '../../state/DataContext';
import { useAction } from '../../state/ToastContext';
import { ConfirmDialog, DemoBadge, EmptyState, ErrorBlock, Skeleton } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { ExerciseMediaView } from '../../components/ExerciseMediaView';
import { DIFFICULTIES, MUSCLE_GROUPS, difficultyLabel, muscleLabel } from '../../content/muscleGroups';
import type { Exercise, MuscleGroupId } from '../../types/domain';

export default function ExercisesPage() {
  const service = useService();
  const run = useAction();
  const [params, setParams] = useSearchParams();
  const list = useQuery((s) => s.listExercises());
  const [q, setQ] = useState('');
  const [toDelete, setToDelete] = useState<Exercise | null>(null);
  const muscle = (params.get('grupo') ?? '') as MuscleGroupId | '';
  const equipment = params.get('equipo') ?? '';
  const difficulty = params.get('nivel') ?? '';
  const view = params.get('vista') === 'lista' ? 'lista' : 'cuadricula';
  const showInactive = params.get('inactivos') === '1';
  useEffect(() => {
    document.title = 'Biblioteca de ejercicios — AF Team';
  }, []);

  const setParam = (k: string, v: string) => {
    const p = new URLSearchParams(params);
    if (v) p.set(k, v);
    else p.delete(k);
    setParams(p, { replace: true });
  };

  const equipments = useMemo(() => [...new Set((list.data ?? []).map((e) => e.equipment).filter(Boolean))].sort(), [list.data]);
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const e of list.data ?? []) for (const g of [e.primaryMuscle, ...e.secondaryMuscles]) m.set(g, (m.get(g) ?? 0) + 1);
    return m;
  }, [list.data]);
  const items = useMemo(
    () =>
      (list.data ?? [])
        .filter((e) => showInactive || e.active)
        .filter((e) => !q || e.title.toLowerCase().includes(q.toLowerCase().trim()))
        .filter((e) => !muscle || e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle))
        .filter((e) => !equipment || e.equipment === equipment)
        .filter((e) => !difficulty || e.difficulty === difficulty),
    [list.data, q, muscle, equipment, difficulty, showInactive],
  );

  return (
    <div>
      <div className="page-head">
        <div>
          <span className="eyebrow">Biblioteca</span>
          <h1 className="page-title">Ejercicios</h1>
        </div>
        <Link to="/app/entrenador/ejercicios/nuevo" className="btn btn--gold">
          <Icon name="plus" size={18} /> Nuevo ejercicio
        </Link>
      </div>

      <div className="toolbar">
        <label className="sr-only" htmlFor="ex-search">
          Buscar por título
        </label>
        <input id="ex-search" className="input" type="search" placeholder="Buscar por título…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="row" style={{ flexWrap: 'nowrap' }}>
          <select className="select" aria-label="Equipamiento" value={equipment} onChange={(e) => setParam('equipo', e.target.value)}>
            <option value="">Todo el equipamiento</option>
            {equipments.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          <select className="select" aria-label="Dificultad" value={difficulty} onChange={(e) => setParam('nivel', e.target.value)}>
            <option value="">Toda dificultad</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.id} value={d.id}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="seg" role="group" aria-label="Vista">
          <button type="button" aria-pressed={view === 'cuadricula'} onClick={() => setParam('vista', '')} aria-label="Vista en cuadrícula">
            <Icon name="grid" size={16} />
          </button>
          <button type="button" aria-pressed={view === 'lista'} onClick={() => setParam('vista', 'lista')} aria-label="Vista en lista">
            <Icon name="list" size={16} />
          </button>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Filtrar por grupo muscular" style={{ marginBottom: 10 }}>
        <button type="button" className="chip" aria-pressed={!muscle} onClick={() => setParam('grupo', '')}>
          Todos
        </button>
        {MUSCLE_GROUPS.map((m) => (
          <button key={m.id} type="button" className="chip" aria-pressed={muscle === m.id} onClick={() => setParam('grupo', muscle === m.id ? '' : m.id)}>
            {m.label} {counts.get(m.id) ? <span className="small">({counts.get(m.id)})</span> : null}
          </button>
        ))}
      </div>
      <label className="checkbox small" style={{ marginBottom: 12 }}>
        <input type="checkbox" checked={showInactive} onChange={(e) => setParam('inactivos', e.target.checked ? '1' : '')} />
        Mostrar inactivos
      </label>
      <p className="small muted" aria-live="polite" style={{ marginBottom: 12 }}>
        {list.data ? `${items.length} ejercicio(s)` : 'Cargando…'}
      </p>

      {list.error ? (
        <ErrorBlock error={list.error} onRetry={list.reload} />
      ) : !list.data ? (
        <div className="ex-grid">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} h={240} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="Ningún ejercicio coincide"
          action={
            <Link to="/app/entrenador/ejercicios/nuevo" className="btn btn--gold">
              Crear ejercicio
            </Link>
          }
        >
          Cambia los filtros o crea uno nuevo.
        </EmptyState>
      ) : view === 'cuadricula' ? (
        <ul className="ex-grid list">
          {items.map((e, i) => (
            <li key={e.id} className={`ex-card ${e.active ? '' : 'ex-card--inactive'}`} style={{ animationDelay: `${Math.min(i, 12) * 30}ms` }}>
              <ExerciseMediaView media={e.media} title={e.title} aspect="4 / 3" />
              <div className="ex-card__body">
                <h2 className="ex-card__title">{e.title}</h2>
                <div className="row" style={{ gap: 6 }}>
                  <span className="badge badge--gold">{muscleLabel(e.primaryMuscle)}</span>
                  {!e.active && <span className="badge">Inactivo</span>}
                  <DemoBadge show={e.isDemo} />
                </div>
                <p className="small muted">
                  {e.equipment || '—'} · {difficultyLabel(e.difficulty)}
                </p>
                <div className="ex-card__actions">
                  <Link to={`/app/entrenador/ejercicios/${e.id}`} className="btn btn--sm">
                    <Icon name="edit" size={14} /> Editar
                  </Link>
                  <button type="button" className="btn btn--sm btn--danger btn--icon" aria-label={`Eliminar ${e.title}`} onClick={() => setToDelete(e)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="list ex-list">
          {items.map((e) => (
            <li key={e.id} className={`ex-row ${e.active ? '' : 'ex-card--inactive'}`}>
              <ExerciseMediaView media={e.media} title={e.title} aspect="1 / 1" />
              <div style={{ minWidth: 0 }}>
                <p className="list-item__title">{e.title}</p>
                <p className="small muted">
                  {muscleLabel(e.primaryMuscle)}
                  {e.secondaryMuscles.length ? ` + ${e.secondaryMuscles.map(muscleLabel).join(', ')}` : ''} · {e.equipment || '—'}
                </p>
              </div>
              <div className="ex-row__actions">
                <Link to={`/app/entrenador/ejercicios/${e.id}`} className="btn btn--sm">
                  <Icon name="edit" size={14} /> Editar
                </Link>
                <button type="button" className="btn btn--sm btn--danger" onClick={() => setToDelete(e)}>
                  <Icon name="trash" size={14} /> Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {toDelete && (
        <ConfirmDialog
          title="Eliminar ejercicio"
          danger
          confirmLabel="Eliminar"
          message={`¿Eliminar «${toDelete.title}» y su archivo de demostración? Si está asignado en algún plan no se podrá borrar (desactívalo en su lugar).`}
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            if (await run(() => service.deleteExercise(toDelete.id), 'Ejercicio eliminado.')) setToDelete(null);
          }}
        />
      )}
    </div>
  );
}
