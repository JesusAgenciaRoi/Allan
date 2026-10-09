import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ExerciseMedia, Framing } from '../types/domain';
import { DEFAULT_FRAMING } from '../types/domain';
import { canPan, MAX_SCALE, MIN_SCALE, normalizeFraming, panBy } from '../lib/framing';
import { ExerciseMediaView } from './ExerciseMediaView';
import { Icon } from './Icon';

/**
 * Editor de encuadre para GIF verticales u horizontales.
 * Ratón: arrastrar. Táctil: arrastrar con un dedo. Teclado: flechas (Mayús = paso grande), +/- zoom, 0 centrar.
 * Se guarda solo { fit, posX, posY, scale }; el archivo original no se toca.
 */
export function FramingEditor({
  media,
  title,
  value,
  saved,
  onChange,
}: {
  media: ExerciseMedia;
  title: string;
  value: Framing;
  /** Último encuadre guardado (para "deshacer cambios"). */
  saved: Framing;
  onChange: (f: Framing) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; y: number; id: number } | null>(null);
  const [guides, setGuides] = useState(true);
  const f = normalizeFraming(value);
  const pannable = canPan(f);
  const set = (patch: Partial<Framing>) => onChange(normalizeFraming({ ...f, ...patch }));

  const orientation =
    media.width && media.height
      ? media.width > media.height
        ? `Horizontal · ${media.width}×${media.height}`
        : media.width < media.height
          ? `Vertical · ${media.width}×${media.height}`
          : `Cuadrado · ${media.width}×${media.height}`
      : 'Dimensiones desconocidas';

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!pannable) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    onChange(panBy(f, e.clientX - d.x, e.clientY - d.y, rect.width, rect.height));
    drag.current = { ...d, x: e.clientX, y: e.clientY };
  };
  const endDrag = () => {
    drag.current = null;
  };
  const nudge = (dx: number, dy: number) => set({ posX: f.posX + dx, posY: f.posY + dy });
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const step = e.shiftKey ? 10 : 2;
    const map: Record<string, () => void> = {
      ArrowLeft: () => nudge(step, 0),
      ArrowRight: () => nudge(-step, 0),
      ArrowUp: () => nudge(0, step),
      ArrowDown: () => nudge(0, -step),
      '+': () => set({ scale: f.scale + 0.1 }),
      '=': () => set({ scale: f.scale + 0.1 }),
      '-': () => set({ scale: f.scale - 0.1 }),
      '0': () => set({ posX: 50, posY: 50 }),
    };
    const fn = map[e.key];
    if (fn) {
      e.preventDefault();
      fn();
    }
  };

  return (
    <div className="framer">
      <div className="stack" style={{ ['--stack' as string]: '10px' }}>
        <div className="row row--between">
          <span className="badge">{orientation}</span>
          <label className="checkbox small">
            <input type="checkbox" checked={guides} onChange={(e) => setGuides(e.target.checked)} />
            Guías
          </label>
        </div>
        <div
          ref={stageRef}
          className="framer__stage"
          data-pannable={pannable}
          tabIndex={0}
          role="application"
          aria-roledescription="Editor de encuadre"
          aria-label={`Encuadre de ${title}. ${
            pannable ? 'Arrastra o usa las flechas para mover; + y − para zoom; 0 para centrar.' : 'Activa "Rellenar" o aumenta el zoom para poder mover la imagen.'
          }`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          style={{ position: 'relative' }}
        >
          <ExerciseMediaView media={media} title={title} aspect="4 / 3" framingOverride={f} lazy={false} />
          {guides && <div className="framer__guides" aria-hidden="true" />}
        </div>
        <p className="small muted">
          Este recuadro (4:3) es el tamaño real de la ficha del ejercicio y de la rutina del cliente.{' '}
          {pannable ? 'Arrastra para recolocar.' : 'En "Contener" sin zoom se ve el GIF completo; los márgenes se rellenan con el fondo.'}
        </p>
      </div>

      <div className="framer__controls">
        <div className="field">
          <span className="field__label" id="fit-label">
            Modo de visualización
          </span>
          <div className="seg" role="group" aria-labelledby="fit-label">
            <button type="button" aria-pressed={f.fit === 'contain'} onClick={() => set({ fit: 'contain' })}>
              Contener todo
            </button>
            <button type="button" aria-pressed={f.fit === 'cover'} onClick={() => set({ fit: 'cover' })}>
              Rellenar recortando
            </button>
          </div>
        </div>

        <div className="field">
          <label className="field__label" htmlFor="zoom">
            Zoom · {f.scale.toFixed(2)}×
          </label>
          <div className="row" style={{ flexWrap: 'nowrap' }}>
            <button type="button" className="btn btn--sm" aria-label="Reducir zoom" onClick={() => set({ scale: f.scale - 0.1 })} disabled={f.scale <= MIN_SCALE}>
              −
            </button>
            <input
              id="zoom"
              className="range"
              type="range"
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.05}
              value={f.scale}
              onChange={(e) => set({ scale: Number(e.target.value) })}
            />
            <button type="button" className="btn btn--sm" aria-label="Aumentar zoom" onClick={() => set({ scale: f.scale + 0.1 })} disabled={f.scale >= MAX_SCALE}>
              +
            </button>
          </div>
        </div>

        <div className="form-grid form-grid--2">
          <div className="field">
            <label className="field__label" htmlFor="posx">
              Horizontal · {Math.round(f.posX)}%
            </label>
            <input id="posx" className="range" type="range" min={0} max={100} step={1} value={f.posX} disabled={!pannable} onChange={(e) => set({ posX: Number(e.target.value) })} />
          </div>
          <div className="field">
            <label className="field__label" htmlFor="posy">
              Vertical · {Math.round(f.posY)}%
            </label>
            <input id="posy" className="range" type="range" min={0} max={100} step={1} value={f.posY} disabled={!pannable} onChange={(e) => set({ posY: Number(e.target.value) })} />
          </div>
        </div>

        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="nudge" role="group" aria-label="Mover encuadre">
            <span />
            <button type="button" aria-label="Mover arriba" disabled={!pannable} onClick={() => nudge(0, 5)}>
              ↑
            </button>
            <span />
            <button type="button" aria-label="Mover a la izquierda" disabled={!pannable} onClick={() => nudge(5, 0)}>
              ←
            </button>
            <button type="button" aria-label="Centrar" onClick={() => set({ posX: 50, posY: 50 })}>
              <Icon name="center" size={16} />
            </button>
            <button type="button" aria-label="Mover a la derecha" disabled={!pannable} onClick={() => nudge(-5, 0)}>
              →
            </button>
            <span />
            <button type="button" aria-label="Mover abajo" disabled={!pannable} onClick={() => nudge(0, -5)}>
              ↓
            </button>
            <span />
          </div>
          <div className="stack" style={{ ['--stack' as string]: '8px', flex: 1, minWidth: 160 }}>
            <button type="button" className="btn btn--sm" onClick={() => set({ posX: 50, posY: 50 })}>
              <Icon name="center" size={16} /> Centrar
            </button>
            <button type="button" className="btn btn--sm" onClick={() => onChange({ ...DEFAULT_FRAMING })}>
              <Icon name="reset" size={16} /> Restablecer encuadre
            </button>
            <button
              type="button"
              className="btn btn--sm btn--ghost"
              onClick={() => onChange(normalizeFraming(saved))}
              disabled={JSON.stringify(normalizeFraming(saved)) === JSON.stringify(f)}
            >
              Deshacer cambios sin guardar
            </button>
          </div>
        </div>

        <div className="field">
          <span className="field__label">Vista previa</span>
          <div className="previews">
            <div className="stack" style={{ ['--stack' as string]: '6px' }}>
              <span className="small muted">Ficha / rutina (4:3)</span>
              <div className="preview-phone">
                <ExerciseMediaView media={media} title={title} aspect="4 / 3" framingOverride={f} lazy={false} />
                <p className="small" style={{ marginTop: 6, fontWeight: 600 }}>
                  {title}
                </p>
              </div>
            </div>
            <div className="stack" style={{ ['--stack' as string]: '6px' }}>
              <span className="small muted">Miniatura en listas (1:1)</span>
              <div className="preview-phone" style={{ maxWidth: 140 }}>
                <ExerciseMediaView media={media} title={title} aspect="1 / 1" framingOverride={f} lazy={false} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

