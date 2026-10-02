export type StoryKind = 'checkin' | 'trend' | 'receipt' | 'collage4' | 'collage6';

export type StoryPose = 'front' | 'side' | 'back';

/** Focus point inside the source photo. x/y are 0–1, zoom is 1+. */
export type StoryImageFocus = {
  x: number;
  y: number;
  zoom: number;
};

export const DEFAULT_STORY_FOCUS: StoryImageFocus = { x: 0.5, y: 0.42, zoom: 1.08 };

export type CheckInStoryInput = {
  firstName: string | null;
  goal: string;
  pose: StoryPose;
  startWeek: number;
  endWeek: number;
  startWeightKg: number | null;
  endWeightKg: number | null;
  startImage: CanvasImageSource | null;
  endImage: CanvasImageSource | null;
  startFocus?: StoryImageFocus;
  endFocus?: StoryImageFocus;
  cta?: string;
};

export type TrendStoryInput = {
  firstName: string | null;
  goal: string;
  points: number[];
  cta?: string;
};

export type ReceiptStoryInput = {
  firstName: string | null;
  goal: string;
  weeksOpen: number;
  sessionsLogged: number;
  photoCheckins: number;
  weightLogs: number;
  cta?: string;
};

const W = 1080;
const H = 1920;
const DEFAULT_CTA = 'DM to start your plan';

let logoCache: HTMLImageElement | null = null;
let logoPromise: Promise<HTMLImageElement | null> | null = null;

async function readyFonts() {
  try {
    await Promise.all([
      document.fonts.load('800 96px "Saira Condensed"'),
      document.fonts.load('700 36px Inter'),
      document.fonts.load('600 28px Inter'),
    ]);
  } catch {
    /* fallback fonts are fine */
  }
}

function storyCanvas(): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not draw the story');
  return { canvas, ctx };
}

export async function loadStoryLogo(): Promise<HTMLImageElement | null> {
  if (logoCache) return logoCache;
  if (logoPromise) return logoPromise;
  logoPromise = (async () => {
    try {
      const img = new Image();
      img.decoding = 'async';
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('logo'));
        img.src = '/brand-logo-light.png';
      });
      logoCache = img;
      return img;
    } catch {
      return null;
    } finally {
      logoPromise = null;
    }
  })();
  return logoPromise;
}

function paintBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, W * 0.2, H);
  bg.addColorStop(0, '#1a1016');
  bg.addColorStop(0.35, '#0e1018');
  bg.addColorStop(1, '#07080d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const topGlow = ctx.createRadialGradient(540, -40, 40, 540, 120, 680);
  topGlow.addColorStop(0, 'rgba(255, 45, 85, 0.55)');
  topGlow.addColorStop(0.45, 'rgba(220, 30, 58, 0.18)');
  topGlow.addColorStop(1, 'rgba(220, 30, 58, 0)');
  ctx.fillStyle = topGlow;
  ctx.fillRect(0, 0, W, 760);

  const sideGlow = ctx.createRadialGradient(0, 960, 20, 0, 960, 520);
  sideGlow.addColorStop(0, 'rgba(255, 106, 85, 0.12)');
  sideGlow.addColorStop(1, 'rgba(255, 106, 85, 0)');
  ctx.fillStyle = sideGlow;
  ctx.fillRect(0, 500, 520, 900);

  // Soft film grain substitute: thin top rule
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(120, 0, W - 240, 2);
}

function clamp01(n: number) {
  return Math.min(1, Math.max(0, n));
}

function normalizeFocus(focus?: StoryImageFocus): StoryImageFocus {
  return {
    x: clamp01(focus?.x ?? DEFAULT_STORY_FOCUS.x),
    y: clamp01(focus?.y ?? DEFAULT_STORY_FOCUS.y),
    zoom: Math.min(2.4, Math.max(1, focus?.zoom ?? DEFAULT_STORY_FOCUS.zoom)),
  };
}

function sourceSize(img: CanvasImageSource): { iw: number; ih: number } {
  const src = img as CanvasImageSource & { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number };
  return {
    iw: Number(src.naturalWidth || src.width) || 1,
    ih: Number(src.naturalHeight || src.height) || 1,
  };
}

function coverImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number,
  focus?: StoryImageFocus,
  radius = 28
) {
  const { iw, ih } = sourceSize(img);
  const f = normalizeFocus(focus);
  const scale = Math.max(w / iw, h / ih) * f.zoom;
  const dw = iw * scale;
  const dh = ih * scale;
  // Map focus point into the scaled image, then clamp so the frame stays filled
  let dx = x + w / 2 - dw * f.x;
  let dy = y + h / 2 - dh * f.y;
  // Keep the scaled image covering the frame
  dx = Math.max(x + w - dw, Math.min(x, dx));
  dy = Math.max(y + h - dh, Math.min(y, dy));

  ctx.save();
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  // Subtle inner vignette for polish
  const vig = ctx.createLinearGradient(x, y, x, y + h);
  vig.addColorStop(0, 'rgba(0,0,0,0.28)');
  vig.addColorStop(0.18, 'rgba(0,0,0,0)');
  vig.addColorStop(0.82, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = vig;
  ctx.fillRect(x, y, w, h);
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.14)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, radius);
  else ctx.rect(x, y, w, h);
  ctx.stroke();
  ctx.restore();
}

function photoPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string) {
  ctx.save();
  ctx.fillStyle = '#161922';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, 28);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#8b90a0';
  ctx.font = '600 28px Inter, system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, x + w / 2, y + h / 2);
  ctx.restore();
}

function paintLogo(ctx: CanvasRenderingContext2D, logo: HTMLImageElement | null) {
  if (!logo) return;
  const size = 96;
  const x = (W - size) / 2;
  const y = 56;
  ctx.save();
  ctx.globalAlpha = 0.96;
  ctx.drawImage(logo, x, y, size, size);
  ctx.restore();
}

function paintHeader(
  ctx: CanvasRenderingContext2D,
  title: string,
  firstName: string | null,
  logo: HTMLImageElement | null
) {
  paintLogo(ctx, logo);
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText('UNBREAKABLES', 540, logo ? 172 : 110);

  ctx.fillStyle = '#f7f8fa';
  ctx.font = '800 86px "Saira Condensed", Impact, sans-serif';
  ctx.fillText(title, 540, logo ? 262 : 200);

  if (firstName) {
    ctx.fillStyle = '#ff6a7a';
    ctx.font = '700 30px Inter, system-ui, sans-serif';
    ctx.fillText(firstName, 540, logo ? 312 : 250);
  }
}

function paintCta(ctx: CanvasRenderingContext2D, cta = DEFAULT_CTA) {
  const label = (cta || DEFAULT_CTA).trim() || DEFAULT_CTA;
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  const textW = ctx.measureText(label).width;
  const padX = 42;
  const pillW = Math.min(W - 96, textW + padX * 2);
  const pillH = 78;
  const pillX = (W - pillW) / 2;
  const pillY = H - 150;

  const grad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);
  grad.addColorStop(0, '#ff2d55');
  grad.addColorStop(1, '#ff6a55');
  ctx.save();
  ctx.shadowColor = 'rgba(255, 45, 85, 0.45)';
  ctx.shadowBlur = 28;
  ctx.shadowOffsetY = 10;
  ctx.fillStyle = grad;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(pillX, pillY, pillW, pillH, 999);
  else ctx.rect(pillX, pillY, pillW, pillH);
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText(label, W / 2, pillY + pillH / 2 + 1);
  ctx.textBaseline = 'alphabetic';
}

function goalLabel(goal: string): string {
  return goal ? goal.charAt(0).toUpperCase() + goal.slice(1) : 'Coaching';
}

function round1(n: number): string {
  const v = Math.round(n * 10) / 10;
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

function formatKg(kg: number | null): string {
  if (kg == null || !Number.isFinite(kg)) return '—';
  return `${round1(kg)} kg`;
}

function formatDelta(start: number | null, end: number | null): string {
  if (start == null || end == null) return '—';
  const d = Math.round((end - start) * 10) / 10;
  if (d === 0) return '0 kg';
  const sign = d > 0 ? '+' : '−';
  return `${sign}${round1(Math.abs(d))} kg`;
}

function paintStatCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  stats: { label: string; value: string; accent?: boolean }[]
) {
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, w, h, 28);
  else ctx.rect(x, y, w, h);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 2;
  ctx.stroke();

  stats.forEach((stat, i) => {
    const cx = x + (w / stats.length) * (i + 0.5);
    ctx.textAlign = 'center';
    ctx.fillStyle = stat.accent ? '#ff2d55' : '#f4f5f7';
    ctx.font = '800 40px "Saira Condensed", Impact, sans-serif';
    ctx.fillText(stat.value, cx, y + h * 0.48);
    ctx.fillStyle = '#8b90a0';
    ctx.font = '700 17px Inter, system-ui, sans-serif';
    ctx.fillText(stat.label, cx, y + h * 0.68);
  });
}

export async function renderCheckInStory(input: CheckInStoryInput): Promise<HTMLCanvasElement> {
  await readyFonts();
  const logo = await loadStoryLogo();
  const { canvas, ctx } = storyCanvas();
  paintBackground(ctx);
  paintHeader(ctx, 'CHECK-IN', input.firstName, logo);

  const headerBottom = input.firstName ? (logo ? 340 : 280) : logo ? 300 : 250;
  const photoTop = headerBottom;
  const gap = 24;
  const photoW = (W - 96 - gap) / 2;
  const photoH = 900;
  const leftX = 48;
  const rightX = leftX + photoW + gap;

  if (input.startImage) coverImage(ctx, input.startImage, leftX, photoTop, photoW, photoH, input.startFocus);
  else photoPlaceholder(ctx, leftX, photoTop, photoW, photoH, 'No start photo');

  if (input.endImage) coverImage(ctx, input.endImage, rightX, photoTop, photoW, photoH, input.endFocus);
  else photoPlaceholder(ctx, rightX, photoTop, photoW, photoH, 'No latest photo');

  // VS badge
  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, photoTop + photoH / 2, 34, 0, Math.PI * 2);
  ctx.fillStyle = '#ff2d55';
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '800 22px "Saira Condensed", Impact, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('VS', W / 2, photoTop + photoH / 2 + 1);
  ctx.textBaseline = 'alphabetic';
  ctx.restore();

  const labelY = photoTop + photoH + 48;
  ctx.textAlign = 'center';
  ctx.font = '800 30px "Saira Condensed", Impact, sans-serif';
  ctx.fillStyle = '#f4f5f7';
  ctx.fillText(`WEEK ${input.startWeek}`, leftX + photoW / 2, labelY);
  ctx.fillText(`WEEK ${input.endWeek}`, rightX + photoW / 2, labelY);
  ctx.fillStyle = '#8b90a0';
  ctx.font = '700 18px Inter, system-ui, sans-serif';
  ctx.fillText(input.pose.toUpperCase(), leftX + photoW / 2, labelY + 30);
  ctx.fillText(input.pose.toUpperCase(), rightX + photoW / 2, labelY + 30);

  const weeks = Math.max(0, input.endWeek - input.startWeek);
  const cardY = labelY + 56;
  paintStatCard(ctx, 48, cardY, W - 96, 200, [
    { label: 'WEEKS', value: String(weeks) },
    { label: 'START', value: formatKg(input.startWeightKg) },
    { label: 'NOW', value: formatKg(input.endWeightKg) },
    { label: 'CHANGE', value: formatDelta(input.startWeightKg, input.endWeightKg), accent: true },
  ]);

  ctx.fillStyle = 'rgba(255,255,255,0.55)';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText(goalLabel(input.goal), 540, cardY + 236);

  paintCta(ctx, input.cta);
  return canvas;
}

function smoothPoints(values: number[]): number[] {
  const clean = values.filter((n) => Number.isFinite(n));
  if (clean.length <= 24) return clean;
  const step = clean.length / 24;
  const sampled: number[] = [];
  for (let i = 0; i < 24; i += 1) {
    sampled.push(clean[Math.min(clean.length - 1, Math.floor(i * step))]);
  }
  sampled[sampled.length - 1] = clean[clean.length - 1];
  return sampled;
}

export async function renderTrendStory(input: TrendStoryInput): Promise<HTMLCanvasElement> {
  await readyFonts();
  const logo = await loadStoryLogo();
  const { canvas, ctx } = storyCanvas();
  paintBackground(ctx);
  paintHeader(ctx, 'THE TREND', input.firstName, logo);

  const points = smoothPoints(input.points);
  const start = points[0] ?? null;
  const now = points[points.length - 1] ?? null;
  const high = points.length ? Math.max(...points) : null;
  const low = points.length ? Math.min(...points) : null;

  const top = input.firstName ? (logo ? 360 : 300) : logo ? 330 : 280;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8b90a0';
  ctx.font = '700 20px Inter, system-ui, sans-serif';
  ctx.fillText('NOW', 540, top);
  ctx.fillStyle = '#f4f5f7';
  ctx.font = '800 128px "Saira Condensed", Impact, sans-serif';
  ctx.fillText(now == null ? '—' : `${round1(now)}`, 540, top + 126);
  ctx.fillStyle = '#ff2d55';
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText(now == null ? 'No weight logged yet' : 'kg', 540, top + 172);

  const chartX = 96;
  const chartY = top + 240;
  const chartW = W - 192;
  const chartH = 560;
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') ctx.roundRect(48, chartY - 40, W - 96, chartH + 80, 28);
  else ctx.rect(48, chartY - 40, W - 96, chartH + 80);
  ctx.fill();

  if (points.length >= 2 && high != null && low != null) {
    const min = low;
    const max = high === low ? high + 1 : high;
    const coords = points.map((value, i) => ({
      x: chartX + (chartW * i) / (points.length - 1),
      y: chartY + chartH - ((value - min) / (max - min)) * (chartH - 40) - 20,
    }));

    const area = ctx.createLinearGradient(0, chartY, 0, chartY + chartH);
    area.addColorStop(0, 'rgba(255,45,85,0.28)');
    area.addColorStop(1, 'rgba(255,45,85,0)');
    ctx.beginPath();
    coords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.lineTo(coords[coords.length - 1].x, chartY + chartH);
    ctx.lineTo(coords[0].x, chartY + chartH);
    ctx.closePath();
    ctx.fillStyle = area;
    ctx.fill();

    ctx.beginPath();
    coords.forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    });
    ctx.strokeStyle = '#ff2d55';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();

    const last = coords[coords.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = '#f4f5f7';
    ctx.fill();
  } else {
    ctx.fillStyle = '#8b90a0';
    ctx.font = '600 28px Inter, system-ui, sans-serif';
    ctx.fillText('Log a few weigh-ins to draw the line', 540, chartY + chartH / 2);
  }

  paintStatCard(ctx, 48, 1480, W - 96, 180, [
    { label: 'START', value: formatKg(start) },
    { label: 'LOW', value: formatKg(low) },
    { label: 'HIGH', value: formatKg(high) },
    { label: 'CHANGE', value: formatDelta(start, now), accent: true },
  ]);

  paintCta(ctx, input.cta);
  return canvas;
}

export async function renderReceiptStory(input: ReceiptStoryInput): Promise<HTMLCanvasElement> {
  await readyFonts();
  const logo = await loadStoryLogo();
  const { canvas, ctx } = storyCanvas();
  paintBackground(ctx);
  paintHeader(ctx, 'THE RECEIPT', input.firstName, logo);

  const rows = [
    { label: 'Weeks open', value: String(input.weeksOpen), hint: 'Program weeks in play' },
    { label: 'Sessions logged', value: String(input.sessionsLogged), hint: 'Training days with a set saved' },
    { label: 'Photo check-ins', value: String(input.photoCheckins), hint: 'Weeks with progress photos' },
    { label: 'Weigh-ins', value: String(input.weightLogs), hint: 'Body weight logs' },
  ];

  const top = input.firstName ? (logo ? 350 : 300) : logo ? 320 : 280;
  rows.forEach((row, i) => {
    const y = top + i * 250;
    ctx.fillStyle = 'rgba(255,255,255,0.045)';
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(72, y, W - 144, 220, 28);
    else ctx.rect(72, y, W - 144, 220);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b90a0';
    ctx.font = '700 20px Inter, system-ui, sans-serif';
    ctx.fillText(row.label.toUpperCase(), 112, y + 62);
    ctx.fillStyle = '#f4f5f7';
    ctx.font = '800 84px "Saira Condensed", Impact, sans-serif';
    ctx.fillText(row.value, 112, y + 148);
    ctx.fillStyle = '#8b90a0';
    ctx.font = '600 20px Inter, system-ui, sans-serif';
    ctx.fillText(row.hint, 112, y + 186);
  });

  paintCta(ctx, input.cta);
  return canvas;
}

export type CollageStorySlot = {
  image: CanvasImageSource | null;
  week: number | null;
  pose: StoryPose | null;
  firstName: string | null;
  focus?: StoryImageFocus;
};

export type CollageStoryInput = {
  title?: string;
  slots: CollageStorySlot[];
  showNames?: boolean;
  cta?: string;
};

function poseLabel(pose: StoryPose | null): string {
  if (pose === 'front') return 'FRONT';
  if (pose === 'side') return 'SIDE';
  if (pose === 'back') return 'BACK';
  return '';
}

/** 4-up (2×2) or 6-up (2×3) Instagram collage with week + angle on each cell. */
export async function renderCollageStory(input: CollageStoryInput): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = STORY_W;
  canvas.height = STORY_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas unavailable');

  const count = input.slots.length >= 6 ? 6 : 4;
  const cols = 2;
  const rows = count === 6 ? 3 : 2;
  const gap = 10;
  const padX = 36;
  const topY = 210;
  const bottomReserve = 210;
  const gridW = STORY_W - padX * 2;
  const gridH = STORY_H - topY - bottomReserve;
  const cellW = (gridW - gap * (cols - 1)) / cols;
  const cellH = (gridH - gap * (rows - 1)) / rows;

  paintBase(ctx);
  paintHeader(ctx, (input.title || (count === 6 ? 'SQUAD' : 'CHECK-INS')).toUpperCase(), null);

  for (let i = 0; i < count; i++) {
    const slot = input.slots[i] || {
      image: null,
      week: null,
      pose: null,
      firstName: null,
    };
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = padX + col * (cellW + gap);
    const y = topY + row * (cellH + gap);

    ctx.save();
    roundRect(ctx, x, y, cellW, cellH, 18);
    ctx.clip();

    if (slot.image) {
      coverImage(ctx, slot.image, x, y, cellW, cellH, slot.focus);
      const fade = ctx.createLinearGradient(0, y + cellH * 0.45, 0, y + cellH);
      fade.addColorStop(0, 'rgba(6,7,10,0)');
      fade.addColorStop(1, 'rgba(6,7,10,0.88)');
      ctx.fillStyle = fade;
      ctx.fillRect(x, y, cellW, cellH);
    } else {
      ctx.fillStyle = '#14161c';
      ctx.fillRect(x, y, cellW, cellH);
      ctx.fillStyle = '#3a3f4d';
      ctx.font = '700 22px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Empty', x + cellW / 2, y + cellH / 2);
      ctx.textAlign = 'left';
    }

    const weekTxt = slot.week != null ? `W${slot.week}` : '';
    const poseTxt = poseLabel(slot.pose);
    const meta = [weekTxt, poseTxt].filter(Boolean).join(' · ');
    const nameTxt =
      input.showNames && slot.firstName
        ? slot.firstName.split(/\s+/)[0]?.toUpperCase() || ''
        : '';

    if (meta || nameTxt) {
      ctx.fillStyle = '#f4f5f7';
      ctx.font = '800 28px "Saira Condensed", Impact, sans-serif';
      if (nameTxt) {
        ctx.fillText(nameTxt, x + 16, y + cellH - (meta ? 42 : 18));
      }
      if (meta) {
        ctx.fillStyle = nameTxt ? '#ff6a55' : '#f4f5f7';
        ctx.font = nameTxt
          ? '700 18px Inter, system-ui, sans-serif'
          : '800 26px "Saira Condensed", Impact, sans-serif';
        ctx.fillText(meta, x + 16, y + cellH - 16);
      }
    }

    ctx.restore();

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1.5;
    roundRect(ctx, x, y, cellW, cellH, 18);
    ctx.stroke();
  }

  paintCta(ctx, input.cta);
  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('Could not export the story'));
      else resolve(blob);
    }, 'image/png');
  });
}

export async function loadStoryImage(url: string): Promise<HTMLImageElement> {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Could not load photo');
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = 'async';
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error('Could not load photo'));
    img.src = objectUrl;
  });
  return img;
}
