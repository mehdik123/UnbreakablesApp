import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Clock,
  Flame,
  Star,
  Eye,
  EyeOff,
  ChefHat,
  BookOpen,
  Heart,
  Plus,
  Minus,
  CheckCircle,
  X,
  Dumbbell
} from 'lucide-react';
import { Client, NutritionPlan, Meal, Food } from '../types';

interface ClientNutritionViewProps {
  client: Client;
  isDark: boolean;
  nutritionPlan?: NutritionPlan | null;
}

export const ClientNutritionView: React.FC<ClientNutritionViewProps> = ({
  client,
  isDark,
  nutritionPlan: propNutritionPlan
}) => {
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [showIngredients, setShowIngredients] = useState<{ [mealId: string]: boolean }>({});
  const [showInstructions, setShowInstructions] = useState<{ [mealId: string]: boolean }>({});
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);

  // Load nutrition plan from prop or localStorage on component mount
  useEffect(() => {
    const loadNutritionPlan = () => {
      // First try to get from prop
      if (propNutritionPlan) {
        setNutritionPlan(propNutritionPlan);
        return;
      }

      // Then try to get from client object
      if (client.nutritionPlan) {
        setNutritionPlan(client.nutritionPlan);
        return;
      }

      // If not in client object, try to load from localStorage
      const savedNutritionPlan = localStorage.getItem(`nutrition_plan_${client.id}`);
      if (savedNutritionPlan) {
        try {
          const parsed = JSON.parse(savedNutritionPlan);
          setNutritionPlan(parsed);
        } catch (error) {
          console.error('Error loading nutrition plan from localStorage:', error);
        }
      }
    };

    loadNutritionPlan();
  }, [client.id, client.nutritionPlan, propNutritionPlan]);

  // Use loaded nutrition plan - no fallback mock data
  const displayNutritionPlan: NutritionPlan | null = nutritionPlan;

  const toggleFavorite = (mealId: string) => {
    setFavoriteMeals(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const toggleIngredients = (mealId: string) => {
    setShowIngredients(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  const toggleInstructions = (mealId: string) => {
    setShowInstructions(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
  };

  const getMealIcon = (mealId: string) => {
    switch (mealId) {
      case 'breakfast': return '🌅';
      case 'snack1': return '🍎';
      case 'lunch': return '🍽️';
      case 'snack2': return '🥤';
      case 'dinner': return '🌙';
      default: return '🍽️';
    }
  };

  const getMealColor = (mealId: string) => {
    switch (mealId) {
      case 'breakfast': return 'from-yellow-400 to-orange-500';
      case 'snack1': return 'from-green-400 to-emerald-500';
      case 'lunch': return 'from-blue-400 to-indigo-500';
      case 'snack2': return 'from-purple-400 to-pink-500';
      case 'dinner': return 'from-slate-400 to-gray-500';
      default: return 'from-gray-400 to-slate-500';
    }
  };

  // If no nutrition plan is available, show empty state
  if (!displayNutritionPlan) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-8 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Utensils className="w-8 h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Nutrition Plan Assigned
              </h3>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your coach hasn't assigned a nutrition plan yet. Once they create and assign your personalized meal plan, it will appear here.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium"
            >
              🔄 Check for Updates
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Success Indicator - Show when nutrition plan is assigned */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
        <div className="flex items-center justify-center space-x-2 text-green-400">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">✅ Nutrition Plan Active - Assigned at: {new Date(displayNutritionPlan.assignedAt || displayNutritionPlan.createdAt).toLocaleString()}</span>
          <button 
            onClick={() => window.location.reload()}
            className="ml-2 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {/* Nutrition Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Daily Nutrition Targets</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {displayNutritionPlan?.dailyCalories || 0}
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {displayNutritionPlan?.macronutrients?.protein?.grams || 0}g
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">
              {displayNutritionPlan?.macronutrients?.carbohydrates?.grams || 0}g
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {displayNutritionPlan?.macronutrients?.fats?.grams || 0}g
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400">Fats</div>
          </div>
            </div>
          </div>
          
      {/* Meals by Category */}
    <div className="space-y-8">
        {(displayNutritionPlan?.mealSlots || []).map((slot, slotIndex) => (
          <div key={slot.id} className="space-y-4">
            {/* Meal Category Header */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-sm">{slotIndex + 1}</span>
              </div>
              <h2 className="text-2xl font-bold text-white">{slot.name}</h2>
              <div className="flex items-center space-x-1 px-3 py-1 bg-slate-700/50 rounded-full">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300">
                  {slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00'}
                </span>
            </div>
              <div className="text-sm text-slate-400">
                {slot.selectedMeals.length} option{slot.selectedMeals.length > 1 ? 's' : ''}
            </div>
          </div>
          
            {/* Meal Options - Horizontal Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {slot.selectedMeals.map((selectedMeal, mealIndex) => {
                const meal = selectedMeal.meal;
                const quantity = selectedMeal.quantity;
                
                // Calculate macronutrients based on quantity
                const calories = Math.round(meal.ingredients.reduce((total, ingredient) => 
                  total + (ingredient.food.kcal * ingredient.quantity * quantity / 100), 0
                ));
                const protein = Math.round(meal.ingredients.reduce((total, ingredient) => 
                  total + (ingredient.food.protein * ingredient.quantity * quantity / 100), 0
                ));
                const carbs = Math.round(meal.ingredients.reduce((total, ingredient) => 
                  total + (ingredient.food.carbs * ingredient.quantity * quantity / 100), 0
                ));
                const fats = Math.round(meal.ingredients.reduce((total, ingredient) => 
                  total + (ingredient.food.fat * ingredient.quantity * quantity / 100), 0
                ));
                
                return (
                  <div key={`${slot.id}-${meal.id}`} className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/25">
                    {/* Meal Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      
                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-red-600/90 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                          {meal.category}
                        </span>
                      </div>

                      {/* Favorite Button */}
                      <div className="absolute top-3 right-3">
            <button
                          onClick={() => toggleFavorite(meal.id)}
                          className={`p-1.5 rounded-full transition-all duration-200 ${
                            favoriteMeals.includes(meal.id)
                              ? 'bg-yellow-500/90 text-white shadow-lg'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                          }`}
                        >
                          <Star className={`w-3.5 h-3.5 ${favoriteMeals.includes(meal.id) ? 'fill-current' : ''}`} />
            </button>
          </div>

                      {/* Meal Name Overlay */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-bold text-white mb-1 line-clamp-2 group-hover:text-red-400 transition-colors duration-200">
                          {meal.name}
                        </h3>
                        <div className="flex items-center space-x-3 text-xs text-slate-200">
                          <span className="flex items-center space-x-1">
                            <Flame className="w-3 h-3" />
                            <span>{calories} cal</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Dumbbell className="w-3 h-3" />
                            <span>{protein}g</span>
                          </span>
                        </div>
          </div>
        </div>

                    {/* Meal Content */}
                    <div className="p-4">
                      {/* Macronutrients */}
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="text-center p-3 rounded-xl bg-slate-700/30 backdrop-blur-sm">
                          <div className="text-lg font-bold text-blue-400 mb-1">{protein}g</div>
                          <div className="text-xs text-slate-400 uppercase tracking-wide">Protein</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-slate-700/30 backdrop-blur-sm">
                          <div className="text-lg font-bold text-green-400 mb-1">{carbs}g</div>
                          <div className="text-xs text-slate-400 uppercase tracking-wide">Carbs</div>
                        </div>
                        <div className="text-center p-3 rounded-xl bg-slate-700/30 backdrop-blur-sm">
                          <div className="text-lg font-bold text-purple-400 mb-1">{fats}g</div>
                          <div className="text-xs text-slate-400 uppercase tracking-wide">Fats</div>
          </div>
      </div>

                      {/* Quantity */}
                      <div className="mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-slate-300">Quantity</span>
                          <span className="text-xs text-slate-400">{quantity} serving{quantity > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 mb-4">
                    <button
                          onClick={() => toggleIngredients(meal.id)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            showIngredients[meal.id]
                              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/30'
                          }`}
                        >
                          <ChefHat className="w-3 h-3" />
                          <span>Ingredients</span>
                          {showIngredients[meal.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                    <button
                          onClick={() => toggleInstructions(meal.id)}
                          className={`flex items-center space-x-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                            showInstructions[meal.id]
                              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/30'
                          }`}
                        >
                          <BookOpen className="w-3 h-3" />
                          <span>Instructions</span>
                          {showInstructions[meal.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    </button>
                      </div>
                      
                      {/* Ingredients */}
                      {showIngredients[meal.id] && (
                        <div className="mb-4 p-3 rounded-xl bg-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                          <h5 className="font-bold text-white mb-2 flex items-center space-x-1 text-sm">
                            <ChefHat className="w-3 h-3 text-green-400" />
                            <span>Ingredients</span>
                          </h5>
                          <div className="space-y-1">
                            {meal.ingredients.map((ingredient, idx) => (
                              <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50">
                                <span className="text-slate-300 font-medium text-xs">{ingredient.food.name}</span>
                                <div className="flex items-center space-x-2 text-xs text-slate-400">
                                  <span>{ingredient.quantity}g</span>
                                  <span className="text-green-400">•</span>
                                  <span>{Math.round(ingredient.food.kcal * ingredient.quantity / 100)} cal</span>
                                </div>
                              </div>
                            ))}
                          </div>
                  </div>
                )}

                      {/* Instructions */}
                      {showInstructions[meal.id] && (
                        <div className="p-3 rounded-xl bg-slate-700/30 backdrop-blur-sm border border-slate-600/30">
                          <h5 className="font-bold text-white mb-2 flex items-center space-x-1 text-sm">
                            <BookOpen className="w-3 h-3 text-green-400" />
                            <span>Cooking Instructions</span>
                          </h5>
                          <p className="text-slate-300 leading-relaxed text-sm">
                            {meal.cookingInstructions}
                          </p>
              </div>
                      )}

                      {/* Notes */}
                      {meal.notes && (
                        <div className="mt-3 bg-slate-700/30 rounded-lg p-2">
                          <p className="text-xs text-slate-400 italic">{meal.notes}</p>
                        </div>
                )}
              </div>
            </div>
          );
        })}
            </div>
          </div>
        ))}
      </div>

      {/* Supplements */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recommended Supplements</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {(displayNutritionPlan?.supplements || []).map((supplement, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-slate-700 dark:text-slate-300">{supplement}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Water Intake */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Daily Water Intake</h3>
        <div className="flex items-center space-x-4">
          <div className="text-3xl font-bold text-blue-600">{displayNutritionPlan?.waterIntake || 0}L</div>
          <div className="text-slate-600 dark:text-slate-400">per day</div>
          </div>
        <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          Stay hydrated throughout the day for optimal performance and recovery
        </div>
      </div>
    </div>
  );
};

export default ClientNutritionView;