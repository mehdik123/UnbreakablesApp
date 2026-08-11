/**
 * Workout load units.
 *
 * Canonical storage is always kilograms (incl. progressive overload).
 * Clients/coaches who prefer lbs only see/enter converted values.
 */

export type WeightUnit = 'kg' | 'lbs';

const LS_PREFIX = 'client_weight_unit_';
const KG_PER_LB = 0.45359237;

export function isWeightUnit(v: unknown): v is WeightUnit {
  return v === 'kg' || v === 'lbs';
}

export function roundWeightKg(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.max(0, value) * 2) / 2;
}

/** Round for display: 0.5 kg or 0.5 lb. */
export function roundDisplayWeight(value: number, unit: WeightUnit): number {
  if (!Number.isFinite(value)) return 0;
  const n = Math.max(0, value);
  return Math.round(n * 2) / 2;
}

/** Convert stored kg → value shown in the UI. */
export function toDisplayWeight(kg: number, unit: WeightUnit): number {
  if (!Number.isFinite(kg)) return 0;
  if (unit === 'kg') return roundDisplayWeight(kg, 'kg');
  return roundDisplayWeight(kg / KG_PER_LB, 'lbs');
}

/** Convert a UI-entered value → kg for storage / progression. */
export function toStorageKg(display: number, unit: WeightUnit): number {
  if (!Number.isFinite(display)) return 0;
  if (unit === 'kg') return roundWeightKg(display);
  return roundWeightKg(display * KG_PER_LB);
}

export function toDisplayWeightValue(
  weight: number | number[],
  unit: WeightUnit
): number | number[] {
  if (Array.isArray(weight)) return weight.map((w) => toDisplayWeight(w, unit));
  return toDisplayWeight(weight, unit);
}

/** +/- step in the *display* unit (5 lb ≈ US plate; 2.5 kg existing default). */
export function weightStep(unit: WeightUnit): number {
  return unit === 'lbs' ? 5 : 2.5;
}

export function weightUnitLabel(unit: WeightUnit): 'kg' | 'lbs' {
  return unit;
}

export function loadClientWeightUnit(
  clientId: string,
  assignment?: { weightUnit?: WeightUnit | string | null } | null
): WeightUnit {
  if (assignment && isWeightUnit(assignment.weightUnit)) return assignment.weightUnit;
  try {
    const v = localStorage.getItem(LS_PREFIX + clientId);
    if (isWeightUnit(v)) return v;
  } catch {
    /* ignore */
  }
  return 'kg';
}

export function persistClientWeightUnit(clientId: string, unit: WeightUnit): void {
  try {
    localStorage.setItem(LS_PREFIX + clientId, unit);
  } catch {
    /* ignore */
  }
}

/**
 * Persist preference for the client (local + assignment blob when we have an id).
 * Does not change stored set weights — only the display preference.
 */
export async function saveClientWeightUnitPreference(opts: {
  clientId: string;
  unit: WeightUnit;
  assignmentId?: string | null;
  assignment?: Record<string, unknown> | null;
}): Promise<void> {
  const { clientId, unit, assignmentId, assignment } = opts;
  persistClientWeightUnit(clientId, unit);

  if (!assignmentId || !assignment) return;
  try {
    const { isSupabaseReady } = await import('../lib/supabaseClient');
    if (!isSupabaseReady) return;
    const { dbUpdateWorkoutAssignment } = await import('../lib/db');
    await dbUpdateWorkoutAssignment(assignmentId, {
      program_json: { ...assignment, weightUnit: unit },
      last_modified_by: 'client',
    });
  } catch (err) {
    console.warn('Failed to persist weight unit on assignment', err);
  }
}
