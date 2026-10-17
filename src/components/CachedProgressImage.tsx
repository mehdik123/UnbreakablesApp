import React, { useEffect, useState } from 'react';
import { fetchPhotoCached } from '../utils/photoEgressCache';

type Props = {
  fullSrc: string;
  thumbSrc?: string;
  alt: string;
  className?: string;
  /** Prefer thumb for grids; full for lightbox. */
  prefer?: 'thumb' | 'full';
  onClick?: () => void;
};

/**
 * Progress photo that loads via Cache API (repeat views = no Supabase egress).
 * Prefers thumbs; falls back to full if thumb missing (legacy uploads).
 */
export const CachedProgressImage: React.FC<Props> = ({
  fullSrc,
  thumbSrc,
  alt,
  className,
  prefer = 'thumb',
  onClick,
}) => {
  const preferred = prefer === 'full' ? fullSrc : thumbSrc || fullSrc;
  const [src, setSrc] = useState<string>('');
  const [triedFull, setTriedFull] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let objectUrl: string | null = null;
    setTriedFull(false);

    const load = async (url: string) => {
      if (!url) return;
      try {
        const blob = await fetchPhotoCached(url);
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      } catch {
        // Network / CORS — last resort direct URL (still may cache in browser HTTP cache)
        if (!cancelled) setSrc(url);
      }
    };

    void load(preferred);

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [preferred]);

  return (
    <img
      src={src || undefined}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      onClick={onClick}
      onError={() => {
        if (!triedFull && fullSrc && src !== fullSrc && preferred !== fullSrc) {
          setTriedFull(true);
          void fetchPhotoCached(fullSrc)
            .then((blob) => {
              const u = URL.createObjectURL(blob);
              setSrc(u);
            })
            .catch(() => setSrc(fullSrc));
        }
      }}
    />
  );
};

export default CachedProgressImage;
