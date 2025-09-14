import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  User,
  Calendar,
  Target,
  Utensils,
  Dumbbell,
  Award,
  Lock,
  Unlock,
  CheckCircle,
  Clock,
  Heart,
  Zap,
  Star,
  Eye,
  EyeOff,
  ChefHat,
  BookOpen,
  Share2,
  Download,
  Printer
} from 'lucide-react';
import { Client, NutritionPlan, WorkoutPlan, WorkoutProgram, WorkoutDay, WorkoutExercise } from '../types';
import { ClientNutritionView } from './ClientNutritionView';
import { ClientWorkoutView } from './ClientWorkoutView';
import { ClientProgressView } from './ClientProgressView';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';

interface ClientInterfaceProps {
  client: Client;
  isDark: boolean;
  onBack: () => void;
}

export const ClientInterface: React.FC<ClientInterfaceProps> = ({
  client,
  isDark,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'progress'>('nutrition');
  const [currentWeek, setCurrentWeek] = useState(1);
  const [unlockedWeeks, setUnlockedWeeks] = useState<number[]>([1]); // Only week 1 unlocked by default
  const [isLoading, setIsLoading] = useState(true);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Load nutrition plan from Supabase first, then fallback to localStorage
  useEffect(() => {
    const loadNutritionPlan = async () => {
      try {
        // First try to load from Supabase
        if (isSupabaseReady && supabase) {
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          
          if (cRow?.id) {
            const { data: nutritionPlan } = await supabase
              .from('nutrition_plans')
              .select('plan_json, updated_at')
              .eq('client_id', cRow.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (nutritionPlan?.plan_json) {
              console.log('🍽️ Client loaded nutrition plan from Supabase:', nutritionPlan.plan_json);
              setNutritionPlan(nutritionPlan.plan_json);
              return;
            }
          }
        }
        
        // Fallback: try to get from client object
        if (client.nutritionPlan) {
          console.log('🍽️ Client loaded nutrition plan from client object:', client.nutritionPlan);
          setNutritionPlan(client.nutritionPlan);
          return;
        }

        // Last resort: try to load from localStorage
        const savedNutritionPlan = localStorage.getItem(`nutrition_plan_${client.id}`);
        if (savedNutritionPlan) {
          try {
            const parsed = JSON.parse(savedNutritionPlan);
            console.log('🍽️ Client loaded nutrition plan from localStorage:', parsed);
            setNutritionPlan(parsed);
          } catch (error) {
            console.error('Error loading nutrition plan from localStorage:', error);
            setNutritionPlan(null);
          }
        } else {
          console.log('🍽️ No nutrition plan found for client');
          setNutritionPlan(null);
        }
      } catch (error) {
        console.error('❌ Failed to load nutrition plan:', error);
      }
    };

    loadNutritionPlan();
  }, [client.id, client.nutritionPlan]);

  // Update unlocked weeks based on workout assignment
  useEffect(() => {
    if (client.workoutAssignment?.weeks) {
      const unlocked = client.workoutAssignment.weeks
        .filter(week => week.isUnlocked)
        .map(week => week.weekNumber);
      setUnlockedWeeks(unlocked.length > 0 ? unlocked : [1]);
    }
  }, [client.workoutAssignment]);

  // Force refresh every 5 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (client.workoutAssignment?.weeks) {
        const unlocked = client.workoutAssignment.weeks
          .filter(week => week.isUnlocked)
          .map(week => week.weekNumber);
        setUnlockedWeeks(unlocked.length > 0 ? unlocked : [1]);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [client.workoutAssignment]);

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
      case 'shredding': return <Zap className="w-4 h-4" />;
      case 'bulking': return <Target className="w-4 h-4" />;
      case 'maintenance': return <Heart className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const handleWeekChange = (week: number) => {
    if (unlockedWeeks.includes(week)) {
      setCurrentWeek(week);
    }
  };

  const getWeekStatus = (week: number) => {
    const isUnlocked = unlockedWeeks.includes(week);
    if (isUnlocked) {
      return 'unlocked';
    }
    return 'locked';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-12 h-12 border-2 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mt-4">Loading your program...</h2>
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
                    {client.name}'s Program
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
              <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                <Share2 className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                <Download className="w-5 h-5" />
              </button>
              <button className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-200">
                <Printer className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Program Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
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

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
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

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Current Week</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                  {currentWeek}/{client.numberOfWeeks}
                </p>
              </div>
              <div className="w-12 h-12 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>
        </div>


        {/* Week Navigation */}
        {client.workoutAssignment && (
          <div className="mb-8">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Week Navigation</h3>
                <button
                  onClick={() => {
                    // Force refresh from localStorage
                    const clientId = client.id;
                    const existingKeys = Object.keys(localStorage).filter(key => 
                      key.startsWith(`client_${clientId}_complete_`)
                    );
                    
                    if (existingKeys.length > 0) {
                      const latestKey = existingKeys[existingKeys.length - 1];
                      const sharedData = JSON.parse(localStorage.getItem(latestKey) || '{}');
                      
                      if (sharedData.workoutAssignment?.weeks) {
                        const unlocked = sharedData.workoutAssignment.weeks
                          .filter(week => week.isUnlocked)
                          .map(week => week.weekNumber);
                        setUnlockedWeeks(unlocked.length > 0 ? unlocked : [1]);
                      }
                    }
                  }}
                  className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  🔄 Refresh
                </button>
              </div>
              <div className="flex space-x-2 overflow-x-auto">
                {Array.from({ length: client.numberOfWeeks }, (_, i) => i + 1).map(week => {
                  const status = getWeekStatus(week);
                  const isCurrentWeek = week === currentWeek;
                  
                  return (
                    <button
                      key={week}
                      onClick={() => handleWeekChange(week)}
                      disabled={status === 'locked'}
                      className={`flex-shrink-0 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                        status === 'locked'
                          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
                          : isCurrentWeek
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        {status === 'locked' ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Unlock className="w-4 h-4" />
                        )}
                        <span>Week {week}</span>
                        {isCurrentWeek && <CheckCircle className="w-4 h-4" />}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 space-y-2">
                {unlockedWeeks.length === 1 ? (
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-700 dark:text-blue-300 font-medium">
                      🎯 Week 1 is your starting point! Complete all exercises to unlock Week 2.
                    </p>
                  </div>
                ) : currentWeek === 1 && unlockedWeeks.includes(2) ? (
                  <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      🎉 Congratulations! Week 1 is complete. Your coach has unlocked Week 2 for you!
                    </p>
                  </div>
                ) : currentWeek > 1 ? (
                  <div className="p-3 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                    <p className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                      🚀 Great progress! You're now on Week {currentWeek}. Keep up the excellent work!
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                    <p className="text-sm text-slate-600 dark:text-slate-400">
                      {unlockedWeeks.length} weeks unlocked. Complete your current week to unlock the next one.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-2">
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('nutrition')}
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
                onClick={() => setActiveTab('workout')}
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
                onClick={() => setActiveTab('progress')}
                className={`flex-1 flex items-center justify-center space-x-3 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                  activeTab === 'progress' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                <Award className="w-4 h-4" />
                <span>My Progress</span>
              </button>
            </div>
          </div>
        </div>

        {/* Content Area */}
        {activeTab === 'nutrition' ? (
          <ClientNutritionView
            client={client}
            isDark={isDark}
            nutritionPlan={nutritionPlan}
          />
        ) : activeTab === 'workout' ? (
          <ClientWorkoutView
            client={client}
            currentWeek={currentWeek}
            unlockedWeeks={unlockedWeeks}
            isDark={isDark}
          />
        ) : (
          <ClientProgressView
            client={client}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};

export default ClientInterface;
