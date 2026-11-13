
-- Botón de Discord que abre tu perfil directamente.
-- Pega todo en Supabase → SQL Editor → New query → Run. Se puede ejecutar más de una vez.

alter table public.profile add column if not exists discord_id text not null default '';

update public.profile
set discord_id = '1115847978121445376'
where id = 1 and discord_id = '';

-- Tu nombre de usuario real (TheAlex021 es solo el nombre visible)
update public.profile
set discord = 'alex0210168'
where id = 1 and discord in ('', 'TheAlex021');
