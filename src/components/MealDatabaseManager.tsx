import React, { useState, useMemo, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  ChefHat, 
  Clock,
  Utensils,
  ChevronDown,
  Grid3X3,
  List,
} from 'lucide-react';
import { dbListMeals, dbListIngredients, dbAddMeal, dbUpdateMeal, dbDeleteMeal, dbAddMealItem, dbDeleteMealItem } from '../lib/db';
import { mealMatchesSearch } from '../utils/mealSearch';

interface DBMeal {
  id: string;
  name: string;
  category?: string;
  image?: string;
  cooking_instructions?: string;
  is_template?: boolean;
  kcal_target?: number;
  meal_items?: Array<{
    id: string;
    quantity: number;
    quantity_g?: number;
    ingredients: {
      name: string;
      kcal: number;
      protein: number;
      fat: number;
      carbs: number;
    };
  }>;
}

interface DBIngredient {
  id: string;
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface MealDatabaseManagerProps {
  onBack: () => void;
}

const MealDatabaseManager: React.FC<MealDatabaseManagerProps> = ({ onBack }) => {
  const [meals, setMeals] = useState<DBMeal[]>([]);
  const [ingredients, setIngredients] = useState<DBIngredient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [viewingMeal, setViewingMeal] = useState<DBMeal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingMeal, setEditingMeal] = useState<DBMeal | null>(null);
  const [loading, setLoading] = useState(false);

  // Form state for creating/editing meals
  const [formData, setFormData] = useState({
    name: '',
    image: '',
    cooking_instructions: '',
    is_template: true,
    kcal_target: 800,
    selectedIngredients: [] as Array<{ ingredient: DBIngredient; quantity: number }>
  });

  // Load data from Supabase
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [mealsResult, ingredientsResult] = await Promise.all([
      dbListMeals(),
      dbListIngredients()
    ]);
    
    if (mealsResult.data) {
      setMeals(mealsResult.data);
    }
    if (ingredientsResult.data) {
      setIngredients(ingredientsResult.data);
    }
    setLoading(false);
  };

  // Filter and search meals — match full typed name (all tokens) against meal or ingredients
  const filteredMeals = useMemo(() => {
    const q = searchTerm.trim();
    if (!q) return meals;
    return meals.filter((meal) =>
      mealMatchesSearch(
        meal.name || '',
        q,
        (meal.meal_items || []).map((item) => item.ingredients?.name)
      )
    );
  }, [meals, searchTerm]);


  // Calculate meal nutrition from meal_items
  const calculateMealNutrition = (mealItems: DBMeal['meal_items']) => {
    console.log('🔍 calculateMealNutrition called with:', mealItems);
    
    if (!mealItems || mealItems.length === 0) {
      console.log('⚠️ No meal items provided, returning zeros');
      return { calories: 0, protein: 0, fat: 0, carbs: 0 };
    }
    
    const result = mealItems.reduce((total, item, index) => {
      console.log(`🔍 Processing item ${index}:`, item);
      
      // Handle potential undefined values
      const ingredient = item.ingredients || {};
      const quantity = item.quantity_g || item.quantity || 0;
      const kcal = ingredient.kcal || 0;
      const protein = ingredient.protein || 0;
      const fat = ingredient.fat || 0;
      const carbs = ingredient.carbs || 0;
      
      console.log(`🔍 Ingredient data:`, {
        name: ingredient.name,
        quantity,
        kcal,
        protein,
        fat,
        carbs,
        kcalType: typeof kcal,
        proteinType: typeof protein,
        fatType: typeof fat,
        carbsType: typeof carbs
      });
      
      // Check for NaN values
      if (isNaN(kcal) || isNaN(protein) || isNaN(fat) || isNaN(carbs)) {
        console.error('❌ NaN detected in ingredient:', {
          name: ingredient.name,
          kcal,
          protein,
          fat,
          carbs
        });
      }
      
      const itemCalories = (kcal * quantity / 100);
      const itemProtein = (protein * quantity / 100);
      const itemFat = (fat * quantity / 100);
      const itemCarbs = (carbs * quantity / 100);
      
      console.log(`🔍 Calculated values for ${ingredient.name}:`, {
        itemCalories,
        itemProtein,
        itemFat,
        itemCarbs
      });
      
      const newTotal = {
        calories: total.calories + itemCalories,
        protein: total.protein + itemProtein,
        fat: total.fat + itemFat,
        carbs: total.carbs + itemCarbs
      };
      
      console.log(`🔍 Running total after ${ingredient.name}:`, newTotal);
      
      return newTotal;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
    
    console.log('🔍 Final nutrition result:', result);
    return result;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      image: '',
      cooking_instructions: '',
      is_template: true,
      kcal_target: 800,
      selectedIngredients: []
    });
    setIsCreating(false);
    setEditingMeal(null);
  };

  // Start creating new meal
  const handleCreateMeal = () => {
    resetForm();
    setIsCreating(true);
  };

  // Start editing meal
  const handleEditMeal = (meal: DBMeal) => {
    setFormData({
      name: meal.name,
      image: meal.image || '',
      cooking_instructions: meal.cooking_instructions || '',
      is_template: meal.is_template ?? true,
      kcal_target: meal.kcal_target || 800,
      selectedIngredients: (meal.meal_items || []).map(item => ({
        ingredient: {
          id: item.ingredients.name, // Using name as id for simplicity
          name: item.ingredients.name,
          kcal: item.ingredients.kcal,
          protein: item.ingredients.protein,
          fat: item.ingredients.fat,
          carbs: item.ingredients.carbs
        },
        quantity: item.quantity_g || item.quantity || 100
      }))
    });
    setEditingMeal(meal);
    setIsCreating(false);
  };

  // Save meal (create or update)
  const handleSaveMeal = async () => {
    if (!formData.name.trim()) return;

    setLoading(true);
    try {
      if (editingMeal) {
        // Update existing meal
        await dbUpdateMeal(editingMeal.id, {
          name: formData.name.trim(),
          image: formData.image || undefined,
          cooking_instructions: formData.cooking_instructions.trim() || undefined,
          is_template: formData.is_template,
          kcal_target: formData.kcal_target
        });
        
        // Update meal items (delete all and re-add)
        // Note: This is simplified - in production you'd want to diff and update
        for (const item of editingMeal.meal_items || []) {
          await dbDeleteMealItem(item.id);
        }
        
        for (const selectedIng of formData.selectedIngredients) {
          const ingredient = ingredients.find(i => i.name === selectedIng.ingredient.name);
          if (ingredient) {
            await dbAddMealItem(editingMeal.id, ingredient.id, selectedIng.quantity);
          }
        }
      } else {
        // Create new meal
        const mealResult = await dbAddMeal({
          name: formData.name.trim(),
          image: formData.image || undefined,
          cooking_instructions: formData.cooking_instructions.trim() || undefined,
          is_template: formData.is_template,
          kcal_target: formData.kcal_target
        });

        if (mealResult.data) {


          
          // Add meal items
          for (const selectedIng of formData.selectedIngredients) {
            const ingredient = ingredients.find(i => i.name === selectedIng.ingredient.name);
            if (ingredient) {

              const itemResult = await dbAddMealItem(mealResult.data.id, ingredient.id, selectedIng.quantity);

              
              if (itemResult.error) {
                console.error('❌ Error adding meal item:', itemResult.error);
                alert(`Error adding ingredient ${ingredient.name}: ${itemResult.error.message}`);
              }
            } else {
              console.error('❌ Ingredient not found:', selectedIng.ingredient.name);
            }
          }
        }
      }

      // Reload data
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving meal:', error);
      alert('Failed to save meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Delete meal
  const handleDeleteMeal = async (mealId: string) => {
    setLoading(true);
    try {
      await dbDeleteMeal(mealId);
      await loadData();
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting meal:', error);
      alert('Failed to delete meal. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Add ingredient to form
  const handleAddIngredient = () => {
    if (ingredients.length === 0) return;
    
    setFormData(prev => ({
      ...prev,
      selectedIngredients: [...prev.selectedIngredients, {
        ingredient: ingredients[0],
        quantity: 100
      }]
    }));
  };

  // Update ingredient in form
  const handleUpdateIngredient = (index: number, field: 'ingredient' | 'quantity', value: any) => {
    setFormData(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.map((item, idx) => 
        idx === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Remove ingredient from form
  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      selectedIngredients: prev.selectedIngredients.filter((_, idx) => idx !== index)
    }));
  };

  return (
    <div className="coach-plan">
      {/* Header */}
      <div className="coach-plan-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="coach-plan-headrow">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-all duration-200"
                title="Back"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold font-display text-[color:var(--txt-hi)] truncate">Meal Database</h1>
                <p className="text-[color:var(--txt-lo)] text-[11px] sm:text-sm truncate">Template meals with calculated portions</p>
              </div>
            </div>
            
            <div className="coach-plan-actions">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-all duration-200"
                title="Toggle layout"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleCreateMeal}
                className="coach-editor-btn coach-editor-btn--primary"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add Meal</span>
                <span className="sm:hidden">Add</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        {/* Search */}
        <div className="mb-5 sm:mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--txt-lo)] w-5 h-5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search meals or ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 min-h-[48px] rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)] transition-all duration-200"
              style={{ fontSize: 16, background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-8">
          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--red)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Total Meals</p>
              <p className="coach-stat-value">{meals.length}</p>
            </div>
            <div className="coach-stat-ic">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          
          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--orange)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Breakfast</p>
              <p className="coach-stat-value">
                {meals.filter(m => m.category === 'breakfast').length}
              </p>
            </div>
            <div className="coach-stat-ic">
              <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          
          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--blue)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Lunch</p>
              <p className="coach-stat-value">
                {meals.filter(m => m.category === 'lunch').length}
              </p>
            </div>
            <div className="coach-stat-ic">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
          
          <div className="coach-stat" style={{ ['--stat-accent' as string]: 'var(--violet)' } as React.CSSProperties}>
            <div className="min-w-0">
              <p className="coach-stat-label">Dinner</p>
              <p className="coach-stat-value">
                {meals.filter(m => m.category === 'dinner').length}
              </p>
            </div>
            <div className="coach-stat-ic">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
          </div>
        </div>

        {/* Meals Grid/List */}
        <div className={`grid gap-3 sm:gap-5 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredMeals.map((meal) => {
            const nutrition = calculateMealNutrition(meal.meal_items);
            return (
              <div
                key={meal.id}
                className="group rounded-2xl overflow-hidden transition-all duration-300"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
              >
                {/* Meal Image */}
                <div className="relative h-36 sm:h-44 overflow-hidden">
                  <img
                    src={meal.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80&auto=format'}
                    alt={meal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      console.log('🖼️ Image failed to load for meal:', meal.name, 'URL:', meal.image);
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=300&fit=crop&q=80&auto=format';
                    }}
                    onLoad={() => {
                      console.log('🖼️ Image loaded successfully for meal:', meal.name, 'URL:', meal.image);
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  

                  {/* Actions — always visible so touch users can reach them */}
                  <div className="absolute top-2 right-2">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setViewingMeal(meal)}
                        className="coach-touch rounded-lg text-[color:var(--txt-hi)] transition-all duration-200"
                        style={{ background: 'rgba(16,18,24,.72)', border: '1px solid var(--hair)' }}
                        title="View meal"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditMeal(meal)}
                        className="coach-touch rounded-lg text-[color:var(--txt-hi)] transition-all duration-200"
                        style={{ background: 'rgba(16,18,24,.72)', border: '1px solid var(--hair)' }}
                        title="Edit meal"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(meal.id)}
                        className="coach-touch rounded-lg text-white transition-all duration-200"
                        style={{ background: 'var(--red)', border: '1px solid transparent' }}
                        title="Delete meal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meal Content */}
                <div className="p-4 sm:p-5">
                  <h3 className="text-base sm:text-lg font-bold font-display text-[color:var(--txt-hi)] mb-1">
                    {meal.name}
                  </h3>
                  <p className="text-[color:var(--txt-lo)] text-xs capitalize mb-3">{meal.category || 'uncategorized'}</p>
                  
                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div className="text-center rounded-lg py-2" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-lg font-bold text-[color:var(--red)] tnum">{Math.round(nutrition.calories)}</p>
                      <p className="text-[11px] text-[color:var(--txt-lo)]">Calories</p>
                    </div>
                    <div className="text-center rounded-lg py-2" style={{ background: 'var(--surface-2)' }}>
                      <p className="text-lg font-bold text-[color:var(--blue)] tnum">{Math.round(nutrition.protein)}g</p>
                      <p className="text-[11px] text-[color:var(--txt-lo)]">Protein</p>
                    </div>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1">
                      {(meal.meal_items || []).slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 text-[color:var(--txt-mid)] text-[11px] rounded-full"
                          style={{ background: 'var(--surface-2)' }}
                        >
                          {item.ingredients.name}
                        </span>
                      ))}
                      {(meal.meal_items || []).length > 3 && (
                        <span className="px-2 py-1 text-[color:var(--txt-lo)] text-[11px] rounded-full" style={{ background: 'var(--surface-2)' }}>
                          +{(meal.meal_items || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cooking Instructions Preview */}
                  {meal.cooking_instructions && (
                    <p className="text-[color:var(--txt-lo)] text-xs line-clamp-2">
                      {meal.cooking_instructions}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMeals.length === 0 && (
          <div className="text-center py-14">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
              <ChefHat className="w-9 h-9 text-[color:var(--txt-lo)]" />
            </div>
            <h3 className="text-lg font-bold text-[color:var(--txt-hi)] mb-1">No meals found</h3>
            <p className="text-[color:var(--txt-lo)] mb-6">
              {searchTerm 
                ? 'Try adjusting your search'
                : 'No meals available in the database'
              }
            </p>
          </div>
        )}
      </div>

      {/* View Meal Modal */}
      {viewingMeal && (
        <div className="coach-modal z-50">
          <div className="coach-modal-panel max-w-2xl">
            <div className="p-4 sm:p-6 border-b border-[color:var(--hair)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg sm:text-2xl font-bold font-display text-[color:var(--txt-hi)] truncate">{viewingMeal.name}</h2>
                <button
                  onClick={() => setViewingMeal(null)}
                  className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1 min-h-0">
              {/* Meal Image */}
              <div className="mb-5">
                <img
                  src={viewingMeal.image || '/api/placeholder/400/300'}
                  alt={viewingMeal.name}
                  className="w-full h-40 sm:h-48 object-cover rounded-xl"
                />
              </div>

              {/* Nutrition Info */}
              <div className="mb-5">
                <h3 className="text-base font-bold text-[color:var(--txt-hi)] mb-3">Nutrition Information</h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
                  {Object.entries(calculateMealNutrition(viewingMeal.meal_items)).map(([key, value]) => (
                    <div key={key} className="text-center p-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                      <p className="text-xl font-bold text-[color:var(--red)] tnum">{Math.round(value)}</p>
                      <p className="text-xs text-[color:var(--txt-lo)] capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-5">
                <h3 className="text-base font-bold text-[color:var(--txt-hi)] mb-3">Ingredients & Portions</h3>
                <div className="space-y-2">
                  {(viewingMeal.meal_items || []).map((item, index) => {
                    console.log('🔍 Ingredients & Portions - Processing item:', item);
                    console.log('🔍 Item ingredients:', item.ingredients);
                    
                    const ingredient = item.ingredients || {};
                    const kcal = ingredient.kcal || 0;
                    const protein = ingredient.protein || 0;
                    const quantity = item.quantity_g || item.quantity || 0;
                    
                    console.log('🔍 Extracted values:', {
                      name: ingredient.name,
                      kcal,
                      protein,
                      quantity,
                      kcalType: typeof kcal,
                      proteinType: typeof protein,
                      quantityType: typeof quantity
                    });
                    
                    const ingredientKcal = (kcal * quantity / 100);
                    const ingredientProtein = (protein * quantity / 100);
                    
                    console.log('🔍 Calculated values:', {
                      ingredientKcal,
                      ingredientProtein,
                      isNaN_kcal: isNaN(ingredientKcal),
                      isNaN_protein: isNaN(ingredientProtein)
                    });
                    
                    return (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg gap-3" style={{ background: 'var(--surface-2)' }}>
                        <div className="flex-1 min-w-0">
                          <span className="text-[color:var(--txt-hi)] font-medium">{ingredient.name || 'Unknown'}</span>
                          <div className="text-xs text-[color:var(--txt-lo)] mt-1 tnum">
                            {isNaN(ingredientKcal) ? 'NaN' : Math.round(ingredientKcal)} kcal • {isNaN(ingredientProtein) ? 'NaN' : Math.round(ingredientProtein)}g protein
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-[color:var(--txt-mid)] font-medium tnum">{quantity}g</span>
                          <div className="text-xs text-[color:var(--txt-lo)]">portion</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                  <p className="text-[color:var(--txt-mid)] text-xs sm:text-sm">
                    These portions are calculated to achieve the target {viewingMeal.kcal_target || 800} kcal
                  </p>
                </div>
              </div>

              {/* Cooking Instructions */}
              {viewingMeal.cooking_instructions && (
                <div>
                  <h3 className="text-base font-bold text-[color:var(--txt-hi)] mb-2">Cooking Instructions</h3>
                  <p className="text-[color:var(--txt-mid)] text-sm leading-relaxed">{viewingMeal.cooking_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Meal Modal */}
      {(isCreating || editingMeal) && (
        <div className="coach-modal z-50">
          <div className="coach-modal-panel max-w-4xl">
            <div className="p-4 sm:p-6 border-b border-[color:var(--hair)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg sm:text-2xl font-bold font-display text-[color:var(--txt-hi)]">
                  {editingMeal ? 'Edit Meal' : 'Create New Meal'}
                </h2>
                <button
                  onClick={resetForm}
                  className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1 min-h-0">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                    Meal Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)] transition-all duration-200"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                    placeholder="Enter meal name"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div>
                  <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                    Target Calories
                  </label>
                  <input
                    type="number"
                    value={formData.kcal_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, kcal_target: parseInt(e.target.value) || 800 }))}
                    className="w-full px-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)] transition-all duration-200"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                    min="100"
                    max="2000"
                    step="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                    Template Meal
                  </label>
                  <label htmlFor="is_template" className="flex items-center gap-3 min-h-[44px] cursor-pointer">
                    <input
                      type="checkbox"
                      id="is_template"
                      checked={formData.is_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
                      className="w-5 h-5 accent-[color:var(--red)] rounded"
                    />
                    <span className="text-[color:var(--txt-mid)] text-sm">
                      Use as template for client meal plans
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)] transition-all duration-200"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[color:var(--txt-mid)] mb-2">
                  Cooking Instructions
                </label>
                <textarea
                  value={formData.cooking_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, cooking_instructions: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-[color:var(--txt-hi)] placeholder-[color:var(--txt-lo)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)] transition-all duration-200"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                  placeholder="Enter cooking instructions..."
                />
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-3 gap-3">
                  <label className="block text-sm font-medium text-[color:var(--txt-mid)]">
                    Ingredients
                  </label>
                  <button
                    onClick={handleAddIngredient}
                    className="coach-editor-btn coach-editor-btn--primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.selectedIngredients.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 sm:gap-4 p-3 sm:p-4 rounded-xl" style={{ background: 'var(--surface-2)' }}>
                      <div className="flex-1 min-w-0">
                        <select
                          value={item.ingredient.name}
                          onChange={(e) => {
                            const ingredient = ingredients.find(i => i.name === e.target.value);
                            if (ingredient) {
                              handleUpdateIngredient(index, 'ingredient', ingredient);
                            }
                          }}
                          className="w-full px-3 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]"
                          style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}
                        >
                          {ingredients.map(ingredient => (
                            <option key={ingredient.id} value={ingredient.name}>
                              {ingredient.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 sm:w-20 px-2 min-h-[44px] rounded-lg text-[color:var(--txt-hi)] text-center focus:outline-none focus:ring-2 focus:ring-[color:var(--red)]"
                          style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}
                          min="0"
                          step="0.1"
                        />
                        <span className="text-[color:var(--txt-lo)] text-sm">g</span>
                      </div>
                      <button
                        onClick={() => handleRemoveIngredient(index)}
                        className="coach-touch rounded-lg text-[color:var(--red)] transition-all duration-200"
                        title="Remove ingredient"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition Preview */}
              {formData.selectedIngredients.length > 0 && (
                <div className="p-4 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                  <h4 className="text-base font-bold text-[color:var(--txt-hi)] mb-3">Nutrition Calculator</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
                    {(() => {
                      const nutrition = formData.selectedIngredients.reduce((total, item) => ({
                        calories: total.calories + (item.ingredient.kcal * item.quantity / 100),
                        protein: total.protein + (item.ingredient.protein * item.quantity / 100),
                        fat: total.fat + (item.ingredient.fat * item.quantity / 100),
                        carbs: total.carbs + (item.ingredient.carbs * item.quantity / 100)
                      }), { calories: 0, protein: 0, fat: 0, carbs: 0 });

                      const targetKcal = formData.kcal_target;
                      const currentKcal = nutrition.calories;
                      const isCloseToTarget = Math.abs(currentKcal - targetKcal) <= 50;
                      
                      return (
                        <>
                          {Object.entries(nutrition).map(([key, value]) => (
                            <div key={key} className="text-center">
                              <p className={`text-xl font-bold tnum ${key === 'calories' ?
                                (isCloseToTarget ? 'text-[color:var(--green)]' : 'text-[color:var(--red)]') : 'text-[color:var(--txt-mid)]'}`}>
                                {Math.round(value)}{key === 'calories' ? '' : 'g'}
                              </p>
                              <p className="text-xs text-[color:var(--txt-lo)] capitalize">{key}</p>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg" style={{ background: 'var(--surface-3)' }}>
                    <span className="text-[color:var(--txt-mid)] text-sm">Target vs Current:</span>
                    <span className={`font-bold tnum ${(() => {
                      const current = formData.selectedIngredients.reduce((total, item) => 
                        total + (item.ingredient.kcal * item.quantity / 100), 0);
                      const diff = Math.abs(current - formData.kcal_target);
                      return diff <= 50 ? 'text-[color:var(--green)]' : diff <= 100 ? 'text-[color:var(--orange)]' : 'text-[color:var(--red)]';
                    })()}`}>
                      {formData.kcal_target} kcal target
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-[color:var(--hair)] flex justify-end gap-3">
              <button
                onClick={resetForm}
                className="coach-editor-btn flex-1 sm:flex-none justify-center sm:px-6"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeal}
                disabled={!formData.name.trim() || formData.selectedIngredients.length === 0 || loading}
                className="coach-editor-btn coach-editor-btn--primary flex-1 sm:flex-none justify-center sm:px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                <span>{editingMeal ? 'Update Meal' : 'Create Meal'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="coach-modal z-50">
          <div className="coach-modal-panel max-w-md p-4 sm:p-6">
            <h3 className="text-lg font-bold font-display text-[color:var(--txt-hi)] mb-3">Delete Meal</h3>
            <p className="text-[color:var(--txt-mid)] text-sm mb-5">
              Are you sure you want to delete this meal? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="coach-editor-btn flex-1 sm:flex-none justify-center sm:px-6"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMeal(showDeleteConfirm)}
                disabled={loading}
                className="coach-editor-btn coach-editor-btn--primary flex-1 sm:flex-none justify-center sm:px-6 disabled:opacity-50"
              >
                {loading && <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealDatabaseManager;
