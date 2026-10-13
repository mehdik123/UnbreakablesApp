/** Gym dumbbell ladder options (kg per side / jump used in auto-progression). */
export const DUMBBELL_INCREMENTS = [1, 2, 2.5] as const;
export type DumbbellIncrementKg = (typeof DUMBBELL_INCREMENTS)[number];

export const DEFAULT_DUMBBELL_INCREMENT_KG: DumbbellIncrementKg = 2.5;

export function normalizeDumbbellIncrement(value: unknown): DumbbellIncrementKg {
  const n = typeof value === 'number' ? value : Number(value);
  if (n === 1 || n === 2 || n === 2.5) return n;
  return DEFAULT_DUMBBELL_INCREMENT_KG;
}
