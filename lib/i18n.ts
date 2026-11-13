import type { Category, Profile } from './types';

export type Lang = 'es' | 'en';
export const LANG_KEY = 'thealex.lang';

/** Textos fijos del portafolio público (el login y el panel quedan en español). */
export const T = {
  es: {
    navLabel: 'Principal',
    work: 'Trabajo',
    about: 'Sobre mí',
    services: 'Servicios',
    contact: 'Contacto',
    openMenu: 'Abrir menú',
    closeMenu: 'Cerrar menú',
    langGroup: 'Idioma',
    role: 'Editor de video',
    seeWork: 'Ver mi trabajo',
    writeMe: 'Escríbeme',
    featuredTitle: 'Tu reel destacado',
    featuredText: 'Sube un video desde el panel y márcalo como destacado.',
    filterGroup: 'Filtrar por categoría',
    all: 'Todos',
    cats: { reels: 'Reels y TikTok', youtube: 'YouTube' } as Record<Category, string>,
    emptyNone: 'Aún no hay videos',
    emptyCat: 'Nada en esta categoría todavía',
    emptyText: 'Entra a tu panel y sube tus Reels, TikToks o videos de YouTube. Aparecerán aquí al instante.',
    watch: 'Ver',
    aboutTitle: 'Sobre mí',
    servicesTitle: 'Servicios',
    contactTitle: '¿Editamos tu próximo video?',
    copied: '¡Copiado! ',
    discordTitle: 'Copiar mi usuario de Discord',
    discordHint: 'Búscame en Discord con ese usuario para agregarme.',
    close: 'Cerrar',
  },
  en: {
    navLabel: 'Main',
    work: 'Work',
    about: 'About me',
    services: 'Services',
    contact: 'Contact',
    openMenu: 'Open menu',
    closeMenu: 'Close menu',
    langGroup: 'Language',
    role: 'Video editor',
    seeWork: 'See my work',
    writeMe: 'Email me',
    featuredTitle: 'Your featured reel',
    featuredText: 'Upload a video from the dashboard and mark it as featured.',
    filterGroup: 'Filter by category',
    all: 'All',
    cats: { reels: 'Reels & TikTok', youtube: 'YouTube' } as Record<Category, string>,
    emptyNone: 'No videos yet',
    emptyCat: 'Nothing in this category yet',
    emptyText: 'Log in to your dashboard and upload your Reels, TikToks or YouTube videos. They will show up here instantly.',
    watch: 'Watch',
    aboutTitle: 'About me',
    servicesTitle: 'Services',
    contactTitle: 'Shall we edit your next video?',
    copied: 'Copied! ',
    discordTitle: 'Copy my Discord username',
    discordHint: 'Find me on Discord with that username to add me.',
    close: 'Close',
  },
} as const;

export type Dict = (typeof T)[Lang];

/** Textos del perfil en el idioma elegido; si falta la versión en inglés, usa el español. */
export function localizedProfile(p: Profile, lang: Lang) {
  if (lang === 'es') return { tagline: p.tagline, bio: p.bio, services: p.services };
  return {
    tagline: p.taglineEn.trim() || p.tagline,
    bio: p.bioEn.trim() || p.bio,
    services: p.servicesEn.length ? p.servicesEn : p.services,
  };
}
