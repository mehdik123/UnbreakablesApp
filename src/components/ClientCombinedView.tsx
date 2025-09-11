import React, { useState } from 'react';
import { 
  Utensils, 
  Dumbbell, 
  User,
  Calendar,
  Target,
  Download,
  Share2,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  CheckCircle,
  Plus,
  Minus,
  Zap
} from 'lucide-react';
import { ClientNutritionView } from './ClientNutritionView';
import { ClientWorkoutViewCombined } from './ClientWorkoutView';
import { ClientNutritionView as ClientNutritionViewType, ClientWorkoutView as ClientWorkoutViewType } from '../types';

interface ClientCombinedViewProps {
  clientView: {
    clientName: string;
    clientId: string;
    nutritionPlan?: any;
    workoutAssignment?: any;
    isReadOnly: boolean;
    canEditRepsWeights: boolean;
  };
  isDark: boolean;
}

export const ClientCombinedView: React.FC<ClientCombinedViewProps> = ({
  clientView,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout'>('nutrition');
  const [showInstructions, setShowInstructions] = useState(true);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className={`p-8 rounded-3xl shadow-2xl ${
        isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl">
              <Target className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-purple-600 bg-clip-text text-transparent">
                Your Complete Plan
              </h2>
              <p className={`text-xl ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Personalized nutrition and workout plan for {clientView.clientName}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setShowInstructions(!showInstructions)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold transition-all duration-200 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
              }`}
            >
              {showInstructions ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              <span>{showInstructions ? 'Hide' : 'Show'} Instructions</span>
            </button>
            <button
              onClick={() => {/* Export functionality */}}
              className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-sm font-semibold bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white transition-all duration-200"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Instructions */}
        {showInstructions && (
          <div className={`p-6 rounded-2xl mb-6 ${
            isDark ? 'bg-gray-700 border border-gray-600' : 'bg-blue-50 border border-blue-200'
          }`}>
            <h3 className="text-lg font-bold mb-3 text-blue-600">📋 Complete Plan Instructions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2 text-green-600">🍽️ Nutrition Plan</h4>
                <ul className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>• Follow the meal plan exactly as designed</li>
                  <li>• Pay attention to portion sizes and cooking instructions</li>
                  <li>• Take photos of your meals to track progress</li>
                  <li>• This is a read-only view - you cannot edit the plan</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-purple-600">💪 Workout Plan</h4>
                <ul className={`space-y-1 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>• You can edit reps and weights for each set</li>
                  <li>• You cannot change exercises or add/remove sets</li>
                  <li>• Mark sets as completed when finished</li>
                  <li>• Follow the rest periods between sets</li>
                </ul>
              </div>
            </div>
          </div>
        )}
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
            {clientView.nutritionPlan && (
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
            {clientView.workoutAssignment && (
              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'nutrition' && clientView.nutritionPlan ? (
        <ClientNutritionView
          clientView={{
            clientName: clientView.clientName,
            nutritionPlan: clientView.nutritionPlan,
            isReadOnly: clientView.isReadOnly
          }}
          isDark={isDark}
        />
      ) : activeTab === 'workout' && clientView.workoutAssignment ? (
        <ClientWorkoutViewCombined
          clientView={{
            clientName: clientView.clientName,
            clientId: clientView.clientId,
            workoutAssignment: clientView.workoutAssignment,
            isReadOnly: clientView.isReadOnly,
            canEditRepsWeights: clientView.canEditRepsWeights
          }}
          isDark={isDark}
        />
      ) : (
        <div className={`p-8 rounded-3xl shadow-2xl text-center ${
          isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
        }`}>
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-2xl font-bold mb-2">
            {activeTab === 'nutrition' ? 'No Nutrition Plan' : 'No Workout Plan'}
          </h3>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Your coach hasn't created a {activeTab} plan yet. Please contact them for more information.
          </p>
        </div>
      )}

      {/* Footer */}
      <div className={`p-6 rounded-3xl shadow-2xl text-center ${
        isDark ? 'bg-gray-800 text-white border border-gray-700' : 'bg-white text-gray-900 shadow-xl'
      }`}>
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          This complete plan was created by your coach. For questions or modifications, please contact them directly.
        </p>
        <div className="mt-4 flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-gray-400" />
            <span className="text-sm">Coach: {clientView.clientName}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span className="text-sm">Client ID: {clientView.clientId}</span>
          </div>
        </div>
      </div>
    </div>
  );
};






