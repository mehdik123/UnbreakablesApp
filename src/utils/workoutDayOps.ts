import { WorkoutDay, WorkoutExercise, WorkoutSet } from '../types';

const uid = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

function resetWeight(weight: number | number[] | undefined): number | number[] {
  if (Array.isArray(weight)) return weight.map(() => 0);
  return 0;
}

function cloneSet(set: WorkoutSet, zeroWeights: boolean): WorkoutSet {
  const weight = zeroWeights ? resetWeight(set.weight) : set.weight;
  return {
    ...set,
    id: uid('set'),
    completed: false,
    completedAt: undefined,
    weight: Array.isArray(weight) ? [...weight] : weight,
    reps: Array.isArray(set.reps) ? [...set.reps] : set.reps,
  };
}

function cloneExercise(ex: WorkoutExercise, zeroWeights: boolean, order: number): WorkoutExercise {
  return {
    ...ex,
    id: uid('ex'),
    order,
    sets: (ex.sets || []).map((s) => cloneSet(s, zeroWeights)),
  };
}

/** Empty day for coach to fill with exercises. */
export function createBlankWorkoutDay(dayNumber: number, name?: string): WorkoutDay {
  return {
    id: uid('day'),
    name: name?.trim() || `Day ${dayNumber}`,
    exercises: [],
  };
}

/**
 * Deep-clone a day with fresh IDs so it is safe to append to an assigned week.
 * @param zeroWeights — if true, all set weights become 0 (reps/rest/structure kept).
 */
export function duplicateWorkoutDay(
  source: WorkoutDay,
  options: { zeroWeights: boolean; dayNumber: number; name?: string }
): WorkoutDay {
  const exercises = (source.exercises || []).map((ex, i) =>
    cloneExercise(ex, options.zeroWeights, i + 1)
  );
  return {
    id: uid('day'),
    name: options.name?.trim() || `${source.name || `Day ${options.dayNumber}`} (copy)`,
    exercises,
  };
}

/** Append an exercise to a day (assigned-program editor). */
export function buildNewWorkoutExercise(
  exercise: WorkoutExercise['exercise'],
  order: number
): WorkoutExercise {
  return {
    id: uid('ex'),
    exercise,
    sets: [
      {
        id: uid('set'),
        reps: 8,
        weight: 0,
        isDropset: false,
        completed: false,
        restPeriod: 120,
      },
    ],
    rest: '120 seconds',
    restPeriod: 120,
    notes: '',
    order,
  };
}
