import { Ingredient, SelectedMeal, NutritionSummary } from '../types';

export const calculateIngredientNutrition = (ingredient: Ingredient) => {
  if (!ingredient || !ingredient.food || typeof ingredient.quantity !== 'number') {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }
  
  const { food, quantity } = ingredient;
  const factor = quantity / 100; // Convert to per 100g basis
  
  return {
    kcal: Math.round(food.kcal * factor),
    protein: Math.round(food.protein * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10
  };
};

export const calculateMealNutrition = (selectedMeal: SelectedMeal) => {
  if (!selectedMeal || !selectedMeal.meal) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }
  
  const ingredients = selectedMeal.customIngredients || selectedMeal.meal.ingredients;
  
  if (!ingredients || !Array.isArray(ingredients)) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }
  
  return ingredients.reduce(
    (total, ingredient) => {
      const nutrition = calculateIngredientNutrition(ingredient);
      return {
        kcal: total.kcal + nutrition.kcal,
        protein: Math.round((total.protein + nutrition.protein) * 10) / 10,
        fat: Math.round((total.fat + nutrition.fat) * 10) / 10,
        carbs: Math.round((total.carbs + nutrition.carbs) * 10) / 10
      };
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  );
};

export const calculateMealSlotNutrition = (selectedMeals: SelectedMeal[]) => {
  if (!selectedMeals || !Array.isArray(selectedMeals)) {
    return { kcal: 0, protein: 0, fat: 0, carbs: 0 };
  }
  
  return selectedMeals.reduce(
    (total, selectedMeal) => {
      const mealNutrition = calculateMealNutrition(selectedMeal);
      return {
        kcal: total.kcal + mealNutrition.kcal,
        protein: Math.round((total.protein + mealNutrition.protein) * 10) / 10,
        fat: Math.round((total.fat + mealNutrition.fat) * 10) / 10,
        carbs: Math.round((total.carbs + mealNutrition.carbs) * 10) / 10
      };
    },
    { kcal: 0, protein: 0, fat: 0, carbs: 0 }
  );
};

export const calculateTotalNutrition = (selectedMeals: SelectedMeal[]): NutritionSummary => {
  if (!selectedMeals || !Array.isArray(selectedMeals)) {
    return { totalKcal: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 };
  }
  
  return selectedMeals.reduce(
    (total, selectedMeal) => {
      const mealNutrition = calculateMealNutrition(selectedMeal);
      return {
        totalKcal: total.totalKcal + mealNutrition.kcal,
        totalProtein: Math.round((total.totalProtein + mealNutrition.protein) * 10) / 10,
        totalFat: Math.round((total.totalFat + mealNutrition.fat) * 10) / 10,
        totalCarbs: Math.round((total.totalCarbs + mealNutrition.carbs) * 10) / 10
      };
    },
    { totalKcal: 0, totalProtein: 0, totalFat: 0, totalCarbs: 0 }
  );
};