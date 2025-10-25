import { supabase } from './supabaseClient';
import { Meal, MealComplete, Ingredient, MealFilters, ShoppingListItem, NutritionSummary } from '../types/meals';

class MealsService {
  // Get all meals with complete details
  async getAllMeals(): Promise<{ data: MealComplete[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals_complete')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Get meal by ID with complete details
  async getMealById(mealId: string): Promise<{ data: MealComplete | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals_complete')
        .select('*')
        .eq('id', mealId)
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Search meals with filters
  async searchMeals(filters: MealFilters): Promise<{ data: MealComplete[] | null; error: any }> {
    try {
      let query = supabase
        .from('meals_complete')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      if (filters.cuisine_type) {
        query = query.eq('cuisine_type', filters.cuisine_type);
      }

      if (filters.difficulty_level) {
        query = query.eq('difficulty_level', filters.difficulty_level);
      }

      if (filters.min_calories) {
        query = query.gte('calories_per_serving', filters.min_calories);
      }

      if (filters.max_calories) {
        query = query.lte('calories_per_serving', filters.max_calories);
      }

      if (filters.min_protein) {
        query = query.gte('protein_per_serving', filters.min_protein);
      }

      if (filters.max_protein) {
        query = query.lte('protein_per_serving', filters.max_protein);
      }

      if (filters.max_prep_time) {
        query = query.lte('prep_time_minutes', filters.max_prep_time);
      }

      if (filters.max_cook_time) {
        query = query.lte('cook_time_minutes', filters.max_cook_time);
      }

      if (filters.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }

      if (filters.search_query) {
        query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Get all ingredients
  async getAllIngredients(): Promise<{ data: Ingredient[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .order('name');

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Get ingredients by category
  async getIngredientsByCategory(category: string): Promise<{ data: Ingredient[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('ingredients')
        .select('*')
        .eq('category', category)
        .order('name');

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Create a new meal
  async createMeal(mealData: Partial<Meal>): Promise<{ data: Meal | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert(mealData)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Update a meal
  async updateMeal(mealId: string, updates: Partial<Meal>): Promise<{ data: Meal | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId)
        .select()
        .single();

      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Delete a meal (soft delete)
  async deleteMeal(mealId: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('meals')
        .update({ is_active: false })
        .eq('id', mealId);

      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  // Add ingredient to meal
  async addMealIngredient(mealId: string, ingredientId: string, quantity: number, unit: string, notes?: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('meal_ingredients')
        .insert({
          meal_id: mealId,
          ingredient_id: ingredientId,
          quantity,
          unit,
          notes
        });

      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  // Add instruction to meal
  async addMealInstruction(mealId: string, stepNumber: number, instruction: string, timeMinutes?: number, temperatureCelsius?: number, imageUrl?: string): Promise<{ error: any }> {
    try {
      const { error } = await supabase
        .from('meal_instructions')
        .insert({
          meal_id: mealId,
          step_number: stepNumber,
          instruction,
          time_minutes: timeMinutes,
          temperature_celsius: temperatureCelsius,
          image_url: imageUrl
        });

      return { error };
    } catch (err) {
      return { error: err };
    }
  }

  // Get shopping list for multiple meals
  async getShoppingList(mealIds: string[]): Promise<{ data: ShoppingListItem[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .rpc('get_shopping_list', { meal_ids: mealIds });

      return { data, error };
    } catch (err) {
      // Fallback to manual query if RPC doesn't exist
      const { data, error } = await supabase
        .from('meal_ingredients')
        .select(`
          ingredient_id,
          quantity,
          unit,
          notes,
          ingredients!inner(name, category),
          meals!inner(name)
        `)
        .in('meal_id', mealIds);

      if (error) return { data: null, error };

      // Group by ingredient
      const grouped = data.reduce((acc: any, item: any) => {
        const key = item.ingredient_id;
        if (!acc[key]) {
          acc[key] = {
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredients.name,
            category: item.ingredients.category,
            total_quantity: 0,
            unit: item.unit,
            meals: [],
            notes: item.notes
          };
        }
        acc[key].total_quantity += item.quantity;
        acc[key].meals.push(item.meals.name);
        return acc;
      }, {});

      return { data: Object.values(grouped), error: null };
    }
  }

  // Get nutrition summary for meals
  async getNutritionSummary(mealIds: string[]): Promise<{ data: NutritionSummary | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('calories_per_serving, protein_per_serving, carbs_per_serving, fat_per_serving, fiber_per_serving, servings')
        .in('id', mealIds)
        .eq('is_active', true);

      if (error) return { data: null, error };

      const summary = data.reduce((acc: any, meal: any) => {
        const calories = (meal.calories_per_serving || 0) * (meal.servings || 1);
        const protein = (meal.protein_per_serving || 0) * (meal.servings || 1);
        const carbs = (meal.carbs_per_serving || 0) * (meal.servings || 1);
        const fat = (meal.fat_per_serving || 0) * (meal.servings || 1);
        const fiber = (meal.fiber_per_serving || 0) * (meal.servings || 1);

        acc.total_calories += calories;
        acc.total_protein += protein;
        acc.total_carbs += carbs;
        acc.total_fat += fat;
        acc.total_fiber += fiber;
        acc.meal_count += 1;

        return acc;
      }, {
        total_calories: 0,
        total_protein: 0,
        total_carbs: 0,
        total_fat: 0,
        total_fiber: 0,
        meal_count: 0
      });

      summary.average_calories_per_meal = summary.meal_count > 0 ? summary.total_calories / summary.meal_count : 0;

      return { data: summary, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Get meal categories
  async getMealCategories(): Promise<{ data: string[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('category')
        .eq('is_active', true);

      if (error) return { data: null, error };

      const categories = [...new Set(data.map(item => item.category))];
      return { data: categories, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Get cuisine types
  async getCuisineTypes(): Promise<{ data: string[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('cuisine_type')
        .eq('is_active', true)
        .not('cuisine_type', 'is', null);

      if (error) return { data: null, error };

      const cuisines = [...new Set(data.map(item => item.cuisine_type))];
      return { data: cuisines, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }

  // Get all tags
  async getAllTags(): Promise<{ data: string[] | null; error: any }> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .select('tags')
        .eq('is_active', true);

      if (error) return { data: null, error };

      const allTags = data.flatMap(item => item.tags || []);
      const uniqueTags = [...new Set(allTags)];
      return { data: uniqueTags, error: null };
    } catch (err) {
      return { data: null, error: err };
    }
  }
}

export const mealsService = new MealsService();





