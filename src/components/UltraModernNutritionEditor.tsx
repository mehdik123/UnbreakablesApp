import React, { useState, useMemo, useEffect, useCallback } from 'react';
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
  Sparkles as SparklesIcon,
  List,
  Zap as ZapIcon,
  ChefHat,
  Camera,
  Upload
} from 'lucide-react';
import { MealCard } from './MealCard';
import { NutritionSummary } from './NutritionSummary';
import { IngredientEditor } from './IngredientEditor';
import { CoachMealPlanCard } from './CoachMealPlanCard';
import { Client, NutritionPlan, SelectedMeal, Meal, Food, Ingredient } from '../types';
import { calculateMealNutrition, calculatePlanSlotsNutrition } from '../utils/nutritionCalculator';
import { getEffectiveSelectedMeal } from '../utils/mealSlotOverrides';
import { exportToPDF } from '../utils/pdfExport';
import {
  dbUpsertNutritionPlan,
  dbGetNutritionPlan,
  dbListMeals,
  dbAddMeal,
  dbAddMealItem,
  dbListIngredients,
  dbAddIngredient,
} from '../lib/db';
import { mealMatchesSearch, matchesSearchQuery } from '../utils/mealSearch';

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
  
  // Track if we're currently making local changes to prevent external updates
  const isLocalUpdateRef = React.useRef(false);
  const [dbMeals, setDbMeals] = useState<any[]>([]);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [showMealCountSelector, setShowMealCountSelector] = useState(false);

  // Update meal slots when mealsPerDay changes
  useEffect(() => {
    const generateMealSlots = (count: number) => {
      const getMealNames = (mealCount: number) => {
        switch (mealCount) {
          case 2: return ['Breakfast', 'Dinner'];
          case 3: return ['Breakfast', 'Lunch', 'Dinner'];
          case 4: return ['Breakfast', 'Lunch', 'Dinner', 'Evening Snack'];
          case 5: return ['Breakfast', 'Morning Snack', 'Lunch', 'Dinner', 'Evening Snack'];
          case 6: return ['Breakfast', 'Morning Snack', 'Lunch', 'Afternoon Snack', 'Dinner', 'Evening Snack'];
          default: return Array.from({length: mealCount}, (_, i) => `Meal ${i + 1}`);
        }
      };
      
      const mealNames = getMealNames(count);
      const newSlots = [];
      
      for (let i = 0; i < count; i++) {
        const existingSlot = mealSlots.find(slot => slot.id === (i + 1).toString());
        newSlots.push({
          id: (i + 1).toString(),
          name: mealNames[i],
          selectedMeals: existingSlot?.selectedMeals || []
        });
      }
      
      return newSlots;
    };

    setMealSlots(generateMealSlots(mealsPerDay));
  }, [mealsPerDay]);
  const [showMealSelector, setShowMealSelector] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [mealSelectorSearch, setMealSelectorSearch] = useState('');
  const [ingredientCatalog, setIngredientCatalog] = useState<Food[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<NutritionTemplate[]>([]);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showIngredientEditor, setShowIngredientEditor] = useState(false);
  const [editingMeal, setEditingMeal] = useState<SelectedMeal | null>(null);
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());
  // By default, all ingredients are expanded and in edit mode for coaches
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set(['COACH_EDIT_MODE']));
  const [expandedInstructions, setExpandedInstructions] = useState<Set<string>>(new Set());
  const [editingIngredients, setEditingIngredients] = useState<Set<string>>(new Set(['COACH_EDIT_MODE']));
  const [editingQuantities, setEditingQuantities] = useState<{[key: string]: number}>({});
  const [showIngredientSearch, setShowIngredientSearch] = useState<string | null>(null);
  const [ingredientSearchTerm, setIngredientSearchTerm] = useState('');
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  // Image upload refs
  const fileInputRefs = React.useRef<{[key: string]: HTMLInputElement | null}>({});
  
  // Create/Save meal modal states
  const [showSaveMealModal, setShowSaveMealModal] = useState(false);
  const [mealToSave, setMealToSave] = useState<{slotId: string; meal: SelectedMeal} | null>(null);
  const [saveMealName, setSaveMealName] = useState('');
  const [saveMealInstructions, setSaveMealInstructions] = useState('');
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  
  // Meal name editing states
  const [editingMealName, setEditingMealName] = useState<string | null>(null);
  const [tempMealName, setTempMealName] = useState('');

  // Load database meals, ingredient catalog, and existing nutrition plan
  useEffect(() => {
    loadDbMeals();
    loadIngredientCatalog();
    loadExistingNutritionPlan();
  }, [client.id]);

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('nutritionTemplates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Auto-save function - saves to client's assigned meals (not as new meal)
  const autoSaveNutritionPlan = useCallback(async () => {
    if (isSaving || isInitialLoad) return;
    
    setIsSaving(true);
    try {
      // Totals = first (front) meal per slot only — alternatives are swaps, not extras
      const nutrition = calculatePlanSlotsNutrition(mealSlots);
      const calculatedNutrition = {
        calories: nutrition.totalKcal,
        protein: nutrition.totalProtein,
        fat: nutrition.totalFat,
        carbs: nutrition.totalCarbs
      };

      const plan: NutritionPlan = {
        id: client.id + '-nutrition-plan',
        clientId: client.id,
        clientName: client.name,
        mealsPerDay: mealSlots.length,
        mealSlots: mealSlots,
        createdAt: new Date(),
        updatedAt: new Date(),
        shareUrl: `${window.location.origin}${window.location.pathname}?share=${Date.now()}&client=${client.id}&type=nutrition`,
        dailyCalories: calculatedNutrition.calories,
        macronutrients: {
          protein: { grams: calculatedNutrition.protein, percentage: Math.round((calculatedNutrition.protein * 4 / Math.max(calculatedNutrition.calories, 1)) * 100) },
          carbohydrates: { grams: calculatedNutrition.carbs, percentage: Math.round((calculatedNutrition.carbs * 4 / Math.max(calculatedNutrition.calories, 1)) * 100) },
          fats: { grams: calculatedNutrition.fat, percentage: Math.round((calculatedNutrition.fat * 9 / Math.max(calculatedNutrition.calories, 1)) * 100) }
        },
        meals: mealSlots.flatMap(slot => 
          slot.selectedMeals.map(meal => ({
            id: meal.id,
            name: meal.meal.name,
            time: slot.name === 'Breakfast' ? '08:00' : slot.name === 'Lunch' ? '13:00' : '19:00',
            calories: Math.round(meal.calories * meal.quantity),
            macronutrients: {
              protein: Math.round(meal.protein * meal.quantity),
              carbohydrates: Math.round(meal.carbs * meal.quantity),
              fats: Math.round(meal.fat * meal.quantity)
            },
            ingredients: meal.meal.ingredients || [],
            instructions: meal.meal.instructions || [],
            prepTime: meal.meal.prepTime || '15 min',
            difficulty: meal.meal.difficulty || 'Easy',
            cookingInstructions: meal.meal.cookingInstructions || ''
          }))
        ),
        supplements: ['Whey Protein', 'Multivitamin', 'Omega-3'],
        waterIntake: 3
      } as any;

      // Save to database using onAssignPlan (saves to client's assigned meals)
      const planJson = JSON.parse(JSON.stringify(plan));
      const result = await dbUpsertNutritionPlan(client.id, planJson);
      
      if (result.error) {
        console.error('❌ Auto-save error:', result.error);
      } else {
        // Don't call onAssignPlan during auto-save to avoid triggering parent re-renders
      // onAssignPlan(plan);
      }
    } catch (err) {
      console.error('❌ Failed to auto-save nutrition plan:', err);
    } finally {
      setIsSaving(false);
    }
  }, [mealSlots, client.id, client.name, isSaving, isInitialLoad, onAssignPlan]);

  // Mark initial load as complete after first render
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 3000); // Wait 3 seconds after component mounts before enabling auto-save
    return () => clearTimeout(timer);
  }, []);

  // Auto-save with debouncing when mealSlots change
  useEffect(() => {
    // Skip auto-save on initial load or if no meals
    if (isInitialLoad || isSaving || mealSlots.length === 0 || mealSlots.every(slot => slot.selectedMeals.length === 0)) {
      return;
    }

    const timeoutId = setTimeout(() => {
      autoSaveNutritionPlan();
    }, 2000); // Debounce: save 2 seconds after last change

    return () => clearTimeout(timeoutId);
  }, [mealSlots, isInitialLoad, isSaving, autoSaveNutritionPlan]);

  const loadDbMeals = async () => {
    try {
      const result = await dbListMeals();
      if (result.data) {
        setDbMeals(result.data);

      }
    } catch (error) {
      console.error('Failed to load meals from database:', error);
    }
  };

  const loadIngredientCatalog = async () => {
    try {
      const result = await dbListIngredients();
      const fromDb: Food[] = (result.data || [])
        .filter((row: any) => row?.name)
        .map((row: any) => ({
          name: String(row.name),
          kcal: Number(row.kcal) || 0,
          protein: Number(row.protein) || 0,
          fat: Number(row.fat) || 0,
          carbs: Number(row.carbs) || 0,
        }));

      // Merge DB ingredients with CSV/static foods (DB wins on duplicate names)
      const byName = new Map<string, Food>();
      for (const food of foods || []) {
        if (food?.name) byName.set(food.name.trim().toLowerCase(), food);
      }
      for (const food of fromDb) {
        byName.set(food.name.trim().toLowerCase(), food);
      }
      setIngredientCatalog(Array.from(byName.values()).sort((a, b) => a.name.localeCompare(b.name)));
    } catch (error) {
      console.error('Failed to load ingredient catalog:', error);
      setIngredientCatalog(foods || []);
    }
  };

  const loadExistingNutritionPlan = async () => {
    try {
      const result = await dbGetNutritionPlan(client.id);
      if (result.data) {

        // Convert DB plan back to UI state
        if (result.data.mealSlots) {
          setMealSlots(result.data.mealSlots);
          setMealsPerDay(result.data.mealsPerDay || 3);
        }
      }
    } catch (error) {
      console.error('Failed to load existing nutrition plan:', error);
    }
  };

  // Load meal slots from client's existing nutrition plan or localStorage (only on mount)
  useEffect(() => {
    // Don't load if we're in the middle of a local update
    if (isLocalUpdateRef.current) {
      console.log('⏭️ Skipping external load - local update in progress');
      return;
    }
    
    // First, try to load from client's existing nutrition plan
    if (client.nutritionPlan?.mealSlots) {
      console.log('📥 Loading nutrition plan from client prop on mount');
      setMealSlots(client.nutritionPlan.mealSlots);
      setMealsPerDay(client.nutritionPlan.mealsPerDay || 3);
    } else {
      // Fall back to localStorage if no existing plan
      const savedMealSlots = localStorage.getItem(`nutrition_editor_${client.id}`);
      if (savedMealSlots) {
        try {
          const parsed = JSON.parse(savedMealSlots);
          console.log('📥 Loading nutrition plan from localStorage on mount');
          setMealSlots(parsed);
        } catch (error) {
          console.error('Error loading saved meal slots:', error);
        }
      }
    }
    // Only run on component mount (client.id change), NOT when nutritionPlan changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [client.id]);

  // Update meal slots when mealsPerDay changes
  useEffect(() => {
    // Only update if the number of slots actually changed
    if (mealSlots.length === mealsPerDay) {
      console.log('⏭️ Skipping meal slots update - count already matches');
      return;
    }
    
    console.log('🔄 Updating meal slots count from', mealSlots.length, 'to', mealsPerDay);
    const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2', 'Snack 3'];
    const newMealSlots = Array.from({ length: mealsPerDay }, (_, index) => ({
      id: (index + 1).toString(),
      name: mealNames[index] || `Meal ${index + 1}`,
      selectedMeals: mealSlots[index]?.selectedMeals || []
    }));
    setMealSlots(newMealSlots);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mealsPerDay]);

  // Save meal slots to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(`nutrition_editor_${client.id}`, JSON.stringify(mealSlots));
  }, [mealSlots, client.id]);

  // Calculate total nutrition
  const totalNutrition = useMemo(() => {
    // Coach preview matches client: only the first meal in each slot counts
    const nutrition = calculatePlanSlotsNutrition(mealSlots);
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

  // Convert DB meal to UI meal format with copy-on-assign
  const convertDbMealToUiMeal = (dbMeal: any): Meal => {
    const ingredients = (dbMeal.meal_items || [])
      .filter((item: any) => item?.ingredients?.name)
      .map((item: any) => ({
      food: {
        name: item.ingredients.name,
        kcal: Number(item.ingredients.kcal) || 0,
        protein: Number(item.ingredients.protein) || 0,
        fat: Number(item.ingredients.fat) || 0,
        carbs: Number(item.ingredients.carbs) || 0
      },
      quantity: item.quantity_g || item.quantity || 100
    }));

    return {
      id: dbMeal.id,
      name: dbMeal.name,
      ingredients: ingredients,
      cookingInstructions: dbMeal.cooking_instructions || '',
      image: dbMeal.image || '/api/placeholder/300/200',
      category: 'lunch' as 'breakfast' | 'lunch' | 'dinner' | 'snack' // Default category since we removed it
    };
  };

  const filteredDbMeals = useMemo(() => {
    const q = mealSelectorSearch.trim();
    if (!q) return dbMeals;
    return dbMeals.filter((dbMeal: any) =>
      mealMatchesSearch(
        dbMeal.name || '',
        q,
        (dbMeal.meal_items || []).map((item: any) => item.ingredients?.name)
      )
    );
  }, [dbMeals, mealSelectorSearch]);

  const filteredIngredientCatalog = useMemo(() => {
    const catalog = ingredientCatalog.length > 0 ? ingredientCatalog : foods || [];
    const q = ingredientSearchTerm.trim();
    if (!q) return catalog.slice(0, 80);
    return catalog.filter((food) => matchesSearchQuery(food.name, q)).slice(0, 120);
  }, [ingredientCatalog, foods, ingredientSearchTerm]);

  const handleMealSelect = (dbMeal: any) => {
    if (!selectedSlot) return;

    // Convert DB meal to UI format (this creates a copy)
    const uiMeal = convertDbMealToUiMeal(dbMeal);
    
    const selectedMeal: SelectedMeal = {
      id: `${Date.now()}`,
      meal: uiMeal,
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
    setMealSelectorSearch('');
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
    } as any;

    onSavePlan(plan);
  };

  const handleAssignToClient = async () => {
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
    } as any;

    try {
      const planJson = JSON.parse(JSON.stringify(plan));

      
      const result = await dbUpsertNutritionPlan(client.id, planJson);

      
      if (result.error) {
        console.error('❌ Supabase save error:', result.error);
        alert(`Error saving nutrition plan: ${result.error.message}`);
      } else {

      }
    } catch (err) {
      console.error('❌ Failed to persist nutrition plan to Supabase:', err);
      alert(`Failed to save nutrition plan: ${err.message || err}`);
    }

    onSavePlan(plan);
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
      const { exportEnhancedNutritionPDF } = await import('../utils/enhancedPdfExport');
      await exportEnhancedNutritionPDF({
        clientName: client.name,
        mealSlots,
        totalNutrition: {
          calories: totalNutrition.calories,
          protein: totalNutrition.protein,
          carbs: totalNutrition.carbs,
          fats: totalNutrition.fats
        }
      });
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
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
        // If COACH_EDIT_MODE is active, remove it and add individual meal IDs except this one
        if (newSet.has('COACH_EDIT_MODE')) {
          newSet.delete('COACH_EDIT_MODE');
          // Add all other meal IDs but not this one (to collapse it)
          mealSlots.forEach(slot => {
            slot.selectedMeals.forEach(sm => {
              if (sm.id !== mealId) {
                newSet.add(sm.id);
              }
            });
          });
        } else if (newSet.has(mealId)) {
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

  const handleIngredientQuantityChange = (mealId: string, ingredientIndex: number, newQuantity: number, slotId: string) => {
    const key = `${mealId}-${ingredientIndex}`;
    
    // Update the editing quantities state
    setEditingQuantities(prev => ({
      ...prev,
      [key]: newQuantity
    }));
    
    // Immediately update the actual meal data in mealSlots
    isLocalUpdateRef.current = true;
    setMealSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          selectedMeals: slot.selectedMeals.map(meal => {
            if (meal.id === mealId) {
              const ingredients = [...(meal.meal.ingredients || [])];
              if (!ingredients[ingredientIndex]) return meal;
              ingredients[ingredientIndex] = {
                ...ingredients[ingredientIndex],
                quantity: newQuantity,
              };
              return {
                ...meal,
                // Clear stale customIngredients so coach edits drive nutrition
                customIngredients: undefined,
                meal: {
                  ...meal.meal,
                  ingredients,
                }
              };
            }
            return meal;
          })
        };
      }
      return slot;
    }));
    setTimeout(() => {
      isLocalUpdateRef.current = false;
    }, 3000);
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
    const newIngredient: Ingredient = {
      food: {
        name: 'New Ingredient',
        kcal: 0,
        protein: 0,
        fat: 0,
        carbs: 0
      },
      quantity: 100
    };

    const currentMeal = mealSlots
      .find((s) => s.id === slotId)
      ?.selectedMeals.find((m) => m.id === mealId);
    const newIndex = currentMeal?.meal?.ingredients?.length ?? 0;

    isLocalUpdateRef.current = true;
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => {
              if (meal.id !== mealId) return meal;
              return { 
                ...meal,
                customIngredients: undefined,
                meal: { 
                  ...meal.meal, 
                  ingredients: [...(meal.meal.ingredients || []), newIngredient],
                } 
              };
            })
          }
        : slot
    ));

    // Expand ingredients and open the replace picker for the new row
    setExpandedIngredients((prev) => {
      const next = new Set(prev);
      next.add(mealId);
      return next;
    });
    setShowIngredientSearch(`${mealId}::${newIndex}`);
    setIngredientSearchTerm('');

    setTimeout(() => {
      isLocalUpdateRef.current = false;
    }, 3000);
  };

  const handleRemoveIngredient = (slotId: string, mealId: string, ingredientIndex: number) => {
    isLocalUpdateRef.current = true;
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal,
                    customIngredients: undefined,
                    meal: { 
                      ...meal.meal, 
                      ingredients: (meal.meal.ingredients || []).filter((_, idx) => idx !== ingredientIndex)
                    } 
                  } 
                : meal
            )
          }
        : slot
    ));
    setTimeout(() => {
      isLocalUpdateRef.current = false;
    }, 3000);
  };

  const handleUpdateIngredient = (slotId: string, mealId: string, ingredientIndex: number, updatedIngredient: any) => {
    isLocalUpdateRef.current = true;
    setMealSlots(prev => prev.map(slot => 
      slot.id === slotId 
        ? { 
            ...slot, 
            selectedMeals: slot.selectedMeals.map(meal => 
              meal.id === mealId 
                ? { 
                    ...meal,
                    customIngredients: undefined,
                    meal: { 
                      ...meal.meal, 
                      ingredients: (meal.meal.ingredients || []).map((ingredient, idx) => 
                        idx === ingredientIndex ? updatedIngredient : ingredient
                      )
                    } 
                  } 
                : meal
            )
          }
        : slot
    ));
    setTimeout(() => {
      isLocalUpdateRef.current = false;
    }, 3000);
  };

  const handleReplaceIngredient = (slotId: string, mealId: string, ingredientIndex: number, newFood: Food) => {
    console.log('🔄 Replacing ingredient:', { slotId, mealId, ingredientIndex, newFood: newFood.name });
    
    // Mark that we're making a local update
    isLocalUpdateRef.current = true;
    
    setMealSlots(prev => {
      const updatedSlots = prev.map(s => {
        if (s.id === slotId) {
          const updatedMeals = s.selectedMeals.map(m => {
            if (m.id === mealId) {
              // Validate ingredient index
              if (ingredientIndex < 0 || ingredientIndex >= (m.meal.ingredients || []).length) {
                console.error('❌ Invalid ingredient index:', ingredientIndex, 'Ingredients length:', m.meal.ingredients?.length);
                return m;
              }
              
              // Get existing ingredient to preserve quantity
              const existingIngredient = m.meal.ingredients[ingredientIndex];
              if (!existingIngredient) {
                console.error('❌ Existing ingredient not found at index:', ingredientIndex);
                return m;
              }
              
              const updatedIngredient = {
                food: { ...newFood }, // Create new food object
                quantity: existingIngredient.quantity || 100 // Keep existing quantity or default to 100
              };
              
              // Create a completely new ingredients array (deep copy)
              const newIngredients = m.meal.ingredients.map((ing, i) => {
                if (i === ingredientIndex) {
                  return updatedIngredient;
                }
                // Return a new copy of each ingredient to ensure React detects changes
                return {
                  ...ing,
                  food: { ...ing.food }
                };
              });
              
              // Create a completely new meal object to ensure React detects the change
              const updatedMeal = {
                ...m,
                customIngredients: undefined,
                meal: {
                  ...m.meal,
                  ingredients: newIngredients
                }
              };
              
              console.log('✅ Created updated meal with new ingredient:', {
                oldIngredient: existingIngredient.food.name,
                newIngredient: updatedIngredient.food.name,
                ingredientCount: newIngredients.length
              });
              
              return updatedMeal;
            }
            return m;
          });
          
          const updatedSlot = {
            ...s,
            selectedMeals: updatedMeals
          };
          
          console.log('✅ Updated slot:', updatedSlot.id);
          return updatedSlot;
        }
        return s;
      });
      
      console.log('✅ Updated mealSlots with', updatedSlots.length, 'slots');
      return updatedSlots;
    });
    
    // Close modal and clear search
    setShowIngredientSearch(null);
    setIngredientSearchTerm('');
    
    // Clear the local update flag after a short delay to allow auto-save to complete
    setTimeout(() => {
      isLocalUpdateRef.current = false;
      console.log('✅ Local update flag cleared');
    }, 5000); // Keep flag for 5 seconds to prevent external updates during auto-save
    
    // Don't call auto-save here - let the mealSlots useEffect handle it
    // The auto-save will trigger automatically after the debounce period (2s)
  };

  // Handle image upload
  const handleImageUpload = (slotId: string, mealId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Create a data URL for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const imageUrl = reader.result as string;
      
      // Update the meal image in state
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
                        image: imageUrl
                      } 
                    } 
                  : meal
              )
            }
          : slot
      ));

      console.log('✅ Image uploaded for meal:', mealId);
    };

    reader.readAsDataURL(file);
  };

  // Handle meal name editing
  const handleMealNameEdit = (mealId: string, currentName: string) => {
    setEditingMealName(mealId);
    setTempMealName(currentName);
  };

  const handleMealNameSave = (slotId: string, mealId: string) => {
    if (!tempMealName.trim()) {
      setEditingMealName(null);
      return;
    }

    // Update meal name in mealSlots (this will auto-save to nutrition plan)
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
                      name: tempMealName.trim()
                    }
                  }
                : meal
            )
          }
        : slot
    ));

    setEditingMealName(null);
    setTempMealName('');
  };

  const handleMealNameCancel = () => {
    setEditingMealName(null);
    setTempMealName('');
  };

  // Open save-as-new-meal modal (never overwrites the original library meal)
  const openSaveMealModal = (slotId: string, meal: SelectedMeal) => {
    setMealToSave({ slotId, meal });
    setSaveMealName(meal.meal.name || '');
    setSaveMealInstructions(meal.meal.cookingInstructions || '');
    setShowSaveMealModal(true);
  };

  // Always INSERT a brand-new meal into the library from the client's current plan copy
  const handleSaveMealToDatabase = async () => {
    if (!mealToSave || !saveMealName.trim()) {
      alert('Please enter a name for the new meal');
      return;
    }

    setIsSavingMeal(true);
    try {
      const { meal } = mealToSave;
      const ingredients = meal.meal.ingredients || [];

      const nutrition = ingredients.reduce(
        (total, ingredient) => ({
          calories: total.calories + (ingredient.food.kcal * ingredient.quantity) / 100,
          protein: total.protein + (ingredient.food.protein * ingredient.quantity) / 100,
          carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity) / 100,
          fat: total.fat + (ingredient.food.fat * ingredient.quantity) / 100,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      // 1) Create NEW meal row only (insert — never update an existing meal id)
      const mealResult = await dbAddMeal({
        name: saveMealName.trim(),
        image: meal.meal.image || undefined,
        cooking_instructions: saveMealInstructions.trim() || undefined,
        is_template: true,
        kcal_target: Math.round(nutrition.calories) || undefined,
      });

      if (mealResult.error || !mealResult.data) {
        throw mealResult.error || new Error('Failed to create meal');
      }

      const newMealId = mealResult.data.id as string;

      // 2) Link ingredients (reuse existing ingredient rows by name, or create missing ones)
      const ingredientsResult = await dbListIngredients();
      const existingIngredients = ingredientsResult.data || [];

      for (const ingredient of ingredients) {
        const foodName = (ingredient.food?.name || '').trim();
        if (!foodName) continue;

        let match = existingIngredients.find(
          (ing: any) => (ing.name || '').trim().toLowerCase() === foodName.toLowerCase()
        );

        if (!match) {
          const created = await dbAddIngredient({
            name: foodName,
            kcal: ingredient.food.kcal || 0,
            protein: ingredient.food.protein || 0,
            fat: ingredient.food.fat || 0,
            carbs: ingredient.food.carbs || 0,
          });
          if (created.error || !created.data) {
            console.error('Error creating ingredient:', foodName, created.error);
            continue;
          }
          match = created.data;
          existingIngredients.push(created.data);
        }

        const itemResult = await dbAddMealItem(newMealId, match.id, ingredient.quantity);
        if (itemResult.error) {
          console.error('Error linking ingredient:', foodName, itemResult.error);
        }
      }

      alert(`Saved as new meal: “${saveMealName.trim()}”. The original library meal was not changed.`);

      await loadDbMeals();

      setShowSaveMealModal(false);
      setMealToSave(null);
      setSaveMealName('');
      setSaveMealInstructions('');
    } catch (err) {
      console.error('❌ Error saving meal:', err);
      alert('Failed to save the new meal. Please try again.');
    } finally {
      setIsSavingMeal(false);
    }
  };


  return (
    <div className="coach-editor">
      {/* Header - nested in the plan shell, so it stays inline (no second sticky bar) */}
      <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-4 lg:px-8 xl:px-12 pt-1">
        <div className="coach-editor-head">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={onBack}
              className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200 sm:hidden"
              title="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shrink-0" style={{ background: 'var(--grad-red)' }}>
              <Utensils className="w-5 h-5 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-xl font-bold font-display text-[color:var(--txt-hi)] truncate">
                Nutrition Plan Builder
              </h2>
              <div className="flex items-center gap-2 flex-wrap">
                <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] sm:text-xs font-medium ${getGoalColor(client.goal)}`}>
                  {getGoalIcon(client.goal)}
                  <span className="capitalize">{client.goal}</span>
                </div>
                <div className="flex items-center gap-1 text-[color:var(--txt-lo)] text-[11px] sm:text-xs">
                  <Calendar className="w-3 h-3" />
                  <span>{client.numberOfWeeks} weeks</span>
                </div>
              </div>
            </div>
          </div>

          <div className="coach-editor-actions">
            <button
              onClick={() => setShowMealCountSelector(true)}
              className="coach-editor-btn"
            >
              <Settings className="w-4 h-4" />
              <span>{mealsPerDay} Meals/Day</span>
            </button>
            <button
              onClick={() => setShowTemplates(true)}
              className="coach-editor-btn"
            >
              <BookOpen className="w-4 h-4" />
              <span>Templates</span>
            </button>
            {/* Assignment Button - Only show when meals are selected */}
            {mealSlots.some(slot => slot.selectedMeals && slot.selectedMeals.length > 0) && (
              <button
                onClick={handleAssignToClient}
                className="coach-editor-btn coach-editor-btn--primary"
              >
                <Target className="w-4 h-4" />
                <span>Assign</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content - Fully Responsive */}
      <div className="w-full max-w-[1600px] mx-auto px-0 sm:px-4 lg:px-8 xl:px-12 py-2 sm:py-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--red)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Calories</p>
              <p className="coach-stat-value">{Math.round(totalNutrition.calories || 0)}</p>
            </div>
            <div className="coach-stat-ic">
              <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--green)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Protein</p>
              <p className="coach-stat-value">{Math.round(totalNutrition.protein || 0)}g</p>
            </div>
            <div className="coach-stat-ic">
              <Target className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--orange)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Fat</p>
              <p className="coach-stat-value">{Math.round(totalNutrition.fat || 0)}g</p>
            </div>
            <div className="coach-stat-ic">
              <Heart className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>

          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--blue)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Carbs</p>
              <p className="coach-stat-value">{Math.round(totalNutrition.carbs || 0)}g</p>
            </div>
            <div className="coach-stat-ic">
              <Activity className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>
        <p className="text-[color:var(--txt-lo)] text-xs sm:text-sm -mt-1 mb-5 sm:mb-6">
          Daily totals count the first meal in each slot only (what the client sees first). Alternatives are swaps, not extra calories.
        </p>

        {/* Meal Slots */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-8 mb-8">
          {mealSlots.map((slot, index) => (
            <div key={slot.id} className="coach-slot">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="coach-slot-badge">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-2xl font-bold font-display text-[color:var(--txt-hi)] flex items-center gap-2 flex-wrap">
                      <span className="truncate">{slot.name}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--red)' }}>
                        {slot.selectedMeals?.length || 0} {slot.selectedMeals?.length === 1 ? 'meal' : 'meals'}
                      </span>
                    </h3>
                    <p className="text-[color:var(--txt-lo)] text-xs sm:text-sm mt-0.5">
                      {slot.selectedMeals?.length === 0
                        ? 'Add a meal to this slot'
                        : 'Edit portions below · changes autosave'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSlot(slot.id);
                    setShowMealSelector(true);
                  }}
                  className="coach-editor-btn coach-editor-btn--primary justify-center w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Add Meal</span>
                </button>
              </div>

              {(!slot.selectedMeals || slot.selectedMeals.length === 0) ? (
                <div className="text-center py-10 sm:py-14">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                    <Utensils className="w-7 h-7 sm:w-9 sm:h-9 text-[color:var(--txt-lo)]" />
                  </div>
                  <p className="text-base sm:text-lg font-bold text-[color:var(--txt-hi)] mb-1">No meals added yet</p>
                  <p className="text-sm text-[color:var(--txt-lo)]">Tap “Add Meal” to get started</p>
                </div>
              ) : (
                <div className="coach-meal-list space-y-4">
                  {slot.selectedMeals.map((selectedMeal, mealIdx) => {
                    const effectiveMeal = getEffectiveSelectedMeal(selectedMeal);
                    const nutrition = calculateMealNutrition(selectedMeal);
                    const nutritionForDisplay = {
                      calories: nutrition.kcal,
                      protein: nutrition.protein,
                      carbs: nutrition.carbs,
                      fat: nutrition.fat,
                    };
                    const isIngredientsExpanded =
                      expandedIngredients.has('COACH_EDIT_MODE') ||
                      expandedIngredients.has(selectedMeal.id);
                    const isInstructionsExpanded = expandedInstructions.has(selectedMeal.id);
                    const inputKey = `${slot.id}-${selectedMeal.id}-${mealIdx}`;

                    return (
                      <CoachMealPlanCard
                        key={`${slot.id}-${selectedMeal.id}-${mealIdx}`}
                        selectedMeal={selectedMeal}
                        slotId={slot.id}
                        mealName={effectiveMeal.meal.name}
                        category={slot.name}
                        imageUrl={effectiveMeal.meal.image || ''}
                        nutrition={nutritionForDisplay}
                        isIngredientsExpanded={isIngredientsExpanded}
                        isInstructionsExpanded={isInstructionsExpanded}
                        editingMealName={editingMealName === selectedMeal.id}
                        tempMealName={tempMealName}
                        setTempMealName={setTempMealName}
                        onMealNameEdit={() => handleMealNameEdit(selectedMeal.id, effectiveMeal.meal.name)}
                        onMealNameSave={() => handleMealNameSave(slot.id, selectedMeal.id)}
                        onMealNameCancel={handleMealNameCancel}
                        onSaveToLibrary={() => openSaveMealModal(slot.id, selectedMeal)}
                        onEditPortions={() => {
                          startEditingIngredients(selectedMeal.id);
                          setExpandedIngredients((prev) => {
                            if (prev.has('COACH_EDIT_MODE') || prev.has(selectedMeal.id)) return prev;
                            const next = new Set(prev);
                            next.add(selectedMeal.id);
                            return next;
                          });
                        }}
                        onRemoveMeal={() => handleRemoveMeal(slot.id, selectedMeal.id)}
                        onToggleIngredients={() => toggleExpanded(selectedMeal.id, 'ingredients')}
                        onToggleInstructions={() => toggleExpanded(selectedMeal.id, 'instructions')}
                        onAddIngredient={() => handleAddIngredient(slot.id, selectedMeal.id)}
                        onIngredientNameClick={(idx) => {
                          setShowIngredientSearch(`${selectedMeal.id}::${idx}`);
                        }}
                        onIngredientQuantityChange={(idx, qty) =>
                          handleIngredientQuantityChange(selectedMeal.id, idx, qty, slot.id)
                        }
                        onRemoveIngredient={(idx) =>
                          handleRemoveIngredient(slot.id, selectedMeal.id, idx)
                        }
                        onInstructionsChange={(value) => {
                          setMealSlots((prev) =>
                            prev.map((mealSlot) =>
                              mealSlot.id === slot.id
                                ? {
                                    ...mealSlot,
                                    selectedMeals: mealSlot.selectedMeals.map((meal) =>
                                      meal.id === selectedMeal.id
                                        ? {
                                            ...meal,
                                            meal: {
                                              ...meal.meal,
                                              cookingInstructions: value,
                                            },
                                          }
                                        : meal
                                    ),
                                  }
                                : mealSlot
                            )
                          );
                        }}
                        onImageUpload={(e) => handleImageUpload(slot.id, selectedMeal.id, e)}
                        onPhotoClick={() => fileInputRefs.current[inputKey]?.click()}
                        fileInputRef={(el) => {
                          fileInputRefs.current[inputKey] = el;
                        }}
                        inputKey={inputKey}
                      />
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
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center sm:justify-center gap-3 pb-2">
          <button
            onClick={() => setShowSaveTemplate(true)}
            className="coach-editor-btn justify-center sm:px-6"
          >
            <BookOpen className="w-5 h-5" />
            <span>Save as Template</span>
          </button>
          <button
            onClick={handleExportPDF}
            disabled={isLoading}
            className="coach-editor-btn justify-center sm:px-6 disabled:opacity-50"
            style={{ background: 'var(--green)', borderColor: 'transparent', color: '#08130f' }}
          >
            <Download className="w-5 h-5" />
            <span>{isLoading ? 'Exporting...' : 'Export PDF'}</span>
          </button>
        </div>
      </div>

      {/* Meal Selector Modal */}
      {showMealSelector && (
        <div 
          className="coach-modal z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowMealSelector(false);
              setSelectedSlot(null);
              setMealSelectorSearch('');
            }
          }}
        >
          <div className="coach-modal-panel max-w-6xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[color:var(--hair)] gap-3">
              <h2 className="text-lg sm:text-2xl font-bold font-display text-[color:var(--txt-hi)]">Select Meals</h2>
              <button
                onClick={() => {
                  setShowMealSelector(false);
                  setSelectedSlot(null);
                  setMealSelectorSearch('');
                }}
                className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="px-4 sm:px-6 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[color:var(--txt-lo)] pointer-events-none" />
                <input
                  type="search"
                  value={mealSelectorSearch}
                  onChange={(e) => setMealSelectorSearch(e.target.value)}
                  placeholder="Search meals by full name or ingredient…"
                  className="w-full pl-12 pr-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]"
                  style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                  autoFocus
                />
              </div>
              <p className="mt-2 text-xs text-[color:var(--txt-lo)]">
                {filteredDbMeals.length} meal{filteredDbMeals.length === 1 ? '' : 's'}
                {mealSelectorSearch.trim() ? ' matching your search' : ' in library'}
              </p>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {filteredDbMeals.length === 0 && (
                <div className="text-center py-12 text-[color:var(--txt-lo)]">
                  <p className="text-lg font-medium text-[color:var(--txt-hi)] mb-2">No meals found</p>
                  <p className="text-sm">Try a shorter name or different spelling.</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredDbMeals.map((dbMeal) => {
                  try {
                    // Calculate nutrition from DB meal structure
                    const nutrition = (dbMeal.meal_items || []).reduce((total: any, item: any) => {
                      if (!item?.ingredients) return total;
                      const quantity = item.quantity_g || item.quantity || 100;
                      return {
                        calories: total.calories + (item.ingredients.kcal * quantity / 100),
                        protein: total.protein + (item.ingredients.protein * quantity / 100),
                        carbs: total.carbs + (item.ingredients.carbs * quantity / 100),
                        fat: total.fat + (item.ingredients.fat * quantity / 100)
                      };
                    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
                    
                    return (
                      <button
                        key={dbMeal.id}
                        onClick={() => handleMealSelect(dbMeal)}
                        className="text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 group"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                      >
                        <div className="w-full h-28 sm:h-36 rounded-xl overflow-hidden mb-3">
                          <img 
                            src={dbMeal.image || '/api/placeholder/300/200'} 
                            alt={dbMeal.name} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <h3 className="text-base font-bold text-[color:var(--txt-hi)] mb-1 group-hover:text-[color:var(--red)] transition-colors duration-200">{dbMeal.name}</h3>
                        <p className="text-[color:var(--txt-lo)] text-xs capitalize mb-3">{dbMeal.category}</p>
                        
                        {/* Nutrition Info */}
                        <div className="grid grid-cols-2 gap-2 mb-3">
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--surface-3)' }}>
                            <p className="text-[color:var(--txt-lo)] text-[11px]">Calories</p>
                            <p className="text-sm font-bold text-[color:var(--txt-hi)] tnum">{Math.round(nutrition.calories)}</p>
                          </div>
                          <div className="text-center p-2 rounded-lg" style={{ background: 'var(--surface-3)' }}>
                            <p className="text-[color:var(--txt-lo)] text-[11px]">Protein</p>
                            <p className="text-sm font-bold text-[color:var(--txt-hi)] tnum">{Math.round(nutrition.protein)}g</p>
                          </div>
                        </div>

                        {/* Ingredients Preview */}
                        <div className="mb-3">
                          <div className="flex flex-wrap gap-1">
                            {(dbMeal.meal_items || []).slice(0, 2).map((item: any, idx: number) => (
                              <span key={`${dbMeal.id}-ingredient-${idx}-${item.ingredients?.name || idx}`} className="px-2 py-1 rounded-full text-[color:var(--txt-mid)] text-[11px]" style={{ background: 'var(--surface-3)' }}>
                                {item.ingredients?.name || '—'}
                              </span>
                            ))}
                            {(dbMeal.meal_items || []).length > 2 && (
                              <span className="px-2 py-1 rounded-full text-[color:var(--txt-mid)] text-[11px]" style={{ background: 'var(--surface-3)' }}>
                                +{(dbMeal.meal_items || []).length - 2} more
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Add Button */}
                        <div className="flex items-center justify-center gap-2 rounded-xl min-h-[40px] text-sm font-semibold text-white" style={{ background: 'var(--grad-red)' }}>
                          <Plus className="w-4 h-4" />
                          Add
                        </div>
                      </button>
                    );
                  } catch (error) {
                    console.error('Error calculating nutrition for meal:', dbMeal.name, error);
                    return (
                      <button
                        key={dbMeal.id}
                        onClick={() => handleMealSelect(dbMeal)}
                        className="text-left p-4 sm:p-5 rounded-2xl transition-all duration-200 group"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                      >
                        <div className="w-full h-28 sm:h-36 rounded-xl overflow-hidden mb-3">
                          <img 
                            src={dbMeal.image || '/api/placeholder/300/200'} 
                            alt={dbMeal.name} 
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <h3 className="text-base font-bold text-[color:var(--txt-hi)] mb-1">{dbMeal.name}</h3>
                        <p className="text-[color:var(--txt-lo)] text-xs capitalize mb-3">{dbMeal.category}</p>
                        <div className="text-center text-[color:var(--txt-lo)] text-sm">
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
        <div className="coach-modal z-50">
          <div className="coach-modal-panel max-w-4xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[color:var(--hair)]">
              <h2 className="text-lg sm:text-2xl font-bold font-display text-[color:var(--txt-hi)]">Nutrition Templates</h2>
              <button
                onClick={() => setShowTemplates(false)}
                className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {templates.length === 0 ? (
                <div className="text-center py-12 text-[color:var(--txt-lo)]">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                    <BookOpen className="w-10 h-10 opacity-50" />
                  </div>
                  <p className="text-lg font-medium">No templates saved yet</p>
                  <p className="text-sm">Create and save your first template</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                  {templates.map((template) => (
                    <div key={template.id} className="rounded-2xl p-4 sm:p-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                      <div className="flex items-start justify-between mb-4 gap-2">
                        <div className="min-w-0">
                          <h3 className="text-base font-bold text-[color:var(--txt-hi)] mb-1 truncate">{template.name}</h3>
                          <p className="text-[color:var(--txt-lo)] text-xs">{template.goal} • {template.mealsPerDay} meals</p>
                        </div>
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium shrink-0 ${getGoalColor(template.goal)}`}>
                          {getGoalIcon(template.goal)}
                        </div>
                      </div>
                      <div className="text-sm text-[color:var(--txt-lo)] mb-4">
                        <div className="flex justify-between">
                          <span>Calories:</span>
                          <span className="font-bold text-[color:var(--txt-hi)] tnum">{Math.round(template.calories)}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="coach-editor-btn coach-editor-btn--primary w-full justify-center"
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
        <div className="coach-modal z-50">
          <div className="coach-modal-panel max-w-md">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[color:var(--hair)]">
              <h2 className="text-lg sm:text-xl font-semibold font-display text-[color:var(--txt-hi)]">Save Template</h2>
              <button
                onClick={() => setShowSaveTemplate(false)}
                className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)] transition-colors duration-200"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                  placeholder="Enter template name"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowSaveTemplate(false)}
                  className="coach-editor-btn flex-1 justify-center"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!templateName.trim()}
                  className="coach-editor-btn coach-editor-btn--primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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
        <div className="coach-modal z-50">
          <div className="coach-modal-panel max-w-md">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[color:var(--hair)]">
              <h2 className="text-lg sm:text-xl font-semibold font-display text-[color:var(--txt-hi)]">Select Number of Meals</h2>
              <button
                onClick={() => setShowMealCountSelector(false)}
                className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6">
              <div className="mb-5">
                <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-3">How many meals per day?</label>
                <div className="grid grid-cols-2 gap-3">
                  {[2, 3, 4, 5, 6].map((count) => (
                    <button
                      key={count}
                      onClick={() => {
                        setMealsPerDay(count);
                        setShowMealCountSelector(false);
                      }}
                      className={`coach-editor-btn justify-center ${mealsPerDay === count ? 'coach-editor-btn--primary' : ''}`}
                    >
                      {count} Meals
                    </button>
                  ))}
                </div>
              </div>
              <div className="text-sm text-[color:var(--txt-lo)]">
                <p>This will create {mealsPerDay} meal slots for your client's nutrition plan.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ingredient Search Modal */}
      {showIngredientSearch && (
        <div className="coach-modal z-[70]">
          <div className="coach-modal-panel max-w-2xl">
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[color:var(--hair)] gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-semibold font-display text-[color:var(--txt-hi)]">Choose ingredient</h2>
                <p className="text-xs sm:text-sm text-[color:var(--txt-lo)] mt-0.5">Search the full food name from your library</p>
              </div>
              <button
                onClick={() => {
                  setShowIngredientSearch(null);
                  setIngredientSearchTerm('');
                }}
                className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              <div className="mb-4">
                <input
                  type="search"
                  value={ingredientSearchTerm}
                  onChange={(e) => setIngredientSearchTerm(e.target.value)}
                  placeholder="Type the full ingredient name…"
                  className="w-full px-4 py-3 rounded-lg text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]"
                  style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                  autoFocus
                />
              </div>
              <div>
                {filteredIngredientCatalog.length === 0 ? (
                  <p className="text-center text-[color:var(--txt-lo)] py-8">No ingredients match that name.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {filteredIngredientCatalog.map((food, foodIdx) => (
                      <button
                        key={`food-search-${foodIdx}-${food.name}`}
                        type="button"
                        onClick={() => {
                          const parts = showIngredientSearch.split('::');
                          if (parts.length !== 2) {
                            console.error('❌ Invalid ingredient search format:', showIngredientSearch);
                            return;
                          }

                          const mealId = parts[0];
                          const ingredientIndex = parseInt(parts[1], 10);

                          if (isNaN(ingredientIndex)) {
                            console.error('❌ Invalid ingredient index:', parts[1]);
                            return;
                          }

                          const slot = mealSlots.find((s) =>
                            s.selectedMeals.some((m) => m.id === mealId)
                          );
                          if (slot) {
                            handleReplaceIngredient(slot.id, mealId, ingredientIndex, food);
                          } else {
                            console.error(
                              '❌ Slot not found for mealId:',
                              mealId,
                              'Available mealIds:',
                              mealSlots.flatMap((s) => s.selectedMeals.map((m) => m.id))
                            );
                          }
                        }}
                        className="p-4 text-left rounded-lg transition-all duration-200 min-h-[48px]"
                        style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                      >
                        <div className="font-medium text-[color:var(--txt-hi)]">{food.name}</div>
                        <div className="text-xs sm:text-sm text-[color:var(--txt-lo)] mt-1">
                          {food.kcal} kcal · P {food.protein}g · C {food.carbs}g · F {food.fat}g / 100g
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save as NEW meal modal — never overwrites the original library meal */}
      {showSaveMealModal && mealToSave && (
        <div 
          className="coach-modal z-[60]"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSaveMealModal(false);
              setMealToSave(null);
              setSaveMealName('');
              setSaveMealInstructions('');
            }
          }}
        >
          <div className="coach-modal-panel max-w-lg">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[color:var(--hair)] gap-3">
              <div className="min-w-0">
                <h2 className="text-lg sm:text-xl font-bold font-display text-[color:var(--txt-hi)]">Save as new meal</h2>
                <p className="text-[color:var(--txt-lo)] text-xs sm:text-sm mt-0.5">
                  Creates a new library meal. The original stays unchanged.
                </p>
              </div>
              <button
                onClick={() => {
                  setShowSaveMealModal(false);
                  setMealToSave(null);
                  setSaveMealName('');
                  setSaveMealInstructions('');
                }}
                className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 min-h-0">
              <div className="rounded-xl p-3 sm:p-4" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                <div className="flex items-center gap-3 sm:gap-4">
                  <img 
                    src={mealToSave.meal.meal.image} 
                    alt={mealToSave.meal.meal.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-[color:var(--txt-lo)] mb-1">Based on this client’s current meal</p>
                    <h3 className="text-base font-bold text-[color:var(--txt-hi)] truncate">{mealToSave.meal.meal.name}</h3>
                    <div className="flex gap-3 text-xs sm:text-sm text-[color:var(--txt-mid)] mt-1">
                      <span>{mealToSave.meal.meal.ingredients.length} ingredients</span>
                      <span>{Math.round(mealToSave.meal.meal.ingredients.reduce((total, ing) => 
                        total + (ing.food.kcal * ing.quantity / 100), 0))} kcal</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                  New meal name *
                </label>
                <input
                  type="text"
                  value={saveMealName}
                  onChange={(e) => setSaveMealName(e.target.value)}
                  placeholder="e.g. Oatmeal bowl 500 kcal"
                  className="w-full px-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--green)] transition-all"
                  style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                  Cooking instructions <span className="text-[color:var(--txt-lo)] font-normal">(optional)</span>
                </label>
                <textarea
                  value={saveMealInstructions}
                  onChange={(e) => setSaveMealInstructions(e.target.value)}
                  placeholder="Update steps if ingredients changed…"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--green)] transition-all resize-y"
                  style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  onClick={() => {
                    setShowSaveMealModal(false);
                    setMealToSave(null);
                    setSaveMealName('');
                    setSaveMealInstructions('');
                  }}
                  className="coach-editor-btn flex-1 justify-center"
                  disabled={isSavingMeal}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMealToDatabase}
                  disabled={isSavingMeal || !saveMealName.trim()}
                  className="coach-editor-btn flex-1 justify-center text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: 'var(--green)', borderColor: 'transparent', color: '#08130f' }}
                >
                  {isSavingMeal ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving…</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save as new meal</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
