/**
 * Modo de prueba local: se usa solo mientras Supabase NO está configurado.
 * Guarda videos y perfil en el navegador (IndexedDB + localStorage), igual que
 * el prototipo del diseño. Nadie más ve estos cambios.
 */
import { sortVideos, type Backend, type ProfileInput } from './backend';
import { DEFAULT_PROFILE } from './defaults';
import { youtubeVideo } from './queries';
import { SEED_VIDEOS } from './seed-videos';
import type { Category, Profile, Video } from './types';
import { capturePoster } from './upload';

export const LOCAL_LOGIN = { email: 'ruisito124@gmail.com', password: 'thealex' };

const DB_NAME = 'thealex-local';
const K_INIT = 'thealex.local.init';
const K_PROFILE = 'thealex.local.profile';
const K_SESSION = 'thealex.local.session';

type LocalVideo = {
  id: string;
  title: string;
  description: string;
  category: Category;
  featured: boolean;
  source: 'file' | 'youtube';
  youtubeId: string | null;
  file?: Blob;
  poster?: Blob | null;
  createdAt: string;
  sortOrder: number;
};

const ls = {
  get(k: string) {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set(k: string, v: string) {
    try {
      localStorage.setItem(k, v);
    } catch {}
  },
  del(k: string) {
    try {
      localStorage.removeItem(k);
    } catch {}
  },
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const r = indexedDB.open(DB_NAME, 1);
    r.onupgradeneeded = () => {
      r.result.createObjectStore('videos', { keyPath: 'id' });
      r.result.createObjectStore('files', { keyPath: 'key' });
    };
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

async function run<T>(store: 'videos' | 'files', mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest | void) {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const req = fn(t.objectStore(store));
    t.oncomplete = () => resolve((req ? req.result : undefined) as T);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  });
}

const urls = new Map<string, string>();
function blobUrl(key: string, blob: Blob) {
  let u = urls.get(key);
  if (!u) {
    u = URL.createObjectURL(blob);
    urls.set(key, u);
  }
  return u;
}

function toVideo(r: LocalVideo): Video {
  const base = { id: r.id, title: r.title, description: r.description, category: r.category, featured: r.featured, createdAt: r.createdAt };
  if (r.source === 'youtube' && r.youtubeId) return youtubeVideo({ ...base, youtubeId: r.youtubeId });
  return {
    ...base,
    source: 'file',
    youtubeId: null,
    storagePath: null,
    posterPath: null,
    url: r.file ? blobUrl(r.id, r.file) : '',
    posterUrl: r.poster ? blobUrl(`${r.id}:poster`, r.poster) : null,
  };
}

async function ensureSeed() {
  if (ls.get(K_INIT)) return;
  await run('videos', 'readwrite', (s) => {
    SEED_VIDEOS.forEach((v, i) =>
      s.put({
        id: v.id,
        title: v.title,
        description: v.description,
        category: v.category,
        featured: v.featured,
        source: 'youtube',
        youtubeId: v.youtubeId,
        createdAt: v.createdAt,
        sortOrder: i + 1,
      } satisfies LocalVideo),
    );
  });
  ls.set(K_INIT, '1');
}

async function allVideos() {
  return sortVideos((await run<LocalVideo[]>('videos', 'readonly', (s) => s.getAll())) ?? []);
}

async function readProfile(): Promise<Profile> {
  let p: Profile = DEFAULT_PROFILE;
  try {
    const saved = JSON.parse(ls.get(K_PROFILE) || 'null');
    if (saved) {
      // Perfiles guardados antes de añadir Discord: toman los programas y redes actualizados
      const legacy = !('discord' in saved)
        ? { tools: DEFAULT_PROFILE.tools, x: DEFAULT_PROFILE.x, discord: DEFAULT_PROFILE.discord }
        : {};
      p = { ...DEFAULT_PROFILE, ...saved, ...legacy, photoUrl: DEFAULT_PROFILE.photoUrl };
    }
  } catch {}
  const photo = await run<{ key: string; blob: Blob } | undefined>('files', 'readonly', (s) => s.get('photo'));
  if (photo?.blob) p = { ...p, photoUrl: blobUrl(`photo:${photo.blob.size}:${photo.blob.type}`, photo.blob) };
  return p;
}

/** Datos guardados localmente, o null si nunca se usó el modo local en este navegador. */
export async function loadLocalIfAny(): Promise<{ profile: Profile; videos: Video[] } | null> {
  if (!ls.get(K_INIT)) return null;
  const [profile, videos] = await Promise.all([readProfile(), allVideos()]);
  return { profile, videos: videos.map(toVideo) };
}

const newId = () => `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export function localBackend(): Backend {
  return {
    kind: 'local',

    async hasSession() {
      return ls.get(K_SESSION) === '1';
    },

    async signIn(email, password) {
      if (email.trim().toLowerCase() !== LOCAL_LOGIN.email || password !== LOCAL_LOGIN.password) {
        throw new Error('Correo o contraseña incorrectos');
      }
      ls.set(K_SESSION, '1');
    },

    async signOut() {
      ls.del(K_SESSION);
    },

    onSignedOut() {
      return () => {};
    },

    async load() {
      await ensureSeed();
      const [profile, videos] = await Promise.all([readProfile(), allVideos()]);
      return { profile, videos: videos.map(toVideo) };
    },

    async addYouTube(i) {
      const rec: LocalVideo = {
        id: newId(),
        title: i.title,
        description: i.description,
        category: i.category,
        featured: i.featured,
        source: 'youtube',
        youtubeId: i.youtubeId,
        createdAt: new Date().toISOString(),
        sortOrder: 0,
      };
      await run('videos', 'readwrite', (s) => s.put(rec));
      return toVideo(rec);
    },

    async uploadFile(i, onProgress) {
      const poster = await capturePoster(i.file);
      const rec: LocalVideo = {
        id: newId(),
        title: i.title,
        description: i.description,
        category: i.category,
        featured: i.featured,
        source: 'file',
        youtubeId: null,
        file: i.file,
        poster,
        createdAt: new Date().toISOString(),
        sortOrder: 0,
      };
      await run('videos', 'readwrite', (s) => s.put(rec));
      onProgress(1);
      return toVideo(rec);
    },

    async setFeatured(id) {
      const list = await allVideos();
      await run('videos', 'readwrite', (s) => {
        list.forEach((v) => s.put({ ...v, featured: v.id === id }));
      });
    },

    async remove(v) {
      await run('videos', 'readwrite', (s) => s.delete(v.id));
    },

    async uploadPhoto(file) {
      await run('files', 'readwrite', (s) => s.put({ key: 'photo', blob: file }));
      return blobUrl(`photo:${file.size}:${file.type}:${Date.now()}`, file);
    },

    async saveProfile(p: ProfileInput) {
      ls.set(K_PROFILE, JSON.stringify(p));
    },
  };
}
