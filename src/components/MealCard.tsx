import React, { useState } from 'react';
import { X, Edit3, ChefHat, Clock, Scale, ChevronDown, ChevronUp, Globe, Heart } from 'lucide-react';
import { SelectedMeal, Ingredient } from '../types';
import { IngredientEditor } from './IngredientEditor';
import { calculateMealNutrition } from '../utils/nutritionCalculator';
import { Food } from '../types';
import { translateText, SupportedLanguage } from '../utils/translate';

interface MealCardProps {
  selectedMeal: SelectedMeal;
  onRemove: () => void;
  onIngredientsChange: (ingredients: Ingredient[]) => void;
  foods: Food[];
  isDark: boolean;
  isClientMode?: boolean;
  onToggleFavorite?: (mealId: string) => void;
  isFavorite?: boolean;
  onSmartAlternative?: () => void;
}

export const MealCard: React.FC<MealCardProps> = ({
  selectedMeal,
  onRemove,
  onIngredientsChange,
  foods,
  isDark,
  isClientMode = false,
  onToggleFavorite,
  isFavorite = false,
  onSmartAlternative
}) => {
  const [showIngredients, setShowIngredients] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [uiLang, setUiLang] = useState<'english' | 'arabic' | 'darija'>('english');
  const [translating, setTranslating] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);

  const ingredients = selectedMeal.customIngredients || selectedMeal.meal.ingredients;
  const nutrition = calculateMealNutrition(selectedMeal);

  const formatInstructions = (instructions: string) =>
    instructions
      .split('\n')
      .map(step => step.replace(/^\d+\.\s*/, '').trim())
      .filter(Boolean)
      .join('. ');

  const langToCode: Record<typeof uiLang, SupportedLanguage> = {
    english: 'en',
    arabic: 'ar',
    darija: 'ary'
  };

  const getShownInstructions = () => {
    const base = formatInstructions(selectedMeal.meal.cookingInstructions);
    if (uiLang === 'english') return base;
    return translated ?? base;
  };

  const handleLangChange = async (value: 'english' | 'arabic' | 'darija') => {
    setUiLang(value);
    if (value === 'english') {
      setTranslated(null);
      return;
    }
    const base = formatInstructions(selectedMeal.meal.cookingInstructions);
    setTranslating(true);
    try {
      const res = await translateText(base, langToCode[value]);
      setTranslated(res);
    } finally {
      setTranslating(false);
    }
  };

  return (
    <div className={`p-8 rounded-3xl border-2 transition-all duration-200 hover:shadow-xl ${
      isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-200 hover:border-gray-300 shadow-lg'
    }`}>
      {/* Meal Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-start space-x-6">
          <img
            src={selectedMeal.meal.image}
            alt={selectedMeal.meal.name}
            className="w-32 h-32 rounded-2xl object-cover shadow-2xl"
          />
          <div>
            <h3 className={`font-bold text-3xl mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {selectedMeal.meal.name}
            </h3>
            <p className={`text-lg capitalize font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {selectedMeal.meal.category}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Favorite Button - Only show in client mode */}
          {isClientMode && onToggleFavorite && (
            <button
              onClick={() => onToggleFavorite(selectedMeal.meal.id)}
              className={`p-3 rounded-2xl transition-all duration-200 hover:scale-110 ${
                isFavorite 
                  ? 'text-red-500 bg-red-50 dark:bg-red-900/20' 
                  : 'text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
              }`}
            >
              <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          )}
          
          {/* Remove Button - Only show in edit mode */}
          {!isClientMode && (
            <button
              onClick={onRemove}
              className={`p-3 rounded-2xl transition-all duration-200 hover:scale-110 ${
                isDark ? 'hover:bg-red-600' : 'hover:bg-red-100'
              }`}
            >
              <X className="w-6 h-6 text-red-500" />
            </button>
          )}
        </div>
      </div>

      {/* Nutrition Summary */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className={`text-center p-4 rounded-2xl ${
          isDark ? 'bg-gray-600' : 'bg-gradient-to-br from-red-50 to-red-100'
        }`}>
          <div className="text-2xl font-bold text-red-600">{nutrition.kcal}</div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>kcal</div>
        </div>
        <div className={`text-center p-4 rounded-2xl ${
          isDark ? 'bg-gray-600' : 'bg-gradient-to-br from-green-50 to-green-100'
        }`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-green-600'}`}>
            {nutrition.protein}g
          </div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>protein</div>
        </div>
        <div className={`text-center p-4 rounded-2xl ${
          isDark ? 'bg-gray-600' : 'bg-gradient-to-br from-yellow-50 to-yellow-100'
        }`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-yellow-600'}`}>
            {nutrition.fat}g
          </div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>fat</div>
        </div>
        <div className={`text-center p-4 rounded-2xl ${
          isDark ? 'bg-gray-600' : 'bg-gradient-to-br from-purple-50 to-purple-100'
        }`}>
          <div className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-purple-600'}`}>
            {nutrition.carbs}g
          </div>
          <div className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>carbs</div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setShowIngredients(!showIngredients)}
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 ${
            showIngredients
              ? isDark 
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg' 
                : 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
              : isDark 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <Scale className="w-5 h-5" />
          <span>Ingredients</span>
          {showIngredients ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className={`flex items-center space-x-3 px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 ${
            showInstructions
              ? isDark 
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg' 
                : 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
              : isDark 
                ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }`}
        >
          <ChefHat className="w-5 h-5" />
          <span>Instructions</span>
          {showInstructions ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
        
        {isClientMode && onSmartAlternative && (
          <button
            onClick={onSmartAlternative}
            className={`flex items-center space-x-3 px-6 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 ${
              isDark ? 'bg-gray-600 hover:bg-gray-500 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <span>Smart alternative</span>
          </button>
        )}
      </div>

      {/* Ingredients Editor - Compact */}
      {showIngredients && (
        <div className="mb-6">
          <IngredientEditor
            ingredients={ingredients}
            foods={foods}
            onIngredientsChange={onIngredientsChange}
            isDark={isDark}
            isClientMode={isClientMode}
          />
        </div>
      )}

      {/* Cooking Instructions with Translation */}
      {showInstructions && (
        <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-600' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Clock className="w-6 h-6 text-red-500" />
              <h4 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Cooking Instructions</h4>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-gray-500" />
              <select
                value={uiLang}
                onChange={(e) => handleLangChange(e.target.value as any)}
                className={`px-3 py-1 rounded-lg text-sm border-2 transition-all duration-200 ${
                  isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="english">English</option>
                <option value="arabic">العربية</option>
                <option value="darija">الدارجة</option>
              </select>
            </div>
          </div>
          <div className={`text-lg leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {translating ? (
              <span className="inline-flex items-center space-x-2">
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-500"></span>
                <span>Translating…</span>
              </span>
            ) : (
              getShownInstructions()
            )}
          </div>
        </div>
      )}
    </div>
  );
};