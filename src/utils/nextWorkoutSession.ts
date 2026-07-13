/**
 * Resolve the next workout session for the client home "Start session" card.
 *
 * Last saved day = day where "Save my numbers" (client) or coach assignment save
 * last wrote numbers. Stored as 1-based `lastSavedDay` / DB `current_day`.
 *
 * Next session = the day after that. If it was the last day of the week → Day 1
 * of the next week that has days. If nothing has been saved yet → Day 1 of current week.
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
  const programDays = assignment?.program?.days;
  if (Array.isArray(programDays) && programDays.length > 0) {
    return programDays;
  }
  return [];
}

function resolveLastSaved(
  assignment: any,
  dbMeta?: AssignmentSessionMeta
): { week: number; lastSavedDay: number } {
  const columnWeek = Math.max(
    1,
    Number(dbMeta?.current_week ?? assignment?.currentWeek ?? assignment?.current_week ?? 1) || 1
  );
  const columnDay = Number(dbMeta?.current_day ?? assignment?.currentDay ?? assignment?.current_day ?? 0);

  const explicitDay = assignment?.lastSavedDay ?? assignment?.last_saved_day;
  if (explicitDay != null && Number.isFinite(Number(explicitDay))) {
    return {
      week: Math.max(
        1,
        Number(assignment?.lastSavedWeek ?? assignment?.last_saved_week ?? columnWeek) || columnWeek
      ),
      lastSavedDay: Math.max(0, Number(explicitDay)),
    };
  }

  const lastModifiedBy =
    assignment?.lastModifiedBy ?? assignment?.last_modified_by ?? dbMeta?.last_modified_by;

  // current_day defaults to 1 on new assignments — only treat it as a real save
  // once the client has saved numbers (or lastSavedDay was set by coach/client).
  if (lastModifiedBy === 'client' && columnDay > 0) {
    return { week: columnWeek, lastSavedDay: columnDay };
  }

  return { week: columnWeek, lastSavedDay: 0 };
}

export function getNextWorkoutSession(
  assignment: any,
  maxWeeks: number,
  dbMeta?: AssignmentSessionMeta
): NextWorkoutSession | null {
  if (!assignment) return null;

  const maxW = Math.max(1, maxWeeks || assignment?.duration || 12);
  const { week: savedWeek, lastSavedDay } = resolveLastSaved(assignment, dbMeta);
  let week = Math.min(maxW, Math.max(1, savedWeek));

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

  let nextWeek = week;
  let nextDayIndex = 0;

  if (lastSavedDay > 0) {
    if (lastSavedDay >= days.length) {
      let candidate = week + 1;
      let rolled = false;
      while (candidate <= maxW) {
        const nextDays = getDaysForWeek(assignment, candidate);
        if (nextDays.length > 0) {
          nextWeek = candidate;
          days = nextDays;
          nextDayIndex = 0;
          rolled = true;
          break;
        }
        candidate += 1;
      }
      if (!rolled) {
        nextWeek = week;
        nextDayIndex = Math.max(0, days.length - 1);
      }
    } else {
      nextDayIndex = lastSavedDay; // 1-based last saved → 0-based next index
    }
  }

  const day = days[nextDayIndex] || days[0];
  return {
    week: nextWeek,
    dayIndex: nextDayIndex,
    dayNumber: nextDayIndex + 1,
    dayName: day?.name,
    exerciseCount: day?.exercises?.length || 0,
    daysInWeek: days.length,
  };
}
