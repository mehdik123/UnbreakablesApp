import React from 'react';
import { Utensils, RotateCcw } from 'lucide-react';
import { Client, NutritionPlan } from '../types';

interface SimpleNutritionViewProps {
  client: Client;
  isDark: boolean;
  nutritionPlan?: NutritionPlan | null;
}

export const SimpleNutritionView: React.FC<SimpleNutritionViewProps> = ({
  client,
  isDark,
  nutritionPlan
}) => {
  console.log('🍽️ SimpleNutritionView - Props:', { client, nutritionPlan });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-blue-600/20 rounded-3xl blur-xl animate-pulse" />
          <div className="relative bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Utensils className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">
              Nutrition Interface
            </h3>
            <p className="text-slate-300 mb-6">
              {nutritionPlan ? 'Nutrition plan loaded successfully!' : 'No nutrition plan available.'}
            </p>
            <div className="text-sm text-slate-400 mb-6">
              <p>Client: {client.name}</p>
              <p>Plan: {nutritionPlan ? 'Available' : 'Not available'}</p>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl font-semibold transition-all duration-300"
            >
              <RotateCcw className="w-4 h-4 inline mr-2" />
              Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleNutritionView;













