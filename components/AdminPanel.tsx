'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Backend } from '@/lib/backend';
import { CATS, DEFAULT_PROFILE, IMAGE_TYPES, MAX_UPLOAD_MB, VIDEO_TYPES, initials, isIllustration } from '@/lib/defaults';
import { getBackend } from '@/lib/get-backend';
import type { Category, Profile, Video } from '@/lib/types';
import { fetchYouTubeTitle, isShortsLink, parseYouTubeId } from '@/lib/youtube';
import { UploadIcon } from './Icons';
import VideoThumb from './VideoThumb';

type Draft = {
  name: string;
  alias: string;
  tagline: string;
  location: string;
  bio: string;
  tools: string;
  services: string;
  email: string;
  phone: string;
  x: string;
  discord: string;
  taglineEn: string;
  bioEn: string;
  servicesEn: string;
};

const toDraft = (p: Profile): Draft => ({
  name: p.name,
  alias: p.alias,
  tagline: p.tagline,
  location: p.location,
  bio: p.bio,
  tools: p.tools,
  services: p.services.join('\n'),
  email: p.email,
  phone: p.phone,
  x: p.x,
  discord: p.discord,
  taglineEn: p.taglineEn,
  bioEn: p.bioEn,
  servicesEn: p.servicesEn.join('\n'),
});

const errMsg = (e: unknown) => {
  const m = e instanceof Error ? e.message : typeof e === 'object' && e && 'message' in e ? String(e.message) : String(e);
  if (/row-level security|not allowed|permission denied|Unauthorized/i.test(m)) {
    return 'Tu usuario no tiene permiso de administrador. Ejecuta supabase/make-admin.sql con tu correo.';
  }
  if (/duplicate key|videos_unique_youtube/i.test(m)) return 'Ese video ya está en tu portafolio.';
  return m;
};

type Mode = 'youtube' | 'file';
type Upload = { title: string; desc: string; category: Category; file: File | null; link: string };
const EMPTY_UPLOAD: Upload = { title: '', desc: '', category: 'youtube', file: null, link: '' };

export default function AdminPanel() {
  const router = useRouter();
  const [api, setApi] = useState<Backend | null>(null);
  const [checking, setChecking] = useState(true);
  const [loadErr, setLoadErr] = useState('');

  const [videos, setVideos] = useState<Video[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [draft, setDraft] = useState<Draft>(toDraft(DEFAULT_PROFILE));
  const [savedMsg, setSavedMsg] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoErr, setPhotoErr] = useState('');

  const [mode, setMode] = useState<Mode>('youtube');
  const [up, setUp] = useState<Upload>(EMPTY_UPLOAD);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [upErr, setUpErr] = useState('');
  const [rowBusy, setRowBusy] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // ── Sesión y carga inicial ────────────────────────────────────────
  useEffect(() => {
    const b = getBackend();
    let alive = true;
    (async () => {
      if (!(await b.hasSession())) {
        router.replace('/#admin');
        return;
      }
      if (!alive) return;
      setApi(b);
      try {
        const d = await b.load();
        if (!alive) return;
        setProfile(d.profile);
        setDraft(toDraft(d.profile));
        setVideos(d.videos);
      } catch (e) {
        setLoadErr(
          'No se pudieron cargar los datos. ¿Ejecutaste supabase/schema.sql en el SQL Editor? Detalle: ' + errMsg(e),
        );
      }
      if (alive) setChecking(false);
    })();
    const off = b.onSignedOut(() => router.replace('/'));
    return () => {
      alive = false;
      off();
    };
  }, [router]);

  if (checking || !api) {
    return (
      <div className="admin">
        <p className="muted">Cargando tu panel…</p>
      </div>
    );
  }

  const featured = videos.find((v) => v.featured) ?? videos[0];
  const linkId = parseYouTubeId(up.link);
  const pct = progress === null ? 0 : Math.round(progress * 100);

  // ── Videos ────────────────────────────────────────────────────────
  function pickVideo(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    setUpErr('');
    if (!f) return;
    if (f.type && !VIDEO_TYPES.includes(f.type)) {
      setUpErr('Formato no admitido. Usa MP4, MOV o WEBM.');
      e.target.value = '';
      return;
    }
    if (f.size > MAX_UPLOAD_MB * 1024 * 1024) {
      setUpErr(`El video pesa ${(f.size / 1024 / 1024).toFixed(0)} MB. El máximo es ${MAX_UPLOAD_MB} MB.`);
      e.target.value = '';
      return;
    }
    setUp((u) => ({ ...u, file: f, title: u.title || f.name.replace(/\.[^.]+$/, '') }));
  }

  async function onLinkChange(e: React.ChangeEvent<HTMLInputElement>) {
    const link = e.target.value;
    setUpErr('');
    const id = parseYouTubeId(link);
    // Un código <iframe> trae el título y la forma (los Shorts son verticales)
    const iframeTitle = /title="([^"]*)"/i.exec(link)?.[1];
    const w = Number(/width="(\d+)"/i.exec(link)?.[1]);
    const h = Number(/height="(\d+)"/i.exec(link)?.[1]);
    const vertical = isShortsLink(link) || (w > 0 && h > w);
    setUp((u) => ({
      ...u,
      link,
      category: id ? (vertical ? 'reels' : 'youtube') : u.category,
      title: u.title || (iframeTitle ? decodeEntities(iframeTitle) : ''),
    }));
    if (id && !iframeTitle) {
      const t = await fetchYouTubeTitle(id);
      if (t) setUp((u) => (u.title ? u : { ...u, title: t }));
    }
  }

  async function publish() {
    if (busy || !api) return;
    const base = { description: up.desc.trim(), category: up.category, featured: videos.length === 0 };
    setBusy(true);
    setUpErr('');
    try {
      let v: Video;
      if (mode === 'youtube') {
        if (!linkId) return;
        if (videos.some((x) => x.youtubeId === linkId)) throw new Error('Ese video ya está en tu portafolio.');
        v = await api.addYouTube({ ...base, title: up.title.trim() || 'Video de YouTube', youtubeId: linkId });
      } else {
        const file = up.file;
        if (!file) return;
        setProgress(0);
        v = await api.uploadFile(
          { ...base, title: up.title.trim() || file.name.replace(/\.[^.]+$/, ''), file },
          setProgress,
        );
        if (fileRef.current) fileRef.current.value = '';
      }
      setVideos((vs) => [v, ...vs]);
      setUp({ ...EMPTY_UPLOAD, category: up.category });
    } catch (e) {
      setUpErr(errMsg(e));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  async function setFeatured(id: string) {
    if (!api) return;
    const prev = videos;
    setRowBusy(id);
    setVideos((vs) => vs.map((v) => ({ ...v, featured: v.id === id })));
    try {
      await api.setFeatured(id);
    } catch (e) {
      setVideos(prev);
      alert('No se pudo destacar: ' + errMsg(e));
    } finally {
      setRowBusy(null);
    }
  }

  async function remove(v: Video) {
    if (!api || !confirm(`¿Eliminar "${v.title}"?`)) return;
    setRowBusy(v.id);
    try {
      await api.remove(v);
      setVideos((vs) => vs.filter((x) => x.id !== v.id));
    } catch (e) {
      alert('No se pudo eliminar: ' + errMsg(e));
    } finally {
      setRowBusy(null);
    }
  }

  // ── Perfil ────────────────────────────────────────────────────────
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDraft((d) => ({ ...d, [k]: e.target.value }));
    setSavedMsg('');
  };

  async function pickPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    setPhotoErr('');
    if (!f || !api) return;
    if (!IMAGE_TYPES.includes(f.type)) return setPhotoErr('Usa una imagen JPG, PNG o WEBP.');
    if (f.size > 10 * 1024 * 1024) return setPhotoErr('La foto debe pesar menos de 10 MB.');
    setPhotoBusy(true);
    try {
      const url = await api.uploadPhoto(f, profile.photoUrl);
      setProfile((p) => ({ ...p, photoUrl: url }));
    } catch (err) {
      setPhotoErr(errMsg(err));
    } finally {
      setPhotoBusy(false);
    }
  }

  async function saveProfile() {
    if (!api) return;
    setSaving(true);
    setSavedMsg('');
    const next = {
      name: draft.name.trim(),
      alias: draft.alias.trim(),
      tagline: draft.tagline.trim(),
      location: draft.location.trim(),
      bio: draft.bio.trim(),
      tools: draft.tools.trim(),
      services: draft.services
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
      x: draft.x.trim(),
      discord: draft.discord.trim(),
      taglineEn: draft.taglineEn.trim(),
      bioEn: draft.bioEn.trim(),
      servicesEn: draft.servicesEn
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean),
    };
    try {
      await api.saveProfile(next);
      setProfile((p) => ({ ...p, ...next }));
      setSavedMsg('Guardado ✓');
    } catch (e) {
      setSavedMsg('Error: ' + errMsg(e));
    } finally {
      setSaving(false);
    }
  }

  async function logout() {
    await api?.signOut();
    router.replace('/');
  }

  return (
    <div className="admin">
      <div className="admin-head">
        <div>
          <span className="admin-title">Tu panel</span>
          <span className="muted">Lo que cambies aquí se ve en tu portafolio.</span>
        </div>
        <div className="row-tight">
          <Link href="/" className="btn btn-secondary">
            Ver portafolio
          </Link>
          <button className="btn btn-ghost" onClick={logout}>
            Cerrar sesión
          </button>
        </div>
      </div>

      {api.kind === 'local' && (
        <div className="local-banner" role="note">
          <strong>Modo de prueba.</strong> Lo que cambies se guarda solo en este navegador y nadie más lo ve. Cuando
          conectes Supabase (pasos en el README), el panel guardará todo en línea.
        </div>
      )}

      {loadErr && (
        <p className="error-text" role="alert" style={{ marginBottom: 'var(--space-6)' }}>
          {loadErr}
        </p>
      )}

      <div className="admin-grid">
        {/* ── Videos ── */}
        <div className="card admin-card" style={{ gap: 'var(--space-6)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            <span className="admin-card-title">Videos</span>
            <span className="muted">
              {mode === 'youtube'
                ? 'Pega el enlace de YouTube (o el código para insertar), ponle título y elige dónde va.'
                : `Sube un archivo, ponle título y elige dónde va. MP4, MOV o WEBM de hasta ${MAX_UPLOAD_MB} MB.`}
            </span>
          </div>
          <div className="upload-box">
            <div className="row-tight" role="group" aria-label="Tipo de video">
              {(
                [
                  ['youtube', 'Enlace de YouTube'],
                  ['file', 'Subir archivo'],
                ] as [Mode, string][]
              ).map(([k, label]) => (
                <button
                  key={k}
                  className={mode === k ? 'btn btn-primary' : 'btn btn-secondary'}
                  aria-pressed={mode === k}
                  disabled={busy}
                  onClick={() => {
                    setMode(k);
                    setUpErr('');
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            {mode === 'youtube' ? (
              <div className="field">
                <label htmlFor="up-link">Enlace de YouTube</label>
                <input
                  id="up-link"
                  className="input"
                  value={up.link}
                  onChange={onLinkChange}
                  placeholder="https://youtu.be/… o https://youtube.com/shorts/…"
                />
                {up.link && !linkId && (
                  <span className="error-text" style={{ fontSize: 13 }}>
                    No reconozco ese enlace de YouTube.
                  </span>
                )}
              </div>
            ) : (
              <>
                <input
                  ref={fileRef}
                  id="vfile"
                  type="file"
                  accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm"
                  onChange={pickVideo}
                  disabled={busy}
                  className="sr-only"
                />
                <label htmlFor="vfile" className="btn btn-secondary file-btn">
                  <UploadIcon />
                  <span>{up.file ? up.file.name : 'Elegir video'}</span>
                </label>
              </>
            )}
            <div className="field">
              <label htmlFor="up-title">Título</label>
              <input
                id="up-title"
                className="input"
                value={up.title}
                onChange={(e) => setUp((u) => ({ ...u, title: e.target.value }))}
                placeholder="Ej. Reel para marca de café"
              />
            </div>
            <div className="field">
              <label htmlFor="up-desc">Descripción corta</label>
              <input
                id="up-desc"
                className="input"
                value={up.desc}
                onChange={(e) => setUp((u) => ({ ...u, desc: e.target.value }))}
                placeholder="Ej. Edición, color y subtítulos"
              />
            </div>
            <div className="field">
              <label htmlFor="up-cat">Categoría</label>
              <select
                id="up-cat"
                className="input"
                value={up.category}
                onChange={(e) => setUp((u) => ({ ...u, category: e.target.value as Category }))}
              >
                <option value="reels">Reels y TikTok</option>
                <option value="youtube">YouTube</option>
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={publish}
              disabled={(mode === 'youtube' ? !linkId : !up.file) || busy}
              style={{ alignSelf: 'flex-start' }}
            >
              {busy ? (progress !== null && pct < 100 ? `Subiendo… ${pct}%` : 'Guardando…') : 'Publicar video'}
            </button>
            {busy && progress !== null && (
              <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
                <div style={{ width: `${pct}%` }} />
              </div>
            )}
            {upErr && (
              <span className="error-text" role="alert">
                {upErr}
              </span>
            )}
          </div>

          <div className="video-list">
            {videos.length === 0 && <span className="muted">Todavía no has subido videos.</span>}
            {videos.map((v) => {
              const isFeat = v === featured;
              return (
                <div key={v.id} className="video-row">
                  <VideoThumb video={v} className="video-row-thumb" />
                  <div className="video-row-info">
                    <strong title={v.title}>{v.title}</strong>
                    <span>
                      {CATS[v.category]}
                      {v.source === 'youtube' ? ' · enlace de YouTube' : ''}
                    </span>
                  </div>
                  <div className="video-row-actions">
                    <button
                      className={isFeat ? 'btn btn-primary' : 'btn btn-secondary'}
                      onClick={() => !isFeat && setFeatured(v.id)}
                      disabled={rowBusy === v.id}
                      aria-pressed={isFeat}
                    >
                      {isFeat ? 'Destacado' : 'Destacar'}
                    </button>
                    <button className="btn btn-ghost" onClick={() => remove(v)} disabled={rowBusy === v.id}>
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Tu información ── */}
        <div className="card admin-card">
          <span className="admin-card-title">Tu información</span>
          <div className="photo-row">
            <div className="avatar">
              {profile.photoUrl ? (
                <div
                  className={isIllustration(profile.photoUrl) ? 'avatar-img avatar-illustration' : 'avatar-img'}
                  style={{ backgroundImage: `url("${profile.photoUrl}")` }}
                />
              ) : (
                <span className="avatar-initials">{initials(draft.name)}</span>
              )}
            </div>
            <input
              id="pfile"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={pickPhoto}
              disabled={photoBusy}
              className="sr-only"
            />
            <label htmlFor="pfile" className="btn btn-secondary" style={{ cursor: 'pointer' }}>
              {photoBusy ? 'Subiendo…' : 'Cambiar foto'}
            </label>
            {photoErr && (
              <span className="error-text" role="alert">
                {photoErr}
              </span>
            )}
          </div>

          <Field id="f-name" label="Nombre" value={draft.name} onChange={set('name')} />
          <Field id="f-alias" label="Alias" value={draft.alias} onChange={set('alias')} />
          <Field id="f-tagline" label="Frase principal" value={draft.tagline} onChange={set('tagline')} />
          <Field id="f-location" label="Ciudad / país" value={draft.location} onChange={set('location')} />
          <Field id="f-bio" label="Sobre mí" value={draft.bio} onChange={set('bio')} rows={5} />
          <Field id="f-tools" label="Programas (separados por coma)" value={draft.tools} onChange={set('tools')} />
          <Field id="f-services" label="Servicios (uno por línea)" value={draft.services} onChange={set('services')} rows={4} />
          <Field id="f-email" label="Correo" value={draft.email} onChange={set('email')} type="email" />
          <Field id="f-phone" label="WhatsApp" value={draft.phone} onChange={set('phone')} type="tel" />
          <Field id="f-x" label="Usuario de X" value={draft.x} onChange={set('x')} />
          <Field id="f-discord" label="Usuario de Discord" value={draft.discord} onChange={set('discord')} />

          <div className="panel-subhead">
            <strong>Versión en inglés</strong>
            <span>Se muestra cuando el visitante elige EN. Si dejas un campo vacío, se usa el texto en español.</span>
          </div>
          <Field id="f-tagline-en" label="Frase principal (inglés)" value={draft.taglineEn} onChange={set('taglineEn')} />
          <Field id="f-bio-en" label="Sobre mí (inglés)" value={draft.bioEn} onChange={set('bioEn')} rows={5} />
          <Field
            id="f-services-en"
            label="Servicios en inglés (uno por línea)"
            value={draft.servicesEn}
            onChange={set('servicesEn')}
            rows={4}
          />

          <div className="row" style={{ alignItems: 'center' }}>
            <button className="btn btn-primary" onClick={saveProfile} disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <span className={savedMsg.startsWith('Error') ? 'error-text' : 'saved'} role="status">
              {savedMsg}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function decodeEntities(s: string) {
  const t = document.createElement('textarea');
  t.innerHTML = s;
  return t.value;
}

function Field(props: {
  id: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  rows?: number;
  type?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={props.id}>{props.label}</label>
      {props.rows ? (
        <textarea id={props.id} className="input" rows={props.rows} value={props.value} onChange={props.onChange} />
      ) : (
        <input id={props.id} className="input" type={props.type ?? 'text'} value={props.value} onChange={props.onChange} />
      )}
    </div>
  );
}
