/** Optional YouTube walkthrough — set VITE_CLIENT_GUIDE_VIDEO_URL in .env */
export const CLIENT_GUIDE_VIDEO_URL =
  (import.meta.env.VITE_CLIENT_GUIDE_VIDEO_URL as string | undefined)?.trim() || '';

export { toYoutubeEmbedUrl } from '../utils/youtube';
