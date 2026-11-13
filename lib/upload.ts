import { SUPABASE_KEY, SUPABASE_URL } from './supabase';

/** Nombre de archivo seguro: sin tildes, espacios ni símbolos. */
export function safeName(name: string) {
  const base = name
    .replace(/\.[^.]+$/, '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
  return base || 'video';
}

export function extOf(file: File, fallback: string) {
  const m = /\.([a-z0-9]+)$/i.exec(file.name);
  return (m ? m[1] : fallback).toLowerCase();
}

/**
 * Sube un archivo a Supabase Storage mostrando el progreso.
 * (supabase-js no expone el progreso, así que usamos XHR contra la API de Storage.)
 */
export function uploadWithProgress(opts: {
  bucket: string;
  path: string;
  file: Blob;
  contentType: string;
  accessToken: string;
  onProgress?: (fraction: number) => void;
}): Promise<void> {
  const { bucket, path, file, contentType, accessToken, onProgress } = opts;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    xhr.open('POST', `${SUPABASE_URL}/storage/v1/object/${bucket}/${encoded}`);
    xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
    xhr.setRequestHeader('apikey', SUPABASE_KEY);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=31536000');
    xhr.setRequestHeader('Content-Type', contentType);
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(e.loaded / e.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) return resolve();
      let msg = `Error ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText);
        msg = body.message || body.error || msg;
      } catch {}
      if (xhr.status === 413 || /exceeded the maximum allowed size/i.test(msg)) {
        msg = 'El archivo supera el tamaño máximo permitido por Supabase.';
      }
      reject(new Error(msg));
    };
    xhr.onerror = () => reject(new Error('Error de red al subir el archivo.'));
    xhr.send(file);
  });
}

/** Saca un fotograma del video (≈0.5 s) como JPG para usarlo de miniatura. */
export function capturePoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const src = URL.createObjectURL(file);
    const v = document.createElement('video');
    let finished = false;
    const done = (b: Blob | null) => {
      if (finished) return;
      finished = true;
      clearTimeout(timer);
      v.removeAttribute('src');
      v.load();
      URL.revokeObjectURL(src);
      resolve(b);
    };
    const timer = setTimeout(() => done(null), 10000);
    v.muted = true;
    v.playsInline = true;
    v.preload = 'auto';
    v.addEventListener(
      'loadeddata',
      () => {
        const d = Number.isFinite(v.duration) ? v.duration : 1;
        v.currentTime = Math.min(0.5, d / 2);
      },
      { once: true },
    );
    v.addEventListener(
      'seeked',
      () => {
        const w = v.videoWidth;
        const h = v.videoHeight;
        if (!w || !h) return done(null);
        const scale = Math.min(1, 900 / Math.max(w, h));
        const c = document.createElement('canvas');
        c.width = Math.round(w * scale);
        c.height = Math.round(h * scale);
        const ctx = c.getContext('2d');
        if (!ctx) return done(null);
        ctx.drawImage(v, 0, 0, c.width, c.height);
        c.toBlob((b) => done(b), 'image/jpeg', 0.82);
      },
      { once: true },
    );
    v.addEventListener('error', () => done(null), { once: true });
    v.src = src;
  });
}
