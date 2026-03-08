import { SelectedMeal, Ingredient, SlotMealOverride } from '../types';

/**
 * Returns a copy of the selected meal with slot overrides applied:
 * - Excludes ingredients whose food.name is in excludedIngredientNames
 * - Overrides name, cookingInstructions, image when provided
 * Used for display and nutrition calculation so client sees/counts only what they get.
 */
export function getEffectiveSelectedMeal(sm: SelectedMeal): SelectedMeal {
  const over = sm.slotOverride;
  if (!over) return sm;

  const baseIngredients = sm.meal?.ingredients ?? [];
  const excluded = new Set((over.excludedIngredientNames ?? []).map((n) => n.trim().toLowerCase()));
  const effectiveIngredients: Ingredient[] =
    excluded.size > 0
      ? baseIngredients.filter((ing) => !excluded.has((ing.food?.name ?? '').trim().toLowerCase()))
      : baseIngredients;

  const effectiveMeal = {
    ...sm.meal,
    name: over.nameOverride?.trim() || sm.meal.name,
    cookingInstructions: over.instructionsOverride?.trim() || sm.meal.cookingInstructions,
    image: over.imageOverride?.trim() || sm.meal.image,
    ingredients: effectiveIngredients,
  };

  return {
    ...sm,
    meal: effectiveMeal,
    customIngredients: effectiveIngredients,
  };
}
