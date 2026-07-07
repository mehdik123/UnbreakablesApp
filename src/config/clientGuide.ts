/** Optional YouTube walkthrough — set VITE_CLIENT_GUIDE_VIDEO_URL in .env */
export const CLIENT_GUIDE_VIDEO_URL =
  (import.meta.env.VITE_CLIENT_GUIDE_VIDEO_URL as string | undefined)?.trim() || '';

export function toYoutubeEmbedUrl(url: string): string | null {
  if (!url) return null;
  const watch = url.match(/[?&]v=([^&]+)/);
  if (watch) return `https://www.youtube.com/embed/${watch[1]}`;
  const short = url.match(/youtu\.be\/([^?&]+)/);
  if (short) return `https://www.youtube.com/embed/${short[1]}`;
  const embed = url.match(/youtube\.com\/embed\/([^?&]+)/);
  if (embed) return `https://www.youtube.com/embed/${embed[1]}`;
  const shorts = url.match(/youtube\.com\/shorts\/([^?&]+)/);
  if (shorts) return `https://www.youtube.com/embed/${shorts[1]}`;
  return null;
}
