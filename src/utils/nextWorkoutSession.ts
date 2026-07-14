/**
 * Resolve the next workout session for the client home "Start session" card.
 *
 * A day counts as done only when Save my numbers (client) set `numbersSaved: true`
 * on that day. Coach-prescribed weights on a new week do NOT count.
 *
 * Next session = first day (in order) that still needs a save. If every training
 * day in a week is saved → Day 1 of the next prepared week.
 */

export type NextWorkoutSession = {
  week: number;
  /** 0-based day index within that week's days array */
  dayIndex: number;
  /** 1-based day number for display */
  dayNumber: number;
  dayName?: string;
  exerciseCount: number;
  daysInWeek: number;
};

export type AssignmentSessionMeta = {
  current_week?: number;
  current_day?: number;
  last_modified_by?: string;
};

function getDaysForWeek(assignment: any, weekNumber: number): any[] {
  const weeks = Array.isArray(assignment?.weeks) ? assignment.weeks : [];
  const weekData = weeks.find((w: any) => w.weekNumber === weekNumber);
  if (Array.isArray(weekData?.days) && weekData.days.length > 0) {
    return weekData.days;
  }
  // Only fall back to program.days for week 1 shape when that week row has no days yet
  if (weekNumber === 1) {
    const programDays = assignment?.program?.days;
    if (Array.isArray(programDays) && programDays.length > 0) {
      return programDays;
    }
  }
  return [];
}

function isTrainingDay(day: any): boolean {
  return Array.isArray(day?.exercises) && day.exercises.length > 0;
}

function isDayNumbersSaved(day: any): boolean {
  return day?.numbersSaved === true || day?.numbers_saved === true;
}

function weekHasAnyNumbersSaved(days: any[]): boolean {
  return days.some((d) => isDayNumbersSaved(d));
}

function assignmentHasAnyNumbersSaved(assignment: any): boolean {
  const weeks = Array.isArray(assignment?.weeks) ? assignment.weeks : [];
  for (const w of weeks) {
    if (Array.isArray(w?.days) && weekHasAnyNumbersSaved(w.days)) return true;
  }
  if (Array.isArray(assignment?.program?.days) && weekHasAnyNumbersSaved(assignment.program.days)) {
    return true;
  }
  return false;
}

function sessionFromDay(
  week: number,
  dayIndex: number,
  days: any[]
): NextWorkoutSession {
  const day = days[dayIndex] || days[0];
  return {
    week,
    dayIndex,
    dayNumber: dayIndex + 1,
    dayName: day?.name,
    exerciseCount: day?.exercises?.length || 0,
    daysInWeek: days.length,
  };
}

/** Legacy pointer: day after lastSavedDay (used only when no numbersSaved flags exist yet). */
function resolveLegacyNext(
  assignment: any,
  maxW: number,
  dbMeta?: AssignmentSessionMeta
): NextWorkoutSession | null {
  const columnWeek = Math.max(
    1,
    Number(dbMeta?.current_week ?? assignment?.currentWeek ?? assignment?.current_week ?? 1) || 1
  );
  const columnDay = Number(dbMeta?.current_day ?? assignment?.currentDay ?? assignment?.current_day ?? 0);
  const explicitDay = assignment?.lastSavedDay ?? assignment?.last_saved_day;
  const lastModifiedBy =
    assignment?.lastModifiedBy ?? assignment?.last_modified_by ?? dbMeta?.last_modified_by;

  let lastSavedDay = 0;
  let week = columnWeek;
  if (explicitDay != null && Number.isFinite(Number(explicitDay))) {
    lastSavedDay = Math.max(0, Number(explicitDay));
    week = Math.max(
      1,
      Number(assignment?.lastSavedWeek ?? assignment?.last_saved_week ?? columnWeek) || columnWeek
    );
  } else if (lastModifiedBy === 'client' && columnDay > 0) {
    lastSavedDay = columnDay;
  }

  week = Math.min(maxW, Math.max(1, week));
  let days = getDaysForWeek(assignment, week);
  if (days.length === 0) {
    const weeks = Array.isArray(assignment?.weeks) ? assignment.weeks : [];
    const withDays = weeks.find((w: any) => Array.isArray(w?.days) && w.days.length > 0);
    if (withDays) {
      week = withDays.weekNumber;
      days = withDays.days;
    }
  }
  if (days.length === 0) return null;

  if (lastSavedDay <= 0) {
    const firstIdx = days.findIndex(isTrainingDay);
    return sessionFromDay(week, firstIdx >= 0 ? firstIdx : 0, days);
  }

  if (lastSavedDay >= days.length) {
    let candidate = week + 1;
    while (candidate <= maxW) {
      const nextDays = getDaysForWeek(assignment, candidate);
      if (nextDays.length > 0) {
        const firstIdx = nextDays.findIndex(isTrainingDay);
        return sessionFromDay(candidate, firstIdx >= 0 ? firstIdx : 0, nextDays);
      }
      candidate += 1;
    }
    return sessionFromDay(week, Math.max(0, days.length - 1), days);
  }

  return sessionFromDay(week, lastSavedDay, days);
}

export function getNextWorkoutSession(
  assignment: any,
  maxWeeks: number,
  dbMeta?: AssignmentSessionMeta
): NextWorkoutSession | null {
  if (!assignment) return null;

  const maxW = Math.max(1, maxWeeks || assignment?.duration || 12);
  const weeks = Array.isArray(assignment?.weeks) ? assignment.weeks : [];

  // Prefer explicit per-day save flags (handles out-of-order logging)
  if (assignmentHasAnyNumbersSaved(assignment)) {
    const weekNumbers = [
      ...new Set(
        [
          ...weeks.map((w: any) => Number(w?.weekNumber)).filter((n: number) => n >= 1 && n <= maxW),
          1,
        ].sort((a, b) => a - b)
      ),
    ];

    // Also consider weeks that exist only as prepared rows in range 1..maxW
    for (let w = 1; w <= maxW; w++) {
      if (!weekNumbers.includes(w) && getDaysForWeek(assignment, w).length > 0) {
        weekNumbers.push(w);
      }
    }
    weekNumbers.sort((a, b) => a - b);

    let lastPrepared: NextWorkoutSession | null = null;

    for (const weekNum of weekNumbers) {
      const weekRow = weeks.find((w: any) => w.weekNumber === weekNum);
      const days = getDaysForWeek(assignment, weekNum);
      if (days.length === 0) continue;

      lastPrepared = sessionFromDay(weekNum, Math.max(0, days.length - 1), days);

      // Coach-marked week complete → skip to next week
      if (weekRow?.isCompleted === true) continue;

      const trainingIndexes = days
        .map((d, i) => (isTrainingDay(d) ? i : -1))
        .filter((i) => i >= 0);

      if (trainingIndexes.length === 0) continue;

      const pendingIdx = trainingIndexes.find((i) => !isDayNumbersSaved(days[i]));
      if (pendingIdx != null) {
        return sessionFromDay(weekNum, pendingIdx, days);
      }
      // All training days saved → try next week
    }

    return lastPrepared;
  }

  return resolveLegacyNext(assignment, maxW, dbMeta);
}
