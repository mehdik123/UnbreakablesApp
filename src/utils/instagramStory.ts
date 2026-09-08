export type StoryKind = 'checkin' | 'trend' | 'receipt';

export type StoryPose = 'front' | 'side' | 'back';

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
};

export type TrendStoryInput = {
  firstName: string | null;
  goal: string;
  points: number[];
};

export type ReceiptStoryInput = {
  firstName: string | null;
  goal: string;
  weeksOpen: number;
  sessionsLogged: number;
  photoCheckins: number;
  weightLogs: number;
};

const W = 1080;
const H = 1920;

async function readyFonts() {
  try {
    await document.fonts.load('800 88px "Saira Condensed"');
    await document.fonts.load('700 36px Inter');
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

function paintBackground(ctx: CanvasRenderingContext2D) {
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, '#141018');
  bg.addColorStop(0.42, '#0c0e14');
  bg.addColorStop(1, '#090b10');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(540, 80, 20, 540, 80, 520);
  glow.addColorStop(0, 'rgba(220, 30, 58, 0.42)');
  glow.addColorStop(1, 'rgba(220, 30, 58, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, 520);
}

function paintHeader(ctx: CanvasRenderingContext2D, title: string, firstName: string | null) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ff2d55';
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  ctx.fillText('UNBREAKABLES', 540, 118);
  ctx.fillStyle = '#f4f5f7';
  ctx.font = '800 92px "Saira Condensed", Impact, sans-serif';
  ctx.fillText(title, 540, 214);
  if (firstName) {
    ctx.fillStyle = '#c8ccd6';
    ctx.font = '600 34px Inter, system-ui, sans-serif';
    ctx.fillText(firstName, 540, 268);
  }
}

function paintFooter(ctx: CanvasRenderingContext2D) {
  ctx.textAlign = 'center';
  ctx.fillStyle = '#6d7280';
  ctx.font = '600 22px Inter, system-ui, sans-serif';
  ctx.fillText('Coached with Unbreakables', 540, H - 72);
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

function coverImage(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const src = img as CanvasImageSource & { width?: number; height?: number };
  const iw = Number(src.width) || w;
  const ih = Number(src.height) || h;
  const scale = Math.max(w / iw, h / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = x + (w - dw) / 2;
  const dy = y + (h - dh) / 2;
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function photoPlaceholder(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, label: string) {
  ctx.save();
  ctx.fillStyle = '#161922';
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 28);
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

export async function renderCheckInStory(input: CheckInStoryInput): Promise<HTMLCanvasElement> {
  await readyFonts();
  const { canvas, ctx } = storyCanvas();
  paintBackground(ctx);
  paintHeader(ctx, 'CHECK-IN', input.firstName);

  const photoTop = input.firstName ? 320 : 280;
  const gap = 28;
  const photoW = (W - 96 - gap) / 2;
  const photoH = 980;
  const leftX = 48;
  const rightX = leftX + photoW + gap;

  if (input.startImage) coverImage(ctx, input.startImage, leftX, photoTop, photoW, photoH);
  else photoPlaceholder(ctx, leftX, photoTop, photoW, photoH, 'No start photo');

  if (input.endImage) coverImage(ctx, input.endImage, rightX, photoTop, photoW, photoH);
  else photoPlaceholder(ctx, rightX, photoTop, photoW, photoH, 'No latest photo');

  const labelY = photoTop + photoH + 52;
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillStyle = '#f4f5f7';
  ctx.fillText(`WEEK ${input.startWeek}`, leftX + photoW / 2, labelY);
  ctx.fillText(`WEEK ${input.endWeek}`, rightX + photoW / 2, labelY);

  ctx.fillStyle = '#8b90a0';
  ctx.font = '600 20px Inter, system-ui, sans-serif';
  ctx.fillText(input.pose.toUpperCase(), leftX + photoW / 2, labelY + 32);
  ctx.fillText(input.pose.toUpperCase(), rightX + photoW / 2, labelY + 32);

  const cardY = labelY + 64;
  const cardH = 280;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.roundRect(48, cardY, W - 96, cardH, 28);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const weeks = Math.max(0, input.endWeek - input.startWeek);
  const stats = [
    { label: 'WEEKS', value: String(weeks) },
    { label: 'START', value: formatKg(input.startWeightKg) },
    { label: 'NOW', value: formatKg(input.endWeightKg) },
    { label: 'CHANGE', value: formatDelta(input.startWeightKg, input.endWeightKg) },
  ];
  stats.forEach((stat, i) => {
    const cx = 48 + ((W - 96) / 4) * (i + 0.5);
    ctx.fillStyle = i === 3 ? '#ff2d55' : '#f4f5f7';
    ctx.font = '800 40px "Saira Condensed", Impact, sans-serif';
    ctx.fillText(stat.value, cx, cardY + 118);
    ctx.fillStyle = '#8b90a0';
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.fillText(stat.label, cx, cardY + 158);
  });

  ctx.fillStyle = '#c8ccd6';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.fillText(goalLabel(input.goal), 540, cardY + 230);

  paintFooter(ctx);
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
  const { canvas, ctx } = storyCanvas();
  paintBackground(ctx);
  paintHeader(ctx, 'THE TREND', input.firstName);

  const points = smoothPoints(input.points);
  const start = points[0] ?? null;
  const now = points[points.length - 1] ?? null;
  const high = points.length ? Math.max(...points) : null;
  const low = points.length ? Math.min(...points) : null;

  const top = input.firstName ? 340 : 300;
  ctx.textAlign = 'center';
  ctx.fillStyle = '#8b90a0';
  ctx.font = '700 22px Inter, system-ui, sans-serif';
  ctx.fillText('NOW', 540, top);
  ctx.fillStyle = '#f4f5f7';
  ctx.font = '800 120px "Saira Condensed", Impact, sans-serif';
  ctx.fillText(now == null ? '—' : `${round1(now)}`, 540, top + 120);
  ctx.fillStyle = '#ff2d55';
  ctx.font = '700 28px Inter, system-ui, sans-serif';
  ctx.fillText(now == null ? 'No weight logged yet' : 'kg', 540, top + 168);

  const chartX = 96;
  const chartY = top + 240;
  const chartW = W - 192;
  const chartH = 620;
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  ctx.beginPath();
  ctx.roundRect(48, chartY - 40, W - 96, chartH + 80, 28);
  ctx.fill();

  if (points.length >= 2 && high != null && low != null) {
    const min = low;
    const max = high === low ? high + 1 : high;
    const coords = points.map((value, i) => ({
      x: chartX + (chartW * i) / (points.length - 1),
      y: chartY + chartH - ((value - min) / (max - min)) * (chartH - 40) - 20,
    }));
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

  const stats = [
    { label: 'START', value: formatKg(start) },
    { label: 'LOW', value: formatKg(low) },
    { label: 'HIGH', value: formatKg(high) },
    { label: 'CHANGE', value: formatDelta(start, now) },
  ];
  const cardY = 1540;
  stats.forEach((stat, i) => {
    const cx = 48 + ((W - 96) / 4) * (i + 0.5);
    ctx.fillStyle = i === 3 ? '#ff2d55' : '#f4f5f7';
    ctx.font = '800 40px "Saira Condensed", Impact, sans-serif';
    ctx.fillText(stat.value, cx, cardY);
    ctx.fillStyle = '#8b90a0';
    ctx.font = '700 18px Inter, system-ui, sans-serif';
    ctx.fillText(stat.label, cx, cardY + 36);
  });

  ctx.fillStyle = '#c8ccd6';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.fillText(goalLabel(input.goal), 540, cardY + 96);

  paintFooter(ctx);
  return canvas;
}

export async function renderReceiptStory(input: ReceiptStoryInput): Promise<HTMLCanvasElement> {
  await readyFonts();
  const { canvas, ctx } = storyCanvas();
  paintBackground(ctx);
  paintHeader(ctx, 'THE RECEIPT', input.firstName);

  const rows = [
    { label: 'Weeks open', value: String(input.weeksOpen), hint: 'Program weeks in play' },
    { label: 'Sessions logged', value: String(input.sessionsLogged), hint: 'Training days with a set saved' },
    { label: 'Photo check-ins', value: String(input.photoCheckins), hint: 'Weeks with progress photos' },
    { label: 'Weigh-ins', value: String(input.weightLogs), hint: 'Body weight logs' },
  ];

  const top = input.firstName ? 340 : 300;
  rows.forEach((row, i) => {
    const y = top + i * 280;
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.beginPath();
    ctx.roundRect(72, y, W - 144, 248, 28);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.textAlign = 'left';
    ctx.fillStyle = '#8b90a0';
    ctx.font = '700 22px Inter, system-ui, sans-serif';
    ctx.fillText(row.label.toUpperCase(), 112, y + 72);
    ctx.fillStyle = '#f4f5f7';
    ctx.font = '800 92px "Saira Condensed", Impact, sans-serif';
    ctx.fillText(row.value, 112, y + 168);
    ctx.fillStyle = '#8b90a0';
    ctx.font = '600 22px Inter, system-ui, sans-serif';
    ctx.fillText(row.hint, 112, y + 210);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#c8ccd6';
  ctx.font = '600 26px Inter, system-ui, sans-serif';
  ctx.fillText(goalLabel(input.goal), 540, H - 140);

  paintFooter(ctx);
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
