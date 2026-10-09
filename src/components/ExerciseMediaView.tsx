import type { CSSProperties } from 'react';
import type { ExerciseMedia, Framing } from '../types/domain';
import { framingStyle } from '../lib/framing';

/**
 * Muestra el GIF/vídeo de un ejercicio con su encuadre guardado.
 * - Solo CSS (object-fit/object-position/transform): la animación del GIF se conserva.
 * - `aspect` fija la caja; el contenido nunca se deforma.
 */
export function ExerciseMediaView({
  media,
  title,
  aspect = '4 / 3',
  framingOverride,
  lazy = true,
  className = '',
  style,
}: {
  media: ExerciseMedia | null | undefined;
  title: string;
  aspect?: string;
  framingOverride?: Framing;
  lazy?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const boxStyle = { ['--ar' as string]: aspect, ...style } as CSSProperties;
  if (!media || !media.url) {
    return (
      <div className={`media-frame media-frame--placeholder ${className}`} style={boxStyle} role="img" aria-label={`${title}: sin demostración`}>
        <span>{media && !media.url ? 'Vista previa local no disponible tras recargar (modo demo)' : 'Sin GIF'}</span>
      </div>
    );
  }
  const f = framingOverride ?? media.framing;
  const isVideo = media.mimeType.startsWith('video/');
  return (
    <div className={`media-frame ${className}`} style={boxStyle}>
      {isVideo ? (
        <video
          src={media.url}
          style={framingStyle(f)}
          autoPlay
          loop
          muted
          playsInline
          preload={lazy ? 'metadata' : 'auto'}
          aria-label={`Demostración en vídeo: ${title}`}
        />
      ) : (
        <img
          src={media.url}
          alt={`Demostración animada: ${title}`}
          style={framingStyle(f)}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          draggable={false}
          width={media.width ?? undefined}
          height={media.height ?? undefined}
        />
      )}
    </div>
  );
}
