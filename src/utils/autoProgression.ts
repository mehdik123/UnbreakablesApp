import { WorkoutWeek, WorkoutExercise, WorkoutSet } from '../types';

/**
 * Auto-Progression Logic — Weekly Update
 *
 * Computes next week's prescription from this week's actual performance.
 * Pure functions only: the coach reviews/edits the output before it is saved.
 *
 * Regular sets:
 *  1. Ignore failed / skipped sets (0 reps). They must never win "heaviest"
 *     or trigger a +2 bump — that is what zeroed whole exercises.
 *  2. If nothing was trained (all 0 reps), keep the sets as-is. Do not invent reps.
 *  3. If every completed set matches (same reps + weight), add +2 reps
 *     (or cap → reset 8 + load).
 *  4. If completed sets are mixed, keep each completed set as logged. Fill any
 *     0-rep slots from the best completed set so next week is not empty.
 *
 * Dropsets: each drop progresses on its own (+2 / cap / load). A 0-rep drop stays 0.
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
  /** True when every set was completed at the same reps and weight. */
  allIdentical: boolean;
}

function setReps(set: WorkoutSet): number {
  return set.reps as number;
}

function setWeight(set: WorkoutSet): number {
  return set.weight as number;
}

/** A set the client actually performed (logged reps). 0 reps = skipped / failed. */
function isWorkedSet(set: WorkoutSet): boolean {
  return isPlainNumberSet(set) && setReps(set) > 0;
}

/**
 * Best completed set (heaviest, tie → more reps).
 * Returns null when nothing was trained — caller must not invent a prescription.
 */
function unifySets(sets: WorkoutSet[]): UnifiedTarget | null {
  const worked = sets.filter(isWorkedSet);
  if (worked.length === 0) return null;

  let best = { reps: setReps(worked[0]), weight: setWeight(worked[0]) };
  for (const set of worked) {
    const reps = setReps(set);
    const weight = setWeight(set);
    if (weight > best.weight || (weight === best.weight && reps > best.reps)) {
      best = { reps, weight };
    }
  }

  const allIdentical =
    worked.length === sets.length &&
    worked.every((s) => setReps(s) === best.reps && setWeight(s) === best.weight);

  return { reps: best.reps, weight: best.weight, allIdentical };
}

/**
 * Next (reps, weight) for one prescription.
 * `allowRepBump` is false when sets were mixed — copy only, no +2.
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

  // 0 kg (unlogged load, or true bodyweight that is not in the weighted list):
  // still +2 reps, but never climb past the cap (that produced 16-rep RDLs).
  if (weight === 0) {
    if (reps >= STANDARD_REP_CAP) return { reps, weight: 0 };
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
    // Skipped drop (0 reps) stays 0 — do not +2 into "2 reps".
    if (!reps[i] || reps[i] <= 0) {
      nextReps.push(reps[i] || 0);
      nextWeights.push(weights[i] ?? 0);
      continue;
    }
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

function resetCompletion(set: WorkoutSet, reps: number, weight: number): WorkoutSet {
  return {
    ...set,
    reps,
    weight,
    completed: false,
    completedAt: undefined,
  };
}

function progressPlainSets(sets: WorkoutSet[], exercise: WorkoutExercise): WorkoutSet[] {
  const target = unifySets(sets);

  // Nothing logged — leave the week as copied. Do not turn 0 into 2 reps.
  if (!target) {
    return sets.map((set) =>
      resetCompletion(set, setReps(set), setWeight(set))
    );
  }

  if (!target.allIdentical) {
    // Mixed or partial: keep completed sets as logged; fill skipped (0-rep)
    // slots from the best completed set so a failed heavy attempt cannot
    // wipe the exercise (e.g. 9×20 + 0×25 must not become 0×25).
    return sets.map((set) => {
      const reps = setReps(set);
      const weight = setWeight(set);
      if (reps > 0) return resetCompletion(set, reps, weight);
      return resetCompletion(set, target.reps, target.weight);
    });
  }

  const prescription = computeProgression(
    target.reps,
    target.weight,
    exercise,
    true
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
