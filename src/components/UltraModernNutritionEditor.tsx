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
import { Client, NutritionPlan, SelectedMeal, Meal, Food } from '../types';
import { calculateTotalNutrition } from '../utils/nutritionCalculator';
import { exportToPDF } from '../utils/pdfExport';
import { dbUpsertNutritionPlan, dbGetNutritionPlan, dbListMeals } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

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
  const [saveMealCategory, setSaveMealCategory] = useState('Main Course');
  const [isSavingMeal, setIsSavingMeal] = useState(false);
  
  // Meal name editing states
  const [editingMealName, setEditingMealName] = useState<string | null>(null);
  const [tempMealName, setTempMealName] = useState('');

  // Load database meals and existing nutrition plan
  useEffect(() => {
    loadDbMeals();
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
      // Calculate nutrition on the fly
      const allMeals = mealSlots.flatMap(slot => slot.selectedMeals || []);
      const nutrition = calculateTotalNutrition(allMeals);
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

  // Convert DB meal to UI meal format with copy-on-assign
  const convertDbMealToUiMeal = (dbMeal: any): Meal => {
    const ingredients = (dbMeal.meal_items || []).map((item: any) => ({
      food: {
        name: item.ingredients.name,
        kcal: item.ingredients.kcal,
        protein: item.ingredients.protein,
        fat: item.ingredients.fat,
        carbs: item.ingredients.carbs
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
    setMealSlots(prev => prev.map(slot => {
      if (slot.id === slotId) {
        return {
          ...slot,
          selectedMeals: slot.selectedMeals.map(meal => {
            if (meal.id === mealId) {
              return {
                ...meal,
                meal: {
                  ...meal.meal,
                  ingredients: meal.meal.ingredients.map((ingredient, idx) => {
                    if (idx === ingredientIndex) {
                      return { ...ingredient, quantity: newQuantity };
                    }
                    return ingredient;
                  })
                }
              };
            }
            return meal;
          })
        };
      }
      return slot;
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
        kcal: 0,
        protein: 0,
        fat: 0,
        carbs: 0
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
    console.log('🔄 Replacing ingredient:', { slotId, mealId, ingredientIndex, newFood: newFood.name });
    
    // Mark that we're making a local update
    isLocalUpdateRef.current = true;
    
    setMealSlots(prev => {
      const updatedSlots = prev.map(s => {
        if (s.id === slotId) {
          const updatedMeals = s.selectedMeals.map(m => {
            if (m.id === mealId) {
              // Validate ingredient index
              if (ingredientIndex < 0 || ingredientIndex >= m.meal.ingredients.length) {
                console.error('❌ Invalid ingredient index:', ingredientIndex, 'Ingredients length:', m.meal.ingredients.length);
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

  // Open save meal modal
  const openSaveMealModal = (slotId: string, meal: SelectedMeal) => {
    setMealToSave({ slotId, meal });
    setSaveMealName(meal.meal.name);
    setSaveMealCategory(meal.meal.category || 'Main Course');
    setShowSaveMealModal(true);
  };

  // Save meal to database
  const handleSaveMealToDatabase = async () => {
    if (!mealToSave || !saveMealName.trim()) {
      alert('Please enter a meal name');
      return;
    }

    if (!supabase) {
      alert('Database connection not available');
      return;
    }

    setIsSavingMeal(true);
    try {
      const { meal } = mealToSave;
      
      // Calculate nutrition
      const nutrition = meal.meal.ingredients.reduce((total, ingredient) => ({
        calories: total.calories + (ingredient.food.kcal * ingredient.quantity / 100),
        protein: total.protein + (ingredient.food.protein * ingredient.quantity / 100),
        carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity / 100),
        fat: total.fat + (ingredient.food.fat * ingredient.quantity / 100)
      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

      // 1. Create the meal
      const { data: mealData, error: mealError } = await supabase
        .from('meals')
        .insert({
          name: saveMealName,
          image: meal.meal.image,
          category: saveMealCategory,
          cuisine_type: meal.meal.cuisine || null,
          difficulty_level: meal.meal.difficulty || 'Easy',
          prep_time_minutes: parseInt(meal.meal.prepTime?.replace(/\D/g, '') || '15'),
          cook_time_minutes: 0,
          servings: 1,
          calories_per_serving: Math.round(nutrition.calories),
          protein_per_serving: Math.round(nutrition.protein),
          carbs_per_serving: Math.round(nutrition.carbs),
          fat_per_serving: Math.round(nutrition.fat),
          description: meal.meal.cookingInstructions || '',
          is_active: true
        })
        .select()
        .single();

      if (mealError) throw mealError;

      // 2. Get or create ingredients and link them to the meal
      for (const ingredient of meal.meal.ingredients) {
        // Check if ingredient exists
        let { data: existingIngredient, error: searchError } = await supabase
          .from('ingredients')
          .select('id')
          .ilike('name', ingredient.food.name)
          .single();

        let ingredientId: string;

        if (existingIngredient) {
          ingredientId = existingIngredient.id;
        } else {
          // Create new ingredient
          const { data: newIngredient, error: createError } = await supabase
            .from('ingredients')
            .insert({
              name: ingredient.food.name,
              category: 'Other',
              kcal: ingredient.food.kcal,
              protein: ingredient.food.protein,
              carbs: ingredient.food.carbs,
              fat: ingredient.food.fat
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating ingredient:', createError);
            continue;
          }
          ingredientId = newIngredient.id;
        }

        // 3. Create meal_items entry
        await supabase
          .from('meal_items')
          .insert({
            meal_id: mealData.id,
            ingredient_id: ingredientId,
            quantity_g: ingredient.quantity
          });
      }

      console.log('✅ Meal saved to database:', mealData);
      alert('Meal saved successfully!');
      
      // Reload meals
      await loadDbMeals();
      
      // Close modal
      setShowSaveMealModal(false);
      setMealToSave(null);
      setSaveMealName('');
    } catch (err) {
      console.error('❌ Error saving meal:', err);
      alert('Failed to save meal. Please try again.');
    } finally {
      setIsSavingMeal(false);
    }
  };

  // Mobile meal card renderer
  const renderMobileMealCard = (selectedMeal: SelectedMeal, nutrition: any, isIngredientsExpanded: boolean, isInstructionsExpanded: boolean, slotId: string) => {
    return (
      <>
        {/* Meal Image - Ultra Modern for Mobile */}
        <div className="w-full h-40 rounded-2xl overflow-hidden mb-4 shadow-2xl border-2 border-slate-600/30 group relative">
          <img 
            src={selectedMeal.meal.image} 
            alt={selectedMeal.meal.name} 
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
          
          {/* Image Upload Button - Hidden file input */}
          <input
            type="file"
            accept="image/*"
            ref={(el) => fileInputRefs.current[`${slotId}-${selectedMeal.id}`] = el}
            onChange={(e) => handleImageUpload(slotId, selectedMeal.id, e)}
            className="hidden"
          />
          
          {/* Camera Icon Button Overlay - Always visible on mobile, hover on desktop */}
          <button
            onClick={() => fileInputRefs.current[`${slotId}-${selectedMeal.id}`]?.click()}
            className="absolute top-2 right-2 w-8 h-8 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white hover:bg-blue-600 transition-all duration-200 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-slate-600/50 hover:border-blue-500/50 active:scale-95 md:hover:scale-110"
            title="Change Image"
          >
            <Camera className="w-4 h-4" />
          </button>
        </div>

        {/* Meal Info - Redesigned for Better Mobile Layout */}
        <div className="space-y-3 mb-4">
          {/* Title Row - Editable */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Crown className="w-5 h-5 text-white" />
            </div>
            {editingMealName === selectedMeal.id ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={tempMealName}
                  onChange={(e) => setTempMealName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMealNameSave(slotId, selectedMeal.id);
                    if (e.key === 'Escape') handleMealNameCancel();
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900/80 text-white text-base font-bold border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={() => handleMealNameSave(slotId, selectedMeal.id)}
                  className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button
                  onClick={handleMealNameCancel}
                  className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <h4 
                onClick={() => handleMealNameEdit(selectedMeal.id, selectedMeal.meal.name)}
                className="text-lg font-bold text-white flex-1 line-clamp-2 leading-tight cursor-pointer hover:text-blue-400 transition-colors"
                title="Click to edit meal name"
              >
                {selectedMeal.meal.name}
              </h4>
            )}
          </div>
          
          {/* Category and Actions Row */}
          <div className="flex items-center justify-between gap-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600/50">
              <Activity className="w-3 h-3 text-blue-400 flex-shrink-0" />
              <p className="text-slate-300 capitalize text-sm font-medium">{selectedMeal.meal.category}</p>
            </div>
            
            {/* Action Buttons - Horizontal Layout */}
            <div className="flex items-center gap-1 flex-shrink-0">
              {editingIngredients.has(selectedMeal.id) ? (
                <>
                  <button
                    onClick={() => saveIngredientChanges(slotId, selectedMeal.id)}
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
                </>
              ) : (
                <>
                  <button
                    onClick={() => openSaveMealModal(slotId, selectedMeal)}
                    className="p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-600/20 transition-colors duration-200"
                    title="Save to Database"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => startEditingIngredients(selectedMeal.id)}
                    className="p-2 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-blue-600/20 transition-colors duration-200"
                    title="Edit Ingredients"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRemoveMeal(slotId, selectedMeal.id)}
                    className="p-2 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-colors duration-200"
                    title="Remove Meal"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Nutrition Info - Compact Mobile Design */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {/* Calories */}
          <div className="bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-xl p-2 border border-orange-500/20">
            <div className="text-center">
              <Flame className="w-4 h-4 text-orange-400 mx-auto mb-1" />
              <div className="text-orange-400 text-[10px] font-medium mb-0.5">Cal</div>
              <div className="text-white text-sm font-bold">{Math.round(nutrition.calories * selectedMeal.quantity)}</div>
            </div>
          </div>
          
          {/* Protein */}
          <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl p-2 border border-blue-500/20">
            <div className="text-center">
              <Target className="w-4 h-4 text-blue-400 mx-auto mb-1" />
              <div className="text-blue-400 text-[10px] font-medium mb-0.5">Pro</div>
              <div className="text-white text-sm font-bold">{Math.round(nutrition.protein * selectedMeal.quantity)}g</div>
            </div>
          </div>
          
          {/* Carbs */}
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl p-2 border border-green-500/20">
            <div className="text-center">
              <TrendingUp className="w-4 h-4 text-green-400 mx-auto mb-1" />
              <div className="text-green-400 text-[10px] font-medium mb-0.5">Carb</div>
              <div className="text-white text-sm font-bold">{Math.round(nutrition.carbs * selectedMeal.quantity)}g</div>
            </div>
          </div>
          
          {/* Fat */}
          <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl p-2 border border-purple-500/20">
            <div className="text-center">
              <Shield className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-purple-400 text-[10px] font-medium mb-0.5">Fat</div>
              <div className="text-white text-sm font-bold">{Math.round(nutrition.fat * selectedMeal.quantity)}g</div>
            </div>
          </div>
        </div>

        {/* Expandable Sections - Compact Mobile Design */}
        <div className="space-y-3">
          {/* Ingredients - Compact Design */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-3 border border-slate-600/30">
            <div className={`flex items-center justify-between ${isIngredientsExpanded ? 'mb-2' : ''}`}>
              <button
                onClick={() => toggleExpanded(selectedMeal.id, 'ingredients')}
                className="flex items-center gap-2 flex-1 text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                  <List className="w-4 h-4 text-white" />
                </div>
                <div>
                  <span className="text-white font-bold text-sm">Ingredients</span>
                  <span className="text-slate-400 text-xs ml-2">({selectedMeal.meal.ingredients.length})</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${isIngredientsExpanded ? 'rotate-180' : ''}`} />
              </button>
              
              {isIngredientsExpanded && (
                <div className="flex items-center gap-1.5">
                  {/* Add Ingredient Button */}
                  <button
                    onClick={() => handleAddIngredient(slotId, selectedMeal.id)}
                    className="p-2 rounded-lg bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30 transition-colors"
                    title="Add Ingredient"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  
                  {/* Collapse Ingredients Button */}
                  <button
                    onClick={() => toggleExpanded(selectedMeal.id, 'ingredients')}
                    className="p-2 rounded-lg bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
                    title="Done Editing"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
            {isIngredientsExpanded && (
              <div className="mt-2 space-y-1.5">
                {/* Ultra Modern ingredient list for coaches */}
                {selectedMeal.meal.ingredients.map((ingredient, idx) => {
                  const key = `${selectedMeal.id}-${idx}`;
                  const currentQuantity = editingQuantities[key] !== undefined 
                    ? editingQuantities[key] 
                    : ingredient.quantity;
                  
                  return (
                    <div 
                      key={`${slotId}-${selectedMeal.id}-ingredient-${idx}`} 
                      className="group relative bg-gradient-to-r from-slate-800/60 via-slate-700/40 to-slate-800/60 backdrop-blur-sm rounded-xl p-2.5 border border-slate-600/40 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/10"
                    >
                      {/* Gradient overlay on hover */}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity duration-300"></div>
                      
                      <div className="relative flex items-center gap-2.5">
                        {/* Number Badge */}
                        <div className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30 flex items-center justify-center">
                          <span className="text-blue-300 text-[10px] font-bold">{idx + 1}</span>
                        </div>
                        
                        {/* Ingredient Name - Clickable */}
                        <div 
                          className="flex-1 min-w-0 cursor-pointer group/name" 
                          onClick={(e) => {
                            e.stopPropagation();
                            const searchKey = `${selectedMeal.id}::${idx}`;
                            setShowIngredientSearch(searchKey);
                          }}
                        >
                          <span className="text-white font-semibold text-sm block truncate group-hover/name:text-blue-400 transition-colors">{ingredient.food.name}</span>
                        </div>
                        
                        {/* Quantity Input - Modern Style */}
                        <div className="flex items-center gap-1.5 bg-slate-900/60 rounded-lg px-2 py-1 border border-slate-600/50 group-hover:border-blue-500/30 transition-colors">
                          <input
                            type="number"
                            value={currentQuantity}
                            onChange={(e) => handleIngredientQuantityChange(selectedMeal.id, idx, parseFloat(e.target.value) || 0, slotId)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-11 bg-transparent text-white text-xs font-bold text-center focus:outline-none"
                            min="0"
                          />
                          <span className="text-slate-400 text-[10px] font-medium">g</span>
                        </div>
                        
                        {/* Remove Button - Modern Style */}
                        <button
                          onClick={() => handleRemoveIngredient(slotId, selectedMeal.id, idx)}
                          className="flex-shrink-0 w-7 h-7 rounded-lg bg-gradient-to-br from-red-600/20 to-red-700/20 hover:from-red-600/30 hover:to-red-700/30 text-red-400 hover:text-red-300 border border-red-500/30 hover:border-red-500/50 transition-all duration-200 flex items-center justify-center hover:scale-105"
                          title="Remove"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cooking Instructions - Editable */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-xl p-3 border border-slate-600/30">
            <button
              onClick={() => toggleExpanded(selectedMeal.id, 'instructions')}
              className={`flex items-center gap-2 w-full text-left ${isInstructionsExpanded ? 'mb-2' : ''}`}
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm">Cooking Instructions</span>
              <ChevronDown className={`w-4 h-4 text-slate-400 ml-auto transition-transform ${isInstructionsExpanded ? 'rotate-180' : ''}`} />
            </button>
            
            {isInstructionsExpanded && (
              <div className="mt-2">
                <textarea
                  value={selectedMeal.meal.cookingInstructions || ''}
                  onChange={(e) => {
                    // Update cooking instructions
                    setMealSlots(prev => prev.map(mealSlot =>
                      mealSlot.id === slotId ? {
                        ...mealSlot,
                        selectedMeals: mealSlot.selectedMeals.map(meal =>
                          meal.id === selectedMeal.id ? {
                            ...meal,
                            meal: {
                              ...meal.meal,
                              cookingInstructions: e.target.value
                            }
                          } : meal
                        )
                      } : mealSlot
                    ));
                  }}
                  placeholder="Enter cooking instructions..."
                  className="w-full min-h-[100px] bg-slate-900/60 border border-slate-600/50 rounded-lg p-3 text-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all resize-none"
                />
              </div>
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header - Mobile Optimized */}
      <div className="sticky top-0 z-50 bg-gray-800 backdrop-blur-xl border-b border-gray-700">
        <div className="w-full px-3 sm:px-4 lg:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-3 sm:py-0 sm:h-16 space-y-3 sm:space-y-0">
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
              >
                <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              
              <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <Utensils className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h1 className="text-lg sm:text-2xl font-bold text-white truncate">
                    Nutrition Plan Builder
                  </h1>
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-1 sm:space-y-0 sm:space-x-3">
                    <div className={`inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm font-medium ${getGoalColor(client.goal)}`}>
                      {getGoalIcon(client.goal)}
                      <span className="capitalize">{client.goal}</span>
                    </div>
                    <div className="flex items-center space-x-1 sm:space-x-2 text-slate-400 text-xs sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{client.numberOfWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <button
                onClick={() => setShowMealCountSelector(true)}
                className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 font-medium transition-colors duration-200 text-xs sm:text-sm"
              >
                <Settings className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">{mealsPerDay} Meals/Day</span>
                <span className="sm:hidden">{mealsPerDay}M</span>
              </button>
              <button
                onClick={() => setShowTemplates(true)}
                className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg text-slate-300 bg-slate-800 hover:bg-slate-700 font-medium transition-colors duration-200 text-xs sm:text-sm"
              >
                <BookOpen className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Templates</span>
                <span className="sm:hidden">T</span>
              </button>
              {/* Assignment Button - Only show when meals are selected */}
              {mealSlots.some(slot => slot.selectedMeals && slot.selectedMeals.length > 0) && (
                <button
                  onClick={handleAssignToClient}
                  className="inline-flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors duration-200 text-xs sm:text-sm"
                >
                  <Target className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Assign to Client</span>
                  <span className="sm:hidden">Assign</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Fully Responsive */}
      <div className="w-full max-w-[1600px] mx-auto px-3 sm:px-4 lg:px-8 xl:px-12 py-4 sm:py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-3 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Total Calories</p>
                <p className="text-lg sm:text-3xl font-bold text-white">{Math.round(totalNutrition.calories || 0)}</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-red-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-3 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Protein</p>
                <p className="text-lg sm:text-3xl font-bold text-white">{Math.round(totalNutrition.protein || 0)}g</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Target className="w-4 h-4 sm:w-6 sm:h-6 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-3 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Fat</p>
                <p className="text-lg sm:text-3xl font-bold text-white">{Math.round(totalNutrition.fat || 0)}g</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Heart className="w-4 h-4 sm:w-6 sm:h-6 text-orange-400" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-3 sm:p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs sm:text-sm font-medium">Carbs</p>
                <p className="text-lg sm:text-3xl font-bold text-white">{Math.round(totalNutrition.carbs || 0)}g</p>
              </div>
              <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 sm:w-6 sm:h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Meal Slots */}
        <div className="space-y-6 lg:space-y-8 mb-8">
          {mealSlots.map((slot, index) => (
            <div key={slot.id} className="bg-slate-800/30 backdrop-blur-sm rounded-2xl lg:rounded-3xl border border-slate-700/50 p-4 sm:p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
                <div className="flex items-center gap-3 sm:gap-4 flex-1">
                  <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-2xl shadow-red-500/30 hover:shadow-red-500/50 transition-all duration-300 hover:scale-110 flex-shrink-0">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white flex items-center gap-2 flex-wrap">
                      <span className="truncate">{slot.name}</span>
                      <span className="px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 text-xs font-bold flex-shrink-0">
                        {slot.selectedMeals?.length || 0} {slot.selectedMeals?.length === 1 ? 'meal' : 'meals'}
                      </span>
                    </h3>
                    <p className="text-slate-400 text-xs sm:text-sm mt-1">
                      {slot.selectedMeals?.length === 0 ? 'Tap to add delicious meals' : 'Looking great! Add more or edit existing'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedSlot(slot.id);
                    setShowMealSelector(true);
                  }}
                  className="inline-flex items-center gap-2.5 px-5 sm:px-6 py-2.5 sm:py-3 rounded-2xl bg-gradient-to-r from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 font-semibold transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-red-500/30 hover:scale-105 active:scale-95"
                >
                  <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">Add Meal</span>
                </button>
              </div>

              {(!slot.selectedMeals || slot.selectedMeals.length === 0) ? (
                <div className="text-center py-16 relative overflow-hidden">
                  {/* Animated Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-transparent to-purple-500/20 animate-pulse"></div>
                  </div>
                  
                  <div className="relative">
                    <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-700/60 to-slate-800/60 backdrop-blur-xl border border-slate-600/40 flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-all duration-300">
                      <Utensils className="w-12 h-12 text-slate-300 group-hover:text-red-400 transition-colors" />
                    </div>
                    <p className="text-xl font-bold text-white mb-2">No meals added yet</p>
                    <p className="text-sm text-slate-400">Click "Add Meal" above to get started</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  {/* Mobile: Horizontal scroll, Desktop: Grid */}
                  <div className="flex overflow-x-auto space-x-4 pb-4 md:hidden scrollbar-hide mobile-scroll px-2">
                    {/* Swipe indicator for mobile */}
                    {slot.selectedMeals.length > 1 && (
                      <div className="absolute top-2 right-2 z-10 bg-slate-800/80 backdrop-blur-sm rounded-full px-3 py-1 text-xs text-slate-300">
                        ← Swipe →
                      </div>
                    )}
                    {slot.selectedMeals.map((selectedMeal, mealIndex) => {
                      const nutrition = selectedMeal.meal.ingredients.reduce((total, ingredient) => ({
                        calories: total.calories + (ingredient.food.kcal * ingredient.quantity / 100),
                        protein: total.protein + (ingredient.food.protein * ingredient.quantity / 100),
                        carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity / 100),
                        fat: total.fat + (ingredient.food.fat * ingredient.quantity / 100)
                      }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                      // For coaches, check if set contains COACH_EDIT_MODE or specific meal ID
                      const isIngredientsExpanded = expandedIngredients.has('COACH_EDIT_MODE') || expandedIngredients.has(selectedMeal.id);
                      const isInstructionsExpanded = expandedInstructions.has(selectedMeal.id);

                      return (
                        <div key={`${slot.id}-${selectedMeal.id}-mobile-${mealIndex}`} className={`flex-shrink-0 w-80 bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-600/40 hover:border-blue-500/40 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/10 ${mealIndex === 0 ? 'ml-2' : ''} ${mealIndex === slot.selectedMeals.length - 1 ? 'mr-2' : ''}`}>
                          {/* Mobile Meal Card Content */}
                          {renderMobileMealCard(selectedMeal, nutrition, isIngredientsExpanded, isInstructionsExpanded, slot.id)}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Desktop: Grid layout */}
                  <div className="hidden md:grid md:grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-4 lg:gap-6">
                    {slot.selectedMeals.map((selectedMeal, mealIdx) => {
                    const nutrition = selectedMeal.meal.ingredients.reduce((total, ingredient) => ({
                      calories: total.calories + (ingredient.food.kcal * ingredient.quantity / 100),
                      protein: total.protein + (ingredient.food.protein * ingredient.quantity / 100),
                      carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity / 100),
                      fat: total.fat + (ingredient.food.fat * ingredient.quantity / 100)
                    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

                    const isIngredientsExpanded = expandedIngredients.has(selectedMeal.id);
                    const isInstructionsExpanded = expandedInstructions.has(selectedMeal.id);

                    return (
                      <div key={`${slot.id}-${selectedMeal.id}-desktop-${mealIdx}`} className="bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-3xl p-6 border border-slate-600/40 hover:border-blue-500/40 transition-all duration-300 shadow-2xl hover:shadow-3xl hover:shadow-blue-500/10 hover:scale-[1.02]">
                        {/* Meal Image - Ultra Modern */}
                        <div className="w-full h-40 sm:h-48 rounded-2xl overflow-hidden mb-5 shadow-2xl border-2 border-slate-600/30 group relative">
                          <img 
                            src={selectedMeal.meal.image} 
                            alt={selectedMeal.meal.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent"></div>
                          
                          {/* Image Upload Button - Hidden file input */}
                          <input
                            type="file"
                            accept="image/*"
                            ref={(el) => fileInputRefs.current[`${slot.id}-${selectedMeal.id}-desktop`] = el}
                            onChange={(e) => handleImageUpload(slot.id, selectedMeal.id, e)}
                            className="hidden"
                          />
                          
                          {/* Camera Icon Button Overlay - Always visible on mobile, hover on desktop */}
                          <button
                            onClick={() => fileInputRefs.current[`${slot.id}-${selectedMeal.id}-desktop`]?.click()}
                            className="absolute top-3 right-3 w-10 h-10 rounded-xl bg-slate-900/80 backdrop-blur-sm text-white hover:bg-blue-600 transition-all duration-200 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 border border-slate-600/50 hover:border-blue-500/50 active:scale-95 md:hover:scale-110 shadow-lg"
                            title="Change Image"
                          >
                            <Camera className="w-5 h-5" />
                          </button>
                        </div>

                        {/* Meal Info - Ultra Modern Desktop */}
                        <div className="mb-5">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 flex-shrink-0">
                              <Crown className="w-5 h-5 text-white" />
                            </div>
                            {editingMealName === selectedMeal.id ? (
                              <div className="flex-1 flex items-center gap-2">
                                <input
                                  type="text"
                                  value={tempMealName}
                                  onChange={(e) => setTempMealName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleMealNameSave(slot.id, selectedMeal.id);
                                    if (e.key === 'Escape') handleMealNameCancel();
                                  }}
                                  className="flex-1 px-3 py-2 rounded-lg bg-slate-900/80 text-white text-lg font-bold border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  autoFocus
                                />
                                <button
                                  onClick={() => handleMealNameSave(slot.id, selectedMeal.id)}
                                  className="p-2 rounded-lg bg-green-600/20 text-green-400 hover:bg-green-600/30"
                                >
                                  <CheckCircle className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={handleMealNameCancel}
                                  className="p-2 rounded-lg bg-red-600/20 text-red-400 hover:bg-red-600/30"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            ) : (
                              <h4 
                                onClick={() => handleMealNameEdit(selectedMeal.id, selectedMeal.meal.name)}
                                className="text-xl font-bold text-white flex-1 line-clamp-2 leading-tight cursor-pointer hover:text-blue-400 transition-colors"
                                title="Click to edit meal name"
                              >
                                {selectedMeal.meal.name}
                              </h4>
                            )}
                          </div>
                          <div className="flex items-center justify-between gap-3">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600/50">
                              <Activity className="w-3 h-3 text-blue-400" />
                              <p className="text-slate-300 capitalize text-sm font-medium">{selectedMeal.meal.category}</p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {editingIngredients.has(selectedMeal.id) ? (
                                <div className="flex items-center gap-2 bg-slate-700/50 rounded-xl p-1 border border-slate-600/50">
                                  <button
                                    onClick={() => saveIngredientChanges(slot.id, selectedMeal.id)}
                                    className="p-2.5 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-600/20 transition-all duration-200 hover:scale-110"
                                    title="Save Changes"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => stopEditingIngredients(selectedMeal.id)}
                                    className="p-2.5 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-all duration-200 hover:scale-110"
                                    title="Cancel"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => openSaveMealModal(slot.id, selectedMeal)}
                                    className="p-2.5 rounded-xl text-slate-300 hover:text-green-400 hover:bg-green-600/20 border border-slate-600/50 hover:border-green-500/50 transition-all duration-200 hover:scale-110"
                                    title="Save to Database"
                                  >
                                    <Save className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => startEditingIngredients(selectedMeal.id)}
                                    className="p-2.5 rounded-xl text-slate-300 hover:text-blue-400 hover:bg-blue-600/20 border border-slate-600/50 hover:border-blue-500/50 transition-all duration-200 hover:scale-110"
                                    title="Edit Ingredients"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              <button
                                onClick={() => handleRemoveMeal(slot.id, selectedMeal.id)}
                                className="p-2.5 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-600/20 border border-slate-600/50 hover:border-red-500/50 transition-all duration-200 hover:scale-110"
                                title="Remove Meal"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Nutrition Info - Ultra Modern Cards */}
                        <div className="grid grid-cols-2 gap-3 mb-5">
                          <div className="relative group bg-gradient-to-br from-orange-500/10 to-red-500/10 rounded-2xl p-4 border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative text-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-orange-500/30">
                                <Flame className="w-4 h-4 text-white" />
                              </div>
                              <p className="text-slate-400 text-xs mb-1 font-medium">Calories</p>
                              <p className="text-2xl font-bold text-white">{Math.round(nutrition.calories * selectedMeal.quantity)}</p>
                            </div>
                          </div>
                          <div className="relative group bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl p-4 border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                            <div className="relative text-center">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-blue-500/30">
                                <Target className="w-4 h-4 text-white" />
                              </div>
                              <p className="text-slate-400 text-xs mb-1 font-medium">Protein</p>
                              <p className="text-2xl font-bold text-white">{Math.round(nutrition.protein * selectedMeal.quantity)}g</p>
                            </div>
                          </div>
                        </div>

                        {/* Ingredients Section - Ultra Modern */}
                        <div className="mb-5">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/30">
                                <List className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h5 className="text-white font-bold text-base">Ingredients</h5>
                                <p className="text-slate-400 text-xs">Edit portions below</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
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
                                // Always in edit mode for coaches
                                const isEditing = true;
                                const key = `${selectedMeal.id}-${idx}`;
                                const currentQuantity = ingredient.quantity; // Use the actual updated quantity from mealSlots
                                const ingredientCalories = Math.round((ingredient.food.kcal * currentQuantity / 100) * selectedMeal.quantity);
                                
                                return (
                                  <div key={`${slot.id}-${selectedMeal.id}-ingredient-${idx}`} className="relative group">
                                    {/* Modern Glass Morphism Card */}
                                    <div className="bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-2xl p-4 sm:p-5 border border-slate-600/40 hover:border-blue-500/40 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-blue-500/10 hover:scale-[1.02]">
                                      {/* Animated Background Gradient */}
                                      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-transparent to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                      
                                      <div className="relative">
                                        <div className="flex items-start justify-between gap-4">
                                          {/* Ingredient Name & Info Section */}
                                          <div className="flex-1 min-w-0">
                                            <div onClick={(e) => {
                                              e.stopPropagation();
                                              // Use a separator that won't conflict with mealId format
                                              const searchKey = `${selectedMeal.id}::${idx}`;
                                              console.log('📝 Opening ingredient search for:', { mealId: selectedMeal.id, idx, slotId: slot.id, searchKey });
                                              setShowIngredientSearch(searchKey);
                                            }} className="cursor-pointer">
                                              <div className="flex items-center gap-3 mb-3">
                                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all duration-300">
                                                  <Sparkles className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                  <h4 className="text-white font-bold text-base sm:text-lg group-hover:text-blue-400 transition-colors">{ingredient.food.name}</h4>
                                                  <p className="text-slate-400 text-xs">Ingredient #{idx + 1}</p>
                                                </div>
                                              </div>
                                              
                                              {/* Simplified Calorie Tag */}
                                              <div className="flex items-center gap-2">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-300 text-xs font-medium">
                                                  <Flame className="w-3 h-3" />
                                                  {ingredient.food.kcal} kcal/100g
                                                </span>
                                              </div>
                                            </div>
                                          </div>
                                          
                                          {/* Portion Control Section */}
                                          <div className="flex items-start gap-3 flex-shrink-0">
                                            <div className="text-right">
                                              <p className="text-slate-400 text-xs mb-1">Total Calories</p>
                                              <div className="flex items-center gap-1.5">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg shadow-red-500/30">
                                                  <span className="text-white font-bold text-sm">{ingredientCalories}</span>
                                                </div>
                                                <span className="text-red-400 font-bold text-sm">cal</span>
                                              </div>
                                            </div>
                                            
                                            {/* Portion Input */}
                                            {isEditing && (
                                              <div className="flex flex-col items-center gap-1">
                                                <p className="text-slate-400 text-xs mb-1">Portion (g)</p>
                                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                  <input
                                                    type="number"
                                                    value={currentQuantity}
                                                    onChange={(e) => handleIngredientQuantityChange(selectedMeal.id, idx, parseFloat(e.target.value) || 0, slot.id)}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onFocus={(e) => e.stopPropagation()}
                                                    className="w-20 sm:w-24 px-3 py-2 rounded-xl bg-slate-900/80 text-white text-sm sm:text-base text-center border border-slate-600/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-slate-400 transition-all backdrop-blur-sm font-bold"
                                                    min="0"
                                                    step="0.1"
                                                  />
                                                  <span className="text-slate-400 text-xs sm:text-sm font-medium">g</span>
                                                </div>
                                              </div>
                                            )}
                                            
                                            {/* Remove Button */}
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveIngredient(slot.id, selectedMeal.id, idx);
                                              }}
                                              className="mt-7 p-2.5 rounded-xl text-red-400 hover:text-red-300 hover:bg-red-600/20 transition-all duration-200 flex-shrink-0 hover:scale-110 border border-red-500/20 hover:border-red-500/40"
                                              title="Remove Ingredient"
                                            >
                                              <Trash2 className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Cooking Instructions Section - Ultra Modern Design */}
                        <div className="mt-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                                <BookOpen className="w-5 h-5 text-white" />
                              </div>
                              <div>
                                <h5 className="text-white font-bold text-base">Cooking Instructions</h5>
                                <p className="text-slate-400 text-xs">Follow these steps</p>
                              </div>
                            </div>
                            <button
                              onClick={() => toggleExpanded(selectedMeal.id, 'instructions')}
                              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600/50 text-slate-300 hover:text-white transition-all duration-200 hover:border-purple-500/50"
                            >
                              <span className="text-sm font-medium">
                                {isInstructionsExpanded ? 'Hide' : 'Show'}
                              </span>
                              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isInstructionsExpanded ? 'rotate-180' : ''}`} />
                            </button>
                          </div>
                          
                          {isInstructionsExpanded && (
                            <div className="bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-2xl p-5 border border-slate-600/40 hover:border-purple-500/40 transition-all duration-300 shadow-lg">
                              <textarea
                                value={selectedMeal.meal.cookingInstructions || ''}
                                onChange={(e) => {
                                  // Update cooking instructions
                                  setMealSlots(prev => prev.map(mealSlot =>
                                    mealSlot.id === slot.id ? {
                                      ...mealSlot,
                                      selectedMeals: mealSlot.selectedMeals.map(meal =>
                                        meal.id === selectedMeal.id ? {
                                          ...meal,
                                          meal: {
                                            ...meal.meal,
                                            cookingInstructions: e.target.value
                                          }
                                        } : meal
                                      )
                                    } : mealSlot
                                  ));
                                }}
                                onBlur={() => {
                                  // Auto-save will be triggered automatically by the mealSlots useEffect
                                  console.log('📝 Cooking instructions updated, auto-save will trigger after debounce');
                                }}
                                className="w-full min-h-[120px] bg-slate-900/40 border border-slate-600/30 rounded-xl p-4 text-white text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500/50 transition-all backdrop-blur-sm"
                                placeholder="Enter cooking instructions..."
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  </div>
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
              <div className="flex items-center gap-4">
                <h2 className="text-2xl font-bold text-white">Select Meals</h2>
                <button
                  onClick={() => {
                    alert('Create New Meal feature coming soon! For now, you can add a meal and customize it by changing ingredients and image, then save it to the database.');
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white hover:from-blue-700 hover:to-cyan-700 font-medium transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Meal</span>
                </button>
              </div>
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
                {dbMeals.map((dbMeal) => {
                  try {
                    // Calculate nutrition from DB meal structure
                    const nutrition = (dbMeal.meal_items || []).reduce((total: any, item: any) => {
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
                        className="text-left p-6 rounded-2xl bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 hover:bg-slate-600/40 transition-all duration-200 shadow-lg hover:shadow-xl group"
                      >
                        <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-lg">
                          <img 
                            src={dbMeal.image || '/api/placeholder/300/200'} 
                            alt={dbMeal.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-200">{dbMeal.name}</h3>
                        <p className="text-slate-400 capitalize mb-4">{dbMeal.category}</p>
                        
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
                            {(dbMeal.meal_items || []).slice(0, 2).map((item: any, idx: number) => (
                              <span key={`${dbMeal.id}-ingredient-${idx}-${item.ingredients?.name || idx}`} className="px-2 py-1 rounded-full bg-slate-600/50 text-slate-300 text-xs">
                                {item.ingredients.name}
                              </span>
                            ))}
                            {(dbMeal.meal_items || []).length > 2 && (
                              <span className="px-2 py-1 rounded-full bg-slate-600/50 text-slate-300 text-xs">
                                +{(dbMeal.meal_items || []).length - 2} more
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
                    console.error('Error calculating nutrition for meal:', dbMeal.name, error);
                    return (
                      <button
                        key={dbMeal.id}
                        onClick={() => handleMealSelect(dbMeal)}
                        className="text-left p-6 rounded-2xl bg-slate-700/30 backdrop-blur-sm border border-slate-600/50 hover:bg-slate-600/40 transition-all duration-200 shadow-lg hover:shadow-xl group"
                      >
                        <div className="w-full h-40 rounded-xl overflow-hidden mb-4 shadow-lg">
                          <img 
                            src={dbMeal.image || '/api/placeholder/300/200'} 
                            alt={dbMeal.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          />
                        </div>
                        <h3 className="text-lg font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-200">{dbMeal.name}</h3>
                        <p className="text-slate-400 capitalize mb-4">{dbMeal.category}</p>
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
                <div className="grid grid-cols-2 gap-3">
                  {[2, 3, 4, 5, 6].map((count) => (
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
                    .map((food, foodIdx) => (
                      <button
                        key={`food-search-${foodIdx}-${food.name}`}
                        onClick={() => {
                          // Use '::' as separator to avoid conflicts with mealId format
                          const parts = showIngredientSearch.split('::');
                          if (parts.length !== 2) {
                            console.error('❌ Invalid ingredient search format:', showIngredientSearch);
                            return;
                          }
                          
                          const mealId = parts[0];
                          const ingredientIndex = parseInt(parts[1]);
                          
                          console.log('🔍 Ingredient search clicked:', { 
                            showIngredientSearch, 
                            mealId, 
                            ingredientIndex, 
                            foodName: food.name,
                            isValid: !isNaN(ingredientIndex)
                          });
                          
                          if (isNaN(ingredientIndex)) {
                            console.error('❌ Invalid ingredient index:', parts[1]);
                            return;
                          }
                          
                          const slot = mealSlots.find(s => s.selectedMeals.some(m => m.id === mealId));
                          if (slot) {
                            console.log('✅ Found slot:', slot.id, 'for mealId:', mealId);
                            handleReplaceIngredient(slot.id, mealId, ingredientIndex, food);
                          } else {
                            console.error('❌ Slot not found for mealId:', mealId, 'Available mealIds:', mealSlots.flatMap(s => s.selectedMeals.map(m => m.id)));
                          }
                        }}
                        className="p-4 text-left bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600/50 hover:border-slate-500/50 transition-all duration-200"
                      >
                        <div className="font-medium text-white">{food.name}</div>
                        <div className="text-sm text-slate-400 mt-1">
                          {food.kcal} kcal per 100g
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Save Meal Modal */}
      {showSaveMealModal && mealToSave && (
        <div 
          className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm flex items-center justify-center z-[60] p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowSaveMealModal(false);
              setMealToSave(null);
            }
          }}
        >
          <div className="w-full max-w-2xl bg-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
              <h2 className="text-2xl font-bold text-white">Save Meal to Database</h2>
              <button
                onClick={() => {
                  setShowSaveMealModal(false);
                  setMealToSave(null);
                }}
                className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Meal Preview */}
              <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50">
                <div className="flex items-center gap-4">
                  <img 
                    src={mealToSave.meal.meal.image} 
                    alt={mealToSave.meal.meal.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white mb-2">{mealToSave.meal.meal.name}</h3>
                    <div className="flex gap-4 text-sm text-slate-300">
                      <span>{mealToSave.meal.meal.ingredients.length} ingredients</span>
                      <span>{Math.round(mealToSave.meal.meal.ingredients.reduce((total, ing) => 
                        total + (ing.food.kcal * ing.quantity / 100), 0))} kcal</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Meal Name Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Meal Name *
                </label>
                <input
                  type="text"
                  value={saveMealName}
                  onChange={(e) => setSaveMealName(e.target.value)}
                  placeholder="Enter meal name"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Category Selector */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Category
                </label>
                <select
                  value={saveMealCategory}
                  onChange={(e) => setSaveMealCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                >
                  <option value="Main Course">Main Course</option>
                  <option value="Breakfast">Breakfast</option>
                  <option value="Lunch">Lunch</option>
                  <option value="Dinner">Dinner</option>
                  <option value="Snack">Snack</option>
                  <option value="Dessert">Dessert</option>
                  <option value="Salad">Salad</option>
                  <option value="Soup">Soup</option>
                  <option value="Appetizer">Appetizer</option>
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowSaveMealModal(false);
                    setMealToSave(null);
                  }}
                  className="flex-1 px-6 py-3 rounded-xl bg-slate-700 text-white hover:bg-slate-600 font-medium transition-all duration-200"
                  disabled={isSavingMeal}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMealToDatabase}
                  disabled={isSavingMeal || !saveMealName.trim()}
                  className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 text-white hover:from-green-700 hover:to-emerald-700 font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSavingMeal ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5" />
                      <span>Save to Database</span>
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
