/**
 * Browser Cache API for progress photos — repeat views don't re-hit Supabase egress.
 */

const CACHE_NAME = 'ub-progress-photos-v1';
/** Soft local estimate of bytes saved / spent this UTC month (coach visibility). */
const ESTIMATE_KEY = 'ub_egress_estimate_v1';

export const FREE_EGRESS_GB = 5;
/** Stay under this soft target so a spike doesn't trip Fair Use. */
export const EGRESS_SOFT_TARGET_GB = 4;
/** Warn the coach once org egress (from Dashboard) crosses this. */
export const EGRESS_WARN_GB = 3.5;
/** Critical — close to Free Fair Use drop. */
export const EGRESS_CRITICAL_GB = 4.5;

const COACH_EGRESS_KEY = 'ub_coach_egress_report_v1';

export type CoachEgressReport = {
  monthKey: string;
  egressGb: number;
  updatedAt: string;
};

export function getCoachEgressReport(): CoachEgressReport | null {
  try {
    const raw = localStorage.getItem(COACH_EGRESS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CoachEgressReport;
    if (!parsed || typeof parsed.egressGb !== 'number') return null;
    if (parsed.monthKey !== monthKey()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveCoachEgressReport(egressGb: number): CoachEgressReport {
  const next: CoachEgressReport = {
    monthKey: monthKey(),
    egressGb: Math.max(0, Number(egressGb) || 0),
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(COACH_EGRESS_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}

export type PlanRiskLevel = 'ok' | 'watch' | 'warn' | 'critical';

export function getPlanRiskLevel(opts?: {
  reportedEgressGb?: number | null;
  localFetchedMb?: number;
}): PlanRiskLevel {
  const reported = opts?.reportedEgressGb;
  if (typeof reported === 'number' && Number.isFinite(reported)) {
    if (reported >= EGRESS_CRITICAL_GB) return 'critical';
    if (reported >= EGRESS_WARN_GB) return 'warn';
    if (reported >= EGRESS_SOFT_TARGET_GB * 0.55) return 'watch';
  }
  const localMb = opts?.localFetchedMb ?? getLocalEgressEstimate().fetchedMb;
  // Local is only this browser — treat as early signal, not org truth
  if (localMb >= 800) return 'warn';
  if (localMb >= 400) return 'watch';
  return 'ok';
}

type EgressEstimate = {
  monthKey: string;
  fetchedBytes: number;
  cacheHits: number;
};

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

function readEstimate(): EgressEstimate {
  try {
    const raw = localStorage.getItem(ESTIMATE_KEY);
    if (!raw) return { monthKey: monthKey(), fetchedBytes: 0, cacheHits: 0 };
    const parsed = JSON.parse(raw) as EgressEstimate;
    if (parsed.monthKey !== monthKey()) {
      return { monthKey: monthKey(), fetchedBytes: 0, cacheHits: 0 };
    }
    return parsed;
  } catch {
    return { monthKey: monthKey(), fetchedBytes: 0, cacheHits: 0 };
  }
}

function writeEstimate(next: EgressEstimate) {
  try {
    localStorage.setItem(ESTIMATE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota */
  }
}

function recordFetch(bytes: number) {
  const cur = readEstimate();
  cur.fetchedBytes += Math.max(0, bytes);
  writeEstimate(cur);
}

function recordCacheHit() {
  const cur = readEstimate();
  cur.cacheHits += 1;
  writeEstimate(cur);
}

export function getLocalEgressEstimate(): {
  fetchedMb: number;
  cacheHits: number;
  softTargetGb: number;
  freeLimitGb: number;
  monthKey: string;
} {
  const cur = readEstimate();
  return {
    fetchedMb: cur.fetchedBytes / (1024 * 1024),
    cacheHits: cur.cacheHits,
    softTargetGb: EGRESS_SOFT_TARGET_GB,
    freeLimitGb: FREE_EGRESS_GB,
    monthKey: cur.monthKey,
  };
}

async function openCache(): Promise<Cache | null> {
  if (typeof caches === 'undefined') return null;
  try {
    return await caches.open(CACHE_NAME);
  } catch {
    return null;
  }
}

/** Fetch a photo URL once; later loads reuse the browser cache (no Supabase egress). */
export async function fetchPhotoCached(url: string): Promise<Blob> {
  if (!url) throw new Error('Missing photo URL');

  const cache = await openCache();
  if (cache) {
    const hit = await cache.match(url);
    if (hit) {
      recordCacheHit();
      return hit.blob();
    }
  }

  const res = await fetch(url, { mode: 'cors', credentials: 'omit' });
  if (!res.ok) throw new Error('Could not download photo');

  const clone = res.clone();
  const blob = await res.blob();
  recordFetch(blob.size);

  if (cache) {
    try {
      await cache.put(url, clone);
    } catch {
      /* opaque / quota — ignore */
    }
  }

  return blob;
}

export async function loadImageCached(url: string): Promise<HTMLImageElement> {
  const blob = await fetchPhotoCached(url);
  const objectUrl = URL.createObjectURL(blob);
  const img = new Image();
  img.decoding = 'async';
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Could not load photo'));
      img.src = objectUrl;
    });
  } catch (err) {
    URL.revokeObjectURL(objectUrl);
    throw err;
  }
  // Keep object URL alive while image is in use; revoke on decode after paint
  img.addEventListener(
    'load',
    () => {
      /* already loaded */
    },
    { once: true }
  );
  // Store revoke hook
  (img as HTMLImageElement & { __ubRevoke?: () => void }).__ubRevoke = () =>
    URL.revokeObjectURL(objectUrl);
  return img;
}
