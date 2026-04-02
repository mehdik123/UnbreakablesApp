import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import {
  Utensils,
  Dumbbell,
  TrendingUp,
  Scale,
  ArrowLeft,
  Camera,
  BarChart3,
  Crown,
  Pill,
  Languages
} from 'lucide-react';
import { Client, ClientWorkoutAssignment, NutritionPlan } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { enrichProgramAndWeeksWithExercises } from '../utils/enrichAssignment';
import { WeekProgressionManager } from '../utils/weekProgressionManager';
import { ErrorBoundary } from './ErrorBoundary';
import { useToast } from '../contexts/ToastContext';
import { useClientLocale } from '../contexts/ClientLocaleContext';
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
  /** After client picks a week, ignore DB/prop sync briefly so polling does not snap back before `current_week` persists */
  const weekSyncLockUntilRef = useRef(0);
  const handleClientWeekChange = useCallback((week: number) => {
    setCurrentWeek(week);
    weekSyncLockUntilRef.current = Date.now() + 8000;
  }, []);
  // Latest assignment (from save or sync) so Progress charts and Performance see client edits
  const [effectiveWorkoutAssignment, setEffectiveWorkoutAssignment] = useState(client.workoutAssignment ?? undefined);
  
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [weeklyPhotos, setWeeklyPhotos] = useState<any[]>([]);
  const [showMotivationQuote, setShowMotivationQuote] = useState(true);
  const [databaseClientId, setDatabaseClientId] = useState<string | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  
  const toast = useToast();
  const { locale, setLocale, t, isRtl } = useClientLocale();

  const todayQuote = useMemo(() => {
    const i = new Date().getDay() % 5;
    return t(`motivation.${i}`);
  }, [t, locale]);

  // Keep effective assignment in sync with prop and with sync fetch
  useEffect(() => {
    setEffectiveWorkoutAssignment(client.workoutAssignment ?? undefined);
  }, [client.workoutAssignment]);

  // Memoize event handlers with loading and toast
  const handleTabChange = useCallback(async (tabId: string) => {
    setIsLoadingTab(true);
    setActiveTab(tabId as any);
    
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 300));
    setIsLoadingTab(false);
    
    const tabLabelKeys: Record<string, string> = {
      nutrition: 'nav.nutrition',
      supplements: 'nav.supplements',
      workout: 'nav.workouts',
      progress: 'nav.progress',
      weight: 'nav.weight',
      photos: 'nav.photos',
      performance: 'nav.analytics',
    };
    const label = t(tabLabelKeys[tabId] || tabId);
    toast.info(t('toast.switched', { tab: label }));
  }, [toast, t]);

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
  }, [client.id, client.nutritionPlan]);

  // When parent passes an updated active week (e.g. coach changed it), apply unless client just picked a week
  useEffect(() => {
    const w = client.workoutAssignment?.currentWeek;
    if (w == null || w < 1) return;
    if (Date.now() < weekSyncLockUntilRef.current) return;
    setCurrentWeek(w);
  }, [client.workoutAssignment?.currentWeek]);

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
            .select('current_week, last_modified_by')
            .eq('client_id', cRow.id)
            .eq('is_active', true)
            .order('last_modified_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (assignment?.current_week && assignment.current_week !== currentWeek) {
            if (assignment.last_modified_by === 'coach') {
              weekSyncLockUntilRef.current = 0;
            }
            if (Date.now() >= weekSyncLockUntilRef.current) {
              setCurrentWeek(assignment.current_week);
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
            if (payload.new.last_modified_by === 'coach') {
              weekSyncLockUntilRef.current = 0;
            }
            if (Date.now() >= weekSyncLockUntilRef.current) {
              setCurrentWeek(payload.new.current_week);
            }
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
              const raw = assignment.program_json as any;
              const { program: enrichedProgram, weeks: enrichedWeeks } = await enrichProgramAndWeeksWithExercises(supabase, raw);
              const base = client.workoutAssignment;
              const freshAssignment: ClientWorkoutAssignment = {
                id: base?.id ?? '',
                clientId: base?.clientId ?? client.id,
                clientName: base?.clientName ?? client.name,
                startDate: base?.startDate ?? new Date(),
                duration: base?.duration ?? 12,
                currentWeek: assignment.current_week ?? base?.currentWeek ?? 1,
                currentDay: base?.currentDay ?? 0,
                weeks: enrichedWeeks.length ? enrichedWeeks : (raw.weeks || []),
                progressionRules: base?.progressionRules ?? [],
                isActive: base?.isActive ?? true,
                program: enrichedProgram?.days?.length ? enrichedProgram : (raw.program || raw),
                lastModifiedBy: raw.lastModifiedBy,
                lastModifiedAt: raw.lastModifiedAt ? new Date(raw.lastModifiedAt) : undefined,
              };
              setEffectiveWorkoutAssignment(freshAssignment);
              const freshWeeks = raw.weeks || [];
              if (freshWeeks.length > 0) {
                if (assignment.last_modified_by === 'coach') {
                  weekSyncLockUntilRef.current = 0;
                }
                if (Date.now() >= weekSyncLockUntilRef.current) {
                  const deployedWeekNumbers = freshWeeks.map((w: any) => w.weekNumber);
                  const rawWeek = assignment.current_week || 1;
                  const newCurrentWeek = deployedWeekNumbers.includes(rawWeek)
                    ? rawWeek
                    : Math.min(rawWeek, Math.max(...deployedWeekNumbers)) || deployedWeekNumbers[0];
                  if (newCurrentWeek !== currentWeek) setCurrentWeek(newCurrentWeek);
                }
              }
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

  const assignmentForWeeks = effectiveWorkoutAssignment ?? client.workoutAssignment;
  const clientForCharts = useMemo(
    () => ({ ...client, workoutAssignment: effectiveWorkoutAssignment ?? client.workoutAssignment }),
    [client, effectiveWorkoutAssignment, client.workoutAssignment]
  );
  const getWeekStatus = (weekNumber: number): 'locked' | 'active' | 'completed' => {
    if (!assignmentForWeeks?.weeks) return 'locked';
    
    const week = assignmentForWeeks.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return 'locked';
    
    return WeekProgressionManager.getWeekStatus(week);
  };

  // Dynamic progress calculation based on current week
  const completedWeeks = Math.max(0, currentWeek - 1); // Weeks before current week are considered completed
  const progressPercentage = Math.round((currentWeek / (client.numberOfWeeks || 12)) * 100);

  const desktopNavTabs = useMemo(
    () =>
      [
        {
          id: 'nutrition',
          labelKey: 'nav.nutrition',
          icon: Utensils,
          gradient: 'from-green-500 to-emerald-500',
          activeColor: 'text-green-400',
          activeBg: 'bg-green-500/20',
          emoji: '🥗',
        },
        {
          id: 'supplements',
          labelKey: 'nav.supplements',
          icon: Pill,
          gradient: 'from-purple-500 to-pink-500',
          activeColor: 'text-purple-400',
          activeBg: 'bg-purple-500/20',
          emoji: '💊',
        },
        {
          id: 'workout',
          labelKey: 'nav.workouts',
          icon: Dumbbell,
          gradient: 'from-red-500 to-orange-500',
          activeColor: 'text-red-400',
          activeBg: 'bg-red-500/20',
          emoji: '💪',
        },
        {
          id: 'progress',
          labelKey: 'nav.progress',
          icon: TrendingUp,
          gradient: 'from-blue-500 to-indigo-500',
          activeColor: 'text-blue-400',
          activeBg: 'bg-blue-500/20',
          emoji: '📊',
        },
        {
          id: 'performance',
          labelKey: 'nav.analytics',
          icon: BarChart3,
          gradient: 'from-violet-500 to-fuchsia-500',
          activeColor: 'text-violet-400',
          activeBg: 'bg-violet-500/20',
          emoji: '📈',
        },
        {
          id: 'weight',
          labelKey: 'nav.weight',
          icon: Scale,
          gradient: 'from-purple-500 to-pink-500',
          activeColor: 'text-purple-400',
          activeBg: 'bg-purple-500/20',
          emoji: '⚖️',
        },
        {
          id: 'photos',
          labelKey: 'nav.photos',
          icon: Camera,
          gradient: 'from-indigo-500 to-cyan-500',
          activeColor: 'text-indigo-400',
          activeBg: 'bg-indigo-500/20',
          emoji: '📸',
        },
      ] as const,
    [t, locale]
  );

  const mobileNavTabs = useMemo(
    () =>
      [
        { id: 'nutrition', labelKey: 'nav.nutrition', icon: Utensils, color: 'text-green-400', activeBg: 'bg-green-500/20' },
        { id: 'supplements', labelKey: 'nav.supps', icon: Pill, color: 'text-purple-400', activeBg: 'bg-purple-500/20' },
        { id: 'workout', labelKey: 'nav.workout', icon: Dumbbell, color: 'text-red-400', activeBg: 'bg-red-500/20' },
        { id: 'progress', labelKey: 'nav.progress', icon: TrendingUp, color: 'text-blue-400', activeBg: 'bg-blue-500/20' },
        { id: 'weight', labelKey: 'nav.weight', icon: Scale, color: 'text-pink-400', activeBg: 'bg-pink-500/20' },
        { id: 'photos', labelKey: 'nav.photos', icon: Camera, color: 'text-indigo-400', activeBg: 'bg-indigo-500/20' },
      ] as const,
    [t, locale]
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
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
                    {t('modern.welcomeBack', { name: client.name.split(' ')[0] })}
                  </h1>
                  <p className="text-purple-300 text-sm md:text-lg font-medium">{t('modern.readyCrush')}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{currentWeek}</div>
                <div className="text-purple-300 text-sm font-medium">{t('modern.currentWeek')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{completedWeeks}</div>
                <div className="text-purple-300 text-sm font-medium">{t('modern.completed')}</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{progressPercentage}%</div>
                <div className="text-purple-300 text-sm font-medium">{t('modern.progress')}</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-xl bg-slate-700/50 border border-slate-600/50 p-1">
                  <Languages className="w-4 h-4 text-purple-300 shrink-0 ml-1" aria-hidden />
                  <button
                    type="button"
                    onClick={() => setLocale('en')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      locale === 'en' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('modern.langEnglish')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocale('ar')}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold transition-colors ${
                      locale === 'ar' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {t('modern.langArabic')}
                  </button>
                </div>
                <button
                  onClick={handleRefresh}
                  className="px-4 py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 rounded-xl text-sm font-semibold transition-all duration-200"
                >
                  {t('modern.refresh')}
                </button>
              </div>
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
                <div>
                  <p className="text-xl font-semibold text-white mb-1">{todayQuote}</p>
                  <p className="text-purple-300 font-medium">{t('modern.dailyMotivation')}</p>
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
              <h2 className="text-lg sm:text-2xl font-bold text-white mb-1 sm:mb-2">{t('modern.yourJourney')}</h2>
              <p className="text-purple-300 text-sm sm:text-base font-medium">
                {t('modern.weekOf', { current: currentWeek, total: client.numberOfWeeks || 12 })}
              </p>
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
                  <div className="text-purple-300 text-xs hidden sm:block font-medium">{t('modern.complete')}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Progress Bar */}
          <div className="space-y-3 sm:space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-semibold text-sm sm:text-base">{t('modern.weeklyProgress')}</span>
              <span className="text-purple-300 text-xs sm:text-sm font-medium">
                {t('modern.weekOf', { current: currentWeek, total: client.numberOfWeeks || 12 })}
              </span>
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
          <div className="flex md:hidden items-center justify-end gap-2 py-2 border-b border-slate-700/40">
            <span className="text-[10px] text-slate-500 uppercase tracking-wide">{t('modern.language')}</span>
            <button
              type="button"
              onClick={() => setLocale('en')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${locale === 'en' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLocale('ar')}
              className={`px-2 py-1 rounded-lg text-xs font-semibold ${locale === 'ar' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
            >
              عربي
            </button>
          </div>
          <div className="flex items-center justify-around py-2 sm:py-3">
            {desktopNavTabs.map((tab) => (
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
                  {t(tab.labelKey)}
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
              onWeekChange={handleClientWeekChange}
              onAssignmentUpdated={(a) => {
                // Use saved assignment directly so Progress charts and coach view see client's volume edits
                if (a?.weeks != null && a?.program != null) {
                  setEffectiveWorkoutAssignment(a as ClientWorkoutAssignment);
                }
              }}
            />
          ) : activeTab === 'progress' ? (
            <div className="h-full">
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={handleBackToNutrition}
                  className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>{t('progress.backToNutrition')}</span>
                </button>
              </div>
              <IndependentMuscleGroupCharts client={clientForCharts} isDark={isDark} />
            </div>
          ) : activeTab === 'performance' ? (
            <PerformanceAnalytics
              clientId={databaseClientId || client.id}
              clientName={client.name}
              isDark={isDark}
              workoutAssignment={effectiveWorkoutAssignment ?? client.workoutAssignment}
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
                  {t('photos.uploadWeek', { week: currentWeek })}
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
        <div className="flex items-center justify-around px-2 py-3 relative">
          {mobileNavTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center min-w-[60px] py-2 px-3 rounded-xl transition-all duration-300 ${
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
                {t(tab.labelKey)}
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
