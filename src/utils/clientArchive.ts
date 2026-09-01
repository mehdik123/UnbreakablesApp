const ARCHIVE_KEY = 'coach_archived_client_ids';

function readIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ARCHIVE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((id): id is string => typeof id === 'string' && id.length > 0));
  } catch {
    return new Set();
  }
}

function writeIds(ids: Set<string>): void {
  try {
    localStorage.setItem(ARCHIVE_KEY, JSON.stringify([...ids]));
  } catch {
    /* ignore quota errors */
  }
}

/** Fallback when is_archived column is not migrated yet (per-browser). */
export function readLocalArchivedIds(): Set<string> {
  return readIds();
}

export function addLocalArchivedId(clientId: string): void {
  const ids = readIds();
  ids.add(clientId);
  writeIds(ids);
}

export function removeLocalArchivedId(clientId: string): void {
  const ids = readIds();
  ids.delete(clientId);
  writeIds(ids);
}

export function resolveClientArchived(clientId: string, rowArchived?: boolean | null): boolean {
  if (rowArchived === true) return true;
  return readLocalArchivedIds().has(clientId);
}

export function isMissingArchiveColumnError(message: string | undefined): boolean {
  if (!message) return false;
  const m = message.toLowerCase();
  return (
    m.includes('is_archived') &&
    (m.includes('column') || m.includes('schema cache') || m.includes('does not exist'))
  );
}

/** True when Supabase accepted zero rows — still treat as failure for persistence. */
export function isEmptyDbUpdate(data: unknown, error: unknown): boolean {
  return !error && !data;
}
