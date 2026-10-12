import React, { useEffect, useState } from 'react';

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
 * Progress photo img that prefers thumbs and falls back to full if thumb missing (legacy uploads).
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
  const [src, setSrc] = useState(preferred);

  useEffect(() => {
    setSrc(prefer === 'full' ? fullSrc : thumbSrc || fullSrc);
  }, [fullSrc, thumbSrc, prefer]);

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      onClick={onClick}
      onError={() => {
        if (src !== fullSrc && fullSrc) setSrc(fullSrc);
      }}
    />
  );
};

export default CachedProgressImage;
