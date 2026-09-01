import type { WeightEntry } from '../types';
import { getDaysSinceWeightLogged } from './weightLogDate';

export type WeightReminderVariant = 'never' | 'this_week' | 'stale';

export interface WeightReminderResult {
  show: boolean;
  variant: WeightReminderVariant | null;
  week: number;
}

const DAY_KEYS = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'] as const;
const MIN_HOME_VISITS_NEVER_LOGGED = 2;
const STALE_LOG_DAYS = 7;

function todayKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function bumpClientHomeVisits(clientId: string): number {
  const key = `ub_home_visits_${clientId}`;
  try {
    const next = Number(localStorage.getItem(key) || '0') + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return 1;
  }
}

export function getClientHomeVisits(clientId: string): number {
  try {
    return Number(localStorage.getItem(`ub_home_visits_${clientId}`) || '0') || 0;
  } catch {
    return 0;
  }
}

export function wasWeightReminderDismissedToday(clientId: string): boolean {
  try {
    return localStorage.getItem(`ub_weight_remind_dismiss_${clientId}`) === todayKey();
  } catch {
    return false;
  }
}

export function dismissWeightReminderForToday(clientId: string): void {
  try {
    localStorage.setItem(`ub_weight_remind_dismiss_${clientId}`, todayKey());
  } catch {
    /* ignore */
  }
}

/** Map DB weight logs onto training week + day slots (same rules as the weight logger). */
export function mapWeightLogsToTrainingWeeks(
  logs: WeightEntry[],
  startDate: Date | string | null | undefined,
  maxWeeks: number
): Record<number, Record<string, WeightEntry>> {
  const organized: Record<number, Record<string, WeightEntry>> = {};
  const safeMax = Math.max(1, maxWeeks || 12);
  const parsedStart = startDate ? new Date(startDate) : null;

  if (parsedStart && !Number.isNaN(parsedStart.getTime())) {
    logs.forEach((entry) => {
      const date = entry.date instanceof Date ? entry.date : new Date(entry.date);
      const startMs = new Date(
        parsedStart.getFullYear(),
        parsedStart.getMonth(),
        parsedStart.getDate()
      ).getTime();
      const dateMs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const daysSinceStart = Math.floor((dateMs - startMs) / (1000 * 60 * 60 * 24));
      const weekIndex = Math.floor(daysSinceStart / 7);
      const dayIndex = ((daysSinceStart % 7) + 7) % 7;
      const weekNumber = Math.min(safeMax, Math.max(1, weekIndex + 1));
      const dayKey = DAY_KEYS[dayIndex];
      if (!organized[weekNumber]) organized[weekNumber] = {};
      organized[weekNumber][dayKey] = entry;
    });
    return organized;
  }

  const sorted = [...logs].sort((a, b) => {
    const ad = a.date instanceof Date ? a.date : new Date(a.date);
    const bd = b.date instanceof Date ? b.date : new Date(b.date);
    return ad.getTime() - bd.getTime();
  });

  sorted.forEach((entry, i) => {
    const weekNumber = Math.min(safeMax, Math.floor(i / 7) + 1);
    const dayKey = DAY_KEYS[i % 7];
    if (!organized[weekNumber]) organized[weekNumber] = {};
    organized[weekNumber][dayKey] = entry;
  });

  return organized;
}

export function hasLogForTrainingWeek(
  organized: Record<number, Record<string, WeightEntry>>,
  weekNumber: number
): boolean {
  const week = organized[weekNumber];
  if (!week) return false;
  return Object.values(week).some((entry) => entry && entry.weight > 0);
}

export function getLastLoggedTrainingWeek(
  organized: Record<number, Record<string, WeightEntry>>
): number {
  let max = 0;
  for (const [weekStr, days] of Object.entries(organized)) {
    const week = Number(weekStr);
    if (!Number.isFinite(week)) continue;
    if (Object.values(days).some((entry) => entry && entry.weight > 0)) {
      max = Math.max(max, week);
    }
  }
  return max;
}

export function getDaysSinceLastWeightLog(logs: WeightEntry[]): number | null {
  if (!logs.length) return null;

  const sorted = [...logs].sort((a, b) => {
    const aAt = (a.loggedAt ?? a.date) as Date;
    const bAt = (b.loggedAt ?? b.date) as Date;
    return new Date(aAt).getTime() - new Date(bAt).getTime();
  });

  const latest = sorted[sorted.length - 1];
  return getDaysSinceWeightLogged(latest.loggedAt ?? latest.date);
}

export function evaluateWeightReminder(input: {
  clientId: string;
  logs: WeightEntry[];
  currentWeek: number;
  startDate?: Date | string | null;
  maxWeeks: number;
  visitCount: number;
  dismissedToday?: boolean;
  suppressedThisSession?: boolean;
}): WeightReminderResult {
  const week = Math.max(1, input.currentWeek || 1);
  const empty: WeightReminderResult = { show: false, variant: null, week };

  if (input.suppressedThisSession || input.dismissedToday) return empty;

  const organized = mapWeightLogsToTrainingWeeks(
    input.logs,
    input.startDate,
    input.maxWeeks
  );

  if (hasLogForTrainingWeek(organized, week)) return empty;

  const neverLogged = input.logs.length === 0;
  if (neverLogged) {
    if (input.visitCount < MIN_HOME_VISITS_NEVER_LOGGED) return empty;
    return { show: true, variant: 'never', week };
  }

  const daysSince = getDaysSinceLastWeightLog(input.logs);
  if (daysSince != null && daysSince >= STALE_LOG_DAYS) {
    return { show: true, variant: 'stale', week };
  }

  const lastLoggedWeek = getLastLoggedTrainingWeek(organized);
  if (week > lastLoggedWeek) {
    return { show: true, variant: 'this_week', week };
  }

  return empty;
}
