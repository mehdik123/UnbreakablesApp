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
  HelpCircle,
  BookOpen,
  Languages,
  HeartPulse,
  ArrowUpRight,
  Play,
  BadgeCheck,
  Home,
  User,
  LogOut,
} from 'lucide-react';
import { ClientWelcomeTour } from './ClientWelcomeTour';
import { ClientHelpGuide } from './ClientHelpGuide';
import { Client, ClientWorkoutAssignment, NutritionPlan } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { dbResolveClientIdByName, dbGetCardioPlan } from '../lib/db';
import { enrichProgramAndWeeksWithExercises } from '../utils/enrichAssignment';
import { normalizeCardioPlan } from '../data/cardioPresets';
import { WeekProgressionManager } from '../utils/weekProgressionManager';
import { getLatestDeployedWeekNumber } from '../utils/weekCreation';
import { getClientWeightLogs, getClientPRHistory } from '../lib/progressTracking';
import { getClientSupplements } from '../services/supplementsService';
import { ErrorBoundary } from './ErrorBoundary';
import { OfflineBanner } from './OfflineBanner';
import { useOnlineStatus, useOnBackOnline } from '../hooks/useOnlineStatus';
import {
  flushOfflineQueue,
  getPendingSyncCount,
  loadClientOfflineSnapshot,
  saveClientOfflineSnapshot,
} from '../lib/offlineStore';
import { authService } from '../lib/authService';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import { 
  WorkoutDaySkeleton, 
  NutritionPlanSkeleton, 
  WeightChartSkeleton,
  PhotoGridSkeleton,
  AnalyticsSkeleton
} from './LoadingSkeletons';

type Route =
  | 'home'
  | 'progressHub'
  | 'nutrition'
  | 'supplements'
  | 'workout'
  | 'cardio'
  | 'progress'
  | 'weight'
  | 'photos'
  | 'performance'
  | 'profile';

type BottomTab = 'home' | 'train' | 'nutrition' | 'progress' | 'profile';

const TRAIN_ROUTES: Route[] = ['workout', 'cardio'];
const NUTRITION_ROUTES: Route[] = ['nutrition', 'supplements'];
const PROGRESS_DETAIL_ROUTES: Route[] = ['progress', 'performance', 'weight', 'photos'];

function tabForRoute(r: Route): BottomTab {
  if (r === 'home') return 'home';
  if (TRAIN_ROUTES.includes(r)) return 'train';
  if (NUTRITION_ROUTES.includes(r)) return 'nutrition';
  if (r === 'progressHub' || PROGRESS_DETAIL_ROUTES.includes(r)) return 'progress';
  if (r === 'profile') return 'profile';
  return 'home';
}

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
const ClientCardioView = lazy(() => import('./ClientCardioView').then(module => ({ default: module.ClientCardioView })));

interface ModernClientInterfaceProps {
  client: Client;
  isDark: boolean;
  /** DEV/marketing only — open a specific client section immediately */
  initialRoute?: Route;
  /** Clears session and returns to client login */
  onLogout?: () => void;
}

// Loading component for Suspense
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
  </div>
);

export const ModernClientInterface: React.FC<ModernClientInterfaceProps> = ({
  client,
  isDark: _isDarkProp,
  initialRoute = 'home',
  onLogout,
}) => {
  const [route, setRoute] = useState<Route>(() => {
    if (client.id === 'marketing-demo' && typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      if (p.get('openLang') === '1') return 'profile';
    }
    return initialRoute;
  });
  const activeTab = route;
  const activeBottomTab = tabForRoute(route);
  const isTrainTab = TRAIN_ROUTES.includes(route);
  const isNutritionTab = NUTRITION_ROUTES.includes(route);
  const isProgressDetail = PROGRESS_DETAIL_ROUTES.includes(route);
  const isSpoke = isTrainTab || isNutritionTab || isProgressDetail;
  const [useDarkTheme, setUseDarkTheme] = useState<boolean>(() => {
    const saved = localStorage.getItem('client_interface_theme');
    // Default to dark mode when no preference exists
    if (!saved) return true;
    return saved === 'dark';
  });
  const [currentWeek, setCurrentWeek] = useState<number>(() => {
    return getLatestDeployedWeekNumber(client.workoutAssignment) || client.workoutAssignment?.currentWeek || 1;
  });
  /**
   * Once the client picks a week in the workout strip, keep it until they leave
   * via home "Open workouts" (do not snap back to latest deployed after a few seconds).
   */
  const weekBrowsePinnedRef = useRef(false);
  const handleClientWeekChange = useCallback((week: number) => {
    weekBrowsePinnedRef.current = true;
    setCurrentWeek(week);
  }, []);
  const jumpToActiveTrainingWeek = useCallback((week: number) => {
    weekBrowsePinnedRef.current = false;
    setCurrentWeek(week);
  }, []);
  const applySyncedWeekIfUnpinned = useCallback((week: number) => {
    if (weekBrowsePinnedRef.current) return;
    if (week < 1) return;
    setCurrentWeek((prev) => (prev === week ? prev : week));
  }, []);
  // Latest assignment (from save or sync) so Progress charts and Performance see client edits
  const [effectiveWorkoutAssignment, setEffectiveWorkoutAssignment] = useState(client.workoutAssignment ?? undefined);
  
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [cardioSummary, setCardioSummary] = useState('');
  const [supplementsCount, setSupplementsCount] = useState(0);
  const [weightSparkline, setWeightSparkline] = useState<number[]>([]);
  const [weeklyPhotos, setWeeklyPhotos] = useState<any[]>([]);
  // Real progress stats for the dashboard (weight + strength change). Null = not enough data yet.
  const [dashStats, setDashStats] = useState<{
    latestWeight: number | null;
    weightDeltaKg: number | null;
    weightDeltaPct: number | null;
    weightDelta: number | null;
    strengthPct: number | null;
    strengthLift: string | null;
  }>({
    latestWeight: null,
    weightDeltaKg: null,
    weightDeltaPct: null,
    weightDelta: null,
    strengthPct: null,
    strengthLift: null,
  });
  const [databaseClientId, setDatabaseClientId] = useState<string | null>(null);
  const [isLoadingTab, setIsLoadingTab] = useState(false);
  const isOnline = useOnlineStatus();
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  
  const { locale, setLocale, t, isRtl } = useClientLocale();
  const marketingParams =
    client.id === 'marketing-demo' && typeof window !== 'undefined'
      ? new URLSearchParams(window.location.search)
      : null;

  // First-run welcome tour (shown once per client, re-openable via Profile)
  const welcomeKey = `ub_welcome_seen_${client.id}`;
  const guideKey = `ub_guide_seen_${client.id}`;
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
  useEffect(() => {
    if (client.id === 'marketing-demo') return;
    try {
      if (!localStorage.getItem(welcomeKey)) setShowWelcome(true);
    } catch {
      /* ignore storage errors */
    }
  }, [welcomeKey, client.id]);
  const closeWelcome = useCallback(() => {
    setShowWelcome(false);
    try {
      localStorage.setItem(welcomeKey, '1');
      // First-run is step-by-step tour only — do not auto-open the help sheet (no YouTube).
      localStorage.setItem(guideKey, '1');
    } catch {
      /* ignore storage errors */
    }
  }, [welcomeKey, guideKey]);
  const closeHelpGuide = useCallback(() => {
    setShowHelpGuide(false);
    try {
      localStorage.setItem(guideKey, '1');
    } catch {
      /* ignore storage errors */
    }
  }, [guideKey]);

  useEffect(() => {
    localStorage.setItem('client_interface_theme', useDarkTheme ? 'dark' : 'light');
  }, [useDarkTheme]);

  useEffect(() => {
    setPendingSyncCount(getPendingSyncCount(client.id));
  }, [client.id, effectiveWorkoutAssignment, isOnline]);

  useOnBackOnline(() => {
    flushOfflineQueue(client.id).then(() => {
      setPendingSyncCount(getPendingSyncCount(client.id));
    });
  }, [client.id]);

  const handleSyncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await flushOfflineQueue(client.id);
      setPendingSyncCount(getPendingSyncCount(client.id));
    } finally {
      setIsSyncing(false);
    }
  }, [client.id]);

  // Keep effective assignment in sync with prop and with sync fetch
  useEffect(() => {
    setEffectiveWorkoutAssignment(client.workoutAssignment ?? undefined);
  }, [client.workoutAssignment]);

  // Navigate to a section/hub (hub-and-spoke model)
  const navigate = useCallback((target: Route) => {
    setRoute(target);
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  // Back only for progress detail spokes → progress hub (tabs handle tab roots)
  const goBack = useCallback(() => {
    setRoute('progressHub');
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'auto' });
  }, []);

  const selectBottomTab = useCallback(
    (tab: BottomTab) => {
      if (tab === 'home') {
        navigate('home');
        return;
      }
      if (tab === 'train') {
        navigate(TRAIN_ROUTES.includes(route) ? route : 'workout');
        return;
      }
      if (tab === 'nutrition') {
        navigate(NUTRITION_ROUTES.includes(route) ? route : 'nutrition');
        return;
      }
      if (tab === 'progress') {
        navigate('progressHub');
        return;
      }
      navigate('profile');
    },
    [navigate, route],
  );

  // Resolve database client UUID from client name
  useEffect(() => {
    if (client.id === 'marketing-demo') {
      setDatabaseClientId(client.id);
      return;
    }
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
  }, [client.name, client.id]);

  // Load nutrition plan and sync current week
  useEffect(() => {
    const loadNutritionPlan = async () => {
      try {
        if (isOnline && isSupabaseReady && supabase) {
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
          return;
        }

        const snapshot = loadClientOfflineSnapshot(client.id);
        if (snapshot?.nutritionPlan) {
          setNutritionPlan(snapshot.nutritionPlan);
          return;
        }

        const savedNutritionPlan = localStorage.getItem(`nutrition_plan_${client.id}`);
        if (savedNutritionPlan) {
          setNutritionPlan(JSON.parse(savedNutritionPlan));
        }
      } catch (error) {
        console.error('❌ Failed to load nutrition plan:', error);
      }
    };

    loadNutritionPlan();
  }, [client.id, client.name, client.nutritionPlan, isOnline]);

  // Load real progress stats (weight vs coach starting weight + strength change)
  useEffect(() => {
    if (!databaseClientId) return;
    // Skip remote fetch when offline unless marketing demo (local shim data)
    if (!isSupabaseReady && client.id !== 'marketing-demo') return;
    let cancelled = false;
    (async () => {
      try {
        const [weightLogs, prs] = await Promise.all([
          getClientWeightLogs(databaseClientId),
          client.id === 'marketing-demo'
            ? Promise.resolve([])
            : getClientPRHistory(databaseClientId),
        ]);
        if (cancelled) return;

        const asc = [...weightLogs].sort((a, b) => a.date.getTime() - b.date.getTime());
        let latestWeight: number | null = null;
        let weightDeltaKg: number | null = null;
        let weightDeltaPct: number | null = null;
        let weightDelta: number | null = null;

        if (asc.length >= 1) {
          latestWeight = Math.round(asc[asc.length - 1].weight * 10) / 10;
          // Baseline = coach starting weight; fall back to first log for older clients
          const baseline =
            typeof client.startingWeight === 'number' && client.startingWeight > 0
              ? client.startingWeight
              : asc[0].weight;
          weightDeltaKg = Math.round((latestWeight - baseline) * 10) / 10;
          weightDeltaPct =
            baseline > 0 ? Math.round(((latestWeight - baseline) / baseline) * 1000) / 10 : null;
          // Progress tile still uses change across logs when ≥2 entries
          if (asc.length >= 2) {
            weightDelta = Math.round((asc[asc.length - 1].weight - asc[0].weight) * 10) / 10;
            const slice = asc.slice(-8).map((w) => w.weight);
            const min = Math.min(...slice);
            const max = Math.max(...slice);
            const range = max - min || 1;
            setWeightSparkline(slice.map((w) => 1 - (w - min) / range));
          } else {
            setWeightSparkline([]);
          }
        } else {
          setWeightSparkline([]);
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

        setDashStats({
          latestWeight,
          weightDeltaKg,
          weightDeltaPct,
          weightDelta,
          strengthPct,
          strengthLift,
        });
      } catch {
        /* leave stats empty on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [databaseClientId, currentWeek, route, client.startingWeight, client.id]);

  // Supplements count for home tile status
  useEffect(() => {
    if (!databaseClientId) return;
    let cancelled = false;
    getClientSupplements(databaseClientId).then(({ data }) => {
      if (!cancelled) setSupplementsCount(data?.length ?? 0);
    });
    return () => {
      cancelled = true;
    };
  }, [databaseClientId]);

  // Cardio summary for the dashboard card
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        let raw = client.cardioPlan || null;
        if (isOnline) {
          const clientId = await dbResolveClientIdByName(client.name);
          if (clientId) {
            const { data } = await dbGetCardioPlan(clientId);
            if (data) raw = data;
          }
        } else {
          const snapshot = loadClientOfflineSnapshot(client.id);
          if (snapshot?.cardioPlan) raw = snapshot.cardioPlan;
        }
        if (cancelled) return;
        const plan = normalizeCardioPlan(raw);
        const items = plan.items;
        if (items.length === 0) {
          setCardioSummary('');
        } else if (items.length === 1) {
          setCardioSummary(`${items[0].name} · ${items[0].timesPerWeek}×/wk`);
        } else {
          setCardioSummary(t('cardio.itemCount', { count: items.length }));
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client.id, client.name, client.cardioPlan, route, t, isOnline]);

  // Only auto-follow latest deployed week when the client is not browsing another week
  useEffect(() => {
    const w = getLatestDeployedWeekNumber(client.workoutAssignment);
    applySyncedWeekIfUnpinned(w);
  }, [client.workoutAssignment, applySyncedWeekIfUnpinned]);

  // Real-time sync for current week from database
  useEffect(() => {
    if (!isOnline || !isSupabaseReady || !supabase) return;

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
            .select('current_week, last_modified_by, program_json')
            .eq('client_id', cRow.id)
            .eq('is_active', true)
            .order('last_modified_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!assignment) return;
          const fromJson = getLatestDeployedWeekNumber({
            weeks: (assignment.program_json as any)?.weeks,
            currentWeek: assignment.current_week,
          });
          const resolved = Math.max(fromJson, assignment.current_week || 1);
          applySyncedWeekIfUnpinned(resolved);
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
          const row: any = payload.new;
          const fromJson = getLatestDeployedWeekNumber({
            weeks: row.program_json?.weeks,
            currentWeek: row.current_week,
          });
          const resolved = Math.max(fromJson, Number(row.current_week) || 1);
          applySyncedWeekIfUnpinned(resolved);
        }
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      if (supabase) {
        supabase.removeChannel(channel);
      }
    };
  }, [client.id, client.name, isOnline, applySyncedWeekIfUnpinned]);

  // Update weeks with real-time sync
  useEffect(() => {
    if (!isOnline) return;

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
                currentDay: assignment.current_day ?? raw.currentDay ?? base?.currentDay ?? 0,
                weeks: enrichedWeeks.length ? enrichedWeeks : (raw.weeks || []),
                progressionRules: base?.progressionRules ?? [],
                isActive: base?.isActive ?? true,
                program: enrichedProgram?.days?.length ? enrichedProgram : (raw.program || raw),
                lastModifiedBy: (assignment.last_modified_by as any) ?? raw.lastModifiedBy,
                lastModifiedAt: raw.lastModifiedAt ? new Date(raw.lastModifiedAt) : undefined,
                ...(raw.lastSavedDay != null ? { lastSavedDay: raw.lastSavedDay } : {}),
                ...(raw.lastSavedWeek != null ? { lastSavedWeek: raw.lastSavedWeek } : {}),
              } as ClientWorkoutAssignment;
              setEffectiveWorkoutAssignment(freshAssignment);
              saveClientOfflineSnapshot(client.id, {
                client: {
                  ...client,
                  workoutAssignment: freshAssignment,
                  nutritionPlan: nutritionPlan ?? client.nutritionPlan,
                  cardioPlan: client.cardioPlan,
                },
                nutritionPlan: nutritionPlan ?? client.nutritionPlan ?? null,
                cardioPlan: client.cardioPlan ?? null,
                syncedAt: new Date().toISOString(),
              });
              const freshWeeks = raw.weeks || [];
              if (freshWeeks.length > 0) {
                const deployedWeekNumbers = freshWeeks.map((w: any) => w.weekNumber);
                const latestDeployed = getLatestDeployedWeekNumber(freshAssignment);
                const rawWeek = assignment.current_week || latestDeployed || 1;
                const newCurrentWeek = deployedWeekNumbers.includes(latestDeployed)
                  ? latestDeployed
                  : deployedWeekNumbers.includes(rawWeek)
                  ? rawWeek
                  : Math.min(rawWeek, Math.max(...deployedWeekNumbers)) || deployedWeekNumbers[0];
                applySyncedWeekIfUnpinned(newCurrentWeek);
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
  }, [client.id, client.name, currentWeek, isOnline, nutritionPlan, applySyncedWeekIfUnpinned]);

  const assignmentForWeeks = effectiveWorkoutAssignment ?? client.workoutAssignment;
  const clientForCharts = useMemo(() => {
    const wa = effectiveWorkoutAssignment ?? client.workoutAssignment;
    if (!wa) return { ...client, workoutAssignment: wa };
    const latest = getLatestDeployedWeekNumber(wa);
    return {
      ...client,
      workoutAssignment: { ...wa, currentWeek: latest },
    };
  }, [client, effectiveWorkoutAssignment, client.workoutAssignment]);
  const getWeekStatus = (weekNumber: number): 'locked' | 'active' | 'completed' => {
    if (!assignmentForWeeks?.weeks) return 'locked';
    
    const week = assignmentForWeeks.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return 'locked';
    
    return WeekProgressionManager.getWeekStatus(week);
  };

  const totalWeeks = client.numberOfWeeks || 12;

  // Latest week coach deployed (no day-pointer logic on home)
  const activeWeek = useMemo(
    () => getLatestDeployedWeekNumber(effectiveWorkoutAssignment ?? client.workoutAssignment),
    [effectiveWorkoutAssignment, client.workoutAssignment]
  );

  const progressPercentage = Math.round((activeWeek / totalWeeks) * 100);

  const lastSavedWeek = (effectiveWorkoutAssignment ?? client.workoutAssignment)?.lastSavedWeek;
  const canContinue = typeof lastSavedWeek === 'number' && lastSavedWeek >= 1;

  const nutritionDailyKcal = useMemo(() => {
    if (!nutritionPlan?.mealSlots?.length) return null;
    let total = 0;
    let counted = 0;
    for (const slot of nutritionPlan.mealSlots) {
      const sm = slot.selectedMeals?.[0];
      const ings = sm?.customIngredients ?? sm?.meal?.ingredients;
      if (!ings?.length) continue;
      const qty = sm?.quantity ?? 1;
      const kcal = ings.reduce((sum, ing) => sum + ((ing.food?.kcal ?? 0) * ing.quantity * qty) / 100, 0);
      if (kcal > 0) {
        total += kcal;
        counted++;
      }
    }
    return counted > 0 ? Math.round(total) : null;
  }, [nutritionPlan]);

  const nutritionStatus = nutritionPlan
    ? nutritionDailyKcal != null
      ? t('home.nutritionSummary', { meals: nutritionPlan.mealsPerDay, kcal: nutritionDailyKcal.toLocaleString() })
      : t('home.mealsPerDay', { count: nutritionPlan.mealsPerDay })
    : t('home.viewPlan');

  const supplementsStatus = supplementsCount > 0 ? t('home.supplementsToday', { count: supplementsCount }) : '';

  const progressCardStatus = dashStats.strengthPct != null
    ? t('home.strengthStat', { pct: `${dashStats.strengthPct > 0 ? '+' : ''}${dashStats.strengthPct}` })
    : dashStats.weightDelta != null
    ? `${dashStats.weightDelta > 0 ? '+' : ''}${dashStats.weightDelta} kg`
    : '';

  type HomeAccent = 'red' | 'orange' | 'green' | 'violet' | 'blue';
  const homeCards: {
    route: Route;
    title: string;
    desc: string;
    Icon: React.ComponentType<{ className?: string }>;
    accent: HomeAccent;
    status: string;
    wide?: boolean;
  }[] = [
    { route: 'workout', title: t('nav.workout'), desc: t('home.workoutDesc'), Icon: Dumbbell, accent: 'red', status: t('modern.weekOf', { current: activeWeek, total: totalWeeks }) },
    { route: 'cardio', title: t('nav.cardio'), desc: t('home.cardioDesc'), Icon: HeartPulse, accent: 'orange', status: cardioSummary },
    { route: 'nutrition', title: t('nav.nutrition'), desc: t('home.nutritionDesc'), Icon: Utensils, accent: 'green', status: nutritionStatus },
    { route: 'supplements', title: t('nav.supplements'), desc: t('home.supplementsDesc'), Icon: Pill, accent: 'violet', status: supplementsStatus },
    { route: 'progressHub', title: t('nav.progress'), desc: t('home.progressDesc'), Icon: TrendingUp, accent: 'blue', status: progressCardStatus, wide: true },
  ];

  const hubCards = [
    { route: 'progress' as Route, title: t('nav.whatYouTrain'), desc: t('home.chartsDesc'), Icon: Activity, grad: 'from-blue-500 to-indigo-500' },
    { route: 'performance' as Route, title: t('nav.gettingStronger'), desc: t('home.analyticsDesc'), Icon: BarChart3, grad: 'from-violet-500 to-fuchsia-500' },
    { route: 'weight' as Route, title: t('nav.bodyWeight'), desc: t('home.weightDesc'), Icon: Scale, grad: 'from-pink-500 to-rose-500' },
    { route: 'photos' as Route, title: t('nav.progressPhotos'), desc: t('home.photosDesc'), Icon: Camera, grad: 'from-indigo-500 to-cyan-500' },
  ];

  const sectionTitles: Record<string, string> = {
    workout: t('nav.workout'),
    cardio: t('nav.cardio'),
    nutrition: t('nav.meals'),
    supplements: t('nav.suppsWater'),
    progress: t('nav.whatYouTrain'),
    performance: t('nav.gettingStronger'),
    weight: t('nav.bodyWeight'),
    photos: t('nav.progressPhotos'),
  };

  const LANGS: { code: 'en' | 'fr' | 'ar'; short: string; labelKey: string }[] = [
    { code: 'en', short: 'EN', labelKey: 'modern.langEnglish' },
    { code: 'fr', short: 'FR', labelKey: 'modern.langFrench' },
    { code: 'ar', short: 'AR', labelKey: 'modern.langArabic' },
  ];

  const handleLogout = useCallback(() => {
    if (!window.confirm(t('profile.logoutConfirm'))) return;
    authService.logout();
    if (onLogout) {
      onLogout();
      return;
    }
    // Fallback: hard navigate back to the same client link (shows login)
    const params = new URLSearchParams(window.location.search);
    const clientShare = params.get('client');
    window.location.replace(clientShare ? `?client=${encodeURIComponent(clientShare)}` : window.location.pathname);
  }, [t, onLogout]);

  const SegmentedControl = ({
    options,
  }: {
    options: { route: Route; label: string }[];
  }) => (
    <div className="client-seg" role="tablist">
      {options.map((opt) => {
        const active = route === opt.route;
        return (
          <button
            key={opt.route}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => navigate(opt.route)}
            className={`client-seg-btn${active ? ' is-active' : ''}`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );

  return (
    <div
      className={`client-mobile-shell min-h-screen ${useDarkTheme ? 'workout-shell' : 'theme-light bg-slate-50'}`}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      {/* Subtle brand watermark blended behind all content */}
      <div className="fixed inset-0 z-0 pointer-events-none flex items-center justify-center overflow-hidden" aria-hidden="true">
        <img
          src={useDarkTheme ? '/brand-logo-light.png' : '/brand-logo.png'}
          alt=""
          className="w-[82%] max-w-[560px] object-contain"
          style={{ opacity: useDarkTheme ? 0.05 : 0.04, filter: 'blur(1px)' }}
        />
      </div>

      {showWelcome && (
        <ClientWelcomeTour name={client.name.split(' ')[0] || 'there'} isRtl={isRtl} t={t} onClose={closeWelcome} />
      )}

      {showHelpGuide && (
        <ClientHelpGuide
          isRtl={isRtl}
          t={t}
          onClose={closeHelpGuide}
          onReplayTour={() => setShowWelcome(true)}
        />
      )}

      <OfflineBanner
        pendingSyncCount={pendingSyncCount}
        onSyncNow={handleSyncNow}
        isSyncing={isSyncing}
        forceOffline={marketingParams?.get('offline') === '1'}
      />

      {/* ============ HOME DASHBOARD (hub) ============ */}
      {route === 'home' && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 pb-24">
          {/* Header — avatar + welcome + name only */}
          <div className="home-header">
            <div className="home-avatar-ring">
              <div
                className="w-full h-full rounded-[12px] flex items-center justify-center overflow-hidden"
                style={{ background: '#ffffff' }}
              >
                <img src="/brand-logo.png" alt="" className="w-[74%] h-[74%] object-contain" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[12px]" style={{ color: 'var(--txt-mid)' }}>
                {t('modern.welcomeBackShort')}
              </div>
              <div className="font-saira text-[22px] leading-none truncate" style={{ color: 'var(--txt-hi)' }}>
                {client.name.split(' ')[0]}
              </div>
            </div>
          </div>

          <p className="home-prompt home-anim" style={{ animationDelay: '0.03s' }}>
            <b>{t('home.subtitle')}</b>
          </p>

          {/* Program progress */}
          <div className="home-prog home-anim" style={{ animationDelay: '0.06s' }}>
            <div className="home-prog-glow" aria-hidden="true" />
            <div className="home-prog-row">
              <div
                className="home-prog-ring"
                style={{ ['--prog' as string]: `${Math.min(100, Math.max(0, progressPercentage))}` }}
                aria-hidden="true"
              >
                <span className="home-prog-ring-val font-display font-bold tnum">{progressPercentage}%</span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-[10.5px] uppercase tracking-widest font-bold" style={{ color: 'var(--txt-lo)' }}>
                    {t('home.programProgress')}
                  </span>
                  <span className="text-[12px] font-semibold" style={{ color: 'var(--txt-mid)' }}>
                    {t('modern.weekOf', { current: activeWeek, total: totalWeeks })}
                    {activeWeek >= totalWeeks ? ` · ${t('home.finalWeek')}` : ''}
                  </span>
                </div>
                <div className="home-prog-track" aria-hidden="true">
                  <div
                    className="home-prog-fill"
                    style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                  />
                </div>
                <div className="home-prog-pips" aria-hidden="true">
                  {(() => {
                    const pipCount = Math.min(Math.max(totalWeeks, 1), 16);
                    const filled = Math.max(1, Math.round((activeWeek / Math.max(totalWeeks, 1)) * pipCount));
                    return Array.from({ length: pipCount }, (_, i) => (
                      <span
                        key={i}
                        className={`home-prog-pip${i < filled ? ' is-done' : ''}${i === filled - 1 ? ' is-now' : ''}`}
                      />
                    ));
                  })()}
                </div>
              </div>
            </div>
          </div>

          {/* Body weight highlight — blank until client logs; then latest vs coach starting weight */}
          {dashStats.latestWeight != null && (
            <button
              type="button"
              onClick={() => navigate('weight')}
              className="home-weight-card home-anim"
              style={{ animationDelay: '0.1s' }}
              aria-label={t('home.weightHighlightAria')}
            >
              <div className="home-weight-glow" aria-hidden="true" />
              <div className="home-weight-ic" aria-hidden="true">
                <Scale className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1 text-start relative">
                <div className="text-[10.5px] uppercase tracking-widest font-bold" style={{ color: 'var(--txt-lo)' }}>
                  {t('home.statWeight')}
                </div>
                <div className="font-display font-bold text-[24px] leading-none tnum mt-1 home-weight-num" style={{ color: 'var(--txt-hi)' }}>
                  {dashStats.latestWeight}
                  <span className="text-[13px] font-semibold ms-1" style={{ color: 'var(--txt-mid)' }}>kg</span>
                </div>
                {dashStats.weightDeltaKg != null && (
                  <div className="home-weight-chips mt-2">
                    <span
                      className={`home-weight-chip font-display tnum${
                        dashStats.weightDeltaKg > 0 ? ' up' : dashStats.weightDeltaKg < 0 ? ' down' : ''
                      }`}
                    >
                      {dashStats.weightDeltaKg > 0 ? '+' : ''}
                      {dashStats.weightDeltaKg} kg
                    </span>
                    {dashStats.weightDeltaPct != null && (
                      <span className="home-weight-chip muted">
                        {dashStats.weightDeltaPct > 0 ? '+' : ''}
                        {dashStats.weightDeltaPct}% {t('home.weightVsStart')}
                      </span>
                    )}
                  </div>
                )}
              </div>
              {weightSparkline.length >= 2 && (
                <div className="home-weight-spark shrink-0" aria-hidden="true">
                  <WeightSparkline points={weightSparkline} variant="weight" />
                </div>
              )}
              <ChevronRight className="home-weight-chevron w-[18px] h-[18px] shrink-0" />
            </button>
          )}

          {/* Current week — no day pointer */}
          <div className="home-hero home-anim" style={{ animationDelay: '0.12s' }}>
            <div className="home-hero-grid" aria-hidden="true" />
            <span className="relative inline-flex items-center gap-1.5 text-[10.5px] uppercase tracking-widest font-bold" style={{ color: 'var(--red)' }}>
              <span className="home-hero-pip" />
              {t('modern.currentWeek')}
            </span>
            <h2 className="font-saira text-[34px] leading-[0.95] my-3 relative" style={{ color: 'var(--txt-hi)' }}>
              {t('home.weekTitle', { n: activeWeek })}
            </h2>
            <p className="relative text-[12.5px] mb-4" style={{ color: 'var(--txt-mid)' }}>
              {t('home.currentWeekHint')}
            </p>
            <button
              type="button"
              className="home-start-btn relative"
              onClick={() => {
                jumpToActiveTrainingWeek(canContinue ? (lastSavedWeek as number) : activeWeek);
                navigate('workout');
              }}
            >
              {canContinue ? t('home.continueLeftOff') : t('home.startWorkout')}
              <Play className="w-[18px] h-[18px] fill-current" />
            </button>
          </div>

          {/* Explore grid */}
          <div className="home-seclabel home-anim" style={{ animationDelay: '0.18s' }}>
            <span>{t('home.explore')}</span>
            <span className="line" />
          </div>
          <div className="home-grid">
            {homeCards.map((card, idx) => (
              <button
                key={card.route}
                type="button"
                onClick={() => navigate(card.route)}
                className={`home-tile ${card.accent} home-anim${card.wide ? ' wide' : ''}`}
                style={{ animationDelay: `${0.2 + idx * 0.06}s` }}
              >
                <ArrowUpRight className={`t-arrow w-[17px] h-[17px]${card.wide ? ' hidden' : ''}`} />
                <div className="t-ic">
                  <card.Icon className="w-5 h-5" />
                </div>
                {card.wide ? (
                  <>
                    <div className="w-txt">
                      <div className="font-saira text-[18px] leading-tight" style={{ color: 'var(--txt-hi)' }}>{card.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>{card.desc}</div>
                      {card.status ? <span className="t-stat">{card.status}</span> : null}
                    </div>
                    <WeightSparkline points={weightSparkline} />
                    <ChevronRight className="t-arrow w-[17px] h-[17px]" />
                  </>
                ) : (
                  <>
                    <div className="font-saira text-[18px] leading-tight" style={{ color: 'var(--txt-hi)' }}>{card.title}</div>
                    <div className="text-[11px] mt-0.5 leading-snug" style={{ color: 'var(--txt-mid)' }}>{card.desc}</div>
                    {card.status ? <span className="t-stat">{card.status}</span> : null}
                  </>
                )}
              </button>
            ))}
          </div>

          {/* Coach note (placeholder until coach messages exist) */}
          <div className="home-seclabel home-anim" style={{ animationDelay: '0.48s' }}>
            <span>{t('home.fromCoach')}</span>
            <span className="line" />
          </div>
          <div className="home-coach home-anim mb-4" style={{ animationDelay: '0.5s' }}>
            <div className="w-[42px] h-[42px] rounded-xl p-[2px] shrink-0" style={{ background: 'var(--grad-coral)' }}>
              <div
                className="w-full h-full rounded-[10px] flex items-center justify-center font-display font-bold text-[15px]"
                style={{ background: 'var(--surface-3)', color: 'var(--txt-hi)' }}
              >
                {t('home.coachName').charAt(0).toUpperCase()}
              </div>
            </div>
            <div className="min-w-0">
              <div className="text-[12px] font-bold flex items-center gap-1.5" style={{ color: 'var(--txt-hi)' }}>
                {t('home.coachName')}
                <BadgeCheck className="w-[13px] h-[13px]" style={{ color: 'var(--blue)' }} />
              </div>
              <div className="text-[9.5px] uppercase tracking-wide font-semibold mt-0.5" style={{ color: 'var(--txt-lo)' }}>
                {t('home.coachRole')}
              </div>
              <p className="text-[12.5px] leading-relaxed mt-1.5" style={{ color: 'var(--txt-mid)' }}>
                {t('home.coachNoteBody')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ============ PROGRESS SUB-HUB ============ */}
      {route === 'progressHub' && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 pb-24">
          <div className="pt-5 pb-3">
            <div className="font-display font-semibold text-[20px] leading-tight" style={{ color: 'var(--txt-hi)' }}>
              {t('progress.headline')}
            </div>
            <div className="text-[12px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
              {t('home.progressHubSubtitle')}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {hubCards.map((card) => (
              <button
                key={card.route}
                type="button"
                onClick={() => navigate(card.route)}
                className="text-left rounded-2xl p-4 transition-transform active:scale-95 touch-manipulation"
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

      {/* ============ PROFILE ============ */}
      {route === 'profile' && (
        <div className="profile-shell relative z-10">
          <div className="profile-hero">
            <div className="profile-hero-glow" aria-hidden="true" />
            <div className="relative flex items-center gap-3">
              <div className="home-avatar-ring">
                <div
                  className="w-full h-full rounded-[12px] flex items-center justify-center overflow-hidden"
                  style={{ background: '#ffffff' }}
                >
                  <img src="/brand-logo.png" alt="" className="w-[74%] h-[74%] object-contain" />
                </div>
              </div>
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-widest font-bold" style={{ color: 'var(--txt-lo)' }}>
                  {t('profile.title')}
                </div>
                <div className="font-saira text-[26px] leading-none truncate mt-1" style={{ color: 'var(--txt-hi)' }}>
                  {client.name.split(' ')[0]}
                </div>
              </div>
            </div>
          </div>

          <div>
            <section className="profile-card">
              <div className="profile-card-label">
                <span className="pc-ic"><Languages className="w-3.5 h-3.5" /></span>
                {t('profile.language')}
              </div>
              <div className="profile-chip-row">
                {LANGS.map((l) => {
                  const active = l.code === locale;
                  return (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => setLocale(l.code)}
                      className={`profile-chip${active ? ' is-active' : ''}`}
                    >
                      <span className="chip-code">{l.short}</span>
                      {t(l.labelKey)}
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-label">
                <span className="pc-ic">{useDarkTheme ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}</span>
                {t('profile.theme')}
              </div>
              <div className="profile-chip-row">
                <button
                  type="button"
                  onClick={() => setUseDarkTheme(true)}
                  className={`profile-chip flex items-center justify-center gap-2${useDarkTheme ? ' is-active' : ''}`}
                >
                  <Moon className="w-4 h-4" />
                  {t('profile.themeDark')}
                </button>
                <button
                  type="button"
                  onClick={() => setUseDarkTheme(false)}
                  className={`profile-chip flex items-center justify-center gap-2${!useDarkTheme ? ' is-active' : ''}`}
                >
                  <Sun className="w-4 h-4" />
                  {t('profile.themeLight')}
                </button>
              </div>
            </section>

            <section className="profile-card">
              <div className="profile-card-label">
                <span className="pc-ic"><HelpCircle className="w-3.5 h-3.5" /></span>
                {t('profile.help')}
              </div>
              <button type="button" onClick={() => setShowHelpGuide(true)} className="profile-row-btn">
                <span className="row-ic"><BookOpen className="w-4 h-4" /></span>
                {t('profile.fullGuide')}
              </button>
              <button type="button" onClick={() => setShowWelcome(true)} className="profile-row-btn">
                <span className="row-ic"><HelpCircle className="w-4 h-4" /></span>
                {t('profile.help')}
              </button>
            </section>

            <section className="profile-card">
              <div className="profile-card-label">
                <span className="pc-ic"><User className="w-3.5 h-3.5" /></span>
                {t('profile.notifications')}
              </div>
              <p className="text-[13px] leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
                {t('profile.noNotifications')}
              </p>
            </section>

            <button type="button" onClick={handleLogout} className="profile-logout">
              <LogOut className="w-4 h-4" />
              {t('profile.logout')}
            </button>
          </div>
        </div>
      )}

      {/* ============ SECTION VIEW (spoke) ============ */}
      {isSpoke && (
      <>
      {/* Train: Workout | Cardio segment */}
      {isTrainTab && (
        <div className="client-seg-bar relative z-10">
          <div className="max-w-7xl mx-auto px-1 md:px-3">
            <SegmentedControl
              options={[
                { route: 'workout', label: t('nav.workout') },
                { route: 'cardio', label: t('nav.cardio') },
              ]}
            />
          </div>
        </div>
      )}

      {/* Nutrition: Meals | Supplements segment */}
      {isNutritionTab && (
        <div className="client-seg-bar relative z-10">
          <div className="max-w-7xl mx-auto px-1 md:px-3">
            <SegmentedControl
              options={[
                { route: 'nutrition', label: t('nav.meals') },
                { route: 'supplements', label: t('nav.suppsWater') },
              ]}
            />
          </div>
        </div>
      )}

      {/* Progress details: back → progressHub */}
      {isProgressDetail && (
        <div
          className="client-compact-header relative z-10 sticky top-0 backdrop-blur-xl"
          style={{ background: useDarkTheme ? 'rgba(16,18,24,.92)' : 'rgba(255,255,255,.95)', borderBottom: '1px solid var(--hair)' }}
        >
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-2.5 md:py-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={goBack}
                className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
                style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0">
                <h1
                  className="client-compact-title font-saira font-semibold truncate"
                  style={{ color: 'var(--txt-hi)' }}
                >
                  {sectionTitles[route]}
                </h1>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className="client-content-area relative z-10 max-w-7xl mx-auto px-3 sm:px-6 pb-24">
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
              isDark={useDarkTheme}
              onWeekChange={handleClientWeekChange}
              onAssignmentUpdated={(a) => {
                // Use saved assignment directly so Progress charts and coach view see client's volume edits
                if (a?.weeks != null && a?.program != null) {
                  setEffectiveWorkoutAssignment(a as ClientWorkoutAssignment);
                }
              }}
            />
          ) : activeTab === 'cardio' ? (
            <ErrorBoundary>
              <ClientCardioView client={client} isDark={useDarkTheme} />
            </ErrorBoundary>
          ) : activeTab === 'progress' ? (
            <IndependentMuscleGroupCharts client={clientForCharts} isDark={useDarkTheme} />
          ) : activeTab === 'performance' ? (
            <PerformanceAnalytics
              clientId={databaseClientId || client.id}
              clientName={client.name}
              isDark={useDarkTheme}
              workoutAssignment={clientForCharts.workoutAssignment ?? effectiveWorkoutAssignment ?? client.workoutAssignment}
            />
          ) : activeTab === 'weight' ? (
            <UltraModernWeeklyWeightLogger
              client={client}
              currentWeek={currentWeek}
              maxWeeks={client.numberOfWeeks}
              isDark={useDarkTheme}
            />
          ) : activeTab === 'photos' ? (
            <div className="photos-shell px-1">
              <div className="photos-summary">
                <div className="photos-summary-icon">
                  <Camera className="w-[22px] h-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-saira font-semibold text-[18px] truncate" style={{ color: 'var(--txt-hi)' }}>
                    {t('nav.progressPhotos')}
                  </div>
                  <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
                    {t('home.photosDesc')}
                  </div>
                </div>
                <div className="text-center shrink-0">
                  <div className="font-saira font-bold text-[24px] leading-none tnum" style={{ color: 'var(--red)' }}>
                    {weeklyPhotos.filter((p) => p.week === currentWeek).length}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--txt-lo)' }}>
                    / 3
                  </div>
                </div>
              </div>
              <WeeklyPhotoUpload
                clientId={databaseClientId || client.id}
                currentWeek={currentWeek}
                maxWeeks={client.numberOfWeeks}
                onPhotosUpdate={setWeeklyPhotos}
                existingPhotos={weeklyPhotos}
              />
            </div>
          ) : null}
        </Suspense>
      </div>

      </>
      )}

      {/* ============ BOTTOM TAB NAV ============ */}
      <nav className="client-tabbar" aria-label="Main">
        <div className="client-tabbar-inner">
          {(
            [
              { id: 'home' as BottomTab, label: t('nav.home'), Icon: Home },
              { id: 'train' as BottomTab, label: t('nav.train'), Icon: Dumbbell },
              { id: 'nutrition' as BottomTab, label: t('nav.nutrition'), Icon: Utensils },
              { id: 'progress' as BottomTab, label: t('nav.progress'), Icon: TrendingUp },
              { id: 'profile' as BottomTab, label: t('nav.profile'), Icon: User },
            ]
          ).map(({ id, label, Icon }) => {
            const active = activeBottomTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => selectBottomTab(id)}
                className={`client-tabbar-btn${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
              >
                <span className="tab-ic">
                  <Icon className="w-[1.15rem] h-[1.15rem]" strokeWidth={active ? 2.5 : 2} />
                </span>
                <span className="tab-label">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

function WeightSparkline({ points, variant = 'progress' }: { points: number[]; variant?: 'progress' | 'weight' }) {
  const w = variant === 'weight' ? 72 : 88;
  const h = variant === 'weight' ? 36 : 44;
  const pts = points.length >= 2
    ? points
    : [0.78, 0.68, 0.72, 0.5, 0.45, 0.32, 0.22, 0.12];
  const step = pts.length > 1 ? (w - 4) / (pts.length - 1) : w - 4;
  const toY = (p: number) => 4 + p * (h - 8);
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${2 + i * step},${toY(p)}`).join(' ');
  const areaD = `${lineD} L${2 + (pts.length - 1) * step},${h} L2,${h} Z`;
  const lastX = 2 + (pts.length - 1) * step;
  const lastY = toY(pts[pts.length - 1]);
  const stroke = variant === 'weight' ? 'var(--red)' : '#5b8cff';
  const gradId = variant === 'weight' ? 'homeSparkWeight' : 'homeSparkGrad';
  return (
    <svg
      className={`shrink-0 ${variant === 'weight' ? 'w-[72px] h-[36px]' : 'w-[88px] h-[44px]'}`}
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={variant === 'weight' ? 'rgba(255,45,85,.32)' : 'rgba(91,140,255,.35)'} />
          <stop offset="1" stopColor={variant === 'weight' ? 'rgba(255,45,85,0)' : 'rgba(91,140,255,0)'} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gradId})`} />
      <path d={lineD} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill={stroke} className={variant === 'weight' ? 'home-weight-dot' : undefined} />
    </svg>
  );
}

export default ModernClientInterface;
