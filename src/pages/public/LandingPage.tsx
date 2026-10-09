import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useParams } from 'react-router-dom';
import { SITE } from '../../content/site';
import { config } from '../../config';
import { Icon, type IconName } from '../../components/Icon';
import { useParallax, useReveal } from '../../hooks/useReveal';
import { NAV, SiteHeader } from './SiteHeader';
import { ContactForm } from './ContactForm';
import { BrandMark } from '../../components/ui';

const SECTION_IDS = NAV.map((n) => n.id) as string[];

export default function LandingPage() {
  const { section } = useParams();
  const location = useLocation();
  const [active, setActive] = useState('inicio');
  const heroMedia = useRef<HTMLDivElement>(null);
  useReveal();
  useParallax(heroMedia);

  // Navegación por ruta (/servicios, /planes...) → desplaza a la sección.
  useEffect(() => {
    const id = section ?? 'inicio';
    const el = document.getElementById(id);
    if (!el) return;
    if (id === 'inicio') window.scrollTo({ top: 0 });
    else el.scrollIntoView();
    el.focus({ preventScroll: true });
  }, [section, location.key]);

  // Scroll-spy para resaltar el menú.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (vis) setActive(vis.target.id);
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    SECTION_IDS.forEach((id) => {
      const el = document.getElementById(id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    document.title = 'AF Team — Fuerza. Disciplina. Propósito.';
  }, []);

  if (section && !SECTION_IDS.includes(section)) return <Navigate to="/" replace />;

  const wa = config.whatsappNumber
    ? `https://wa.me/${config.whatsappNumber}?text=${encodeURIComponent(SITE.contact.whatsappMessage)}`
    : null;

  return (
    <>
      <a href="#main" className="skip-link">
        Saltar al contenido
      </a>
      <SiteHeader active={active} />
      <main id="main">
        {/* ============ HERO ============ */}
        <section id="inicio" className="hero" tabIndex={-1} aria-label="Inicio">
          <div className="hero__media" ref={heroMedia}>
            <picture>
              <source media="(max-width: 700px)" srcSet="/media/hero-athlete-sm.webp" type="image/webp" />
              <source srcSet="/media/hero-athlete.webp" type="image/webp" />
              <img
                src="/media/hero-athlete.jpg"
                alt="Atleta de AF Team de espaldas en un gimnasio oscuro, con la camiseta del equipo"
                width={784}
                height={899}
                fetchPriority="high"
              />
            </picture>
          </div>
          <div className="hero__content">
            <h1 className="hero__title">AF TEAM</h1>
            <p className="hero__tagline">{SITE.tagline}</p>
            <hr className="hero__rule" />
            <p className="hero__text">{SITE.heroText}</p>
            <div className="hero__actions">
              <Link to="/contacto" className="btn btn--gold btn--lg">
                {SITE.ctaPrimary}
                <Icon name="arrowRight" size={22} className="btn__arrow" />
              </Link>
            </div>
          </div>
          <span className="hero__scroll" aria-hidden="true" />
        </section>

        {/* ============ SOBRE ============ */}
        <section id="sobre" className="section" tabIndex={-1} aria-labelledby="sobre-t">
          <div className="container about">
            <img className="about__logo reveal" src="/brand/af-logo-512.webp" alt="Logotipo de AF Team: Disciplina, proceso, resultados" width={512} height={512} loading="lazy" />
            <div>
              <div className="section__head reveal">
                <span className="eyebrow">{SITE.about.eyebrow}</span>
                <h2 id="sobre-t" className="section__title">
                  {SITE.about.title}
                </h2>
              </div>
              <div className="about__text reveal">
                {SITE.about.paragraphs.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <div className="pillars">
                {SITE.about.pillars.map((p, i) => (
                  <div key={p.title} className="pillar reveal" style={{ ['--reveal-delay' as string]: `${i * 80}ms` }}>
                    <p className="pillar__title">{p.title}</p>
                    <p className="muted">{p.text}</p>
                  </div>
                ))}
              </div>
              <p className="demo-note">
                <span className="badge">Editable</span> {SITE.about.note}
              </p>
            </div>
          </div>
        </section>

        {/* ============ SERVICIOS ============ */}
        <section id="servicios" className="section section--alt" tabIndex={-1} aria-labelledby="serv-t">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Servicios</span>
              <h2 id="serv-t" className="section__title">
                Todo lo que necesitas para progresar
              </h2>
              <p className="section__lead">Contenido sujeto a confirmación del entrenador.</p>
            </div>
            <div className="services">
              {SITE.services.map((s, i) => (
                <article key={s.title} className="service reveal" style={{ ['--reveal-delay' as string]: `${i * 90}ms` }}>
                  <Icon name={s.icon as IconName} className="service__icon" />
                  <h3 className="service__title">{s.title}</h3>
                  <p>{s.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ============ PLANES ============ */}
        <section id="planes" className="section" tabIndex={-1} aria-labelledby="planes-t">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Planes</span>
              <h2 id="planes-t" className="section__title">
                Elige cómo entrenar con nosotros
              </h2>
            </div>
            <div className="plans">
              {SITE.plans.map((p, i) => (
                <article
                  key={p.name}
                  className={`plan reveal ${p.featured ? 'plan--featured' : ''}`}
                  style={{ ['--reveal-delay' as string]: `${i * 90}ms` }}
                  aria-label={`Plan ${p.name}`}
                >
                  <div className="row row--between">
                    <h3 className="plan__name">{p.name}</h3>
                    {p.featured && <span className="badge badge--gold">Recomendado</span>}
                  </div>
                  <p className="muted">{p.description}</p>
                  <ul className="plan__list">
                    {p.includes.map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                  <p className="plan__price">
                    {p.price} <span className="small muted">· precio configurable</span>
                  </p>
                  <Link to="/contacto" className={`btn ${p.featured ? 'btn--gold' : 'btn--outline-gold'} btn--block`}>
                    Solicitar información
                  </Link>
                </article>
              ))}
            </div>
            <p className="demo-note">
              <span className="badge">Demo</span> {SITE.plansNote}
            </p>
          </div>
        </section>

        {/* ============ TESTIMONIOS ============ */}
        <section id="testimonios" className="section section--alt" tabIndex={-1} aria-labelledby="test-t">
          <div className="container">
            <div className="section__head reveal">
              <span className="eyebrow">Testimonios</span>
              <h2 id="test-t" className="section__title">
                Lo que se vive en el team
              </h2>
            </div>
            <div className="notice notice--warn reveal" style={{ marginBottom: 18 }}>
              <span className="notice__icon">!</span>
              <span>{SITE.testimonialsNote}</span>
            </div>
            <div className="testimonials">
              {SITE.testimonials.map((t, i) => (
                <figure key={i} className="testimonial reveal" style={{ ['--reveal-delay' as string]: `${i * 90}ms` }}>
                  <blockquote>{t.quote}</blockquote>
                  <figcaption>
                    {t.author} · <span className="gold">{t.detail}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        </section>

        {/* ============ CONTACTO ============ */}
        <section id="contacto" className="section" tabIndex={-1} aria-labelledby="contacto-t">
          <div className="container contact">
            <div className="contact__aside reveal">
              <span className="eyebrow">Contacto</span>
              <h2 id="contacto-t" className="section__title">
                {SITE.contact.title}
              </h2>
              <p className="section__lead">{SITE.contact.text}</p>
              {wa ? (
                <a className="btn btn--outline-gold btn--lg" href={wa} target="_blank" rel="noopener noreferrer">
                  <Icon name="whatsapp" size={22} /> Escríbenos por WhatsApp
                </a>
              ) : (
                <p className="small muted">
                  WhatsApp no configurado (variable <code>VITE_WHATSAPP_NUMBER</code>).
                </p>
              )}
              <p className="small muted">{SITE.privacy}</p>
            </div>
            <div className="reveal">
              <ContactForm />
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function SiteFooter() {
  const socials = [
    { label: 'Instagram', url: config.social.instagram },
    { label: 'TikTok', url: config.social.tiktok },
    { label: 'YouTube', url: config.social.youtube },
  ].filter((s) => s.url);
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="site-footer__grid">
          <div className="stack">
            <BrandMark />
            <p className="muted">{SITE.tagline}</p>
          </div>
          <nav aria-label="Pie de página">
            <h3>Navegación</h3>
            <ul>
              {NAV.map((n) => (
                <li key={n.id}>
                  <Link to={n.id === 'inicio' ? '/' : `/${n.id}`}>{n.label}</Link>
                </li>
              ))}
              <li>
                <Link to="/login">Acceso a la app</Link>
              </li>
            </ul>
          </nav>
          <div>
            <h3>Redes</h3>
            {socials.length ? (
              <ul>
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="small muted">Redes sociales configurables en las variables VITE_INSTAGRAM_URL, VITE_TIKTOK_URL y VITE_YOUTUBE_URL.</p>
            )}
          </div>
        </div>
        <div className="site-footer__legal">
          <p>
            <strong>Aviso de privacidad (borrador):</strong> {SITE.privacy}
          </p>
          <p>
            La app de seguimiento no es un servicio médico: los reportes de molestias sirven para que el entrenador ajuste el
            entrenamiento. Ante dolor intenso o síntomas preocupantes, consulta con un profesional sanitario.
          </p>
          <p>© {new Date().getFullYear()} AF Team. Contenido de demostración.</p>
        </div>
      </div>
    </footer>
  );
}
