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
      if (
        key === 'clients' ||
        key.startsWith('nutrition_editor_') ||
        key.startsWith('nutrition_plan_') ||
        (key.startsWith('client_') && key.includes('_complete_')) ||
        (key.startsWith('client_') && key.includes('_nutrition_'))
      ) {
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

/** Call once on coach app boot when Supabase is ready. */
export function reclaimLocalStorageQuotaIfNeeded(): void {
  if (!isSupabaseReady) return;
  freeHeavyLocalStorageDrafts();
}
