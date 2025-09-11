import React, { useState } from 'react';
import { ChevronDown, Search, Plus, X, Clock, Flame, Heart, Zap, Sun, Moon } from 'lucide-react';
import { Meal } from '../types';

interface MealSelectorProps {
  meals: Meal[];
  onMealSelect: (meal: Meal) => void;
}

export const MealSelector: React.FC<MealSelectorProps> = ({ meals, onMealSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'breakfast', 'lunch', 'dinner', 'snack'];

  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || meal.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'breakfast': return <Sun className="w-4 h-4" />;
      case 'lunch': return <Clock className="w-4 h-4" />;
      case 'dinner': return <Moon className="w-4 h-4" />;
      case 'snack': return <Heart className="w-4 h-4" />;
      default: return <Flame className="w-4 h-4" />;
    }
  };

  const calculateMealNutrition = (meal: Meal) => {
    return meal.ingredients.reduce((total, ingredient) => ({
      calories: total.calories + (ingredient.food.kcal * ingredient.quantity / 100),
      protein: total.protein + (ingredient.food.protein * ingredient.quantity / 100),
      carbs: total.carbs + (ingredient.food.carbs * ingredient.quantity / 100),
      fat: total.fat + (ingredient.food.fat * ingredient.quantity / 100)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 shadow-lg bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 hover:scale-105"
      >
        <Plus className="w-5 h-5" />
        <span>Add Meal</span>
        <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-3 w-[500px] rounded-3xl shadow-2xl z-50 overflow-hidden bg-slate-800 border border-slate-700">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
            <h3 className="text-2xl font-bold text-white">Select Meals</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-3 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search meal"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 text-lg"
              />
            </div>
          </div>

          {/* Categories */}
          <div className="px-6 py-4">
            <div className="flex items-center space-x-3 overflow-x-auto scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center space-x-2 px-6 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                    selectedCategory === cat
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600 hover:text-white'
                  }`}
                >
                  {getCategoryIcon(cat)}
                  <span className="capitalize">{cat === 'all' ? 'All Meals' : cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Meal list */}
          <div className="max-h-96 overflow-y-auto scrollbar-hide p-4">
            {filteredMeals.map(meal => {
              const nutrition = calculateMealNutrition(meal);
              return (
                <button
                  key={meal.id}
                  onClick={() => { onMealSelect(meal); setIsOpen(false); setSearchTerm(''); }}
                  className="w-full flex items-center space-x-4 p-4 rounded-2xl text-left hover:bg-slate-700/50 transition-all duration-200 group mb-2"
                >
                  <div className="w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
                    <img 
                      src={meal.image} 
                      alt={meal.name} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" 
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-lg truncate">{meal.name}</div>
                    <div className="text-slate-400 text-sm capitalize mt-1 flex items-center space-x-2">
                      {getCategoryIcon(meal.category)}
                      <span>{meal.category}</span>
                    </div>
                    <div className="flex items-center space-x-6 mt-3 text-sm text-slate-500">
                      <div className="flex items-center space-x-1">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span>{Math.round(nutrition.calories)} kcal</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Flame className="w-4 h-4 text-orange-500" />
                        <span>P: {Math.round(nutrition.protein)}g</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Heart className="w-4 h-4 text-red-500" />
                        <span>C: {Math.round(nutrition.carbs)}g</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>F: {Math.round(nutrition.fat)}g</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Plus className="w-4 h-4 text-red-500" />
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredMeals.length === 0 && (
              <div className="p-12 text-center text-slate-400">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mx-auto mb-6">
                  <Search className="w-10 h-10" />
                </div>
                <p className="text-lg font-medium">No meals found</p>
                <p className="text-sm text-slate-500 mt-2">Try adjusting your search or category</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
};