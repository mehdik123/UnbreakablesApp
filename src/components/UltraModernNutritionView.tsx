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
  Apple,
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
    // --- HERO SECTION REWRITE START ---
    // Find the top "hero meal" (first meal of the day or the soonest upcoming)
    const firstSlot = displayNutritionPlan?.mealSlots?.[0];
    const featuredMeal = firstSlot?.selectedMeals?.[0]?.meal || null;
    // Macros/targets, fallback to 0 if not present
    const caloriesGoal = displayNutritionPlan?.dailyCalories || 0;
    const proteinGoal = displayNutritionPlan?.macronutrients?.protein?.grams || 0;
    const carbsGoal = displayNutritionPlan?.macronutrients?.carbohydrates?.grams || 0;
    const fatsGoal = displayNutritionPlan?.macronutrients?.fats?.grams || 0;

    // --- SUPER MODERN HERO ---
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-2 md:p-4">
        {/* HERO MACRO + MEAL BANNER */}
        <div className="max-w-5xl mx-auto mb-8 relative rounded-[2.5rem] overflow-hidden shadow-2xl border border-purple-700/20 backdrop-blur-2xl">
          {/* Gradient animated overlay */}
          <div className="absolute inset-0 z-0 animate-pulse-slow bg-gradient-to-br from-purple-700/60 via-pink-700/20 to-blue-700/30" />
          {/* Featured Meal Image or fallback colored gradient */}
          <div className="relative h-52 md:h-72">
            {featuredMeal && featuredMeal.image ? (
              <img src={featuredMeal.image} alt={featuredMeal.name} className="w-full h-full object-cover object-center opacity-80" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-purple-800 via-pink-800 to-blue-900 opacity-80" />
            )}
            {/* Dark overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10 pointer-events-none" />
          </div>
          {/* HERO MACRO STATS & MEAL TITLE OVERLAY */}
          <div className="absolute left-0 bottom-0 z-10 w-full flex flex-col md:flex-row md:items-end items-center justify-between p-6 md:p-10 gap-y-4">
            {/* Macros Big Badges */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-6 mb-2 md:mb-0">
              <div className="bg-white/10 border border-red-500/30 rounded-xl flex flex-col items-center py-2 px-4 shadow-md">
                <span className="text-2xl sm:text-3xl font-bold text-orange-300 drop-shadow-lg">{dailyProgress.calories}</span>
                <span className="uppercase text-xs tracking-widest text-slate-200">Calories</span>
                <span className="text-[11px] text-slate-400">/ {caloriesGoal}</span>
              </div>
              <div className="bg-white/10 border border-blue-500/30 rounded-xl flex flex-col items-center py-2 px-4 shadow-md">
                <span className="text-2xl sm:text-3xl font-bold text-blue-300 drop-shadow-lg">{dailyProgress.protein}g</span>
                <span className="uppercase text-xs tracking-widest text-slate-200">Protein</span>
                <span className="text-[11px] text-slate-400">/ {proteinGoal}g</span>
              </div>
              <div className="bg-white/10 border border-green-500/30 rounded-xl flex flex-col items-center py-2 px-4 shadow-md">
                <span className="text-2xl sm:text-3xl font-bold text-green-300 drop-shadow-lg">{dailyProgress.carbs}g</span>
                <span className="uppercase text-xs tracking-widest text-slate-200">Carbs</span>
                <span className="text-[11px] text-slate-400">/ {carbsGoal}g</span>
              </div>
              <div className="bg-white/10 border border-purple-500/30 rounded-xl flex flex-col items-center py-2 px-4 shadow-md">
                <span className="text-2xl sm:text-3xl font-bold text-purple-300 drop-shadow-lg">{dailyProgress.fats}g</span>
                <span className="uppercase text-xs tracking-widest text-slate-200">Fats</span>
                <span className="text-[11px] text-slate-400">/ {fatsGoal}g</span>
              </div>
            </div>
            {/* FEATURED MEAL: name, quick info */}
            {featuredMeal && (
              <div className="text-right md:mr-4">
                <h2 className="text-2xl md:text-4xl font-extrabold text-white drop-shadow-xl mb-1">{featuredMeal.name}</h2>
                <div className="flex items-center justify-end gap-x-4 text-slate-300 text-xs">
                  <span className="bg-red-600/90 font-bold rounded-full px-2 py-1 mr-2">Breakfast</span>
                  <span className="flex items-center"><Flame className="inline w-4 h-4 mr-1" /> {firstSlot ? firstSlot.selectedMeals[0].quantity : ''} serving(s)</span>
                </div>
              </div>
            )}
            {/* Export PDF button */}
            <div className="md:absolute md:bottom-8 md:right-8 flex-shrink-0">
              <button
                onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                className="mr-3 md:mr-6 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-green-500 text-white font-bold shadow-lg hover:scale-105 hover:shadow-green-400/30 outline-none transition"
              >
                View Full Plan ↓
              </button>
              <button
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold shadow-lg hover:scale-105 hover:shadow-purple-400/30 outline-none transition"
                onClick={() => {
                  // Scroll down and show print dialog for current page
                  setTimeout(() => window.print(), 400);
                }}
              >
                Export PDF
              </button>
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
                      className={`group relative transition-transform duration-300 hover:scale-105 hover:shadow-2xl hover:z-10 ${
                        isCompleted ? 'opacity-65 grayscale' : ''
                      }`}
                      style={{ perspective: 1200, zIndex: 0 }}
                    >
                      {/* Animated and layered background */}
                      <div className={`absolute inset-0 bg-gradient-to-r ${getRandomGradient(mealIndex)} rounded-3xl blur-xl opacity-30`} style={{ zIndex: 1 }} />

                      {/* Main card with 3D shadow */}
                      <div className={`relative bg-slate-800/70 backdrop-blur-xl border border-slate-700/60 rounded-3xl overflow-hidden transition-all duration-300 group-hover:border-purple-500/50 ${
                        isCompleted ? 'ring-2 ring-green-400/70' : 'shadow-xl'
                      }`} style={{ zIndex: 2 }}>
                        {/* Meal image with floating macro badges */}
                        <div className="relative h-44 overflow-hidden">
                          <img
                            src={meal.image}
                            alt={meal.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-transparent to-transparent" />

                          {/* Macro floating badges */}
                          <div className="absolute bottom-3 left-3 flex flex-row gap-2 z-10">
                            <span className="flex items-center px-2 py-1 rounded-lg bg-orange-400/80 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-fadeIn">{mealNutrition.calories} cal</span>
                            <span className="flex items-center px-2 py-1 rounded-lg bg-blue-500/80 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-fadeIn">{mealNutrition.protein}g P</span>
                            <span className="flex items-center px-2 py-1 rounded-lg bg-green-500/80 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-fadeIn">{mealNutrition.carbs}g C</span>
                            <span className="flex items-center px-2 py-1 rounded-lg bg-purple-500/80 text-xs font-bold text-white shadow-xl backdrop-blur-md animate-fadeIn">{mealNutrition.fat}g F</span>
                          </div>
                          {/* Favorite button on top-left */}
                          <div className="absolute top-3 left-3">
                            <button
                              onClick={() => toggleFavorite(meal.id)}
                              className={`w-8 h-8 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg border-2 border-yellow-400/60 ${
                                favoriteMeals.includes(meal.id)
                                  ? 'bg-yellow-400/80 text-white scale-110 shadow-yellow-400/60 animate-glow'
                                  : 'bg-slate-800/80 text-slate-200 hover:bg-yellow-200/70 hover:shadow-yellow-300/40'
                              }`}
                              aria-label="Favorite Meal"
                            >
                              <Star className={`w-5 h-5 mx-auto ${favoriteMeals.includes(meal.id) ? 'fill-current' : ''}`} />
                            </button>
                          </div>
                          {/* Meal completed mark */}
                          {isCompleted && (
                            <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-green-500 flex items-center justify-center animate-bounce shadow-lg z-20">
                              <CheckCircle className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </div>
                        {/* Meal name and details */}
                        <div className="p-6">
                          <h3 className="text-xl font-extrabold text-white mb-2 group-hover:text-purple-300 transition-colors duration-300 truncate">
                            {meal.name}
                          </h3>
                          <div className="flex flex-wrap gap-2 mb-2 text-sm">
                            <span className="bg-white/10 border border-orange-400 rounded-lg px-2 py-1 text-orange-300 font-bold">{mealNutrition.calories} cal</span>
                            <span className="bg-white/10 border border-blue-400 rounded-lg px-2 py-1 text-blue-300">{mealNutrition.protein}g protein</span>
                            <span className="bg-white/10 border border-green-400 rounded-lg px-2 py-1 text-green-300">{mealNutrition.carbs}g carbs</span>
                            <span className="bg-white/10 border border-purple-400 rounded-lg px-2 py-1 text-purple-300">{mealNutrition.fat}g fat</span>
                          </div>
                          <div className="mb-4 flex justify-between">
                            <span className="text-slate-300 font-medium">Serving Size</span>
                            <span className="text-white font-bold">{quantity} serving{quantity > 1 ? 's' : ''}</span>
                          </div>

                          {/* Card action row bolder & mobile friendly */}
                          <div className="grid grid-cols-2 gap-2 md:gap-3 mb-2">
                            <button
                              onClick={() => toggleIngredients(meal.id)}
                              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-xl font-semibold transition-all duration-200 text-xs md:text-base shadow group-hover:scale-105 active:scale-100 ${
                                showIngredients[meal.id]
                                  ? 'bg-green-500/20 text-green-300 border border-green-400'
                                  : 'bg-slate-700/60 text-slate-200 border border-slate-600/20 hover:bg-green-800/20 hover:text-green-200'
                              } animate-fadeIn`}
                            >
                              <ChefHat className="w-4 h-4" />
                              <span>Ingredients</span>
                            </button>
                            <button
                              onClick={() => toggleInstructions(meal.id)}
                              className={`flex items-center justify-center space-x-2 px-3 py-2 rounded-xl font-semibold transition-all duration-200 text-xs md:text-base shadow group-hover:scale-105 active:scale-100 ${
                                showInstructions[meal.id]
                                  ? 'bg-blue-500/20 text-blue-200 border border-blue-400'
                                  : 'bg-slate-700/60 text-slate-200 border border-slate-600/20 hover:bg-blue-800/20 hover:text-blue-100'
                              } animate-fadeIn`}
                            >
                              <BookOpen className="w-4 h-4" />
                              <span>Instructions</span>
                            </button>
                          </div>
                          <button
                            onClick={() => toggleMealCompletion(meal.id)}
                            className={`w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-xl font-semibold transition-all duration-300 text-xs md:text-base shadow group-hover:scale-105 mt-1 ${
                              isCompleted
                                ? 'bg-green-600/20 text-green-400 border border-green-400 scale-100 shadow-green-400/40 animate-shake'
                                : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0 hover:from-purple-700 hover:to-pink-700 hover:shadow-purple-700/60'
                            } animate-fadeIn`}
                          >
                            {isCompleted ? (<><CheckCircle className="w-4 h-4" /><span>Completed</span></>) : (<><Target className="w-4 h-4" /><span>Mark Complete</span></>)}
                          </button>
                        </div>
                        {/* Animated panel transitions for ingredients/instructions */}
                        <div className="transition-all duration-300 ease-in-out overflow-hidden">
                          {showIngredients[meal.id] && (
                            <div className="border-t border-slate-700 p-4 bg-slate-900/80 animate-fadeIn">
                              <h5 className="font-bold text-green-300 mb-3 flex items-center space-x-2">
                                <ChefHat className="w-4 h-4 text-green-400" /> <span>Ingredients</span>
                              </h5>
                              <div className="space-y-2">
                                {meal.ingredients.map((ingredient, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-slate-800/40 p-2 rounded-lg">
                                    <span className="text-slate-100 font-medium">{ingredient.food.name}</span>
                                    <span className="text-sm text-slate-400">{ingredient.quantity}g • {Math.round(ingredient.food.kcal * ingredient.quantity / 100)} cal</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {showInstructions[meal.id] && (
                            <div className="border-t border-slate-700 p-4 bg-slate-900/80 animate-fadeIn">
                              <h5 className="font-bold text-blue-200 mb-3 flex items-center space-x-2">
                                <BookOpen className="w-4 h-4 text-blue-400" /> <span>Cooking Instructions</span>
                              </h5>
                              <p className="text-slate-200 leading-relaxed">{meal.cookingInstructions}</p>
                            </div>
                          )}
                        </div>
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