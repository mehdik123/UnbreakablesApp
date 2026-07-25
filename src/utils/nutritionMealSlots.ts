import { NutritionPlan, MealSlot } from '../types';

/** Canonical slot names — matches UltraModernNutritionEditor.generateMealSlots */
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
