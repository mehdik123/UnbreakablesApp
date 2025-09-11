import { SelectedMeal } from '../types';

export interface GroceryItem {
  name: string;
  grams: number;
}

export interface GroceryList {
  items: GroceryItem[];
  totalItems: number;
}

export function buildGroceryList(selectedMeals: SelectedMeal[][], days: number = 1): GroceryList {
  const gramsMap = new Map<string, number>();
  // selectedMeals is per-day slots; multiply by days factor
  const multiplier = Math.max(1, days);

  for (const slot of selectedMeals) {
    for (const sel of slot) {
      const ingredients = sel.customIngredients || sel.meal.ingredients;
      for (const ing of ingredients) {
        const prev = gramsMap.get(ing.food.name) || 0;
        gramsMap.set(ing.food.name, prev + ing.quantity * multiplier);
      }
    }
  }

  const items = Array.from(gramsMap.entries())
    .map(([name, grams]) => ({ name, grams: Math.round(grams) }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return { items, totalItems: items.length };
}






