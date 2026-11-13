/** Saca el ID de 11 caracteres de un enlace de YouTube, un código <iframe> o el ID suelto. */
export function parseYouTubeId(input: string): string | null {
  const s = input.trim();
  if (/^[\w-]{11}$/.test(s)) return s;
  const m = s.match(
    /(?:youtube(?:-nocookie)?\.com\/(?:embed\/|shorts\/|live\/|v\/|watch\?(?:[^"'\s#]*&)?v=)|youtu\.be\/)([\w-]{11})/i,
  );
  return m ? m[1] : null;
}

export const isShortsLink = (s: string) => /youtube\.com\/shorts\//i.test(s);

export const ytThumb = (id: string, quality: 'maxresdefault' | 'mqdefault' = 'maxresdefault') =>
  `https://i.ytimg.com/vi/${id}/${quality}.jpg`;

export const ytWatch = (id: string) => `https://www.youtube.com/watch?v=${id}`;

export function ytEmbed(id: string, opts: { autoplay?: boolean; mute?: boolean; loop?: boolean } = {}) {
  const q = new URLSearchParams({ rel: '0', playsinline: '1' });
  if (opts.autoplay) q.set('autoplay', '1');
  if (opts.mute) q.set('mute', '1');
  if (opts.loop) {
    q.set('loop', '1');
    q.set('playlist', id);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${q}`;
}

/** Título público del video (para prellenar el formulario). Devuelve null si no se puede. */
export async function fetchYouTubeTitle(id: string): Promise<string | null> {
  try {
    const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(ytWatch(id))}`);
    if (!r.ok) return null;
    const j = await r.json();
    return typeof j.title === 'string' ? j.title : null;
  } catch {
    return null;
  }
}
