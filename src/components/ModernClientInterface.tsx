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
  Check,
  HeartPulse,
  Bell,
  ArrowUpRight,
  Play,
  BadgeCheck,
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
const ClientCardioView = lazy(() => import('./ClientCardioView').then(module => ({ default: module.ClientCardioView })));

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
  type Route = 'home' | 'progressHub' | 'nutrition' | 'supplements' | 'workout' | 'cardio' | 'progress' | 'weight' | 'photos' | 'performance';
  const [route, setRoute] = useState<Route>('home');
  const activeTab = route;
  const SECTION_ROUTES: Route[] = ['nutrition', 'supplements', 'workout', 'cardio', 'progress', 'weight', 'photos', 'performance'];
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
  const [dashStats, setDashStats] = useState<{ weightDelta: number | null; strengthPct: number | null; strengthLift: string | null }>({
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
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langMenuRef = useRef<HTMLDivElement | null>(null);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);
  const notifMenuRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!langMenuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [langMenuOpen]);
  useEffect(() => {
    if (!notifMenuOpen) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target as Node)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
    };
  }, [notifMenuOpen]);

  // First-run welcome tour (shown once per client, re-openable via the bell menu)
  const welcomeKey = `ub_welcome_seen_${client.id}`;
  const guideKey = `ub_guide_seen_${client.id}`;
  const [showWelcome, setShowWelcome] = useState(false);
  const [showHelpGuide, setShowHelpGuide] = useState(false);
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
      const wasFirst = !localStorage.getItem(welcomeKey);
      localStorage.setItem(welcomeKey, '1');
      if (wasFirst && !localStorage.getItem(guideKey)) setShowHelpGuide(true);
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
          const slice = asc.slice(-8).map((w) => w.weight);
          const min = Math.min(...slice);
          const max = Math.max(...slice);
          const range = max - min || 1;
          setWeightSparkline(slice.map((w) => 1 - (w - min) / range));
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

        setDashStats({ weightDelta, strengthPct, strengthLift });
      } catch {
        /* leave stats empty on failure */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [databaseClientId, currentWeek]);

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

  // Workout header ring geometry (r=19 → circumference ≈ 119.38)
  const HEADER_RING_C = 2 * Math.PI * 19;
  const programTitle =
    (assignmentForWeeks?.program as any)?.name ||
    (client.workoutAssignment?.program as any)?.name ||
    t('modern.yourProgram');

  const totalWeeks = client.numberOfWeeks || 12;

  // Latest week coach deployed (no day-pointer logic on home)
  const activeWeek = useMemo(
    () => getLatestDeployedWeekNumber(effectiveWorkoutAssignment ?? client.workoutAssignment),
    [effectiveWorkoutAssignment, client.workoutAssignment]
  );

  const progressPercentage = Math.round((activeWeek / totalWeeks) * 100);

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
    { route: 'workout', title: t('nav.workouts'), desc: t('home.workoutDesc'), Icon: Dumbbell, accent: 'red', status: t('modern.weekOf', { current: activeWeek, total: totalWeeks }) },
    { route: 'cardio', title: t('nav.cardio'), desc: t('home.cardioDesc'), Icon: HeartPulse, accent: 'orange', status: cardioSummary },
    { route: 'nutrition', title: t('nav.nutrition'), desc: t('home.nutritionDesc'), Icon: Utensils, accent: 'green', status: nutritionStatus },
    { route: 'supplements', title: t('nav.supplements'), desc: t('home.supplementsDesc'), Icon: Pill, accent: 'violet', status: supplementsStatus },
    { route: 'progressHub', title: t('nav.progress'), desc: t('home.progressDesc'), Icon: TrendingUp, accent: 'blue', status: progressCardStatus, wide: true },
  ];

  const hubCards = [
    { route: 'progress' as Route, title: t('home.chartsTitle'), desc: t('home.chartsDesc'), Icon: Activity, grad: 'from-blue-500 to-indigo-500' },
    { route: 'performance' as Route, title: t('nav.analytics'), desc: t('home.analyticsDesc'), Icon: BarChart3, grad: 'from-violet-500 to-fuchsia-500' },
    { route: 'weight' as Route, title: t('nav.weight'), desc: t('home.weightDesc'), Icon: Scale, grad: 'from-pink-500 to-rose-500' },
    { route: 'photos' as Route, title: t('nav.photos'), desc: t('home.photosDesc'), Icon: Camera, grad: 'from-indigo-500 to-cyan-500' },
  ];

  const sectionTitles: Record<string, string> = {
    workout: t('nav.workouts'),
    cardio: t('nav.cardio'),
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
  const LANGS: { code: 'en' | 'fr' | 'ar'; short: string; labelKey: string }[] = [
    { code: 'en', short: 'EN', labelKey: 'modern.langEnglish' },
    { code: 'fr', short: 'FR', labelKey: 'modern.langFrench' },
    { code: 'ar', short: 'AR', labelKey: 'modern.langArabic' },
  ];
  const currentLang = LANGS.find((l) => l.code === locale) ?? LANGS[0];
  const HeaderToggles = (
    <div className="flex items-center gap-2 shrink-0">
      <div className="relative" ref={langMenuRef}>
        <button
          type="button"
          onClick={() => setLangMenuOpen((v) => !v)}
          className="h-[38px] px-2.5 rounded-xl flex items-center gap-1.5 text-[11px] font-bold transition-transform duration-150 active:scale-90"
          style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
          aria-label={t('modern.language')}
          aria-haspopup="listbox"
          aria-expanded={langMenuOpen}
        >
          <Languages className="w-4 h-4" />
          {currentLang.short}
        </button>
        {langMenuOpen && (
          <div
            role="listbox"
            className="absolute top-[44px] z-50 min-w-[150px] rounded-xl overflow-hidden shadow-xl"
            style={{
              [isRtl ? 'left' : 'right']: 0,
              background: 'var(--surface-1)',
              border: '1px solid var(--hair)',
            } as React.CSSProperties}
          >
            <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt-mid)' }}>
              {t('modern.language')}
            </div>
            {LANGS.map((l) => {
              const active = l.code === locale;
              return (
                <button
                  key={l.code}
                  type="button"
                  role="option"
                  aria-selected={active}
                  onClick={() => {
                    setLocale(l.code);
                    setLangMenuOpen(false);
                  }}
                  className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors"
                  style={{
                    color: active ? 'var(--txt-hi)' : 'var(--txt-mid)',
                    background: active ? 'var(--glass)' : 'transparent',
                    fontWeight: active ? 700 : 500,
                  }}
                >
                  <span className="flex items-center gap-2">
                    <span className="text-[11px] font-bold w-6 text-start" style={{ color: 'var(--red)' }}>{l.short}</span>
                    {t(l.labelKey)}
                  </span>
                  {active && <Check className="w-4 h-4" style={{ color: 'var(--red)' }} />}
                </button>
              );
            })}
          </div>
        )}
      </div>
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
      />

      {/* ============ HOME DASHBOARD (hub) ============ */}
      {route === 'home' && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 pb-16">
          {/* Header — avatar, name, language, notifications menu */}
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
            <div className="relative shrink-0" ref={langMenuRef}>
              <button
                type="button"
                onClick={() => setLangMenuOpen((v) => !v)}
                className="h-[38px] px-[11px] rounded-xl flex items-center gap-1.5 text-[12px] font-bold transition-transform duration-150 active:scale-90"
                style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                aria-label={t('modern.language')}
                aria-haspopup="listbox"
                aria-expanded={langMenuOpen}
              >
                <Languages className="w-3.5 h-3.5" />
                {currentLang.short}
              </button>
              {langMenuOpen && (
                <div
                  role="listbox"
                  className="absolute top-[44px] z-50 min-w-[150px] rounded-xl overflow-hidden shadow-xl"
                  style={{
                    [isRtl ? 'left' : 'right']: 0,
                    background: 'var(--surface-1)',
                    border: '1px solid var(--hair)',
                  } as React.CSSProperties}
                >
                  <div className="px-3 pt-2 pb-1 text-[10px] uppercase tracking-wide" style={{ color: 'var(--txt-mid)' }}>
                    {t('modern.language')}
                  </div>
                  {LANGS.map((l) => {
                    const active = l.code === locale;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        role="option"
                        aria-selected={active}
                        onClick={() => {
                          setLocale(l.code);
                          setLangMenuOpen(false);
                        }}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 text-sm transition-colors"
                        style={{
                          color: active ? 'var(--txt-hi)' : 'var(--txt-mid)',
                          background: active ? 'var(--glass)' : 'transparent',
                          fontWeight: active ? 700 : 500,
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <span className="text-[11px] font-bold w-6 text-start" style={{ color: 'var(--red)' }}>{l.short}</span>
                          {t(l.labelKey)}
                        </span>
                        {active && <Check className="w-4 h-4" style={{ color: 'var(--red)' }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className="relative shrink-0" ref={notifMenuRef}>
              <button
                type="button"
                onClick={() => setNotifMenuOpen((v) => !v)}
                className="w-[38px] h-[38px] rounded-xl flex items-center justify-center transition-transform duration-150 active:scale-90 relative"
                style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                aria-label={t('home.notifications')}
              >
                <Bell className="w-[18px] h-[18px]" />
                <span
                  className="absolute top-2 end-2.5 w-[7px] h-[7px] rounded-full"
                  style={{ background: 'var(--red)', boxShadow: '0 0 0 2px var(--bg)' }}
                />
              </button>
              {notifMenuOpen && (
                <div
                  className="absolute top-[44px] z-50 min-w-[200px] rounded-xl overflow-hidden shadow-xl py-1"
                  style={{
                    [isRtl ? 'left' : 'right']: 0,
                    background: 'var(--surface-1)',
                    border: '1px solid var(--hair)',
                  } as React.CSSProperties}
                >
                  <button
                    type="button"
                    onClick={() => { setShowHelpGuide(true); setNotifMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-start"
                    style={{ color: 'var(--txt-hi)' }}
                  >
                    <BookOpen className="w-4 h-4" style={{ color: 'var(--red)' }} />
                    {t('home.fullGuide')}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowWelcome(true); setNotifMenuOpen(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-start"
                    style={{ color: 'var(--txt-hi)' }}
                  >
                    <HelpCircle className="w-4 h-4" style={{ color: 'var(--red)' }} />
                    {t('home.helpTour')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setUseDarkTheme((p) => !p)}
                    className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-start"
                    style={{ color: 'var(--txt-hi)' }}
                  >
                    {useDarkTheme ? <Sun className="w-4 h-4" style={{ color: 'var(--amber)' }} /> : <Moon className="w-4 h-4" style={{ color: 'var(--blue)' }} />}
                    {t('home.themeToggle')}
                  </button>
                  <div className="my-1 h-px" style={{ background: 'var(--hair)' }} />
                  <p className="px-3 py-2 text-[12px]" style={{ color: 'var(--txt-lo)' }}>{t('home.noNotifications')}</p>
                </div>
              )}
            </div>
          </div>

          <p className="home-prompt home-anim" style={{ animationDelay: '0.03s' }}>
            <b>{t('home.subtitle')}</b>
          </p>

          {/* Program progress — simple */}
          <div className="home-prog home-anim" style={{ animationDelay: '0.06s' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[10.5px] uppercase tracking-widest font-bold" style={{ color: 'var(--txt-lo)' }}>
                {t('home.programProgress')}
              </span>
              <span className="font-display font-bold text-[13px] tnum" style={{ color: 'var(--txt-hi)' }}>
                {progressPercentage}%
              </span>
            </div>
            <div className="home-prog-track" aria-hidden="true">
              <div
                className="home-prog-fill"
                style={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
              />
            </div>
            <p className="text-[12px] mt-2 font-medium" style={{ color: 'var(--txt-mid)' }}>
              {t('modern.weekOf', { current: activeWeek, total: totalWeeks })}
              {activeWeek >= totalWeeks ? ` · ${t('home.finalWeek')}` : ''}
            </p>
          </div>

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
                jumpToActiveTrainingWeek(activeWeek);
                navigate('workout');
              }}
            >
              {t('home.openWorkouts')}
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
                    className="w-full h-full rounded-[14px] flex items-center justify-center overflow-hidden"
                    style={{ background: '#ffffff' }}
                  >
                    <img src="/brand-logo.png" alt="" className="w-[74%] h-[74%] object-contain" />
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
          ) : activeTab === 'cardio' ? (
            <ErrorBoundary>
              <ClientCardioView client={client} isDark={isDark} />
            </ErrorBoundary>
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
            <div className="photos-shell px-1">
              <div className="photos-summary">
                <div className="photos-summary-icon">
                  <Camera className="w-[22px] h-[22px]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-saira font-semibold text-[18px] truncate" style={{ color: 'var(--txt-hi)' }}>
                    {t('nav.photos')}
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
    </div>
  );
};

function WeightSparkline({ points }: { points: number[] }) {
  const w = 88;
  const h = 44;
  const pts = points.length >= 2
    ? points
    : [0.78, 0.68, 0.72, 0.5, 0.45, 0.32, 0.22, 0.12];
  const step = pts.length > 1 ? (w - 4) / (pts.length - 1) : w - 4;
  const toY = (p: number) => 4 + p * (h - 8);
  const lineD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${2 + i * step},${toY(p)}`).join(' ');
  const areaD = `${lineD} L${2 + (pts.length - 1) * step},${h} L2,${h} Z`;
  const lastX = 2 + (pts.length - 1) * step;
  const lastY = toY(pts[pts.length - 1]);
  return (
    <svg className="shrink-0 w-[88px] h-[44px]" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id="homeSparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="rgba(91,140,255,.35)" />
          <stop offset="1" stopColor="rgba(91,140,255,0)" />
        </linearGradient>
      </defs>
      <path d={areaD} fill="url(#homeSparkGrad)" />
      <path d={lineD} fill="none" stroke="#5b8cff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={lastX} cy={lastY} r="3" fill="#5b8cff" />
    </svg>
  );
}

export default ModernClientInterface;
