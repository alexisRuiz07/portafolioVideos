# Portafolio thealex

Portafolio de videos (Reels, TikTok, YouTube) con panel privado para subir videos y editar tu información.
Hecho con **Next.js 16 + Supabase**, listo para publicar en **Vercel**.

- `/`: portafolio público (el enlace que compartes)
- `/admin`: tu panel (también puedes entrar con el botón **Entrar** o con `/#admin`)

## Arrancarlo con doble clic (Windows)

| Archivo | Qué hace |
| --- | --- |
| `iniciar.bat` | Modo desarrollo: los cambios en el código se ven al instante. Busca un puerto libre (desde 3000), te lo muestra y abre el navegador. |
| `iniciar-produccion.bat` | Compila la versión final (igual que en Vercel) y la sirve. Es más rápida. |
| `ver-puertos.bat` | Te dice en qué puerto(s) está corriendo el portafolio, con los enlaces para tu PC y tu celular. |

Para detenerlo, cierra la ventana negra o pulsa `Ctrl+C`.

## Modo de prueba (sin Supabase)

Mientras no exista `.env.local` con las claves de Supabase, el panel funciona en **modo de prueba**:

- **Correo:** `ruisito124@gmail.com`
- **Contraseña:** `thealex`

En este modo lo que cambias se guarda solo en tu navegador y nadie más lo ve. Cuando conectas Supabase,
este acceso deja de funcionar y entras con el usuario que creaste en Supabase.
(El usuario de prueba está en `lib/backend-local.ts`.)

## Videos de YouTube

En el panel, **Enlace de YouTube** acepta un enlace (`youtu.be/…`, `youtube.com/watch?v=…`, `youtube.com/shorts/…`)
o el código `<iframe>` de "Compartir → Insertar". Los Shorts y los iframes verticales se marcan solos como *Reels y TikTok*.
Tus primeros 6 videos ya vienen cargados en `supabase/schema.sql`.

---

## 1. Configurar Supabase (una sola vez)

1. Entra a [supabase.com](https://supabase.com) → **New project** (elige región *South America (São Paulo)*).
2. Ve a **SQL Editor → New query**, pega todo el contenido de [`supabase/schema.sql`](supabase/schema.sql) y pulsa **Run**.
   Así se crean las tablas, los buckets de videos/fotos y los permisos.
3. Ve a **Authentication → Users → Add user → Create new user**. Escribe tu correo y una contraseña, y marca **Auto Confirm User**.
4. Vuelve al **SQL Editor**, abre [`supabase/make-admin.sql`](supabase/make-admin.sql), cambia el correo si usaste otro y pulsa **Run**.
   Esto te da permiso para subir y editar.
5. **Importante:** en **Authentication → Sign In / Providers → Email**, desactiva **Allow new users to sign up**
   para que nadie más pueda crear cuentas.
6. En **Project Settings → API** (o el botón **Connect**) copia la **Project URL** y la **anon / publishable key**.

## 2. Probarlo en tu PC

```bash
cp .env.example .env.local   # luego pega la URL y la key dentro de .env.local
npm install
npm run dev
```

Abre http://localhost:3000, pulsa **Entrar** y entra con el correo y la contraseña del paso 3.

## 3. Publicar en Vercel

1. Sube esta carpeta a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com) → **Add New → Project** → importa el repositorio.
3. En **Environment Variables** añade:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → la URL final, por ejemplo `https://thealex.vercel.app`
   - (opcional) `NEXT_PUBLIC_MAX_UPLOAD_MB`, `NEXT_PUBLIC_SHOW_LOGIN_BUTTON`
4. Pulsa **Deploy**. Cuando termine, comparte el enlace.

## Límites del plan gratis de Supabase

- **50 MB por video.** Exporta los videos en MP4 (H.264) a 1080p con bitrate moderado; un Reel de 60 s suele pesar entre 20 y 40 MB.
  Con el plan Pro puedes subir el límite en *Storage → Settings* y cambiar `NEXT_PUBLIC_MAX_UPLOAD_MB`.
- **1 GB de almacenamiento** y **5 GB de transferencia al mes.**
- Los proyectos gratis se **pausan tras 7 días sin actividad.** Se reactivan desde el panel de Supabase.

## Cómo funciona

| Qué | Dónde |
| --- | --- |
| Diseño y colores | `app/globals.css` (tokens del sistema "Organic") |
| Página pública | `components/Portfolio.tsx` |
| Panel | `components/AdminPanel.tsx` |
| Base de datos y permisos | `supabase/schema.sql` |

- El primer video que subes queda **destacado** automáticamente. Solo puede haber uno.
- Al subir un video se genera una miniatura (fotograma a 0.5 s) para que la grilla cargue rápido.
- La seguridad la aplica Supabase (RLS): cualquiera puede ver, pero solo los usuarios de la tabla `admins` pueden escribir.
- Para cambiar tu contraseña: Supabase → Authentication → Users → tu usuario → *Send password recovery* o *Reset password*.
