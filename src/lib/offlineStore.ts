import { Client, CardioPlan, NutritionPlan } from '../types';
import { dbUpdateWorkoutAssignment } from './db';

const SNAPSHOT_PREFIX = 'client_offline_snapshot_';
const QUEUE_PREFIX = 'client_offline_queue_';
const CACHED_LOGIN_PREFIX = 'client_cached_login_';

export interface ClientOfflineSnapshot {
  client: Client;
  nutritionPlan?: NutritionPlan | null;
  cardioPlan?: CardioPlan | null;
  syncedAt: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'workout_assignment';
  assignmentId: string;
  payload: {
    program_json: unknown;
    current_week?: number;
    current_day?: number;
    last_modified_by?: string;
  };
  createdAt: string;
}

export function isAppOnline(): boolean {
  return typeof navigator === 'undefined' ? true : navigator.onLine;
}

function parseJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

/** Revive ISO date strings on a hydrated client object. */
export function reviveClient(client: Client): Client {
  const revived: Client = {
    ...client,
    startDate: client.startDate ? new Date(client.startDate as unknown as string) : new Date(),
    weightLog: (client.weightLog || []).map((e) => ({
      ...e,
      date: e.date ? new Date(e.date as unknown as string) : new Date(),
    })),
  };
  if (client.workoutAssignment) {
    revived.workoutAssignment = {
      ...client.workoutAssignment,
      startDate: client.workoutAssignment.startDate
        ? new Date(client.workoutAssignment.startDate as unknown as string)
        : new Date(),
      lastModifiedAt: client.workoutAssignment.lastModifiedAt
        ? new Date(client.workoutAssignment.lastModifiedAt as unknown as string)
        : undefined,
    };
  }
  return revived;
}

export function saveClientOfflineSnapshot(clientId: string, snapshot: ClientOfflineSnapshot): void {
  try {
    localStorage.setItem(
      `${SNAPSHOT_PREFIX}${clientId}`,
      JSON.stringify({ ...snapshot, syncedAt: new Date().toISOString() })
    );
  } catch (e) {
    console.warn('Failed to save offline snapshot', e);
  }
}

export function loadClientOfflineSnapshot(clientId: string): ClientOfflineSnapshot | null {
  const raw = parseJson<ClientOfflineSnapshot>(
    localStorage.getItem(`${SNAPSHOT_PREFIX}${clientId}`)
  );
  if (!raw?.client) return null;
  return {
    ...raw,
    client: reviveClient(raw.client),
  };
}

export function buildClientFromSnapshot(snapshot: ClientOfflineSnapshot): Client {
  const client = reviveClient(snapshot.client);
  return {
    ...client,
    nutritionPlan: snapshot.nutritionPlan ?? client.nutritionPlan,
    cardioPlan: snapshot.cardioPlan ?? client.cardioPlan,
  };
}

export function patchClientOfflineSnapshot(
  clientId: string,
  patch: Partial<Pick<ClientOfflineSnapshot, 'client' | 'nutritionPlan' | 'cardioPlan'>>
): void {
  const existing = loadClientOfflineSnapshot(clientId);
  if (!existing) return;
  saveClientOfflineSnapshot(clientId, {
    ...existing,
    ...patch,
    client: patch.client ? reviveClient(patch.client) : existing.client,
  });
}

export function saveCachedClientLogin(
  clientId: string,
  username: string,
  passwordHash: string
): void {
  try {
    localStorage.setItem(
      `${CACHED_LOGIN_PREFIX}${clientId}`,
      JSON.stringify({ username, passwordHash })
    );
  } catch {
    /* ignore */
  }
}

export function loadCachedClientLogin(clientId: string): { username: string; passwordHash: string } | null {
  return parseJson(localStorage.getItem(`${CACHED_LOGIN_PREFIX}${clientId}`));
}

function getQueue(clientId: string): OfflineQueueItem[] {
  return parseJson<OfflineQueueItem[]>(localStorage.getItem(`${QUEUE_PREFIX}${clientId}`)) || [];
}

function setQueue(clientId: string, items: OfflineQueueItem[]): void {
  try {
    localStorage.setItem(`${QUEUE_PREFIX}${clientId}`, JSON.stringify(items));
  } catch (e) {
    console.warn('Failed to persist offline queue', e);
  }
}

export function enqueueWorkoutSync(
  clientId: string,
  item: Omit<OfflineQueueItem, 'id' | 'createdAt'>
): void {
  const queue = getQueue(clientId);
  queue.push({
    ...item,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date().toISOString(),
  });
  setQueue(clientId, queue);
}

export function getPendingSyncCount(clientId: string): number {
  return getQueue(clientId).length;
}

export async function flushOfflineQueue(
  clientId: string
): Promise<{ flushed: number; failed: number }> {
  if (!isAppOnline()) return { flushed: 0, failed: 0 };

  const queue = getQueue(clientId);
  if (!queue.length) return { flushed: 0, failed: 0 };

  let flushed = 0;
  let failed = 0;
  const remaining: OfflineQueueItem[] = [];

  for (const item of queue) {
    if (item.type !== 'workout_assignment') {
      remaining.push(item);
      continue;
    }
    const { error } = await dbUpdateWorkoutAssignment(item.assignmentId, item.payload);
    if (error) {
      failed++;
      remaining.push(item);
    } else {
      flushed++;
    }
  }

  setQueue(clientId, remaining);
  return { flushed, failed };
}
