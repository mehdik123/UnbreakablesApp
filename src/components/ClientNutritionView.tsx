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
  Dumbbell,
  Target,
  Award,
  Crown,
  Sparkles,
  Zap,
  TrendingUp,
  Download
} from 'lucide-react';
import { Client, NutritionPlan, Meal, Food } from '../types';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
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

  // Handle PDF export
  const handleExportPDF = async () => {
    if (!displayNutritionPlan) return;

    // Calculate total nutrition
    const totalNutrition = displayNutritionPlan.mealSlots.reduce(
      (acc, slot) => {
        slot.selectedMeals.forEach(meal => {
          acc.calories += meal.totalCalories || 0;
          acc.protein += meal.totalProtein || 0;
          acc.carbs += meal.totalCarbs || 0;
          acc.fats += meal.totalFats || 0;
        });
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );

    await exportEnhancedNutritionPDF({
      clientName: client.name,
      mealSlots: displayNutritionPlan.mealSlots,
      totalNutrition
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Compact Mobile Header */}
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-700/50 p-4 md:p-8 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-16 md:-translate-y-32 translate-x-16 md:translate-x-32"></div>
            <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-gradient-to-tr from-orange-500/20 to-yellow-500/20 rounded-full translate-y-12 md:translate-y-24 -translate-x-12 md:-translate-x-24"></div>
            <div className="absolute top-1/2 left-1/2 w-16 md:w-32 h-16 md:h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full -translate-x-8 md:-translate-x-16 -translate-y-8 md:-translate-y-16"></div>
          </div>

          <div className="relative text-center">
            <div className="flex items-center justify-center mb-3 md:mb-6">
              <div className="relative w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl">
                <Utensils className="w-6 h-6 md:w-10 md:h-10 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl md:rounded-3xl blur-lg opacity-50"></div>
              </div>
            </div>
            <h1 className="text-2xl md:text-6xl font-black text-white mb-2 md:mb-4 bg-gradient-to-r from-white via-green-100 to-emerald-100 bg-clip-text text-transparent">
              NUTRITION CENTER
            </h1>
            <p className="text-slate-300 text-sm md:text-xl font-semibold mb-4 md:mb-6">Fuel your transformation with precision nutrition</p>
            
            {/* Compact Quick Stats */}
            <div className="flex justify-center space-x-4 md:space-x-8 mb-4 md:mb-6">
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-green-400">{displayNutritionPlan?.mealSlots?.length || 0}</div>
                <div className="text-slate-400 text-xs md:text-sm font-medium">Meal Times</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-orange-400">{displayNutritionPlan?.dailyCalories || 0}</div>
                <div className="text-slate-400 text-xs md:text-sm font-medium">Daily Calories</div>
              </div>
              <div className="text-center">
                <div className="text-lg md:text-2xl font-bold text-blue-400">{displayNutritionPlan?.waterIntake || 0}L</div>
                <div className="text-slate-400 text-xs md:text-sm font-medium">Water Goal</div>
              </div>
            </div>

            {/* Export PDF Button */}
            <div className="flex justify-center">
              <button
                onClick={handleExportPDF}
                className="group relative inline-flex items-center space-x-2 md:space-x-3 px-4 md:px-8 py-2 md:py-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-xl md:rounded-2xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/25 text-sm md:text-lg"
              >
                <Download className="w-4 h-4 md:w-5 md:h-5" />
                <span>Export PDF</span>
              </button>
            </div>
          </div>
        </div>
      
        {/* Compact Mobile Nutrition Overview Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-6 mb-4 md:mb-8">
          {/* Calories Card */}
          <div className="group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-105 hover:shadow-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl hover:border-red-500/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-orange-500/20 to-red-500/20 rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative p-3 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="relative w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Flame className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl md:rounded-2xl blur-md opacity-30"></div>
                </div>
                <div className="text-right">
                  <div className="text-lg md:text-2xl font-black text-white">{displayNutritionPlan?.dailyCalories || 0}</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Calories</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 md:h-2">
                <div className="bg-gradient-to-r from-red-500 to-orange-500 h-1.5 md:h-2 rounded-full w-3/4 transition-all duration-500"></div>
              </div>
            </div>
          </div>

          {/* Protein Card */}
          <div className="group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-105 hover:shadow-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl hover:border-blue-500/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative p-3 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="relative w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Dumbbell className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl blur-md opacity-30"></div>
                </div>
                <div className="text-right">
                  <div className="text-lg md:text-2xl font-black text-white">{displayNutritionPlan?.macronutrients?.protein?.grams || 0}g</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Protein</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 md:h-2">
                <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-1.5 md:h-2 rounded-full w-4/5 transition-all duration-500"></div>
              </div>
            </div>
          </div>

          {/* Carbs Card */}
          <div className="group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-105 hover:shadow-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl hover:border-green-500/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/20 to-emerald-500/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-green-500/20 rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative p-3 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="relative w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Target className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-2xl blur-md opacity-30"></div>
                </div>
                <div className="text-right">
                  <div className="text-lg md:text-2xl font-black text-white">{displayNutritionPlan?.macronutrients?.carbohydrates?.grams || 0}g</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Carbs</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 md:h-2">
                <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-1.5 md:h-2 rounded-full w-2/3 transition-all duration-500"></div>
              </div>
            </div>
          </div>

          {/* Fats Card */}
          <div className="group relative overflow-hidden rounded-2xl border transition-all duration-500 hover:scale-105 hover:shadow-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl hover:border-purple-500/50">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full -translate-y-16 translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 rounded-full translate-y-12 -translate-x-12"></div>
            </div>

            <div className="relative p-3 md:p-6">
              <div className="flex items-center justify-between mb-2 md:mb-4">
                <div className="relative w-8 h-8 md:w-12 md:h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg">
                  <Heart className="w-4 h-4 md:w-6 md:h-6 text-white" />
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl blur-md opacity-30"></div>
                </div>
                <div className="text-right">
                  <div className="text-lg md:text-2xl font-black text-white">{displayNutritionPlan?.macronutrients?.fats?.grams || 0}g</div>
                  <div className="text-xs text-slate-400 font-bold uppercase tracking-wider">Fats</div>
                </div>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 md:h-2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-1.5 md:h-2 rounded-full w-1/2 transition-all duration-500"></div>
              </div>
            </div>
          </div>
        </div>
          
      {/* Meals by Category */}
    <div className="space-y-6 sm:space-y-8">
        {(displayNutritionPlan?.mealSlots || []).map((slot, slotIndex) => (
          <div key={slot.id} className="space-y-3 sm:space-y-4">
            {/* Mobile-Optimized Meal Category Header */}
            <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 backdrop-blur-xl rounded-2xl md:rounded-3xl border border-slate-700/50 p-4 md:p-6 shadow-2xl">
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-16 md:w-32 h-16 md:h-32 bg-gradient-to-br from-orange-500/20 to-yellow-500/20 rounded-full -translate-y-8 md:-translate-y-16 translate-x-8 md:translate-x-16"></div>
                <div className="absolute bottom-0 left-0 w-12 md:w-24 h-12 md:h-24 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full translate-y-6 md:translate-y-12 -translate-x-6 md:-translate-x-12"></div>
              </div>

              <div className="relative">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div className="flex items-center space-x-3 md:space-x-4">
                    <div className={`relative w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br ${getMealColor(slot.id)} rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl`}>
                      <span className="text-lg md:text-2xl">{getMealIcon(slot.id)}</span>
                      <div className={`absolute inset-0 bg-gradient-to-br ${getMealColor(slot.id)} rounded-xl md:rounded-2xl blur-lg opacity-50`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-xl md:text-3xl font-black text-white mb-1 md:mb-2 bg-gradient-to-r from-white via-orange-100 to-yellow-100 bg-clip-text text-transparent">
                        {slot.name}
                      </h2>
                      <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-4 md:space-x-6 text-slate-300">
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <Clock className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                          <span className="font-semibold text-sm md:text-lg">
                            {slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1 md:space-x-2">
                          <Target className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                          <span className="font-semibold text-sm md:text-lg">{slot.selectedMeals.length} meal{slot.selectedMeals.length > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
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
                    className="group relative transition-all duration-500 md:hover:scale-105 w-full min-w-full flex-shrink-0 touch-pan-y"
                  >
                    {/* Enhanced Modern Meal Card */}
                    <div className="group relative overflow-hidden rounded-3xl border transition-all duration-500 md:hover:scale-105 md:hover:shadow-2xl border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl md:hover:border-slate-600/50">
                      {/* Background Pattern */}
                      <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-12 -translate-x-12"></div>
                      </div>

                      {/* Mobile-Optimized Meal Image with Enhanced Overlay */}
                      <div className="relative h-48 md:h-56 overflow-hidden">
                        <img
                          src={meal.image}
                          alt={meal.name}
                          className="w-full h-full object-cover md:group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/20 to-transparent" />
                        
                        {/* Mobile-Optimized Favorite button */}
                        <div className="absolute top-3 md:top-4 left-3 md:left-4">
                          <button
                            onClick={() => toggleFavorite(meal.id)}
                            className={`w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl backdrop-blur-sm transition-all duration-300 shadow-lg ${
                              favoriteMeals.includes(meal.id)
                                ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-yellow-500/50'
                                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
                            }`}
                          >
                            <Star className={`w-4 h-4 md:w-5 md:h-5 mx-auto ${favoriteMeals.includes(meal.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Mobile-Optimized Meal name overlay */}
                        <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 right-3 md:right-4">
                          <h3 className="text-lg md:text-2xl font-black text-white mb-2 md:mb-3 md:group-hover:text-orange-300 transition-colors duration-300 leading-tight">
                            {meal.name}
                          </h3>
                          <div className="flex items-center space-x-3 md:space-x-6 text-white/90">
                            <div className="flex items-center space-x-1 md:space-x-2">
                              <Flame className="w-4 h-4 md:w-5 md:h-5 text-orange-400" />
                              <span className="font-bold text-sm md:text-lg">{calories} cal</span>
                            </div>
                            <div className="flex items-center space-x-1 md:space-x-2">
                              <Dumbbell className="w-4 h-4 md:w-5 md:h-5 text-blue-400" />
                              <span className="font-bold text-sm md:text-lg">{protein}g protein</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Mobile-Optimized Card Content */}
                      <div className="relative p-4 md:p-6">
                        {/* Ultra Compact Macronutrients Grid */}
                        <div className="grid grid-cols-4 gap-1.5 mb-3">
                          <div className="text-center p-2 bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-lg border border-orange-500/20">
                            <Flame className="w-3 h-3 text-orange-400 mx-auto mb-0.5" />
                            <div className="text-xs font-bold text-white">{calories}</div>
                            <div className="text-[9px] text-orange-400 font-medium">Cal</div>
                          </div>
                          <div className="text-center p-2 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20">
                            <Target className="w-3 h-3 text-blue-400 mx-auto mb-0.5" />
                            <div className="text-xs font-bold text-white">{protein}g</div>
                            <div className="text-[9px] text-blue-400 font-medium">Pro</div>
                          </div>
                          <div className="text-center p-2 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-lg border border-green-500/20">
                            <TrendingUp className="w-3 h-3 text-green-400 mx-auto mb-0.5" />
                            <div className="text-xs font-bold text-white">{carbs}g</div>
                            <div className="text-[9px] text-green-400 font-medium">Carb</div>
                          </div>
                          <div className="text-center p-2 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20">
                            <Zap className="w-3 h-3 text-purple-400 mx-auto mb-0.5" />
                            <div className="text-xs font-bold text-white">{fats}g</div>
                            <div className="text-[9px] text-purple-400 font-medium">Fat</div>
                          </div>
                        </div>


                        {/* Ultra Modern Horizontal Action Buttons */}
                        <div className="flex items-center gap-2 mb-3">
                          <button
                            onClick={() => toggleIngredients(meal.id)}
                            className={`group relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex-1 ${
                              showIngredients[meal.id]
                                ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/20'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                            }`}
                          >
                            <ChefHat className="w-3 h-3" />
                            <span className="font-bold hidden sm:inline">Ingredients</span>
                            <span className="font-bold sm:hidden">Ingr.</span>
                          </button>
                          <button
                            onClick={() => toggleInstructions(meal.id)}
                            className={`group relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all duration-300 text-xs flex-1 ${
                              showInstructions[meal.id]
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/20'
                                : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 border border-slate-600/50'
                            }`}
                          >
                            <BookOpen className="w-3 h-3" />
                            <span className="font-bold hidden sm:inline">Instructions</span>
                            <span className="font-bold sm:hidden">Instr.</span>
                          </button>
                        </div>
                      
                        {/* Ultra Compact Ingredients Panel - Optimized */}
                        {showIngredients[meal.id] && (
                          <div className="border-t border-slate-700/30 pt-2 mt-2 space-y-1">
                            {meal.ingredients.map((ingredient, idx) => (
                              <div key={idx} className="bg-gradient-to-r from-slate-800/30 via-slate-700/20 to-slate-800/30 rounded-lg p-1.5 border border-slate-600/20">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-4 h-4 rounded bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30 flex items-center justify-center flex-shrink-0">
                                    <span className="text-green-300 text-[8px] font-bold">{idx + 1}</span>
                                  </div>
                                  <span className="text-white font-medium text-[11px] flex-1 min-w-0 truncate">{ingredient.food.name}</span>
                                  <div className="flex items-center gap-0.5 text-slate-400 text-[9px] flex-shrink-0 bg-slate-800/50 px-1.5 py-0.5 rounded">
                                    <span className="font-bold">{ingredient.quantity}g</span>
                                    <span className="text-[8px]">•</span>
                                    <span className="font-bold">{Math.round(ingredient.food.kcal * ingredient.quantity / 100)}cal</span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Ultra Compact Instructions Panel - Optimized */}
                        {showInstructions[meal.id] && (
                          <div className="border-t border-slate-700/30 pt-2 mt-2">
                            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg p-2 border border-purple-500/20">
                              <p className="text-slate-200 leading-tight text-[11px]">
                                {meal.cookingInstructions}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* Mobile-Optimized Notes */}
                        {meal.notes && (
                          <div className="mt-3 md:mt-4 bg-slate-700/50 rounded-xl md:rounded-2xl p-3 md:p-4 border border-slate-600/50">
                            <p className="text-xs md:text-sm text-slate-300 italic font-medium">{meal.notes}</p>
                          </div>
                        )}
                      </div>
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


      </div>
    </div>
  );
};

export default ClientNutritionView;
