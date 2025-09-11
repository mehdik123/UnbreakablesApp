import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  Eye, 
  X, 
  ChefHat, 
  Clock, 
  Flame,
  Utensils,
  ChevronDown,
  Grid3X3,
  List
} from 'lucide-react';
import { Meal, Ingredient } from '../types';
import { foods } from '../data/foods';

interface MealDatabaseManagerProps {
  meals: Meal[];
  onUpdateMeals: (meals: Meal[]) => void;
  onBack: () => void;
}

const MealDatabaseManager: React.FC<MealDatabaseManagerProps> = ({
  meals,
  onUpdateMeals,
  onBack
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isCreating, setIsCreating] = useState(false);
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [viewingMeal, setViewingMeal] = useState<Meal | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Form state for creating/editing meals
  const [formData, setFormData] = useState({
    name: '',
    category: 'breakfast' as Meal['category'],
    image: '',
    cookingInstructions: '',
    ingredients: [] as Ingredient[]
  });

  // Filter and search meals
  const filteredMeals = useMemo(() => {
    return meals.filter(meal => {
      const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meal.ingredients.some(ing => ing.food.name.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || meal.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [meals, searchTerm, selectedCategory]);

  // Categories for filtering
  const categories = [
    { value: 'all', label: 'All Meals', icon: Grid3X3 },
    { value: 'breakfast', label: 'Breakfast', icon: Utensils },
    { value: 'lunch', label: 'Lunch', icon: ChefHat },
    { value: 'dinner', label: 'Dinner', icon: Clock },
    { value: 'snack', label: 'Snacks', icon: Flame }
  ];

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      category: 'breakfast',
      image: '',
      cookingInstructions: '',
      ingredients: []
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
  const handleEditMeal = (meal: Meal) => {
    setFormData({
      name: meal.name,
      category: meal.category,
      image: meal.image,
      cookingInstructions: meal.cookingInstructions,
      ingredients: meal.ingredients
    });
    setEditingMeal(meal);
    setIsCreating(false);
  };

  // Save meal (create or update)
  const handleSaveMeal = () => {
    if (!formData.name.trim()) return;

    const mealData: Meal = {
      id: editingMeal?.id || `meal-${Date.now()}`,
      name: formData.name.trim(),
      category: formData.category,
      image: formData.image || '/api/placeholder/300/200',
      cookingInstructions: formData.cookingInstructions.trim(),
      ingredients: formData.ingredients
    };

    if (editingMeal) {
      // Update existing meal
      const updatedMeals = meals.map(meal => 
        meal.id === editingMeal.id ? mealData : meal
      );
      onUpdateMeals(updatedMeals);
    } else {
      // Create new meal
      onUpdateMeals([...meals, mealData]);
    }

    resetForm();
  };

  // Delete meal
  const handleDeleteMeal = (mealId: string) => {
    const updatedMeals = meals.filter(meal => meal.id !== mealId);
    onUpdateMeals(updatedMeals);
    setShowDeleteConfirm(null);
  };

  // Add ingredient to form
  const handleAddIngredient = () => {
    const newIngredient: Ingredient = {
      food: foods[0], // Default to first food
      quantity: 100
    };
    setFormData(prev => ({
      ...prev,
      ingredients: [...prev.ingredients, newIngredient]
    }));
  };

  // Update ingredient in form
  const handleUpdateIngredient = (index: number, field: 'food' | 'quantity', value: any) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, idx) => 
        idx === index ? { ...ing, [field]: value } : ing
      )
    }));
  };

  // Remove ingredient from form
  const handleRemoveIngredient = (index: number) => {
    setFormData(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, idx) => idx !== index)
    }));
  };

  // Calculate meal nutrition
  const calculateMealNutrition = (ingredients: Ingredient[]) => {
    return ingredients.reduce((total, ingredient) => {
      const food = ingredient.food;
      const quantity = ingredient.quantity;
      return {
        calories: total.calories + (food.kcal * quantity / 100),
        protein: total.protein + (food.protein * quantity / 100),
        fat: total.fat + (food.fat * quantity / 100),
        carbs: total.carbs + (food.carbs * quantity / 100)
      };
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
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
                <p className="text-slate-400 text-sm">Manage your meal collection</p>
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

            {/* Category Filter */}
            <div className="flex space-x-2">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.value}
                    onClick={() => setSelectedCategory(category.value)}
                    className={`flex items-center space-x-2 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                      selectedCategory === category.value
                        ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="hidden sm:block">{category.label}</span>
                  </button>
                );
              })}
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
            const nutrition = calculateMealNutrition(meal.ingredients);
            return (
              <div
                key={meal.id}
                className="group bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden hover:border-slate-600/50 transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/25"
              >
                {/* Meal Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={meal.image}
                    alt={meal.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
                  
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4">
                    <span className="px-3 py-1 bg-red-600/90 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                      {meal.category}
                    </span>
                  </div>

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
                      {meal.ingredients.slice(0, 3).map((ingredient, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-slate-700/50 text-slate-300 text-xs rounded-full"
                        >
                          {ingredient.food.name}
                        </span>
                      ))}
                      {meal.ingredients.length > 3 && (
                        <span className="px-2 py-1 bg-slate-700/50 text-slate-400 text-xs rounded-full">
                          +{meal.ingredients.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Cooking Instructions Preview */}
                  {meal.cookingInstructions && (
                    <div className="mb-4">
                      <p className="text-slate-400 text-sm font-medium mb-1">Instructions:</p>
                      <p className="text-slate-300 text-sm line-clamp-2">
                        {meal.cookingInstructions}
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
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Start building your meal database'
              }
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <button
                onClick={handleCreateMeal}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              >
                Add Your First Meal
              </button>
            )}
          </div>
        )}
      </div>

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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value as Meal['category'] }))}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
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
                  value={formData.cookingInstructions}
                  onChange={(e) => setFormData(prev => ({ ...prev, cookingInstructions: e.target.value }))}
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
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 bg-slate-700/50 rounded-xl">
                      <div className="flex-1">
                        <select
                          value={ingredient.food.name}
                          onChange={(e) => {
                            const food = foods.find(f => f.name === e.target.value) || foods[0];
                            handleUpdateIngredient(index, 'food', food);
                          }}
                          className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-500/50"
                        >
                          {foods.map(food => (
                            <option key={food.name} value={food.name}>
                              {food.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          value={ingredient.quantity}
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
              {formData.ingredients.length > 0 && (
                <div className="p-4 bg-slate-700/30 rounded-xl">
                  <h4 className="text-lg font-bold text-white mb-3">Nutrition Preview</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {Object.entries(calculateMealNutrition(formData.ingredients)).map(([key, value]) => (
                      <div key={key} className="text-center">
                        <p className="text-2xl font-bold text-red-400">{Math.round(value)}</p>
                        <p className="text-xs text-slate-400 capitalize">{key}</p>
                      </div>
                    ))}
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
                disabled={!formData.name.trim() || formData.ingredients.length === 0}
                className="px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-all duration-200"
              >
                {editingMeal ? 'Update Meal' : 'Create Meal'}
              </button>
            </div>
          </div>
        </div>
      )}

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
                  src={viewingMeal.image}
                  alt={viewingMeal.name}
                  className="w-full h-48 object-cover rounded-xl"
                />
              </div>

              {/* Nutrition Info */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Nutrition Information</h3>
                <div className="grid grid-cols-4 gap-4">
                  {Object.entries(calculateMealNutrition(viewingMeal.ingredients)).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-slate-700/50 rounded-xl">
                      <p className="text-2xl font-bold text-red-400">{Math.round(value)}</p>
                      <p className="text-sm text-slate-400 capitalize">{key}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-4">Ingredients</h3>
                <div className="space-y-2">
                  {viewingMeal.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <span className="text-white font-medium">{ingredient.food.name}</span>
                      <span className="text-slate-400">{ingredient.quantity}g</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cooking Instructions */}
              {viewingMeal.cookingInstructions && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Cooking Instructions</h3>
                  <p className="text-slate-300 leading-relaxed">{viewingMeal.cookingInstructions}</p>
                </div>
              )}
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
                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MealDatabaseManager;