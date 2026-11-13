import { cache } from 'react';
import { DEFAULT_PROFILE } from './defaults';
import { fetchProfile, fetchVideos } from './queries';
import { SEED_VIDEOS } from './seed-videos';
import { createServerClient } from './supabase';
import type { Profile, Video } from './types';

export type Portfolio = { profile: Profile; videos: Video[] };

export const getPortfolio = cache(async (): Promise<Portfolio> => {
  const sb = createServerClient();
  if (!sb) return { profile: DEFAULT_PROFILE, videos: SEED_VIDEOS };
  try {
    const [profile, videos] = await Promise.all([fetchProfile(sb), fetchVideos(sb)]);
    return { profile, videos };
  } catch (e) {
    console.error('[portafolio] No se pudieron leer los datos de Supabase:', e);
    return { profile: DEFAULT_PROFILE, videos: [] };
  }
});
