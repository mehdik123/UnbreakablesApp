import React, { useState, useMemo, useEffect } from 'react';
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
  Settings
} from 'lucide-react';
import { MealSelector } from './MealSelector';
import { MealCard } from './MealCard';
import { NutritionSummary } from './NutritionSummary';
import { Client, NutritionPlan, SelectedMeal, Meal, Food } from '../types';
import { calculateTotalNutrition } from '../utils/nutritionCalculator';
import { exportToPDF } from '../utils/pdfExport';

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

interface EnhancedNutritionEditorProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  isDark: boolean;
  onSavePlan: (plan: NutritionPlan) => void;
  onBack: () => void;
}

export const EnhancedNutritionEditor: React.FC<EnhancedNutritionEditorProps> = ({
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
  const [showTemplates, setShowTemplates] = useState(false);
  const [showIngredientEditor, setShowIngredientEditor] = useState(false);
  const [editingMeal, setEditingMeal] = useState<{mealSlotIndex: number, mealIndex: number} | null>(null);
  const [templates, setTemplates] = useState<NutritionTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState<string>('all');

  const mealNames = ['Breakfast', 'Lunch', 'Dinner', 'Snack 1', 'Snack 2', 'Snack 3'];

  // Load templates from localStorage
  useEffect(() => {
    const savedTemplates = localStorage.getItem('nutrition_templates');
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  }, []);

  // Save templates to localStorage
  const saveTemplates = (newTemplates: NutritionTemplate[]) => {
    setTemplates(newTemplates);
    localStorage.setItem('nutrition_templates', JSON.stringify(newTemplates));
  };

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

  const handleSaveAsTemplate = () => {
    const template: NutritionTemplate = {
      id: Date.now().toString(),
      name: `${client.goal} - ${mealsPerDay} meals - ${Math.round(calculateTotalNutrition(selectedMeals).calories)} kcal`,
      goal: client.goal,
      mealsPerDay,
      calories: Math.round(calculateTotalNutrition(selectedMeals).calories),
      mealSlots: selectedMeals.map((meals, index) => ({
        id: `slot-${index}`,
        name: mealNames[index],
        selectedMeals: meals
      })),
      createdAt: new Date()
    };
    
    const newTemplates = [...templates, template];
    saveTemplates(newTemplates);
    alert('Template saved successfully!');
  };

  const handleLoadTemplate = (template: NutritionTemplate) => {
    setMealsPerDay(template.mealsPerDay);
    setSelectedMeals(template.mealSlots.map(slot => slot.selectedMeals));
    setShowTemplates(false);
  };

  const handleDeleteTemplate = (templateId: string) => {
    const newTemplates = templates.filter(t => t.id !== templateId);
    saveTemplates(newTemplates);
  };

  const handleEditIngredients = (mealSlotIndex: number, mealIndex: number) => {
    setEditingMeal({ mealSlotIndex, mealIndex });
    setShowIngredientEditor(true);
  };

  const handleCaloricAdjustment = (multiplier: number) => {
    const newSelectedMeals = selectedMeals.map(mealSlot => 
      mealSlot.map(selectedMeal => {
        if (selectedMeal.customIngredients) {
          return {
            ...selectedMeal,
            customIngredients: selectedMeal.customIngredients.map(ingredient => ({
              ...ingredient,
              quantity: Math.round(ingredient.quantity * multiplier)
            }))
          };
        }
        return selectedMeal;
      })
    );
    setSelectedMeals(newSelectedMeals);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = filterGoal === 'all' || template.goal === filterGoal;
    return matchesSearch && matchesGoal;
  });

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
      alert(`Nutrition plan URL copied to clipboard!\n\nShare this link with ${client.name}:\n${shareUrl}`);
    }).catch(() => {
      prompt(`Copy this URL to share with ${client.name}:`, shareUrl);
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`p-8 rounded-3xl shadow-2xl ${
        isDark ? 'bg-black border-white text-white' : 'bg-white border-black text-black shadow-xl'
      }`} style={{border: '2px solid'}}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className={`p-3 rounded-2xl transition-all duration-200 ${
                isDark 
                  ? 'bg-black border border-white text-white' 
                  : 'bg-white border border-black text-black'
              }`}
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl" style={{backgroundColor: '#dc1e3a'}}>
              <Utensils className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold" style={{color: '#dc1e3a'}}>
                Enhanced Nutrition Builder
              </h2>
              <p className={`text-lg ${isDark ? 'text-white' : 'text-black'}`}>
                Create personalized nutrition plans for {client.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowTemplates(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
              style={{backgroundColor: '#dc1e3a'}}
            >
              <BookOpen className="w-4 h-4" />
              <span>Templates</span>
            </button>
            <button
              onClick={handleSaveAsTemplate}
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
              style={{backgroundColor: '#dc1e3a'}}
            >
              <Save className="w-4 h-4" />
              <span>Save Template</span>
            </button>
            <button
              onClick={handleShareWithClient}
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
              style={{backgroundColor: '#dc1e3a'}}
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-3">
            <User className="w-5 h-5" style={{color: '#dc1e3a'}} />
            <span className="font-semibold">{client.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <Target className="w-5 h-5" style={{color: '#dc1e3a'}} />
            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
              client.goal === 'shredding' ? 'bg-red-100 text-red-800' :
              client.goal === 'bulking' ? 'bg-green-100 text-green-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {client.goal}
            </span>
          </div>
          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5" style={{color: '#dc1e3a'}} />
            <span>{client.numberOfWeeks} weeks program</span>
          </div>
          <div className="flex items-center space-x-3">
            <Utensils className="w-5 h-5" style={{color: '#dc1e3a'}} />
            <span>{mealsPerDay} meals per day</span>
          </div>
        </div>
      </div>

      {/* Caloric Adjustment Controls */}
      <div className={`p-6 rounded-3xl shadow-2xl ${
        isDark ? 'bg-black border-white text-white' : 'bg-white border-black text-black shadow-xl'
      }`} style={{border: '2px solid'}}>
        <h3 className="text-xl font-bold mb-4" style={{color: '#dc1e3a'}}>Caloric Adjustment</h3>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => handleCaloricAdjustment(0.8)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
            style={{backgroundColor: '#dc1e3a'}}
          >
            -20% (640 kcal)
          </button>
          <button
            onClick={() => handleCaloricAdjustment(1.0)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
            style={{backgroundColor: '#dc1e3a'}}
          >
            Reset (800 kcal)
          </button>
          <button
            onClick={() => handleCaloricAdjustment(1.2)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
            style={{backgroundColor: '#dc1e3a'}}
          >
            +20% (960 kcal)
          </button>
          <button
            onClick={() => handleCaloricAdjustment(1.5)}
            className="px-4 py-2 rounded-2xl text-sm font-semibold text-white transition-all duration-200"
            style={{backgroundColor: '#dc1e3a'}}
          >
            +50% (1200 kcal)
          </button>
        </div>
        <p className="text-sm mt-2 opacity-75">
          Adjust all meal portions proportionally to match your client's caloric needs
        </p>
      </div>

      {/* Meals Per Day Selector */}
      <div className={`p-6 rounded-3xl shadow-2xl ${
        isDark ? 'bg-black border-white text-white' : 'bg-white border-black text-black shadow-xl'
      }`} style={{border: '2px solid'}}>
        <h3 className="text-xl font-bold mb-4" style={{color: '#dc1e3a'}}>Meals Per Day</h3>
        <div className="flex space-x-2">
          {[3, 4, 5, 6].map(count => (
            <button
              key={count}
              onClick={() => handleMealsPerDayChange(count)}
              className={`px-6 py-3 rounded-2xl text-lg font-semibold transition-all duration-200 ${
                mealsPerDay === count
                  ? 'text-white' 
                  : isDark 
                    ? 'bg-black border border-white text-white hover:bg-gray-900' 
                    : 'bg-white border border-black text-black hover:bg-gray-100'
              }`}
              style={{
                backgroundColor: mealsPerDay === count ? '#dc1e3a' : undefined,
                border: mealsPerDay !== count ? '2px solid' : undefined
              }}
            >
              {count} Meals
            </button>
          ))}
        </div>
      </div>

      {/* Meal Slots */}
      <div className="space-y-6">
        {Array.from({ length: mealsPerDay }, (_, mealSlotIndex) => (
          <div key={mealSlotIndex} className={`p-6 rounded-3xl shadow-2xl ${
            isDark ? 'bg-black border-white text-white' : 'bg-white border-black text-black shadow-xl'
          }`} style={{border: '2px solid'}}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold" style={{color: '#dc1e3a'}}>
                {mealNames[mealSlotIndex]}
              </h3>
              <MealSelector
                meals={meals}
                onMealSelect={(meal) => handleMealSelect(mealSlotIndex, meal)}
                isDark={isDark}
              />
            </div>

            {selectedMeals[mealSlotIndex].length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handlePrevMeal(mealSlotIndex)}
                      disabled={currentMealIndex[mealSlotIndex] === 0}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        currentMealIndex[mealSlotIndex] === 0
                          ? 'opacity-50 cursor-not-allowed'
                          : isDark
                            ? 'bg-gray-800 text-white hover:bg-gray-700'
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="text-sm font-semibold">
                      {currentMealIndex[mealSlotIndex] + 1} of {selectedMeals[mealSlotIndex].length}
                    </span>
                    <button
                      onClick={() => handleNextMeal(mealSlotIndex)}
                      disabled={currentMealIndex[mealSlotIndex] === selectedMeals[mealSlotIndex].length - 1}
                      className={`p-2 rounded-xl transition-all duration-200 ${
                        currentMealIndex[mealSlotIndex] === selectedMeals[mealSlotIndex].length - 1
                          ? 'opacity-50 cursor-not-allowed'
                          : isDark
                            ? 'bg-gray-800 text-white hover:bg-gray-700'
                            : 'bg-gray-200 text-black hover:bg-gray-300'
                      }`}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditIngredients(mealSlotIndex, currentMealIndex[mealSlotIndex])}
                      className="p-2 rounded-xl text-white transition-all duration-200"
                      style={{backgroundColor: '#dc1e3a'}}
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMealRemove(mealSlotIndex, currentMealIndex[mealSlotIndex])}
                      className="p-2 rounded-xl text-white transition-all duration-200"
                      style={{backgroundColor: '#dc1e3a'}}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <MealCard
                  selectedMeal={selectedMeals[mealSlotIndex][currentMealIndex[mealSlotIndex]]}
                  onIngredientsChange={(ingredients) => 
                    handleIngredientsChange(mealSlotIndex, currentMealIndex[mealSlotIndex], ingredients)
                  }
                  isDark={isDark}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Nutrition Summary */}
      <NutritionSummary
        nutrition={totalNutrition}
        isDark={isDark}
      />

      {/* Action Buttons */}
      <div className="flex items-center justify-center space-x-4">
        <button
          onClick={handleSavePlan}
          className="flex items-center space-x-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all duration-200"
          style={{backgroundColor: '#dc1e3a'}}
        >
          <Save className="w-5 h-5" />
          <span>Save Nutrition Plan</span>
        </button>
        <button
          onClick={handleExportToPDF}
          className="flex items-center space-x-2 px-8 py-4 rounded-2xl text-lg font-semibold text-white transition-all duration-200"
          style={{backgroundColor: '#dc1e3a'}}
        >
          <Download className="w-5 h-5" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto ${
            isDark ? 'bg-black border-white text-white' : 'bg-white border-black text-black shadow-xl'
          }`} style={{border: '2px solid'}}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold" style={{color: '#dc1e3a'}}>Nutrition Templates</h3>
              <button
                onClick={() => setShowTemplates(false)}
                className="p-2 rounded-xl text-white transition-all duration-200"
                style={{backgroundColor: '#dc1e3a'}}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search and Filter */}
            <div className="flex space-x-4 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-black border-white text-white' 
                      : 'bg-white border-black text-black'
                  }`}
                />
              </div>
              <select
                value={filterGoal}
                onChange={(e) => setFilterGoal(e.target.value)}
                className={`px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                  isDark 
                    ? 'bg-black border-white text-white' 
                    : 'bg-white border-black text-black'
                }`}
              >
                <option value="all">All Goals</option>
                <option value="shredding">Shredding</option>
                <option value="bulking">Bulking</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTemplates.map(template => (
                <div key={template.id} className={`p-4 rounded-2xl border-2 ${
                  isDark ? 'bg-black border-white' : 'bg-white border-black'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-lg">{template.name}</h4>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleLoadTemplate(template)}
                        className="p-2 rounded-xl text-white transition-all duration-200"
                        style={{backgroundColor: '#dc1e3a'}}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template.id)}
                        className="p-2 rounded-xl text-white transition-all duration-200"
                        style={{backgroundColor: '#dc1e3a'}}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="text-sm opacity-75">
                    <p>Goal: {template.goal}</p>
                    <p>Meals: {template.mealsPerDay}</p>
                    <p>Calories: {template.calories} kcal</p>
                    <p>Created: {new Date(template.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {filteredTemplates.length === 0 && (
              <div className="text-center py-8">
                <p className="text-lg">No templates found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
