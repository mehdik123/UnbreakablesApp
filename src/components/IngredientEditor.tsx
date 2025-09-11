import React, { useState } from 'react';
import { Edit, Save, X, Plus, Trash2 } from 'lucide-react';
import { Ingredient, Food } from '../types';
import { calculateIngredientNutrition } from '../utils/nutritionCalculator';

interface IngredientEditorProps {
  ingredients: Ingredient[];
  foods: Food[];
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  isDark: boolean;
  isClientMode?: boolean;
}

export const IngredientEditor: React.FC<IngredientEditorProps> = ({
  ingredients,
  foods,
  onIngredientsChange,
  isClientMode = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedIngredients, setEditedIngredients] = useState<Ingredient[]>([...ingredients]);

  const handleIngredientChange = (index: number, field: 'food' | 'quantity', value: any) => {
    setEditedIngredients(prev => prev.map((ing, i) =>
      i === index
        ? { ...ing, [field]: field === 'quantity' ? parseFloat(value) || 0 : value }
        : ing
    ));
  };

  const handleAddIngredient = () => {
    setEditedIngredients(prev => [...prev, { food: foods[0], quantity: 100 }]);
  };

  const handleRemoveIngredient = (index: number) => {
    setEditedIngredients(prev => prev.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onIngredientsChange(editedIngredients);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedIngredients([...ingredients]);
    setIsEditing(false);
  };

  const totalNutrition = editedIngredients.reduce((total, ingredient) => {
    const nutrition = calculateIngredientNutrition(ingredient);
    return {
      kcal: total.kcal + nutrition.kcal,
      protein: total.protein + nutrition.protein,
      fat: total.fat + nutrition.fat,
      carbs: total.carbs + nutrition.carbs
    };
  }, { kcal: 0, protein: 0, fat: 0, carbs: 0 });

  if (isClientMode) {
    // Read-only view for clients
  return (
      <div className="p-6 bg-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/50">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-bold text-white">
            Ingredients ({ingredients.length})
        </h4>
      </div>
      
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => {
            const ingredientCalories = Math.round(ingredient.food.kcal * ingredient.quantity / 100);
            return (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-600/20 border border-slate-600/30">
                <div className="flex-1">
                  <span className="text-white font-bold text-lg">
                    {ingredient.food.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-red-400 font-semibold text-sm">{ingredientCalories} cal</span>
                  <span className="text-slate-400 text-sm">{ingredient.quantity}g</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Total Nutrition Summary */}
        <div className="mt-6 pt-4 border-t border-slate-600/50">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-3 rounded-xl bg-slate-600/30">
              <div className="text-lg font-bold text-white">
                {totalNutrition.kcal.toFixed(0)}
              </div>
              <div className="text-xs text-slate-400">kcal</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-600/30">
              <div className="text-lg font-bold text-white">
                {totalNutrition.protein.toFixed(1)}g
              </div>
              <div className="text-xs text-slate-400">protein</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-600/30">
              <div className="text-lg font-bold text-white">
                {totalNutrition.fat.toFixed(1)}g
              </div>
              <div className="text-xs text-slate-400">fat</div>
            </div>
            <div className="p-3 rounded-xl bg-slate-600/30">
              <div className="text-lg font-bold text-white">
                {totalNutrition.carbs.toFixed(1)}g
              </div>
              <div className="text-xs text-slate-400">carbs</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-700/30 backdrop-blur-sm rounded-2xl border border-slate-600/50">
      <div className="flex items-center justify-between mb-6">
        <h4 className="text-xl font-bold text-white">
          Ingredients ({editedIngredients.length})
        </h4>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-all duration-200 bg-slate-600 hover:bg-slate-500 text-white"
          >
            <Edit className="w-4 h-4" />
            <span>Edit</span>
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={handleSave}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm bg-red-600 hover:bg-red-700 text-white"
            >
              <Save className="w-4 h-4" />
              <span>Save</span>
            </button>
            <button
              onClick={handleCancel}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm bg-slate-600 hover:bg-slate-500 text-white"
            >
              <X className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

                  {isEditing ? (
        <div className="space-y-4">
          {editedIngredients.map((ingredient, index) => {
            const ingredientCalories = Math.round(ingredient.food.kcal * ingredient.quantity / 100);
            return (
              <div key={index} className="p-4 rounded-xl bg-slate-600/20 border border-slate-600/30">
                <div className="flex items-center space-x-4">
                  <select
                    value={ingredient.food.name}
                    onChange={(e) => {
                      const food = foods.find(f => f.name === e.target.value);
                      if (food) handleIngredientChange(index, 'food', food);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    {foods.map(food => (
                      <option key={food.name} value={food.name}>
                        {food.name}
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      placeholder="g"
                      value={ingredient.quantity}
                      onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                      className="w-20 px-3 py-3 rounded-xl border border-slate-600 bg-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="text-slate-400 text-sm">g</span>
                  </div>

                  <div className="text-center min-w-[80px]">
                    <div className="text-red-400 font-bold text-sm">{ingredientCalories} cal</div>
                  </div>

                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="p-3 rounded-xl hover:bg-red-500/20 transition-colors duration-200"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            );
          })}

          <button
            onClick={handleAddIngredient}
            className="flex items-center space-x-2 px-4 py-3 rounded-xl text-sm bg-slate-600 hover:bg-slate-500 text-white transition-colors duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Add Ingredient</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {ingredients.map((ingredient, index) => {
            const ingredientCalories = Math.round(ingredient.food.kcal * ingredient.quantity / 100);
            return (
              <div key={index} className="flex items-center justify-between p-4 rounded-xl bg-slate-600/20 border border-slate-600/30">
                <div className="flex-1">
                  <span className="text-white font-bold text-lg">
                    {ingredient.food.name}
                  </span>
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-red-400 font-semibold text-sm">{ingredientCalories} cal</span>
                  <span className="text-slate-400 text-sm">{ingredient.quantity}g</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Total Nutrition Summary */}
      <div className="mt-6 pt-4 border-t border-slate-600/50">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div className="p-3 rounded-xl bg-slate-600/30">
            <div className="text-lg font-bold text-white">
              {totalNutrition.kcal.toFixed(0)}
            </div>
            <div className="text-xs text-slate-400">kcal</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-600/30">
            <div className="text-lg font-bold text-white">
              {totalNutrition.protein.toFixed(1)}g
            </div>
            <div className="text-xs text-slate-400">protein</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-600/30">
            <div className="text-lg font-bold text-white">
              {totalNutrition.fat.toFixed(1)}g
            </div>
            <div className="text-xs text-slate-400">fat</div>
          </div>
          <div className="p-3 rounded-xl bg-slate-600/30">
            <div className="text-lg font-bold text-white">
              {totalNutrition.carbs.toFixed(1)}g
            </div>
            <div className="text-xs text-slate-400">carbs</div>
          </div>
        </div>
      </div>
    </div>
  );
};