'use client';
import { useState } from 'react';
import type { Video } from '@/lib/types';
import { ytThumb } from '@/lib/youtube';

/** Miniatura de un video: foto de YouTube, póster generado o fotograma del archivo. */
export default function VideoThumb({ video, className }: { video: Video; className?: string }) {
  if (video.source === 'youtube' && video.youtubeId) {
    return <YouTubeImg id={video.youtubeId} className={className} />;
  }
  if (video.posterUrl) return <img className={className} src={video.posterUrl} alt="" loading="lazy" />;
  return <video className={className} src={`${video.url}#t=0.5`} muted preload="metadata" playsInline />;
}

function YouTubeImg({ id, className }: { id: string; className?: string }) {
  const [src, setSrc] = useState(ytThumb(id));
  const fallback = () => setSrc((s) => (s.includes('mqdefault') ? s : ytThumb(id, 'mqdefault')));
  return (
    <img
      className={className}
      src={src}
      alt=""
      loading="lazy"
      onError={fallback}
      // YouTube responde con una imagen gris de 120 px cuando no hay versión en alta resolución
      onLoad={(e) => e.currentTarget.naturalWidth <= 120 && fallback()}
    />
  );
}
