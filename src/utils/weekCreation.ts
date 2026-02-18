import {
  ClientWorkoutAssignment,
  WorkoutWeek,
  WorkoutProgram,
  WorkoutDay,
  WorkoutExercise,
  WorkoutSet,
} from '../types';

/**
 * Deep copy a week's data and reset completion state.
 * Used when creating the next week from previous week's actual performance.
 * Generates new IDs for exercises/sets to avoid collisions.
 */
function ensureWeekId(id: string | undefined, suffix: string): string {
  if (!id) return suffix;
  if (/-week-\d+/.test(id)) return id.replace(/-week-\d+/, `-week-${suffix}`);
  return `${id}-week-${suffix}`;
}

export function copyWeekData(
  sourceWeek: WorkoutWeek,
  newWeekNumber: number
): WorkoutWeek {
  const weekSuffix = newWeekNumber.toString();
  const newDays: WorkoutDay[] = (sourceWeek.days || []).map((day, dayIndex) => ({
    id: ensureWeekId(day.id, weekSuffix) || `day-${dayIndex}-week-${weekSuffix}`,
    name: day.name,
    exercises: (day.exercises || []).map((ex, exIndex) => ({
      ...ex,
      id: ensureWeekId(ex.id, weekSuffix) || `ex-${dayIndex}-${exIndex}-week-${weekSuffix}`,
      sets: (ex.sets || []).map((set, setIndex) => ({
        ...set,
        id: ensureWeekId(set.id, weekSuffix) || `set-${dayIndex}-${exIndex}-${setIndex}-week-${weekSuffix}`,
        completed: false,
        completedAt: undefined,
      } as WorkoutSet)),
    })),
  }));

  return {
    weekNumber: newWeekNumber,
    isUnlocked: false, // Coach will set true when deploying
    isCompleted: false,
    exercises: [], // Legacy; days carry the structure
    progressionNotes: undefined,
    completedAt: undefined,
    startDate: undefined,
    deployedAt: undefined,
    days: newDays,
  };
}

/**
 * Create only Week 1 from a program (no formula-based future weeks).
 * Used when initially assigning a program to a client.
 */
export function createInitialWeek(program: WorkoutProgram): WorkoutWeek {
  if (!program.days || program.days.length === 0) {
    return {
      weekNumber: 1,
      isUnlocked: true,
      isCompleted: false,
      exercises: [],
      days: [],
      startDate: new Date(),
    };
  }

  const days: WorkoutDay[] = program.days.map((day, dayIndex) => ({
    id: day.id,
    name: day.name,
    exercises: day.exercises.map((exercise, exerciseIndex) => ({
      ...exercise,
      id: `${exercise.exercise?.id || exercise.id}-day-${dayIndex}-week-1-exercise-${exerciseIndex}`,
      sets: exercise.sets.map((set, setIndex) => ({
        ...set,
        id: `${exercise.exercise?.id || exercise.id}-day-${dayIndex}-week-1-exercise-${exerciseIndex}-set-${setIndex}`,
        completed: false,
        completedAt: undefined,
      })),
    })),
  }));

  return {
    weekNumber: 1,
    isUnlocked: true,
    isCompleted: false,
    exercises: [],
    days,
    startDate: new Date(),
  };
}

/**
 * Create the next week by copying the previous week's actual performance.
 * Completion flags are reset (new week starts fresh).
 */
export function createNextWeekFromActuals(
  previousWeek: WorkoutWeek,
  weekNumber: number
): WorkoutWeek {
  return copyWeekData(previousWeek, weekNumber);
}

/**
 * Get the next week number (sequential, no gaps).
 */
export function getNextWeekNumber(assignment: ClientWorkoutAssignment): number {
  const weeks = assignment.weeks || [];
  if (weeks.length === 0) return 1;
  const max = Math.max(...weeks.map((w) => w.weekNumber));
  return max + 1;
}

/**
 * Check if the coach can create the next week.
 * Coach can create next week at any time (does not require previous week to be completed).
 */
export function canCreateNextWeek(
  assignment: ClientWorkoutAssignment | null | undefined
): boolean {
  if (!assignment) return false;
  const weeks = assignment.weeks || [];
  const nextNumber = getNextWeekNumber(assignment);
  return nextNumber <= assignment.duration;
}

/**
 * Return the assignment with the new week appended to weeks[].
 * Caller is responsible for persisting (e.g. dbUpdateWorkoutAssignment).
 */
export function addWeekToAssignment(
  assignment: ClientWorkoutAssignment,
  newWeek: WorkoutWeek
): ClientWorkoutAssignment {
  const existing = assignment.weeks || [];
  return {
    ...assignment,
    weeks: [...existing, newWeek],
    lastModifiedBy: 'coach',
    lastModifiedAt: new Date(),
  };
}

/**
 * Mark a week as deployed (visible to client).
 * Sets isUnlocked: true and deployedAt timestamp.
 */
export function markWeekAsDeployed(week: WorkoutWeek): WorkoutWeek {
  return {
    ...week,
    isUnlocked: true,
    deployedAt: new Date().toISOString(),
    startDate: new Date().toISOString(),
  };
}
