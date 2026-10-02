import type { Client } from '../types';

export type ClientPeriodProgress = {
  totalWeeks: number;
  currentWeek: number;
  /** 0–100 how far through the plan (week 4 of 8 → 50) */
  percentDone: number;
  /** 0–100 remaining before end (week 4 of 8 → 50) */
  percentLeft: number;
  weeksLeft: number;
};

function calendarWeekFromStart(start: Date, totalWeeks: number): number {
  const startMs = start.getTime();
  if (!Number.isFinite(startMs)) return 1;
  const elapsed = Date.now() - startMs;
  if (elapsed < 0) return 1;
  const week = Math.floor(elapsed / (7 * 24 * 60 * 60 * 1000)) + 1;
  return Math.min(totalWeeks, Math.max(1, week));
}

/** Plan length + current week for coach list progress bars. */
export function getClientPeriodProgress(client: Client): ClientPeriodProgress {
  const assignedWeeks = client.workoutAssignment?.weeks?.length || 0;
  const totalWeeks = Math.max(
    1,
    Number(client.numberOfWeeks) || 0,
    Number(client.workoutAssignment?.duration) || 0,
    assignedWeeks
  );

  let currentWeek = Number(client.workoutAssignment?.currentWeek) || 0;
  if (currentWeek < 1) {
    const start = client.workoutAssignment?.startDate
      ? new Date(client.workoutAssignment.startDate)
      : new Date(client.startDate);
    currentWeek = calendarWeekFromStart(start, totalWeeks);
  }
  currentWeek = Math.min(totalWeeks, Math.max(1, Math.floor(currentWeek)));

  const percentDone = Math.round((currentWeek / totalWeeks) * 100);
  const weeksLeft = Math.max(0, totalWeeks - currentWeek);
  const percentLeft = Math.round((weeksLeft / totalWeeks) * 100);

  return { totalWeeks, currentWeek, percentDone, percentLeft, weeksLeft };
}
