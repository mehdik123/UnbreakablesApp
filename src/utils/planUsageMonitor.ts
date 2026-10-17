/**
 * Free-plan usage monitor helpers for the coach hub.
 * Official egress/DB size come from Supabase Usage (pasted) — the client SDK
 * cannot read org billing meters. Storage can be estimated from the bucket.
 */

import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import {
  EGRESS_CRITICAL_GB,
  EGRESS_SOFT_TARGET_GB,
  EGRESS_WARN_GB,
  FREE_EGRESS_GB,
  getLocalEgressEstimate,
  type PlanRiskLevel,
} from './photoEgressCache';

export const FREE_DB_MB = 500;
export const FREE_STORAGE_GB = 1;
export const FREE_STORAGE_MB = FREE_STORAGE_GB * 1024;

/** Soft targets — act before Fair Use / hard caps. */
export const DB_WARN_PCT = 0.7;
export const DB_CRITICAL_PCT = 0.9;
export const STORAGE_WARN_PCT = 0.7;
export const STORAGE_CRITICAL_PCT = 0.9;

const PLAN_USAGE_KEY = 'ub_coach_plan_usage_v1';
const STORAGE_SCAN_KEY = 'ub_storage_scan_v1';
const STORAGE_SCAN_TTL_MS = 60 * 60 * 1000; // 1 hour — avoid hammering list API

export type CoachPlanUsageReport = {
  monthKey: string;
  egressGb: number | null;
  dbMb: number | null;
  storageMb: number | null;
  updatedAt: string;
};

export type UsageMeterId = 'egress' | 'database' | 'storage';

export type UsageSuggestion = {
  id: string;
  meter: UsageMeterId | 'general';
  level: PlanRiskLevel;
  title: string;
  action: string;
};

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function getCoachPlanUsageReport(): CoachPlanUsageReport | null {
  try {
    const raw = localStorage.getItem(PLAN_USAGE_KEY);
    if (!raw) {
      // Migrate old egress-only report if present
      const legacy = localStorage.getItem('ub_coach_egress_report_v1');
      if (!legacy) return null;
      const parsed = JSON.parse(legacy) as { monthKey?: string; egressGb?: number; updatedAt?: string };
      if (!parsed || parsed.monthKey !== monthKey() || typeof parsed.egressGb !== 'number') return null;
      return {
        monthKey: parsed.monthKey,
        egressGb: parsed.egressGb,
        dbMb: null,
        storageMb: null,
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
    }
    const parsed = JSON.parse(raw) as CoachPlanUsageReport;
    if (!parsed || parsed.monthKey !== monthKey()) return null;
    return {
      monthKey: parsed.monthKey,
      egressGb: typeof parsed.egressGb === 'number' ? parsed.egressGb : null,
      dbMb: typeof parsed.dbMb === 'number' ? parsed.dbMb : null,
      storageMb: typeof parsed.storageMb === 'number' ? parsed.storageMb : null,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

export function saveCoachPlanUsageReport( partial: {
  egressGb?: number | null;
  dbMb?: number | null;
  storageMb?: number | null;
}): CoachPlanUsageReport {
  const prev = getCoachPlanUsageReport();
  const next: CoachPlanUsageReport = {
    monthKey: monthKey(),
    egressGb:
      partial.egressGb !== undefined
        ? partial.egressGb == null
          ? null
          : Math.max(0, Number(partial.egressGb) || 0)
        : prev?.egressGb ?? null,
    dbMb:
      partial.dbMb !== undefined
        ? partial.dbMb == null
          ? null
          : Math.max(0, Number(partial.dbMb) || 0)
        : prev?.dbMb ?? null,
    storageMb:
      partial.storageMb !== undefined
        ? partial.storageMb == null
          ? null
          : Math.max(0, Number(partial.storageMb) || 0)
        : prev?.storageMb ?? null,
    updatedAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(PLAN_USAGE_KEY, JSON.stringify(next));
    // Keep legacy key in sync for older helpers
    if (typeof next.egressGb === 'number') {
      localStorage.setItem(
        'ub_coach_egress_report_v1',
        JSON.stringify({
          monthKey: next.monthKey,
          egressGb: next.egressGb,
          updatedAt: next.updatedAt,
        })
      );
    }
  } catch {
    /* ignore */
  }
  return next;
}

export function meterLevel(used: number | null | undefined, limit: number, warnAt: number, criticalAt: number): PlanRiskLevel {
  if (used == null || !Number.isFinite(used) || limit <= 0) return 'ok';
  const pct = used / limit;
  if (pct >= criticalAt) return 'critical';
  if (pct >= warnAt) return 'warn';
  if (pct >= 0.45) return 'watch';
  return 'ok';
}

export function egressLevel(reportedGb: number | null | undefined, localFetchedMb?: number): PlanRiskLevel {
  if (typeof reportedGb === 'number' && Number.isFinite(reportedGb)) {
    if (reportedGb >= EGRESS_CRITICAL_GB) return 'critical';
    if (reportedGb >= EGRESS_WARN_GB) return 'warn';
    if (reportedGb >= EGRESS_SOFT_TARGET_GB * 0.55) return 'watch';
    return 'ok';
  }
  const localMb = localFetchedMb ?? getLocalEgressEstimate().fetchedMb;
  if (localMb >= 800) return 'warn';
  if (localMb >= 400) return 'watch';
  return 'ok';
}

export function overallPlanLevel(report: CoachPlanUsageReport | null): PlanRiskLevel {
  const local = getLocalEgressEstimate();
  const levels: PlanRiskLevel[] = [
    egressLevel(report?.egressGb, local.fetchedMb),
    meterLevel(report?.dbMb, FREE_DB_MB, DB_WARN_PCT, DB_CRITICAL_PCT),
    meterLevel(report?.storageMb, FREE_STORAGE_MB, STORAGE_WARN_PCT, STORAGE_CRITICAL_PCT),
  ];
  if (levels.includes('critical')) return 'critical';
  if (levels.includes('warn')) return 'warn';
  if (levels.includes('watch')) return 'watch';
  return 'ok';
}

/** Instant coach suggestions based on current meters + local photo traffic. */
export function buildUsageSuggestions(report: CoachPlanUsageReport | null): UsageSuggestion[] {
  const local = getLocalEgressEstimate();
  const out: UsageSuggestion[] = [];
  const eLv = egressLevel(report?.egressGb, local.fetchedMb);
  const dLv = meterLevel(report?.dbMb, FREE_DB_MB, DB_WARN_PCT, DB_CRITICAL_PCT);
  const sLv = meterLevel(report?.storageMb, FREE_STORAGE_MB, STORAGE_WARN_PCT, STORAGE_CRITICAL_PCT);

  if (!report?.egressGb && report?.egressGb !== 0) {
    out.push({
      id: 'egress-sync',
      meter: 'egress',
      level: 'watch',
      title: 'Sync egress from Supabase',
      action: `Paste Egress (GB) from Org → Usage once a week. Free hard stop is ${FREE_EGRESS_GB} GB/mo.`,
    });
  }

  if (eLv === 'critical' || eLv === 'warn') {
    out.push({
      id: 'egress-cut',
      meter: 'egress',
      level: eLv,
      title: eLv === 'critical' ? 'Cut photo bandwidth now' : 'Slow down photo browsing',
      action:
        'Prefer thumbs in galleries, avoid opening full photos in bulk, delete ended-client photos.',
    });
  } else if (eLv === 'watch') {
    out.push({
      id: 'egress-watch',
      meter: 'egress',
      level: 'watch',
      title: 'Egress climbing',
      action: `Stay under ~${EGRESS_SOFT_TARGET_GB} GB soft target. Use thumbs; don’t re-download weeks you already viewed.`,
    });
  }

  if (local.fetchedMb >= 200) {
    out.push({
      id: 'local-photo',
      meter: 'egress',
      level: local.fetchedMb >= 500 ? 'warn' : 'watch',
      title: `This browser fetched ~${local.fetchedMb.toFixed(0)} MB of photos`,
      action: `${local.cacheHits} cache hits saved re-downloads. Still avoid opening many full-size progress shots.`,
    });
  }

  if (dLv === 'warn' || dLv === 'critical') {
    out.push({
      id: 'db-trim',
      meter: 'database',
      level: dLv,
      title: 'Database nearing Free 500 MB',
      action: 'Archive/delete ended clients, old workout weeks you no longer need, and unused templates.',
    });
  } else if (report?.dbMb == null) {
    out.push({
      id: 'db-sync',
      meter: 'database',
      level: 'ok',
      title: 'Log database size',
      action: 'Reports → Disk: paste Database MB (not WAL/System). Free allows 500 MB.',
    });
  }

  if (sLv === 'warn' || sLv === 'critical') {
    out.push({
      id: 'storage-trim',
      meter: 'storage',
      level: sLv,
      title: 'File storage nearing Free 1 GB',
      action: 'Delete progress photos for finished clients; keep thumbs-only viewing for active ones.',
    });
  }

  if (out.length === 0) {
    out.push({
      id: 'healthy',
      meter: 'general',
      level: 'ok',
      title: 'Under Free soft targets',
      action:
        'Keep compressing uploads, browse thumbs, and refresh Usage numbers weekly so alerts stay accurate.',
    });
  }

  return out;
}

export const EGRESS_PLAYBOOK: string[] = [
  'Uploads compress to small JPEG full (~960px) + thumb (~360px) — never store phone originals.',
  'Grids use thumbs + device cache; open full size only when reviewing detail.',
  'At ~400 MB/day you burn Free’s 5 GB in ~12 days. Aim for under ~150 MB/day (~3 GB/month).',
  'Delete photos when a client ends — biggest long-term saver (storage + every future view).',
  'Avoid bulk week browsing near month-end; each device pays egress once.',
  'Database JSON (workouts/meals) also counts as egress — don’t hammer refresh all day.',
  `Soft target: stay under ~${EGRESS_SOFT_TARGET_GB} GB so a spike can’t trip Free Fair Use at ${FREE_EGRESS_GB} GB.`,
];

type StorageScanCache = {
  scannedAt: string;
  bytes: number;
  fileCount: number;
  bucket: string;
};

export function getCachedStorageScan(): StorageScanCache | null {
  try {
    const raw = localStorage.getItem(STORAGE_SCAN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StorageScanCache;
    if (!parsed?.scannedAt || typeof parsed.bytes !== 'number') return null;
    if (Date.now() - new Date(parsed.scannedAt).getTime() > STORAGE_SCAN_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStorageScan(scan: StorageScanCache) {
  try {
    localStorage.setItem(STORAGE_SCAN_KEY, JSON.stringify(scan));
  } catch {
    /* ignore */
  }
}

type ListEntry = {
  name: string;
  id?: string;
  metadata?: { size?: number } | null;
};

async function listFolder(
  bucket: string,
  path: string,
  depth: number
): Promise<{ bytes: number; files: number }> {
  if (!supabase || depth > 6) return { bytes: 0, files: 0 };
  const { data, error } = await supabase.storage.from(bucket).list(path || '', {
    limit: 1000,
    offset: 0,
  });
  if (error || !data) return { bytes: 0, files: 0 };

  let bytes = 0;
  let files = 0;
  const folders: string[] = [];

  for (const entry of data as ListEntry[]) {
    if (!entry?.name) continue;
    // Skip folder placeholder objects
    if (entry.id == null && (entry.metadata == null || entry.metadata?.size == null)) {
      folders.push(path ? `${path}/${entry.name}` : entry.name);
      continue;
    }
    const size = Number(entry.metadata?.size) || 0;
    bytes += size;
    files += 1;
  }

  for (const folder of folders) {
    const nested = await listFolder(bucket, folder, depth + 1);
    bytes += nested.bytes;
    files += nested.files;
  }

  return { bytes, files };
}

/** Estimate file-storage use by listing object metadata (no file downloads). */
export async function scanStorageUsage(force = false): Promise<{
  mb: number;
  fileCount: number;
  scannedAt: string;
  fromCache: boolean;
} | null> {
  if (!force) {
    const cached = getCachedStorageScan();
    if (cached) {
      return {
        mb: cached.bytes / (1024 * 1024),
        fileCount: cached.fileCount,
        scannedAt: cached.scannedAt,
        fromCache: true,
      };
    }
  }

  if (!isSupabaseReady || !supabase) return null;

  const bucket = 'weekly-photos';
  const { bytes, files } = await listFolder(bucket, '', 0);
  const scannedAt = new Date().toISOString();
  saveStorageScan({ scannedAt, bytes, fileCount: files, bucket });
  // Also persist into plan report so meters update
  saveCoachPlanUsageReport({ storageMb: bytes / (1024 * 1024) });

  return {
    mb: bytes / (1024 * 1024),
    fileCount: files,
    scannedAt,
    fromCache: false,
  };
}

export { FREE_EGRESS_GB, EGRESS_SOFT_TARGET_GB, EGRESS_WARN_GB, EGRESS_CRITICAL_GB };
