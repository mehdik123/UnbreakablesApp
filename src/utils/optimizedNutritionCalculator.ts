import { DBResult } from '../lib/db';

export interface NutritionData {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface MealItem {
  id: string;
  quantity_g: number;
  ingredients: {
    name: string;
    kcal: number;
    protein: number;
    fat: number;
    carbs: number;
  };
}

export interface Meal {
  id: string;
  name: string;
  image?: string;
  cookingInstructions?: string;
  ingredients: Array<{
    food: {
      name: string;
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
    };
    quantity: number;
  }>;
}

/**
 * Optimized nutrition calculator with memoization and error handling
 */
export class OptimizedNutritionCalculator {
  private static cache = new Map<string, NutritionData>();
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private static cacheTimestamps = new Map<string, number>();

  /**
   * Calculate nutrition for a single meal with serving size
   */
  static calculateMealNutrition(
    meal: Meal, 
    servingSize: number = 1
  ): NutritionData {
    const cacheKey = `${meal.id}-${servingSize}`;
    
    // Check cache first
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    if (!meal.ingredients || meal.ingredients.length === 0) {
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }

    const result = meal.ingredients.reduce(
      (total, ingredient) => {
        const food = ingredient.food;
        const quantity = ingredient.quantity || 0;
        const factor = (quantity * servingSize) / 100;

        // Validate data
        if (!food || isNaN(quantity) || quantity <= 0) {
          console.warn(`Invalid ingredient data for ${food?.name || 'unknown'}`);
          return total;
        }

        return {
          calories: total.calories + (food.kcal || 0) * factor,
          protein: total.protein + (food.protein || 0) * factor,
          fat: total.fat + (food.fat || 0) * factor,
          carbs: total.carbs + (food.carbs || 0) * factor,
        };
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );

    // Round results
    const roundedResult = {
      calories: Math.round(result.calories),
      protein: Math.round(result.protein * 10) / 10,
      fat: Math.round(result.fat * 10) / 10,
      carbs: Math.round(result.carbs * 10) / 10,
    };

    // Cache the result
    this.cache.set(cacheKey, roundedResult);
    this.cacheTimestamps.set(cacheKey, Date.now());

    return roundedResult;
  }

  /**
   * Calculate nutrition for multiple meals (daily total)
   */
  static calculateDailyNutrition(
    meals: Meal[], 
    servingSizes: { [mealId: string]: number } = {}
  ): NutritionData {
    return meals.reduce(
      (total, meal) => {
        const servingSize = servingSizes[meal.id] || 1;
        const mealNutrition = this.calculateMealNutrition(meal, servingSize);
        
        return {
          calories: total.calories + mealNutrition.calories,
          protein: total.protein + mealNutrition.protein,
          fat: total.fat + mealNutrition.fat,
          carbs: total.carbs + mealNutrition.carbs,
        };
      },
      { calories: 0, protein: 0, fat: 0, carbs: 0 }
    );
  }

  /**
   * Calculate nutrition for completed meals only
   */
  static calculateCompletedMealsNutrition(
    meals: Meal[],
    completedMealIds: string[],
    servingSizes: { [mealId: string]: number } = {}
  ): NutritionData {
    const completedMeals = meals.filter(meal => 
      completedMealIds.includes(meal.id)
    );
    
    return this.calculateDailyNutrition(completedMeals, servingSizes);
  }

  /**
   * Get nutrition progress as percentage
   */
  static getNutritionProgress(
    current: NutritionData,
    target: NutritionData
  ): { calories: number; protein: number; fat: number; carbs: number } {
    return {
      calories: target.calories > 0 ? Math.min((current.calories / target.calories) * 100, 100) : 0,
      protein: target.protein > 0 ? Math.min((current.protein / target.protein) * 100, 100) : 0,
      fat: target.fat > 0 ? Math.min((current.fat / target.fat) * 100, 100) : 0,
      carbs: target.carbs > 0 ? Math.min((current.carbs / target.carbs) * 100, 100) : 0,
    };
  }

  /**
   * Check if cache is still valid
   */
  private static isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    
    return (Date.now() - timestamp) < this.CACHE_TTL;
  }

  /**
   * Clear cache (useful when data changes)
   */
  static clearCache(): void {
    this.cache.clear();
    this.cacheTimestamps.clear();
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

/**
 * Hook for real-time nutrition calculation
 */
export function useNutritionCalculation(
  meals: Meal[],
  completedMealIds: string[],
  servingSizes: { [mealId: string]: number } = {}
) {
  const [nutrition, setNutrition] = useState<NutritionData>({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  });

  const [progress, setProgress] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0
  });

  useEffect(() => {
    // Calculate completed meals nutrition
    const completedNutrition = OptimizedNutritionCalculator.calculateCompletedMealsNutrition(
      meals,
      completedMealIds,
      servingSizes
    );

    setNutrition(completedNutrition);
  }, [meals, completedMealIds, servingSizes]);

  const updateProgress = (targetNutrition: NutritionData) => {
    const newProgress = OptimizedNutritionCalculator.getNutritionProgress(
      nutrition,
      targetNutrition
    );
    setProgress(newProgress);
  };

  return {
    nutrition,
    progress,
    updateProgress,
    clearCache: OptimizedNutritionCalculator.clearCache
  };
}
