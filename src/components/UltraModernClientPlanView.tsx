import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Target, 
  Utensils, 
  Dumbbell, 
  Calendar, 
  User, 
  Settings,
  Save,
  Download,
  Share2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Flame,
  TrendingUp,
  Shield,
  Activity,
  BarChart3,
  Heart,
  Zap,
  Crown,
  Star,
  ArrowRight,
  ChevronDown,
  Filter,
  Search,
  Grid3X3,
  List,
  Eye,
  Copy,
  MoreVertical
} from 'lucide-react';
import { Client, Food, Meal, NutritionPlan, WorkoutPlan, Workout, Exercise } from '../types';
import { EnhancedNutritionEditor } from './EnhancedNutritionEditor';
import { WorkoutEditor } from './WorkoutEditor';

interface UltraModernClientPlanViewProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  onBack: () => void;
  onSaveNutritionPlan: (clientId: string, plan: NutritionPlan) => void;
  onSaveWorkoutPlan: (clientId: string, plan: WorkoutPlan) => void;
  onAssignWorkout: (clientId: string, workout: Workout) => void;
  isDark: boolean;
}

export const UltraModernClientPlanView: React.FC<UltraModernClientPlanViewProps> = ({
  client,
  foods,
  meals,
  onBack,
  onSaveNutritionPlan,
  onSaveWorkoutPlan,
  onAssignWorkout,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout'>('nutrition');
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const getGoalColor = (goal: string) => {
    return '#dc1e3a';
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'shredding': return <Flame className="w-5 h-5" />;
      case 'bulking': return <TrendingUp className="w-5 h-5" />;
      case 'maintenance': return <Shield className="w-5 h-5" />;
      default: return <Target className="w-5 h-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{backgroundColor: '#000000'}}>
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-20 h-20 border-4 border-transparent border-t-red-500/40 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-6 animate-pulse">Loading Plan...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{backgroundColor: '#000000'}}>
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl border-b" style={{backgroundColor: 'rgba(0,0,0,0.8)', borderColor: '#dc1e3a'}}>
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <button
                onClick={onBack}
                className="p-3 rounded-2xl transition-all duration-300 hover:scale-105"
                style={{backgroundColor: 'rgba(220,30,58,0.1)', borderColor: '#dc1e3a'}}
              >
                <ArrowLeft className="w-6 h-6 text-white" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl" style={{backgroundColor: '#dc1e3a'}}>
                  <User className="w-7 h-7 text-white" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {client.name}'s Plan
                  </h1>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 px-3 py-1 rounded-full text-white text-sm font-semibold" style={{backgroundColor: '#dc1e3a'}}>
                      {getGoalIcon(client.goal)}
                      <span className="capitalize">{client.goal}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Calendar className="w-4 h-4" />
                      <span>{client.numberOfWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-3 rounded-2xl transition-all duration-300"
                style={{backgroundColor: 'rgba(220,30,58,0.1)', borderColor: '#dc1e3a'}}
              >
                <BarChart3 className="w-5 h-5 text-white" />
              </button>
              <button className="p-3 rounded-2xl transition-all duration-300" style={{backgroundColor: 'rgba(220,30,58,0.1)', borderColor: '#dc1e3a'}}>
                <Share2 className="w-5 h-5 text-white" />
              </button>
              <button className="p-3 rounded-2xl transition-all duration-300" style={{backgroundColor: 'rgba(220,30,58,0.1)', borderColor: '#dc1e3a'}}>
                <Settings className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl blur-sm" style={{backgroundColor: 'rgba(220,30,58,0.1)'}}></div>
              <div className="relative backdrop-blur-xl rounded-2xl border p-6 hover:bg-white/10 transition-all duration-500" style={{backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#dc1e3a'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Nutrition Plan</p>
                    <p className="text-3xl font-bold text-white">
                      {client.nutritionPlan ? '✓' : '○'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#dc1e3a'}}>
                    <Utensils className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl blur-sm" style={{backgroundColor: 'rgba(220,30,58,0.1)'}}></div>
              <div className="relative backdrop-blur-xl rounded-2xl border p-6 hover:bg-white/10 transition-all duration-500" style={{backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#dc1e3a'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Workout Plan</p>
                    <p className="text-3xl font-bold text-white">
                      {client.workoutAssignment ? '✓' : '○'}
                    </p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#dc1e3a'}}>
                    <Dumbbell className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl blur-sm" style={{backgroundColor: 'rgba(220,30,58,0.1)'}}></div>
              <div className="relative backdrop-blur-xl rounded-2xl border p-6 hover:bg-white/10 transition-all duration-500" style={{backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#dc1e3a'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Weight Logs</p>
                    <p className="text-3xl font-bold text-white">{client.weightLog?.length || 0}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#dc1e3a'}}>
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 rounded-2xl blur-sm" style={{backgroundColor: 'rgba(220,30,58,0.1)'}}></div>
              <div className="relative backdrop-blur-xl rounded-2xl border p-6 hover:bg-white/10 transition-all duration-500" style={{backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#dc1e3a'}}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm font-medium">Progress</p>
                    <p className="text-3xl font-bold text-white">94%</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{backgroundColor: '#dc1e3a'}}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl blur-sm" style={{backgroundColor: 'rgba(220,30,58,0.1)'}}></div>
            <div className="relative backdrop-blur-xl rounded-2xl border p-2" style={{backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#dc1e3a'}}>
              <div className="flex space-x-2">
                <button
                  onClick={() => setActiveTab('nutrition')}
                  className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'nutrition' 
                      ? 'text-white shadow-lg transform scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  style={activeTab === 'nutrition' ? {backgroundColor: '#dc1e3a'} : {}}
                >
                  <Utensils className="w-5 h-5" />
                  <span>Nutrition Plan</span>
                </button>
                <button
                  onClick={() => setActiveTab('workout')}
                  className={`flex-1 flex items-center justify-center space-x-3 px-6 py-4 rounded-xl font-semibold transition-all duration-300 ${
                    activeTab === 'workout' 
                      ? 'text-white shadow-lg transform scale-105' 
                      : 'text-gray-400 hover:text-white hover:bg-white/10'
                  }`}
                  style={activeTab === 'workout' ? {backgroundColor: '#dc1e3a'} : {}}
                >
                  <Dumbbell className="w-5 h-5" />
                  <span>Workout Plan</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="relative">
          <div className="absolute inset-0 rounded-3xl blur-sm" style={{backgroundColor: 'rgba(220,30,58,0.1)'}}></div>
          <div className="relative backdrop-blur-xl rounded-3xl border p-8" style={{backgroundColor: 'rgba(255,255,255,0.05)', borderColor: '#dc1e3a'}}>
            {activeTab === 'nutrition' ? (
              <EnhancedNutritionEditor
                client={client}
                foods={foods}
                meals={meals}
                onSave={(plan) => onSaveNutritionPlan(client.id, plan)}
                isDark={isDark}
              />
            ) : (
              <WorkoutEditor
                client={client}
                onSave={(plan) => onSaveWorkoutPlan(client.id, plan)}
                onAssignWorkout={(workout) => onAssignWorkout(client.id, workout)}
                isDark={isDark}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
      `}</style>
    </div>
  );
};











