import type { Category, Profile } from './types';

export const DEFAULT_PROFILE: Profile = {
  name: 'Alexis R.',
  alias: 'thealex',
  tagline: 'Edito Reels, TikToks y videos de YouTube que retienen hasta el último segundo.',
  location: 'Colombia',
  bio:
    'Soy Alexis, editor de video. Trabajo con creadores y marcas convirtiendo material en bruto en piezas con ritmo, buen sonido y subtítulos que enganchan.\n' +
    'Busco sumarme a agencias y productoras que quieran un editor rápido y detallista.',
  tools: 'Premiere Pro',
  services: [
    'Edición para Reels y TikTok',
    'Edición de videos para YouTube',
    'Subtítulos dinámicos',
    'Color y mezcla de sonido',
  ],
  email: 'ruisito124@gmail.com',
  phone: '+57 323 425 6883',
  x: '@Alexisrq007',
  discord: 'TheAlex021',
  // Avatar animado: cejas y sonrisa (public/perfil-animado.webp). Versión fija: public/perfil.png
  // Si subes otra foto en el panel, la reemplaza.
  photoUrl: '/perfil-animado.webp',
};

export const CATS: Record<Category, string> = {
  reels: 'Reels y TikTok',
  youtube: 'YouTube',
};

export const MAX_UPLOAD_MB = Number(process.env.NEXT_PUBLIC_MAX_UPLOAD_MB) || 50;
export const SHOW_LOGIN_BUTTON = process.env.NEXT_PUBLIC_SHOW_LOGIN_BUTTON !== 'false';
export const AUTOPLAY_FEATURED = true;

export const VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

/** Ilustraciones del propio sitio (carpeta public/): sin filtro "washed" y con animación suave. */
export const isIllustration = (url: string | null) => Boolean(url && url.startsWith('/'));

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export function toolList(tools: string) {
  return tools
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function contactLinks(p: Profile) {
  const digits = (p.phone || '').replace(/\D/g, '');
  const handle = (p.x || '').trim().replace(/^@/, '');
  return {
    mailto: p.email ? `mailto:${p.email}` : undefined,
    whatsapp: digits ? `https://wa.me/${digits}` : undefined,
    x: handle ? `https://x.com/${handle}` : undefined,
    xLabel: handle ? `@${handle}` : '',
  };
}
