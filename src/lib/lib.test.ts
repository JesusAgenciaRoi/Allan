import { describe, expect, it } from 'vitest';
import { canPan, framingStyle, normalizeFraming, panBy } from './framing';
import { storagePathFor, validateEmail, validateMediaFile, validatePhone } from './validation';

describe('encuadre', () => {
  it('limita valores y usa contain por defecto', () => {
    expect(normalizeFraming({ fit: 'x' as never, posX: 150, posY: -3, scale: 9 })).toEqual({ fit: 'contain', posX: 100, posY: 0, scale: 3 });
  });
  it('genera CSS sin canvas (object-fit/position + scale)', () => {
    const s = framingStyle({ fit: 'cover', posX: 30, posY: 70, scale: 1.5 });
    expect(s.objectFit).toBe('cover');
    expect(s.objectPosition).toBe('30% 70%');
    expect(s.transform).toBe('scale(1.5)');
    expect(framingStyle({ fit: 'contain', posX: 50, posY: 50, scale: 1 }).transform).toBeUndefined();
  });
  it('solo permite mover si hay algo que mover', () => {
    expect(canPan({ fit: 'contain', posX: 50, posY: 50, scale: 1 })).toBe(false);
    expect(canPan({ fit: 'contain', posX: 50, posY: 50, scale: 1.2 })).toBe(true);
    expect(canPan({ fit: 'cover', posX: 50, posY: 50, scale: 1 })).toBe(true);
  });
  it('arrastrar a la derecha desplaza el punto focal a la izquierda', () => {
    const f = panBy({ fit: 'cover', posX: 50, posY: 50, scale: 1 }, 40, 0, 400, 300);
    expect(f.posX).toBe(40);
    expect(f.posY).toBe(50);
  });
});

describe('validación', () => {
  it('correo y teléfono', () => {
    expect(validateEmail('a@b.co')).toBeNull();
    expect(validateEmail('a@b')).not.toBeNull();
    expect(validatePhone('')).toBeNull();
    expect(validatePhone('12')).not.toBeNull();
  });
  it('archivos: tipo, extensión y tamaño', () => {
    expect(validateMediaFile({ name: 'x.gif', type: 'image/gif', size: 1000 }, 1).ok).toBe(true);
    expect(validateMediaFile({ name: 'x.png', type: 'image/png', size: 1000 }, 1).ok).toBe(false);
    expect(validateMediaFile({ name: 'x.mp4', type: 'image/gif', size: 1000 }, 1).ok).toBe(false);
    expect(validateMediaFile({ name: 'x.gif', type: 'image/gif', size: 2 * 1048576 }, 1).error).toMatch(/máximo de|máximo es/);
  });
  it('rutas de Storage únicas y sin datos personales', () => {
    const a = storagePathFor('owner', 'ex', 'gif');
    const b = storagePathFor('owner', 'ex', 'gif');
    expect(a).not.toBe(b);
    expect(a).toMatch(/^owner\/ex\/[\w-]+\.gif$/);
  });
});
