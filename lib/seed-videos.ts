import { youtubeVideo } from './queries';
import type { Category } from './types';

/**
 * Videos iniciales. Se muestran solo mientras Supabase no está configurado,
 * para previsualizar el sitio. Los mismos videos se cargan en la base de datos
 * con supabase/schema.sql; desde ahí se administran en el panel.
 */
const SEED: { youtubeId: string; title: string; category: Category }[] = [
  { youtubeId: 'u5XtVFzGHoY', title: 'Los espero en mi twitch 👍😎', category: 'reels' },
  { youtubeId: 'VeoweUkoyIw', title: 'SI ME RIO TE INSULTO(? 🤡', category: 'youtube' },
  { youtubeId: 'PyM1OdYnB4g', title: 'COMO es SER un SHACO GRANDMASTER en LAN.', category: 'youtube' },
  { youtubeId: 'aXTHOJBpW9U', title: 'El TEAM mas INSANO de League of Legends', category: 'youtube' },
  { youtubeId: 'kkvQ9enKXAI', title: 'STOMP en el NUEVO 2v2 con ALISTAR!!!', category: 'youtube' },
  { youtubeId: '4Ep6VdtkkIc', title: 'El INICIO de una AVENTURA un poco RARA - SurpriLand #1', category: 'youtube' },
];

export const SEED_VIDEOS = SEED.map((s, i) =>
  youtubeVideo({
    id: `seed-${s.youtubeId}`,
    title: s.title,
    description: '',
    category: s.category,
    featured: i === 0,
    youtubeId: s.youtubeId,
    createdAt: '2026-11-12T00:00:00Z',
  }),
);
