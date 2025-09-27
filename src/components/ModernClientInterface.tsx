import React, { useState, useEffect, useMemo, useCallback, Suspense, lazy } from 'react';
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
  ArrowLeft,
  Camera
} from 'lucide-react';
import { Client, NutritionPlan } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { WeekProgressionManager } from '../utils/weekProgressionManager';

// Lazy load heavy components
const ClientNutritionView = lazy(() => import('./ClientNutritionView').then(module => ({ default: module.ClientNutritionView })));
const ClientWorkoutView = lazy(() => import('./ClientWorkoutView').then(module => ({ default: module.ClientWorkoutView })));
const UltraModernWeeklyWeightLogger = lazy(() => import('./UltraModernWeeklyWeightLogger').then(module => ({ default: module.UltraModernWeeklyWeightLogger })));
const IndependentMuscleGroupCharts = lazy(() => import('./IndependentMuscleGroupCharts').then(module => ({ default: module.IndependentMuscleGroupCharts })));
const WeeklyPhotoUpload = lazy(() => import('./WeeklyPhotoUpload').then(module => ({ default: module.default })));
const WeeklyPhotoGallery = lazy(() => import('./WeeklyPhotoGallery').then(module => ({ default: module.default })));

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
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'progress' | 'weight' | 'photos'>('workout');
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    return client.workoutAssignment?.currentWeek || 1;
  });
  
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [weeklyPhotos, setWeeklyPhotos] = useState<any[]>([]);
  const [showMotivationQuote, setShowMotivationQuote] = useState(true);

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

  // Memoize event handlers
  const handleTabChange = useCallback((tabId: string) => {
    setActiveTab(tabId as any);
  }, []);

  const handleRefresh = useCallback(() => {
    window.location.reload();
  }, []);

  const handleDismissQuote = useCallback(() => {
    setShowMotivationQuote(false);
  }, []);

  const handleBackToNutrition = useCallback(() => {
    setActiveTab('nutrition');
  }, []);

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
                onClick={handleRefresh}
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
              <p className="text-purple-300/80 text-sm sm:text-base">Week {currentWeek} of {client.numberOfWeeks}</p>
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
                  <div className="text-purple-300 text-xs hidden sm:block">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Progress Bar - Mobile Optimized */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium text-sm sm:text-base">Weekly Progress</span>
              <span className="text-purple-300 text-xs sm:text-sm">Week {currentWeek} of {client.numberOfWeeks}</span>
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

      {/* Enhanced Navigation Tabs */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 py-6 sm:py-8">
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">Choose Your Focus</h2>
          <p className="text-slate-400 text-xs sm:text-sm lg:text-base hidden sm:block">Select what you'd like to work on today</p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { 
              id: 'workout', 
              label: 'Workouts', 
              shortLabel: 'Workouts', 
              icon: Dumbbell, 
              gradient: 'from-red-500 via-red-600 to-orange-500',
              bgGradient: 'from-red-500/10 via-red-600/5 to-orange-500/10',
              description: 'Track your exercises',
              emoji: '💪'
            },
            { 
              id: 'nutrition', 
              label: 'Nutrition', 
              shortLabel: 'Nutrition', 
              icon: Utensils, 
              gradient: 'from-green-500 via-emerald-500 to-teal-500',
              bgGradient: 'from-green-500/10 via-emerald-500/5 to-teal-500/10',
              description: 'Manage your meals',
              emoji: '🥗'
            },
            { 
              id: 'progress', 
              label: 'Progress', 
              shortLabel: 'Progress', 
              icon: TrendingUp, 
              gradient: 'from-blue-500 via-indigo-500 to-purple-500',
              bgGradient: 'from-blue-500/10 via-indigo-500/5 to-purple-500/10',
              description: 'View your charts',
              emoji: '📊'
            },
            { 
              id: 'weight', 
              label: 'Weight', 
              shortLabel: 'Weight', 
              icon: Scale, 
              gradient: 'from-purple-500 via-pink-500 to-rose-500',
              bgGradient: 'from-purple-500/10 via-pink-500/5 to-rose-500/10',
              description: 'Log your weight',
              emoji: '⚖️'
            },
            { 
              id: 'photos', 
              label: 'Photos', 
              shortLabel: 'Photos', 
              icon: Camera, 
              gradient: 'from-indigo-500 via-cyan-500 to-blue-500',
              bgGradient: 'from-indigo-500/10 via-cyan-500/5 to-blue-500/10',
              description: 'Track your progress',
              emoji: '📸'
            }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`group relative overflow-hidden rounded-xl sm:rounded-2xl p-3 sm:p-4 lg:p-6 transition-all duration-300 transform hover:scale-105 ${
                activeTab === tab.id
                  ? `bg-gradient-to-br ${tab.gradient} shadow-lg shadow-${tab.id === 'workout' ? 'red' : tab.id === 'nutrition' ? 'green' : tab.id === 'progress' ? 'blue' : tab.id === 'weight' ? 'purple' : 'indigo'}-500/25 scale-105`
                  : `bg-gradient-to-br ${tab.bgGradient} backdrop-blur-sm border border-slate-700/50 hover:border-slate-600/50 hover:shadow-lg`
              }`}
            >
              {/* Background Pattern - Simplified for mobile */}
              <div className="absolute inset-0 opacity-5 sm:opacity-10">
                <div className="absolute top-0 right-0 w-16 h-16 sm:w-24 sm:h-24 bg-white/10 rounded-full -translate-y-8 translate-x-8 sm:-translate-y-12 sm:translate-x-12"></div>
              </div>
              
              {/* Content - Compact for mobile */}
              <div className="relative z-10 flex flex-col items-center space-y-2 sm:space-y-3">
                {/* Icon Container - Smaller on mobile */}
                <div className={`relative p-2 sm:p-3 lg:p-4 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id 
                    ? 'bg-white/20 backdrop-blur-sm shadow-lg' 
                    : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                }`}>
                  <tab.icon className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 transition-all duration-300 ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-400 group-hover:text-white'
                  }`} />
                  
                  {/* Emoji Overlay - Smaller on mobile */}
                  <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 text-lg sm:text-2xl opacity-80">
                    {tab.emoji}
                  </div>
                </div>
                
                {/* Label - Compact text for mobile */}
                <div className="text-center">
                  <h3 className={`font-bold text-sm sm:text-base lg:text-lg transition-all duration-300 ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-200 group-hover:text-white'
                  }`}>
                    <span className="hidden sm:block">{tab.label}</span>
                    <span className="sm:hidden">{tab.shortLabel}</span>
                  </h3>
                  <p className={`text-xs sm:text-sm transition-all duration-300 mt-1 hidden sm:block ${
                    activeTab === tab.id ? 'text-white/80' : 'text-slate-400 group-hover:text-slate-300'
                  }`}>
                    {tab.description}
                  </p>
                </div>
              </div>
              
              {/* Active Indicator - Thinner for mobile */}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 sm:h-1 bg-gradient-to-r from-white/60 via-white/40 to-white/60 rounded-b-xl sm:rounded-b-2xl"></div>
              )}
              
              {/* Hover Effect - Subtle for mobile */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl"></div>
            </button>
          ))}
        </div>
        
        {/* Progress Indicator - Compact for mobile */}
        <div className="mt-4 sm:mt-6 lg:mt-8 flex justify-center">
          <div className="flex space-x-1 sm:space-x-2">
            {[
              { id: 'workout', color: 'bg-red-500' },
              { id: 'nutrition', color: 'bg-green-500' },
              { id: 'progress', color: 'bg-blue-500' },
              { id: 'weight', color: 'bg-purple-500' },
              { id: 'photos', color: 'bg-indigo-500' }
            ].map((tab) => (
              <div
                key={tab.id}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                  activeTab === tab.id ? `${tab.color} w-6 sm:w-8` : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-8 sm:pb-12">
        <Suspense fallback={<LoadingSpinner />}>
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
                  onClick={handleBackToNutrition}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back to Nutrition</span>
                </button>
              </div>
              <IndependentMuscleGroupCharts client={client} isDark={isDark} />
            </div>
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
                  clientId={client.id}
                  currentWeek={currentWeek}
                  maxWeeks={client.numberOfWeeks}
                  onPhotosUpdate={setWeeklyPhotos}
                  existingPhotos={weeklyPhotos}
                />
              </div>

              {/* Photo Gallery */}
              {weeklyPhotos.length > 0 && (
                <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
                  <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                    <Camera className="w-6 h-6 mr-3 text-cyan-400" />
                    Your Progress Gallery
                  </h2>
                  <WeeklyPhotoGallery
                    photos={weeklyPhotos}
                    onPhotosUpdate={setWeeklyPhotos}
                    isCoachView={false}
                  />
                </div>
              )}
            </div>
          ) : null}
        </Suspense>
      </div>
    </div>
  );
};

export default ModernClientInterface;
