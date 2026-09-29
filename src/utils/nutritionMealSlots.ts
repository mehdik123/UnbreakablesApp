import { NutritionPlan, MealSlot } from '../types';

/** Preset meal-slot labels coaches can pick from (plus free-form custom). */
export const MEAL_SLOT_PRESETS = [
  'Breakfast',
  'Morning Snack',
  'Lunch',
  'Afternoon Snack',
  'Dinner',
  'Evening Snack',
  'Pre-Workout',
  'Post-Workout',
] as const;

export type MealSlotPreset = (typeof MEAL_SLOT_PRESETS)[number];

/** Default names when creating a fresh plan — not applied when resizing existing slots. */
export function getMealSlotNames(mealCount: number): string[] {
  switch (mealCount) {
    case 2:
      return ['Breakfast', 'Dinner'];
    case 3:
      return ['Breakfast', 'Lunch', 'Dinner'];
    case 4:
      return ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack'];
    case 5:
      return ['Breakfast', 'Morning Snack', 'Lunch', 'Dinner', 'Evening Snack'];
    case 6:
      return [
        'Breakfast',
        'Morning Snack',
        'Lunch',
        'Afternoon Snack',
        'Dinner',
        'Evening Snack',
      ];
    default:
      return Array.from({ length: mealCount }, (_, i) => `Meal ${i + 1}`);
  }
}

export function createEmptyMealSlots(mealsPerDay: number): MealSlot[] {
  return getMealSlotNames(mealsPerDay).map((name, i) => ({
    id: String(i + 1),
    name,
    selectedMeals: [],
  }));
}

/**
 * Resize slots without renaming existing ones.
 * Adding meals appends new empty slots with suggested default names.
 * Removing meals keeps the first N slots (names + meals intact).
 */
export function resizeMealSlots(existing: MealSlot[], mealsPerDay: number): MealSlot[] {
  if (mealsPerDay < 1) return existing;
  if (existing.length === mealsPerDay) return existing;

  if (mealsPerDay < existing.length) {
    return existing.slice(0, mealsPerDay).map((slot, i) => ({
      ...slot,
      id: String(i + 1),
    }));
  }

  const usedNames = new Set(existing.map((s) => s.name.toLowerCase()));
  const next = existing.map((slot, i) => ({
    ...slot,
    id: String(i + 1),
  }));

  // Prefer unused presets so 4→5 does not rename Lunch→Morning Snack; new slot gets a free label.
  const appendCandidates = [
    'Morning Snack',
    'Afternoon Snack',
    'Evening Snack',
    'Pre-Workout',
    'Post-Workout',
    'Breakfast',
    'Lunch',
    'Dinner',
  ];

  for (let i = existing.length; i < mealsPerDay; i++) {
    const name =
      appendCandidates.find((c) => !usedNames.has(c.toLowerCase())) || `Meal ${i + 1}`;
    usedNames.add(name.toLowerCase());
    next.push({
      id: String(i + 1),
      name,
      selectedMeals: [],
    });
  }

  return next;
}

export function createEmptyNutritionPlan(
  clientId: string,
  clientName: string,
  mealsPerDay: number
): NutritionPlan {
  const now = new Date();
  return {
    id: `nutrition-${clientId}`,
    clientId,
    clientName,
    mealsPerDay,
    mealSlots: createEmptyMealSlots(mealsPerDay),
    createdAt: now,
    updatedAt: now,
  };
}
