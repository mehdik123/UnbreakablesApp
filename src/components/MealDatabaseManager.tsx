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

  // Filter and search meals
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (meal.meal_items || []).some(item => item.ingredients.name.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                <ChevronDown className="w-5 h-5 rotate-90" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Meal Database</h1>
                <p className="text-slate-400 text-sm">Template meals with calculated ingredient portions (800 kcal target)</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </button>
              <button
                onClick={handleCreateMeal}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              >
                <Plus className="w-4 h-4" />
                <span>Add Meal</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search meals or ingredients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                />
              </div>
            </div>

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Total Meals</p>
                <p className="text-2xl font-bold text-white">{meals.length}</p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-xl">
                <ChefHat className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Breakfast</p>
                <p className="text-2xl font-bold text-white">
                  {meals.filter(m => m.category === 'breakfast').length}
                </p>
              </div>
              <div className="p-3 bg-orange-600/20 rounded-xl">
                <Utensils className="w-6 h-6 text-orange-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Lunch</p>
                <p className="text-2xl font-bold text-white">
                  {meals.filter(m => m.category === 'lunch').length}
                </p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <ChefHat className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Dinner</p>
                <p className="text-2xl font-bold text-white">
                  {meals.filter(m => m.category === 'dinner').length}
                </p>
              </div>
              <div className="p-3 bg-purple-600/20 rounded-xl">
                <Clock className="w-6 h-6 text-purple-400" />
              </div>
            </div>
          </div>
        </div>

        {/* Meals Grid/List */}
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' 
            : 'grid-cols-1'
        }`}>
          {filteredMeals.map((meal) => {
            const nutrition = calculateMealNutrition(meal.meal_items);
            return (
              <div
                key={meal.id}
                className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/25"
              >
                {/* Meal Image */}
                <div className="relative h-48 overflow-hidden">
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
                  

                  {/* Actions */}
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setViewingMeal(meal)}
                        className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditMeal(meal)}
                        className="p-2 bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white rounded-lg transition-all duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(meal.id)}
                        className="p-2 bg-red-600/80 hover:bg-red-700/80 text-white rounded-lg transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Meal Content */}
                <div className="p-6">
                        <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-200">
                    {meal.name}
                  </h3>
                  <p className="text-slate-400 capitalize mb-4">{meal.category || 'uncategorized'}</p>
                  
                  {/* Nutrition Info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-red-400">{Math.round(nutrition.calories)}</p>
                      <p className="text-xs text-slate-400">Calories</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-400">{Math.round(nutrition.protein)}g</p>
                      <p className="text-xs text-slate-400">Protein</p>
                    </div>
                  </div>

                  {/* Ingredients Preview */}
                  <div className="mb-4">
                    <p className="text-slate-400 text-sm font-medium mb-2">Ingredients:</p>
                    <div className="flex flex-wrap gap-1">
                      {(meal.meal_items || []).slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                        >
                          {item.ingredients.name}
                        </span>
                      ))}
                      {(meal.meal_items || []).length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-full">
                          +{(meal.meal_items || []).length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cooking Instructions Preview */}
                  {meal.cooking_instructions && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-sm font-medium mb-1">Instructions:</p>
                      <p className="text-slate-300 text-sm line-clamp-2">
                        {meal.cooking_instructions}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {filteredMeals.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ChefHat className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No meals found</h3>
            <p className="text-slate-400 mb-6">
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">{viewingMeal.name}</h2>
                <button
                  onClick={() => setViewingMeal(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Meal Image */}
              <div className="mb-6">
                <img
                  src={viewingMeal.image || '/api/placeholder/400/300'}
                  alt={viewingMeal.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>

              {/* Nutrition Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Nutrition Information</h3>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(calculateMealNutrition(viewingMeal.meal_items)).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-slate-700/50 rounded-xl">
                      <p className="text-2xl font-bold text-red-400">{Math.round(value)}</p>
                      <p className="text-sm text-slate-400 capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Ingredients & Portions</h3>
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
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                        <div className="flex-1">
                          <span className="text-white font-medium">{ingredient.name || 'Unknown'}</span>
                          <div className="text-xs text-slate-400 mt-1">
                            {isNaN(ingredientKcal) ? 'NaN' : Math.round(ingredientKcal)} kcal • {isNaN(ingredientProtein) ? 'NaN' : Math.round(ingredientProtein)}g protein
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-300 font-medium">{quantity}g</span>
                          <div className="text-xs text-slate-400">portion</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 p-3 bg-red-600/10 border border-red-600/20 rounded-lg">
                  <p className="text-red-400 text-sm font-medium">
                    💡 These portions are calculated to achieve the target {viewingMeal.kcal_target || 800} kcal
                  </p>
                </div>
              </div>

              {/* Cooking Instructions */}
              {viewingMeal.cooking_instructions && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Cooking Instructions</h3>
                  <p className="text-slate-300 leading-relaxed">{viewingMeal.cooking_instructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit Meal Modal */}
      {(isCreating || editingMeal) && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-white">
                  {editingMeal ? 'Edit Meal' : 'Create New Meal'}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Meal Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    placeholder="Enter meal name"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Target Calories
                  </label>
                  <input
                    type="number"
                    value={formData.kcal_target}
                    onChange={(e) => setFormData(prev => ({ ...prev, kcal_target: parseInt(e.target.value) || 800 }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                    min="100"
                    max="2000"
                    step="50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Template Meal
                  </label>
                  <div className="flex items-center space-x-3 h-12">
                    <input
                      type="checkbox"
                      id="is_template"
                      checked={formData.is_template}
                      onChange={(e) => setFormData(prev => ({ ...prev, is_template: e.target.checked }))}
                      className="w-4 h-4 text-red-600 bg-slate-700 border-slate-600 rounded focus:ring-red-500 focus:ring-2"
                    />
                    <label htmlFor="is_template" className="text-slate-300 text-sm">
                      Use as template for client meal plans
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Cooking Instructions
                </label>
                <textarea
                  value={formData.cooking_instructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, cooking_instructions: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                  placeholder="Enter cooking instructions..."
                />
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-sm font-medium text-slate-300">
                    Ingredients
                  </label>
                  <button
                    onClick={handleAddIngredient}
                    className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-all duration-200"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Ingredient</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.selectedIngredients.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl">
                      <div className="flex-1">
                        <select
                          value={item.ingredient.name}
                          onChange={(e) => {
                            const ingredient = ingredients.find(i => i.name === e.target.value);
                            if (ingredient) {
                              handleUpdateIngredient(index, 'ingredient', ingredient);
                            }
                          }}
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                          {ingredients.map(ingredient => (
                            <option key={ingredient.id} value={ingredient.name}>
                              {ingredient.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => handleUpdateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-20 px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white text-center focus:outline-none focus:ring-2 focus:ring-red-500/50"
                          min="0"
                          step="0.1"
                        />
                        <span className="text-slate-400 text-sm">g</span>
                      </div>
                      <button
                        onClick={() => handleRemoveIngredient(index)}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-600/20 rounded-lg transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Nutrition Preview */}
              {formData.selectedIngredients.length > 0 && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <h4 className="text-lg font-bold text-white mb-3">Nutrition Calculator</h4>
                  <div className="grid grid-cols-4 gap-4 mb-4">
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
                              <p className={`text-2xl font-bold ${key === 'calories' ? 
                                (isCloseToTarget ? 'text-green-400' : 'text-red-400') : 'text-slate-300'}`}>
                                {Math.round(value)}{key === 'calories' ? '' : 'g'}
                              </p>
                              <p className="text-xs text-slate-400 capitalize">{key}</p>
                            </div>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-600/30 rounded-lg">
                    <span className="text-slate-300">Target vs Current:</span>
                    <span className={`font-bold ${(() => {
                      const current = formData.selectedIngredients.reduce((total, item) => 
                        total + (item.ingredient.kcal * item.quantity / 100), 0);
                      const diff = Math.abs(current - formData.kcal_target);
                      return diff <= 50 ? 'text-green-400' : diff <= 100 ? 'text-yellow-400' : 'text-red-400';
                    })()}`}>
                      {formData.kcal_target} kcal target
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-slate-700 flex justify-end space-x-3">
              <button
                onClick={resetForm}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMeal}
                disabled={!formData.name.trim() || formData.selectedIngredients.length === 0 || loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">Delete Meal</h3>
            <p className="text-slate-300 mb-6">
              Are you sure you want to delete this meal? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMeal(showDeleteConfirm)}
                disabled={loading}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 text-white rounded-xl font-medium transition-all duration-200 flex items-center space-x-2"
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
