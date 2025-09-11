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
  Award,
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
import { UltraModernNutritionEditor } from './UltraModernNutritionEditor';
import UltraModernWorkoutEditor from './UltraModernWorkoutEditor';
import ClientProgressTracker from './ClientProgressTracker';

interface ModernClientPlanViewProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  onBack: () => void;
  onSaveNutritionPlan: (clientId: string, plan: NutritionPlan) => void;
  onSaveWorkoutPlan: (clientId: string, plan: WorkoutPlan) => void;
  onAssignWorkout: (clientId: string, workout: Workout) => void;
  isDark: boolean;
}

export const ModernClientPlanView: React.FC<ModernClientPlanViewProps> = ({
  client,
  foods,
  meals,
  onBack,
  onSaveNutritionPlan,
  onSaveWorkoutPlan,
  onAssignWorkout,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'progress'>('nutrition');
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showProgressTracker, setShowProgressTracker] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'shredding': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400';
      case 'bulking': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400';
      case 'maintenance': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-950/20 dark:text-slate-400';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'shredding': return <Flame className="w-4 h-4" />;
      case 'bulking': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-4">Loading plan...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg">
                  <User className="w-5 h-5 text-white" />
                </div>
                
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {client.name}'s Plan
                  </h1>
                  <div className="flex items-center space-x-3">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium ${getGoalColor(client.goal)}`}>
                      {getGoalIcon(client.goal)}
                      <span className="capitalize">{client.goal}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-slate-600 dark:text-slate-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>{client.numberOfWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowStats(!showStats)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                <Settings className="w-5 h-5" />
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
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Nutrition Plan</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {client.nutritionPlan ? '✓' : '○'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 flex items-center justify-center">
                  <Utensils className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Workout Plan</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                    {client.workoutAssignment ? '✓' : '○'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                  <Dumbbell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Weight Logs</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{client.weightLog?.length || 0}</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                  <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Progress</p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">94%</p>
                </div>
                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
                  <Crown className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => {
                  setActiveTab('nutrition');
                  setShowProgressTracker(false);
                }}
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'nutrition' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Utensils className="w-4 h-4" />
                <span>Nutrition Plan</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('workout');
                  setShowProgressTracker(false);
                }}
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'workout' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Dumbbell className="w-4 h-4" />
                <span>Workout Plan</span>
              </button>
              <button
                onClick={() => {
                  console.log('Progress Tracking button clicked!');
                  alert('Progress Tracking button clicked!');
                  setActiveTab('progress');
                  setShowProgressTracker(false);
                }}
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'progress' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>Progress Tracking</span>
              </button>
            </div>
          </div>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
          <h4 className="font-bold text-yellow-800 dark:text-yellow-200 mb-2">DEBUG INFO</h4>
          <p className="text-sm text-yellow-700 dark:text-yellow-300">
            activeTab: {activeTab} | showProgressTracker: {showProgressTracker.toString()}
          </p>
        </div>

        {/* Content Area */}
        {activeTab === 'nutrition' ? (
          <UltraModernNutritionEditor
            client={client}
            foods={foods}
            meals={meals}
            onSavePlan={(plan) => onSaveNutritionPlan(client.id, plan)}
            onAssignPlan={(plan) => onSaveNutritionPlan(client.id, plan)}
            onBack={() => {}}
            isDark={isDark}
          />
        ) : activeTab === 'progress' ? (
          <ClientProgressTracker
            client={client}
            isDark={isDark}
            onBack={() => {
              setShowProgressTracker(false);
              setActiveTab('nutrition');
            }}
          />
        ) : (
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
            <UltraModernWorkoutEditor
              client={client}
              onSaveAssignment={(assignment) => onSaveWorkoutPlan(client.id, assignment)}
              onBack={() => {}}
              isDark={isDark}
            />
          </div>
        )}
      </div>
    </div>
  );
};