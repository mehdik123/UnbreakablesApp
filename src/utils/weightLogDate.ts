/**
 * Coach-only helpers for showing WHEN a client logged a body-weight entry.
 * The entry's `date` is the day the weight belongs to; `loggedAt` is the
 * timestamp the client actually saved it (client_weight_logs.created_at).
 */

function toDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Whole days between the log timestamp and today (0 = logged today). */
export function getDaysSinceWeightLogged(
  loggedAt: string | Date | null | undefined
): number | null {
  const logged = toDate(loggedAt);
  if (!logged) return null;
  const from = new Date(logged.getFullYear(), logged.getMonth(), logged.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.max(0, Math.floor((today - from) / 86400000));
}

/** Compact chip text for the day grid, e.g. "29 Aug · 14:32". */
export function formatWeightLoggedShort(
  loggedAt: string | Date | null | undefined
): string | null {
  const logged = toDate(loggedAt);
  if (!logged) return null;
  const dateStr = logged.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const timeStr = logged.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  return `${dateStr} · ${timeStr}`;
}

/** Full coach label, e.g. "Logged 29 Aug 2026 at 14:32 · today". */
export function formatWeightLoggedLabel(
  loggedAt: string | Date | null | undefined
): string | null {
  const logged = toDate(loggedAt);
  if (!logged) return null;
  const dateStr = logged.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
  const timeStr = logged.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  const days = getDaysSinceWeightLogged(logged);
  const age =
    days == null
      ? ''
      : days === 0
      ? ' · today'
      : days === 1
      ? ' · yesterday'
      : ` · ${days} days ago`;
  return `Logged ${dateStr} at ${timeStr}${age}`;
}
