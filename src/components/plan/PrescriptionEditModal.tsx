import { useState, type FormEvent } from 'react';
import { Field, Modal, Notice } from '../ui';
import type { PrescribedExercise, StageId } from '../../types/domain';
import type { PrescriptionParams } from '../../services/types';
import { STAGES } from '../../content/muscleGroups';

const FIELDS: { k: keyof PrescriptionParams; label: string; hint?: string }[] = [
  { k: 'sets', label: 'Series' },
  { k: 'reps', label: 'Repeticiones' },
  { k: 'load', label: 'Peso / carga prescrita', hint: 'Lo que se programa, no lo ejecutado.' },
  { k: 'suggestedLoad', label: 'Carga sugerida' },
  { k: 'rirRpe', label: 'RIR / RPE' },
  { k: 'tempo', label: 'Tempo', hint: 'Ej.: 3-1-1' },
  { k: 'rest', label: 'Descanso' },
];

/** Edita los parámetros de UNA asignación. No modifica la ficha global del ejercicio. */
export function PrescriptionEditModal({
  pe,
  title,
  onSave,
  onClose,
  withReason,
}: {
  pe?: PrescribedExercise;
  title: string;
  onSave: (params: Partial<PrescriptionParams>, reason: string) => Promise<boolean>;
  onClose: () => void;
  withReason?: boolean;
}) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { stage: pe?.stage ?? 'accesorio', notes: pe?.notes ?? '' };
    for (const f of FIELDS) init[f.k] = (pe?.[f.k] as string | null) ?? '';
    return init;
  });
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const params: Partial<PrescriptionParams> = { stage: form.stage as StageId, notes: form.notes.trim() || null };
    for (const f of FIELDS) (params as Record<string, string | null>)[f.k] = form[f.k].trim() || null;
    const ok = await onSave(params, reason.trim());
    setBusy(false);
    if (ok) onClose();
  };

  return (
    <Modal title={title} onClose={onClose}>
      <form className="stack" onSubmit={submit}>
        <Notice kind="plain">
          Estos valores solo afectan a esta asignación. Los campos vacíos se guardan como «sin dato», nunca como 0.
        </Notice>
        <div className="form-grid form-grid--2">
          <Field label="Etapa" htmlFor="pe-stage">
            <select id="pe-stage" className="select" value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>
              {STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>
          </Field>
          {FIELDS.map((f) => (
            <Field key={f.k} label={f.label} htmlFor={`pe-${f.k}`} hint={f.hint}>
              <input id={`pe-${f.k}`} className="input" maxLength={60} value={form[f.k]} onChange={(e) => setForm({ ...form, [f.k]: e.target.value })} />
            </Field>
          ))}
          <Field label="Notas e indicaciones" htmlFor="pe-notes" className="span-all">
            <textarea id="pe-notes" className="textarea" maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
          {withReason && (
            <Field label="Motivo del cambio (lo verá el cliente)" htmlFor="pe-reason" className="span-all" hint="Ej.: ajuste por molestia en el hombro.">
              <input id="pe-reason" className="input" maxLength={200} value={reason} onChange={(e) => setReason(e.target.value)} />
            </Field>
          )}
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--gold" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            Guardar
          </button>
        </div>
      </form>
    </Modal>
  );
}
