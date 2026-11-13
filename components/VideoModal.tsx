'use client';
import type { Video } from '@/lib/types';
import { ytEmbed } from '@/lib/youtube';
import { useModalBehavior } from './useModalBehavior';

export default function VideoModal({ video, onClose }: { video: Video; onClose: () => void }) {
  useModalBehavior(true, onClose);
  return (
    <div className="video-modal" onClick={onClose} role="dialog" aria-modal="true" aria-label={video.title}>
      <div className="video-modal-inner" onClick={(e) => e.stopPropagation()}>
        {video.source === 'youtube' && video.youtubeId ? (
          <iframe
            className={`yt-frame ${video.category === 'reels' ? 'yt-portrait' : 'yt-landscape'}`}
            src={ytEmbed(video.youtubeId, { autoplay: true })}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <video src={video.url} poster={video.posterUrl ?? undefined} controls autoPlay playsInline />
        )}
        <div className="video-modal-meta">
          <div>
            <strong>{video.title}</strong>
            {video.description && <span>{video.description}</span>}
          </div>
          <button className="btn btn-secondary btn-on-dark" onClick={onClose} autoFocus>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
