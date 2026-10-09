import type { CSSProperties } from 'react';
import type { Framing } from '../types/domain';
import { DEFAULT_FRAMING } from '../types/domain';

export const MIN_SCALE = 1;
export const MAX_SCALE = 3;

export const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export function normalizeFraming(f: Partial<Framing> | null | undefined): Framing {
  const base = { ...DEFAULT_FRAMING, ...(f ?? {}) };
  return {
    fit: base.fit === 'cover' ? 'cover' : 'contain',
    posX: clamp(Number(base.posX) || 0, 0, 100),
    posY: clamp(Number(base.posY) || 0, 0, 100),
    scale: clamp(Number(base.scale) || 1, MIN_SCALE, MAX_SCALE),
  };
}

/**
 * Estilo del <img>/<video> para un encuadre. Solo CSS: object-fit + object-position + transform.
 * El GIF se sigue reproduciendo (no se pasa por canvas) y el archivo original no se modifica.
 * transform-origin coincide con el punto focal para que el zoom "apunte" allí.
 */
export function framingStyle(f: Framing): CSSProperties {
  const n = normalizeFraming(f);
  return {
    width: '100%',
    height: '100%',
    objectFit: n.fit,
    objectPosition: `${n.posX}% ${n.posY}%`,
    transform: n.scale !== 1 ? `scale(${n.scale})` : undefined,
    transformOrigin: `${n.posX}% ${n.posY}%`,
  };
}

/** ¿Tiene sentido desplazar? En contain sin zoom la imagen cabe entera y no hay nada que mover. */
export function canPan(f: Framing): boolean {
  return f.fit === 'cover' || f.scale > 1;
}

/**
 * Convierte un arrastre en píxeles a un cambio de posición en %.
 * Arrastrar a la derecha mueve el contenido a la derecha → el punto focal se desplaza a la izquierda.
 */
export function panBy(f: Framing, dxPx: number, dyPx: number, boxW: number, boxH: number): Framing {
  const k = 100 / Math.max(1, f.scale);
  return normalizeFraming({
    ...f,
    posX: f.posX - (dxPx / Math.max(1, boxW)) * k,
    posY: f.posY - (dyPx / Math.max(1, boxH)) * k,
  });
}
