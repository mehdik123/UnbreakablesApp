import { WorkoutWeek, WorkoutExercise, WorkoutSet } from '../types';

/**
 * Auto-Progression Logic — Weekly Update
 *
 * Computes next week's prescription from this week's actual performance.
 * Pure functions only: the coach reviews/edits the output before it is saved.
 *
 * Each set progresses independently (ramp-up / lighter first sets are preserved).
 * Dropsets (array reps/weight) are passed through unchanged.
 *
 * Weights in the plan are always stored in kilograms. Client/coach lbs preference
 * is display-only: convert to kg before progression, show results back in lbs.
 */

export type EquipmentType = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight';

const STANDARD_REP_CAP = 12;
const STANDARD_RESET_REPS = 8;
const BODYWEIGHT_REP_CAP = 14;
const BODYWEIGHT_RESET_REPS = 8;
const REP_INCREMENT = 2;

const EQUIPMENT_INCREMENT: Record<EquipmentType, number> = {
  barbell: 5,
  dumbbell: 2,
  machine: 5,
  cable: 5,
  bodyweight: 0,
};

/**
 * Bodyweight exercises that become weighted once reps reach the cap.
 * Keys are normalized names (lowercase, letters only, singular).
 */
const WEIGHTED_BODYWEIGHT_INCREMENT: Record<string, number> = {
  pullup: 2.5,
  chinup: 2.5,
  dip: 5,
  pushup: 5,
  jumpsquat: 2.5,
  jumplunge: 2.5,
};

/** Normalize an exercise name: lowercase, letters only, drop trailing plural "s". */
function normalizeName(name: string | undefined): string {
  return (name || '')
    .toLowerCase()
    .replace(/[^a-z]/g, '')
    .replace(/s$/, '');
}

/** Map free-text equipment (e.g. "Cable Machine", "Dumbbells") to a category. */
export function classifyEquipment(equipment: string | undefined): EquipmentType {
  const e = (equipment || '').toLowerCase();
  if (e.includes('dumbbell')) return 'dumbbell';
  if (e.includes('barbell')) return 'barbell';
  if (e.includes('cable')) return 'cable';
  if (e.includes('machine')) return 'machine';
  if (e.includes('body') || e.includes('pull-up bar') || e.includes('pull up bar')) {
    return 'bodyweight';
  }
  return 'machine'; // sensible default: +5kg increment
}

/** Standard weight increment (kg) for a weighted exercise, by equipment. */
export function getStandardIncrement(equipment: string | undefined): number {
  return EQUIPMENT_INCREMENT[classifyEquipment(equipment)] || 5;
}

/** True for bodyweight moves that gain load at the cap (pull-ups, dips, etc.). */
export function isWeightedBodyweightExercise(name: string | undefined): boolean {
  return normalizeName(name) in WEIGHTED_BODYWEIGHT_INCREMENT;
}

function getWeightedBodyweightIncrement(name: string | undefined): number {
  return WEIGHTED_BODYWEIGHT_INCREMENT[normalizeName(name)] ?? 2.5;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

function isPlainNumberSet(set: WorkoutSet): boolean {
  return (
    !set.isDropset &&
    typeof set.reps === 'number' &&
    typeof set.weight === 'number'
  );
}

interface Prescription {
  reps: number;
  weight: number;
}

/**
 * Progress one set on its own values.
 * Example: 6@10 → 8@10, 6@22.5 → 8@22.5 (does NOT flatten all sets to the heaviest).
 */
function computeSetProgression(
  reps: number,
  weight: number,
  exercise: WorkoutExercise
): Prescription {
  const name = exercise.exercise?.name;
  const weightedBodyweight = isWeightedBodyweightExercise(name);

  // Weighted-bodyweight moves always use the bodyweight cap (14), even once loaded.
  if (weightedBodyweight) {
    const candidateReps = reps + REP_INCREMENT;
    if (candidateReps >= BODYWEIGHT_REP_CAP) {
      return {
        reps: BODYWEIGHT_RESET_REPS,
        weight: roundToHalf(weight + getWeightedBodyweightIncrement(name)),
      };
    }
    return { reps: candidateReps, weight };
  }

  // Pure bodyweight (weight 0, not a weighted-bodyweight name) → reps only, forever.
  if (weight === 0) {
    return { reps: reps + REP_INCREMENT, weight: 0 };
  }

  // Standard exercises (weight > 0): +2 reps until cap, then reset reps and add load.
  if (reps < STANDARD_REP_CAP) {
    return { reps: reps + REP_INCREMENT, weight };
  }
  return {
    reps: STANDARD_RESET_REPS,
    weight: roundToHalf(weight + getStandardIncrement(exercise.exercise?.equipment)),
  };
}

/** Progress a single exercise. Returns a new exercise with updated sets. */
export function progressExercise(exercise: WorkoutExercise): WorkoutExercise {
  const sets = exercise.sets || [];
  if (sets.length === 0) return exercise;
  if (!sets.every(isPlainNumberSet)) return exercise; // dropsets: leave unchanged

  const newSets = sets.map((set) => {
    const prescription = computeSetProgression(
      set.reps as number,
      set.weight as number,
      exercise
    );
    return {
      ...set,
      reps: prescription.reps,
      weight: prescription.weight,
      completed: false,
      completedAt: undefined,
    };
  });

  return { ...exercise, sets: newSets };
}

/** Deload a single exercise. No progression: reduce/strip load, keep reps. */
export function deloadExercise(exercise: WorkoutExercise): WorkoutExercise {
  const sets = exercise.sets || [];
  if (sets.length === 0) return exercise;
  if (!sets.every(isPlainNumberSet)) return exercise;

  const weightedBodyweight = isWeightedBodyweightExercise(exercise.exercise?.name);

  const newSets = sets.map((set) => {
    const weight = set.weight as number;
    let newWeight = weight;
    if (weight === 0) {
      newWeight = 0; // pure bodyweight: unchanged
    } else if (weightedBodyweight) {
      newWeight = 0; // weighted bodyweight: remove the added load
    } else {
      newWeight = roundToHalf(weight / 2); // standard: halve the load
    }
    return { ...set, weight: newWeight, completed: false, completedAt: undefined };
  });

  return { ...exercise, sets: newSets };
}

function transformWeekExercises(
  week: WorkoutWeek,
  transform: (ex: WorkoutExercise) => WorkoutExercise
): WorkoutWeek {
  const days = (week.days || []).map((day) => ({
    ...day,
    exercises: (day.exercises || []).map(transform),
  }));
  return { ...week, days };
}

/**
 * Apply auto-progression to an entire week (operates on the week's actuals).
 * Caller should pass a fresh copy of the previous week (e.g. from
 * createNextWeekFromActuals) so original data is not mutated.
 */
export function applyAutoProgression(week: WorkoutWeek): WorkoutWeek {
  return transformWeekExercises(
    { ...week, progressionNotes: 'Auto-progression from previous week' },
    progressExercise
  );
}

/** Apply a deload week (manual coach trigger). */
export function applyDeload(week: WorkoutWeek): WorkoutWeek {
  return transformWeekExercises(
    { ...week, progressionNotes: 'Deload week' },
    deloadExercise
  );
}
