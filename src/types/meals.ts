// TypeScript interfaces for the meals system
// These match the database structure created in create_meals_system.sql

export interface Ingredient {
  id: string;
  name: string;
  category: string;
  nutrition_per_100g: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
  };
  created_at: string;
  updated_at: string;
}

export interface MealIngredient {
  id: string;
  meal_id: string;
  ingredient_id: string;
  quantity: number;
  unit: string;
  notes?: string;
  created_at: string;
  // Joined data
  ingredient?: Ingredient;
}

export interface MealInstruction {
  id: string;
  meal_id: string;
  step_number: number;
  instruction: string;
  image_url?: string;
  time_minutes?: number;
  temperature_celsius?: number;
  created_at: string;
}

export interface MealNutrition {
  id: string;
  meal_id: string;
  nutrition_type: 'per_serving' | 'per_100g' | 'total';
  calories?: number;
  protein?: number;
  carbohydrates?: number;
  fat?: number;
  saturated_fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  cholesterol?: number;
  vitamin_a?: number;
  vitamin_c?: number;
  calcium?: number;
  iron?: number;
  created_at: string;
}

export interface Meal {
  id: string;
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine_type?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  total_time_minutes?: number;
  servings: number;
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  fiber_per_serving?: number;
  image_url?: string;
  video_url?: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Complete meal with all related data (matches the meals_complete view)
export interface MealComplete extends Meal {
  ingredients: Array<{
    ingredient_id: string;
    ingredient_name: string;
    category: string;
    quantity: number;
    unit: string;
    notes?: string;
    nutrition: {
      calories: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  }>;
  instructions: Array<{
    step_number: number;
    instruction: string;
    time_minutes?: number;
    temperature_celsius?: number;
    image_url?: string;
  }>;
  nutrition_details: Array<{
    nutrition_type: string;
    calories?: number;
    protein?: number;
    carbohydrates?: number;
    fat?: number;
    saturated_fat?: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    cholesterol?: number;
  }>;
}

// Form data for creating/editing meals
export interface MealFormData {
  name: string;
  description?: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  cuisine_type?: string;
  difficulty_level: 'easy' | 'medium' | 'hard';
  prep_time_minutes?: number;
  cook_time_minutes?: number;
  servings: number;
  calories_per_serving?: number;
  protein_per_serving?: number;
  carbs_per_serving?: number;
  fat_per_serving?: number;
  fiber_per_serving?: number;
  image_url?: string;
  video_url?: string;
  tags: string[];
  ingredients: Array<{
    ingredient_id: string;
    quantity: number;
    unit: string;
    notes?: string;
  }>;
  instructions: Array<{
    step_number: number;
    instruction: string;
    time_minutes?: number;
    temperature_celsius?: number;
    image_url?: string;
  }>;
}

// Search and filter options
export interface MealFilters {
  category?: string;
  cuisine_type?: string;
  difficulty_level?: string;
  min_calories?: number;
  max_calories?: number;
  min_protein?: number;
  max_protein?: number;
  max_prep_time?: number;
  max_cook_time?: number;
  tags?: string[];
  search_query?: string;
}

// Shopping list item
export interface ShoppingListItem {
  ingredient_id: string;
  ingredient_name: string;
  category: string;
  total_quantity: number;
  unit: string;
  meals: string[]; // Names of meals that use this ingredient
  notes?: string;
}

// Meal plan item
export interface MealPlanItem {
  id: string;
  meal_id: string;
  meal_name: string;
  scheduled_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  servings: number;
  notes?: string;
}

// Nutrition summary
export interface NutritionSummary {
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  average_calories_per_meal: number;
  meal_count: number;
}





