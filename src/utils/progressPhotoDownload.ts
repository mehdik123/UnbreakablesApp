import type { WeeklyPhoto } from '../lib/db';

export type ProgressPhotoPose = 'front' | 'side' | 'back';

export function progressPhotoUrl(photo: WeeklyPhoto): string {
  return photo.imageUrl || photo.image_url || '';
}

export function progressPhotoTypeLabel(type: ProgressPhotoPose | string): string {
  switch (type) {
    case 'front':
      return 'Front';
    case 'side':
      return 'Side';
    case 'back':
      return 'Back';
    default:
      return 'Photo';
  }
}

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function fileBase(photo: WeeklyPhoto): string {
  return `week-${photo.week}-${photo.type}`;
}

async function fetchPhotoBlob(url: string): Promise<Blob> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not download photo');
  return res.blob();
}

/** Download the original image bytes without burning any label. */
export async function downloadProgressPhotoRaw(photo: WeeklyPhoto): Promise<void> {
  const url = progressPhotoUrl(photo);
  if (!url) throw new Error('Missing photo URL');
  const blob = await fetchPhotoBlob(url);
  const ext = blob.type.includes('png') ? 'png' : 'jpg';
  triggerBlobDownload(blob, `${fileBase(photo)}-raw.${ext}`);
}

/**
 * Download a copy with a clear pose tag (Front / Side / Back) and week label.
 */
export async function downloadProgressPhotoTagged(photo: WeeklyPhoto): Promise<void> {
  const url = progressPhotoUrl(photo);
  if (!url) throw new Error('Missing photo URL');
  const blob = await fetchPhotoBlob(url);

  let source: CanvasImageSource;
  let width: number;
  let height: number;
  let cleanup: (() => void) | null = null;

  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(blob);
    source = bitmap;
    width = bitmap.width;
    height = bitmap.height;
    cleanup = () => bitmap.close();
  } else {
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load photo'));
      img.src = objectUrl;
    });
    source = img;
    width = img.naturalWidth || img.width;
    height = img.naturalHeight || img.height;
    cleanup = () => URL.revokeObjectURL(objectUrl);
  }

  try {
    if (!width || !height) throw new Error('Invalid photo size');

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not draw photo');

    ctx.drawImage(source, 0, 0, width, height);

    const pad = Math.max(16, Math.round(Math.min(width, height) * 0.03));
    const tag = progressPhotoTypeLabel(photo.type).toUpperCase();
    const week = `WEEK ${photo.week}`;
    const fontSize = Math.max(28, Math.round(Math.min(width, height) * 0.045));
    const subSize = Math.max(18, Math.round(fontSize * 0.55));

    ctx.textBaseline = 'top';
    ctx.font = `800 ${fontSize}px "Saira Condensed", Impact, sans-serif`;
    const tagWidth = ctx.measureText(tag).width;
    ctx.font = `700 ${subSize}px Inter, system-ui, sans-serif`;
    const weekWidth = ctx.measureText(week).width;
    const boxW = Math.max(tagWidth, weekWidth) + pad * 2;
    const boxH = pad + fontSize + Math.round(pad * 0.45) + subSize + pad;
    const boxX = pad;
    const boxY = pad;

    ctx.fillStyle = 'rgba(9, 11, 16, 0.72)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(boxX, boxY, boxW, boxH, Math.round(pad * 0.45));
    } else {
      ctx.rect(boxX, boxY, boxW, boxH);
    }
    ctx.fill();

    ctx.fillStyle = '#ff2d55';
    ctx.font = `800 ${fontSize}px "Saira Condensed", Impact, sans-serif`;
    ctx.fillText(tag, boxX + pad, boxY + pad);

    ctx.fillStyle = '#f4f5f7';
    ctx.font = `700 ${subSize}px Inter, system-ui, sans-serif`;
    ctx.fillText(week, boxX + pad, boxY + pad + fontSize + Math.round(pad * 0.35));

    const out = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not export photo'))), 'image/jpeg', 0.92);
    });
    triggerBlobDownload(out, `${fileBase(photo)}-tagged.jpg`);
  } finally {
    cleanup?.();
  }
}
