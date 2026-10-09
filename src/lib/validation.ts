import { config } from '../config';

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(v: string): string | null {
  if (!v.trim()) return 'Introduce un correo electrónico.';
  if (!EMAIL_RE.test(v.trim())) return 'El correo no tiene un formato válido (ej.: nombre@dominio.com).';
  return null;
}

export function validatePhone(v: string, required = false): string | null {
  const digits = v.replace(/\D/g, '');
  if (!digits) return required ? 'Introduce un teléfono.' : null;
  if (digits.length < 7 || digits.length > 15) return 'El teléfono debe tener entre 7 y 15 dígitos.';
  return null;
}

export function validateRequired(v: string, label: string, max = 120): string | null {
  if (!v.trim()) return `${label} es obligatorio.`;
  if (v.trim().length > max) return `${label} no puede superar ${max} caracteres.`;
  return null;
}

const EXT_BY_MIME: Record<string, string> = {
  'image/gif': 'gif',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
};

export interface MediaCheck {
  ok: boolean;
  error?: string;
  ext?: string;
}

/** Valida tipo MIME + extensión + tamaño. El bucket de Storage impone las mismas reglas en servidor. */
export function validateMediaFile(file: Pick<File, 'name' | 'type' | 'size'>, maxMb = config.maxUploadMb): MediaCheck {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const expected = EXT_BY_MIME[file.type];
  if (!expected) {
    return { ok: false, error: `Formato no admitido (${file.type || 'desconocido'}). Usa GIF, MP4 o WebM.` };
  }
  if (ext !== expected) {
    return { ok: false, error: `La extensión .${ext} no coincide con el tipo de archivo (${file.type}).` };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, error: `El archivo pesa ${(file.size / 1048576).toFixed(1)} MB; el máximo es ${maxMb} MB.` };
  }
  if (file.size === 0) return { ok: false, error: 'El archivo está vacío.' };
  return { ok: true, ext: expected };
}

/** Nombre único y sin datos personales para Storage: <trainer>/<exercise>/<uuid>.<ext> */
export function storagePathFor(ownerId: string, exerciseId: string, ext: string): string {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2);
  return `${ownerId}/${exerciseId}/${id}.${ext}`;
}
