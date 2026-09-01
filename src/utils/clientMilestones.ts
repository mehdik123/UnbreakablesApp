import { getLatestDeployedWeekNumber } from './weekCreation';
import type { WeightEntry } from '../types';

export type MilestoneKind =
  | 'week_unlocked'
  | 'weight_streak_7'
  | 'first_workout_week'
  | 'halfway_program'
  | 'week_complete';

export interface ClientMilestone {
  kind: MilestoneKind;
  /** Stable id for localStorage de-dupe */
  id: string;
  week?: number;
  totalWeeks?: number;
  quoteIndex?: number;
  streakDays?: number;
}

/** Lower number = higher priority (one celebration per session). */
export const MILESTONE_PRIORITY: Record<MilestoneKind, number> = {
  week_unlocked: 1,
  week_complete: 2,
  weight_streak_7: 3,
  halfway_program: 4,
  first_workout_week: 5,
};

const STORAGE_PREFIX = 'ub_milestone_';

function storageKey(clientId: string, suffix: string): string {
  return `${STORAGE_PREFIX}${suffix}_${clientId}`;
}

export function hasMilestoneBeenSeen(clientId: string, milestoneId: string): boolean {
  try {
    return localStorage.getItem(`${STORAGE_PREFIX}seen_${clientId}_${milestoneId}`) === '1';
  } catch {
    return false;
  }
}

export function markMilestoneSeen(clientId: string, milestoneId: string): void {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}seen_${clientId}_${milestoneId}`, '1');
  } catch {
    /* ignore */
  }
}

export function getLastCelebratedUnlockWeek(clientId: string): number {
  try {
    const raw = localStorage.getItem(storageKey(clientId, 'week_unlock'));
    const n = Number(raw);
    return Number.isFinite(n) && n >= 1 ? n : 1;
  } catch {
    return 1;
  }
}

export function setLastCelebratedUnlockWeek(clientId: string, week: number): void {
  try {
    localStorage.setItem(storageKey(clientId, 'week_unlock'), String(week));
  } catch {
    /* ignore */
  }
}

export function pickHighestPriorityMilestone(candidates: ClientMilestone[]): ClientMilestone | null {
  if (!candidates.length) return null;
  return [...candidates].sort((a, b) => MILESTONE_PRIORITY[a.kind] - MILESTONE_PRIORITY[b.kind])[0];
}

export function filterUnseenMilestones(clientId: string, candidates: ClientMilestone[]): ClientMilestone[] {
  return candidates.filter((m) => !hasMilestoneBeenSeen(clientId, m.id));
}

/** Week has at least one exercise and every set is complete (or exercise marked done). */
export function isWeekWorkoutComplete(
  week: { days?: any[]; isCompleted?: boolean } | null | undefined,
  completedExerciseIds?: Record<string, boolean>
): boolean {
  if (week?.isCompleted === true) return true;

  const days = week?.days;
  if (!Array.isArray(days) || days.length === 0) return false;

  let exerciseCount = 0;
  for (const day of days) {
    for (const ex of day.exercises || []) {
      if (!ex.id) continue;
      const sets = ex.sets || [];
      if (sets.length === 0) return false;
      exerciseCount += 1;
      const setsDone = sets.every((s: { completed?: boolean }) => s.completed === true);
      const checkboxDone = completedExerciseIds?.[ex.id] === true;
      if (!setsDone && !checkboxDone) return false;
    }
  }
  return exerciseCount > 0;
}

export function detectWeekUnlockedMilestone(
  clientId: string,
  assignment: { weeks?: any[]; currentWeek?: number } | null | undefined
): ClientMilestone | null {
  const weeks = Array.isArray(assignment?.weeks) ? assignment!.weeks! : [];
  const latest = getLatestDeployedWeekNumber(assignment);
  const lastCelebrated = getLastCelebratedUnlockWeek(clientId);

  if (latest <= lastCelebrated) return null;

  const weekData = weeks.find((w: any) => w.weekNumber === latest);
  const hasDays = Array.isArray(weekData?.days) && weekData.days.length > 0;
  const isUnlocked =
    weekData?.isUnlocked === true || weekData?.deployedAt != null || latest === 1;

  if (!hasDays || !isUnlocked) return null;
  // Week 1 is the default starting point — only celebrate newly deployed weeks after that.
  if (latest <= 1 && lastCelebrated >= 1) return null;

  const id = `week_unlocked_${latest}`;
  if (hasMilestoneBeenSeen(clientId, id)) return null;

  return {
    kind: 'week_unlocked',
    id,
    week: latest,
    quoteIndex: (latest - 1) % 6,
  };
}

export function detectHalfwayMilestone(
  clientId: string,
  assignment: { weeks?: any[] } | null | undefined,
  totalWeeks: number
): ClientMilestone | null {
  const id = 'halfway_program';
  if (hasMilestoneBeenSeen(clientId, id)) return null;

  const safeTotal = Math.max(1, totalWeeks || 12);
  const halfway = Math.ceil(safeTotal / 2);
  const weeks = Array.isArray(assignment?.weeks) ? assignment!.weeks! : [];
  const deployed = getLatestDeployedWeekNumber(assignment);
  const completedWeeks = weeks.filter((w: any) => w.isCompleted === true).length;

  if (deployed < halfway && completedWeeks < halfway) return null;

  return {
    kind: 'halfway_program',
    id,
    week: halfway,
    totalWeeks: safeTotal,
  };
}

export function detectWeekCompleteMilestone(
  clientId: string,
  assignment: { weeks?: any[] } | null | undefined,
  weekNumber: number,
  completedExerciseIds?: Record<string, boolean>
): ClientMilestone | null {
  const id = `week_complete_${weekNumber}`;
  if (hasMilestoneBeenSeen(clientId, id)) return null;

  const weekData = assignment?.weeks?.find((w: any) => w.weekNumber === weekNumber);
  if (!weekData) return null;
  if (isWeekWorkoutComplete(weekData, completedExerciseIds)) {
    return { kind: 'week_complete', id, week: weekNumber };
  }
  return null;
}

export function detectFirstWorkoutWeekMilestone(
  clientId: string,
  weekNumber: number
): ClientMilestone | null {
  const id = `first_workout_week_${weekNumber}`;
  if (hasMilestoneBeenSeen(clientId, id)) return null;
  return { kind: 'first_workout_week', id, week: weekNumber };
}

function parseLogDate(entry: WeightEntry | { date: Date | string }): Date {
  const d = entry.date;
  return d instanceof Date ? d : new Date(d);
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Longest streak ending on the most recent log date. */
export function getWeightLogStreakDays(logs: WeightEntry[]): number {
  if (!logs.length) return 0;

  const uniqueDates = [...new Set(logs.map((l) => formatDateKey(parseLogDate(l))))].sort();
  if (!uniqueDates.length) return 0;

  let streak = 1;
  for (let i = uniqueDates.length - 1; i > 0; i -= 1) {
    const curr = new Date(`${uniqueDates[i]}T12:00:00`);
    const prev = new Date(`${uniqueDates[i - 1]}T12:00:00`);
    const diffDays = Math.round((curr.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      streak += 1;
    } else {
      break;
    }
  }
  return streak;
}

export function detectWeightStreakMilestone(
  clientId: string,
  logs: WeightEntry[],
  minDays = 7
): ClientMilestone | null {
  const streak = getWeightLogStreakDays(logs);
  if (streak < minDays) return null;

  const sorted = [...logs].sort(
    (a, b) => parseLogDate(b).getTime() - parseLogDate(a).getTime()
  );
  const endKey = formatDateKey(parseLogDate(sorted[0]));
  const id = `weight_streak_${minDays}_${endKey}`;
  if (hasMilestoneBeenSeen(clientId, id)) return null;

  return {
    kind: 'weight_streak_7',
    id,
    streakDays: minDays,
  };
}

export function persistMilestoneSeen(clientId: string, milestone: ClientMilestone): void {
  markMilestoneSeen(clientId, milestone.id);
  if (milestone.kind === 'week_unlocked' && milestone.week != null) {
    setLastCelebratedUnlockWeek(clientId, milestone.week);
  }
}
