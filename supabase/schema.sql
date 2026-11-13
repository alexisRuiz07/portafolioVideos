
--  Portafolio thealex — esquema de Supabase
--  Pégalo completo en Supabase → SQL Editor → New query → Run.
--  Se puede ejecutar más de una vez sin romper nada.

-- Administradores
-- Solo los usuarios de esta tabla pueden escribir. Sin políticas = nadie
-- puede leerla ni modificarla desde la API pública.
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
-- Permiso explícito: necesario si el proyecto tiene desactivado "Automatically expose new tables"
grant execute on function public.is_admin() to anon, authenticated;

-- Perfil (una sola fila, id = 1)
create table if not exists public.profile (
  id         int primary key default 1 check (id = 1),
  name       text not null default '',
  alias      text not null default '',
  tagline    text not null default '',
  location   text not null default '',
  bio        text not null default '',
  tools      text not null default '',
  services   text[] not null default '{}',
  email      text not null default '',
  phone      text not null default '',
  x_handle   text not null default '',
  discord    text not null default '',
  photo_url  text,
  updated_at timestamptz not null default now()
);
alter table public.profile enable row level security;
alter table public.profile add column if not exists discord text not null default '';
-- Versión en inglés del perfil (botón ES | EN)
alter table public.profile add column if not exists tagline_en text not null default '';
alter table public.profile add column if not exists bio_en text not null default '';
alter table public.profile add column if not exists services_en text[] not null default '{}';

drop policy if exists "profile_public_read" on public.profile;
create policy "profile_public_read" on public.profile
  for select to anon, authenticated using (true);

drop policy if exists "profile_admin_insert" on public.profile;
create policy "profile_admin_insert" on public.profile
  for insert to authenticated with check (public.is_admin());

drop policy if exists "profile_admin_update" on public.profile;
create policy "profile_admin_update" on public.profile
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

insert into public.profile (id, name, alias, tagline, location, bio, tools, services, email, phone, x_handle, discord)
values (
  1,
  'Alexis R.',
  'thealex',
  'Edito Reels, TikToks y videos de YouTube que retienen hasta el último segundo.',
  'Colombia',
  E'Soy Alexis, editor de video. Trabajo con creadores y marcas convirtiendo material en bruto en piezas con ritmo, buen sonido y subtítulos que enganchan.\nBusco sumarme a agencias y productoras que quieran un editor rápido y detallista.',
  'Premiere Pro',
  array['Edición para Reels y TikTok', 'Edición de videos para YouTube', 'Subtítulos dinámicos', 'Color y mezcla de sonido'],
  'ruisito124@gmail.com',
  '+57 323 425 6883',
  '@Alexisrq007',
  'TheAlex021'
)
on conflict (id) do nothing;

-- Videos
create table if not exists public.videos (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  category     text not null default 'reels' check (category in ('reels', 'youtube')),
  featured     boolean not null default false,
  storage_path text not null,
  poster_path  text,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);
alter table public.videos enable row level security;

-- Videos de YouTube (enlace) además de archivos subidos
alter table public.videos add column if not exists source text not null default 'file';
alter table public.videos add column if not exists youtube_id text;
alter table public.videos alter column storage_path drop not null;
alter table public.videos drop constraint if exists videos_source_check;
alter table public.videos add constraint videos_source_check check (
  (source = 'file' and storage_path is not null) or
  (source = 'youtube' and youtube_id ~ '^[A-Za-z0-9_-]{11}$')
);
create unique index if not exists videos_unique_youtube on public.videos (youtube_id) where youtube_id is not null;

-- Solo puede haber un video destacado
create unique index if not exists videos_one_featured on public.videos (featured) where featured;

drop policy if exists "videos_public_read" on public.videos;
create policy "videos_public_read" on public.videos
  for select to anon, authenticated using (true);

drop policy if exists "videos_admin_insert" on public.videos;
create policy "videos_admin_insert" on public.videos
  for insert to authenticated with check (public.is_admin());

drop policy if exists "videos_admin_update" on public.videos;
create policy "videos_admin_update" on public.videos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "videos_admin_delete" on public.videos;
create policy "videos_admin_delete" on public.videos
  for delete to authenticated using (public.is_admin());

grant select on public.profile, public.videos to anon, authenticated;
grant insert, update, delete on public.profile, public.videos to authenticated;

-- Cambia el destacado en una sola operación
create or replace function public.set_featured_video(video_id uuid)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not allowed';
  end if;
  update public.videos set featured = false where featured and id <> video_id;
  update public.videos set featured = true where id = video_id;
end;
$$;
grant execute on function public.set_featured_video(uuid) to authenticated;

-- Videos iniciales (YouTube)
-- Solo se insertan si todavía no existen. sort_order mantiene este orden.
insert into public.videos (title, category, source, youtube_id, sort_order)
select v.title, v.category, 'youtube', v.youtube_id, v.sort_order
from (values
  ('Los espero en mi twitch 👍😎',                            'reels',   'u5XtVFzGHoY', 1),
  ('SI ME RIO TE INSULTO(? 🤡',                              'youtube', 'VeoweUkoyIw', 2),
  ('COMO es SER un SHACO GRANDMASTER en LAN.',               'youtube', 'PyM1OdYnB4g', 3),
  ('El TEAM mas INSANO de League of Legends',                'youtube', 'aXTHOJBpW9U', 4),
  ('STOMP en el NUEVO 2v2 con ALISTAR!!!',                   'youtube', 'kkvQ9enKXAI', 5),
  ('El INICIO de una AVENTURA un poco RARA - SurpriLand #1', 'youtube', '4Ep6VdtkkIc', 6)
) as v(title, category, youtube_id, sort_order)
where not exists (select 1 from public.videos x where x.youtube_id = v.youtube_id);

-- Si no hay destacado, destaca el Short (encaja en el reproductor vertical)
update public.videos set featured = true
where youtube_id = 'u5XtVFzGHoY'
  and not exists (select 1 from public.videos where featured);

-- Storage: buckets públicos para videos y fotos
insert into storage.buckets (id, name, public, allowed_mime_types)
values ('videos', 'videos', true, array['video/mp4', 'video/quicktime', 'video/webm', 'image/jpeg'])
on conflict (id) do update set public = true, allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "media_admin_select" on storage.objects;
create policy "media_admin_select" on storage.objects
  for select to authenticated
  using (bucket_id in ('videos', 'avatars') and public.is_admin());

drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('videos', 'avatars') and public.is_admin());

drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id in ('videos', 'avatars') and public.is_admin());

drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id in ('videos', 'avatars') and public.is_admin());
