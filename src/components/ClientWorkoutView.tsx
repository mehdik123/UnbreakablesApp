import React, { useState, useEffect, memo, useCallback, useRef } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { 
  Dumbbell, 
  Clock,
  CheckCircle,
  Circle,
  Zap,
  Flame,
  Lock,
  Plus,
  Minus,
  Heart,
  Save,
  ChevronDown
} from 'lucide-react';
import { Client, WorkoutProgram } from '../types';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import {
  enqueueWorkoutSync,
  isAppOnline,
  patchClientOfflineSnapshot,
} from '../lib/offlineStore';
import { ExerciseVideoEmbed } from './ExerciseVideoEmbed';
import { getLatestDeployedWeekNumber } from '../utils/weekCreation';
import { persistClientsLocally, safeLocalStorageSet } from '../utils/localStorageClients';
import {
  loadClientWeightUnit,
  persistClientWeightUnit,
  saveClientWeightUnitPreference,
  toDisplayWeight,
  toStorageKg,
  weightStep,
  type WeightUnit,
} from '../utils/weightUnits';

interface ClientWorkoutViewProps {
  client: Client;
  currentWeek: number;
  isDark: boolean;
  onWeekChange?: (week: number) => void;
  /** Called when assignment is saved or loaded so parent (e.g. charts) can use latest data */
  onAssignmentUpdated?: (assignment: ClientWorkoutAssignment) => void;
}

interface ClientWorkoutAssignment {
  program: WorkoutProgram;
  weeks?: any[];
  lastModifiedBy?: string;
  lastModifiedAt?: Date | string;
  currentWeek?: number;
  currentDay?: number;
  lastSavedWeek?: number;
  lastSavedDay?: number;
  duration?: number;
}

interface ClientWorkoutViewCombinedProps {
  clientView: {
    clientName: string;
    workoutAssignment: ClientWorkoutAssignment;
    isReadOnly: boolean;
    canEditRepsWeights: boolean;
  };
  isDark: boolean;
}

export const ClientWorkoutView: React.FC<ClientWorkoutViewProps> = memo(({
  client,
  currentWeek,
  onWeekChange,
  onAssignmentUpdated
}) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [weekStripOpen, setWeekStripOpen] = useState(false);
  const [dayStripOpen, setDayStripOpen] = useState(true);
  const [completedExercises, setCompletedExercises] = useState<{ [exerciseId: string]: boolean }>({});
  const [exerciseData, setExerciseData] = useState<{ [exerciseId: string]: { [setIndex: number]: { reps: number; weight: number } } }>({});
  const [dropsetData, setDropsetData] = useState<{ [exerciseId: string]: { [dropsetIndex: number]: { [roundIndex: number]: { reps: number; weight: number } } } }>({});
  const [editingWeightInput, setEditingWeightInput] = useState<Record<string, string>>({});
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const { t } = useClientLocale();
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const SHARED_KEY = `client_${client.id}_assignment`;
  const [sharedVersion, setSharedVersion] = useState<number>(0);
  // Local state to track the assignment so we can update it after client edits
  const [localAssignment, setLocalAssignment] = useState<ClientWorkoutAssignment | null>(client.workoutAssignment || null);
  const [exerciseSaveState, setExerciseSaveState] = useState<{ [exerciseId: string]: 'saving' | 'saved' }>({});
  const [activeVideoExerciseId, setActiveVideoExerciseId] = useState<string | null>(null);
  const dayResumeDoneRef = useRef(false);
  const [weightUnit, setWeightUnit] = useState<WeightUnit>(() =>
    loadClientWeightUnit(client.id, client.workoutAssignment)
  );

  useEffect(() => {
    setWeightUnit(loadClientWeightUnit(client.id, localAssignment || client.workoutAssignment));
  }, [client.id, client.workoutAssignment?.weightUnit, localAssignment?.weightUnit]);

  useEffect(() => {
    const onUnit = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.clientId === client.id && (detail.unit === 'kg' || detail.unit === 'lbs')) {
        setWeightUnit(detail.unit);
      }
    };
    window.addEventListener('client-weight-unit-changed', onUnit);
    return () => window.removeEventListener('client-weight-unit-changed', onUnit);
  }, [client.id]);

  const unitLabel = weightUnit === 'lbs' ? t('workout.lbs') : t('workout.kg');

  const handleWeightUnitChange = (unit: WeightUnit) => {
    setWeightUnit(unit);
    persistClientWeightUnit(client.id, unit);
    setLocalAssignment((prev) => (prev ? { ...prev, weightUnit: unit } : prev));
    void saveClientWeightUnitPreference({
      clientId: client.id,
      unit,
      assignmentId,
      assignment: (localAssignment || client.workoutAssignment) as any,
    });
  };

  // Marketing screenshots: scroll so the requested block is in frame (form demo by default, or sets)
  useEffect(() => {
    if (client.id !== 'marketing-demo') return;
    const focus = new URLSearchParams(window.location.search).get('focus');
    if (focus === 'none') return;
    const selector = focus === 'sets' ? '[data-marketing-sets]' : '[data-marketing-form-demo]';
    const id = window.setTimeout(() => {
      document.querySelector<HTMLElement>(selector)?.scrollIntoView({
        block: focus === 'sets' ? 'start' : 'center',
        behavior: 'instant' as ScrollBehavior,
      });
    }, 900);
    return () => window.clearTimeout(id);
  }, [client.id, currentDay, currentWeek]);

  // Performance tracking
  const { recordExercise } = usePerformanceTracking({
    clientId: client.id,
    workoutAssignmentId: assignmentId || 'temp-id',
    onVolumeUpdate: () => {
      // Trigger re-render of progress chart
    }
  });

  // Horizontal scroll for workout days
  const { scrollRef: daysScrollRef, scrollBy: scrollDaysBy } = useHorizontalScroll({
    scrollStep: 128,
    snapToItems: true,
    enableSwipe: true,
  });


  // Function to enrich program with video URLs from Supabase exercises table
  const enrichProgramWithVideoUrls = async (program: any) => {
    try {
      if (!isSupabaseReady || !supabase) return program;
      if (!program || !program.days || !Array.isArray(program.days)) return program;
      
      // Get all exercises from Supabase
      const { data: dbExercises } = await supabase
        .from('exercises')
        .select('name, video_url, muscle_group');
      
      if (!dbExercises) return program;
      
      const exerciseMap = new Map<string, { video_url?: string; muscle_group?: string }>();
      dbExercises.forEach((ex: any) => {
        if (ex?.name) {
          exerciseMap.set(ex.name.trim().toLowerCase(), ex);
          exerciseMap.set(ex.name, ex);
        }
      });
      const lookup = (name: string) =>
        exerciseMap.get(name) || (name && exerciseMap.get(name.trim().toLowerCase()));

      const enrichedProgram = {
        ...program,
        days: program.days?.map((day: any) => ({
          ...day,
          exercises: (day.exercises || []).map((workoutEx: any) => {
            const name = workoutEx.exercise?.name || workoutEx.exercise?.id || workoutEx.name;
            const dbExercise = name ? lookup(name) : null;
            if (dbExercise) {
              return {
                ...workoutEx,
                exercise: {
                  ...workoutEx.exercise,
                  videoUrl: dbExercise.video_url ?? workoutEx.exercise?.videoUrl,
                  muscleGroup: dbExercise.muscle_group ?? workoutEx.exercise?.muscleGroup,
                },
              };
            }
            return workoutEx;
          }),
        })) || [],
      };
      
      return enrichedProgram;
    } catch (error) {
      console.error('❌ Failed to enrich program with video URLs:', error);
      return program;
    }
  };


  // Real-time sync - Prefer Supabase assignment, fallback to localStorage
  useEffect(() => {
    (async () => {
      if (isSupabaseReady && supabase) {
        try {
          // Try client_id by client.id first (e.g. share link), then by name lookup
          let clientDbId: string | null = null;
          if (client.id) {
            const byId = await supabase
              .from('clients')
              .select('id')
              .eq('id', client.id)
              .maybeSingle();
            if (byId?.data?.id) clientDbId = byId.data.id;
          }
          if (!clientDbId) {
            const byName = await supabase
              .from('clients')
              .select('id')
              .eq('full_name', client.name)
              .maybeSingle();
            if (byName?.data?.id) clientDbId = byName.data.id;
          }
          if (clientDbId) {
            const { data: asg } = await supabase
              .from('workout_assignments')
              .select('id, program_json, current_week, current_day, version, last_modified_by')
              .eq('client_id', clientDbId)
              .eq('is_active', true)
              .order('last_modified_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (asg?.id) {
              setAssignmentId(asg.id);
              if (asg.program_json) {
                const raw = asg.program_json as any;
                // program_json is the full assignment { program: { days }, weeks }; enrich the program that has .days so videoUrl is attached
                const programWithDays = raw.program?.days ? raw.program : raw.days ? raw : null;
                const programToEnrich = programWithDays || raw.program || raw;
                const enrichedProgram = await enrichProgramWithVideoUrls(programToEnrich);
                setWorkoutProgram(enrichedProgram as WorkoutProgram);
                const weeks = raw.weeks || (raw.days ? [{ weekNumber: 1, isUnlocked: true, isCompleted: false, days: raw.days, exercises: [] }] : []);
                const loaded = {
                  program: enrichedProgram,
                  weeks,
                  lastModifiedBy: raw.lastModifiedBy ?? (asg as any).last_modified_by,
                  lastModifiedAt: raw.lastModifiedAt,
                  currentWeek: asg.current_week,
                  currentDay: asg.current_day,
                  lastSavedDay: raw.lastSavedDay,
                  lastSavedWeek: raw.lastSavedWeek,
                  duration: raw.duration,
                } as any;
                setLocalAssignment(loaded);
                onAssignmentUpdated?.(loaded);
              }
              setSharedVersion(asg.version || 0);
              return;
            }
          }
        } catch {}
      }
      // Fallback to local storage or prop
      try {
        const sharedRaw = localStorage.getItem(SHARED_KEY);
        let programToSet: WorkoutProgram | null = null;
        let assignmentForNext: any = client.workoutAssignment || null;
        
        if (sharedRaw) {
          const shared = JSON.parse(sharedRaw);
          if (shared?.workoutAssignment?.program) {
            programToSet = shared.workoutAssignment.program;
            assignmentForNext = shared.workoutAssignment;
            setSharedVersion(shared.version || 0);
          }
        } else if (client.workoutAssignment?.program) {
          programToSet = client.workoutAssignment.program;
        }

        // Merge current week's data if available
        if (programToSet) {
          // Ensure program has a valid days array
          if (!programToSet.days || !Array.isArray(programToSet.days)) {
            programToSet = {
              ...programToSet,
              days: []
            };
          }
          
          const currentWeekData = assignmentForNext?.weeks?.find((w: any) => w.weekNumber === currentWeek);
          if (currentWeekData && currentWeekData.days && Array.isArray(currentWeekData.days) && currentWeekData.days.length > 0) {
            programToSet = {
              ...programToSet,
              days: programToSet.days.map((day: any, dayIndex: number) => {
                const weekDay = currentWeekData.days[dayIndex];
                return weekDay || day;
              })
            };
          }
          setWorkoutProgram(programToSet);
        }
      } catch {}
    })();

    if (!isSupabaseReady || !supabase || !assignmentId) {
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key !== SHARED_KEY) return;
        try {
          const shared = e.newValue ? JSON.parse(e.newValue) : null;
          if (!shared) return;
          if (typeof shared.version === 'number' && shared.version <= sharedVersion) return;
          if (shared?.workoutAssignment?.program) {
            setWorkoutProgram(shared.workoutAssignment.program);
            setSharedVersion(shared.version || 0);
          }
        } catch {}
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [client.id, client.name, assignmentId, SHARED_KEY]);

  // Supabase realtime subscription for automatic updates
  useEffect(() => {
    if (isSupabaseReady && supabase && assignmentId) {
      const channel = supabase!
        .channel(`assignment-${assignmentId}-client`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'workout_assignments',
          filter: `id=eq.${assignmentId}`
        }, async (payload) => {
          const row: any = payload.new;
          if (!row.program_json) return;
          if (row.last_modified_by === 'client') return;
          const raw = row.program_json as any;
          const programWithDays = raw.program?.days ? raw.program : raw.days ? raw : null;
          const programToEnrich = programWithDays || raw.program || raw;
          const enrichedProgram = await enrichProgramWithVideoUrls(programToEnrich);
          const weeks = raw.weeks ?? (raw.days?.length ? [{ weekNumber: 1, isUnlocked: true, isCompleted: false, days: raw.days, exercises: [] }] : []);
          const updated = {
            program: enrichedProgram,
            weeks,
            lastModifiedBy: raw.lastModifiedBy ?? row.last_modified_by,
            lastModifiedAt: raw.lastModifiedAt,
            currentWeek: row.current_week,
            currentDay: row.current_day,
            lastSavedDay: raw.lastSavedDay,
            lastSavedWeek: raw.lastSavedWeek,
            duration: raw.duration,
          } as any;
          setWorkoutProgram(enrichedProgram as WorkoutProgram);
          setLocalAssignment(updated);
          setSharedVersion(row.version || 0);
          onAssignmentUpdated?.(updated);
          // Keep the client on the day they're viewing; home uses lastSaved* for next session
        })
        .subscribe();
      return () => { 
        supabase?.removeChannel(channel); 
      };
    }
  }, [assignmentId, onAssignmentUpdated]);

  // Sync localAssignment with client prop when it changes
  useEffect(() => {
    if (client.workoutAssignment) {
      setLocalAssignment(client.workoutAssignment);
    }
  }, [client.workoutAssignment]);

  // Initialize completedExercises from persisted set.completed in current week (replace when week changes)
  useEffect(() => {
    const assignment = localAssignment || client.workoutAssignment;
    const weekData = assignment?.weeks?.find((w: any) => w.weekNumber === currentWeek);
    const days = weekData?.days;
    const next: { [exerciseId: string]: boolean } = {};
    if (days && Array.isArray(days)) {
      days.forEach((day: any) => {
        (day.exercises || []).forEach((ex: any) => {
          const allSetsComplete = (ex.sets || []).every((s: any) => s.completed === true);
          if (allSetsComplete && ex.id) next[ex.id] = true;
        });
      });
    }
    setCompletedExercises(next);
  }, [currentWeek, localAssignment?.weeks, client.workoutAssignment?.weeks]);

  // D1 — Resume last saved day when assignment loads for the current week
  useEffect(() => {
    if (dayResumeDoneRef.current) return;
    const assignment = localAssignment || client.workoutAssignment;
    if (!assignment) return;
    const lastWeek = assignment.lastSavedWeek;
    const lastDay = assignment.lastSavedDay;
    if (lastWeek == null || lastDay == null || lastWeek !== currentWeek) return;

    const weekData = assignment.weeks?.find((w: any) => w.weekNumber === currentWeek);
    const daysLen =
      (weekData?.days && Array.isArray(weekData.days) && weekData.days.length) ||
      (assignment.program?.days && Array.isArray(assignment.program.days) && assignment.program.days.length) ||
      (workoutProgram?.days && Array.isArray(workoutProgram.days) && workoutProgram.days.length) ||
      0;
    const idx = lastDay - 1;
    if (idx >= 0 && idx < daysLen) {
      setCurrentDay(idx);
      dayResumeDoneRef.current = true;
    }
  }, [localAssignment, client.workoutAssignment, currentWeek, workoutProgram]);

  // D2 — Prefill empty sets from previous week same day (only when no local edit yet)
  useEffect(() => {
    const assignment = localAssignment || client.workoutAssignment;
    if (!assignment?.weeks || currentWeek <= 1) return;
    const prevWeek = assignment.weeks.find((w: any) => w.weekNumber === currentWeek - 1);
    const currWeekData = assignment.weeks.find((w: any) => w.weekNumber === currentWeek);
    const prevDay = prevWeek?.days?.[currentDay];
    const currDay = currWeekData?.days?.[currentDay];
    if (!prevDay?.exercises || !currDay?.exercises) return;

    const isEmptyNum = (v: unknown) =>
      v == null || v === '' || v === 0 || (Array.isArray(v) && (v.length === 0 || v.every((x) => !x)));

    setExerciseData((prev) => {
      let changed = false;
      const next = { ...prev };

      (currDay.exercises as any[]).forEach((ex: any) => {
        if (!ex?.id) return;
        const name = (ex.exercise?.name || ex.name || '').toString().trim().toLowerCase();
        const prevEx = (prevDay.exercises as any[]).find((pe: any) => {
          if (pe.id && pe.id === ex.id) return true;
          const pn = (pe.exercise?.name || pe.name || '').toString().trim().toLowerCase();
          return !!name && pn === name;
        });
        if (!prevEx?.sets) return;

        const setMap: { [setIndex: number]: { reps: number; weight: number } } = {
          ...(next[ex.id] || {}),
        };
        let exerciseChanged = false;

        (ex.sets || []).forEach((set: any, setIndex: number) => {
          if (set?.isDropset) return;
          if (prev[ex.id]?.[setIndex]) return; // client already edited this set
          if (!isEmptyNum(set.reps) || !isEmptyNum(set.weight)) return;

          const prevSet = prevEx.sets[setIndex];
          if (!prevSet) return;
          const prevReps = Array.isArray(prevSet.reps)
            ? Number(prevSet.reps[0]) || 0
            : Number(prevSet.reps) || 0;
          const prevWeight = Array.isArray(prevSet.weight)
            ? Number(prevSet.weight[0]) || 0
            : Number(prevSet.weight) || 0;
          if (!prevReps && !prevWeight) return;

          setMap[setIndex] = { reps: prevReps, weight: prevWeight };
          exerciseChanged = true;
          changed = true;
        });

        if (exerciseChanged) next[ex.id] = setMap;
      });

      return changed ? next : prev;
    });
  }, [currentWeek, currentDay, localAssignment?.weeks, client.workoutAssignment?.weeks]);

  // Merge week-specific data into the program for display. Prefer week's days when present so we never show empty after save.
  const getCurrentWeekProgram = (): WorkoutProgram => {
    const assignment = localAssignment || client.workoutAssignment;
    const baseProgram = workoutProgram || assignment?.program;
    const currentWeekData = assignment?.weeks?.find((w: any) => w.weekNumber === currentWeek);
    const weekDays = currentWeekData?.days && Array.isArray(currentWeekData.days) ? currentWeekData.days : null;

    // If we have week-specific days, use them directly. Merge videoUrl/muscleGroup by exercise name so videos persist after edits and week order differs.
    if (weekDays && weekDays.length > 0) {
      const baseDays = baseProgram?.days && Array.isArray(baseProgram.days) ? baseProgram.days : [];
      const byName: Record<string, { videoUrl?: string; muscleGroup?: string }> = {};
      baseDays.forEach((d: any) => {
        (d.exercises || []).forEach((ex: any) => {
          const name = (ex.exercise?.name ?? ex.exercise?.id ?? ex.name ?? '').toString().trim().toLowerCase();
          if (name && (ex.exercise?.videoUrl || ex.exercise?.muscleGroup)) {
            byName[name] = {
              videoUrl: ex.exercise?.videoUrl ?? byName[name]?.videoUrl,
              muscleGroup: ex.exercise?.muscleGroup ?? byName[name]?.muscleGroup,
            };
          }
        });
      });
      const daysWithVideos = weekDays.map((weekDay: any) => {
        return {
          ...weekDay,
          exercises: (weekDay.exercises || []).map((ex: any) => {
            const name = (ex.exercise?.name ?? ex.exercise?.id ?? ex.name ?? '').toString().trim().toLowerCase();
            const meta = name ? byName[name] : null;
            return {
              ...ex,
              exercise: {
                ...ex.exercise,
                videoUrl: meta?.videoUrl ?? ex.exercise?.videoUrl,
                muscleGroup: meta?.muscleGroup ?? ex.exercise?.muscleGroup,
              },
            };
          }),
        };
      });
      return {
        ...(baseProgram || { id: '', name: '', description: '', days: [], createdAt: new Date(), updatedAt: new Date() }),
        days: daysWithVideos,
      } as WorkoutProgram;
    }

    if (!baseProgram || !baseProgram.days || !Array.isArray(baseProgram.days)) {
      return {
        id: 'ppl-program',
        name: 'Push Pull Legs',
        description: '3-day split focusing on push, pull, and leg movements',
        duration: 12,
        days: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      } as WorkoutProgram;
    }

    return {
      ...baseProgram,
      days: baseProgram.days,
    };
  };

  // Use assigned workout program or fallback to mock data
  const currentWorkoutProgram = getCurrentWeekProgram();
  
  // Heuristic: detect obviously old data (fallback sample IDs or missing videoUrl)
  // Only show old data warning if we have exercises but no video URLs AND no Supabase assignment
  const hasSupabaseAssignment = assignmentId && workoutProgram;
  const isUsingOldData =
    client.id !== 'marketing-demo' &&
    !hasSupabaseAssignment &&
    currentWorkoutProgram?.days?.some((day) => day.exercises?.some((ex) => !ex.exercise?.videoUrl));
  
  
  // Check if using old data (not CSV data)

  const currentDayData = currentWorkoutProgram?.days?.[currentDay];
  const isDayUnlocked = true;

  const deployedWeeks = (localAssignment?.weeks || client.workoutAssignment?.weeks || []) as { weekNumber: number; isCompleted?: boolean }[];
  const currentWeekData = deployedWeeks.find((w) => w.weekNumber === currentWeek);
  const isCurrentWeekComplete = currentWeekData?.isCompleted === true;
  const hasNextWeek = deployedWeeks.some((w) => w.weekNumber === currentWeek + 1);
  const showWaitingForCoach = isCurrentWeekComplete && !hasNextWeek;

  // Program is built week-by-week by the coach: figure out whether more weeks are still to come
  const totalProgramWeeks = client.numberOfWeeks || 12;
  /** Latest deployed week = "current" for tags (not the week the client is browsing) */
  const programCurrentWeek = getLatestDeployedWeekNumber(
    localAssignment || client.workoutAssignment
  );
  const maxDeployedWeek = programCurrentWeek;
  const nextWeekNumber = maxDeployedWeek + 1;
  const moreWeeksComing = nextWeekNumber <= totalProgramWeeks;

  // Week strip is view-only navigation — do not persist current_week (that snaps the client back on sync)
  const handleWeekSelect = useCallback(
    (newWeek: number) => {
      onWeekChange?.(newWeek);
    },
    [onWeekChange]
  );

  // If no workout program is assigned, show a message
  if (!workoutProgram && !client.workoutAssignment?.program) {
  return (
      <div className="px-3 sm:px-4 py-10">
        <div className="workout-empty">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(255,45,85,.12)' }}
          >
            <Dumbbell className="w-8 h-8" style={{ color: 'var(--red)' }} />
          </div>
          <h3 className="font-saira text-xl font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>
            {t('workout.noPlanTitle')}
          </h3>
          <p className="text-sm mb-5 leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {t('workout.noPlanBody')}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2.5 rounded-[12px] text-white text-sm font-semibold active:scale-[0.97] transition-transform"
            style={{ background: 'var(--grad-red)' }}
          >
            {t('workout.clearReload')}
          </button>
        </div>
      </div>
    );
  }

  // Show warning if using old data
  if (isUsingOldData) {
    return (
      <div className="space-y-6">
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-6 text-center">
          <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-yellow-400" />
          </div>
          <h3 className="text-xl font-semibold text-yellow-400 mb-2">
            {t('workout.oldDataTitle')}
          </h3>
          <p className="text-yellow-300 mb-4">
            {t('workout.oldDataBody')}
          </p>
          <div className="space-x-2">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
            >
              {t('workout.clearReload')}
            </button>
          </div>
        </div>
      </div>
    );
  }



  const persistExerciseCompletion = async (exerciseId: string, completed: boolean) => {
    const assignment = localAssignment || client.workoutAssignment;
    if (!assignment?.weeks) return;
    const now = new Date().toISOString();
    const updatedWeeks = assignment.weeks.map((w: any) => {
      if (w.weekNumber !== currentWeek) return w;
      return {
        ...w,
        days: (w.days || []).map((day: any) => ({
          ...day,
          exercises: (day.exercises || []).map((ex: any) =>
            ex.id !== exerciseId
              ? ex
              : {
                  ...ex,
                  sets: (ex.sets || []).map((s: any) => ({
                    ...s,
                    completed: completed,
                    completedAt: completed ? now : undefined,
                  })),
                }
          ),
        })),
      };
    });
    const updatedAssignment = {
      ...assignment,
      weeks: updatedWeeks,
      lastModifiedBy: 'client' as const,
      lastModifiedAt: new Date(),
    };
    if (assignmentId) {
      const payload = {
        program_json: updatedAssignment as any,
        last_modified_by: 'client',
      };
      if (isAppOnline() && isSupabaseReady && supabase) {
        const { error } = await supabase
          .from('workout_assignments')
          .update({
            ...payload,
            version: (sharedVersion || 0) + 1,
          })
          .eq('id', assignmentId);
        if (error) {
          enqueueWorkoutSync(client.id, {
            type: 'workout_assignment',
            assignmentId,
            payload,
          });
        }
      } else {
        enqueueWorkoutSync(client.id, {
          type: 'workout_assignment',
          assignmentId,
          payload,
        });
      }
    }
    safeLocalStorageSet(SHARED_KEY, JSON.stringify({ workoutAssignment: updatedAssignment, version: (sharedVersion || 0) + 1, lastModified: new Date().toISOString() }));
    setSharedVersion((v) => v + 1);
    setLocalAssignment(updatedAssignment);
    patchClientOfflineSnapshot(client.id, {
      client: { ...client, workoutAssignment: updatedAssignment as any },
    });
  };

  const completeExercise = (exerciseId: string) => {
    const isCurrentlyCompleted = completedExercises[exerciseId];
    const newCompletedState = !isCurrentlyCompleted;
    
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: newCompletedState
    }));

    persistExerciseCompletion(exerciseId, newCompletedState);

    // Record performance data when exercise is completed
    if (newCompletedState && workoutProgram) {
      const currentDayData = workoutProgram.days[currentDay];
      const exercise = currentDayData?.exercises.find(ex => ex.id === exerciseId);
      
      if (exercise) {
        const actualSets = exercise.sets.map((set, setIndex) => {
          const exerciseDataForSet = exerciseData[exerciseId]?.[setIndex];
          // Handle dropsets: if reps/weight are arrays, use the first value or sum
          const defaultReps = Array.isArray(set.reps) ? set.reps[0] || 0 : (typeof set.reps === 'number' ? set.reps : 0);
          const defaultWeight = Array.isArray(set.weight) ? set.weight[0] || 0 : (typeof set.weight === 'number' ? set.weight : 0);
          return {
            setId: set.id,
            actualReps: exerciseDataForSet?.reps ?? defaultReps,
            actualWeight: exerciseDataForSet?.weight ?? defaultWeight,
            completed: true
          };
        });

        recordExercise(
          currentWeek,
          currentDay + 1, // dayNumber is 1-based
          exerciseId,
          exercise.exercise.name,
          exercise.exercise.muscleGroup,
          actualSets,
          exercise.sets
        );

        console.log('📊 WORKOUT VIEW - Exercise completed and performance recorded:', {
          exerciseName: exercise.exercise.name,
          muscleGroup: exercise.exercise.muscleGroup,
          weekNumber: currentWeek,
          dayNumber: currentDay + 1,
          actualSets: actualSets.length
        });
      }
    }
  };

  const updateExerciseData = (
    exerciseId: string,
    setIndex: number,
    field: 'reps' | 'weight',
    value: number,
    prescribed?: { reps?: number | number[]; weight?: number | number[] }
  ) => {
    setExerciseData(prev => {
      const existing = prev[exerciseId]?.[setIndex];
      const seedReps =
        existing?.reps ??
        (typeof prescribed?.reps === 'number' ? prescribed.reps : 0);
      const seedWeight =
        existing?.weight ??
        (typeof prescribed?.weight === 'number' ? prescribed.weight : 0);
      return {
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          [setIndex]: {
            reps: seedReps,
            weight: seedWeight,
            [field]: value,
          },
        },
      };
    });
  };

  const updateDropsetData = (exerciseId: string, dropsetIndex: number, roundIndex: number, field: 'reps' | 'weight', value: number) => {
    setDropsetData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [dropsetIndex]: {
          ...prev[exerciseId]?.[dropsetIndex],
          [roundIndex]: {
            ...prev[exerciseId]?.[dropsetIndex]?.[roundIndex],
            [field]: value
          }
        }
      }
    }));
  };

  /**
   * Typed weight fields keep raw display strings until blur.
   * Mobile/desktop often fire Save before blur — merge pending inputs as kg here
   * so "Save my numbers" never drops lbs (or kg) edits.
   */
  const collectWeightEditsForSave = () => {
    const mergedExercise: {
      [exerciseId: string]: { [setIndex: number]: { reps?: number; weight?: number } };
    } = {};
    for (const [exId, sets] of Object.entries(exerciseData)) {
      mergedExercise[exId] = {};
      for (const [setIdx, vals] of Object.entries(sets)) {
        mergedExercise[exId][Number(setIdx)] = { ...vals };
      }
    }

    const mergedDropset: typeof dropsetData = {};
    for (const [exId, bySet] of Object.entries(dropsetData)) {
      mergedDropset[exId] = {};
      for (const [setIdx, byRound] of Object.entries(bySet)) {
        mergedDropset[exId][Number(setIdx)] = {};
        for (const [roundIdx, vals] of Object.entries(byRound)) {
          mergedDropset[exId][Number(setIdx)][Number(roundIdx)] = { ...vals };
        }
      }
    }

    for (const [key, raw] of Object.entries(editingWeightInput)) {
      if (raw === undefined) continue;
      const parsed = parseFloat(String(raw).replace(',', '.'));
      if (!Number.isFinite(parsed)) continue;
      const kg = toStorageKg(Math.max(0, parsed), weightUnit);

      const dropSuffix = key.match(/-(\d+)-d(\d+)$/);
      if (dropSuffix && dropSuffix.index != null) {
        const exerciseId = key.slice(0, dropSuffix.index);
        const setIndex = Number(dropSuffix[1]);
        const roundIndex = Number(dropSuffix[2]);
        if (!mergedDropset[exerciseId]) mergedDropset[exerciseId] = {};
        if (!mergedDropset[exerciseId][setIndex]) mergedDropset[exerciseId][setIndex] = {};
        mergedDropset[exerciseId][setIndex][roundIndex] = {
          ...(mergedDropset[exerciseId][setIndex][roundIndex] || {}),
          weight: kg,
        };
        continue;
      }

      const normalSuffix = key.match(/-(\d+)$/);
      if (normalSuffix && normalSuffix.index != null) {
        const exerciseId = key.slice(0, normalSuffix.index);
        const setIndex = Number(normalSuffix[1]);
        if (!mergedExercise[exerciseId]) mergedExercise[exerciseId] = {};
        mergedExercise[exerciseId][setIndex] = {
          ...(mergedExercise[exerciseId][setIndex] || {}),
          weight: kg,
        };
      }
    }

    return { mergedExercise, mergedDropset };
  };

  const isHumanReadableSupersetName = (name: unknown): name is string => {
    if (typeof name !== 'string' || !name.trim()) return false;
    const s = name.trim();
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s)) return false;
    if (/^[0-9a-f]{16,}$/i.test(s)) return false;
    if (/\s/.test(s) && /[a-zA-Z]/.test(s)) return true;
    return s.length > 2 && /[a-zA-Z]/.test(s) && !/^[a-z0-9_-]{8,}$/i.test(s);
  };

  /** First working set reps/weight from previous week, same day, matching exercise */
  const getLastSessionStats = (exercise: any): { reps: number; weight: number } | null => {
    const assignment = localAssignment || client.workoutAssignment;
    if (!assignment?.weeks || currentWeek <= 1) return null;
    const prevWeek = assignment.weeks.find((w: any) => w.weekNumber === currentWeek - 1);
    const prevDay = prevWeek?.days?.[currentDay];
    if (!prevDay?.exercises) return null;
    const name = (exercise.exercise?.name || exercise.name || '').toString().trim().toLowerCase();
    const prevEx = (prevDay.exercises as any[]).find((pe: any) => {
      if (pe.id && pe.id === exercise.id) return true;
      const pn = (pe.exercise?.name || pe.name || '').toString().trim().toLowerCase();
      return !!name && pn === name;
    });
    if (!prevEx?.sets?.length) return null;
    for (const set of prevEx.sets) {
      if (set?.isDropset) continue;
      const reps = Array.isArray(set.reps) ? Number(set.reps[0]) || 0 : Number(set.reps) || 0;
      const weight = Array.isArray(set.weight) ? Number(set.weight[0]) || 0 : Number(set.weight) || 0;
      if (reps || weight) return { reps, weight };
    }
    return null;
  };

  // Save client edits to workout assignment (called when user clicks Save)
  const saveClientEdits = async () => {
    const assignment = localAssignment || client.workoutAssignment;
    const programToUse = workoutProgram || assignment?.program;
    // Use display program when base program has no days (e.g. multi-week: data lives in weeks[].days only)
    const displayProgram = getCurrentWeekProgram();

    if (!assignment) {
      console.warn('⚠️ Cannot save: Missing assignment');
      return;
    }

    try {
      // Get current week's data or create new - use deep copy to avoid mutations
      const existingWeeks = assignment.weeks 
        ? assignment.weeks.map((w: any) => ({
            ...w,
            days: w.days?.map((day: any) => ({
              ...day,
              exercises: day.exercises?.map((ex: any) => ({
                ...ex,
                sets: ex.sets?.map((set: any) => ({ ...set }))
              }))
            }))
          }))
        : [];
      
      let currentWeekData = existingWeeks.find((w: any) => w.weekNumber === currentWeek);

      // Source days: week-specific, or what we're actually displaying (displayProgram.days), or program template
      const programDays = programToUse?.days && Array.isArray(programToUse.days) ? programToUse.days : [];
      const displayDays = displayProgram?.days && Array.isArray(displayProgram.days) ? displayProgram.days : [];
      const sourceDays = currentWeekData?.days && Array.isArray(currentWeekData.days) && currentWeekData.days.length > 0
        ? currentWeekData.days
        : (displayDays.length > 0 ? displayDays : programDays);

      if (!sourceDays || sourceDays.length === 0) {
        console.warn('⚠️ Cannot save: No valid days data for current week');
        return;
      }

      // Build videoUrl/muscleGroup lookup (from program or display so we have something)
      const baseDays = programDays.length > 0 ? programDays : displayDays;
      const videoByName: Record<string, { videoUrl?: string; muscleGroup?: string }> = {};
      baseDays.forEach((d: any) => {
        (d.exercises || []).forEach((ex: any) => {
          const n = (ex.exercise?.name ?? ex.exercise?.id ?? ex.name ?? '').toString().trim().toLowerCase();
          if (n && (ex.exercise?.videoUrl || ex.exercise?.muscleGroup)) {
            videoByName[n] = {
              videoUrl: ex.exercise?.videoUrl ?? videoByName[n]?.videoUrl,
              muscleGroup: ex.exercise?.muscleGroup ?? videoByName[n]?.muscleGroup,
            };
          }
        });
      });

      // Create updated days with client's edits applied and videoUrl/muscleGroup preserved so videos don't disappear after save
      const { mergedExercise, mergedDropset } = collectWeightEditsForSave();
      const updatedDays = sourceDays.map((day: any, dayIndex: number) => ({
        ...day,
        // Mark only the day being saved — prescribed weights on other/new weeks do not count
        ...(dayIndex === currentDay ? { numbersSaved: true } : {}),
        exercises: (day.exercises && Array.isArray(day.exercises) ? day.exercises : []).map((exercise: any) => {
          const exName = (exercise.exercise?.name ?? exercise.exercise?.id ?? exercise.name ?? '').toString().trim().toLowerCase();
          const videoMeta = exName ? videoByName[exName] : null;
          // Get client's edits for this exercise (includes pending typed lbs/kg not yet blurred)
          const exerciseEdits = mergedExercise[exercise.id] || {};
          const dropsetEdits = mergedDropset[exercise.id] || {};

          return {
            ...exercise,
            exercise: {
              ...exercise.exercise,
              videoUrl: videoMeta?.videoUrl ?? exercise.exercise?.videoUrl,
              muscleGroup: videoMeta?.muscleGroup ?? exercise.exercise?.muscleGroup,
            },
            sets: (exercise.sets && Array.isArray(exercise.sets) ? exercise.sets : []).map((set: any, setIndex: number) => {
              // Dropsets must use per-round edits — never overwrite arrays with scalar exerciseData
              if (set.isDropset && Array.isArray(set.reps)) {
                const dropsetEdit = dropsetEdits[setIndex];
                const weightBase = Array.isArray(set.weight)
                  ? set.weight
                  : set.reps.map(() => (typeof set.weight === 'number' ? set.weight : 0));
                if (dropsetEdit) {
                  return {
                    ...set,
                    reps: set.reps.map((rep: any, roundIndex: number) => dropsetEdit[roundIndex]?.reps ?? rep),
                    weight: weightBase.map((weight: any, roundIndex: number) => dropsetEdit[roundIndex]?.weight ?? weight),
                  };
                }
                return { ...set, weight: weightBase };
              }

              const edit = exerciseEdits[setIndex];
              if (edit && (edit.weight !== undefined || edit.reps !== undefined)) {
                return {
                  ...set,
                  reps: edit.reps !== undefined ? edit.reps : set.reps,
                  weight: edit.weight !== undefined ? edit.weight : set.weight,
                };
              }

              return { ...set }; // Deep copy to avoid mutations
            })
          };
        })
      }));

      // Sync React state with what we actually persisted (pending typed fields included)
      setExerciseData((prev) => {
        const next = { ...prev };
        for (const [exId, sets] of Object.entries(mergedExercise)) {
          next[exId] = { ...(next[exId] || {}) };
          for (const [setIdx, vals] of Object.entries(sets)) {
            const i = Number(setIdx);
            next[exId][i] = {
              ...next[exId][i],
              ...(vals.reps !== undefined ? { reps: vals.reps } : {}),
              ...(vals.weight !== undefined ? { weight: vals.weight } : {}),
            };
          }
        }
        return next;
      });
      setDropsetData(mergedDropset);
      setEditingWeightInput({});

      // Update or create current week data
      if (!currentWeekData) {
        currentWeekData = {
          weekNumber: currentWeek,
          isUnlocked: true,
          isCompleted: false,
          exercises: [],
          days: updatedDays
        };
        existingWeeks.push(currentWeekData);
      } else {
        // Update existing week data - create new object to avoid mutations
        const weekIndex = existingWeeks.findIndex((w: any) => w.weekNumber === currentWeek);
        if (weekIndex !== -1) {
          existingWeeks[weekIndex] = {
            ...currentWeekData,
            days: updatedDays
          };
        }
      }

      // Prefer a program that has valid .days so post-save validation passes
      const programWithDays = (displayProgram?.days && Array.isArray(displayProgram.days))
        ? displayProgram
        : (assignment.program?.days && Array.isArray(assignment.program.days))
          ? assignment.program
          : (programToUse?.days && Array.isArray(programToUse.days))
            ? programToUse
            : { ...(assignment.program || programToUse || {}), days: updatedDays };
      const updatedAssignment = {
        ...assignment,
        // Keep weeks as source of truth; also mirror this week's saved days onto program.days
        // so reloads never fall back to stale prescribed kg values.
        program: {
          ...programWithDays,
          days: updatedDays,
        },
        weeks: existingWeeks,
        lastModifiedBy: 'client' as const,
        lastModifiedAt: new Date(),
        currentWeek,
        currentDay: currentDay + 1,
        lastSavedWeek: currentWeek,
        lastSavedDay: currentDay + 1,
        weightUnit,
      };

      // Save to Supabase if available (full assignment so coach and charts see client's edits)
      if (assignmentId) {
        const payload = {
          program_json: updatedAssignment as any,
          current_week: currentWeek,
          current_day: currentDay + 1,
          last_modified_by: 'client',
        };
        if (isAppOnline()) {
          const { dbUpdateWorkoutAssignment } = await import('../lib/db');
          const { error } = await dbUpdateWorkoutAssignment(assignmentId, payload);
          if (error) {
            enqueueWorkoutSync(client.id, {
              type: 'workout_assignment',
              assignmentId,
              payload,
            });
          }
        } else {
          enqueueWorkoutSync(client.id, {
            type: 'workout_assignment',
            assignmentId,
            payload,
          });
        }
      }

      // Save to localStorage for real-time sync
      const sharedData = {
        workoutAssignment: updatedAssignment,
        version: (sharedVersion || 0) + 1,
        lastModified: new Date().toISOString()
      };
      safeLocalStorageSet(SHARED_KEY, JSON.stringify(sharedData));
      setSharedVersion(prev => prev + 1);

      patchClientOfflineSnapshot(client.id, {
        client: { ...client, workoutAssignment: updatedAssignment as any },
      });

      // Update client in clients list (offline cache only; skipped when Supabase is ready)
      const clientsRaw = localStorage.getItem('clients');
      if (clientsRaw) {
        try {
          const clients = JSON.parse(clientsRaw);
          const updated = Array.isArray(clients)
            ? clients.map((c: any) => (c.id === client.id ? { ...c, workoutAssignment: updatedAssignment } : c))
            : clients;
          persistClientsLocally(updated);
        } catch {
          /* ignore corrupt cache */
        }
      }

      // Ensure the updated assignment has a valid program (with .days array) before updating state
      if (!updatedAssignment.program || !Array.isArray(updatedAssignment.program.days)) {
        console.error('❌ Invalid program structure in updated assignment');
        return;
      }

      // Update local assignment state so getCurrentWeekProgram() can see the updated week data
      setLocalAssignment(updatedAssignment);
      onAssignmentUpdated?.(updatedAssignment as ClientWorkoutAssignment);

      // DO NOT update workoutProgram state - it should remain as the template
      // The getCurrentWeekProgram() function will merge week-specific data when displaying
      // This ensures the original program structure is preserved

      console.log('✅ Client edits saved successfully', {
        hasProgram: !!updatedAssignment.program,
        programDays: updatedAssignment.program?.days?.length,
        weeksCount: updatedAssignment.weeks?.length
      });
    } catch (error) {
      console.error('❌ Error saving client edits:', error);
    }
  };

  const getDayStatus = (dayIndex: number) => {
    const dayExercises = currentWorkoutProgram.days[dayIndex].exercises;
    const completedCount = dayExercises.filter(ex => completedExercises[ex.id]).length;
    const totalCount = dayExercises.length;
    
    if (completedCount === 0) return 'not-started';
    if (completedCount === totalCount) return 'completed';
    return 'in-progress';
  };

  const getDayStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'in-progress': return <Clock className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const handleSaveExercise = async (exerciseId: string) => {
    // Commit any focused weight field before save (esp. important for lbs typing).
    try {
      (document.activeElement as HTMLElement | null)?.blur?.();
    } catch {
      /* ignore */
    }
    setExerciseSaveState(prev => ({ ...prev, [exerciseId]: 'saving' }));
    try {
      await saveClientEdits();
      setExerciseSaveState(prev => ({ ...prev, [exerciseId]: 'saved' }));
      navigator.vibrate?.(8);
      setTimeout(() => {
        setExerciseSaveState(prev => {
          const next = { ...prev };
          delete next[exerciseId];
          return next;
        });
      }, 2000);
    } catch {
      setExerciseSaveState(prev => {
        const next = { ...prev };
        delete next[exerciseId];
        return next;
      });
    }
  };

  // Helper to clear stale cached workout data for this client only
  const clearClientCachedWorkout = () => {
    try {
      // Remove shared assignment key
      localStorage.removeItem(SHARED_KEY);
      // Remove legacy keys
      const legacyPrefix = `client_${client.id}_complete_`;
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(legacyPrefix)) localStorage.removeItem(key);
      });
      // Clean client entry in clients list
      const clientsRaw = localStorage.getItem('clients');
      if (clientsRaw) {
        try {
          const clients = JSON.parse(clientsRaw);
          const updated = Array.isArray(clients)
            ? clients.map((c: any) => (c.id === client.id ? { ...c, workoutAssignment: null } : c))
            : clients;
          persistClientsLocally(updated);
        } catch {
          /* ignore */
        }
      }
      
      // Reload the page to refresh data
      window.location.reload();
    } catch {}
  };

  return (
    <div className="workout-shell min-h-[100dvh] overflow-x-hidden relative">

      {/* Banner to clear cached data when old data is detected */}
      {isUsingOldData && (
        <div className="px-4 py-3 bg-amber-600/20 border-b border-amber-600/30 text-amber-200 flex items-center justify-between">
          <span className="text-sm">{t('workout.cacheBanner')}</span>
            <button
            onClick={clearClientCachedWorkout}
            className="px-3 py-1 bg-amber-500/30 hover:bg-amber-500/40 rounded text-xs"
          >
            {t('workout.clearCached')}
          </button>
        </div>
      )}

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4 sm:space-y-6 pb-20 max-w-full overflow-x-hidden">
        {/* Weight unit — client preference (loads stored as kg; UI converts) */}
        <div
          className="flex items-center justify-between gap-3 rounded-[15px] px-3 py-2.5 min-h-12"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
        >
          <span className="text-[11px] font-semibold uppercase tracking-[0.12em]" style={{ color: 'var(--txt-lo)' }}>
            {t('workout.weightUnit')}
          </span>
          <div className="flex gap-1 p-0.5 rounded-[12px]" style={{ background: 'var(--surface-3)' }}>
            {(['kg', 'lbs'] as WeightUnit[]).map((u) => {
              const active = weightUnit === u;
              return (
                <button
                  key={u}
                  type="button"
                  onClick={() => handleWeightUnitChange(u)}
                  className="min-h-10 min-w-[3.25rem] px-3 rounded-[10px] text-[13px] font-bold touch-manipulation"
                  style={{
                    background: active ? 'var(--grad-red)' : 'transparent',
                    color: active ? '#fff' : 'var(--txt-mid)',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                >
                  {u === 'lbs' ? t('workout.lbs') : t('workout.kg')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Week navigation - collapsed into a pill by default to reduce clutter */}
        {deployedWeeks.length > 0 && onWeekChange && (
          <div>
            <button
              type="button"
              onClick={() => setWeekStripOpen((o) => !o)}
              className="workout-week-toggle"
              aria-expanded={weekStripOpen}
            >
              <span className="flex items-baseline gap-2 min-w-0">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--txt-lo)' }}>
                  {t('workout.trainingWeek')}
                </span>
                <span className="font-saira font-semibold text-[14px]" style={{ color: 'var(--txt-hi)' }}>
                  {t('workout.weekOfTotal', { current: currentWeek, total: totalProgramWeeks })}
                </span>
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform duration-200 ${weekStripOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--txt-lo)' }}
              />
            </button>

            {weekStripOpen && (
              <div
                className="flex gap-1 p-1 mt-2 overflow-x-auto scrollbar-hide rounded-[15px]"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
              >
                {deployedWeeks.map((w) => {
                  const isViewing = w.weekNumber === currentWeek;
                  const isProgramCurrent = w.weekNumber === programCurrentWeek;
                  const done = w.weekNumber < programCurrentWeek;
                  const label = isProgramCurrent
                    ? t('workout.wkCurrent')
                    : done
                    ? t('workout.wkDone')
                    : t('workout.wkSoon');
                  return (
                    <button
                      key={w.weekNumber}
                      onClick={() => {
                        handleWeekSelect(w.weekNumber);
                        setWeekStripOpen(false);
                      }}
                      className={`flex-1 min-w-[64px] text-center py-2 rounded-[11px] text-[13px] font-semibold transition-all duration-200 ${
                        isViewing ? 'text-white bg-grad-red shadow-red' : ''
                      }`}
                      style={isViewing ? undefined : { color: 'var(--txt-mid)' }}
                    >
                      <span
                        className="block text-[9px] font-semibold uppercase tracking-[0.1em] mb-0.5"
                        style={{
                          color: isViewing
                            ? 'rgba(255,255,255,.75)'
                            : isProgramCurrent
                            ? 'var(--red)'
                            : done
                            ? 'var(--emerald)'
                            : 'var(--txt-lo)',
                        }}
                      >
                        {label}
                      </span>
                      {t('workout.weekN', { n: w.weekNumber })}
                    </button>
                  );
                })}
                {moreWeeksComing && (
                  <div
                    className="flex-1 min-w-[64px] text-center py-2 rounded-[11px] text-[13px] font-semibold select-none"
                    style={{ color: 'var(--txt-lo)', border: '1px dashed var(--hair-strong)' }}
                    aria-disabled="true"
                  >
                    <span
                      className="block text-[9px] font-semibold uppercase tracking-[0.1em] mb-0.5"
                      style={{ color: 'var(--txt-lo)' }}
                    >
                      {t('workout.wkSoon')}
                    </span>
                    {t('workout.weekN', { n: nextWeekNumber })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Next week — Mehdi builds the program week by week */}
        {moreWeeksComing && (
          <div
            className="rounded-2xl p-4 flex items-center gap-3"
            style={{ background: 'var(--surface-1)', border: '1px dashed var(--hair-strong)' }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(255,138,92,.14)' }}
            >
              {showWaitingForCoach ? (
                <Zap className="w-5 h-5" style={{ color: '#ff8a5c' }} />
              ) : (
                <Lock className="w-5 h-5" style={{ color: 'var(--txt-lo)' }} />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display font-semibold text-[14px]" style={{ color: 'var(--txt-hi)' }}>
                {showWaitingForCoach ? t('workout.preparingTitle') : t('workout.nextWeekComing', { n: nextWeekNumber })}
              </p>
              <p className="text-[12.5px] mt-0.5 leading-snug" style={{ color: 'var(--txt-mid)' }}>
                {showWaitingForCoach ? t('workout.preparingDesc') : t('workout.nextWeekDesc', { current: currentWeek })}
              </p>
            </div>
          </div>
        )}

        {/* Day Navigation - collapsed by default (same pattern as week strip) */}
        <div>
          <button
            type="button"
            onClick={() => setDayStripOpen((o) => !o)}
            className="workout-week-toggle"
            aria-expanded={dayStripOpen}
            style={{ minHeight: 44 }}
          >
            <span className="flex flex-col items-start gap-0.5 min-w-0">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color: 'var(--txt-lo)' }}>
                {t('workout.changeWeekDay')}
              </span>
              <span className="font-saira font-semibold text-[14px] truncate" style={{ color: 'var(--txt-hi)' }}>
                {currentDayData
                  ? `${currentDayData.name} · ${t('workout.nExercises', { count: currentDayData.exercises.length })}`
                  : t('workout.selectDay')}
              </span>
            </span>
            <ChevronDown
              className={`w-4 h-4 shrink-0 transition-transform duration-200 ${dayStripOpen ? 'rotate-180' : ''}`}
              style={{ color: 'var(--txt-lo)' }}
            />
          </button>

          {dayStripOpen && (
          <div className="mt-2">
          {/* Horizontal Scrolling Days */}
          <div className="relative">
            <div
              ref={daysScrollRef}
              data-horizontal-scroll="true"
              className="overflow-x-auto scrollbar-hide wk-day-strip"
              style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
            >
              <div className="flex gap-2 pb-1 min-w-max px-0.5">
                {currentWorkoutProgram?.days?.map((day, index) => {
                  const status = getDayStatus(index);
                  const isCurrentDay = index === currentDay;
                  const isCompleted = status === 'completed';
                  const total = day.exercises.length;
                  const completedCount = day.exercises.filter((ex) => completedExercises[ex.id]).length;
                  const muscles = Array.from(
                    new Set(
                      day.exercises
                        .map((ex) => (ex.exercise as any)?.muscleGroup)
                        .filter(Boolean)
                        .map((m: string) => m.charAt(0).toUpperCase() + m.slice(1))
                    )
                  );
                  const subline = muscles.length ? muscles.slice(0, 2).join(' · ') : t('workout.nExercises', { count: total });
                  const statusText =
                    completedCount > 0
                      ? t('workout.ofComplete', { done: completedCount, total })
                      : t('workout.nExercises', { count: total });

                  return (
                    <button
                      key={day.id}
                      type="button"
                      data-scroll-item
                      onClick={() => {
                        setCurrentDay(index);
                        setDayStripOpen(false);
                      }}
                      disabled={!isDayUnlocked}
                      className={`group relative flex-shrink-0 w-[118px] sm:w-[132px] text-left p-2.5 sm:p-3 rounded-[14px] transition-all duration-200 active:scale-[0.97] ${
                        isCurrentDay ? 'shadow-glow-red' : ''
                      } ${!isDayUnlocked ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={{
                        scrollSnapAlign: 'start',
                        background: isCurrentDay
                          ? 'radial-gradient(120% 100% at 0% 0%, rgba(255,45,85,.22), transparent 60%), var(--surface-2)'
                          : 'var(--surface-1)',
                        border: isCurrentDay ? '1px solid rgba(255,45,85,.4)' : '1px solid var(--hair)',
                      }}
                    >
                      {isCurrentDay && (
                        <span
                          className="wk-live-dot absolute top-2.5 right-2.5 w-2 h-2 rounded-full"
                          style={{ background: 'var(--red)' }}
                        />
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-all duration-200"
                          style={{
                            background: isCurrentDay ? 'var(--grad-red)' : isCompleted ? 'rgba(52,211,153,.1)' : 'var(--surface-3)',
                            border: isCurrentDay ? '1px solid transparent' : isCompleted ? '1px solid rgba(52,211,153,.3)' : '1px solid var(--hair)',
                            color: isCurrentDay ? '#fff' : isCompleted ? 'var(--emerald)' : 'var(--txt-mid)',
                          }}
                        >
                          {isDayUnlocked ? getDayStatusIcon(status) : <Lock className="w-3.5 h-3.5" />}
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-[0.08em]"
                          style={{ color: isCurrentDay ? 'var(--red)' : 'var(--txt-lo)' }}
                        >
                          {t('wt.day', { n: index + 1 })}
                        </span>
                      </div>
                      <div className="font-saira font-semibold text-[13px] sm:text-[14px] leading-tight truncate" style={{ color: 'var(--txt-hi)' }}>
                        {day.name}
                      </div>
                      <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--txt-mid)' }}>
                        {subline}
                      </div>
                      <div
                        className="mt-2 flex items-center gap-1 text-[10px] font-semibold"
                        style={{ color: isCurrentDay ? 'var(--red)' : completedCount > 0 ? 'var(--emerald)' : 'var(--txt-lo)' }}
                      >
                        {completedCount > 0 && <CheckCircle className="w-3 h-3" />}
                        {statusText}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Scroll buttons */}
            <button
              type="button"
              onClick={() => scrollDaysBy('left')}
              className="absolute top-1/2 -left-1 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-70 active:opacity-100 transition-all duration-200 z-10"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)', color: 'var(--txt-hi)' }}
              aria-label="Previous days"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => scrollDaysBy('right')}
              className="absolute top-1/2 -right-1 transform -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center opacity-70 active:opacity-100 transition-all duration-200 z-10"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)', color: 'var(--txt-hi)' }}
              aria-label="Next days"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          </div>
          )}

          {!isDayUnlocked && (
            <div className="workout-locked-banner">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(245, 158, 11, 0.18)' }}
                >
                  <Lock className="w-4 h-4 wk-lock-icon" style={{ color: 'rgb(251, 191, 36)' }} />
                </div>
                <div>
                  <p className="text-sm font-medium wk-lock-title">
                    {t('workout.weekLocked')}
                  </p>
                  <p className="text-xs mt-0.5 wk-lock-body">
                    {t('workout.weekLockedBody')}
                  </p>
                </div>
              </div>
        </div>
          )}
      </div>

        {/* Current Day Workout */}
        {isDayUnlocked && currentDayData && (
          <div className="space-y-6 sm:space-y-8">
            {/* Workout Header (today) */}
            <div className="workout-day-hero">
              <div
                className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center shrink-0 shadow-red"
                style={{ background: 'var(--grad-red)', color: '#fff' }}
              >
                <Dumbbell className="w-[22px] h-[22px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-saira font-semibold text-[20px] truncate" style={{ color: 'var(--txt-hi)' }}>
                  {currentDayData.name}
                </div>
                <div className="text-[11.5px] mt-1 truncate" style={{ color: 'var(--txt-mid)' }}>
                  {t('workout.weekExercises', { week: currentWeek, count: currentDayData.exercises.length })}
                </div>
              </div>
              <div className="text-center shrink-0">
                <div className="font-display font-bold text-[24px] leading-none tnum" style={{ color: 'var(--red)' }}>
                  {currentDayData.exercises.length}
                </div>
                <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--txt-lo)' }}>
                  {t('workout.exercises')}
                </div>
              </div>
            </div>

            {/* Today's exercises */}
            <div className="workout-seclabel">
              <span>{t('workout.todaysExercises')}</span>
              <span className="line" />
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              {currentDayData.exercises.map((exercise, exerciseIndex) => {
                const ssGroup = exercise.superset
                  ? currentDayData.exercises.filter((e: any) => e.superset === exercise.superset)
                  : [];
                const isSuperset = ssGroup.length >= 2;
                const ssPos = isSuperset ? ssGroup.findIndex((e: any) => e.id === exercise.id) : -1;
                const lastSession = getLastSessionStats(exercise);
                const rawSsName = (exercise as any).supersetName || exercise.superset;
                const ssLabel = isHumanReadableSupersetName(rawSsName)
                  ? `${t('workout.superset')} · ${rawSsName}`
                  : t('workout.superset');
                return (
                <div
                  key={exercise.id}
                  className="overflow-hidden rounded-[24px] transition-all duration-300 group"
                  style={{
                    background: 'var(--surface-1)',
                    border: '1px solid var(--hair)',
                    ...(isSuperset
                      ? {
                          borderLeft: '3px solid var(--blue)',
                          borderTopLeftRadius: ssPos === 0 ? '24px' : '12px',
                          borderTopRightRadius: ssPos === 0 ? '24px' : '12px',
                        }
                      : {}),
                  }}
                >
                  {/* Exercise Header */}
                  <div className="flex items-start gap-3 p-4 pb-3.5">
                    <div
                      className="w-[30px] h-[30px] rounded-[10px] flex items-center justify-center font-display font-bold text-[14px] shrink-0"
                      style={
                        completedExercises[exercise.id]
                          ? { background: 'rgba(52,211,153,.12)', border: '1px solid rgba(52,211,153,.3)', color: 'var(--emerald)' }
                          : { background: 'var(--surface-3)', border: '1px solid var(--hair-strong)', color: 'var(--txt-mid)' }
                      }
                    >
                      {exerciseIndex + 1}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-display font-semibold text-[16px] leading-tight truncate" style={{ color: 'var(--txt-hi)' }}>
                          {exercise.exercise.name}
                        </h5>
                        {exercise.superset && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white inline-flex items-center gap-1" style={{ background: 'linear-gradient(135deg,#3b82f6,#06b6d4)' }}>
                            <Zap className="w-2.5 h-2.5" />
                            {ssLabel}
                            {isSuperset && <span className="opacity-80">· {ssPos + 1}/{ssGroup.length}</span>}
                          </span>
                        )}
                      </div>
                      {lastSession && (
                        <p className="text-[12px] mt-1" style={{ color: 'var(--txt-lo)' }}>
                          {t('workout.lastTime', { reps: lastSession.reps, weight: lastSession.weight })}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 mt-2.5">
                        <span
                          className="inline-flex items-center gap-1.5 text-[10.5px] font-semibold px-2.5 py-1 rounded-lg capitalize"
                          style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                        >
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--blue)' }} />
                          {exercise.exercise.muscleGroup}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-lg capitalize"
                          style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
                        >
                          <Zap className="w-2.5 h-2.5" />
                          {exercise.exercise.equipment}
                        </span>
                        <span
                          className="inline-flex items-center gap-1 text-[10.5px] font-semibold px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(52,211,153,.08)', border: '1px solid rgba(52,211,153,.22)', color: 'var(--emerald)' }}
                        >
                          {t('workout.setsCount', { n: exercise.sets.length })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Form demo video — plays inline */}
                  <div {...(exerciseIndex === 0 ? { 'data-marketing-form-demo': true } : {})}>
                    <ExerciseVideoEmbed
                      videoUrl={exercise.exercise.videoUrl}
                      title={exercise.exercise.name}
                      formDemoLabel={t('workout.formDemo')}
                      watchDemoLabel={t('workout.watchDemo')}
                      offlineLabel={t('workout.videoOffline')}
                      isPlaying={activeVideoExerciseId === exercise.id}
                      onPlay={() => setActiveVideoExerciseId(exercise.id)}
                      onClose={() => setActiveVideoExerciseId(null)}
                      posterUrl={client.id === 'marketing-demo' ? '/marketing/mehdi-form-demo-cover.png' : undefined}
                    />
                  </div>

                  {/* Sets & Reps Section */}
                  <div className="space-y-2 sm:space-y-4 px-3 sm:px-4 pb-4" {...(exerciseIndex === 0 ? { 'data-marketing-sets': true } : {})}>
                      <div className="flex items-center justify-between mb-3 px-0.5">
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: 'var(--txt-hi)' }}>
                          <Dumbbell className="w-3.5 h-3.5" style={{ color: 'var(--red)' }} />
                          {t('workout.setsReps')}
                        </div>
                        <div className="text-[11px] font-semibold" style={{ color: 'var(--txt-mid)' }}>
                          {exercise.sets.length} {t('workout.sets')}
                        </div>
                      </div>

                      <div className="space-y-2.5">
                        {exercise.sets.map((set, setIndex) => {
                          const dropReps =
                            set.isDropset && Array.isArray(set.reps) ? (set.reps as number[]) : null;
                          const isDropset = !!dropReps && dropReps.length > 0;
                          const dropWeights: number[] = isDropset
                            ? (Array.isArray(set.weight)
                                ? set.weight.map((w) => (typeof w === 'number' ? w : 0))
                                : dropReps!.map(() => (typeof set.weight === 'number' ? set.weight : 0)))
                            : [];

                          if (isDropset && dropReps) {
                            return (
                              <div
                                key={setIndex}
                                className="rounded-[18px] p-2.5 sm:p-3 space-y-2"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-[8px] flex items-center justify-center font-display font-bold text-[11px] sm:text-[12px] shrink-0"
                                    style={{ background: 'var(--surface-3)', border: '1px solid var(--hair-strong)', color: 'var(--txt-mid)' }}
                                  >
                                    {setIndex + 1}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.1em]" style={{ color: 'var(--txt-lo)' }}>
                                      {t('workout.dropset')} · {t('workout.reps')}
                                    </div>
                                    <div className="font-display font-bold text-[13px] sm:text-[15px] tnum truncate" style={{ color: 'var(--txt-hi)' }}>
                                      {dropReps.join('→')}
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <div className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.1em] mb-1.5 pl-0.5" style={{ color: 'var(--txt-lo)' }}>
                                    {t('workout.weight')} ({unitLabel})
                                  </div>
                                  <div className="flex flex-wrap gap-1.5">
                                    {dropReps.map((_rep: number, roundIndex: number) => {
                                      const editKey = `${exercise.id}-${setIndex}-d${roundIndex}`;
                                      const prescribedKg = dropWeights[roundIndex] ?? 0;
                                      const currentKg =
                                        dropsetData[exercise.id]?.[setIndex]?.[roundIndex]?.weight ?? prescribedKg;
                                      const display = toDisplayWeight(
                                        typeof currentKg === 'number' ? currentKg : 0,
                                        weightUnit
                                      );
                                      const step = weightStep(weightUnit);
                                      return (
                                        <div
                                          key={roundIndex}
                                          className="flex items-center rounded-[10px] overflow-hidden min-h-11"
                                          style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)', flex: '1 1 5.5rem', maxWidth: '100%' }}
                                        >
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextKg = toStorageKg(Math.max(0, display - step), weightUnit);
                                              updateDropsetData(exercise.id, setIndex, roundIndex, 'weight', nextKg);
                                              setEditingWeightInput((prev) => {
                                                const n = { ...prev };
                                                delete n[editKey];
                                                return n;
                                              });
                                            }}
                                            className="wk-step flex items-center justify-center shrink-0 touch-manipulation"
                                            style={{ color: 'var(--blue)', WebkitTapHighlightColor: 'transparent' }}
                                            aria-label={`Decrease drop ${roundIndex + 1} weight`}
                                          >
                                            <Minus className="w-3.5 h-3.5" />
                                          </button>
                                          <div className="flex-1 min-w-0 flex items-baseline justify-center gap-0.5 px-0.5">
                                            <input
                                              type="number"
                                              min={0}
                                              step={weightUnit === 'lbs' ? 0.5 : 0.5}
                                              inputMode="decimal"
                                              placeholder="0"
                                              className="wk-weight-input bg-transparent text-center font-display font-bold text-[13px] sm:text-[14px] tnum w-full min-w-0
                                                focus:outline-none focus:ring-0
                                                [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                              style={{ color: 'var(--txt-hi)', fontSize: '16px' }}
                                              value={editingWeightInput[editKey] ?? String(display)}
                                              onChange={(e) => {
                                                setEditingWeightInput((prev) => ({
                                                  ...prev,
                                                  [editKey]: e.target.value,
                                                }));
                                              }}
                                              onBlur={() => {
                                                const raw = editingWeightInput[editKey];
                                                if (raw === undefined) return;
                                                const parsed = parseFloat(raw.replace(',', '.'));
                                                const displayVal = Number.isFinite(parsed)
                                                  ? Math.max(0, parsed)
                                                  : display;
                                                updateDropsetData(
                                                  exercise.id,
                                                  setIndex,
                                                  roundIndex,
                                                  'weight',
                                                  toStorageKg(displayVal, weightUnit)
                                                );
                                                setEditingWeightInput((prev) => {
                                                  const next = { ...prev };
                                                  delete next[editKey];
                                                  return next;
                                                });
                                              }}
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                              }}
                                              aria-label={`${t('workout.weightAria')} drop ${roundIndex + 1}`}
                                            />
                                            <span className="text-[9px] font-medium shrink-0" style={{ color: 'var(--txt-lo)' }}>
                                              {unitLabel}
                                            </span>
                                          </div>
                                          <button
                                            type="button"
                                            onClick={() => {
                                              const nextKg = toStorageKg(display + step, weightUnit);
                                              updateDropsetData(exercise.id, setIndex, roundIndex, 'weight', nextKg);
                                              setEditingWeightInput((prev) => {
                                                const n = { ...prev };
                                                delete n[editKey];
                                                return n;
                                              });
                                            }}
                                            className="wk-step flex items-center justify-center shrink-0 touch-manipulation"
                                            style={{ color: 'var(--red)', WebkitTapHighlightColor: 'transparent' }}
                                            aria-label={`Increase drop ${roundIndex + 1} weight`}
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            );
                          }

                          return (
                          <div
                            key={setIndex}
                            className="flex items-center gap-1.5 sm:gap-2.5 rounded-[18px] p-2 sm:p-3"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                          >
                            <div
                              className="w-[22px] h-[22px] sm:w-[26px] sm:h-[26px] rounded-[8px] flex items-center justify-center font-display font-bold text-[11px] sm:text-[12px] shrink-0"
                              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair-strong)', color: 'var(--txt-mid)' }}
                            >
                              {setIndex + 1}
                            </div>

                            {/* Reps stepper */}
                            <div className="flex-1 min-w-0 basis-0">
                              <div className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] mb-1 sm:mb-1.5 pl-0.5 flex items-center gap-1" style={{ color: 'var(--txt-lo)' }}>
                                {t('workout.reps')}
                              </div>
                              <div className="flex items-center rounded-[10px] sm:rounded-[11px] overflow-hidden" style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentReps = exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps;
                                    const newReps = typeof currentReps === 'number' ? Math.max(0, currentReps - 1) : 0;
                                    updateExerciseData(exercise.id, setIndex, 'reps', newReps, set);
                                  }}
                                  className="wk-step flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--blue)' }}
                                  aria-label="Decrease reps"
                                >
                                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                <div
                                  className="flex-1 min-w-0 text-center font-display font-bold tnum truncate px-0.5 text-[15px] sm:text-[17px]"
                                  style={{ color: 'var(--txt-hi)' }}
                                >
                                  {exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentReps = exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps;
                                    const newReps = typeof currentReps === 'number' ? currentReps + 1 : 1;
                                    updateExerciseData(exercise.id, setIndex, 'reps', newReps, set);
                                  }}
                                  className="wk-step flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--red)' }}
                                  aria-label="Increase reps"
                                >
                                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Weight stepper — values stored as kg; UI shows client unit */}
                            <div className="flex-[1.2] min-w-0 basis-0">
                              <div className="text-[8px] sm:text-[9px] font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] mb-1 sm:mb-1.5 pl-0.5" style={{ color: 'var(--txt-lo)' }}>
                                {t('workout.weight')}
                              </div>
                              <div className="flex items-center rounded-[10px] sm:rounded-[11px] overflow-hidden" style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const stored =
                                      exerciseData[exercise.id]?.[setIndex]?.weight ??
                                      (typeof set.weight === 'number' ? set.weight : 0);
                                    const display = toDisplayWeight(typeof stored === 'number' ? stored : 0, weightUnit);
                                    const nextKg = toStorageKg(
                                      Math.max(0, display - weightStep(weightUnit)),
                                      weightUnit
                                    );
                                    updateExerciseData(exercise.id, setIndex, 'weight', nextKg, set);
                                    setEditingWeightInput(prev => { const n = { ...prev }; delete n[`${exercise.id}-${setIndex}`]; return n; });
                                  }}
                                  className="wk-step flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--blue)' }}
                                  aria-label="Decrease weight"
                                >
                                  <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                                  <div className="flex-1 min-w-0 flex items-baseline justify-center gap-0.5 px-0.5">
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.5}
                                      inputMode="decimal"
                                      placeholder="0"
                                      className="wk-weight-input bg-transparent text-center font-display font-bold text-[13px] sm:text-[15px] tnum
                                        focus:outline-none focus:ring-0
                                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      style={{ color: 'var(--txt-hi)' }}
                                      value={
                                        editingWeightInput[`${exercise.id}-${setIndex}`] ??
                                        String(
                                          toDisplayWeight(
                                            typeof (
                                              exerciseData[exercise.id]?.[setIndex]?.weight ?? set.weight
                                            ) === 'number'
                                              ? ((exerciseData[exercise.id]?.[setIndex]?.weight ??
                                                  set.weight) as number)
                                              : 0,
                                            weightUnit
                                          )
                                        )
                                      }
                                      onChange={(e) => {
                                        setEditingWeightInput(prev => ({
                                          ...prev,
                                          [`${exercise.id}-${setIndex}`]: e.target.value,
                                        }));
                                      }}
                                      onBlur={() => {
                                        const key = `${exercise.id}-${setIndex}`;
                                        const raw = editingWeightInput[key];
                                        if (raw === undefined) return;
                                        const parsed = parseFloat(raw.replace(',', '.'));
                                        const fallbackKg =
                                          exerciseData[exercise.id]?.[setIndex]?.weight ??
                                          (typeof set.weight === 'number' ? set.weight : 0);
                                        const displayVal = Number.isFinite(parsed)
                                          ? Math.max(0, parsed)
                                          : toDisplayWeight(fallbackKg, weightUnit);
                                        updateExerciseData(
                                          exercise.id,
                                          setIndex,
                                          'weight',
                                          toStorageKg(displayVal, weightUnit),
                                          set
                                        );
                                        setEditingWeightInput(prev => {
                                          const next = { ...prev };
                                          delete next[key];
                                          return next;
                                        });
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                                      }}
                                      aria-label={t('workout.weightAria')}
                                    />
                                    <span className="text-[9px] sm:text-[10px] font-medium shrink-0" style={{ color: 'var(--txt-lo)' }}>{unitLabel}</span>
                                  </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const stored =
                                      exerciseData[exercise.id]?.[setIndex]?.weight ??
                                      (typeof set.weight === 'number' ? set.weight : 0);
                                    const display = toDisplayWeight(typeof stored === 'number' ? stored : 0, weightUnit);
                                    const nextKg = toStorageKg(display + weightStep(weightUnit), weightUnit);
                                    updateExerciseData(exercise.id, setIndex, 'weight', nextKg, set);
                                    setEditingWeightInput(prev => { const n = { ...prev }; delete n[`${exercise.id}-${setIndex}`]; return n; });
                                  }}
                                  className="wk-step flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--red)' }}
                                  aria-label={t('workout.increaseWeight')}
                                >
                                  <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          );
                        })}
                      </div>

                  {/* Save button for this exercise - saves performance to Supabase and updates coach + charts */}
                  <div className="pt-3" style={{ borderTop: '1px solid var(--hair)' }}>
                    {(() => {
                      const saveState = exerciseSaveState[exercise.id];
                      const isSaving = saveState === 'saving';
                      const isSaved = saveState === 'saved';
                      return (
                        <button
                          type="button"
                          onClick={() => handleSaveExercise(exercise.id)}
                          disabled={isSaving}
                          className="workout-save-btn disabled:cursor-not-allowed"
                          style={
                            isSaved
                              ? { background: 'linear-gradient(90deg, var(--emerald-deep), var(--emerald))', boxShadow: '0 12px 28px -10px rgba(52,211,153,.55)' }
                              : { background: 'var(--grad-red)', boxShadow: '0 12px 28px -10px rgba(255,45,85,.6)', opacity: isSaving ? 0.85 : 1 }
                          }
                        >
                          {isSaving ? (
                            <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                          ) : isSaved ? (
                            <CheckCircle className="w-[18px] h-[18px]" />
                          ) : (
                            <Save className="w-[18px] h-[18px]" />
                          )}
                          {isSaving ? t('workout.saving') : isSaved ? t('workout.saved') : t('workout.save')}
                        </button>
                      );
                    })()}
                  </div>
                </div>

                  {exercise.notes && (
                    <div className="mx-4 mb-4 p-4 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-blue-300 mb-2">{t('workout.exerciseNotes')}</h6>
                          <p className="text-blue-200 text-sm leading-relaxed">{exercise.notes}</p>
                        </div>
                      </div>
            </div>
          )}
                </div>
                );
              })}
            </div>
        </div>
      )}



        {/* Locked Day Message */}
        {!isDayUnlocked && (
          <div className="rounded-xl p-8 text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--surface-3)' }}>
              <Lock className="w-8 h-8" style={{ color: 'var(--txt-lo)' }} />
            </div>
            <h3 className="text-lg font-bold mb-3" style={{ color: 'var(--txt-hi)' }}>
              {t('workout.weekNLocked', { week: currentWeek })}
            </h3>
            <p className="text-sm mb-4" style={{ color: 'var(--txt-mid)' }}>
              {t('workout.weekLockedFull')}
            </p>
            <div className="flex items-center justify-center space-x-2" style={{ color: 'var(--txt-lo)' }}>
              <Flame className="w-4 h-4" />
              <span className="text-sm">{t('workout.keepPushing')}</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
});

ClientWorkoutView.displayName = 'ClientWorkoutView';

// Combined version for ClientCombinedView
export const ClientWorkoutViewCombined: React.FC<ClientWorkoutViewCombinedProps> = ({
  clientView,
  isDark
}) => {
  // Removed unlockedWeeks - using simplified logic

  // Update unlocked weeks based on workout assignment
  // Force refresh every 2 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Refresh data from localStorage
    }, 2000);

    return () => clearInterval(interval);
  }, [clientView.workoutAssignment]);

  // Create a client object from clientView
  const client: Client = {
    id: clientView.clientName, // Use clientName as fallback for id
    name: clientView.clientName,
    email: '',
    phone: '',
    goal: 'maintenance' as const,
    numberOfWeeks: 12,
    startDate: new Date(),
    isActive: true,
    favorites: [],
    weightLog: [],
    workoutAssignment: {
      ...clientView.workoutAssignment,
      id: 'temp-id',
      clientId: clientView.clientName,
      clientName: clientView.clientName,
      startDate: new Date(),
      duration: 12,
      currentWeek: 1,
      currentDay: 0,
      progressionRules: [],
      isActive: true,
      weeks: clientView.workoutAssignment.weeks || [],
      lastModifiedBy: clientView.workoutAssignment.lastModifiedBy as 'client' | 'coach' | undefined,
      lastModifiedAt:
        typeof clientView.workoutAssignment.lastModifiedAt === 'string'
          ? new Date(clientView.workoutAssignment.lastModifiedAt)
          : clientView.workoutAssignment.lastModifiedAt,
    },
    nutritionPlan: undefined // Will be loaded separately
  };

  return (
    <ClientWorkoutView
      client={client}
      currentWeek={1}
      isDark={isDark}
    />
  );
};

export default ClientWorkoutView;
