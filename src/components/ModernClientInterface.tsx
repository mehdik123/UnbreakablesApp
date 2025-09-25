import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Target,
  Utensils,
  Dumbbell,
  Award,
  CheckCircle,
  Clock,
  Heart,
  Zap,
  Star,
  Play,
  ChevronRight,
  TrendingUp,
  Fire,
  Activity,
  Timer,
  BarChart3,
  Trophy,
  Flame,
  Crown,
  Sparkles,
  ChevronDown,
  Scale,
  ArrowLeft
} from 'lucide-react';
import { Client, NutritionPlan } from '../types';
import { ClientNutritionView } from './ClientNutritionView';
import { ClientWorkoutView } from './ClientWorkoutView';
import { UltraModernWeeklyWeightLogger } from './UltraModernWeeklyWeightLogger';
import IndependentMuscleGroupCharts from './IndependentMuscleGroupCharts';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { WeekProgressionManager } from '../utils/weekProgressionManager';

interface ModernClientInterfaceProps {
  client: Client;
  isDark: boolean;
}

export const ModernClientInterface: React.FC<ModernClientInterfaceProps> = ({
  client,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'progress' | 'weight'>('workout');
  const [currentWeek, setCurrentWeek] = useState(() => {
    // Use currentWeek from the workout assignment set by coach
    return client.workoutAssignment?.currentWeek || 1;
  });
  // Removed unlockedWeeks - using simplified currentWeek logic
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [showMotivationQuote, setShowMotivationQuote] = useState(true);

  // Motivational quotes
  const motivationQuotes = [
    { text: "Your only limit is you", emoji: "🔥" },
    { text: "Push yourself, because no one else will", emoji: "💪" },
    { text: "Great things never come from comfort zones", emoji: "⚡" },
    { text: "Don't stop when you're tired, stop when you're done", emoji: "🎯" },
    { text: "The pain you feel today will be the strength you feel tomorrow", emoji: "🏆" }
  ];

  const todayQuote = motivationQuotes[new Date().getDay() % motivationQuotes.length];

  // Load nutrition plan and sync current week
  useEffect(() => {
    const loadNutritionPlan = async () => {
      try {
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
              setNutritionPlan(nutritionPlan.plan_json);
              return;
            }
          }
        }
        
        if (client.nutritionPlan) {
          setNutritionPlan(client.nutritionPlan);
        }
      } catch (error) {
        console.error('❌ Failed to load nutrition plan:', error);
      }
    };

    loadNutritionPlan();

    // Sync current week from coach's assignment
    if (client.workoutAssignment?.currentWeek) {

      setCurrentWeek(client.workoutAssignment.currentWeek);
    }
  }, [client.id, client.nutritionPlan, client.workoutAssignment?.currentWeek]);

  // Real-time sync for current week from database
  useEffect(() => {
    if (!isSupabaseReady || !supabase) return;

    const syncCurrentWeek = async () => {
      try {
        const { data: cRow } = await supabase
          .from('clients')
          .select('id')
          .eq('full_name', client.name)
          .maybeSingle();
        
        if (cRow?.id) {
          const { data: assignment } = await supabase
            .from('workout_assignments')
            .select('current_week')
            .eq('client_id', cRow.id)
            .eq('is_active', true)
            .order('last_modified_at', { ascending: false })
            .limit(1)
            .maybeSingle();
          
          if (assignment?.current_week && assignment.current_week !== currentWeek) {

            setCurrentWeek(assignment.current_week);
            
            // Also update the workout assignment object
            if (client.workoutAssignment) {
              const updatedAssignment = {
                ...client.workoutAssignment,
                currentWeek: assignment.current_week
              };
              // Trigger a re-render by updating the client object
              // This will be handled by the parent component
            }
          }
        }
      } catch (error) {
        console.error('Error syncing current week:', error);
      }
    };

    // Initial sync
    syncCurrentWeek();

    // Set up periodic sync every 5 seconds as backup
    const intervalId = setInterval(syncCurrentWeek, 5000);

    // Set up real-time subscription
    const channel = supabase
      .channel(`client-${client.name}-week-sync`)
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'workout_assignments',
          filter: `client_id=eq.${client.id}`
        }, 
        (payload) => {

          if (payload.new.current_week && payload.new.current_week !== currentWeek) {

            setCurrentWeek(payload.new.current_week);
          }
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [client.id, client.name, currentWeek]);

  // Update weeks with real-time sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        console.log('🔄 CLIENT SYNC DEBUG - Starting sync check...', {
          isSupabaseReady,
          hasSupabase: !!supabase,
          clientId: client.id,
          clientName: client.name,
          currentWeek: currentWeek
        });
        
        if (isSupabaseReady && supabase && client.id) {
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          

          
          if (cRow?.id) {
            const { data: assignment, error: assignmentError } = await supabase
              .from('workout_assignments')
              .select('*')
              .eq('client_id', cRow.id)
              .eq('is_active', true)
              .order('last_modified_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            console.log('🔄 CLIENT SYNC DEBUG - Assignment query result:', {
              assignment,
              assignmentError,
              hasProgramJson: !!assignment?.program_json,
              programJson: assignment?.program_json,
              currentWeek: assignment?.current_week,
              lastModifiedAt: assignment?.last_modified_at
            });
            
            if (assignmentError) {
              console.error('❌ CLIENT SYNC ERROR - Assignment query failed:', assignmentError);
              return;
            }
            
            if (assignment?.program_json) {



              
              const freshWeeks = assignment.program_json.weeks || [];

              
              if (freshWeeks.length > 0) {
                // Removed unlockedWeeks logic - using simplified currentWeek only
                
                // Simple: Use the current_week field directly from the assignment
                const newCurrentWeek = assignment.current_week || 1;
                console.log('🔄 CLIENT SYNC DEBUG - Raw assignment data:', {
                  current_week: assignment.current_week,
                  program_json_weeks: assignment.program_json.weeks,
                  last_modified_at: assignment.last_modified_at
                });


                
                if (newCurrentWeek !== currentWeek) {

                  setCurrentWeek(newCurrentWeek);
                } else {

                }
              } else {

              }
            } else {

            }
          } else {

          }
        } else {
          console.log('⚠️ CLIENT SYNC - Missing requirements:', {
            isSupabaseReady,
            hasSupabase: !!supabase,
            clientId: client.id
          });
        }
      } catch (error) {
        console.error('❌ CLIENT SYNC ERROR - Error refreshing workout assignment:', error);
      }
    }, 1000); // Check every 1 second for faster sync

    return () => clearInterval(interval);
  }, [client.id, client.name, currentWeek]);

  const getWeekStatus = (weekNumber: number): 'locked' | 'active' | 'completed' => {
    if (!client.workoutAssignment?.weeks) return 'locked';
    
    const week = client.workoutAssignment.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return 'locked';
    
    return WeekProgressionManager.getWeekStatus(week);
  };

  // Dynamic progress calculation based on current week
  const completedWeeks = Math.max(0, currentWeek - 1); // Weeks before current week are considered completed
  const progressPercentage = Math.round((currentWeek / (client.numberOfWeeks || 12)) * 100);

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gray-800 backdrop-blur-xl border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Welcome back, {client.name.split(' ')[0]}!
                  </h1>
                  <p className="text-purple-300/80 text-sm md:text-lg">Ready to crush your goals? 🔥</p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{currentWeek}</div>
                <div className="text-purple-300 text-sm">Current Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{completedWeeks}</div>
                <div className="text-purple-300 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{progressPercentage}%</div>
                <div className="text-purple-300 text-sm">Progress</div>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1 bg-purple-600/20 hover:bg-purple-600/30 rounded-lg text-purple-300 text-sm transition-colors"
              >
                🔄 Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Motivation Quote */}
      {showMotivationQuote && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{todayQuote.emoji}</div>
                <div>
                  <p className="text-xl font-semibold text-white mb-1">{todayQuote.text}</p>
                  <p className="text-purple-300/80">Daily Motivation</p>
                </div>
              </div>
              <button
                onClick={() => setShowMotivationQuote(false)}
                className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all duration-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Ring */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Journey</h2>
              <p className="text-purple-300/80">Week {currentWeek} of {client.numberOfWeeks}</p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-700"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${progressPercentage * 3.14} 314`}
                  className="text-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{
                    stroke: `url(#gradient-${progressPercentage})`
                  }}
                />
                <defs>
                  <linearGradient id={`gradient-${progressPercentage}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{progressPercentage}%</div>
                  <div className="text-purple-300 text-xs">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Weekly Progress</span>
              <span className="text-purple-300 text-sm">Week {currentWeek} of {client.numberOfWeeks}</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-slate-700/50 p-1 sm:p-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
            {[
              { id: 'workout', label: 'Workouts', shortLabel: 'Workouts', icon: Dumbbell, gradient: 'from-red-500 to-orange-500' },
              { id: 'nutrition', label: 'Nutrition', shortLabel: 'Nutrition', icon: Utensils, gradient: 'from-green-500 to-emerald-500' },
              { id: 'progress', label: 'Progress', shortLabel: 'Progress', icon: TrendingUp, gradient: 'from-blue-500 to-purple-500' },
              { id: 'weight', label: 'Weight', shortLabel: 'Weight', icon: Scale, gradient: 'from-purple-500 to-pink-500' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative overflow-hidden rounded-lg sm:rounded-xl p-3 sm:p-4 lg:p-6 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r ' + tab.gradient + ' shadow-2xl transform scale-105'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50'
                }`}
              >
                <div className="flex flex-col items-center space-y-2 sm:space-y-3">
                  <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl ${
                    activeTab === tab.id 
                      ? 'bg-white/20' 
                      : 'bg-slate-700/50'
                  }`}>
                    <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 ${
                      activeTab === tab.id ? 'text-white' : 'text-slate-400'
                    }`} />
                  </div>
                  <span className={`font-medium text-xs sm:text-sm lg:text-base ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-300'
                  }`}>
                    <span className="hidden sm:block">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </span>
                </div>
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/50 to-white/20"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
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
            isDark={isDark}
          />
        ) : activeTab === 'progress' ? (
          <div className="h-full">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => setActiveTab('nutrition')}
                className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Nutrition</span>
              </button>
            </div>
            <IndependentMuscleGroupCharts client={client} isDark={isDark} />
          </div>
        ) : (
          <UltraModernWeeklyWeightLogger
            client={client}
            currentWeek={currentWeek}
            maxWeeks={client.numberOfWeeks}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};

export default ModernClientInterface;
