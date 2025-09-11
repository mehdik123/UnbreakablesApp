import React, { useState, useMemo } from 'react';
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
  Target
} from 'lucide-react';
import { MealSelector } from './MealSelector';
import { MealCard } from './MealCard';
import { NutritionSummary } from './NutritionSummary';
import { Client, NutritionPlan, SelectedMeal, Meal, Food } from '../types';
import { calculateTotalNutrition } from '../utils/nutritionCalculator';
import { exportToPDF } from '../utils/pdfExport';

interface NutritionEditorProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  isDark: boolean;
  onSavePlan: (plan: NutritionPlan) => void;
  onBack: () => void;
}

export const NutritionEditor: React.FC<NutritionEditorProps> = ({
  client,
  foods,
  meals,
  isDark,
  onSavePlan,
  onBack
}) => {
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[][]>([[], [], []]);
  const [currentMealIndex, setCurrentMealIndex] = useState<number[]>(Array(6).fill(0));

  const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2', 'Snack 3'];

  const handleMealsPerDayChange = (newCount: number) => {
    setMealsPerDay(newCount);
    const newSelectedMeals = Array(newCount).fill(null).map((_, index) => 
      selectedMeals[index] || []
    );
    setSelectedMeals(newSelectedMeals);
  };

  const handleMealSelect = (mealSlotIndex: number, meal: Meal) => {
    const newSelectedMeals = [...selectedMeals];
    newSelectedMeals[mealSlotIndex] = [
      ...newSelectedMeals[mealSlotIndex],
      { meal }
    ];
    setSelectedMeals(newSelectedMeals);
  };

  const handleMealRemove = (mealSlotIndex: number, mealIndex: number) => {
    const newSelectedMeals = [...selectedMeals];
    newSelectedMeals[mealSlotIndex] = newSelectedMeals[mealSlotIndex].filter((_, index) => index !== mealIndex);
    setSelectedMeals(newSelectedMeals);
  };

  const handleIngredientsChange = (mealSlotIndex: number, mealIndex: number, ingredients: any[]) => {
    const newSelectedMeals = [...selectedMeals];
    newSelectedMeals[mealSlotIndex][mealIndex] = {
      ...newSelectedMeals[mealSlotIndex][mealIndex],
      customIngredients: ingredients
    };
    setSelectedMeals(newSelectedMeals);
  };

  const handleNextMeal = (mealSlotIndex: number) => {
    const currentIndex = currentMealIndex[mealSlotIndex];
    const maxIndex = selectedMeals[mealSlotIndex].length - 1;
    if (currentIndex < maxIndex) {
      const newIndexes = [...currentMealIndex];
      newIndexes[mealSlotIndex] = currentIndex + 1;
      setCurrentMealIndex(newIndexes);
    }
  };

  const handlePrevMeal = (mealSlotIndex: number) => {
    const currentIndex = currentMealIndex[mealSlotIndex];
    if (currentIndex > 0) {
      const newIndexes = [...currentMealIndex];
      newIndexes[mealSlotIndex] = currentIndex - 1;
      setCurrentMealIndex(newIndexes);
    }
  };

  const totalNutrition = useMemo(() => calculateTotalNutrition(selectedMeals), [selectedMeals]);

  const handleSavePlan = () => {
    const nutritionPlan: NutritionPlan = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      mealsPerDay,
      mealSlots: selectedMeals.map((meals, index) => ({
        id: `slot-${index}`,
        name: mealNames[index],
        selectedMeals: meals
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      shareUrl: `${window.location.origin}${window.location.pathname}?share=${Date.now()}&client=${client.id}&type=nutrition`
    };
    
    onSavePlan(nutritionPlan);
  };

  const handleExportToPDF = async () => {
    await exportToPDF(client.name);
  };

  const handleShareWithClient = () => {
    const shareId = Date.now().toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}&client=${client.id}&type=nutrition`;
    
    // Save shared data
    const nutritionPlan: NutritionPlan = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name,
      mealsPerDay,
      mealSlots: selectedMeals.map((meals, index) => ({
        id: `slot-${index}`,
        name: mealNames[index],
        selectedMeals: meals
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
      shareUrl
    };
    
    const sharedData = {
      clientName: client.name,
      nutritionPlan,
      isReadOnly: true
    };
    
    localStorage.setItem(`client_${client.id}_nutrition_${shareId}`, JSON.stringify(sharedData));
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Client URL copied to clipboard!\n\nShare this link with ${client.name}:\n${shareUrl}`);
    }).catch(() => {
      prompt(`Copy this URL to share with ${client.name}:`, shareUrl);
    });
  };

  return (
    <div className="space-y-8">
      {/* Client Header */}
      <div className={`p-8 rounded-3xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 bg-gradient-to-br from-green-600 to-green-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-green-600">Nutrition Editor</h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Creating meal plan for {client.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleSavePlan}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white transition-all duration-200"
            >
              <Save className="w-5 h-5" />
              <span>Save Plan</span>
            </button>
            <button
              onClick={handleShareWithClient}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5 text-gray-400" />
            <span className="font-semibold">{client.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5 text-gray-400" />
            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
              client.goal === 'shredding' ? 'bg-red-100 text-red-800' :
              client.goal === 'bulking' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {client.goal}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-gray-400" />
            <span>{client.numberOfWeeks} weeks program</span>
          </div>
        </div>
      </div>

      {/* Meal Configuration */}
      <div className={`p-8 rounded-3xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold">Meal Configuration</h3>
          <div className="flex items-center space-x-6">
            <span className="text-xl font-medium">Meals per day:</span>
            <div className="flex items-center space-x-3">
              {[3, 4, 5, 6].map(count => (
                <button
                  key={count}
                  onClick={() => handleMealsPerDayChange(count)}
                  className={`px-6 py-3 rounded-2xl text-lg font-bold transition-all duration-200 ${
                    mealsPerDay === count
                      ? 'bg-gradient-to-r from-green-600 to-green-700 text-white shadow-lg'
                      : isDark 
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {count}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meal Slots */}
      <div className="space-y-8">
        {Array.from({ length: mealsPerDay }, (_, index) => (
          <div key={index} className={`p-8 rounded-3xl shadow-2xl ${
            isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-3xl font-bold text-green-600">{mealNames[index]}</h3>
              <MealSelector
                meals={meals.filter(meal => {
                  if (index < 3) return meal.category === ['breakfast', 'lunch', 'dinner'][index];
                  return meal.category === 'snack';
                })}
                onMealSelect={(meal) => handleMealSelect(index, meal)}
                isDark={isDark}
              />
            </div>

            <div className="space-y-6">
              {selectedMeals[index].map((selectedMeal, mealIndex) => (
                <MealCard
                  key={mealIndex}
                  selectedMeal={selectedMeal}
                  onRemove={() => handleMealRemove(index, mealIndex)}
                  onIngredientsChange={(ingredients) => handleIngredientsChange(index, mealIndex, ingredients)}
                  foods={foods}
                  isDark={isDark}
                  isClientMode={false}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Nutrition Summary */}
      <div className="mb-8">
        <NutritionSummary nutrition={totalNutrition} isDark={isDark} />
      </div>

      {/* Export Button */}
      <div className="flex justify-center">
        <button
          onClick={handleExportToPDF}
          className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-xl font-bold transition-all duration-200 shadow-2xl ${
            isDark 
              ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white' 
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
          }`}
        >
          <Download className="w-6 h-6" />
          <span>Export PDF</span>
        </button>
      </div>
    </div>
  );
};
