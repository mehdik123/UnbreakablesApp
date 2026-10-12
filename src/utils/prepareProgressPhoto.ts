/**
 * Bake progress photos to compact SDR JPEGs before storage.
 * Full + thumb keep Free-plan egress under control (photos are the main bandwidth cost).
 */

const FULL_MAX_EDGE = 1200;
const FULL_JPEG_QUALITY = 0.72;
const THUMB_MAX_EDGE = 480;
const THUMB_JPEG_QUALITY = 0.65;
const MAX_SOURCE_BYTES = 30 * 1024 * 1024;

export function isLikelyImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true;
  return /\.(jpe?g|png|webp|gif|heic|heif|avif)$/i.test(file.name || '');
}

function fitWithin(width: number, height: number, maxEdge: number): { width: number; height: number } {
  const edge = Math.max(width, height);
  if (edge <= maxEdge) return { width, height };
  const scale = maxEdge / edge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

async function decodeToDrawable(file: File): Promise<CanvasImageSource & { width: number; height: number }> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file, {
        imageOrientation: 'from-image',
        colorSpaceConversion: 'default',
      });
    } catch {
      /* fall through to HTMLImageElement */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('decode'));
      el.src = url;
    });
    return img;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('jpeg'))),
      'image/jpeg',
      quality
    );
  });
}

async function renderJpeg(
  source: CanvasImageSource & { width: number; height: number },
  maxEdge: number,
  quality: number,
  name: string
): Promise<File> {
  const { width, height } = fitWithin(source.width, source.height, maxEdge);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('canvas');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await canvasToJpegBlob(canvas, quality);
  return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() });
}

export type PreparedProgressPhotos = {
  full: File;
  thumb: File;
};

/** Full display JPEG + small grid thumb (same bake, two sizes). */
export async function prepareProgressPhotoPair(file: File): Promise<PreparedProgressPhotos> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('too-large');
  }

  const source = await decodeToDrawable(file);
  try {
    const [full, thumb] = await Promise.all([
      renderJpeg(source, FULL_MAX_EDGE, FULL_JPEG_QUALITY, 'progress.jpg'),
      renderJpeg(source, THUMB_MAX_EDGE, THUMB_JPEG_QUALITY, 'progress.thumb.jpg'),
    ]);
    return { full, thumb };
  } finally {
    if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
      source.close();
    }
  }
}

/** Convert any camera photo to a compact SDR JPEG (no HDR). */
export async function prepareProgressPhoto(file: File): Promise<File> {
  const { full } = await prepareProgressPhotoPair(file);
  return full;
}
