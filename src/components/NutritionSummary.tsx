import React from 'react';
import { Zap, Heart, Flame, Target } from 'lucide-react';

interface NutritionSummaryProps {
  nutrition: {
    calories: number;
    protein: number;
    fat: number;
    carbs: number;
  };
  isDark: boolean;
}

export const NutritionSummary: React.FC<NutritionSummaryProps> = ({ nutrition, isDark }) => {
  // Safety check for undefined nutrition
  if (!nutrition) {
    return (
      <div className="p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
            No Nutrition Data Available
          </h2>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Add some meals to see your nutrition summary
          </p>
        </div>
      </div>
    );
  }

  const totalMacros = nutrition.protein + nutrition.fat + nutrition.carbs;
  const proteinPercentage = totalMacros > 0 ? (nutrition.protein / totalMacros) * 100 : 0;
  const fatPercentage = totalMacros > 0 ? (nutrition.fat / totalMacros) * 100 : 0;
  const carbsPercentage = totalMacros > 0 ? (nutrition.carbs / totalMacros) * 100 : 0;

  return (
    <div className="p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">
          Daily Nutrition Summary
        </h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          Complete breakdown of your meal plan
        </p>
      </div>

      {/* Main Nutrition Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg">
          <div className="flex justify-center mb-3">
            <Zap className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(nutrition.calories)}</div>
          <div className="text-indigo-100 text-sm font-medium">Calories</div>
        </div>

        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg">
          <div className="flex justify-center mb-3">
            <Target className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(nutrition.protein)}g</div>
          <div className="text-emerald-100 text-sm font-medium">Protein</div>
        </div>

        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg">
          <div className="flex justify-center mb-3">
            <Heart className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(nutrition.fat)}g</div>
          <div className="text-orange-100 text-sm font-medium">Fat</div>
        </div>

        <div className="text-center p-6 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
          <div className="flex justify-center mb-3">
            <Flame className="w-8 h-8" />
          </div>
          <div className="text-3xl font-bold mb-1">{Math.round(nutrition.carbs)}g</div>
          <div className="text-purple-100 text-sm font-medium">Carbs</div>
        </div>
      </div>

      {/* Macro Distribution */}
      <div className="mb-8">
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-4 text-center">
          Macro Distribution
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Protein</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(proteinPercentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="bg-emerald-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${proteinPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Fat</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(fatPercentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="bg-orange-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${fatPercentage}%` }}
              ></div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Carbs</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                {Math.round(carbsPercentage)}%
              </span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div 
                className="bg-purple-500 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${carbsPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {Math.round(totalMacros)}g
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Macros</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {Math.round(nutrition.calories / 4)}g
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Calories from Carbs</div>
        </div>

        <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
            {Math.round(nutrition.calories / 9)}g
          </div>
          <div className="text-sm text-slate-600 dark:text-slate-400">Calories from Fat</div>
        </div>
      </div>
    </div>
  );
};