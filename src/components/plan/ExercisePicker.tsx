import { useMemo, useState } from 'react';
import { Modal, EmptyState, LoadingBlock } from '../ui';
import { ExerciseMediaView } from '../ExerciseMediaView';
import { useQuery } from '../../state/DataContext';
import { MUSCLE_GROUPS, muscleLabel } from '../../content/muscleGroups';
import type { Exercise, MuscleGroupId } from '../../types/domain';

export function ExercisePickerModal({ title, onPick, onClose }: { title: string; onPick: (ex: Exercise) => void; onClose: () => void }) {
  const list = useQuery((s) => s.listExercises());
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<MuscleGroupId | ''>('');
  const items = useMemo(
    () =>
      (list.data ?? [])
        .filter((e) => e.active)
        .filter((e) => !q || e.title.toLowerCase().includes(q.toLowerCase()))
        .filter((e) => !muscle || e.primaryMuscle === muscle || e.secondaryMuscles.includes(muscle)),
    [list.data, q, muscle],
  );
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="stack">
        <div className="form-grid form-grid--2">
          <input className="input" type="search" placeholder="Buscar ejercicio…" aria-label="Buscar ejercicio" value={q} onChange={(e) => setQ(e.target.value)} />
          <select className="select" aria-label="Grupo muscular" value={muscle} onChange={(e) => setMuscle(e.target.value as MuscleGroupId | '')}>
            <option value="">Todos los grupos musculares</option>
            {MUSCLE_GROUPS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        {!list.data ? (
          <LoadingBlock rows={3} />
        ) : items.length === 0 ? (
          <EmptyState title="Sin resultados">Ajusta la búsqueda o crea el ejercicio en la biblioteca.</EmptyState>
        ) : (
          <ul className="list" style={{ maxHeight: '55vh', overflowY: 'auto' }}>
            {items.map((e) => (
              <li key={e.id}>
                <button type="button" className="list-item" style={{ width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => onPick(e)}>
                  <div style={{ width: 56, flex: 'none' }}>
                    <ExerciseMediaView media={e.media} title={e.title} aspect="1 / 1" />
                  </div>
                  <span className="list-item__body">
                    <span className="list-item__title">{e.title}</span>
                    <span className="list-item__meta">
                      {muscleLabel(e.primaryMuscle)} · {e.equipment || 'Sin equipamiento indicado'}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}
