import React, { useState, useEffect } from 'react';
import {
  Utensils,
  Flame,
  Star,
  ChefHat,
  BookOpen,
  Heart,
  X,
  Dumbbell,
  Target,
  Zap,
  TrendingUp,
  Sparkles,
  Download,
  ChevronRight,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { Client, NutritionPlan, Meal, Ingredient, SelectedMeal } from '../types';
import { exportEnhancedNutritionPDF } from '../utils/enhancedPdfExport';

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
  const [currentMealIndex, setCurrentMealIndex] = useState<{ [slotId: string]: number }>({});
  const [activeMealModal, setActiveMealModal] = useState<{ slotId: string; mealIndex: number } | null>(null);
  const [viewAllSlotId, setViewAllSlotId] = useState<string | null>(null);

  // Use loaded nutrition plan - no fallback mock data
  const displayNutritionPlan: NutritionPlan | null = nutritionPlan;

  const navigateMeal = (slotId: string, direction: 'left' | 'right') => {
    const slot = displayNutritionPlan?.mealSlots?.find(s => s.id === slotId);
    if (!slot) return;

    const totalItems = slot.selectedMeals.length;
    if (totalItems <= 1) return;

    const currentIndex = currentMealIndex[slotId] || 0;
    let newIndex;

    if (direction === 'left') {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(totalItems - 1, currentIndex + 1);
    }

    if (newIndex === currentIndex) {
      return;
    }

    setCurrentMealIndex(prev => ({
      ...prev,
      [slotId]: newIndex
    }));
    if (activeMealModal?.slotId === slotId) {
      setActiveMealModal({ slotId, mealIndex: newIndex });
    }
  };

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

  // Ensure scroll positions are set correctly when nutrition plan loads - run once
  useEffect(() => {
    if (!displayNutritionPlan?.mealSlots) return;

    // Only initialize scroll positions if they haven't been set yet
    displayNutritionPlan.mealSlots.forEach(slot => {
      if (currentMealIndex[slot.id] === undefined) {
        console.log('🟢 INITIALIZING MEAL INDEX:', {
          slotId: slot.id,
          settingIndexTo: 0
        });
        setCurrentMealIndex(prev => {
          // Double-check it's still undefined to avoid race conditions
          if (prev[slot.id] === undefined) {
            return {
              ...prev,
              [slot.id]: 0
            };
          }
          return prev;
        });
      }
    });
  }, [displayNutritionPlan?.mealSlots]);

  const toggleFavorite = (mealId: string) => {
    setFavoriteMeals(prev => 
      prev.includes(mealId) 
        ? prev.filter(id => id !== mealId)
        : [...prev, mealId]
    );
  };

  const toggleIngredients = (uniqueKey: string) => {
    setShowIngredients(prev => {
      return {
        ...prev,
        [uniqueKey]: !prev[uniqueKey]
      };
    });
  };

  const toggleInstructions = (uniqueKey: string) => {
    setShowInstructions(prev => {
      return {
        ...prev,
        [uniqueKey]: !prev[uniqueKey]
      };
    });
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

  const getDisplayIngredients = (selectedMeal: SelectedMeal): Ingredient[] => {
    if (selectedMeal.customIngredients && selectedMeal.customIngredients.length > 0) {
      return selectedMeal.customIngredients;
    }
    return selectedMeal.meal.ingredients;
  };

  const getMealName = (selectedMeal: SelectedMeal): string => {
    return selectedMeal.slotOverride?.nameOverride || selectedMeal.meal.name;
  };

  const getMealImage = (selectedMeal: SelectedMeal): string => {
    return selectedMeal.slotOverride?.imageOverride || selectedMeal.meal.image;
  };

  const getCookingInstructions = (selectedMeal: SelectedMeal): string => {
    return selectedMeal.slotOverride?.instructionsOverride || selectedMeal.meal.cookingInstructions;
  };

  const getMealNutrition = (selectedMeal: SelectedMeal) => {
    const quantity = selectedMeal.quantity;
    const ingredients = getDisplayIngredients(selectedMeal);

    return {
      calories: Math.round(ingredients.reduce((total, ingredient) => total + (ingredient.food.kcal * ingredient.quantity * quantity / 100), 0)),
      protein: Math.round(ingredients.reduce((total, ingredient) => total + (ingredient.food.protein * ingredient.quantity * quantity / 100), 0)),
      carbs: Math.round(ingredients.reduce((total, ingredient) => total + (ingredient.food.carbs * ingredient.quantity * quantity / 100), 0)),
      fats: Math.round(ingredients.reduce((total, ingredient) => total + (ingredient.food.fat * ingredient.quantity * quantity / 100), 0))
    };
  };

  // Calculate daily totals based ONLY on currently selected meals
  const dailyTotals = React.useMemo(() => {
    if (!displayNutritionPlan?.mealSlots) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    return displayNutritionPlan.mealSlots.reduce(
      (acc, slot) => {
        // Get the currently selected meal index for this slot
        const selectedIndex = currentMealIndex[slot.id] || 0;
        const selectedMeal = slot.selectedMeals[selectedIndex];
        
        if (selectedMeal) {
          const meal = selectedMeal.meal;
          const quantity = selectedMeal.quantity;
          
          // Calculate macros for this specific meal
          const ingredients = getDisplayIngredients(selectedMeal);
          const calories = ingredients.reduce((total, ingredient) => 
            total + (ingredient.food.kcal * ingredient.quantity * quantity / 100), 0
          );
          const protein = ingredients.reduce((total, ingredient) => 
            total + (ingredient.food.protein * ingredient.quantity * quantity / 100), 0
          );
          const carbs = ingredients.reduce((total, ingredient) => 
            total + (ingredient.food.carbs * ingredient.quantity * quantity / 100), 0
          );
          const fats = ingredients.reduce((total, ingredient) => 
            total + (ingredient.food.fat * ingredient.quantity * quantity / 100), 0
          );
          
          acc.calories += calories;
          acc.protein += protein;
          acc.carbs += carbs;
          acc.fats += fats;
        }
        
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  }, [displayNutritionPlan, currentMealIndex]);

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!displayNutritionPlan) return;

    // Use the currently calculated totals (based on selected meals only)
    await exportEnhancedNutritionPDF({
      clientName: client.name,
      mealSlots: displayNutritionPlan.mealSlots,
      totalNutrition: dailyTotals
    });
  };

  // If no nutrition plan is available, show empty state
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
              <p className="text-slate-300 mb-6 leading-relaxed font-medium">
                Your coach is crafting your personalized nutrition plan. Once it's ready, you'll see it here with beautiful meal cards and detailed instructions.
              </p>

              <button
                onClick={() => window.location.reload()}
                className="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
              >
                <span className="relative z-10 flex items-center space-x-2">
                  <Zap className="w-4 h-4" />
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

  return (
    <div className={`min-h-screen pb-24 ${
      isDark
        ? 'bg-[radial-gradient(ellipse_at_top,#1f1147_0%,#0a1632_35%,#07142b_70%)] text-white'
        : 'bg-[radial-gradient(ellipse_at_top,#f5f7ff_0%,#ffffff_55%,#f8fbff_100%)] text-slate-900'
    }`}>
      <div className="max-w-md mx-auto px-3 pt-4 space-y-4">
        <div className={`h-2 rounded-full overflow-hidden border shadow-[0_0_20px_rgba(56,189,248,0.18)] ${
          isDark ? 'bg-slate-800/90 border-slate-700/80' : 'bg-slate-200 border-slate-300'
        }`}>
          <div
            className="h-full bg-gradient-to-r from-cyan-300 via-sky-400 to-indigo-400 rounded-full transition-all shadow-[0_0_24px_rgba(56,189,248,0.75)]"
            style={{ width: `${Math.min(100, Math.max(8, (Math.round(dailyTotals.calories) / Math.max(1, Math.round(dailyTotals.calories))) * 100))}%` }}
          />
        </div>

        <div className={`relative rounded-3xl p-4 overflow-hidden ${
          isDark
            ? 'border border-purple-400/25 bg-gradient-to-br from-[#1d1b46]/95 via-[#161d43]/95 to-[#101f3e]/90 shadow-[0_18px_50px_rgba(73,53,160,0.45)]'
            : 'border border-slate-200 bg-gradient-to-br from-white via-indigo-50/60 to-white shadow-[0_12px_35px_rgba(30,64,175,0.12)]'
        }`}>
          <div className="pointer-events-none absolute -top-20 -right-16 w-40 h-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-12 w-36 h-36 rounded-full bg-cyan-500/20 blur-3xl" />
          <div className={`flex items-center justify-between text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            <span>Daily Calories</span>
            <span>Remaining {Math.max(0, Math.round(dailyTotals.calories) - 825)}</span>
          </div>
          <div className="mt-2 flex items-end justify-between">
            <div className="text-4xl font-black">{Math.round(dailyTotals.calories)}</div>
            <button
              onClick={handleExportPDF}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-600/20 px-3 py-2 text-sm font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
            >
              <Download className="w-4 h-4" />
              Export
            </button>
          </div>
          <div className={`mt-3 text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Consumed 825 kcal • Goal {Math.round(dailyTotals.calories)} kcal</div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-slate-600/80 bg-gradient-to-br from-slate-800/85 to-slate-900/75 p-3 shadow-[0_8px_25px_rgba(14,165,233,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-400">Calories</p>
                <p className="text-2xl font-bold">{Math.round(dailyTotals.calories)}</p>
                <p className="text-xs text-slate-400">kcal</p>
              </div>
              <Flame className="w-5 h-5 text-[#ff6248]" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-600/80 bg-gradient-to-br from-slate-800/85 to-slate-900/75 p-3 shadow-[0_8px_25px_rgba(59,130,246,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-400">Protein</p>
                <p className="text-2xl font-bold">{Math.round(dailyTotals.protein)}g</p>
                <p className="text-xs text-slate-400">of goal</p>
              </div>
              <Dumbbell className="w-5 h-5 text-[#4fa4ff]" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-600/80 bg-gradient-to-br from-slate-800/85 to-slate-900/75 p-3 shadow-[0_8px_25px_rgba(16,185,129,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-400">Carbs</p>
                <p className="text-2xl font-bold">{Math.round(dailyTotals.carbs)}g</p>
                <p className="text-xs text-slate-400">of goal</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#4de1a6]" />
            </div>
          </div>
          <div className="rounded-2xl border border-slate-600/80 bg-gradient-to-br from-slate-800/85 to-slate-900/75 p-3 shadow-[0_8px_25px_rgba(245,158,11,0.16)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest text-slate-400">Fats</p>
                <p className="text-2xl font-bold">{Math.round(dailyTotals.fats)}g</p>
                <p className="text-xs text-slate-400">of goal</p>
              </div>
              <Zap className="w-5 h-5 text-[#ffd351]" />
            </div>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold">Meal Plan</h2>
          </div>
          <div className="space-y-5">
            {(displayNutritionPlan?.mealSlots || []).map((slot) => {
              const selectedIndex = currentMealIndex[slot.id] || 0;
              const selectedMeal = slot.selectedMeals[selectedIndex];
              if (!selectedMeal) return null;
              const uniqueMealKey = `${slot.id}-${selectedIndex}`;
              const nutrition = getMealNutrition(selectedMeal);
              const mealName = getMealName(selectedMeal);
              const mealImage = getMealImage(selectedMeal);

              return (
                <div key={slot.id}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">•</span>
                      <h3 className="font-semibold text-lg">{slot.name}</h3>
                      <span className="text-slate-400 text-sm">{slot.selectedMeals.length} items</span>
                    </div>
                    <button
                      onClick={() => setViewAllSlotId(slot.id)}
                      className="text-sm text-slate-300 hover:text-white inline-flex items-center gap-1"
                    >
                      View all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className={`rounded-3xl overflow-hidden ${
                    isDark
                      ? 'border border-slate-600/80 bg-gradient-to-br from-slate-900/90 to-slate-900/70 shadow-[0_15px_45px_rgba(2,6,23,0.65)]'
                      : 'border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-[0_10px_25px_rgba(2,6,23,0.08)]'
                  }`}>
                    <button
                      onClick={() => setActiveMealModal({ slotId: slot.id, mealIndex: selectedIndex })}
                      className="w-full text-left"
                    >
                      <div className="relative h-48">
                        <img src={mealImage} alt={mealName} className="w-full h-full object-cover" />
                        <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-t from-[#081327] via-[#0b1730]/35 to-transparent' : 'bg-gradient-to-t from-[#0b1324]/70 via-[#0b1324]/20 to-transparent'}`} />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-[11px] border border-white/30 bg-white/20 backdrop-blur-sm">High Protein</span>
                          <span className="px-2 py-1 rounded-full text-[11px] border border-white/30 bg-white/20 backdrop-blur-sm">Quick</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(selectedMeal.meal.id);
                          }}
                          className={`absolute right-3 top-3 w-8 h-8 rounded-full border flex items-center justify-center ${
                            favoriteMeals.includes(selectedMeal.meal.id)
                              ? 'bg-yellow-400/30 border-yellow-300 text-yellow-200'
                              : 'bg-slate-900/50 border-white/30 text-white'
                          }`}
                        >
                          <Star className={`w-4 h-4 ${favoriteMeals.includes(selectedMeal.meal.id) ? 'fill-current' : ''}`} />
                        </button>
                        <div className="absolute left-4 bottom-4 right-4">
                          <p className="text-3xl">{getMealIcon(slot.id)}</p>
                          <h4 className="text-3xl font-extrabold leading-tight">{mealName}</h4>
                          <div className="mt-1 flex items-center gap-1 text-white/80 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>5 min</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-slate-700/70 bg-slate-800/70">
                      <div className="text-center">
                        <div className="text-lg font-bold">{nutrition.calories}</div>
                        <div className="text-xs text-slate-400">Cal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{nutrition.protein}</div>
                        <div className="text-xs text-slate-400">Pro</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{nutrition.carbs}</div>
                        <div className="text-xs text-slate-400">Carb</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{nutrition.fats}</div>
                        <div className="text-xs text-slate-400">Fat</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 px-4 pb-2 -mt-1">
                      <div className="h-0.5 rounded-full bg-gradient-to-r from-rose-400/90 to-orange-400/90" />
                      <div className="h-0.5 rounded-full bg-gradient-to-r from-sky-400/90 to-blue-500/90" />
                      <div className="h-0.5 rounded-full bg-gradient-to-r from-emerald-400/90 to-teal-400/90" />
                      <div className="h-0.5 rounded-full bg-gradient-to-r from-amber-300/90 to-yellow-400/90" />
                    </div>

                    <div className="flex items-center gap-2 px-4 pb-4">
                      <button
                        onClick={() => toggleIngredients(uniqueMealKey)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${showIngredients[uniqueMealKey] ? 'bg-orange-500/20 border-orange-400 text-orange-200' : 'bg-slate-700/40 border-slate-600 text-slate-200'}`}
                      >
                        Ingredients
                      </button>
                      <button
                        onClick={() => toggleInstructions(uniqueMealKey)}
                        className={`flex-1 rounded-lg border px-3 py-2 text-sm ${showInstructions[uniqueMealKey] ? 'bg-purple-500/20 border-purple-400 text-purple-200' : 'bg-slate-700/40 border-slate-600 text-slate-200'}`}
                      >
                        Instructions
                      </button>
                    </div>

                    {showIngredients[uniqueMealKey] && (
                      <div className="px-4 pb-3">
                        <div className="space-y-2">
                          {getDisplayIngredients(selectedMeal).map((ingredient, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-800 rounded-xl px-3 py-2 text-sm">
                              <span>{ingredient.food.name}</span>
                              <span className="text-slate-400">{ingredient.quantity}g</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showInstructions[uniqueMealKey] && (
                      <div className="px-4 pb-4">
                        <div className="rounded-xl border border-slate-700 bg-slate-800/70 p-3 text-sm text-slate-200 whitespace-pre-line">
                          {getCookingInstructions(selectedMeal)}
                        </div>
                      </div>
                    )}

                    {slot.selectedMeals.length > 1 && (
                      <div className="flex items-center justify-between px-4 pb-4 gap-2">
                        <button
                          onClick={() => navigateMeal(slot.id, 'left')}
                          className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-600 bg-slate-800/80 disabled:opacity-30"
                          disabled={selectedIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-xs text-slate-400">
                          {selectedIndex + 1} / {slot.selectedMeals.length}
                        </div>
                        <button
                          onClick={() => navigateMeal(slot.id, 'right')}
                          className="flex items-center justify-center w-9 h-9 rounded-full border border-slate-600 bg-slate-800/80 disabled:opacity-30"
                          disabled={selectedIndex === slot.selectedMeals.length - 1}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {viewAllSlotId && displayNutritionPlan && (
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm p-3 flex items-end sm:items-center sm:justify-center">
            <div className="w-full max-w-md rounded-3xl border border-slate-700 bg-[#0a1731] max-h-[80vh] overflow-y-auto">
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-slate-700 bg-[#0a1731]">
                <h3 className="font-bold text-lg">
                  {displayNutritionPlan.mealSlots.find(s => s.id === viewAllSlotId)?.name} options
                </h3>
                <button onClick={() => setViewAllSlotId(null)} className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 space-y-3">
                {(displayNutritionPlan.mealSlots.find(s => s.id === viewAllSlotId)?.selectedMeals || []).map((selectedMeal, index) => {
                  const nutrition = getMealNutrition(selectedMeal);
                  const mealName = getMealName(selectedMeal);
                  return (
                    <button
                      key={`${viewAllSlotId}-${index}`}
                      onClick={() => {
                        setCurrentMealIndex(prev => ({ ...prev, [viewAllSlotId]: index }));
                        setActiveMealModal({ slotId: viewAllSlotId, mealIndex: index });
                        setViewAllSlotId(null);
                      }}
                      className="w-full rounded-2xl border border-slate-700 overflow-hidden text-left bg-slate-800/70"
                    >
                      <div className="h-28">
                        <img src={getMealImage(selectedMeal)} alt={mealName} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="font-semibold text-base">{mealName}</div>
                        <div className="mt-1 text-xs text-slate-300">
                          {nutrition.calories} cal • {nutrition.protein}g protein • {nutrition.carbs}g carbs • {nutrition.fats}g fats
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeMealModal && displayNutritionPlan && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm">
            <div className="h-full max-w-md mx-auto bg-[#07142b] border-x border-slate-700 overflow-y-auto">
              {(() => {
                const slot = displayNutritionPlan.mealSlots.find(s => s.id === activeMealModal.slotId);
                if (!slot) return null;
                const selectedMeal = slot.selectedMeals[activeMealModal.mealIndex];
                if (!selectedMeal) return null;
                const nutrition = getMealNutrition(selectedMeal);
                const mealName = getMealName(selectedMeal);
                const uniqueMealKey = `${slot.id}-${activeMealModal.mealIndex}`;
                const ingredients = getDisplayIngredients(selectedMeal);

                return (
                  <div>
                    <div className="sticky top-0 z-10 bg-[#07142b]/95 backdrop-blur border-b border-slate-700 px-4 py-3 flex items-center justify-between">
                      <h3 className="text-2xl font-bold">{mealName}</h3>
                      <button
                        onClick={() => setActiveMealModal(null)}
                        className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative h-56">
                      <img src={getMealImage(selectedMeal)} alt={mealName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#07142b] to-transparent" />
                      {slot.selectedMeals.length > 1 && (
                        <>
                          <button
                            onClick={() => navigateMeal(slot.id, 'left')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 border border-slate-500/60 flex items-center justify-center"
                            disabled={activeMealModal.mealIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigateMeal(slot.id, 'right')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-slate-900/60 border border-slate-500/60 flex items-center justify-center"
                            disabled={activeMealModal.mealIndex >= slot.selectedMeals.length - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{nutrition.calories}</div>
                          <div className="text-xs text-slate-400">Calories</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{nutrition.protein}</div>
                          <div className="text-xs text-slate-400">Protein</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{nutrition.carbs}</div>
                          <div className="text-xs text-slate-400">Carbs</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{nutrition.fats}</div>
                          <div className="text-xs text-slate-400">Fats</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => toggleIngredients(uniqueMealKey)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm inline-flex items-center justify-center gap-2 ${showIngredients[uniqueMealKey] ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200' : 'bg-slate-800 border-slate-600 text-slate-200'}`}
                        >
                          <ChefHat className="w-4 h-4" />
                          Ingredients
                        </button>
                        <button
                          onClick={() => toggleInstructions(uniqueMealKey)}
                          className={`flex-1 rounded-lg border px-3 py-2 text-sm inline-flex items-center justify-center gap-2 ${showInstructions[uniqueMealKey] ? 'bg-blue-500/20 border-blue-400 text-blue-200' : 'bg-slate-800 border-slate-600 text-slate-200'}`}
                        >
                          <BookOpen className="w-4 h-4" />
                          Instructions
                        </button>
                      </div>

                      {showIngredients[uniqueMealKey] && (
                        <div className="mb-4">
                          <h4 className="font-semibold mb-2">Ingredients</h4>
                          <div className="space-y-2">
                            {ingredients.map((ingredient, idx) => (
                              <div key={idx} className="bg-slate-800 rounded-xl p-3 flex items-center justify-between">
                                <span>{ingredient.food.name}</span>
                                <span className="text-slate-400">{ingredient.quantity}g</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {showInstructions[uniqueMealKey] && (
                        <div className="pb-6">
                          <h4 className="font-semibold mb-2">Cooking Instructions</h4>
                          <div className="rounded-xl border border-slate-700 bg-slate-800/80 p-3 text-slate-200 whitespace-pre-line">
                            {getCookingInstructions(selectedMeal)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientNutritionView;
