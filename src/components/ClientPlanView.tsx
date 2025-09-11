import React, { useState } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Share2, 
  Utensils, 
  Dumbbell,
  User,
  Calendar,
  Target,
  FileText,
  Activity
} from 'lucide-react';
import { EnhancedNutritionEditor } from './EnhancedNutritionEditor';
import { WorkoutEditor } from './WorkoutEditor';
import { Client, NutritionPlan, ClientWorkoutAssignment, Food, Meal } from '../types';

interface ClientPlanViewProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  isDark: boolean;
  onSaveNutritionPlan: (plan: NutritionPlan) => void;
  onSaveWorkoutAssignment: (assignment: ClientWorkoutAssignment) => void;
  onShareWithClient: (client: Client) => void;
  onBack: () => void;
}

export const ClientPlanView: React.FC<ClientPlanViewProps> = ({
  client,
  foods,
  meals,
  isDark,
  onSaveNutritionPlan,
  onSaveWorkoutAssignment,
  onShareWithClient,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout'>('nutrition');

  const handleShareWithClient = () => {
    const shareId = Date.now().toString();
    const shareUrl = `${window.location.origin}${window.location.pathname}?share=${shareId}&client=${client.id}&type=plan`;
    
    // Save combined shared data
    const sharedData = {
      clientName: client.name,
      clientId: client.id,
      nutritionPlan: client.nutritionPlan,
      workoutAssignment: client.workoutAssignment,
      isReadOnly: true,
      canEditRepsWeights: true
    };
    
    localStorage.setItem(`client_${client.id}_plan_${shareId}`, JSON.stringify(sharedData));
    
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert(`Client URL copied to clipboard!\n\nShare this link with ${client.name}:\n${shareUrl}\n\nThey will see both their nutrition and workout plans.`);
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                Client Plan Manager
              </h2>
              <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Managing nutrition and workout plans for {client.name}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={handleShareWithClient}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200"
            >
              <Share2 className="w-5 h-5" />
              <span>Share All Plans</span>
            </button>
          </div>
        </div>

        {/* Client Info */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
          <div className="flex items-center space-x-3">
            <Activity className="w-5 h-5 text-gray-400" />
            <span className={`px-2 py-1 rounded-full text-sm font-semibold ${
              client.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {client.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className={`p-6 rounded-3xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
      }`}>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('nutrition')}
            className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 shadow-lg ${
              activeTab === 'nutrition'
                ? 'bg-gradient-to-r from-green-600 to-green-700 text-white' 
                : isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Utensils className="w-5 h-5" />
            <span>Nutrition Plan</span>
            {client.nutritionPlan && (
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('workout')}
            className={`flex items-center space-x-3 px-8 py-4 rounded-2xl text-lg font-semibold transition-all duration-200 shadow-lg ${
              activeTab === 'workout'
                ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white' 
                : isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Dumbbell className="w-5 h-5" />
            <span>Workout Plan</span>
            {client.workoutAssignment && (
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'nutrition' ? (
        <EnhancedNutritionEditor
          client={client}
          foods={foods}
          meals={meals}
          isDark={isDark}
          onSavePlan={onSaveNutritionPlan}
          onBack={onBack}
        />
      ) : (
        <WorkoutEditor
          client={client}
          isDark={isDark}
          onSaveAssignment={onSaveWorkoutAssignment}
          onBack={onBack}
        />
      )}
    </div>
  );
};
