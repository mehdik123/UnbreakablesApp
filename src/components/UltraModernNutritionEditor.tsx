import React, { useState, useMemo, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Download, 
  Utensils, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  User,
  Calendar,
  Target,
  Copy,
  Edit3,
  Trash2,
  Search,
  Filter,
  BookOpen,
  Settings,
  Flame,
  TrendingUp,
  Shield,
  Clock,
  Zap,
  Heart,
  Activity,
  BarChart3,
  Star,
  Crown,
  Eye,
  MoreVertical,
  ChevronDown,
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Sparkles,
  Zap as ZapIcon
} from 'lucide-react';
import { MealCard } from './MealCard';
import { NutritionSummary } from './NutritionSummary';
import { IngredientEditor } from './IngredientEditor';
import { Client, NutritionPlan, SelectedMeal, Meal, Food } from '../types';
import { calculateTotalNutrition } from '../utils/nutritionCalculator';
import { exportToPDF } from '../utils/pdfExport';

interface NutritionTemplate {
  id: string;
  name: string;
  goal: string;
  mealsPerDay: number;
  calories: number;
  mealSlots: {
    id: string;
    name: string;
    selectedMeals: SelectedMeal[];
  }[];
  createdAt: Date;
}

interface UltraModernNutritionEditorProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  isDark: boolean;
  onSavePlan: (plan: NutritionPlan) => void;
  onAssignPlan: (plan: NutritionPlan) => void;
  onBack: () => void;
}

export const UltraModernNutritionEditor: React.FC<UltraModernNutritionEditorProps> = ({
  client,
  foods,
  meals,
  isDark,
  onSavePlan,
  onAssignPlan,
  onBack
}) => {
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
  const [mealSlots, setMealSlots] = useState<{id: string; name: string; selectedMeals: SelectedMeal[]}[]>([
    { id: '1', name: 'Breakfast', selectedMeals: [] },
    { id: '2', name: 'Lunch', selectedMeals: [] },
    { id: '3', name: 'Dinner', selectedMeals: [] }
  ]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [showMealCountSelector, setShowMealCountSelector] = useState(false);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<NutritionTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIngredientEditor, setShowIngredientEditor] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SelectedMeal | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());
  const [editingIngredients, setEditingIngredients] = useState<Set<string>>(new Set());
  const [editingQuantities, setEditingQuantities] = useState<{[key: string]: number}>({});
  const [showIngredientSearch, setShowIngredientSearch] = useState<string | null>(null);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('nutritionTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Load meal slots from client's existing nutrition plan or localStorage
  useEffect(() => {
    // First, try to load from client's existing nutrition plan
    if (client.nutritionPlan?.mealSlots) {
      console.log('Loading existing nutrition plan for client:', client.nutritionPlan);
      setMealSlots(client.nutritionPlan.mealSlots);
      setMealsPerDay(client.nutritionPlan.mealsPerDay || 3);
    } else {
      // Fall back to localStorage if no existing plan
      const savedMealSlots = localStorage.getItem(`nutrition_editor_${client.id}`);
      if (savedMealSlots) {
        try {
          const parsed = JSON.parse(savedMealSlots);
          setMealSlots(parsed);
        } catch (error) {
          console.error('Error loading saved meal slots:', error);
        }
      }
    }
  }, [client.id, client.nutritionPlan]);

  // Update meal slots when mealsPerDay changes
  useEffect(() => {
    const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2', 'Snack 3'];
    const newMealSlots = Array.from({ length: mealsPerDay }, (_, index) => ({
      id: (index + 1).toString(),
      name: mealNames[index] || `Meal ${index + 1}`,
      selectedMeals: mealSlots[index]?.selectedMeals || []
    }));
    setMealSlots(newMealSlots);
  }, [mealsPerDay]);

  // Save meal slots to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`nutrition_editor_${client.id}`, JSON.stringify(mealSlots));
  }, [mealSlots, client.id]);

  // Calculate total nutrition
  const totalNutrition = useMemo(() => {
    const allMeals = mealSlots.flatMap(slot => slot.selectedMeals || []);
    const nutrition = calculateTotalNutrition(allMeals);
    return {
      calories: nutrition.totalKcal,
      protein: nutrition.totalProtein,
      fat: nutrition.totalFat,
      carbs: nutrition.totalCarbs
    };
  }, [mealSlots]);

  // Get goal color and icon
  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'shredding': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400';
      case 'bulking': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400';
      case 'maintenance': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-950/20 dark:text-slate-400';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'shredding': return <Flame className="w-4 h-4" />;
      case 'bulking': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const handleMealSelect = (meal: Meal) => {
    if (!selectedSlot) return;

    const selectedMeal: SelectedMeal = {
      id: `${Date.now()}`,
      meal: meal,
      quantity: 1,
      customizations: []
    };

    setMealSlots(prev => prev.map(slot => 
      slot.id === selectedSlot 
        ? { ...slot, selectedMeals: [...(slot.selectedMeals || []), selectedMeal] }
        : slot
    ));

    setShowMealSelector(false);
    setSelectedSlot(null);
  };

  const handleRemoveMeal = (slotId: string, mealId: string) => {
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { ...slot, selectedMeals: slot.selectedMeals.filter(m => m.id !== mealId) }
        : slot
    ));
  };

  const handleQuantityChange = (slotId: string, mealId: string, quantity: number) => {
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(m => 
              m.id === mealId ? { ...m, quantity } : m
            )
          }
        : slot
    ));
  };

  const handleSavePlan = () => {
    const plan: NutritionPlan = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      mealsPerDay: mealSlots.length,
      mealSlots: mealSlots,
      createdAt: new Date(),
      updatedAt: new Date(),
      shareUrl: `${window.location.origin}${window.location.pathname}?share=${Date.now()}&client=${client.id}&type=nutrition`,
      // Add the nutrition data that ClientNutritionView expects
      dailyCalories: totalNutrition.calories,
      macronutrients: {
        protein: { grams: totalNutrition.protein, percentage: Math.round((totalNutrition.protein * 4 / totalNutrition.calories) * 100) },
        carbohydrates: { grams: totalNutrition.carbs, percentage: Math.round((totalNutrition.carbs * 4 / totalNutrition.calories) * 100) },
        fats: { grams: totalNutrition.fat, percentage: Math.round((totalNutrition.fat * 9 / totalNutrition.calories) * 100) }
      },
      meals: mealSlots.flatMap(slot => 
        slot.selectedMeals.map(meal => ({
          id: meal.id,
          name: meal.name,
          time: slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00',
          calories: Math.round(meal.calories * meal.quantity),
          macronutrients: {
            protein: Math.round(meal.protein * meal.quantity),
            carbohydrates: Math.round(meal.carbs * meal.quantity),
            fats: Math.round(meal.fat * meal.quantity)
          },
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          prepTime: meal.prepTime || '15 min',
          difficulty: meal.difficulty || 'Easy'
        }))
      ),
      supplements: ['Whey Protein', 'Multivitamin', 'Omega-3'],
      waterIntake: 3
    };

    onSavePlan(plan);
  };

  const handleAssignToClient = () => {
    const plan: NutritionPlan = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      mealsPerDay: mealSlots.length,
      mealSlots: mealSlots,
      createdAt: new Date(),
      updatedAt: new Date(),
      shareUrl: `${window.location.origin}${window.location.pathname}?share=${Date.now()}&client=${client.id}&type=nutrition`,
      dailyCalories: totalNutrition.calories,
      macronutrients: {
        protein: { grams: totalNutrition.protein, percentage: Math.round((totalNutrition.protein * 4 / totalNutrition.calories) * 100) },
        carbohydrates: { grams: totalNutrition.carbs, percentage: Math.round((totalNutrition.carbs * 4 / totalNutrition.calories) * 100) },
        fats: { grams: totalNutrition.fat, percentage: Math.round((totalNutrition.fat * 9 / totalNutrition.calories) * 100) }
      },
      meals: mealSlots.flatMap(slot => 
        slot.selectedMeals.map(meal => ({
          id: meal.id,
          name: meal.name,
          time: slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00',
          calories: Math.round(meal.calories * meal.quantity),
          macronutrients: {
            protein: Math.round(meal.protein * meal.quantity),
            carbohydrates: Math.round(meal.carbs * meal.quantity),
            fats: Math.round(meal.fat * meal.quantity)
          },
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          prepTime: meal.prepTime || '15 min',
          difficulty: meal.difficulty || 'Easy'
        }))
      ),
      supplements: ['Whey Protein', 'Multivitamin', 'Omega-3'],
      waterIntake: 3
    };

    console.log('UltraModernNutritionEditor - Assigning plan:', plan);
    onAssignPlan(plan);
    alert(`Nutrition plan assigned to ${client.name}!`);
  };

  const handleShareWithClient = () => {
    const shareId = Date.now().toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}&client=${client.id}&type=nutrition`;
    
    // Create the nutrition plan with the same structure as handleSavePlan
    const plan: NutritionPlan = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      mealsPerDay: mealSlots.length,
      mealSlots: mealSlots,
      createdAt: new Date(),
      updatedAt: new Date(),
      shareUrl,
      dailyCalories: totalNutrition.calories,
      macronutrients: {
        protein: { grams: totalNutrition.protein, percentage: Math.round((totalNutrition.protein * 4 / totalNutrition.calories) * 100) },
        carbohydrates: { grams: totalNutrition.carbs, percentage: Math.round((totalNutrition.carbs * 4 / totalNutrition.calories) * 100) },
        fats: { grams: totalNutrition.fat, percentage: Math.round((totalNutrition.fat * 9 / totalNutrition.calories) * 100) }
      },
      meals: mealSlots.flatMap(slot => 
        slot.selectedMeals.map(meal => ({
          id: meal.id,
          name: meal.name,
          time: slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00',
          calories: Math.round(meal.calories * meal.quantity),
          macronutrients: {
            protein: Math.round(meal.protein * meal.quantity),
            carbohydrates: Math.round(meal.carbs * meal.quantity),
            fats: Math.round(meal.fat * meal.quantity)
          },
          ingredients: meal.ingredients || [],
          instructions: meal.instructions || [],
          prepTime: meal.prepTime || '15 min',
          difficulty: meal.difficulty || 'Easy'
        }))
      ),
      supplements: ['Whey Protein', 'Multivitamin', 'Omega-3'],
      waterIntake: 3
    };
    
    // Save shared data
    const sharedData = {
      clientName: client.name,
      clientId: client.id,
      nutritionPlan: plan,
      isReadOnly: true
    };
    
    localStorage.setItem(`client_${client.id}_nutrition_${shareId}`, JSON.stringify(sharedData));
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Nutrition plan URL copied to clipboard!\n\nShare this link with ${client.name}:\n${shareUrl}`);
    }).catch(() => {
      prompt(`Copy this URL to share with ${client.name}:`, shareUrl);
    });
  };

  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;

    const template: NutritionTemplate = {
      id: Date.now().toString(),
      name: templateName,
      goal: client.goal,
      mealsPerDay: mealSlots.length,
      calories: totalNutrition.calories,
      mealSlots: mealSlots,
      createdAt: new Date()
    };

    const newTemplates = [...templates, template];
    setTemplates(newTemplates);
    localStorage.setItem('nutritionTemplates', JSON.stringify(newTemplates));
    setShowSaveTemplate(false);
    setTemplateName('');
  };

  const handleLoadTemplate = (template: NutritionTemplate) => {
    setMealSlots(template.mealSlots);
    setShowTemplates(false);
  };

  const handleExportPDF = async () => {
    setIsLoading(true);
    try {
      await exportToPDF({
        client,
        nutrition: totalNutrition,
        mealSlots,
        type: 'nutrition'
      });
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditIngredients = (meal: SelectedMeal) => {
    setEditingMeal(meal);
    setShowIngredientEditor(true);
  };

  const handleIngredientUpdate = (updatedMeal: SelectedMeal) => {
    setMealSlots(prev => prev.map(slot => ({
      ...slot,
      selectedMeals: slot.selectedMeals.map(m => 
        m.id === updatedMeal.id ? updatedMeal : m
      )
    })));
    setShowIngredientEditor(false);
    setEditingMeal(null);
  };

  const toggleExpanded = (mealId: string, type: 'ingredients' | 'instructions') => {
    if (type === 'ingredients') {
      setExpandedIngredients(prev => {
        const newSet = new Set(prev);
        if (newSet.has(mealId)) {
          newSet.delete(mealId);
        } else {
          newSet.add(mealId);
        }
        return newSet;
      });
    } else {
      setExpandedInstructions(prev => {
        const newSet = new Set(prev);
        if (newSet.has(mealId)) {
          newSet.delete(mealId);
        } else {
          newSet.add(mealId);
        }
        return newSet;
      });
    }
  };

  const startEditingIngredients = (mealId: string) => {
    setEditingIngredients(prev => new Set(prev).add(mealId));
  };

  const stopEditingIngredients = (mealId: string) => {
    setEditingIngredients(prev => {
      const newSet = new Set(prev);
      newSet.delete(mealId);
      return newSet;
    });
    setEditingQuantities({});
  };

  const handleIngredientQuantityChange = (mealId: string, ingredientIndex: number, newQuantity: number) => {
    const key = `${mealId}-${ingredientIndex}`;
    setEditingQuantities(prev => ({
      ...prev,
      [key]: newQuantity
    }));
  };

  const saveIngredientChanges = (slotId: string, mealId: string) => {
    const slot = mealSlots.find(s => s.id === slotId);
    if (!slot) return;

    const updatedMeals = slot.selectedMeals?.map(meal => {
      if (meal.id === mealId) {
        const updatedIngredients = meal.meal.ingredients.map((ingredient, idx) => {
          const key = `${mealId}-${idx}`;
          const newQuantity = editingQuantities[key];
          if (newQuantity !== undefined) {
            return { ...ingredient, quantity: newQuantity };
          }
          return ingredient;
        });
        return { ...meal, meal: { ...meal.meal, ingredients: updatedIngredients } };
      }
      return meal;
    });

    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { ...slot, selectedMeals: updatedMeals }
        : slot
    ));

    stopEditingIngredients(mealId);
  };

  const handleAddIngredient = (slotId: string, mealId: string) => {
    const newIngredient = {
      food: {
        name: 'New Ingredient',
        kcal: 100,
        protein: 10,
        fat: 5,
        carbs: 15
      },
      quantity: 100
    };

    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal, 
                    meal: { 
                      ...meal.meal, 
                      ingredients: [...meal.meal.ingredients, newIngredient] 
                    } 
                  } 
                : meal
            )
          }
        : slot
    ));
  };

  const handleRemoveIngredient = (slotId: string, mealId: string, ingredientIndex: number) => {
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal, 
                    meal: { 
                      ...meal.meal, 
                      ingredients: meal.meal.ingredients.filter((_, idx) => idx !== ingredientIndex)
                    } 
                  } 
                : meal
            )
          }
        : slot
    ));
  };

  const handleUpdateIngredient = (slotId: string, mealId: string, ingredientIndex: number, updatedIngredient: any) => {
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal, 
                    meal: { 
                      ...meal.meal, 
                      ingredients: meal.meal.ingredients.map((ingredient, idx) => 
                        idx === ingredientIndex ? updatedIngredient : ingredient
                      )
                    } 
                  } 
                : meal
            )
          }
        : slot
    ));
  };

  const handleReplaceIngredient = (slotId: string, mealId: string, ingredientIndex: number, newFood: Food) => {
    const updatedIngredient = {
      food: newFood,
      quantity: 100 // Default quantity
    };
    
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal, 
                    meal: { 
                      ...meal.meal, 
                      ingredients: meal.meal.ingredients.map((ingredient, idx) => 
                        idx === ingredientIndex ? updatedIngredient : ingredient
                      )
                    } 
                  } 
                : meal
            )
          }
        : slot
    ));
    
    setShowIngredientSearch(null);
    setIngredientSearchTerm('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="w-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Utensils className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-white">
                    Nutrition Plan Builder
                  </h1>
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${getGoalColor(client.goal)}`}>
                      {getGoalIcon(client.goal)}
                      <span className="capitalize">{client.goal}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{client.numberOfWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowMealCountSelector(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 font-medium transition-colors duration-200"
              >
                <Settings className="w-4 h-4" />
                <span>{mealsPerDay} Meals/Day</span>
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 font-medium transition-colors duration-200"
              >
                <BookOpen className="w-4 h-4" />
                <span>Templates</span>
              </button>
              {/* Assignment Button - Only show when meals are selected */}
              {mealSlots.some(slot => slot.selectedMeals && slot.selectedMeals.length > 0) && (
                <button
                  onClick={handleAssignToClient}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors duration-200"
                >
                  <Target className="w-4 h-4" />
                  <span>Assign to Client</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-4 lg:px-6 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Calories</p>
                <p className="text-3xl font-bold text-white">{Math.round(totalNutrition.calories || 0)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Zap className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Protein</p>
                <p className="text-3xl font-bold text-white">{Math.round(totalNutrition.protein || 0)}g</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-6 h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Fat</p>
                <p className="text-3xl font-bold text-white">{Math.round(totalNutrition.fat || 0)}g</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Heart className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Carbs</p>
                <p className="text-3xl font-bold text-white">{Math.round(totalNutrition.carbs || 0)}g</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-8 mb-8">
          {mealSlots.map((slot, index) => (
            <div key={slot.id} className="bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">{slot.name}</h3>
                    <p className="text-slate-400 text-sm">
                      {slot.selectedMeals?.length || 0} meal{(slot.selectedMeals?.length || 0) !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSlot(slot.id);
                    setShowMealSelector(true);
                  }}
                  className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Meal</span>
                </button>
              </div>

              {(!slot.selectedMeals || slot.selectedMeals.length === 0) ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
                    <Utensils className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No meals added yet</p>
                  <p className="text-sm">Click "Add Meal" to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {slot.selectedMeals.map((selectedMeal) => {
                    const nutrition = selectedMeal.meal.ingredients.reduce((total, ingredient) => ({
                      calories: total.calories + (ingredient.food.kcal * ingredient.quantity / 100),
                      protein: total.protein + (ingredient.food.protein * ingredient.quantity / 100),
                      carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity / 100),
                      fat: total.fat + (ingredient.food.fat * ingredient.quantity / 100)
                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                    const isIngredientsExpanded = expandedIngredients.has(selectedMeal.id);
                    const isInstructionsExpanded = expandedInstructions.has(selectedMeal.id);

                    return (
                      <div key={selectedMeal.id} className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-5 border border-slate-600/50 shadow-lg">
                        {/* Meal Image */}
                        <div className="w-full h-32 rounded-xl overflow-hidden mb-4 shadow-lg">
                          <img 
                            src={selectedMeal.meal.image} 
                            alt={selectedMeal.meal.name} 
                            className="w-full h-full object-cover" 
                          />
                        </div>

                        {/* Meal Info */}
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-bold text-white mb-1 truncate">{selectedMeal.meal.name}</h4>
                            <p className="text-slate-400 capitalize text-sm">{selectedMeal.meal.category}</p>
                          </div>
                          <div className="flex items-center space-x-1">
                            {editingIngredients.has(selectedMeal.id) ? (
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => saveIngredientChanges(slot.id, selectedMeal.id)}
                                  className="p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-600/20 transition-colors duration-200"
                                  title="Save Changes"
                                >
                                  <Save className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => stopEditingIngredients(selectedMeal.id)}
                                  className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-colors duration-200"
                                  title="Cancel"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => startEditingIngredients(selectedMeal.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-600 transition-colors duration-200"
                                title="Edit Ingredients"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleRemoveMeal(slot.id, selectedMeal.id)}
                              className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors duration-200"
                              title="Remove Meal"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Meal Quantity Display */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-slate-400 font-medium text-sm">Quantity:</span>
                          <span className="text-sm font-bold text-white">
                            {selectedMeal.quantity}
                          </span>
                        </div>

                        {/* Nutrition Info */}
                        <div className="grid grid-cols-2 gap-2 mb-4">
                          <div className="text-center p-2 rounded-lg bg-slate-600/30">
                            <p className="text-slate-400 text-xs">Calories</p>
                            <p className="text-sm font-bold text-white">{Math.round(nutrition.calories * selectedMeal.quantity)}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-slate-600/30">
                            <p className="text-slate-400 text-xs">Protein</p>
                            <p className="text-sm font-bold text-white">{Math.round(nutrition.protein * selectedMeal.quantity)}g</p>
                          </div>
                        </div>

                        {/* Ingredients Section */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-slate-300 font-bold text-base">Ingredients:</h5>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleAddIngredient(slot.id, selectedMeal.id)}
                                className="p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-600/20 transition-colors duration-200"
                                title="Add Ingredient"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => toggleExpanded(selectedMeal.id, 'ingredients')}
                                className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200"
                              >
                                <span className="text-sm font-medium">
                                  {isIngredientsExpanded ? 'Hide Ingredients' : 'Show Ingredients'}
                                </span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${isIngredientsExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </div>
                          </div>
                          
                          {isIngredientsExpanded && (
                            <div className="space-y-3">
                              {selectedMeal.meal.ingredients.map((ingredient, idx) => {
                                const isEditing = editingIngredients.has(selectedMeal.id);
                                const key = `${selectedMeal.id}-${idx}`;
                                const currentQuantity = isEditing && editingQuantities[key] !== undefined 
                                  ? editingQuantities[key] 
                                  : ingredient.quantity;
                                const ingredientCalories = Math.round((ingredient.food.kcal * currentQuantity / 100) * selectedMeal.quantity);
                                
                                return (
                                  <div key={idx} className="flex items-center justify-between bg-slate-600/20 rounded-xl p-4">
                                    <div className="flex-1">
                                      <button
                                        onClick={() => setShowIngredientSearch(`${selectedMeal.id}-${idx}`)}
                                        className="text-left w-full"
                                      >
                                        <span className="text-white font-bold text-lg hover:text-red-400 transition-colors">{ingredient.food.name}</span>
                                        <div className="text-slate-400 text-sm mt-1">
                                          {ingredient.food.kcal}kcal, {ingredient.food.protein}g protein, {ingredient.food.carbs}g carbs, {ingredient.food.fat}g fat
                                        </div>
                                      </button>
                                    </div>
                                    <div className="flex items-center space-x-4 ml-4">
                                      <span className="text-red-400 font-bold text-lg">{ingredientCalories} cal</span>
                                      {isEditing ? (
                                        <div className="flex items-center space-x-2">
                                          <input
                                            type="number"
                                            value={currentQuantity}
                                            onChange={(e) => handleIngredientQuantityChange(selectedMeal.id, idx, parseFloat(e.target.value) || 0)}
                                            className="w-20 px-3 py-2 rounded-lg bg-slate-700 text-white text-lg text-center border border-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500"
                                            min="0"
                                            step="0.1"
                                          />
                                          <span className="text-slate-400 text-lg">g</span>
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 text-lg">{ingredient.quantity}g</span>
                                      )}
                                      <button
                                        onClick={() => handleRemoveIngredient(slot.id, selectedMeal.id, idx)}
                                        className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-colors duration-200"
                                        title="Remove Ingredient"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Cooking Instructions Section */}
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="text-slate-300 font-bold text-base">How to Cook:</h5>
                            <button
                              onClick={() => toggleExpanded(selectedMeal.id, 'instructions')}
                              className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-600/50 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200"
                            >
                              <span className="text-sm font-medium">
                                {isInstructionsExpanded ? 'Hide Instructions' : 'Show Instructions'}
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform ${isInstructionsExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          
                          {isInstructionsExpanded && (
                            <div className="bg-slate-600/20 rounded-xl p-4 border border-slate-600/30">
                              <p className="text-white text-base leading-relaxed font-medium">{selectedMeal.meal.cookingInstructions}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Nutrition Summary */}
        <div className="mb-8">
          <NutritionSummary nutrition={totalNutrition} isDark={isDark} />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="inline-flex items-center space-x-3 px-8 py-4 rounded-xl text-slate-300 bg-slate-800/50 hover:bg-slate-700/50 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <BookOpen className="w-5 h-5" />
            <span>Save as Template</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="inline-flex items-center space-x-3 px-8 py-4 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-medium transition-all duration-200 disabled:opacity-50 shadow-lg hover:shadow-xl"
          >
            <Download className="w-5 h-5" />
            <span>{isLoading ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Meal Selector Modal */}
      {showMealSelector && (
        <div 
          className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMealSelector(false);
              setSelectedSlot(null);
            }
          }}
        >
          <div className="w-full max-w-6xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 max-h-[85vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-2xl font-bold text-white">Select Meals</h2>
              <button
                onClick={() => {
                  setShowMealSelector(false);
                  setSelectedSlot(null);
                }}
                className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meals.map((meal) => {
                  try {
                    const nutrition = meal.ingredients.reduce((total, ingredient) => ({
                      calories: total.calories + (ingredient.food.kcal * ingredient.quantity / 100),
                      protein: total.protein + (ingredient.food.protein * ingredient.quantity / 100),
                      carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity / 100),
                      fat: total.fat + (ingredient.food.fat * ingredient.quantity / 100)
                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
                    
                    return (
                      <button
                        key={meal.id}
                        onClick={() => handleMealSelect(meal)}
                        className="text-left p-6 rounded-2xl bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 hover:bg-slate-600/40 transition-all duration-200 shadow-lg hover:shadow-xl group"
                      >
                        <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-lg">
                          <img 
                            src={meal.image} 
                            alt={meal.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-200">{meal.name}</h3>
                        <p className="text-slate-400 capitalize mb-4">{meal.category}</p>
                        
                        {/* Nutrition Info */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                          <div className="text-center p-2 rounded-lg bg-slate-600/30">
                            <p className="text-slate-400 text-xs">Calories</p>
                            <p className="text-sm font-bold text-white">{Math.round(nutrition.calories)}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg bg-slate-600/30">
                            <p className="text-slate-400 text-xs">Protein</p>
                            <p className="text-sm font-bold text-white">{Math.round(nutrition.protein)}g</p>
                          </div>
                        </div>

                        {/* Ingredients Preview */}
                        <div className="mb-4">
                          <p className="text-slate-400 text-sm mb-2">Ingredients:</p>
                          <div className="flex flex-wrap gap-1">
                            {meal.ingredients.slice(0, 2).map((ingredient, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-full bg-slate-600/50 text-slate-300 text-xs">
                                {ingredient.food.name}
                              </span>
                            ))}
                            {meal.ingredients.length > 2 && (
                              <span className="px-2 py-1 rounded-full bg-slate-600/50 text-slate-300 text-xs">
                                +{meal.ingredients.length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add Button */}
                        <div className="flex items-center justify-center">
                          <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                            <Plus className="w-4 h-4 text-red-400" />
                          </div>
                        </div>
                      </button>
                    );
                  } catch (error) {
                    console.error('Error calculating nutrition for meal:', meal.name, error);
                    return (
                      <button
                        key={meal.id}
                        onClick={() => handleMealSelect(meal)}
                        className="text-left p-6 rounded-2xl bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 hover:bg-slate-600/40 transition-all duration-200 shadow-lg hover:shadow-xl group"
                      >
                        <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-lg">
                          <img 
                            src={meal.image} 
                            alt={meal.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-200">{meal.name}</h3>
                        <p className="text-slate-400 capitalize mb-4">{meal.category}</p>
                        <div className="text-center text-slate-500 text-sm">
                          Error calculating nutrition
                        </div>
                      </button>
                    );
                  }
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-4xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-2xl font-bold text-white">Nutrition Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mx-auto mb-6">
                    <BookOpen className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No templates saved yet</p>
                  <p className="text-sm">Create and save your first template</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="bg-slate-700/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-600/50 hover:bg-slate-600/40 transition-all duration-200 shadow-lg hover:shadow-xl">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                          <p className="text-slate-400 text-sm">{template.goal} • {template.mealsPerDay} meals</p>
                        </div>
                        <div className={`inline-flex items-center space-x-1 px-3 py-1 rounded-lg text-xs font-medium ${getGoalColor(template.goal)}`}>
                          {getGoalIcon(template.goal)}
                        </div>
                      </div>
                      <div className="text-sm text-slate-400 mb-6">
                        <div className="flex justify-between">
                          <span>Calories:</span>
                          <span className="font-bold text-white">{Math.round(template.calories)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="w-full px-4 py-3 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        Load Template
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


      {/* Save Template Modal */}
      {showSaveTemplate && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">Save Template</h2>
              <button
                onClick={() => setShowSaveTemplate(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-colors duration-200"
                  placeholder="Enter template name"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSaveTemplate(false)}
                  className="flex-1 px-4 py-2.5 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 font-medium transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 text-white hover:bg-red-700 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Template
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meal Count Selector Modal */}
      {showMealCountSelector && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-md bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">Select Number of Meals</h2>
              <button
                onClick={() => setShowMealCountSelector(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-300 mb-4">How many meals per day?</label>
                <div className="grid grid-cols-3 gap-3">
                  {[3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        setMealsPerDay(count);
                        setShowMealCountSelector(false);
                      }}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        mealsPerDay === count
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {count} Meals
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-sm text-slate-400">
                <p>This will create {mealsPerDay} meal slots for your client's nutrition plan.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Search Modal */}
      {showIngredientSearch && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-2xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-xl font-semibold text-white">Replace Ingredient</h2>
              <button
                onClick={() => {
                  setShowIngredientSearch(null);
                  setIngredientSearchTerm('');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <input
                  type="text"
                  value={ingredientSearchTerm}
                  onChange={(e) => setIngredientSearchTerm(e.target.value)}
                  placeholder="Search for ingredients..."
                  className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                />
              </div>
              <div className="max-h-96 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {foods
                    .filter(food => 
                      food.name.toLowerCase().includes(ingredientSearchTerm.toLowerCase())
                    )
                    .map(food => (
                      <button
                        key={food.name}
                        onClick={() => {
                          const [mealId, ingredientIndex] = showIngredientSearch.split('-');
                          const slot = mealSlots.find(s => s.selectedMeals.some(m => m.id === mealId));
                          if (slot) {
                            handleReplaceIngredient(slot.id, mealId, parseInt(ingredientIndex), food);
                          }
                        }}
                        className="p-4 text-left bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200"
                      >
                        <div className="font-medium text-white">{food.name}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {food.kcal}kcal, {food.protein}g protein, {food.carbs}g carbs, {food.fat}g fat
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
