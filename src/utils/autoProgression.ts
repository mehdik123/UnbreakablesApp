import { WorkoutWeek, WorkoutExercise, WorkoutSet } from '../types';

/**
 * Auto-Progression Logic — Weekly Update
 *
 * Computes next week's prescription from this week's actual performance.
 * Pure functions only: the coach reviews/edits the output before it is saved.
 *
 * Regular sets:
 *  1. Unify to the heaviest set (tie → more reps). Mixed warm-up / working
 *     loads become that working prescription for every set.
 *  2. Add +2 reps (or cap → reset 8 + load) ONLY when every set already had
 *     the same reps AND the same weight. Otherwise unify only — no extra reps.
 *
 * Dropsets: each drop progresses on its own (+2 / cap / load).
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

function isDropsetArray(set: WorkoutSet): boolean {
  return (
    set.isDropset === true &&
    Array.isArray(set.reps) &&
    Array.isArray(set.weight) &&
    set.reps.length > 0 &&
    set.reps.length === set.weight.length &&
    set.reps.every((r) => typeof r === 'number') &&
    set.weight.every((w) => typeof w === 'number')
  );
}

interface Prescription {
  reps: number;
  weight: number;
}

interface UnifiedTarget {
  reps: number;
  weight: number;
  /** True when every set already had the same reps and weight. */
  allIdentical: boolean;
}

/**
 * Unify regular sets to the heaviest (tie → more reps).
 * Mixed 6@10 / 6@22.5 → 6@22.5 for all.
 */
function unifySets(sets: WorkoutSet[]): UnifiedTarget {
  let best = { reps: sets[0].reps as number, weight: sets[0].weight as number };
  let allIdentical = true;

  for (const set of sets) {
    const reps = set.reps as number;
    const weight = set.weight as number;
    if (reps !== best.reps || weight !== best.weight) allIdentical = false;
    if (weight > best.weight || (weight === best.weight && reps > best.reps)) {
      best = { reps, weight };
    }
  }

  return { reps: best.reps, weight: best.weight, allIdentical };
}

/**
 * Next (reps, weight) for one prescription.
 * `allowRepBump` is false when sets were mixed — unify only, no +2.
 */
function computeProgression(
  reps: number,
  weight: number,
  exercise: WorkoutExercise,
  allowRepBump: boolean
): Prescription {
  const name = exercise.exercise?.name;
  const weightedBodyweight = isWeightedBodyweightExercise(name);

  // Mixed sets: copy the unified target only. Never bump reps or load.
  if (!allowRepBump) {
    return { reps, weight };
  }

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

  if (weight === 0) {
    return { reps: reps + REP_INCREMENT, weight: 0 };
  }

  if (reps < STANDARD_REP_CAP) {
    return { reps: reps + REP_INCREMENT, weight };
  }
  return {
    reps: STANDARD_RESET_REPS,
    weight: roundToHalf(weight + getStandardIncrement(exercise.exercise?.equipment)),
  };
}

function applyPrescriptionToSets(
  sets: WorkoutSet[],
  prescription: Prescription
): WorkoutSet[] {
  return sets.map((set) => ({
    ...set,
    reps: prescription.reps,
    weight: prescription.weight,
    completed: false,
    completedAt: undefined,
  }));
}

function progressDropset(set: WorkoutSet, exercise: WorkoutExercise): WorkoutSet {
  const reps = set.reps as number[];
  const weights = set.weight as number[];
  const nextReps: number[] = [];
  const nextWeights: number[] = [];

  for (let i = 0; i < reps.length; i++) {
    const prescription = computeProgression(reps[i], weights[i], exercise, true);
    nextReps.push(prescription.reps);
    nextWeights.push(prescription.weight);
  }

  return {
    ...set,
    reps: nextReps,
    weight: nextWeights,
    completed: false,
    completedAt: undefined,
  };
}

function progressPlainSets(sets: WorkoutSet[], exercise: WorkoutExercise): WorkoutSet[] {
  const target = unifySets(sets);
  const prescription = computeProgression(
    target.reps,
    target.weight,
    exercise,
    target.allIdentical
  );
  return applyPrescriptionToSets(sets, prescription);
}

/** Progress a single exercise. Returns a new exercise with updated sets. */
export function progressExercise(exercise: WorkoutExercise): WorkoutExercise {
  const sets = exercise.sets || [];
  if (sets.length === 0) return exercise;

  const newSets = sets.map((set) => {
    if (isDropsetArray(set)) return progressDropset(set, exercise);
    if (isPlainNumberSet(set)) return set;
    return set;
  });

  const plainIndexes = newSets
    .map((set, i) => (isPlainNumberSet(set) ? i : -1))
    .filter((i) => i >= 0);

  if (plainIndexes.length > 0) {
    const progressed = progressPlainSets(
      plainIndexes.map((i) => newSets[i]),
      exercise
    );
    plainIndexes.forEach((setIndex, j) => {
      newSets[setIndex] = progressed[j];
    });
  }

  return { ...exercise, sets: newSets };
}

/** Deload a single exercise. No progression: reduce/strip load, keep reps. */
export function deloadExercise(exercise: WorkoutExercise): WorkoutExercise {
  const sets = exercise.sets || [];
  if (sets.length === 0) return exercise;

  const weightedBodyweight = isWeightedBodyweightExercise(exercise.exercise?.name);

  const scaleWeight = (weight: number): number => {
    if (weight === 0) return 0;
    if (weightedBodyweight) return 0;
    return roundToHalf(weight / 2);
  };

  const newSets = sets.map((set) => {
    if (isDropsetArray(set)) {
      return {
        ...set,
        weight: (set.weight as number[]).map(scaleWeight),
        completed: false,
        completedAt: undefined,
      };
    }
    if (!isPlainNumberSet(set)) return set;
    return {
      ...set,
      weight: scaleWeight(set.weight as number),
      completed: false,
      completedAt: undefined,
    };
  });

  return { ...exercise, sets: newSets };
}

export interface ProgressionOptions {
  /** 0-based day indexes to leave unchanged (not trained this week). */
  excludedDayIndexes?: number[];
}

function skippedDayNames(week: WorkoutWeek, excludedDayIndexes: number[]): string[] {
  return excludedDayIndexes
    .map((i) => week.days?.[i]?.name)
    .filter((name): name is string => Boolean(name));
}

function transformWeekExercises(
  week: WorkoutWeek,
  transform: (ex: WorkoutExercise) => WorkoutExercise,
  excludedDayIndexes: number[] = []
): WorkoutWeek {
  const skip = new Set(
    excludedDayIndexes.filter((i) => Number.isInteger(i) && i >= 0)
  );
  const days = (week.days || []).map((day, index) => {
    if (skip.has(index)) return day;
    return {
      ...day,
      exercises: (day.exercises || []).map(transform),
    };
  });
  return { ...week, days };
}

/**
 * Apply auto-progression to an entire week (operates on the week's actuals).
 * Caller should pass a fresh copy of the previous week (e.g. from
 * createNextWeekFromActuals) so original data is not mutated.
 * Excluded days are copied as-is (same reps/weights).
 */
export function applyAutoProgression(
  week: WorkoutWeek,
  options?: ProgressionOptions
): WorkoutWeek {
  const excludedDayIndexes = options?.excludedDayIndexes || [];
  const skipped = skippedDayNames(week, excludedDayIndexes);
  const progressionNotes = skipped.length
    ? `Auto-progression from previous week. Kept same (not trained): ${skipped.join(', ')}.`
    : 'Auto-progression from previous week';
  return transformWeekExercises(
    { ...week, progressionNotes },
    progressExercise,
    excludedDayIndexes
  );
}

/** Apply a deload week (manual coach trigger). Excluded days stay as copied. */
export function applyDeload(
  week: WorkoutWeek,
  options?: ProgressionOptions
): WorkoutWeek {
  const excludedDayIndexes = options?.excludedDayIndexes || [];
  const skipped = skippedDayNames(week, excludedDayIndexes);
  const progressionNotes = skipped.length
    ? `Deload week. Kept same (not trained): ${skipped.join(', ')}.`
    : 'Deload week';
  return transformWeekExercises(
    { ...week, progressionNotes },
    deloadExercise,
    excludedDayIndexes
  );
}
