import { useState, type FormEvent } from 'react';
import { Field } from '../../components/ui';
import { validateEmail, validatePhone, validateRequired } from '../../lib/validation';
import { useData } from '../../state/DataContext';

interface Form {
  name: string;
  email: string;
  phone: string;
  goal: string;
  message: string;
  consent: boolean;
}

const EMPTY: Form = { name: '', email: '', phone: '', goal: '', message: '', consent: false };

export function ContactForm() {
  const { service } = useData();
  const [form, setForm] = useState<Form>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string | null>>>({});
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent-demo' | 'sent' | 'error'>('idle');

  const validate = (f: Form) => ({
    name: validateRequired(f.name, 'El nombre', 80),
    email: validateEmail(f.email),
    phone: validatePhone(f.phone),
    goal: f.goal ? null : 'Elige tu objetivo principal.',
    message: f.message.length > 1000 ? 'Máximo 1000 caracteres.' : null,
    consent: f.consent ? null : 'Necesitamos tu consentimiento para responderte.',
  });

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    const firstError = (Object.keys(errs) as (keyof Form)[]).find((k) => errs[k]);
    if (firstError) {
      document.getElementById(`c-${firstError}`)?.focus();
      return;
    }
    setStatus('sending');
    try {
      const res = await service!.submitContactRequest({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        goal: form.goal,
        message: form.message.trim(),
      });
      setStatus(res.persisted ? 'sent' : 'sent-demo');
      setForm(EMPTY);
    } catch {
      setStatus('error');
    }
  };

  const bind = (k: keyof Form) => ({
    id: `c-${k}`,
    value: form[k] as string,
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `c-${k}-error` : undefined,
    onChange: (e: { target: { value: string } }) => {
      setForm((f) => ({ ...f, [k]: e.target.value }));
      if (errors[k]) setErrors((x) => ({ ...x, [k]: null }));
    },
  });

  if (status === 'sent' || status === 'sent-demo') {
    return (
      <div className="card card--gold stack" role="status">
        <p className="card__title">¡Gracias! Hemos recibido tu consulta</p>
        {status === 'sent-demo' ? (
          <p className="muted">
            <strong>Modo demo:</strong> el formulario se ha validado correctamente, pero no se ha enviado ni guardado en ningún
            servidor. Con Supabase configurado, la consulta se guarda en la tabla <code>contact_requests</code>.
          </p>
        ) : (
          <p className="muted">Te responderemos lo antes posible.</p>
        )}
        <button type="button" className="btn" onClick={() => setStatus('idle')}>
          Enviar otra consulta
        </button>
      </div>
    );
  }

  return (
    <form className="card stack" onSubmit={onSubmit} noValidate aria-label="Formulario de contacto">
      <div className="form-grid form-grid--2">
        <Field label="Nombre" htmlFor="c-name" error={errors.name}>
          <input className="input" autoComplete="name" required maxLength={80} {...bind('name')} />
        </Field>
        <Field label="Correo electrónico" htmlFor="c-email" error={errors.email}>
          <input className="input" type="email" inputMode="email" autoComplete="email" required {...bind('email')} />
        </Field>
        <Field label="Teléfono (opcional)" htmlFor="c-phone" error={errors.phone}>
          <input className="input" type="tel" inputMode="tel" autoComplete="tel" {...bind('phone')} />
        </Field>
        <Field label="Objetivo principal" htmlFor="c-goal" error={errors.goal}>
          <select className="select" required {...bind('goal')}>
            <option value="">Selecciona…</option>
            <option>Ganar masa muscular</option>
            <option>Ganar fuerza</option>
            <option>Perder grasa</option>
            <option>Mejorar técnica</option>
            <option>Otro</option>
          </select>
        </Field>
        <Field label="Cuéntanos tu punto de partida" htmlFor="c-message" error={errors.message} hint="Experiencia, disponibilidad, material… (opcional)" className="span-all">
          <textarea className="textarea" maxLength={1000} {...bind('message')} />
        </Field>
      </div>
      <div className="field">
        <label className="checkbox">
          <input
            id="c-consent"
            type="checkbox"
            checked={form.consent}
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? 'c-consent-error' : undefined}
            onChange={(e) => {
              setForm((f) => ({ ...f, consent: e.target.checked }));
              setErrors((x) => ({ ...x, consent: null }));
            }}
          />
          <span className="small">Acepto que AF Team use estos datos solo para responder a mi consulta.</span>
        </label>
        {errors.consent && (
          <span className="field__error" id="c-consent-error" role="alert">
            {errors.consent}
          </span>
        )}
      </div>
      {status === 'error' && (
        <div className="notice notice--danger" role="alert">
          <span className="notice__icon">!</span>
          No se pudo enviar la consulta. Inténtalo de nuevo en unos minutos.
        </div>
      )}
      <button type="submit" className="btn btn--gold btn--lg" disabled={status === 'sending'}>
        {status === 'sending' && <span className="spinner" aria-hidden="true" />}
        Enviar consulta
      </button>
    </form>
  );
}
