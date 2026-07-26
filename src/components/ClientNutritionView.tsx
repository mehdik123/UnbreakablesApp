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
  ChevronRight,
  ChevronLeft,
  Clock
} from 'lucide-react';
import { Client, NutritionPlan, Meal, Ingredient, SelectedMeal } from '../types';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import { getEffectiveSelectedMeal } from '../utils/mealSlotOverrides';
import { formatIngredientQuantityLabel } from '../utils/portionAnnotations';

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
  const { t } = useClientLocale();
  const [favoriteMeals, setFavoriteMeals] = useState<string[]>([]);
  const [showIngredients, setShowIngredients] = useState<{ [mealId: string]: boolean }>({});
  const [showInstructions, setShowInstructions] = useState<{ [mealId: string]: boolean }>({});
  const [showMacros, setShowMacros] = useState(true);
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

  // Vivid inline gradients (rendered via style so they never look washed out)
  const getMealGradient = (mealId: string): string => {
    switch (mealId) {
      case 'breakfast': return 'linear-gradient(135deg,#fbbf24,#f97316)';
      case 'snack1': return 'linear-gradient(135deg,#4ade80,#10b981)';
      case 'lunch': return 'linear-gradient(135deg,#60a5fa,#6366f1)';
      case 'snack2': return 'linear-gradient(135deg,#c084fc,#ec4899)';
      case 'dinner': return 'linear-gradient(135deg,#a855f7,#7c3aed)';
      default: return 'linear-gradient(135deg,#fb7185,#e11d48)';
    }
  };

  const getDisplayIngredients = (selectedMeal: SelectedMeal): Ingredient[] => {
    if (selectedMeal.slotOverride) {
      return getEffectiveSelectedMeal(selectedMeal).meal.ingredients;
    }
    return selectedMeal.meal.ingredients || [];
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
        // Get the currently selected meal index for this slot (swap updates this)
        const selectedIndex = currentMealIndex[slot.id] || 0;
        const selectedMeal = slot.selectedMeals[selectedIndex];
        
        if (selectedMeal) {
          const quantity = selectedMeal.quantity;
          
          // Calculate macros for this specific active meal only
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

  // If no nutrition plan is available, show empty state
  if (!displayNutritionPlan) {
    return (
      <div className="nut-shell px-3 sm:px-4 py-10">
        <div className="workout-empty">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(52,211,153,.12)' }}
          >
            <Utensils className="w-8 h-8" style={{ color: 'var(--emerald)' }} />
          </div>
          <h3 className="font-saira text-xl font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>
            {t('nut.noPlanTitle')}
          </h3>
          <p className="text-sm mb-6 leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {t('nut.noPlanBody')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-[12px] text-white text-sm font-semibold flex items-center justify-center gap-2 mx-auto active:scale-[0.97] transition-transform"
            style={{ background: 'var(--grad-red)' }}
          >
            <Zap className="w-4 h-4" />
            {t('nut.checkUpdates')}
          </button>
        </div>
      </div>
    );
  }

  const sf1 = 'var(--surface-1)';
  const sf2 = 'var(--surface-2)';
  const sf3 = 'var(--surface-3)';
  const hair = 'var(--hair)';
  const txtHi = 'var(--txt-hi)';
  const txtMid = 'var(--txt-mid)';
  const mealSlotCount = displayNutritionPlan.mealSlots?.length ?? 0;

  return (
    <div className="nut-shell">
      <div className="max-w-md mx-auto px-1 pt-1 space-y-4">
        <div className="nut-hero">
          <div className="nut-hero-glow" />
          <div className="relative flex items-start gap-3">
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--txt-lo)' }}>
                {t('nav.nutrition')}
              </div>
              <div className="font-saira font-semibold text-[18px] mt-0.5 truncate" style={{ color: 'var(--txt-hi)' }}>
                {t('home.nutritionDesc')}
              </div>
              <div className="text-[12px] mt-1" style={{ color: 'var(--txt-mid)' }}>
                {t('home.nutritionSummary', { meals: mealSlotCount, kcal: Math.round(dailyTotals.calories) })}
              </div>
            </div>
          </div>
          <div className="relative mt-3 flex items-end justify-between gap-3">
            <div>
              <div className="text-[12px]" style={{ color: 'var(--txt-mid)' }}>{t('nut.dailyCalories')}</div>
              <div className="nut-hero-stat mt-1">{Math.round(dailyTotals.calories)}</div>
              <div className="text-[12px] mt-1" style={{ color: 'var(--txt-lo)' }}>
                {t('nut.dailyTargetOnly')}
              </div>
            </div>
          </div>
        </div>

        <div>
          <button
            type="button"
            onClick={() => setShowMacros((o) => !o)}
            className="workout-week-toggle w-full"
            aria-expanded={showMacros}
            style={{ minHeight: 44 }}
          >
            <span className="font-saira font-semibold text-[14px]" style={{ color: 'var(--txt-hi)' }}>
              {showMacros ? t('nut.hideMacros') : t('nut.showMacros')}
            </span>
            <ChevronRight
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${showMacros ? 'rotate-90' : ''}`}
              style={{ color: 'var(--txt-lo)' }}
            />
          </button>
          {showMacros && (
        <div className="nut-macro-grid mt-2">
          <div className="nut-macro-tile">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: txtMid }}>{t('nut.calories')}</p>
                <p className="val">{Math.round(dailyTotals.calories)}</p>
                <p className="text-xs" style={{ color: txtMid }}>{t('nut.kcal')}</p>
              </div>
              <Flame className="w-5 h-5 nut-macro-cal" />
            </div>
          </div>
          <div className="nut-macro-tile">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: txtMid }}>{t('nut.protein')}</p>
                <p className="val">{Math.round(dailyTotals.protein)}g</p>
                <p className="text-xs" style={{ color: txtMid }}>{t('nut.ofGoal')}</p>
              </div>
              <Dumbbell className="w-5 h-5 nut-macro-pro" />
            </div>
          </div>
          <div className="nut-macro-tile">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: txtMid }}>{t('nut.carbs')}</p>
                <p className="val">{Math.round(dailyTotals.carbs)}g</p>
                <p className="text-xs" style={{ color: txtMid }}>{t('nut.ofGoal')}</p>
              </div>
              <TrendingUp className="w-5 h-5 nut-macro-carb" />
            </div>
          </div>
          <div className="nut-macro-tile">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: txtMid }}>{t('nut.fats')}</p>
                <p className="val">{Math.round(dailyTotals.fats)}g</p>
                <p className="text-xs" style={{ color: txtMid }}>{t('nut.ofGoal')}</p>
              </div>
              <Zap className="w-5 h-5 nut-macro-fat" />
            </div>
          </div>
        </div>
          )}
        </div>

        <div className="pt-1">
          <div className="workout-seclabel">
            <span>{t('nut.mealPlan')}</span>
            <span className="line" />
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
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-[0_6px_16px_-6px_rgba(0,0,0,.5)]"
                        style={{ background: getMealGradient(slot.id) }}
                      >
                        <span className="text-base leading-none">{getMealIcon(slot.id)}</span>
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-saira font-semibold text-[15px] leading-tight truncate" style={{ color: txtHi }}>{slot.name}</h3>
                        <span className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>
                          {slot.selectedMeals.length} {slot.selectedMeals.length === 1 ? t('nut.option') : t('nut.options')}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setViewAllSlotId(slot.id)}
                      className="text-xs font-semibold inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg shrink-0 active:scale-95 transition-transform"
                      style={{ background: sf2, border: `1px solid ${hair}`, color: txtMid }}
                    >
                      {t('nut.viewAll')} <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="nut-meal-card">
                    <button
                      onClick={() => setActiveMealModal({ slotId: slot.id, mealIndex: selectedIndex })}
                      className="w-full text-left"
                    >
                      <div className="relative h-48">
                        <img src={mealImage} alt={mealName} className="w-full h-full object-cover" />
                        <div className="nut-meal-overlay" />
                        <div className="absolute top-3 left-3 flex items-center gap-2">
                          <span className="px-2 py-1 rounded-full text-[11px] border border-white/30 bg-white/20 backdrop-blur-sm">{t('nut.highProtein')}</span>
                          <span className="px-2 py-1 rounded-full text-[11px] border border-white/30 bg-white/20 backdrop-blur-sm">{t('nut.quick')}</span>
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
                          <h4 className="text-2xl font-saira font-bold leading-tight text-white">{mealName}</h4>
                          <div className="mt-1 flex items-center gap-1 text-white/80 text-sm">
                            <Clock className="w-4 h-4" />
                            <span>{t('nut.minutes', { n: 5 })}</span>
                          </div>
                        </div>
                      </div>
                    </button>

                    <div className="grid grid-cols-4 gap-2 px-4 py-3" style={{ borderTop: `1px solid ${hair}`, background: sf2 }}>
                      <div className="text-center">
                        <div className="text-lg font-bold font-saira tnum nut-macro-cal">{nutrition.calories}</div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.cal')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold font-saira tnum nut-macro-pro">{nutrition.protein}</div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.pro')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold font-saira tnum nut-macro-carb">{nutrition.carbs}</div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.carb')}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold font-saira tnum nut-macro-fat">{nutrition.fats}</div>
                        <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.fat')}</div>
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
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                        style={showIngredients[uniqueMealKey]
                          ? { background: 'rgba(255,45,85,.2)', border: '1px solid rgba(255,45,85,.55)', color: 'var(--red)' }
                          : { background: 'rgba(255,45,85,.09)', border: '1px solid rgba(255,45,85,.28)', color: 'var(--red)' }}
                      >
                        <BookOpen className="w-4 h-4" />
                        {t('nut.viewIngredients')}
                      </button>
                      <button
                        onClick={() => toggleInstructions(uniqueMealKey)}
                        className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-1.5"
                        style={showInstructions[uniqueMealKey]
                          ? { background: 'rgba(91,140,255,.2)', border: '1px solid rgba(91,140,255,.55)', color: 'var(--blue)' }
                          : { background: 'rgba(91,140,255,.09)', border: '1px solid rgba(91,140,255,.28)', color: 'var(--blue)' }}
                      >
                        <ChefHat className="w-4 h-4" />
                        {t('nut.howToCook')}
                      </button>
                    </div>

                    {showIngredients[uniqueMealKey] && (
                      <div className="px-4 pb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <BookOpen className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
                          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txtMid }}>{t('nut.ingredients')}</span>
                          <span className="text-[10px] font-display tnum px-1.5 py-0.5 rounded-md" style={{ background: sf3, color: txtMid }}>
                            {getDisplayIngredients(selectedMeal).length}
                          </span>
                          <div className="flex-1 h-px" style={{ background: hair }} />
                        </div>
                        <div className="space-y-1.5">
                          {getDisplayIngredients(selectedMeal).map((ingredient, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-xl px-3 py-2 text-sm" style={{ background: sf2, border: `1px solid ${hair}` }}>
                              <span className="flex items-center gap-2.5 min-w-0" style={{ color: txtHi }}>
                                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
                                <span className="truncate">{ingredient.food.name}</span>
                              </span>
                              <span className="font-display tnum font-semibold shrink-0 text-end ms-2" style={{ color: txtMid }}>
                                {formatIngredientQuantityLabel(ingredient.food.name, ingredient.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {showInstructions[uniqueMealKey] && (
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <ChefHat className="w-3.5 h-3.5" style={{ color: 'var(--blue)' }} />
                          <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txtMid }}>{t('nut.howToCook')}</span>
                          <div className="flex-1 h-px" style={{ background: hair }} />
                        </div>
                        <div className="rounded-xl p-3.5 text-sm leading-relaxed whitespace-pre-line" style={{ background: sf2, border: `1px solid ${hair}`, color: txtMid }}>
                          {getCookingInstructions(selectedMeal)}
                        </div>
                      </div>
                    )}

                    {slot.selectedMeals.length > 1 && (
                      <div className="flex items-center justify-between px-4 pb-4 gap-2">
                        <button
                          onClick={() => navigateMeal(slot.id, 'left')}
                          className="flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-30"
                          style={{ background: sf2, border: `1px solid ${hair}`, color: txtHi }}
                          disabled={selectedIndex === 0}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <div className="text-center leading-tight">
                          <div className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: txtMid }}>{t('nut.swapMeal')}</div>
                          <div className="text-xs font-display tnum" style={{ color: txtMid }}>
                            {selectedIndex + 1} / {slot.selectedMeals.length}
                          </div>
                        </div>
                        <button
                          onClick={() => navigateMeal(slot.id, 'right')}
                          className="flex items-center justify-center w-9 h-9 rounded-full disabled:opacity-30"
                          style={{ background: sf2, border: `1px solid ${hair}`, color: txtHi }}
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
            <div className="w-full max-w-md rounded-3xl max-h-[80vh] overflow-y-auto nut-modal-surface">
              <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 nut-modal-header">
                <h3 className="font-bold text-lg font-display" style={{ color: txtHi }}>
                  {t('nut.slotOptions', { name: displayNutritionPlan.mealSlots.find(s => s.id === viewAllSlotId)?.name || '' })}
                </h3>
                <button onClick={() => setViewAllSlotId(null)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: sf2, border: `1px solid ${hair}`, color: txtHi }}>
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
                      className="w-full rounded-2xl overflow-hidden text-left"
                      style={{ background: sf2, border: `1px solid ${hair}` }}
                    >
                      <div className="h-28">
                        <img src={getMealImage(selectedMeal)} alt={mealName} className="w-full h-full object-cover" />
                      </div>
                      <div className="p-3">
                        <div className="font-semibold text-base font-display" style={{ color: txtHi }}>{mealName}</div>
                        <div className="mt-1 text-xs" style={{ color: txtMid }}>
                          {t('nut.mealSummary', { cal: nutrition.calories, protein: nutrition.protein, carbs: nutrition.carbs, fats: nutrition.fats })}
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
            <div className="h-full max-w-md mx-auto overflow-y-auto nut-modal-surface" style={{ borderLeft: `1px solid ${hair}`, borderRight: `1px solid ${hair}` }}>
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
                    <div className="sticky top-0 z-10 px-4 py-3 flex items-center justify-between nut-modal-header">
                      <h3 className="text-xl font-saira font-bold" style={{ color: txtHi }}>{mealName}</h3>
                      <button
                        onClick={() => setActiveMealModal(null)}
                        className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: sf2, border: `1px solid ${hair}`, color: txtHi }}
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="relative h-56">
                      <img src={getMealImage(selectedMeal)} alt={mealName} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t to-transparent" style={{ backgroundImage: `linear-gradient(to top, ${sf1}, transparent)` }} />
                      {slot.selectedMeals.length > 1 && (
                        <>
                          <button
                            onClick={() => navigateMeal(slot.id, 'left')}
                            className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--glass)', border: `1px solid ${hair}`, color: txtHi }}
                            disabled={activeMealModal.mealIndex === 0}
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => navigateMeal(slot.id, 'right')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center"
                            style={{ background: 'var(--glass)', border: `1px solid ${hair}`, color: txtHi }}
                            disabled={activeMealModal.mealIndex >= slot.selectedMeals.length - 1}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>

                    <div className="px-4 py-4">
                      <div className="grid grid-cols-4 gap-2 mb-4">
                        <div className="rounded-2xl py-3 text-center" style={{ background: sf2, border: `1px solid ${hair}` }}>
                          <div className="text-2xl font-bold font-saira tnum nut-macro-cal">{nutrition.calories}</div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.calories')}</div>
                        </div>
                        <div className="rounded-2xl py-3 text-center" style={{ background: sf2, border: `1px solid ${hair}` }}>
                          <div className="text-2xl font-bold font-saira tnum nut-macro-pro">{nutrition.protein}</div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.protein')}</div>
                        </div>
                        <div className="rounded-2xl py-3 text-center" style={{ background: sf2, border: `1px solid ${hair}` }}>
                          <div className="text-2xl font-bold font-saira tnum nut-macro-carb">{nutrition.carbs}</div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.carbs')}</div>
                        </div>
                        <div className="rounded-2xl py-3 text-center" style={{ background: sf2, border: `1px solid ${hair}` }}>
                          <div className="text-2xl font-bold font-saira tnum nut-macro-fat">{nutrition.fats}</div>
                          <div className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: txtMid }}>{t('nut.fats')}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <button
                          onClick={() => toggleIngredients(uniqueMealKey)}
                          className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                          style={showIngredients[uniqueMealKey]
                            ? { background: 'rgba(255,45,85,.2)', border: '1px solid rgba(255,45,85,.55)', color: 'var(--red)' }
                            : { background: 'rgba(255,45,85,.09)', border: '1px solid rgba(255,45,85,.28)', color: 'var(--red)' }}
                        >
                          <BookOpen className="w-4 h-4" />
                          {t('nut.viewIngredients')}
                        </button>
                        <button
                          onClick={() => toggleInstructions(uniqueMealKey)}
                          className="flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold inline-flex items-center justify-center gap-2 transition-colors"
                          style={showInstructions[uniqueMealKey]
                            ? { background: 'rgba(91,140,255,.2)', border: '1px solid rgba(91,140,255,.55)', color: 'var(--blue)' }
                            : { background: 'rgba(91,140,255,.09)', border: '1px solid rgba(91,140,255,.28)', color: 'var(--blue)' }}
                        >
                          <ChefHat className="w-4 h-4" />
                          {t('nut.howToCook')}
                        </button>
                      </div>

                      {showIngredients[uniqueMealKey] && (
                        <div className="mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <BookOpen className="w-4 h-4" style={{ color: 'var(--red)' }} />
                            <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txtMid }}>{t('nut.ingredients')}</span>
                            <span className="text-[10px] font-display tnum px-1.5 py-0.5 rounded-md" style={{ background: sf3, color: txtMid }}>{ingredients.length}</span>
                            <div className="flex-1 h-px" style={{ background: hair }} />
                          </div>
                          <div className="space-y-1.5">
                            {ingredients.map((ingredient, idx) => (
                              <div key={idx} className="rounded-xl p-3 flex items-center justify-between" style={{ background: sf2, border: `1px solid ${hair}` }}>
                                <span className="flex items-center gap-2.5 min-w-0" style={{ color: txtHi }}>
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
                                  <span className="truncate">{ingredient.food.name}</span>
                                </span>
                                <span className="font-display tnum font-semibold shrink-0 text-end ms-2" style={{ color: txtMid }}>
                                {formatIngredientQuantityLabel(ingredient.food.name, ingredient.quantity)}
                              </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {showInstructions[uniqueMealKey] && (
                        <div className="pb-6">
                          <div className="flex items-center gap-2 mb-2">
                            <ChefHat className="w-4 h-4" style={{ color: 'var(--blue)' }} />
                            <span className="text-[11px] uppercase tracking-wider font-bold" style={{ color: txtMid }}>{t('nut.howToCook')}</span>
                            <div className="flex-1 h-px" style={{ background: hair }} />
                          </div>
                          <div className="rounded-xl p-3.5 leading-relaxed whitespace-pre-line text-sm" style={{ background: sf2, border: `1px solid ${hair}`, color: txtMid }}>
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
