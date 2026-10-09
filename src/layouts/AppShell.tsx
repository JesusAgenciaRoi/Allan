import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { BrandMark, ConfirmDialog } from '../components/ui';
import { Icon, type IconName } from '../components/Icon';
import { useData, useQuery } from '../state/DataContext';
import { useToast } from '../state/ToastContext';
import type { Role } from '../types/domain';
import { homeFor } from '../lib/routes';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  end?: boolean;
  badge?: number;
}

/** Protege rutas privadas: exige sesión y el rol adecuado. Los permisos reales los aplica RLS en el servidor. */
export function RequireRole({ role }: { role: Role }) {
  const { profile, booting, service } = useData();
  const location = useLocation();
  if (booting || !service) {
    return (
      <div className="login">
        <span className="spinner" role="status" aria-label="Comprobando sesión" />
      </div>
    );
  }
  if (!profile) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  if (profile.role !== role) return <Navigate to={homeFor(profile.role)} replace />;
  return <AppShell role={role} />;
}

/** /app → redirige según el rol. */
export function AppIndexRedirect() {
  const { profile, booting } = useData();
  if (booting) return null;
  return <Navigate to={profile ? homeFor(profile.role) : '/login'} replace />;
}

function AppShell({ role }: { role: Role }) {
  const { service, profile, setProfile, version, lastChangeRealtime } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [confirmReset, setConfirmReset] = useState(false);
  const notifications = useQuery((s) => s.listNotifications());
  const openReports = useQuery((s) => (role === 'trainer' ? s.listReports({ status: 'pendiente' }) : Promise.resolve([])), [role]);
  const unread = notifications.data?.filter((n) => !n.readAt).length ?? 0;
  const pending = openReports.data?.length ?? 0;
  const mainRef = useRef<HTMLElement>(null);
  const prevUnread = useRef<number | null>(null);

  // Aviso cuando llega una notificación nueva (Realtime en modo conectado).
  useEffect(() => {
    if (prevUnread.current !== null && unread > prevUnread.current && lastChangeRealtime) {
      toast('info', 'Tienes una notificación nueva.');
    }
    prevUnread.current = unread;
  }, [unread, lastChangeRealtime, toast, version]);

  // Al cambiar de página: foco al contenido principal (accesibilidad) y scroll arriba.
  useEffect(() => {
    window.scrollTo({ top: 0 });
    mainRef.current?.focus({ preventScroll: true });
  }, [location.pathname]);

  const base = role === 'trainer' ? '/app/entrenador' : '/app/cliente';
  const items: NavItem[] =
    role === 'trainer'
      ? [
          { to: base, label: 'Inicio', icon: 'home', end: true },
          { to: `${base}/clientes`, label: 'Clientes', icon: 'users' },
          { to: `${base}/reportes`, label: 'Reportes', icon: 'alert', badge: pending },
          { to: `${base}/ejercicios`, label: 'Ejercicios', icon: 'dumbbell' },
          { to: `${base}/planes`, label: 'Planes', icon: 'calendar' },
        ]
      : [
          { to: base, label: 'Hoy', icon: 'home', end: true },
          { to: `${base}/rutina`, label: 'Rutina', icon: 'calendar' },
          { to: `${base}/historial`, label: 'Historial', icon: 'history' },
          { to: `${base}/reportes`, label: 'Reportes', icon: 'chat' },
          { to: `${base}/notificaciones`, label: 'Avisos', icon: 'bell', badge: unread },
        ];

  const logout = async () => {
    await service?.signOut();
    setProfile(null);
    navigate('/login', { replace: true });
  };
  const switchRole = async () => {
    if (!service) return;
    const p = await service.signInDemo(role === 'trainer' ? 'client' : 'trainer');
    setProfile(p);
    navigate(homeFor(p.role));
  };

  return (
    <div className="app-shell">
      <a href="#app-main" className="skip-link">
        Saltar al contenido
      </a>
      {service?.mode === 'demo' && (
        <div className="demo-banner" role="note">
          <span className="demo-banner__text">
            <span className="badge badge--demo">Modo demo</span>
            Datos ficticios · sin persistencia real (solo esta pestaña).
          </span>
          <span className="demo-banner__actions">
            <button type="button" className="btn btn--sm btn--outline-gold" onClick={switchRole}>
              <Icon name="swap" size={16} /> Ver como {role === 'trainer' ? 'cliente' : 'entrenador'}
            </button>
            <button type="button" className="btn btn--sm btn--ghost" onClick={() => setConfirmReset(true)}>
              <Icon name="reset" size={16} /> Restablecer demo
            </button>
          </span>
        </div>
      )}
      <header className="app-topbar">
        <div className="row">
          <BrandMark to={base} label="AF Team — inicio del panel" />
          <span className="badge badge--gold app-topbar__role">{role === 'trainer' ? 'Entrenador' : 'Cliente'}</span>
        </div>
        <div className="app-topbar__actions">
          <span className="small muted app-topbar__role">{profile?.fullName}</span>
          <Link
            to={`${base}/notificaciones`}
            className="btn btn--ghost btn--icon bell"
            aria-label={`Notificaciones${unread ? `: ${unread} sin leer` : ''}`}
          >
            <Icon name="bell" size={22} />
            {unread > 0 && (
              <span className="bell__count" key={unread} aria-hidden="true">
                {unread}
              </span>
            )}
          </Link>
          <button type="button" className="btn btn--ghost btn--icon" onClick={logout} aria-label="Cerrar sesión" title="Cerrar sesión">
            <Icon name="logout" size={20} />
          </button>
        </div>
      </header>
      <div className="app-body">
        <aside className="app-sidebar" aria-label="Navegación del panel">
          <nav>
            <ul>
              {items.map((it) => (
                <li key={it.to}>
                  <NavLink to={it.to} end={it.end}>
                    <Icon name={it.icon} />
                    {it.label}
                    {!!it.badge && (
                      <span className="nav-badge" aria-label={`${it.badge} pendientes`}>
                        {it.badge}
                      </span>
                    )}
                  </NavLink>
                </li>
              ))}
              {role === 'trainer' && (
                <li>
                  <NavLink to={`${base}/notificaciones`}>
                    <Icon name="bell" />
                    Notificaciones
                    {unread > 0 && <span className="nav-badge">{unread}</span>}
                  </NavLink>
                </li>
              )}
            </ul>
          </nav>
          {role === 'trainer' && (
            <div className="app-sidebar__quick">
              <span className="eyebrow" style={{ fontSize: '0.8rem' }}>
                Accesos rápidos
              </span>
              <Link to={`${base}/clientes?nuevo=1`} className="btn btn--sm btn--outline-gold">
                <Icon name="plus" size={16} /> Nuevo cliente
              </Link>
              <Link to={`${base}/ejercicios/nuevo`} className="btn btn--sm">
                <Icon name="upload" size={16} /> Subir ejercicio
              </Link>
            </div>
          )}
        </aside>
        <main id="app-main" className="app-main" ref={mainRef} tabIndex={-1} style={{ outline: 'none' }}>
          <Outlet />
        </main>
      </div>
      <nav className="bottom-nav" style={{ ['--items' as string]: items.length }} aria-label="Navegación principal">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end}>
            <Icon name={it.icon} />
            {it.label}
            {!!it.badge && (
              <span className="nav-badge" aria-label={`${it.badge} pendientes`}>
                {it.badge}
              </span>
            )}
          </NavLink>
        ))}
      </nav>
      {confirmReset && (
        <ConfirmDialog
          title="Restablecer demo"
          message="Se borrarán todos los cambios hechos en esta pestaña y se volverán a cargar los datos de ejemplo."
          confirmLabel="Restablecer"
          danger
          onCancel={() => setConfirmReset(false)}
          onConfirm={async () => {
            await service?.resetDemo?.();
            setConfirmReset(false);
            toast('success', 'Datos de demostración restablecidos.');
          }}
        />
      )}
    </div>
  );
}
