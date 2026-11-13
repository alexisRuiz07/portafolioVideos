'use client';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AUTOPLAY_FEATURED, CATS, SHOW_LOGIN_BUTTON, contactLinks, initials, isIllustration, toolList } from '@/lib/defaults';
import { loadLocalIfAny } from '@/lib/backend-local';
import { getBackend } from '@/lib/get-backend';
import { isConfigured } from '@/lib/supabase';
import type { Category, Profile, Video } from '@/lib/types';
import { DiscordIcon, MailIcon, PlayIcon, WhatsAppIcon, XIcon } from './Icons';
import LoginModal from './LoginModal';
import VideoModal from './VideoModal';
import VideoThumb from './VideoThumb';
import { ytEmbed } from '@/lib/youtube';

type Filter = 'all' | Category;
const FILTERS: [Filter, string][] = [
  ['all', 'Todos'],
  ['reels', 'Reels y TikTok'],
  ['youtube', 'YouTube'],
];

export default function Portfolio(props: { profile: Profile; videos: Video[] }) {
  const router = useRouter();
  const [data, setData] = useState(props);
  const { profile: p, videos } = data;
  const [filter, setFilter] = useState<Filter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [loginOpen, setLoginOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [discordCopied, setDiscordCopied] = useState(false);

  // Discord no tiene enlaces por nombre de usuario: se copia al portapapeles
  async function copyDiscord() {
    try {
      await navigator.clipboard.writeText(p.discord);
    } catch {
      const t = document.createElement('textarea');
      t.value = p.discord;
      document.body.appendChild(t);
      t.select();
      document.execCommand('copy');
      t.remove();
    }
    setDiscordCopied(true);
    setTimeout(() => setDiscordCopied(false), 2500);
  }

  // El menú del celular se cierra con Esc
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenuOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Modo de prueba (sin Supabase): muestra lo que editaste en el panel desde este navegador
  useEffect(() => {
    if (isConfigured) return;
    loadLocalIfAny()
      .then((d) => d && setData(d))
      .catch(() => {});
  }, []);

  const openLogin = useCallback(async () => {
    if (await getBackend().hasSession()) return router.push('/admin');
    setLoginOpen(true);
  }, [router]);

  const closeLogin = useCallback(() => {
    setLoginOpen(false);
    if (location.hash === '#admin') history.replaceState(null, '', location.pathname);
  }, []);
  const closeVideo = useCallback(() => setOpenId(null), []);

  // /#admin abre el login
  useEffect(() => {
    const check = () => {
      if (location.hash === '#admin') openLogin();
    };
    check();
    window.addEventListener('hashchange', check);
    return () => window.removeEventListener('hashchange', check);
  }, [openLogin]);

  const featured = videos.find((v) => v.featured) ?? videos[0];
  const list = filter === 'all' ? videos : videos.filter((v) => v.category === filter);
  const open = videos.find((v) => v.id === openId);
  const tools = toolList(p.tools);
  const links = contactLinks(p);

  return (
    <div className="page">
      <nav className="site-nav" aria-label="Principal">
        <a href="#inicio" className="brand" onClick={() => setMenuOpen(false)}>
          {p.photoUrl && (
            <span
              className={isIllustration(p.photoUrl) ? 'brand-avatar' : 'brand-avatar photo'}
              style={{ backgroundImage: `url("${p.photoUrl}")` }}
              aria-hidden="true"
            />
          )}
          <span>{p.alias}</span>
        </a>
        <button
          className="menu-toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          aria-controls="nav-links"
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={menuOpen ? 'burger open' : 'burger'} aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
        </button>
        <div id="nav-links" className={menuOpen ? 'nav-links open' : 'nav-links'} onClick={() => setMenuOpen(false)}>
          <a href="#trabajo">Trabajo</a>
          <a href="#sobre">Sobre mí</a>
          <a href="#servicios">Servicios</a>
          <a href="#contacto" className="btn btn-primary">
            Contacto
          </a>
          {SHOW_LOGIN_BUTTON && (
            <button className="btn btn-ghost" onClick={openLogin}>
              Entrar
            </button>
          )}
        </div>
      </nav>

      <header id="inicio" className="hero">
        <div className="hero-copy">
          <span className="tag tag-accent-2">Editor de video{p.location ? ` · ${p.location}` : ''}</span>
          <h1 className="hero-title">{p.name}</h1>
          <p className="hero-tagline">{p.tagline}</p>
          <div className="row hero-actions">
            <a href="#trabajo" className="btn btn-primary">
              Ver mi trabajo
            </a>
            {links.mailto && (
              <a href={links.mailto} className="btn btn-secondary">
                Escríbeme
              </a>
            )}
          </div>
        </div>
        <div className="hero-media">
          <div className="hero-circle" />
          {featured?.source === 'youtube' && featured.youtubeId ? (
            <div className={`hero-player${featured.category === 'youtube' ? ' landscape' : ''}`}>
              <iframe
                key={featured.id}
                src={ytEmbed(featured.youtubeId, { autoplay: AUTOPLAY_FEATURED, mute: true, loop: true })}
                title={featured.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          ) : featured ? (
            <div className="hero-player">
              <video
                key={featured.id}
                src={featured.url}
                poster={featured.posterUrl ?? undefined}
                controls
                muted
                loop
                autoPlay={AUTOPLAY_FEATURED}
                playsInline
                preload="metadata"
                aria-label={featured.title}
              />
            </div>
          ) : (
            <div className="hero-placeholder">
              <div className="play-dot" style={{ width: 72, height: 72 }}>
                <PlayIcon size={28} />
              </div>
              <strong>Tu reel destacado</strong>
              <span>Sube un video desde el panel y márcalo como destacado.</span>
            </div>
          )}
        </div>
      </header>

      <section id="trabajo" className="work">
        <div className="work-head">
          <h2 className="heading h2">Trabajo</h2>
          <div className="row-tight filters" role="group" aria-label="Filtrar por categoría">
            {FILTERS.map(([k, label]) => (
              <button
                key={k}
                className={filter === k ? 'btn btn-primary' : 'btn btn-secondary'}
                aria-pressed={filter === k}
                onClick={() => setFilter(k)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {list.length > 0 ? (
          <div className="work-grid">
            {list.map((v) => (
              <button key={v.id} className="work-card" onClick={() => setOpenId(v.id)} aria-label={`Ver ${v.title}`}>
                <div className="work-thumb">
                  <VideoThumb video={v} />
                  <div className="play-dot">
                    <PlayIcon size={20} />
                  </div>
                  <span className="tag tag-neutral">{CATS[v.category]}</span>
                </div>
                <div className="work-meta">
                  <strong>{v.title}</strong>
                  {v.description && <span>{v.description}</span>}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="empty">
            <strong>{videos.length ? 'Nada en esta categoría todavía' : 'Aún no hay videos'}</strong>
            <span>Entra a tu panel y sube tus Reels, TikToks o videos de YouTube. Aparecerán aquí al instante.</span>
          </div>
        )}
      </section>

      <section id="sobre" className="about">
        <div className="avatar">
          {p.photoUrl ? (
            // El tratamiento "washed" es para fotos; la ilustración conserva sus colores y se anima
            <div className={isIllustration(p.photoUrl) ? undefined : 'washed'} style={{ width: '100%', height: '100%' }}>
              <div
                className={isIllustration(p.photoUrl) ? 'avatar-img avatar-illustration' : 'avatar-img'}
                role="img"
                aria-label={p.name}
                style={{ backgroundImage: `url("${p.photoUrl}")` }}
              />
            </div>
          ) : (
            <span className="avatar-initials">{initials(p.name)}</span>
          )}
        </div>
        <div className="about-copy">
          <h2 className="heading h2">Sobre mí</h2>
          <p>{p.bio}</p>
          {tools.length > 0 && (
            <div className="row-tight">
              {tools.map((t) => (
                <span key={t} className="tag tag-accent-2">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>
      </section>

      {p.services.length > 0 && (
        <section id="servicios" className="services">
          <h2 className="heading h2">Servicios</h2>
          <div className="services-grid">
            {p.services.map((title, i) => (
              <div key={`${i}-${title}`} className="card service-card">
                <div className="service-num">{String(i + 1).padStart(2, '0')}</div>
                <div className="card-title">{title}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <footer id="contacto" className="contact">
        <h2>¿Editamos tu próximo video?</h2>
        <div className="row contact-actions">
          {links.mailto && (
            <a href={links.mailto} className="btn btn-primary contact-btn">
              <MailIcon />
              <span>{p.email}</span>
            </a>
          )}
          {links.whatsapp && (
            <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-on-dark contact-btn">
              <WhatsAppIcon />
              <span>{p.phone}</span>
            </a>
          )}
          {links.x && (
            <a href={links.x} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-on-dark contact-btn">
              <XIcon />
              <span>{links.xLabel}</span>
            </a>
          )}
          {p.discord && (
            <button
              type="button"
              className="btn btn-secondary btn-on-dark contact-btn"
              onClick={copyDiscord}
              title="Copiar mi usuario de Discord"
            >
              <DiscordIcon />
              <span>{discordCopied ? '¡Copiado! ' : ''}{p.discord}</span>
            </button>
          )}
        </div>
        {p.discord && (
          <span className="contact-hint" role="status">
            {discordCopied ? 'Búscame en Discord con ese usuario para agregarme.' : ''}
          </span>
        )}
      </footer>

      {loginOpen && <LoginModal onClose={closeLogin} />}
      {open && <VideoModal video={open} onClose={closeVideo} />}
    </div>
  );
}
