import React, { useState, useEffect, useMemo, useCallback, useRef, Suspense, lazy } from 'react';
import {
  Utensils,
  Dumbbell,
  TrendingUp,
  Scale,
  ArrowLeft,
  Camera,
  BarChart3,
  Pill,
  Sun,
  Moon,
  ChevronRight,
  Activity,
  HelpCircle
} from 'lucide-react';
import { ClientWelcomeTour } from './ClientWelcomeTour';
import { Client, ClientWorkoutAssignment, NutritionPlan } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { enrichProgramAndWeeksWithExercises } from '../utils/enrichAssignment';
import { WeekProgressionManager } from '../utils/weekProgressionManager';
import { getClientWeightLogs, getClientPRHistory } from '../lib/progressTracking';
import { ErrorBoundary } from './ErrorBoundary';
import { useClientLocale } from '../contexts/ClientLocaleContext';
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
  type Route = 'home' | 'progressHub' | 'nutrition' | 'supplements' | 'workout' | 'progress' | 'weight' | 'photos' | 'performance';
  const [route, setRoute] = useState<Route>('home');
  const activeTab = route;
  const SECTION_ROUTES: Route[] = ['nutrition', 'supplements', 'workout', 'progress', 'weight', 'photos', 'performance'];
  const [useDarkTheme, setUseDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('client_interface_theme');
    // Default to dark mode when no preference exists
    if (!saved) return true;
    return saved === 'dark';
  });
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
  // Real progress stats for the dashboard (weight + strength change). Null = not enough data yet.
  const [dashStats, setDashStats] = useState<{ weightDelta: number | null; strengthPct: number | null; strengthLift: string | null }>({
    weightDelta: null,
    strengthPct: null,
    strengthLift: null,
  });
  const [databaseClientId, setDatabaseClientId] = useState<string | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  
  const { locale, setLocale, t, isRtl } = useClientLocale();

  // First-run welcome tour (shown once per client, re-openable via the "?" button)
  const welcomeKey = `ub_welcome_seen_${client.id}`;
  const [showWelcome, setShowWelcome] = useState(false);
  useEffect(() => {
    try {
      if (!localStorage.getItem(welcomeKey)) setShowWelcome(true);
    } catch {
      /* ignore storage errors */
    }
  }, [welcomeKey]);
  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      localStorage.setItem(welcomeKey, '1');
    } catch {
      /* ignore storage errors */
    }
  }, [welcomeKey]);

  useEffect(() => {
    localStorage.setItem('client_interface_theme', useDarkTheme ? 'dark' : 'light');
  }, [useDarkTheme]);

  // Keep effective assignment in sync with prop and with sync fetch
  useEffect(() => {
    setEffectiveWorkoutAssignment(client.workoutAssignment ?? undefined);
  }, [client.workoutAssignment]);

  // Navigate to a section/hub (hub-and-spoke model)
  const navigate = useCallback((target: Route) => {
    setRoute(target);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Back returns to the relevant hub: progress leaves go to the progress hub, everything else to home
  const goBack = useCallback(() => {
    setRoute((prev) => {
      if (prev === 'progressHub') return 'home';
      if (prev === 'progress' || prev === 'performance' || prev === 'weight' || prev === 'photos') return 'progressHub';
      return 'home';
    });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
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

  // Load real progress stats (weight delta + strength change on the client's most-logged compound lift)
  useEffect(() => {
    if (!databaseClientId || !isSupabaseReady || !supabase) return;
    let cancelled = false;
    (async () => {
      try {
        const [weightLogs, prs] = await Promise.all([
          getClientWeightLogs(databaseClientId),
          getClientPRHistory(databaseClientId),
        ]);
        if (cancelled) return;

        // Weight change since the first logged entry
        let weightDelta: number | null = null;
        if (weightLogs.length >= 2) {
          const asc = [...weightLogs].sort((a, b) => a.date.getTime() - b.date.getTime());
          weightDelta = Math.round((asc[asc.length - 1].weight - asc[0].weight) * 10) / 10;
        }

        // Strength change: pick the lift with the most weeks logged, compare earliest vs latest estimated 1RM
        let strengthPct: number | null = null;
        let strengthLift: string | null = null;
        if (prs.length) {
          const byEx = new Map<string, typeof prs>();
          prs.forEach((pr) => {
            const arr = byEx.get(pr.exerciseName) || [];
            arr.push(pr);
            byEx.set(pr.exerciseName, arr);
          });
          let bestEx: string | null = null;
          let bestWeeks = 0;
          let bestMax = 0;
          byEx.forEach((arr, name) => {
            const weeks = new Set(arr.map((p) => p.weekNumber)).size;
            const maxW = Math.max(...arr.map((p) => p.bestSetWeight));
            if (weeks > bestWeeks || (weeks === bestWeeks && maxW > bestMax)) {
              bestWeeks = weeks;
              bestMax = maxW;
              bestEx = name;
            }
          });
          if (bestEx) {
            const arr = (byEx.get(bestEx) || []).slice().sort((a, b) => a.weekNumber - b.weekNumber);
            const e1rm = (w: number, r: number) => w * (1 + r / 30); // Epley
            const first = arr[0];
            const last = arr[arr.length - 1];
            if (arr.length >= 2 && first.bestSetWeight > 0) {
              const f = e1rm(first.bestSetWeight, first.bestSetReps);
              const l = e1rm(last.bestSetWeight, last.bestSetReps);
              strengthPct = Math.round(((l - f) / f) * 100);
            } else {
              strengthPct = 0;
            }
            strengthLift = String(bestEx).replace(/_/g, ' ');
          }
        }

        setDashStats({ weightDelta, strengthPct, strengthLift });
      } catch {
        /* leave stats empty on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [databaseClientId, currentWeek]);

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
  const progressPercentage = Math.round((currentWeek / (client.numberOfWeeks || 12)) * 100);

  // Workout header ring geometry (r=19 → circumference ≈ 119.38)
  const HEADER_RING_C = 2 * Math.PI * 19;
  const programTitle =
    (assignmentForWeeks?.program as any)?.name ||
    (client.workoutAssignment?.program as any)?.name ||
    t('modern.yourProgram');

  const totalWeeks = client.numberOfWeeks || 12;

  // Derive this-week session progress and today's session from the assignment (no extra fetch needed)
  const { sessionsDone, sessionsTotal, todayName, todayExerciseCount } = useMemo(() => {
    const weeks = (effectiveWorkoutAssignment as any)?.weeks || [];
    const weekData = weeks.find((w: any) => w.weekNumber === currentWeek);
    const days: any[] = Array.isArray(weekData?.days) ? weekData.days : [];
    const trainingDays = days.filter((d) => (d.exercises?.length || 0) > 0);
    const isDayDone = (d: any) => d.exercises.every((ex: any) => (ex.sets || []).length > 0 && ex.sets.every((s: any) => s.completed === true));
    const done = trainingDays.filter(isDayDone).length;
    const today = trainingDays.find((d) => !isDayDone(d)) || trainingDays[0];
    return {
      sessionsDone: done,
      sessionsTotal: trainingDays.length,
      todayName: today?.name as string | undefined,
      todayExerciseCount: today?.exercises?.length || 0,
    };
  }, [effectiveWorkoutAssignment, currentWeek]);

  // Quick-stat chips for the dashboard (all real data; show "—" until there's enough)
  const dashChips = [
    {
      Icon: Dumbbell,
      tint: 'var(--red)',
      bg: 'rgba(255,45,85,.14)',
      value: String(sessionsDone),
      unit: `/${sessionsTotal || 0}`,
      label: t('home.statWeek'),
    },
    {
      Icon: Scale,
      tint: 'var(--blue)',
      bg: 'rgba(91,140,255,.14)',
      value: dashStats.weightDelta == null ? '—' : `${dashStats.weightDelta > 0 ? '+' : ''}${dashStats.weightDelta}`,
      unit: dashStats.weightDelta == null ? '' : 'kg',
      label: t('home.statWeight'),
    },
    {
      Icon: TrendingUp,
      tint: 'var(--emerald)',
      bg: 'rgba(52,211,153,.14)',
      value: dashStats.strengthPct == null ? '—' : `${dashStats.strengthPct > 0 ? '+' : ''}${dashStats.strengthPct}`,
      unit: dashStats.strengthPct == null ? '' : '%',
      label: t('home.statStrength'),
    },
  ];

  const progressCardStatus = dashStats.strengthPct != null
    ? t('home.strengthStat', { pct: `${dashStats.strengthPct > 0 ? '+' : ''}${dashStats.strengthPct}` })
    : dashStats.weightDelta != null
    ? `${dashStats.weightDelta > 0 ? '+' : ''}${dashStats.weightDelta} kg`
    : '';

  const homeCards = [
    { route: 'workout' as Route, title: t('nav.workouts'), desc: t('home.workoutDesc'), Icon: Dumbbell, grad: 'from-red-500 to-orange-500', status: t('modern.weekOf', { current: currentWeek, total: totalWeeks }) },
    { route: 'nutrition' as Route, title: t('nav.nutrition'), desc: t('home.nutritionDesc'), Icon: Utensils, grad: 'from-green-500 to-emerald-500', status: nutritionPlan ? t('home.mealsPerDay', { count: nutritionPlan.mealsPerDay }) : t('home.viewPlan') },
    { route: 'supplements' as Route, title: t('nav.supplements'), desc: t('home.supplementsDesc'), Icon: Pill, grad: 'from-purple-500 to-pink-500', status: '' },
    { route: 'progressHub' as Route, title: t('nav.progress'), desc: t('home.progressDesc'), Icon: TrendingUp, grad: 'from-blue-500 to-indigo-500', status: progressCardStatus },
  ];

  const hubCards = [
    { route: 'progress' as Route, title: t('home.chartsTitle'), desc: t('home.chartsDesc'), Icon: Activity, grad: 'from-blue-500 to-indigo-500' },
    { route: 'performance' as Route, title: t('nav.analytics'), desc: t('home.analyticsDesc'), Icon: BarChart3, grad: 'from-violet-500 to-fuchsia-500' },
    { route: 'weight' as Route, title: t('nav.weight'), desc: t('home.weightDesc'), Icon: Scale, grad: 'from-pink-500 to-rose-500' },
    { route: 'photos' as Route, title: t('nav.photos'), desc: t('home.photosDesc'), Icon: Camera, grad: 'from-indigo-500 to-cyan-500' },
  ];

  const sectionTitles: Record<string, string> = {
    workout: t('nav.workouts'),
    nutrition: t('nav.nutrition'),
    supplements: t('nav.supplements'),
    progress: t('home.chartsTitle'),
    performance: t('nav.analytics'),
    weight: t('nav.weight'),
    photos: t('nav.photos'),
  };

  const isSection = SECTION_ROUTES.includes(route);

  const ringStroke = 'var(--hair-strong)';

  // Small reusable header toggles (language + theme)
  const HeaderToggles = (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => setLocale(locale === 'en' ? 'ar' : 'en')}
        className="w-[38px] h-[38px] rounded-xl flex items-center justify-center text-[11px] font-bold transition-transform duration-150 active:scale-90"
        style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
      >
        {locale === 'en' ? 'AR' : 'EN'}
      </button>
      <button
        type="button"
        onClick={() => setUseDarkTheme((prev) => !prev)}
        className="w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-transform duration-150 active:scale-90"
        style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
        aria-label="Toggle theme"
      >
        {useDarkTheme ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button>
    </div>
  );

  const ProgressRing = (
    <div className="relative w-[46px] h-[46px] shrink-0">
      <svg width="46" height="46" className="block -rotate-90">
        <circle cx="23" cy="23" r="19" stroke={ringStroke} strokeWidth="4" fill="none" />
        <circle
          cx="23"
          cy="23"
          r="19"
          stroke="url(#headerRingGrad)"
          strokeWidth="4"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={HEADER_RING_C}
          strokeDashoffset={HEADER_RING_C * (1 - Math.min(100, progressPercentage) / 100)}
          style={{ transition: 'stroke-dashoffset 1s var(--ease)' }}
        />
        <defs>
          <linearGradient id="headerRingGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ff8a5c" />
            <stop offset="1" stopColor="#e11d48" />
          </linearGradient>
        </defs>
      </svg>
      <div
        className="absolute inset-0 flex items-center justify-center font-display font-bold text-[12px] tnum"
        style={{ color: 'var(--txt-hi)' }}
      >
        {progressPercentage}%
      </div>
    </div>
  );

  return (
    <div
      className={`client-mobile-shell min-h-screen ${useDarkTheme ? 'workout-shell' : 'theme-light bg-slate-50'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {showWelcome && (
        <ClientWelcomeTour name={client.name.split(' ')[0] || 'there'} isRtl={isRtl} t={t} onClose={closeWelcome} />
      )}

      {/* ============ HOME DASHBOARD (hub) ============ */}
      {route === 'home' && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
          <div className="flex items-center justify-between pt-5 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-[52px] h-[52px] shrink-0 rounded-2xl p-[2px] bg-grad-coral shadow-red">
                <div
                  className="w-full h-full rounded-[14px] flex items-center justify-center font-display font-bold text-lg"
                  style={{ background: 'var(--surface-2)', color: 'var(--txt-hi)' }}
                >
                  {(client.name.trim().charAt(0) || 'U').toUpperCase()}
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[12px] font-medium" style={{ color: 'var(--txt-mid)' }}>
                  {t('modern.welcomeBackShort')}
                </div>
                <div className="font-display font-semibold text-[20px] leading-tight truncate" style={{ color: 'var(--txt-hi)' }}>
                  {client.name.split(' ')[0]}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowWelcome(true)}
                className="w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-transform duration-150 active:scale-90"
                style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                aria-label={t('home.help')}
                title={t('home.help')}
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              {HeaderToggles}
              {ProgressRing}
            </div>
          </div>

          <p className="text-[13px] mb-4" style={{ color: 'var(--txt-mid)' }}>{t('home.subtitle')}</p>

          {/* Quick stats (real data) */}
          <div className="grid grid-cols-3 gap-2.5 mb-4">
            {dashChips.map((chip, i) => (
              <div
                key={i}
                className="rounded-2xl p-3"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: chip.bg, color: chip.tint }}
                >
                  <chip.Icon className="w-4 h-4" />
                </div>
                <div className="font-display font-bold text-[18px] leading-none" style={{ color: 'var(--txt-hi)' }}>
                  {chip.value}
                  {chip.unit ? (
                    <span className="text-[11px] font-semibold ml-0.5" style={{ color: 'var(--txt-mid)' }}>{chip.unit}</span>
                  ) : null}
                </div>
                <div className="text-[9.5px] uppercase tracking-wider font-semibold mt-1.5" style={{ color: 'var(--txt-lo)' }}>
                  {chip.label}
                </div>
              </div>
            ))}
          </div>

          {/* Today quick-access */}
          <button
            onClick={() => navigate('workout')}
            className="w-full text-left rounded-2xl p-4 mb-4 flex items-center gap-4 transition-transform active:scale-[.98]"
            style={{
              background: 'linear-gradient(135deg, rgba(255,45,85,.16), rgba(255,138,92,.05))',
              border: '1px solid rgba(255,45,85,.22)',
            }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'var(--grad-red)' }}>
              <Dumbbell className="w-6 h-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: 'var(--red)' }}>{t('home.today')}</div>
              <div className="font-display font-semibold text-[16px] truncate" style={{ color: 'var(--txt-hi)' }}>
                {todayName || t('home.continueProgram')}
              </div>
              <div className="text-[12px] truncate" style={{ color: 'var(--txt-mid)' }}>
                {todayExerciseCount > 0 ? `${t('workout.nExercises', { count: todayExerciseCount })} · ` : ''}
                {t('modern.weekOf', { current: currentWeek, total: totalWeeks })}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 shrink-0" style={{ color: 'var(--txt-lo)' }} />
          </button>

          {/* Section cards */}
          <div className="grid grid-cols-2 gap-3">
            {homeCards.map((card) => (
              <button
                key={card.route}
                onClick={() => navigate(card.route)}
                className="text-left rounded-2xl p-4 transition-transform active:scale-95"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${card.grad}`}>
                  <card.Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-display font-semibold text-[15px]" style={{ color: 'var(--txt-hi)' }}>{card.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>{card.desc}</div>
                {card.status ? (
                  <div className="text-[11px] mt-2 font-medium" style={{ color: 'var(--txt-lo)' }}>{card.status}</div>
                ) : null}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ PROGRESS SUB-HUB ============ */}
      {route === 'progressHub' && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
          <div className="flex items-center gap-3 pt-5 pb-3">
            <button
              type="button"
              onClick={goBack}
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
              style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0">
              <div className="font-display font-semibold text-[20px] leading-tight" style={{ color: 'var(--txt-hi)' }}>{t('nav.progress')}</div>
              <div className="text-[12px]" style={{ color: 'var(--txt-mid)' }}>{t('home.progressHubSubtitle')}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {hubCards.map((card) => (
              <button
                key={card.route}
                onClick={() => navigate(card.route)}
                className="text-left rounded-2xl p-4 transition-transform active:scale-95"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 bg-gradient-to-br ${card.grad}`}>
                  <card.Icon className="w-5 h-5 text-white" />
                </div>
                <div className="font-display font-semibold text-[15px]" style={{ color: 'var(--txt-hi)' }}>{card.title}</div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>{card.desc}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ============ SECTION VIEW (spoke) ============ */}
      {isSection && (
      <>
      {/* Compact header */}
      {activeTab === 'workout' ? (
        /* ---- Premium workout header (token-styled, always dark to match the workout page) ---- */
        <div
          className="client-compact-header workout-shell relative z-10 sticky top-0 backdrop-blur-xl"
          style={{ borderBottom: '1px solid var(--hair)' }}
        >
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-3.5">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 active:scale-90 transition-transform"
                  style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                  aria-label="Back to home"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="w-[50px] h-[50px] shrink-0 rounded-md p-[2px] bg-grad-coral shadow-red">
                  <div
                    className="w-full h-full rounded-[14px] flex items-center justify-center font-display font-bold text-lg"
                    style={{ background: 'var(--surface-2)', color: 'var(--txt-hi)' }}
                  >
                    {(client.name.trim().charAt(0) || 'U').toUpperCase()}
                  </div>
                </div>
                <div className="min-w-0">
                  <div className="text-[12px] font-medium" style={{ color: 'var(--txt-mid)' }}>
                    {t('modern.welcomeBackShort')}
                  </div>
                  <div
                    className="font-display font-semibold text-[19px] leading-tight truncate"
                    style={{ color: 'var(--txt-hi)' }}
                  >
                    {client.name.split(' ')[0]}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="relative w-[46px] h-[46px] shrink-0">
                  <svg width="46" height="46" className="block -rotate-90">
                    <circle cx="23" cy="23" r="19" stroke="var(--hair-strong)" strokeWidth="4" fill="none" />
                    <circle
                      cx="23"
                      cy="23"
                      r="19"
                      stroke="url(#headerRingGrad)"
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={HEADER_RING_C}
                      strokeDashoffset={HEADER_RING_C * (1 - Math.min(100, progressPercentage) / 100)}
                      style={{ transition: 'stroke-dashoffset 1s var(--ease)' }}
                    />
                    <defs>
                      <linearGradient id="headerRingGrad" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0" stopColor="#ff8a5c" />
                        <stop offset="1" stopColor="#e11d48" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div
                    className="absolute inset-0 flex items-center justify-center font-display font-bold text-[12px] tnum"
                    style={{ color: 'var(--txt-hi)' }}
                  >
                    {progressPercentage}%
                  </div>
                </div>
              </div>
            </div>

            {/* Program card */}
            <div
              className="mt-3 rounded-md px-4 py-3"
              style={{
                background: 'linear-gradient(135deg, rgba(255,45,85,.13), rgba(255,45,85,.03))',
                border: '1px solid rgba(255,45,85,.18)',
              }}
            >
              <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--txt-hi)' }}>
                {programTitle}
              </div>
              <div className="text-[11.5px] mt-0.5 truncate" style={{ color: 'var(--txt-mid)' }}>
                {t('modern.weekOf', { current: currentWeek, total: client.numberOfWeeks || 12 })} · {t('modern.onTrack')}
              </div>
              <div className="wk-pbar mt-2.5">
                <i style={{ width: `${Math.max(4, Math.min(100, progressPercentage))}%` }} />
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div
          className={`client-compact-header relative z-10 sticky top-0 backdrop-blur-xl ${
            useDarkTheme ? '' : 'bg-white/95 border-b border-slate-200'
          }`}
          style={useDarkTheme ? { background: 'rgba(16,18,24,.92)', borderBottom: '1px solid var(--hair)' } : undefined}
        >
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button
                  type="button"
                  onClick={goBack}
                  className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center active:scale-90 transition-transform"
                  style={useDarkTheme ? { background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' } : { background: '#f1f5f9', color: '#475569' }}
                  aria-label="Back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div className="min-w-0">
                  <h1
                    className="client-compact-title font-display font-semibold truncate"
                    style={{ color: useDarkTheme ? 'var(--txt-hi)' : '#0f172a' }}
                  >
                    {sectionTitles[route]}
                  </h1>
                  <p
                    className="client-compact-subtitle truncate"
                    style={{ color: useDarkTheme ? 'var(--txt-mid)' : '#64748b' }}
                  >
                    {t('modern.weekOf', { current: currentWeek, total: client.numberOfWeeks || 12 })} · {progressPercentage}%
                  </p>
                </div>
              </div>
            </div>

            <div className="wk-pbar mt-2.5">
              <i style={{ width: `${Math.max(4, Math.min(100, progressPercentage))}%` }} />
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="client-content-area relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-12">
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
                isDark={useDarkTheme}
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
            <IndependentMuscleGroupCharts client={clientForCharts} isDark={isDark} />
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
            <div className="space-y-3">
              <div
                className={`client-compact-card rounded-xl border p-3 ${useDarkTheme ? '' : 'bg-white border-slate-200'}`}
                style={useDarkTheme ? { background: 'var(--surface-1)', borderColor: 'var(--hair)' } : undefined}
              >
                <h2
                  className="client-compact-title font-display font-semibold mb-2 flex items-center gap-2"
                  style={{ color: useDarkTheme ? 'var(--txt-hi)' : '#0f172a' }}
                >
                  <Camera className="w-4 h-4 shrink-0" style={{ color: 'var(--red)' }} />
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

      </>
      )}
    </div>
  );
};

export default ModernClientInterface;
