import type { SupabaseClient } from '@supabase/supabase-js';
import { DEFAULT_PROFILE } from './defaults';
import type { Profile, ProfileRow, Video, VideoRow } from './types';
import { ytThumb, ytWatch } from './youtube';

export function rowToProfile(row: ProfileRow | null): Profile {
  if (!row) return DEFAULT_PROFILE;
  return {
    name: row.name ?? DEFAULT_PROFILE.name,
    alias: row.alias ?? DEFAULT_PROFILE.alias,
    tagline: row.tagline ?? DEFAULT_PROFILE.tagline,
    location: row.location ?? DEFAULT_PROFILE.location,
    bio: row.bio ?? DEFAULT_PROFILE.bio,
    tools: row.tools ?? DEFAULT_PROFILE.tools,
    services: row.services ?? DEFAULT_PROFILE.services,
    email: row.email ?? DEFAULT_PROFILE.email,
    phone: row.phone ?? DEFAULT_PROFILE.phone,
    x: row.x_handle ?? DEFAULT_PROFILE.x,
    discord: row.discord ?? DEFAULT_PROFILE.discord,
    photoUrl: row.photo_url ?? DEFAULT_PROFILE.photoUrl,
    // Si aún no hay versión en inglés guardada, usa la traducción por defecto
    // (solo cuando el texto en español sigue siendo el original).
    taglineEn: row.tagline_en || (row.tagline === DEFAULT_PROFILE.tagline ? DEFAULT_PROFILE.taglineEn : ''),
    bioEn: row.bio_en || (row.bio === DEFAULT_PROFILE.bio ? DEFAULT_PROFILE.bioEn : ''),
    servicesEn: row.services_en?.length
      ? row.services_en
      : sameList(row.services, DEFAULT_PROFILE.services)
        ? DEFAULT_PROFILE.servicesEn
        : [],
  };
}

function sameList(a: string[] | null, b: string[]) {
  return Boolean(a) && a!.length === b.length && a!.every((x, i) => x === b[i]);
}

export function rowToVideo(sb: SupabaseClient, r: VideoRow): Video {
  const base = {
    id: r.id,
    title: r.title,
    description: r.description ?? '',
    category: r.category,
    featured: r.featured,
    createdAt: r.created_at,
  };
  if (r.source === 'youtube' && r.youtube_id) {
    return youtubeVideo({ ...base, youtubeId: r.youtube_id });
  }
  const bucket = sb.storage.from('videos');
  return {
    ...base,
    source: 'file',
    youtubeId: null,
    storagePath: r.storage_path,
    posterPath: r.poster_path,
    url: r.storage_path ? bucket.getPublicUrl(r.storage_path).data.publicUrl : '',
    posterUrl: r.poster_path ? bucket.getPublicUrl(r.poster_path).data.publicUrl : null,
  };
}

export function youtubeVideo(v: Omit<Video, 'source' | 'storagePath' | 'posterPath' | 'url' | 'posterUrl'> & { youtubeId: string }): Video {
  return {
    ...v,
    source: 'youtube',
    storagePath: null,
    posterPath: null,
    url: ytWatch(v.youtubeId),
    posterUrl: ytThumb(v.youtubeId),
  };
}

export async function fetchProfile(sb: SupabaseClient): Promise<Profile> {
  const { data, error } = await sb.from('profile').select('*').eq('id', 1).maybeSingle();
  if (error) throw error;
  return rowToProfile(data as ProfileRow | null);
}

export async function fetchVideos(sb: SupabaseClient): Promise<Video[]> {
  const { data, error } = await sb
    .from('videos')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false });
  if (error) throw error;
  return ((data ?? []) as VideoRow[]).map((r) => rowToVideo(sb, r));
}
