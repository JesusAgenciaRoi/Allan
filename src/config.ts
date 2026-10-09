// Configuración leída de variables de entorno (Vite). Nada aquí es secreto:
// la anon key de Supabase es pública por diseño y la seguridad depende de RLS.

const env = import.meta.env;

const supabaseUrl = (env.VITE_SUPABASE_URL ?? '').trim();
const supabaseAnonKey = (env.VITE_SUPABASE_ANON_KEY ?? '').trim();
const forceDemo = String(env.VITE_FORCE_DEMO ?? '').toLowerCase() === 'true';

export const config = {
  supabaseUrl,
  supabaseAnonKey,
  /** true = modo conectado (Supabase). false = modo demo local, sin persistencia real. */
  isConnected: Boolean(supabaseUrl && supabaseAnonKey) && !forceDemo,
  mediaBucket: (env.VITE_EXERCISE_MEDIA_BUCKET ?? 'exercise-media').trim() || 'exercise-media',
  maxUploadMb: Number(env.VITE_MAX_UPLOAD_MB ?? 15) || 15,
  acceptedMediaTypes: ['image/gif', 'video/mp4', 'video/webm'] as const,
  whatsappNumber: (env.VITE_WHATSAPP_NUMBER ?? '').replace(/\D/g, ''),
  social: {
    instagram: (env.VITE_INSTAGRAM_URL ?? '').trim(),
    tiktok: (env.VITE_TIKTOK_URL ?? '').trim(),
    youtube: (env.VITE_YOUTUBE_URL ?? '').trim(),
  },
};

export type AppConfig = typeof config;
