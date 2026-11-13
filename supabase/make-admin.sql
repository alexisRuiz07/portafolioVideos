-- Ejecuta esto DESPUÉS de crear tu usuario en Supabase → Authentication → Users → Add user.
-- Cambia el correo por el que usaste al crear el usuario.

insert into public.admins (user_id)
select id from auth.users where email = 'ruisito124@gmail.com'
on conflict (user_id) do nothing;

-- Comprobación: debe devolver una fila con tu correo
select u.email from public.admins a join auth.users u on u.id = a.user_id;
