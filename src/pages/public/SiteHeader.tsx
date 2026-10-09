import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { BrandMark } from '../../components/ui';

export const NAV = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'sobre', label: 'Sobre AF Team' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'planes', label: 'Planes' },
  { id: 'testimonios', label: 'Testimonios' },
  { id: 'contacto', label: 'Contacto' },
] as const;

export function SiteHeader({ active }: { active: string }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setOpen(false), [location]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);

  const href = (id: string) => (id === 'inicio' ? '/' : `/${id}`);

  return (
    <>
    <header className="site-header">
      <div className="site-header__inner">
        <BrandMark />
        <nav className="site-nav" aria-label="Principal">
          <ul className="site-nav__list">
            {NAV.map((n) => (
              <li key={n.id}>
                <Link className="site-nav__link" to={href(n.id)} aria-current={active === n.id ? 'true' : undefined}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="site-header__actions">
          <Link to="/login" className="btn btn--ghost btn--sm">
            Acceso
          </Link>
          <Link to="/contacto" className="btn btn--outline-gold site-header__cta">
            Únete al team
          </Link>
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setOpen((o) => !o)}
          >
            <span className="menu-toggle__bars" aria-hidden="true" />
          </button>
        </div>
      </div>
    </header>
      {open && (
        <nav id="mobile-menu" className="mobile-menu" aria-label="Menú móvil">
          <ul>
            {NAV.map((n) => (
              <li key={n.id}>
                <Link to={href(n.id)} aria-current={active === n.id ? 'true' : undefined} onClick={() => setOpen(false)}>
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
          <div className="stack">
            <Link to="/contacto" className="btn btn--gold btn--lg btn--block" onClick={() => setOpen(false)}>
              Únete al team
            </Link>
            <Link to="/login" className="btn btn--block" onClick={() => setOpen(false)}>
              Acceso clientes y entrenador
            </Link>
          </div>
        </nav>
      )}
    </>
  );
}
