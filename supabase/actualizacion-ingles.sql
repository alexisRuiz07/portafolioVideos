
-- Actualización: versión en inglés del perfil (botón ES | EN).
-- Ejecútalo una vez en Supabase → SQL Editor → New query → Run.
-- Se puede ejecutar más de una vez sin romper nada.

alter table public.profile add column if not exists tagline_en text not null default '';
alter table public.profile add column if not exists bio_en text not null default '';
alter table public.profile add column if not exists services_en text[] not null default '{}';

-- Rellena la traducción solo si todavía está vacía
update public.profile set
  tagline_en = case when tagline_en = '' then 'I edit Reels, TikToks and YouTube videos that keep viewers hooked until the very last second.' else tagline_en end,
  bio_en = case when bio_en = '' then E'I''m Alexis, a video editor. I work with creators and brands, turning raw footage into pieces with rhythm, great sound and captions that hook.\nI''m looking to join agencies and production companies that want a fast, detail-oriented editor.' else bio_en end,
  services_en = case when services_en = '{}' then array['Editing for Reels and TikTok', 'YouTube video editing', 'Dynamic captions', 'Color grading and sound mixing'] else services_en end
where id = 1;

select tagline_en, services_en from public.profile where id = 1;
