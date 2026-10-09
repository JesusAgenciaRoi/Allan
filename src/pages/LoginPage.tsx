import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark, Field, Notice } from '../components/ui';
import { Icon } from '../components/Icon';
import { useData } from '../state/DataContext';
import { validateEmail } from '../lib/validation';
import type { Role } from '../types/domain';
import { homeFor } from '../lib/routes';

export default function LoginPage() {
  const { service, profile, setProfile, sessionExpired } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Acceso — AF Team';
  }, []);

  if (profile) return <Navigate to={from && from.startsWith(homeFor(profile.role)) ? from : homeFor(profile.role)} replace />;
  if (!service) return null;
  const demo = service.mode === 'demo';

  const go = (role: Role) => navigate(from && from.startsWith(homeFor(role)) ? from : homeFor(role), { replace: true });

  const onDemo = async (role: Role) => {
    setBusy(role);
    try {
      const p = await service.signInDemo(role);
      setProfile(p);
      go(p.role);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email) ?? (password ? null : 'Introduce tu contraseña.');
    setError(err);
    if (err) return;
    setBusy('password');
    try {
      const p = await service.signInWithPassword(email.trim(), password);
      setProfile(p);
      go(p.role);
    } catch (e2) {
      setError((e2 as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="login">
      <div className="login__card">
        <div className="row row--between">
          <BrandMark />
          <Link to="/" className="btn btn--ghost btn--sm">
            <Icon name="arrowLeft" size={16} /> Web
          </Link>
        </div>
        <div>
          <h1 className="page-title">Acceso</h1>
          <p className="page-sub">Área privada para clientes y entrenador.</p>
        </div>

        {sessionExpired && (
          <Notice kind="warn" icon="!">
            Tu sesión ha caducado. Vuelve a iniciar sesión.
          </Notice>
        )}

        {demo ? (
          <>
            <Notice kind="gold">
              <strong>Modo demo.</strong> Supabase no está configurado, así que no hay cuentas reales. Entra con un rol de
              ejemplo: los datos son ficticios y los cambios solo existen en esta pestaña.
            </Notice>
            <div className="role-buttons">
              <button type="button" className="btn btn--gold btn--lg btn--block" onClick={() => onDemo('trainer')} disabled={!!busy}>
                {busy === 'trainer' && <span className="spinner" aria-hidden="true" />}
                Entrar como entrenador (demo)
              </button>
              <button type="button" className="btn btn--outline-gold btn--lg btn--block" onClick={() => onDemo('client')} disabled={!!busy}>
                {busy === 'client' && <span className="spinner" aria-hidden="true" />}
                Entrar como cliente (demo)
              </button>
            </div>
            {error && (
              <Notice kind="danger" icon="!">
                {error}
              </Notice>
            )}
            <p className="small muted">
              El acceso con correo y contraseña se activa al configurar <code>VITE_SUPABASE_URL</code> y{' '}
              <code>VITE_SUPABASE_ANON_KEY</code>.
            </p>
          </>
        ) : (
          <form className="stack" onSubmit={onSubmit} noValidate>
            <Field label="Correo electrónico" htmlFor="l-email">
              <input
                id="l-email"
                className="input"
                type="email"
                inputMode="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Field>
            <Field label="Contraseña" htmlFor="l-pass">
              <input
                id="l-pass"
                className="input"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
            {error && (
              <Notice kind="danger" icon="!">
                {error}
              </Notice>
            )}
            <button type="submit" className="btn btn--gold btn--lg btn--block" disabled={!!busy}>
              {busy === 'password' && <span className="spinner" aria-hidden="true" />}
              Entrar
            </button>
            <p className="small muted">
              Las cuentas de cliente las crea tu entrenador (recibirás una invitación por correo). Las cuentas de entrenador se
              dan de alta de forma administrativa.
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
