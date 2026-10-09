import { useEffect } from 'react';

/** Activa las animaciones de entrada (.reveal) cuando los elementos entran en pantalla. */
export function useReveal(deps: unknown[] = []) {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>('.reveal:not(.is-visible)'));
    if (!('IntersectionObserver' in window)) {
      els.forEach((el) => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Parallax sutil: solo con puntero fino (no táctil) y sin reduced-motion. */
export function useParallax(ref: React.RefObject<HTMLElement | null>, factor = 0.18) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ok = window.matchMedia('(pointer: fine) and (prefers-reduced-motion: no-preference)').matches;
    if (!ok) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, window.innerHeight);
        el.style.setProperty('--parallax', `${(y * factor).toFixed(1)}px`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref, factor]);
}
