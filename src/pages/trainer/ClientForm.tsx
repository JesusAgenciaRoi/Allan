import { useState, type FormEvent } from 'react';
import { Field, Modal } from '../../components/ui';
import type { Client, ClientStatus } from '../../types/domain';
import type { ClientInput } from '../../services/types';
import { validateEmail, validatePhone, validateRequired } from '../../lib/validation';
import { useService } from '../../state/DataContext';
import { useToast } from '../../state/ToastContext';

export function ClientFormModal({ client, onClose, onSaved }: { client?: Client; onClose: () => void; onSaved: (c: Client) => void }) {
  const service = useService();
  const toast = useToast();
  const [form, setForm] = useState<ClientInput>({
    fullName: client?.fullName ?? '',
    email: client?.email ?? '',
    phone: client?.phone ?? '',
    status: client?.status ?? 'activo',
    startDate: client?.startDate ?? new Date().toISOString().slice(0, 10),
    adminNotes: client?.adminNotes ?? '',
  });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [busy, setBusy] = useState(false);

  const set = <K extends keyof ClientInput>(k: K, v: ClientInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: null }));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = {
      fullName: validateRequired(form.fullName, 'El nombre', 120),
      email: validateEmail(form.email),
      phone: validatePhone(form.phone),
      startDate: form.startDate ? null : 'Indica la fecha de alta.',
      adminNotes: form.adminNotes.length > 4000 ? 'Máximo 4000 caracteres.' : null,
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    setBusy(true);
    try {
      const saved = await service.saveClient(form, client?.id);
      toast('success', client ? 'Cliente actualizado.' : 'Cliente creado.');
      onSaved(saved);
    } catch (err) {
      toast('error', (err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={client ? 'Editar cliente' : 'Nuevo cliente'} onClose={onClose}>
      <form className="stack" onSubmit={submit} noValidate>
        <div className="form-grid form-grid--2">
          <Field label="Nombre y apellidos" htmlFor="cf-name" error={errors.fullName} className="span-all">
            <input id="cf-name" className="input" autoComplete="off" value={form.fullName} aria-invalid={!!errors.fullName} onChange={(e) => set('fullName', e.target.value)} />
          </Field>
          <Field label="Correo" htmlFor="cf-email" error={errors.email} hint="Se usa para invitarle a la app.">
            <input id="cf-email" className="input" type="email" inputMode="email" value={form.email} aria-invalid={!!errors.email} onChange={(e) => set('email', e.target.value)} />
          </Field>
          <Field label="Teléfono (opcional)" htmlFor="cf-phone" error={errors.phone}>
            <input id="cf-phone" className="input" type="tel" inputMode="tel" value={form.phone} aria-invalid={!!errors.phone} onChange={(e) => set('phone', e.target.value)} />
          </Field>
          <Field label="Estado" htmlFor="cf-status">
            <select id="cf-status" className="select" value={form.status} onChange={(e) => set('status', e.target.value as ClientStatus)}>
              <option value="activo">Activo</option>
              <option value="pausado">Pausado</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </Field>
          <Field label="Fecha de alta" htmlFor="cf-date" error={errors.startDate}>
            <input id="cf-date" className="input" type="date" value={form.startDate} onChange={(e) => set('startDate', e.target.value)} />
          </Field>
          <Field
            label="Notas administrativas"
            htmlFor="cf-notes"
            error={errors.adminNotes}
            hint="Solo visibles para ti. No anotes datos de salud innecesarios."
            className="span-all"
          >
            <textarea id="cf-notes" className="textarea" value={form.adminNotes} onChange={(e) => set('adminNotes', e.target.value)} />
          </Field>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--gold" disabled={busy}>
            {busy && <span className="spinner" aria-hidden="true" />}
            {client ? 'Guardar cambios' : 'Crear cliente'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
