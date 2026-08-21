import { Client } from '../types';
import { isSupabaseReady } from '../lib/supabaseClient';

/**
 * Persist the coach clients list to localStorage safely.
 *
 * When Supabase is the source of truth, NEVER mirror full clients (workouts +
 * nutrition + weeks) into localStorage — that hits QuotaExceededError around
 * ~10 clients (~5MB browser quota) and breaks create/assign flows.
 *
 * Offline / no-Supabase mode still writes a cache, with a slim fallback if
 * the full payload is too large.
 */
export function persistClientsLocally(clients: Client[]): void {
  if (isSupabaseReady) {
    try {
      // Free quota from older builds that stuffed full plans into this key.
      localStorage.removeItem('clients');
    } catch {
      /* ignore */
    }
    return;
  }

  try {
    localStorage.setItem('clients', JSON.stringify(clients));
  } catch (err) {
    console.warn('localStorage clients quota exceeded; writing slim cache', err);
    try {
      const slim = clients.map((c) => slimClientForCache(c));
      localStorage.setItem('clients', JSON.stringify(slim));
    } catch (err2) {
      console.error('Failed to persist clients even with slim cache', err2);
    }
  }
}

function slimClientForCache(c: Client): Client {
  return {
    ...c,
    nutritionPlan: undefined,
    cardioPlan: undefined,
    workoutAssignment: c.workoutAssignment
      ? {
          ...c.workoutAssignment,
          // Keep week metadata only — drop day/exercise payloads that dominate size
          weeks: (c.workoutAssignment.weeks || []).map((w) => ({
            weekNumber: w.weekNumber,
            isUnlocked: w.isUnlocked,
            isCompleted: w.isCompleted,
            deployedAt: w.deployedAt,
            startDate: w.startDate,
            createdAt: (w as any).createdAt,
            progressionNotes: w.progressionNotes,
            exercises: [],
            days: [],
          })),
          program: c.workoutAssignment.program
            ? {
                ...c.workoutAssignment.program,
                days: [],
              }
            : c.workoutAssignment.program,
        }
      : undefined,
  };
}

/**
 * Remove heavy coach draft / mirror keys that fill the ~5MB quota.
 * Safe when Supabase is the source of truth — real plans live in the DB.
 */
export function freeHeavyLocalStorageDrafts(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (shouldDropHeavyKey(key)) {
        try {
          localStorage.removeItem(key);
        } catch {
          /* ignore */
        }
      }
    }
  } catch {
    /* ignore */
  }
}

function shouldDropHeavyKey(key: string): boolean {
  if (key === 'clients' || key === 'meals' || key === 'exercises') return true;
  if (key.startsWith('nutrition_editor_')) return true;
  if (key.startsWith('nutrition_plan_')) return true;
  if (key.startsWith('nutritionTemplates') || key === 'nutrition_templates') return true;
  if (key.startsWith('client_offline_snapshot_')) return true;
  if (key.startsWith('client_offline_queue_')) return true;
  if (key.startsWith('client_') && key.includes('_complete_')) return true;
  if (key.startsWith('client_') && key.includes('_nutrition_')) return true;
  if (key.startsWith('client_') && key.includes('_plan_')) return true;
  if (key.startsWith('client_') && key.endsWith('_assignment')) return true;
  if (key.startsWith('client_') && key.includes('_complete')) return true;
  if (key.startsWith('weight_entries_')) return true;
  if (key.startsWith('performance_')) return true;
  return false;
}

/**
 * Mirror a plan/share blob to localStorage only when offline (no Supabase).
 * With Supabase, these dumps are what fill the quota on the live domain.
 */
export function mirrorPlanLocally(key: string, value: unknown): boolean {
  if (isSupabaseReady) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    return true;
  }
  return safeLocalStorageSet(key, typeof value === 'string' ? value : JSON.stringify(value));
}

/** Safe setItem that never crashes the UI on quota errors. */
export function safeLocalStorageSet(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    console.warn(`localStorage setItem failed for ${key}:`, err);
    // One recovery pass: drop heavy drafts, then retry once
    freeHeavyLocalStorageDrafts();
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (err2) {
      console.warn(`localStorage setItem still failed for ${key}:`, err2);
      return false;
    }
  }
}

const RECLAIM_FLAG = 'ub_ls_reclaim_v';
const RECLAIM_VERSION = '4';

/** Call once on coach app boot when Supabase is ready. */
export function reclaimLocalStorageQuotaIfNeeded(): void {
  if (!isSupabaseReady) return;
  try {
    // Always clear heavy mirrors; version flag forces a full wipe after deploys
    // that introduced this reclaim (production browsers keep old bloated keys).
    freeHeavyLocalStorageDrafts();
    localStorage.setItem(RECLAIM_FLAG, RECLAIM_VERSION);
  } catch {
    try {
      freeHeavyLocalStorageDrafts();
    } catch {
      /* ignore */
    }
  }
}
