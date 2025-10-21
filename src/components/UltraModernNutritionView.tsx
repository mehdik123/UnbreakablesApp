import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Clock,
  Flame,
  Star,
  ChefHat,
  BookOpen,
  Plus,
  Minus,
  CheckCircle,
  Dumbbell,
  Target,
  Award,
  Crown,
  Sparkles,
  Droplets,
  Wheat,
  Avocado,
  RotateCcw
} from 'lucide-react';
import { Client, NutritionPlan, Meal } from '../types';
import { OptimizedNutritionCalculator } from '../utils/optimizedNutritionCalculator';

interface UltraModernNutritionViewProps {
  client: Client;
  isDark: boolean;
  nutritionPlan?: NutritionPlan | null;
}

export const UltraModernNutritionView: React.FC<UltraModernNutritionViewProps> = ({
  client,
  isDark,
  nutritionPlan: propNutritionPlan
}) => {
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [showIngredients, setShowIngredients] = useState<{ [mealId: string]: boolean }>({});
  const [showInstructions, setShowInstructions] = useState<{ [mealId: string]: boolean }>({});
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [completedMeals, setCompletedMeals] = useState<{ [mealId: string]: boolean }>({});
  const [waterIntake, setWaterIntake] = useState(0);
  const [dailyProgress, setDailyProgress] = useState({
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0
  });

  // Use loaded nutrition plan - no fallback mock data
  const displayNutritionPlan: NutritionPlan | null = nutritionPlan;

  // Animated gradient backgrounds
  const gradientBackgrounds = [
    'from-purple-600 via-pink-600 to-blue-600',
    'from-green-600 via-teal-600 to-cyan-600',
    'from-orange-600 via-red-600 to-pink-600',
    'from-blue-600 via-indigo-600 to-purple-600',
    'from-yellow-600 via-orange-600 to-red-600',
    'from-pink-600 via-rose-600 to-red-600',
    'from-cyan-600 via-blue-600 to-indigo-600',
    'from-emerald-600 via-green-600 to-teal-600'
  ];

  // Get random gradient for meal slots
  const getRandomGradient = (index: number) => {
    return gradientBackgrounds[index % gradientBackgrounds.length];
  };

  // Meal completion handler
  const toggleMealCompletion = (mealId: string) => {
    setIsAnimating(true);
    setCompletedMeals(prev => ({
      ...prev,
      [mealId]: !prev[mealId]
    }));
    
    // Add celebration effect
    if (!completedMeals[mealId]) {
      // Create confetti effect
      const confetti = document.createElement('div');
      confetti.className = 'fixed inset-0 pointer-events-none z-50';
      confetti.innerHTML = Array.from({ length: 50 }, () => 
        `<div class="absolute w-2 h-2 bg-yellow-400 rounded-full animate-ping" style="left: ${Math.random() * 100}%; top: ${Math.random() * 100}%; animation-delay: ${Math.random() * 2}s;"></div>`
      ).join('');
      document.body.appendChild(confetti);
      
      setTimeout(() => {
        document.body.removeChild(confetti);
      }, 3000);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  };

  // Water intake handlers
  const addWater = () => {
    setWaterIntake(prev => Math.min(prev + 250, 4000));
  };

  const removeWater = () => {
    setWaterIntake(prev => Math.max(prev - 250, 0));
  };

  // Load nutrition plan from prop or localStorage on component mount
  useEffect(() => {
    const loadNutritionPlan = () => {
      console.log('🍽️ UltraModernNutritionView - Loading nutrition plan:', {
        propNutritionPlan,
        clientNutritionPlan: client.nutritionPlan,
        clientId: client.id
      });

      if (propNutritionPlan) {
        console.log('🍽️ Using prop nutrition plan:', propNutritionPlan);
        setNutritionPlan(propNutritionPlan);
        return;
      }

      if (client.nutritionPlan) {
        console.log('🍽️ Using client nutrition plan:', client.nutritionPlan);
        setNutritionPlan(client.nutritionPlan);
        return;
      }

      const savedNutritionPlan = localStorage.getItem(`nutrition_plan_${client.id}`);
      if (savedNutritionPlan) {
        try {
          const parsed = JSON.parse(savedNutritionPlan);
          console.log('🍽️ Using saved nutrition plan:', parsed);
          setNutritionPlan(parsed);
        } catch (error) {
          console.error('Error loading nutrition plan from localStorage:', error);
        }
      } else {
        console.log('🍽️ No nutrition plan found');
      }
    };

    loadNutritionPlan();
  }, [client.id, client.nutritionPlan, propNutritionPlan]);

  // Calculate daily progress using optimized calculator
  useEffect(() => {
    if (!displayNutritionPlan) {
      console.log('🍽️ No nutrition plan available for calculation');
      return;
    }

    console.log('🍽️ Calculating nutrition for plan:', displayNutritionPlan);

    // Extract all meals from nutrition plan
    const allMeals: Meal[] = [];
    const servingSizes: { [mealId: string]: number } = {};

    displayNutritionPlan.mealSlots?.forEach(slot => {
      console.log('🍽️ Processing meal slot:', slot);
      slot.selectedMeals.forEach(selectedMeal => {
        console.log('🍽️ Processing selected meal:', selectedMeal);
        allMeals.push(selectedMeal.meal);
        servingSizes[selectedMeal.meal.id] = selectedMeal.quantity;
      });
    });

    // Get completed meal IDs
    const completedMealIds = Object.keys(completedMeals).filter(
      mealId => completedMeals[mealId]
    );

    console.log('🍽️ Completed meal IDs:', completedMealIds);
    console.log('🍽️ All meals:', allMeals);
    console.log('🍽️ Serving sizes:', servingSizes);

    // Calculate nutrition using optimized calculator
    try {
      const completedNutrition = OptimizedNutritionCalculator.calculateCompletedMealsNutrition(
        allMeals,
        completedMealIds,
        servingSizes
      );

      console.log('🍽️ Calculated nutrition:', completedNutrition);
      setDailyProgress(completedNutrition);
    } catch (error) {
      console.error('🍽️ Error calculating nutrition:', error);
      setDailyProgress({ calories: 0, protein: 0, carbs: 0, fats: 0 });
    }
  }, [completedMeals, displayNutritionPlan]);

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

  // If no nutrition plan is available, show ultra-modern empty state
  if (!displayNutritionPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="relative">
            {/* Animated background */}
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-xl animate-pulse" />
            
            {/* Main card */}
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
              {/* Icon with animation */}
              <div className="relative mb-6">
                <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto animate-bounce">
                  <Utensils className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center animate-ping">
                  <Sparkles className="w-3 h-3 text-yellow-600" />
                </div>
              </div>

              <h3 className="text-2xl font-bold text-white mb-3 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                No Nutrition Plan Yet
              </h3>
              <p className="text-slate-300 mb-6 leading-relaxed">
                Your coach is crafting your personalized nutrition plan. Once it's ready, you'll see it here with beautiful meal cards and detailed instructions.
              </p>
              
              <button 
                onClick={() => window.location.reload()}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <RotateCcw className="w-4 h-4" />
                  <span>Check for Updates</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  try {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
        <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header with animated title */}
        <div className="text-center mb-8">
          <div className="relative inline-block">
            <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
              Nutrition Program
            </h1>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
              <Crown className="w-4 h-4 text-yellow-600" />
            </div>
            {/* Animated particles */}
            <div className="absolute -top-4 -left-4 w-2 h-2 bg-purple-400 rounded-full animate-ping" />
            <div className="absolute -bottom-2 -right-6 w-3 h-3 bg-pink-400 rounded-full animate-ping delay-300" />
            <div className="absolute top-1/2 -left-8 w-1 h-1 bg-blue-400 rounded-full animate-ping delay-700" />
          </div>
          <p className="text-slate-300 text-lg mt-2">Fuel your transformation with precision nutrition</p>
          <div className="flex items-center justify-center space-x-2 mt-4">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-sm text-slate-400">Live tracking enabled</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse delay-300" />
          </div>
        </div>

        {/* Ultra-modern nutrition overview cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Calories Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-red-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{dailyProgress.calories}</div>
                  <div className="text-sm text-slate-400">of {displayNutritionPlan?.dailyCalories || 0} cal</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-red-500 to-orange-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((dailyProgress.calories / (displayNutritionPlan?.dailyCalories || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Protein Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{dailyProgress.protein}g</div>
                  <div className="text-sm text-slate-400">of {displayNutritionPlan?.macronutrients?.protein?.grams || 0}g</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((dailyProgress.protein / (displayNutritionPlan?.macronutrients?.protein?.grams || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
                  <Wheat className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{dailyProgress.carbs}g</div>
                  <div className="text-sm text-slate-400">of {displayNutritionPlan?.macronutrients?.carbohydrates?.grams || 0}g</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((dailyProgress.carbs / (displayNutritionPlan?.macronutrients?.carbohydrates?.grams || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Fats Card */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-300" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-all duration-300">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                  <Avocado className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-white">{dailyProgress.fats}g</div>
                  <div className="text-sm text-slate-400">of {displayNutritionPlan?.macronutrients?.fats?.grams || 0}g</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500" 
                  style={{ width: `${Math.min((dailyProgress.fats / (displayNutritionPlan?.macronutrients?.fats?.grams || 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Water intake tracker */}
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-2xl blur-xl" />
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center">
                  <Droplets className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Hydration Tracker</h3>
                  <p className="text-slate-400">Stay hydrated for optimal performance</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">{waterIntake}ml</div>
                <div className="text-sm text-slate-400">of 4000ml</div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={removeWater}
                className="w-10 h-10 bg-slate-700 hover:bg-slate-600 rounded-full flex items-center justify-center transition-colors"
              >
                <Minus className="w-4 h-4 text-white" />
              </button>
              <div className="flex-1 bg-slate-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(waterIntake / 4000) * 100}%` }}
                />
              </div>
              <button
                onClick={addWater}
                className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
              >
                <Plus className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Meals by Category - Ultra Modern Design */}
        <div className="space-y-8">
          {(displayNutritionPlan?.mealSlots || []).map((slot, slotIndex) => (
            <div key={slot.id} className="space-y-4">
              {/* Meal Category Header with Animation */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-pink-600/20 rounded-2xl blur-xl" />
                <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 bg-gradient-to-r ${getRandomGradient(slotIndex)} rounded-2xl flex items-center justify-center shadow-lg`}>
                        <span className="text-2xl">{getMealIcon(slot.id)}</span>
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-white">{slot.name}</h2>
                        <div className="flex items-center space-x-4 text-slate-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="w-4 h-4" />
                            <span>
                              {slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Target className="w-4 h-4" />
                            <span>{slot.selectedMeals.length} meal{slot.selectedMeals.length > 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-slate-400 mb-1">Progress</div>
                      <div className="w-24 bg-slate-700/50 rounded-full h-2">
                        <div className={`bg-gradient-to-r ${getRandomGradient(slotIndex)} h-2 rounded-full w-3/4 transition-all duration-500`} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {slot.selectedMeals.map((selectedMeal, mealIndex) => {
                  const meal = selectedMeal.meal;
                  const quantity = selectedMeal.quantity;
                  const isCompleted = completedMeals[meal.id];
                  
                  // Calculate macronutrients using the optimized calculator
                  const mealNutrition = OptimizedNutritionCalculator.calculateMealNutrition(meal, quantity);
                  
                  return (
                    <div 
                      key={`${slot.id}-${meal.id}`}
                      className={`group relative transition-all duration-500 hover:scale-105 ${
                        isCompleted ? 'opacity-75' : ''
                      }`}
                    >
                      {/* Animated background */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${getRandomGradient(mealIndex)} rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-300 opacity-20`} />
                      
                      {/* Main card */}
                      <div className={`relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl overflow-hidden transition-all duration-300 group-hover:border-purple-500/50 ${
                        isCompleted ? 'ring-2 ring-green-500/50' : ''
                      }`}>
                        
                        {/* Meal Image with Overlay */}
                        <div className="relative h-48 overflow-hidden">
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                          
                          {/* Completion badge */}
                          {isCompleted && (
                            <div className="absolute top-4 right-4 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}

                          {/* Favorite button */}
                          <div className="absolute top-4 left-4">
                            <button
                              onClick={() => toggleFavorite(meal.id)}
                              className={`w-8 h-8 rounded-full backdrop-blur-sm transition-all duration-300 ${
                                favoriteMeals.includes(meal.id)
                                  ? 'bg-yellow-500/90 text-white shadow-lg'
                                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                              }`}
                            >
                              <Star className={`w-4 h-4 mx-auto ${favoriteMeals.includes(meal.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>

                          {/* Meal name overlay */}
                          <div className="absolute bottom-4 left-4 right-4">
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300">
                              {meal.name}
                            </h3>
                            <div className="flex items-center space-x-4 text-sm text-slate-200">
                              <div className="flex items-center space-x-1">
                                <Flame className="w-4 h-4" />
                                <span>{mealNutrition.calories} cal</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Dumbbell className="w-4 h-4" />
                                <span>{mealNutrition.protein}g protein</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Content */}
                        <div className="p-6">
                          {/* Macronutrients Grid */}
                          <div className="grid grid-cols-3 gap-3 mb-4">
                            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                              <div className="text-lg font-bold text-blue-400">{mealNutrition.protein}g</div>
                              <div className="text-xs text-slate-400">Protein</div>
                            </div>
                            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                              <div className="text-lg font-bold text-green-400">{mealNutrition.carbs}g</div>
                              <div className="text-xs text-slate-400">Carbs</div>
                            </div>
                            <div className="text-center p-3 bg-slate-700/30 rounded-xl">
                              <div className="text-lg font-bold text-purple-400">{mealNutrition.fat}g</div>
                              <div className="text-xs text-slate-400">Fats</div>
                            </div>
                          </div>

                          {/* Quantity */}
                          <div className="mb-4 p-3 bg-slate-700/30 rounded-xl">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-300 font-medium">Serving Size</span>
                              <span className="text-white font-bold">{quantity} serving{quantity > 1 ? 's' : ''}</span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <button
                              onClick={() => toggleIngredients(meal.id)}
                              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                showIngredients[meal.id]
                                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/30'
                              }`}
                            >
                              <ChefHat className="w-4 h-4" />
                              <span>Ingredients</span>
                            </button>
                            <button
                              onClick={() => toggleInstructions(meal.id)}
                              className={`flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                                showInstructions[meal.id]
                                  ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                  : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/30'
                              }`}
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Instructions</span>
                            </button>
                          </div>

                          {/* Complete meal button */}
                          <button
                            onClick={() => toggleMealCompletion(meal.id)}
                            className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl font-semibold transition-all duration-300 ${
                              isCompleted
                                ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                            }`}
                          >
                            {isCompleted ? (
                              <>
                                <CheckCircle className="w-4 h-4" />
                                <span>Completed</span>
                              </>
                            ) : (
                              <>
                                <Target className="w-4 h-4" />
                                <span>Mark Complete</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Ingredients Panel */}
                        {showIngredients[meal.id] && (
                          <div className="border-t border-slate-700/50 p-6 bg-slate-800/30">
                            <h5 className="font-bold text-white mb-4 flex items-center space-x-2">
                              <ChefHat className="w-4 h-4 text-green-400" />
                              <span>Ingredients</span>
                            </h5>
                            <div className="space-y-2">
                              {meal.ingredients.map((ingredient, idx) => (
                                <div key={idx} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-xl">
                                  <span className="text-slate-300 font-medium">{ingredient.food.name}</span>
                                  <div className="flex items-center space-x-3 text-sm text-slate-400">
                                    <span>{ingredient.quantity}g</span>
                                    <span className="text-green-400">•</span>
                                    <span>{Math.round(ingredient.food.kcal * ingredient.quantity / 100)} cal</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Instructions Panel */}
                        {showInstructions[meal.id] && (
                          <div className="border-t border-slate-700/50 p-6 bg-slate-800/30">
                            <h5 className="font-bold text-white mb-4 flex items-center space-x-2">
                              <BookOpen className="w-4 h-4 text-green-400" />
                              <span>Cooking Instructions</span>
                            </h5>
                            <p className="text-slate-300 leading-relaxed">
                              {meal.cookingInstructions}
                            </p>
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

        {/* Supplements Section */}
        {(displayNutritionPlan?.supplements || []).length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-2xl blur-xl" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <Award className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Recommended Supplements</h3>
                  <p className="text-slate-400">Enhance your nutrition with these supplements</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {(displayNutritionPlan?.supplements || []).map((supplement, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 bg-slate-700/30 rounded-xl hover:bg-slate-700/50 transition-colors">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span className="text-slate-300 font-medium">{supplement}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  } catch (error) {
    console.error('🍽️ Error in UltraModernNutritionView render:', error);
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-600/20 via-pink-600/20 to-orange-600/20 rounded-3xl blur-xl animate-pulse" />
            <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚠️</span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Nutrition Interface Error
              </h3>
              <p className="text-slate-300 mb-6">
                There was an error loading the nutrition interface. Please try refreshing the page.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-6 py-3 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white rounded-xl font-semibold transition-all duration-300"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

export default UltraModernNutritionView;