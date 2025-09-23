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
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

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

  // Use loaded nutrition plan - no fallback mock data
  const displayNutritionPlan: NutritionPlan | null = nutritionPlan;

  // Create individual scroll refs for each meal slot
  const [scrollRefs, setScrollRefs] = useState<{ [slotId: string]: React.RefObject<HTMLDivElement> }>({});

  // Get or create scroll ref for a slot
  const getScrollRef = (slotId: string) => {
    if (!scrollRefs[slotId]) {
      const newRef = React.createRef<HTMLDivElement>();
      setScrollRefs(prev => ({
        ...prev,
        [slotId]: newRef
      }));
      return newRef;
    }
    return scrollRefs[slotId];
  };

  // Scroll function for meals
  const scrollMeal = (slotId: string, direction: 'left' | 'right') => {
    const slot = displayNutritionPlan?.mealSlots?.find(s => s.id === slotId);
    if (!slot) return;

    const totalItems = slot.selectedMeals.length;
    if (totalItems <= 1) return;
    
    // Get current meal index from state
    const currentIndex = currentMealIndex[slotId] || 0;
    let newIndex;
    
    if (direction === 'left') {
      newIndex = Math.max(0, currentIndex - 1);
    } else {
      newIndex = Math.min(totalItems - 1, currentIndex + 1);
    }
    
    // Don't scroll if we're already at the boundary
    if (newIndex === currentIndex) {
      console.log(`🚫 Already at boundary - ${direction} button disabled`);
      return;
    }
    
    console.log(`🔄 Switching to meal ${newIndex + 1} for slot ${slotId}:`, {
      currentIndex,
      newIndex,
      totalItems,
      mealName: slot.selectedMeals[newIndex]?.meal?.name
    });
    
    // Update meal index
    setCurrentMealIndex(prev => ({
      ...prev,
      [slotId]: newIndex
    }));
    
    console.log(`✅ Switched to meal: ${slot.selectedMeals[newIndex]?.meal?.name}`);
  };

  // Update current meal index on scroll
  const updateCurrentMealIndex = (slotId: string, scrollRef: React.RefObject<HTMLDivElement>) => {
    if (!scrollRef.current) return;
    
    const container = scrollRef.current;
    const items = container.querySelectorAll('[data-scroll-item]');
    const containerWidth = container.clientWidth;
    const currentScroll = container.scrollLeft;
    
    const currentIndex = Math.round(currentScroll / containerWidth);
    setCurrentMealIndex(prev => ({
      ...prev,
      [slotId]: Math.min(currentIndex, items.length - 1)
    }));
  };

  // Add touch support for each meal slot
  useEffect(() => {
    if (!displayNutritionPlan?.mealSlots) return;

    const addTouchSupport = (slotId: string) => {
      const scrollRef = getScrollRef(slotId);
      if (!scrollRef.current) return;

      const container = scrollRef.current;
      let startX = 0;
      let startScrollLeft = 0;
      let isDragging = false;

      const handleTouchStart = (e: TouchEvent) => {
        startX = e.touches[0].clientX;
        startScrollLeft = container.scrollLeft;
        isDragging = true;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        const currentX = e.touches[0].clientX;
        const diff = startX - currentX;
        container.scrollLeft = startScrollLeft + diff;
      };

      const handleTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        
        // Snap to nearest meal
        const containerWidth = container.clientWidth;
        const currentScroll = container.scrollLeft;
        const items = container.querySelectorAll('[data-scroll-item]');
        const totalItems = items.length;
        const currentIndex = Math.round(currentScroll / containerWidth);
        const clampedIndex = Math.min(Math.max(0, currentIndex), totalItems - 1);
        const newScroll = clampedIndex * containerWidth;
        
        container.scrollTo({
          left: newScroll,
          behavior: 'smooth'
        });

        // Update meal index immediately
        setCurrentMealIndex(prev => ({
          ...prev,
          [slotId]: clampedIndex
        }));
      };

      const handleScroll = () => {
        const containerWidth = container.clientWidth;
        const currentScroll = container.scrollLeft;
        const items = container.querySelectorAll('[data-scroll-item]');
        const totalItems = items.length;
        const currentIndex = Math.round(currentScroll / containerWidth);
        const clampedIndex = Math.min(Math.max(0, currentIndex), totalItems - 1);
        
        setCurrentMealIndex(prev => ({
          ...prev,
          [slotId]: clampedIndex
        }));
      };

      container.addEventListener('touchstart', handleTouchStart, { passive: false });
      container.addEventListener('touchmove', handleTouchMove, { passive: false });
      container.addEventListener('touchend', handleTouchEnd);
      container.addEventListener('scroll', handleScroll);

      return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
        container.removeEventListener('touchend', handleTouchEnd);
        container.removeEventListener('scroll', handleScroll);
      };
    };

    // Add touch support to all slots
    const cleanupFunctions = displayNutritionPlan.mealSlots.map(slot => addTouchSupport(slot.id));

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup && cleanup());
    };
  }, [displayNutritionPlan?.mealSlots]);

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

  // Ensure scroll positions are set correctly when nutrition plan loads
  useEffect(() => {
    if (!displayNutritionPlan?.mealSlots) return;

    // Only reset scroll positions if they haven't been set yet
    displayNutritionPlan.mealSlots.forEach(slot => {
      const scrollRef = getScrollRef(slot.id);
      if (scrollRef.current && currentMealIndex[slot.id] === undefined) {
        scrollRef.current.scrollLeft = 0;
        setCurrentMealIndex(prev => ({
          ...prev,
          [slot.id]: 0
        }));
      }
    });
  }, [displayNutritionPlan?.mealSlots]);

  // Prevent scroll position from being reset on re-renders
  useEffect(() => {
    if (!displayNutritionPlan?.mealSlots) return;

    displayNutritionPlan.mealSlots.forEach(slot => {
      const scrollRef = getScrollRef(slot.id);
      if (scrollRef.current && currentMealIndex[slot.id] !== undefined) {
        const expectedScroll = currentMealIndex[slot.id] * scrollRef.current.clientWidth;
        if (Math.abs(scrollRef.current.scrollLeft - expectedScroll) > 10) {
          console.log(`🔧 Restoring scroll position for slot ${slot.id}: ${expectedScroll}`);
          scrollRef.current.scrollLeft = expectedScroll;
        }
      }
    });
  }, [currentMealIndex]);

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
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-xl p-4 sm:p-6 lg:p-8 text-center">
          <div className="flex flex-col items-center space-y-3 sm:space-y-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-200 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <Utensils className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                No Nutrition Plan Assigned
              </h3>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                Your coach hasn't assigned a nutrition plan yet. Once they create and assign your personalized meal plan, it will appear here.
              </p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-3 sm:px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-xs sm:text-sm font-medium"
            >
              🔄 Check for Updates
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Success Indicator - Show when nutrition plan is assigned */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-2 sm:p-3 text-center">
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-2 text-green-400">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs sm:text-sm font-medium">✅ Nutrition Plan Active</span>
          </div>
          <div className="text-xs sm:text-sm text-green-300">
            Assigned: {new Date(displayNutritionPlan.assignedAt || displayNutritionPlan.createdAt).toLocaleDateString()}
          </div>
          <button 
            onClick={() => window.location.reload()}
            className="px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>
      
      {/* Nutrition Overview */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 sm:mb-4">Daily Nutrition Targets</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">
              {displayNutritionPlan?.dailyCalories || 0}
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Calories</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-blue-600">
              {displayNutritionPlan?.macronutrients?.protein?.grams || 0}g
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Protein</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-green-600">
              {displayNutritionPlan?.macronutrients?.carbohydrates?.grams || 0}g
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Carbs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl sm:text-3xl font-bold text-purple-600">
              {displayNutritionPlan?.macronutrients?.fats?.grams || 0}g
            </div>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">Fats</div>
          </div>
        </div>
      </div>
          
      {/* Meals by Category */}
    <div className="space-y-6 sm:space-y-8">
        {(displayNutritionPlan?.mealSlots || []).map((slot, slotIndex) => (
          <div key={slot.id} className="space-y-3 sm:space-y-4">
            {/* Meal Category Header */}
            <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs sm:text-sm">{slotIndex + 1}</span>
                </div>
                <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">{slot.name}</h2>
              </div>
              <div className="flex items-center space-x-2 sm:space-x-3">
                <div className="flex items-center space-x-1 px-2 sm:px-3 py-1 bg-slate-700/50 rounded-full">
                  <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-slate-400" />
                  <span className="text-xs sm:text-sm text-slate-300">
                    {slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00'}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-slate-400">
                  {slot.selectedMeals.length > 1 ? (
                    <span>
                      {((currentMealIndex[slot.id] || 0) + 1)} of {slot.selectedMeals.length} meals
                    </span>
                  ) : (
                    <span>1 meal</span>
                  )}
                </div>
              </div>
            </div>
          
            {/* Meal Options - Single Meal Display */}
            <div className="relative">
              <div 
                ref={getScrollRef(slot.id)}
                className="overflow-x-auto scrollbar-hide horizontal-scroll"
              >
                <div className="flex space-x-0 pb-2">
                  {slot.selectedMeals.map((selectedMeal, mealIndex) => {
                const meal = selectedMeal.meal;
                const quantity = selectedMeal.quantity;
                const currentIndex = currentMealIndex[slot.id] || 0;
                const isVisible = mealIndex === currentIndex;
                
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
                
                console.log(`🍽️ Rendering meal ${mealIndex + 1} for slot ${slot.id}:`, {
                  mealName: meal.name,
                  mealId: meal.id,
                  currentMealIndex: currentIndex,
                  shouldBeVisible: isVisible
                });

                // Only render the visible meal
                if (!isVisible) {
                  return null;
                }

                return (
                  <div 
                    key={`${slot.id}-${meal.id}`} 
                    data-scroll-item
                    className="group bg-slate-800/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/25 w-full min-w-full flex-shrink-0"
                  >
                    {/* Meal Image */}
                    <div className="relative h-32 sm:h-40 overflow-hidden">
                      <img
                        src={meal.image}
                        alt={meal.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                      
                      {/* Favorite Button */}
                      <div className="absolute top-2 right-2">
                        <button
                          onClick={() => toggleFavorite(meal.id)}
                          className={`p-1 rounded-full transition-all duration-200 ${
                            favoriteMeals.includes(meal.id)
                              ? 'bg-yellow-500/90 text-white shadow-lg'
                              : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                          }`}
                        >
                          <Star className={`w-3 h-3 ${favoriteMeals.includes(meal.id) ? 'fill-current' : ''}`} />
                        </button>
                      </div>

                      {/* Meal Name Overlay */}
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="text-sm font-bold text-white mb-1 line-clamp-2 group-hover:text-red-400 transition-colors duration-200">
                          {meal.name}
                        </h3>
                        <div className="flex items-center space-x-2 text-xs text-slate-200">
                          <span className="flex items-center space-x-1">
                            <Flame className="w-2.5 h-2.5" />
                            <span>{calories} cal</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Dumbbell className="w-2.5 h-2.5" />
                            <span>{protein}g</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Meal Content */}
                    <div className="p-4 sm:p-6">
                      {/* Macronutrients - Full Width */}
                      <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
                        <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700/30">
                          <div className="text-lg sm:text-xl font-bold text-blue-400">{protein}g</div>
                          <div className="text-xs sm:text-sm text-slate-400">Protein</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700/30">
                          <div className="text-lg sm:text-xl font-bold text-green-400">{carbs}g</div>
                          <div className="text-xs sm:text-sm text-slate-400">Carbs</div>
                        </div>
                        <div className="text-center p-3 sm:p-4 rounded-lg bg-slate-700/30">
                          <div className="text-lg sm:text-xl font-bold text-purple-400">{fats}g</div>
                          <div className="text-xs sm:text-sm text-slate-400">Fats</div>
                        </div>
                      </div>

                      {/* Quantity */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300">Quantity</span>
                          <span className="text-slate-400">{quantity} serving{quantity > 1 ? 's' : ''}</span>
                        </div>
                      </div>

                      {/* Action Buttons - Full Width */}
                      <div className="flex space-x-2 sm:space-x-3">
                        <button
                          onClick={() => toggleIngredients(meal.id)}
                          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${
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
                          className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-1 ${
                            showInstructions[meal.id]
                              ? 'bg-green-600/20 text-green-400 border border-green-600/30'
                              : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/30'
                          }`}
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Instructions</span>
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
              
              {/* Scroll buttons for meals */}
              {slot.selectedMeals.length > 1 && (
                <>
                  <button
                    onClick={() => scrollMeal(slot.id, 'left')}
                    className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-6 h-6 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200 z-10"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => scrollMeal(slot.id, 'right')}
                    className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-6 h-6 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200 z-10"
                  >
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </>
              )}
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