/**
 * Bake progress photos to SDR JPEG before storage.
 * iPhone HDR / HEIC files stay huge and look washed or neon in screenshots;
 * drawing onto an sRGB canvas tone-maps to normal color and drops the HDR gain map.
 */

const MAX_EDGE = 1600;
const JPEG_QUALITY = 0.82;
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

function canvasToJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('jpeg'))),
      'image/jpeg',
      JPEG_QUALITY
    );
  });
}

/** Convert any camera photo to a compact SDR JPEG (no HDR). */
export async function prepareProgressPhoto(file: File): Promise<File> {
  if (file.size > MAX_SOURCE_BYTES) {
    throw new Error('too-large');
  }

  const source = await decodeToDrawable(file);
  const { width, height } = fitWithin(source.width, source.height, MAX_EDGE);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('canvas');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, width, height);

  if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) {
    source.close();
  }

  const blob = await canvasToJpegBlob(canvas);
  return new File([blob], 'progress.jpg', { type: 'image/jpeg', lastModified: Date.now() });
}
