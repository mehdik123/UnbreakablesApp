import React, { useState } from 'react';
import { Play, Circle, X, WifiOff } from 'lucide-react';
import { getYouTubeThumbnail, toYoutubeEmbedUrl } from '../utils/youtube';
import { isAppOnline } from '../lib/offlineStore';

interface ExerciseVideoEmbedProps {
  videoUrl?: string;
  title: string;
  formDemoLabel: string;
  watchDemoLabel: string;
  offlineLabel?: string;
  isPlaying?: boolean;
  onPlay?: () => void;
  onClose?: () => void;
}

export const ExerciseVideoEmbed: React.FC<ExerciseVideoEmbedProps> = ({
  videoUrl,
  title,
  formDemoLabel,
  watchDemoLabel,
  offlineLabel = 'Connect to the internet to watch this demo',
  isPlaying = false,
  onPlay,
  onClose,
}) => {
  const [offlineHint, setOfflineHint] = useState(false);
  const embedUrl = toYoutubeEmbedUrl(videoUrl || '');
  const thumbnail = getYouTubeThumbnail(videoUrl || '');
  const nocookieEmbed = embedUrl?.replace('www.youtube.com', 'www.youtube-nocookie.com') ?? null;

  if (!embedUrl) return null;

  const handlePlay = () => {
    if (!isAppOnline()) {
      setOfflineHint(true);
      return;
    }
    setOfflineHint(false);
    onPlay?.();
  };

  if (isPlaying) {
    return (
      <div
        className="relative mx-4 mb-4 rounded-[18px] overflow-hidden"
        style={{ aspectRatio: '16 / 9', border: '1px solid var(--hair)', background: '#000' }}
      >
        <iframe
          title={title}
          src={`${nocookieEmbed ?? embedUrl}?autoplay=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
        />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 rounded-lg flex items-center justify-center z-10 active:scale-90 transition-transform"
            style={{
              background: 'rgba(0,0,0,.55)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,.15)',
              color: '#fff',
            }}
            aria-label="Close video"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handlePlay}
      className="block relative mx-4 mb-4 rounded-[18px] overflow-hidden group w-[calc(100%-2rem)] text-start"
      style={{
        aspectRatio: '16 / 9',
        border: '1px solid var(--hair)',
        background:
          'radial-gradient(120% 120% at 70% 20%, rgba(255,45,85,.22), transparent 55%), linear-gradient(135deg,#23262f,#0e0f14)',
      }}
    >
      {thumbnail && (
        <img
          src={thumbnail}
          alt={`${title} demonstration`}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-active:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <div className="wk-video-grid absolute inset-0" />

      <div
        className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-lg"
        style={{
          color: 'rgba(255,255,255,.7)',
          background: 'rgba(0,0,0,.35)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.1)',
        }}
      >
        <Circle className="w-2.5 h-2.5" />
        {formDemoLabel}
      </div>

      <div className="wk-play absolute left-1/2 top-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white">
        <Play className="w-5 h-5 ml-0.5" fill="currentColor" strokeWidth={0} />
      </div>

      <div
        className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[12px] font-semibold text-white px-2.5 py-1.5 rounded-lg"
        style={{
          background: 'rgba(0,0,0,.35)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,.12)',
        }}
      >
        {watchDemoLabel}
      </div>

      {offlineHint && (
        <div
          className="absolute inset-0 flex items-center justify-center px-4 text-center z-10"
          style={{ background: 'rgba(0,0,0,.72)' }}
        >
          <p className="text-sm font-medium text-white flex flex-col items-center gap-2">
            <WifiOff className="w-5 h-5" />
            {offlineLabel}
          </p>
        </div>
      )}
    </button>
  );
};

export default ExerciseVideoEmbed;
