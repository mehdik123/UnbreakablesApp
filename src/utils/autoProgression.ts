import { WorkoutWeek, WorkoutExercise, WorkoutSet } from '../types';

/**
 * Auto-Progression Logic — Weekly Update
 *
 * Unify first (no +2 that week). Progress only when every set is already
 * the same reps AND the same weight.
 *
 * Unify (0 / null reps do not vote for “top” load):
 *  - Same reps, different weights → top weight, same reps.
 *  - Same weight, different reps → top reps, same weight.
 *  - Both differ → top reps AND top weight on every set.
 *    5×13.5 / 10×16 / 10×16 → 10×16.
 *  - All 0 reps (any weight) → 8 reps, keep each set’s weight.
 *
 * 0 kg:
 *  - Bodyweight exercise, same reps → +2 reps (keep 0 kg).
 *  - Bodyweight, mixed reps → unify to top reps, 0 kg.
 *  - Not bodyweight → leave as-is (coach edits).
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

/** True for pull-ups, dips, and anything logged as bodyweight equipment. */
export function isBodyweightExercise(exercise: WorkoutExercise): boolean {
  if (isWeightedBodyweightExercise(exercise.exercise?.name)) return true;
  return classifyEquipment(exercise.exercise?.equipment) === 'bodyweight';
}

function getWeightedBodyweightIncrement(name: string | undefined): number {
  return WEIGHTED_BODYWEIGHT_INCREMENT[normalizeName(name)] ?? 2.5;
}

function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/** Coerce logged reps/weight. null, undefined, "" and NaN → 0. */
function asQty(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, value);
  if (typeof value === 'string' && value.trim() !== '') {
    const n = Number(String(value).replace(',', '.'));
    if (Number.isFinite(n)) return Math.max(0, n);
  }
  return 0;
}

function isDropsetArray(set: WorkoutSet): boolean {
  return (
    set.isDropset === true &&
    Array.isArray(set.reps) &&
    Array.isArray(set.weight) &&
    set.reps.length > 0 &&
    set.reps.length === set.weight.length
  );
}

function isPlainSet(set: WorkoutSet): boolean {
  return set.isDropset !== true && !Array.isArray(set.reps);
}

interface Prescription {
  reps: number;
  weight: number;
}

type SetPlan =
  | { kind: 'unchanged' }
  | { kind: 'eightReps' }
  | { kind: 'progress'; reps: number; weight: number }
  | { kind: 'unify'; reps: number; weight: number };

function setReps(set: WorkoutSet): number {
  return asQty(set.reps);
}

function setWeight(set: WorkoutSet): number {
  return asQty(set.weight);
}

function isWorkedSet(set: WorkoutSet): boolean {
  return isPlainSet(set) && setReps(set) > 0;
}

/**
 * Decide unify vs progress from completed sets only.
 * 0 / null reps never vote for max weight or max reps.
 */
function planPlainSets(sets: WorkoutSet[], exercise: WorkoutExercise): SetPlan {
  const allZeroReps = sets.every((set) => setReps(set) <= 0);
  if (allZeroReps) return { kind: 'eightReps' };

  const allZeroWeight = sets.every((set) => setWeight(set) <= 0);
  const bodyweight = isBodyweightExercise(exercise);

  if (allZeroWeight && !bodyweight) {
    return { kind: 'unchanged' };
  }

  const worked = sets.filter(isWorkedSet);
  const reps = worked.map(setReps);
  const weights = worked.map(setWeight);
  const sameReps = reps.every((r) => r === reps[0]);
  const sameWeight = weights.every((w) => w === weights[0]);
  const allDone = worked.length === sets.length;
  const maxReps = Math.max(...reps);
  const maxWeight = Math.max(...weights);

  if (sameReps && sameWeight) {
    if (allDone) return { kind: 'progress', reps: reps[0], weight: weights[0] };
    return { kind: 'unify', reps: reps[0], weight: weights[0] };
  }
  if (sameReps) return { kind: 'unify', reps: reps[0], weight: maxWeight };
  if (sameWeight) return { kind: 'unify', reps: maxReps, weight: weights[0] };
  return { kind: 'unify', reps: maxReps, weight: maxWeight };
}

/**
 * Next (reps, weight) for one already-unified prescription.
 */
function computeProgression(
  reps: number,
  weight: number,
  exercise: WorkoutExercise
): Prescription {
  const name = exercise.exercise?.name;
  const weightedBodyweight = isWeightedBodyweightExercise(name);

  if (weightedBodyweight && weight > 0) {
    const candidateReps = reps + REP_INCREMENT;
    if (candidateReps >= BODYWEIGHT_REP_CAP) {
      return {
        reps: BODYWEIGHT_RESET_REPS,
        weight: roundToHalf(weight + getWeightedBodyweightIncrement(name)),
      };
    }
    return { reps: candidateReps, weight };
  }

  // Bodyweight (or 0 kg on a BW move): keep adding +2. Loaded 0 kg is not
  // progressed here — planPlainSets leaves non-BW 0 kg unchanged.
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
  const reps = (set.reps as unknown[]).map(asQty);
  const weights = Array.isArray(set.weight)
    ? (set.weight as unknown[]).map(asQty)
    : reps.map(() => asQty(set.weight));
  const nextReps: number[] = [];
  const nextWeights: number[] = [];

  if (reps.every((r) => r <= 0)) {
    return {
      ...set,
      reps: reps.map(() => STANDARD_RESET_REPS),
      weight: weights,
      completed: false,
      completedAt: undefined,
    };
  }

  for (let i = 0; i < reps.length; i++) {
    if (reps[i] <= 0) {
      nextReps.push(0);
      nextWeights.push(weights[i] ?? 0);
      continue;
    }
    const dropWeight = weights[i] ?? 0;
    if (dropWeight === 0 && !isBodyweightExercise(exercise)) {
      nextReps.push(reps[i]);
      nextWeights.push(0);
      continue;
    }
    const prescription = computeProgression(reps[i], dropWeight, exercise);
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
  const plan = planPlainSets(sets, exercise);

  if (plan.kind === 'unchanged') {
    return sets.map((set) => resetCompletion(set, setReps(set), setWeight(set)));
  }

  if (plan.kind === 'eightReps') {
    return sets.map((set) => resetCompletion(set, STANDARD_RESET_REPS, setWeight(set)));
  }

  if (plan.kind === 'unify') {
    return applyPrescriptionToSets(sets, { reps: plan.reps, weight: plan.weight });
  }

  const prescription = computeProgression(plan.reps, plan.weight, exercise);
  return applyPrescriptionToSets(sets, prescription);
}

/** Progress a single exercise. Returns a new exercise with updated sets. */
export function progressExercise(exercise: WorkoutExercise): WorkoutExercise {
  const sets = exercise.sets || [];
  if (sets.length === 0) return exercise;

  const newSets = sets.map((set) => {
    if (isDropsetArray(set)) return progressDropset(set, exercise);
    if (isPlainSet(set)) return set;
    return set;
  });

  const plainIndexes = newSets
    .map((set, i) => (isPlainSet(set) ? i : -1))
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
    if (!isPlainSet(set)) return set;
    return {
      ...set,
      weight: scaleWeight(setWeight(set)),
      reps: setReps(set),
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
