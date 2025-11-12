import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
import {
  Utensils,
  Dumbbell,
  TrendingUp,
  Scale,
  ArrowLeft,
  Camera,
  BarChart3,
  Crown,
  Pill
} from 'lucide-react';
import { Client, NutritionPlan } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { WeekProgressionManager } from '../utils/weekProgressionManager';
import { ErrorBoundary } from './ErrorBoundary';
import { useToast } from '../contexts/ToastContext';
import { useSwipeGesture } from '../hooks/useSwipeGesture';
import { 
  WorkoutDaySkeleton, 
  NutritionPlanSkeleton, 
  WeightChartSkeleton,
  PhotoGridSkeleton,
  AnalyticsSkeleton
} from './LoadingSkeletons';

// Lazy load heavy components
const ClientNutritionView = lazy(() => import('./ClientNutritionView').then(module => ({ default: module.ClientNutritionView })));
const UltraModernNutritionView = lazy(() => import('./UltraModernNutritionView').then(module => ({ default: module.default })));
const SimpleNutritionView = lazy(() => import('./SimpleNutritionView').then(module => ({ default: module.default })));
const ClientWorkoutView = lazy(() => import('./ClientWorkoutView').then(module => ({ default: module.ClientWorkoutView })));
const UltraModernWeeklyWeightLogger = lazy(() => import('./UltraModernWeeklyWeightLogger').then(module => ({ default: module.UltraModernWeeklyWeightLogger })));
const IndependentMuscleGroupCharts = lazy(() => import('./IndependentMuscleGroupCharts').then(module => ({ default: module.IndependentMuscleGroupCharts })));
const WeeklyPhotoUpload = lazy(() => import('./WeeklyPhotoUpload').then(module => ({ default: module.default })));
const PerformanceAnalytics = lazy(() => import('./PerformanceAnalytics').then(module => ({ default: module.PerformanceAnalytics })));
const ClientSupplementsView = lazy(() => import('./ClientSupplementsView').then(module => ({ default: module.ClientSupplementsView })));

interface ModernClientInterfaceProps {
  client: Client;
  isDark: boolean;
}

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
  </div>
);

export const ModernClientInterface: React.FC<ModernClientInterfaceProps> = ({
  client,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'supplements' | 'workout' | 'progress' | 'weight' | 'photos' | 'performance'>('workout');
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    return client.workoutAssignment?.currentWeek || 1;
  });
  
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [weeklyPhotos, setWeeklyPhotos] = useState<any[]>([]);
  const [showMotivationQuote, setShowMotivationQuote] = useState(true);
  const [databaseClientId, setDatabaseClientId] = useState<string | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  
  const toast = useToast();

  // Memoize motivational quotes
  const motivationQuotes = useMemo(() => [
    { text: "Your only limit is you", emoji: "🔥" },
    { text: "Push yourself, because no one else will", emoji: "💪" },
    { text: "Great things never come from comfort zones", emoji: "⚡" },
    { text: "Don't stop when you're tired, stop when you're done", emoji: "🎯" },
    { text: "The pain you feel today will be the strength you feel tomorrow", emoji: "🏆" }
  ], []);

  const todayQuote = useMemo(() => 
    motivationQuotes[new Date().getDay() % motivationQuotes.length], 
    [motivationQuotes]
  );

  // Memoize event handlers with loading and toast
  const handleTabChange = useCallback(async (tabId: string) => {
    setIsLoadingTab(true);
    setActiveTab(tabId as any);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoadingTab(false);
    
    const tabNames: Record<string, string> = {
      nutrition: 'Nutrition Plan',
      supplements: 'Supplements & Hydration',
      workout: 'Workout Program',
      progress: 'Progress Tracking',
      weight: 'Weight Journal',
      photos: 'Progress Photos',
      performance: 'Performance Analytics'
    };
    
    toast.info(`Switched to ${tabNames[tabId] || tabId}`);
  }, [toast]);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleDismissQuote = useCallback(() => {
    setShowMotivationQuote(false);
  }, []);

  const handleBackToNutrition = useCallback(() => {
    setActiveTab('nutrition');
  }, []);

  // Resolve database client UUID from client name
  useEffect(() => {
    const resolveClientId = async () => {
      try {
        if (isSupabaseReady && supabase) {
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          
          if (cRow?.id) {
            setDatabaseClientId(cRow.id);
          }
        }
      } catch (error) {
        console.error('❌ Failed to resolve client ID:', error);
      }
    };

    resolveClientId();
  }, [client.name]);

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
      if (!supabase) return;
      
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
      if (supabase) {
        supabase.removeChannel(channel);
      }
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
          try {
            const { data: cRow } = await supabase
              .from('clients')
              .select('id')
              .eq('full_name', client.name)
              .maybeSingle();
            

            
            if (cRow?.id) {
              // Retry logic for workout assignments query
              let assignment = null;
              let assignmentError = null;
              let retries = 3;
              
              while (retries > 0) {
                try {
                  const result = await supabase
                    .from('workout_assignments')
                    .select('*')
                    .eq('client_id', cRow.id)
                    .eq('is_active', true)
                    .order('last_modified_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();
                  
                  assignment = result.data;
                  assignmentError = result.error;
                  
                  // If successful, break the retry loop
                  if (!assignmentError || assignmentError.code !== '') {
                    break;
                  }
                } catch (fetchError) {
                  console.warn(`⚠️ Network error, retrying... (${retries} attempts left)`, fetchError);
                  retries--;
                  if (retries > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1s before retry
                  } else {
                    assignmentError = { message: 'Network error after retries', details: String(fetchError), hint: '', code: 'NETWORK_ERROR' };
                  }
                }
              }
              
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
                // Don't return - continue with local data
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
          } catch (networkError) {
            console.error('❌ NETWORK ERROR - Failed to fetch workout assignment:', networkError);
            // Continue with local data if network fails
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Background Effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-slate-800/95 backdrop-blur-xl border-b border-slate-700/50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl flex items-center justify-center shadow-2xl">
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-xl md:text-3xl font-bold text-white">
                    Welcome back, {client.name.split(' ')[0]}!
                  </h1>
                  <p className="text-purple-300 text-sm md:text-lg font-medium">Ready to crush your goals? 🔥</p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{currentWeek}</div>
                <div className="text-purple-300 text-sm font-medium">Current Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{completedWeeks}</div>
                <div className="text-purple-300 text-sm font-medium">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{progressPercentage}%</div>
                <div className="text-purple-300 text-sm font-medium">Progress</div>
              </div>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-sm font-semibold transition-all duration-200"
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
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 shadow-lg relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{todayQuote.emoji}</div>
                <div>
                  <p className="text-xl font-semibold text-white mb-1">{todayQuote.text}</p>
                  <p className="text-purple-300 font-medium">Daily Motivation</p>
                </div>
              </div>
              <button
                onClick={handleDismissQuote}
                className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all duration-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Ring */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-purple-500/20 p-4 sm:p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-8">
            <div className="flex-1">
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">Your Journey</h2>
              <p className="text-purple-300 text-sm sm:text-base font-medium">Week {currentWeek} of {client.numberOfWeeks}</p>
            </div>
            
            {/* Circular Progress - Mobile Optimized */}
            <div className="relative w-16 h-16 sm:w-24 sm:h-24">
              <svg className="w-16 h-16 sm:w-24 sm:h-24 transform -rotate-90" viewBox="0 0 120 120">
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
                  <div className="text-sm sm:text-xl font-bold text-white">{progressPercentage}%</div>
                  <div className="text-purple-300 text-xs hidden sm:block font-medium">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Progress Bar */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-sm sm:text-base">Weekly Progress</span>
              <span className="text-purple-300 text-xs sm:text-sm font-medium">Week {currentWeek} of {client.numberOfWeeks}</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-2 sm:h-3 overflow-hidden">
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

      {/* Modern Horizontal Mobile Navbar */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50 shadow-2xl">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex items-center justify-around py-2 sm:py-3">
            {[
              { 
                id: 'nutrition', 
                label: 'Nutrition', 
                icon: Utensils, 
                gradient: 'from-green-500 to-emerald-500',
                activeColor: 'text-green-400',
                activeBg: 'bg-green-500/20',
                emoji: '🥗'
              },
              { 
                id: 'supplements', 
                label: 'Supplements', 
                icon: Pill, 
                gradient: 'from-purple-500 to-pink-500',
                activeColor: 'text-purple-400',
                activeBg: 'bg-purple-500/20',
                emoji: '💊'
              },
              { 
                id: 'workout', 
                label: 'Workouts', 
                icon: Dumbbell, 
                gradient: 'from-red-500 to-orange-500',
                activeColor: 'text-red-400',
                activeBg: 'bg-red-500/20',
                emoji: '💪'
              },
              { 
                id: 'progress', 
                label: 'Progress', 
                icon: TrendingUp, 
                gradient: 'from-blue-500 to-indigo-500',
                activeColor: 'text-blue-400',
                activeBg: 'bg-blue-500/20',
                emoji: '📊'
              },
              { 
                id: 'performance', 
                label: 'Analytics', 
                icon: BarChart3, 
                gradient: 'from-violet-500 to-fuchsia-500',
                activeColor: 'text-violet-400',
                activeBg: 'bg-violet-500/20',
                emoji: '📈'
              },
              { 
                id: 'weight', 
                label: 'Weight', 
                icon: Scale, 
                gradient: 'from-purple-500 to-pink-500',
                activeColor: 'text-purple-400',
                activeBg: 'bg-purple-500/20',
                emoji: '⚖️'
              },
              { 
                id: 'photos', 
                label: 'Photos', 
                icon: Camera, 
                gradient: 'from-indigo-500 to-cyan-500',
                activeColor: 'text-indigo-400',
                activeBg: 'bg-indigo-500/20',
                emoji: '📸'
              }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`group relative flex flex-col items-center justify-center transition-all duration-300 px-2 sm:px-4 py-2 rounded-xl ${
                  activeTab === tab.id
                    ? `${tab.activeBg} scale-105`
                    : 'hover:bg-slate-800/50'
                }`}
              >
                {/* Icon */}
                <div className={`relative transition-all duration-300 ${
                  activeTab === tab.id ? 'transform scale-110' : ''
                }`}>
                  <tab.icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-all duration-300 ${
                    activeTab === tab.id 
                      ? tab.activeColor 
                      : 'text-slate-400 group-hover:text-slate-300'
                  }`} />
                  
                  {/* Active indicator dot */}
                  {activeTab === tab.id && (
                    <div className={`absolute -top-1 -right-1 w-2 h-2 rounded-full bg-gradient-to-r ${tab.gradient} animate-pulse`} />
                  )}
                </div>
                
                {/* Label - Hidden on small screens, shown on larger */}
                <span className={`text-[10px] sm:text-xs font-bold mt-1 transition-all duration-300 ${
                  activeTab === tab.id 
                    ? tab.activeColor 
                    : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  {tab.label}
                </span>
                
                {/* Active underline */}
                {activeTab === tab.id && (
                  <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 sm:w-12 h-0.5 rounded-full bg-gradient-to-r ${tab.gradient}`} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area with swipe support */}
      <div 
        className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-24 sm:pb-12"
        {...useSwipeGesture({
          onSwipeLeft: () => {
            const tabs = ['nutrition', 'supplements', 'workout', 'progress', 'performance', 'weight', 'photos'];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex < tabs.length - 1) {
              handleTabChange(tabs[currentIndex + 1]);
            }
          },
          onSwipeRight: () => {
            const tabs = ['nutrition', 'supplements', 'workout', 'progress', 'performance', 'weight', 'photos'];
            const currentIndex = tabs.indexOf(activeTab);
            if (currentIndex > 0) {
              handleTabChange(tabs[currentIndex - 1]);
            }
          }
        })}
      >
        <Suspense fallback={
          activeTab === 'nutrition' ? <NutritionPlanSkeleton /> :
          activeTab === 'supplements' ? <NutritionPlanSkeleton /> :
          activeTab === 'workout' ? <WorkoutDaySkeleton /> :
          activeTab === 'weight' ? <WeightChartSkeleton /> :
          activeTab === 'photos' ? <PhotoGridSkeleton /> :
          activeTab === 'performance' ? <AnalyticsSkeleton /> :
          <LoadingSpinner />
        }>
          {activeTab === 'nutrition' ? (
            <ErrorBoundary>
              <ClientNutritionView
                client={client}
                isDark={isDark}
                nutritionPlan={nutritionPlan}
              />
            </ErrorBoundary>
          ) : activeTab === 'supplements' ? (
            <ErrorBoundary>
              <ClientSupplementsView clientId={databaseClientId || client.id} />
            </ErrorBoundary>
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
                  onClick={handleBackToNutrition}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Nutrition</span>
                </button>
              </div>
              <IndependentMuscleGroupCharts client={client} isDark={isDark} />
            </div>
          ) : activeTab === 'performance' ? (
            <PerformanceAnalytics
              clientId={databaseClientId || client.id}
              clientName={client.name}
              isDark={isDark}
              workoutAssignment={client.workoutAssignment}
            />
          ) : activeTab === 'weight' ? (
            <UltraModernWeeklyWeightLogger
              client={client}
              currentWeek={currentWeek}
              maxWeeks={client.numberOfWeeks}
              isDark={isDark}
            />
          ) : activeTab === 'photos' ? (
            <div className="space-y-6">
              {/* Photo Upload for Current Week */}
              <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <Camera className="w-6 h-6 mr-3 text-indigo-400" />
                  Upload Week {currentWeek} Photos
                </h2>
                <WeeklyPhotoUpload
                  clientId={databaseClientId || client.id}
                  currentWeek={currentWeek}
                  maxWeeks={client.numberOfWeeks}
                  onPhotosUpdate={setWeeklyPhotos}
                  existingPhotos={weeklyPhotos}
                />
              </div>
            </div>
          ) : null}
        </Suspense>
      </div>

      {/* Mobile Bottom Navigation - Fixed at bottom */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-slate-900/95 backdrop-blur-2xl border-t border-slate-700/50 safe-area-bottom">
        <div className="flex items-center justify-around px-2 py-3">
          {[
            { 
              id: 'nutrition', 
              label: 'Nutrition', 
              icon: Utensils, 
              color: 'text-green-400',
              activeBg: 'bg-green-500/20'
            },
            { 
              id: 'supplements', 
              label: 'Supps', 
              icon: Pill, 
              color: 'text-purple-400',
              activeBg: 'bg-purple-500/20'
            },
            { 
              id: 'workout', 
              label: 'Workout', 
              icon: Dumbbell, 
              color: 'text-red-400',
              activeBg: 'bg-red-500/20'
            },
            { 
              id: 'progress', 
              label: 'Progress', 
              icon: TrendingUp, 
              color: 'text-blue-400',
              activeBg: 'bg-blue-500/20'
            },
            { 
              id: 'weight', 
              label: 'Weight', 
              icon: Scale, 
              color: 'text-pink-400',
              activeBg: 'bg-pink-500/20'
            },
            { 
              id: 'photos', 
              label: 'Photos', 
              icon: Camera, 
              color: 'text-indigo-400',
              activeBg: 'bg-indigo-500/20'
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all duration-300 ${
                activeTab === tab.id
                  ? `${tab.activeBg} scale-110`
                  : 'active:scale-95'
              }`}
            >
              <tab.icon className={`w-6 h-6 mb-1 transition-all duration-300 ${
                activeTab === tab.id 
                  ? `${tab.color} drop-shadow-lg`
                  : 'text-slate-400'
              }`} />
              <span className={`text-[9px] font-bold transition-all duration-300 ${
                activeTab === tab.id 
                  ? tab.color
                  : 'text-slate-500'
              }`}>
                {tab.label}
              </span>
              {activeTab === tab.id && (
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full ${tab.activeBg} opacity-50`} />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ModernClientInterface;
