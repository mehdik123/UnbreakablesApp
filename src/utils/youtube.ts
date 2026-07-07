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

export function getYouTubeThumbnail(videoUrl: string): string | null {
  if (!videoUrl) return null;
  const videoId = videoUrl.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([^&\n?#/]+)/
  )?.[1];
  if (!videoId) return null;
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}
