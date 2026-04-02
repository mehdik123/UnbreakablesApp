import React, { useState, useEffect, memo, useCallback } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { 
  Dumbbell, 
  Clock,
  Play,
  CheckCircle,
  Circle,
  Target,
  Zap,
  Flame,
  Lock,
  Calendar,
  Plus,
  Minus,
  Heart,
  Save
} from 'lucide-react';
import { Client, WorkoutProgram } from '../types';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';
import { useClientLocale } from '../contexts/ClientLocaleContext';

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
    scrollStep: 200,
    snapToItems: true,
    enableSwipe: true
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
              .select('id, program_json, current_week, current_day, version')
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
                // Keep local assignment in sync so getCurrentWeekProgram and saveClientEdits have correct shape
                const weeks = raw.weeks || (raw.days ? [{ weekNumber: 1, isUnlocked: true, isCompleted: false, days: raw.days, exercises: [] }] : []);
                const loaded = { program: enrichedProgram, weeks, lastModifiedBy: raw.lastModifiedBy, lastModifiedAt: raw.lastModifiedAt } as any;
                setLocalAssignment(loaded);
                onAssignmentUpdated?.(loaded);
              }
              if (typeof asg.current_day === 'number') setCurrentDay(Math.max(0, (asg.current_day || 1) - 1));
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
        
        if (sharedRaw) {
          const shared = JSON.parse(sharedRaw);
          if (shared?.workoutAssignment?.program) {
            programToSet = shared.workoutAssignment.program;
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
          
          const currentWeekData = client.workoutAssignment?.weeks?.find((w: any) => w.weekNumber === currentWeek);
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
  }, [client.id, client.name, assignmentId, SHARED_KEY, sharedVersion]);

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
          const updated = { program: enrichedProgram, weeks, lastModifiedBy: raw.lastModifiedBy, lastModifiedAt: raw.lastModifiedAt } as any;
          setWorkoutProgram(enrichedProgram as WorkoutProgram);
          setLocalAssignment(updated);
          setSharedVersion(row.version || 0);
          onAssignmentUpdated?.(updated);
          if (typeof row.current_week === 'number' && row.current_week !== currentWeek && onWeekChange) {
            onWeekChange(row.current_week);
          }
          if (typeof row.current_day === 'number' && row.current_day !== currentDay + 1) {
            setCurrentDay(Math.max(0, (row.current_day || 1) - 1));
          }
        })
        .subscribe();
      return () => { 
        supabase?.removeChannel(channel); 
      };
    }
  }, [assignmentId, currentWeek, currentDay, onAssignmentUpdated]);

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
  const isUsingOldData = !hasSupabaseAssignment && currentWorkoutProgram?.days?.some(day =>
    day.exercises?.some(ex => !ex.exercise?.videoUrl)
  );
  
  
  // Check if using old data (not CSV data)

  const currentDayData = currentWorkoutProgram?.days?.[currentDay];
  const isDayUnlocked = true;

  const deployedWeeks = (localAssignment?.weeks || client.workoutAssignment?.weeks || []) as { weekNumber: number; isCompleted?: boolean }[];
  const currentWeekData = deployedWeeks.find((w) => w.weekNumber === currentWeek);
  const isCurrentWeekComplete = currentWeekData?.isCompleted === true;
  const hasNextWeek = deployedWeeks.some((w) => w.weekNumber === currentWeek + 1);
  const showWaitingForCoach = isCurrentWeekComplete && !hasNextWeek;

  // When client selects a week: update UI immediately (parent may lock sync), then persist so polling/realtime match
  const handleWeekSelect = useCallback(
    async (newWeek: number) => {
      onWeekChange?.(newWeek);
      if (isSupabaseReady && supabase && assignmentId) {
        const { error } = await supabase
          .from('workout_assignments')
          .update({ current_week: newWeek, last_modified_by: 'client' })
          .eq('id', assignmentId);
        if (error) console.error('Failed to persist week selection:', error);
      }
    },
    [assignmentId, onWeekChange, isSupabaseReady, supabase]
  );

  // If no workout program is assigned, show a message
  if (!workoutProgram && !client.workoutAssignment?.program) {
  return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 lg:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            {t('workout.noPlanTitle')}
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
            {t('workout.noPlanBody')}
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg text-xs sm:text-sm"
            >
              {t('workout.clearReload')}
            </button>
          </div>
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
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
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
    if (isSupabaseReady && supabase && assignmentId) {
      await supabase
        .from('workout_assignments')
        .update({
          program_json: updatedAssignment as any,
          last_modified_by: 'client',
          version: (sharedVersion || 0) + 1,
        })
        .eq('id', assignmentId);
    }
    localStorage.setItem(SHARED_KEY, JSON.stringify({ workoutAssignment: updatedAssignment, version: (sharedVersion || 0) + 1, lastModified: new Date().toISOString() }));
    setSharedVersion((v) => v + 1);
    setLocalAssignment(updatedAssignment);
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
            actualReps: exerciseDataForSet?.reps || defaultReps,
            actualWeight: exerciseDataForSet?.weight || defaultWeight,
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

  const updateExerciseData = (exerciseId: string, setIndex: number, field: 'reps' | 'weight', value: number) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setIndex]: {
          ...prev[exerciseId]?.[setIndex],
          [field]: value
        }
      }
    }));
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
      const updatedDays = sourceDays.map((day: any) => ({
        ...day,
        exercises: (day.exercises && Array.isArray(day.exercises) ? day.exercises : []).map((exercise: any) => {
          const exName = (exercise.exercise?.name ?? exercise.exercise?.id ?? exercise.name ?? '').toString().trim().toLowerCase();
          const videoMeta = exName ? videoByName[exName] : null;
          // Get client's edits for this exercise
          const exerciseEdits = exerciseData[exercise.id] || {};
          const dropsetEdits = dropsetData[exercise.id] || {};

          return {
            ...exercise,
            exercise: {
              ...exercise.exercise,
              videoUrl: videoMeta?.videoUrl ?? exercise.exercise?.videoUrl,
              muscleGroup: videoMeta?.muscleGroup ?? exercise.exercise?.muscleGroup,
            },
            sets: (exercise.sets && Array.isArray(exercise.sets) ? exercise.sets : []).map((set: any, setIndex: number) => {
              // Apply regular set edits
              if (exerciseEdits[setIndex]) {
                return {
                  ...set,
                  reps: exerciseEdits[setIndex].reps ?? set.reps,
                  weight: exerciseEdits[setIndex].weight ?? set.weight
                };
              }

              // Apply dropset edits
              if (set.isDropset && dropsetEdits[setIndex] && Array.isArray(set.reps) && Array.isArray(set.weight)) {
                const dropsetEdit = dropsetEdits[setIndex];
                return {
                  ...set,
                  reps: set.reps.map((rep: any, roundIndex: number) => dropsetEdit[roundIndex]?.reps ?? rep),
                  weight: set.weight.map((weight: any, roundIndex: number) => dropsetEdit[roundIndex]?.weight ?? weight)
                };
              }

              return { ...set }; // Deep copy to avoid mutations
            })
          };
        })
      }));

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
        program: programWithDays,
        weeks: existingWeeks,
        lastModifiedBy: 'client' as const,
        lastModifiedAt: new Date()
      };

      // Save to Supabase if available (full assignment so coach and charts see client's edits)
      if (assignmentId) {
        const { dbUpdateWorkoutAssignment } = await import('../lib/db');
        await dbUpdateWorkoutAssignment(assignmentId, {
          program_json: updatedAssignment as any,
          current_week: currentWeek,
          current_day: currentDay + 1,
          last_modified_by: 'client'
        });
      }

      // Save to localStorage for real-time sync
      const sharedData = {
        workoutAssignment: updatedAssignment,
        version: (sharedVersion || 0) + 1,
        lastModified: new Date().toISOString()
      };
      localStorage.setItem(SHARED_KEY, JSON.stringify(sharedData));
      setSharedVersion(prev => prev + 1);

      // Update client in clients list
      const clientsRaw = localStorage.getItem('clients');
      if (clientsRaw) {
        const clients = JSON.parse(clientsRaw);
        const updated = Array.isArray(clients)
          ? clients.map((c: any) => (c.id === client.id ? { ...c, workoutAssignment: updatedAssignment } : c))
          : clients;
        localStorage.setItem('clients', JSON.stringify(updated));
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

  // Function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoUrl: string) => {
    if (!videoUrl) return null;
    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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
        const clients = JSON.parse(clientsRaw);
        const updated = Array.isArray(clients)
          ? clients.map((c: any) => (c.id === client.id ? { ...c, workoutAssignment: null } : c))
          : clients;
        localStorage.setItem('clients', JSON.stringify(updated));
      }
      
      // Reload the page to refresh data
      window.location.reload();
    } catch {}
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden relative">

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

      {/* Mobile Header - Responsive for all devices */}
      <div className="bg-slate-800 border-b border-slate-700/50">
        <div className="px-3 sm:px-4 py-3 sm:py-4 max-w-full">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <button className="p-1.5 sm:p-2 -ml-1 sm:-ml-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 className="text-base sm:text-lg font-semibold text-white truncate">{client.name}'s Program</h1>
            <div className="flex items-center space-x-1 sm:space-x-2">
              <button className="p-1.5 sm:p-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>
              <button className="p-1.5 sm:p-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                </svg>
              </button>
              <button className="p-1.5 sm:p-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
            </button>
          </div>
        </div>


          {/* Performance tracking indicator */}
          {client.workoutAssignment?.lastModifiedBy === 'client' && (
            <div className="flex items-center justify-center space-x-2 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-green-400 font-medium">
                Performance tracked - Coach can see your progress
              </span>
          </div>
        )}
        </div>
      </div>

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-4 sm:space-y-6 pb-20 max-w-full overflow-x-hidden">
        {/* Week navigation - only deployed weeks */}
        {deployedWeeks.length > 0 && onWeekChange && (
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-2xl border border-gray-700/50 p-4 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm font-medium">{t('workout.weekLabel')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {deployedWeeks.map((w) => {
                const isActive = w.weekNumber === currentWeek;
                const completed = (w as any).isCompleted === true;
                return (
                  <button
                    key={w.weekNumber}
                    onClick={() => handleWeekSelect(w.weekNumber)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-[#dc1e3a] text-white'
                        : completed
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : 'bg-gray-700/50 text-gray-300 border border-gray-600/50 hover:bg-gray-700'
                    }`}
                  >
                    {t('workout.weekN', { n: w.weekNumber })}{completed ? ' ✓' : ''}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Waiting for coach to deploy next week */}
        {showWaitingForCoach && (
          <div className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="font-semibold text-amber-200">Great work!</p>
              <p className="text-sm text-amber-200/90">Your coach is preparing your next week. Check back soon.</p>
            </div>
          </div>
        )}

        {/* Day Navigation - Ultra Modern Design with Theme Colors */}
        <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-4 sm:p-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4 sm:mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
                <Calendar className="w-5 h-5 text-[#dc1e3a]" />
              </div>
              <div>
                <h4 className="text-lg sm:text-xl font-bold text-white">{t('workout.daysTitle')}</h4>
                <p className="text-gray-400 text-xs sm:text-sm">{t('workout.daysSubtitle')}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#dc1e3a] rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">{t('workout.active')}</span>
            </div>
          </div>
          
          {/* Horizontal Scrolling Days */}
          <div className="relative">
            <div 
              ref={daysScrollRef}
              className="overflow-x-auto scrollbar-hide horizontal-scroll"
            >
              <div className="flex space-x-3 sm:space-x-4 pb-2 min-w-max">
                {currentWorkoutProgram?.days?.map((day, index) => {
                  const status = getDayStatus(index);
                  const isCurrentDay = index === currentDay;
                  const isCompleted = status === 'completed';
                  const isInProgress = status === 'in-progress';
                  
                  return (
                    <button
                      key={day.id}
                      data-scroll-item
                      onClick={() => setCurrentDay(index)}
                      disabled={!isDayUnlocked}
                      className={`group relative flex flex-col items-center space-y-2 p-3 sm:p-4 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 min-w-[120px] sm:min-w-[140px] ${
                        isCurrentDay
                          ? 'bg-gradient-to-br from-[#dc1e3a]/30 to-red-500/20 text-white shadow-2xl scale-105 border border-[#dc1e3a]/50'
                          : isDayUnlocked
                          ? isCompleted
                            ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/10 text-green-300 border border-green-400/30 hover:from-green-500/30 hover:to-emerald-500/20'
                            : isInProgress
                            ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10 text-blue-300 border border-blue-400/30 hover:from-blue-500/30 hover:to-cyan-500/20'
                            : 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 text-gray-300 border border-gray-600/50 hover:from-gray-600/50 hover:to-gray-700/50'
                          : 'bg-gradient-to-br from-gray-700/30 to-gray-800/30 text-gray-500 border border-gray-600/30 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 group-hover:bg-white/20 transition-all duration-300">
                        {isDayUnlocked ? (
                          getDayStatusIcon(status)
                        ) : (
                          <Lock className="w-4 h-4" />
                        )}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-center">{day.name}</span>
                      
                      {/* Status indicator */}
                      {isDayUnlocked && (
                        <div className={`w-2 h-2 rounded-full ${
                          isCompleted ? 'bg-green-400' : 
                          isInProgress ? 'bg-blue-400' : 
                          'bg-gray-400'
                        }`}></div>
                      )}
                      
                      {/* Current day indicator */}
                      {isCurrentDay && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-white rounded-full flex items-center justify-center">
                          <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
            
            {/* Scroll buttons */}
            <button
              onClick={() => scrollDaysBy('left')}
              className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-6 h-6 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollDaysBy('right')}
              className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-6 h-6 bg-gray-800/80 hover:bg-gray-700/80 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          {!isDayUnlocked && (
            <div className="mt-4 sm:mt-6 p-4 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <Lock className="w-4 h-4 text-yellow-400" />
                </div>
                <div>
                  <p className="text-yellow-300 text-sm font-medium">{t('workout.weekLocked')}</p>
                  <p className="text-yellow-400/80 text-xs">{t('workout.weekLockedBody')}</p>
                </div>
              </div>
        </div>
          )}
      </div>

        {/* Current Day Workout */}
        {isDayUnlocked && currentDayData && (
          <div className="space-y-6 sm:space-y-8">
            {/* Workout Header - Mobile Optimized */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-3xl border border-gray-700/50 p-3 sm:p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 sm:space-x-4 flex-1 min-w-0">
                  <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-lg sm:rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30 flex-shrink-0">
                    <Dumbbell className="w-4 h-4 sm:w-6 sm:h-6 text-[#dc1e3a]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm sm:text-xl font-bold text-white truncate">{currentDayData.name}</h3>
                    <p className="text-gray-400 text-xs sm:text-sm">
                      {t('workout.weekExercises', { week: currentWeek, count: currentDayData.exercises.length })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-lg sm:text-2xl font-bold text-[#dc1e3a]">
                      {currentDayData.exercises.length}
                    </div>
                    <div className="text-gray-400 text-xs">{t('workout.exercises')}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Exercises - Mobile Optimized */}
            <div className="space-y-3 sm:space-y-6">
              {currentDayData.exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-xl sm:rounded-3xl border border-gray-700/50 p-3 sm:p-6 shadow-2xl hover:shadow-[#dc1e3a]/10 transition-all duration-300 group">
                  {/* Exercise Header - Mobile Optimized */}
                  <div className="flex items-start space-x-2 sm:space-x-4 mb-3 sm:mb-6">
                    <div className="relative flex-shrink-0">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-lg sm:rounded-xl flex items-center justify-center text-white font-bold text-sm sm:text-lg border border-[#dc1e3a]/30">
                        <span>{exerciseIndex + 1}</span>
                      </div>
                      {completedExercises[exercise.id] && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 sm:w-5 sm:h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-1 sm:space-x-2 mb-2 sm:mb-3">
                        <h5 className="text-sm sm:text-lg font-bold text-white truncate">
                          {exercise.exercise.name}
                        </h5>
                        {exercise.superset && (
                          <span className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full flex-shrink-0">
                            {exercise.supersetName || exercise.superset}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                          <Target className="w-2 h-2 sm:w-3 sm:h-3 text-blue-400" />
                          <span className="text-xs font-medium text-blue-300">{exercise.exercise.muscleGroup}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                          <Zap className="w-2 h-2 sm:w-3 sm:h-3 text-purple-400" />
                          <span className="text-xs font-medium text-purple-300">{exercise.exercise.equipment}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 px-2 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-lg">
                          <Dumbbell className="w-2 h-2 sm:w-3 sm:h-3 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-300">
                            {t('workout.setsCount', { n: exercise.sets.length })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Player - Mobile Optimized */}
                  <div className="mb-3 sm:mb-4">
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-xl sm:rounded-2xl p-2 sm:p-3 border border-gray-700/50">
                      <div className="flex items-center space-x-2 sm:space-x-3 mb-2 sm:mb-3">
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-md sm:rounded-lg flex items-center justify-center border border-[#dc1e3a]/30">
                          <Play className="w-2 h-2 sm:w-3 sm:h-3 text-[#dc1e3a]" />
                        </div>
                        <h6 className="text-xs sm:text-sm font-semibold text-white">{t('workout.demoTitle')}</h6>
                      </div>
                      
                    <a 
                      href={exercise.exercise.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                        className="block relative bg-gray-900 rounded-xl overflow-hidden group shadow-2xl"
                    >
                      <div className="aspect-[3/2] sm:aspect-video relative">
                        {getYouTubeThumbnail(exercise.exercise.videoUrl || '') ? (
                          <img 
                            src={getYouTubeThumbnail(exercise.exercise.videoUrl || '') || ''} 
                            alt={`${exercise.exercise.name} demonstration`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const nextSibling = e.currentTarget.nextElementSibling as HTMLElement;
                              if (nextSibling) {
                                nextSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                              <div className="text-center text-gray-400">
                                <div className="text-6xl mb-4">🎥</div>
                                <div className="text-lg font-medium">{t('workout.noVideo')}</div>
                                <div className="text-sm text-gray-500 mt-2">{t('workout.noVideoSub')}</div>
                            </div>
                          </div>
                        )}
                          
                        <div 
                            className="w-full h-full bg-gray-800 flex items-center justify-center group-hover:bg-gray-700 transition-all duration-300" 
                          style={{ display: getYouTubeThumbnail(exercise.exercise.videoUrl || '') ? 'none' : 'flex' }}
                        >
                          <div className="text-center">
                              <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mb-3 mx-auto group-hover:bg-gray-600 transition-all duration-300">
                                <Play className="w-5 h-5 text-white ml-1" />
                            </div>
                              <p className="text-white text-sm font-medium">{t('workout.watchDemo')}</p>
                              <p className="text-gray-400 text-xs mt-1">{t('workout.watchYoutube')}</p>
                          </div>
                        </div>
                          
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm">
                              <Play className="w-8 h-8 text-white ml-1" />
                          </div>
            </div>
                          
                          <div className="absolute bottom-4 right-4">
                            <div className="bg-black/80 text-white text-sm px-3 py-2 rounded-lg backdrop-blur-sm">
                              <div className="flex items-center space-x-2">
                                <Play className="w-4 h-4" />
                                <span>{t('workout.watchNow')}</span>
                              </div>
                    </div>
                    </div>
                      </div>
                    </a>
                    </div>
                  </div>

                  {/* Sets & Reps Section - always visible; Save per exercise */}
                  <div className="space-y-3 sm:space-y-6">
                      <div className="flex items-center justify-between mb-2 sm:mb-3">
                        <div className="flex items-center space-x-1 sm:space-x-2">
                          <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-md sm:rounded-lg flex items-center justify-center border border-[#dc1e3a]/30">
                            <Dumbbell className="w-2 h-2 sm:w-3 sm:h-3 text-[#dc1e3a]" />
                          </div>
                          <div>
                            <h6 className="text-xs sm:text-sm font-bold text-white">{t('workout.setsReps')}</h6>
                            <p className="text-gray-400 text-xs">
                              {t('workout.trackPerformance')}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm sm:text-lg font-bold text-[#dc1e3a]">{exercise.sets.length}</div>
                          <div className="text-gray-400 text-xs">{t('workout.sets')}</div>
                        </div>
                      </div>

                      {/* Set-based organization - Enhanced with Superset & Dropset Support */}
                      <div className="space-y-2 sm:space-y-4">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className={`rounded-lg sm:rounded-xl p-2 sm:p-3 border transition-all duration-300 bg-gradient-to-br from-gray-800/60 to-gray-900/40 border-gray-700/50 hover:border-[#dc1e3a]/20`}>
                            <div className="flex items-center justify-between mb-2 sm:mb-3">
                              {/* Set Number */}
                              <div className="flex items-center space-x-1 sm:space-x-2">
                                <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center border bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 border-[#dc1e3a]/30">
                                  <span className="text-xs sm:text-sm font-bold text-[#dc1e3a]">
                                    {setIndex + 1}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1">
                                  <span className="text-xs sm:text-sm font-semibold text-white">
                                    {t('workout.setN', { n: setIndex + 1 })}
                                    {set.isDropset && (
                                      <span className="ml-2 px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                        {t('workout.dropset')}
                                      </span>
                                    )}
                                  </span>
                                </div>
                              </div>
                            </div>
                              
                            {/* Reps & Weight Controls - Mobile Optimized */}
                            <div className="flex flex-col sm:flex-row gap-2">
                              {/* Reps Section - Compact Mobile Design */}
                              <div className="flex-1 bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-md p-2 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-1.5">
                                  <h6 className="text-[10px] font-semibold text-blue-300 uppercase">{t('workout.reps')}</h6>
                                  <Target className="w-3 h-3 text-blue-400" />
                                </div>
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      const currentReps = exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps;
                                      const newReps = typeof currentReps === 'number' ? Math.max(0, currentReps - 1) : 0;
                                      updateExerciseData(exercise.id, setIndex, 'reps', newReps);
                                    }}
                                    className="w-6 h-6 rounded bg-gradient-to-r from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white transition-all duration-200 flex items-center justify-center"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <div className="text-center px-1 flex-1 min-w-[30px]">
                                    <div className="text-sm font-bold text-blue-300 leading-tight">
                                      {set.isDropset && Array.isArray(set.reps) 
                                        ? set.reps.join('→') 
                                        : (exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps)
                                      }
                                    </div>
                                    <div className="text-blue-400 text-[9px] leading-tight">
                                      {set.isDropset ? t('workout.dropset') : t('workout.reps')}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => {
                                      const currentReps = exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps;
                                      const newReps = typeof currentReps === 'number' ? currentReps + 1 : 1;
                                      updateExerciseData(exercise.id, setIndex, 'reps', newReps);
                                    }}
                                    className="w-6 h-6 rounded bg-gradient-to-r from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white transition-all duration-200 flex items-center justify-center"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>

                              {/* Weight — ultra-modern: glass card, ±2.5kg + direct type (no spinners) */}
                              <div className="flex-1 relative min-w-0 rounded-xl overflow-hidden border border-white/10 bg-slate-900/70 backdrop-blur-xl shadow-lg shadow-black/20">
                                <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#dc1e3a]/[0.08] via-transparent to-violet-500/[0.06]" />
                                <div className="relative p-2 sm:p-2.5">
                                  <div className="flex items-center justify-between mb-2">
                                    <h6 className="text-[10px] font-bold tracking-[0.12em] text-white/70 uppercase">{t('workout.weight')}</h6>
                                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#dc1e3a]/15 border border-[#dc1e3a]/25">
                                      <Zap className="w-3.5 h-3.5 text-[#dc1e3a]" />
                                    </div>
                                  </div>
                                  <div className="flex items-stretch gap-1.5 sm:gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentWeight = exerciseData[exercise.id]?.[setIndex]?.weight ?? set.weight;
                                        const newWeight = typeof currentWeight === 'number' ? Math.max(0, currentWeight - 2.5) : 0;
                                        updateExerciseData(exercise.id, setIndex, 'weight', newWeight);
                                        setEditingWeightInput(prev => { const n = { ...prev }; delete n[`${exercise.id}-${setIndex}`]; return n; });
                                      }}
                                      className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/15 text-white/90 hover:border-[#dc1e3a]/40 hover:text-[#dc1e3a] active:scale-95 transition-all duration-200 flex items-center justify-center"
                                      aria-label="Decrease weight 2.5 kg"
                                    >
                                      <Minus className="w-4 h-4" />
                                    </button>
                                    {set.isDropset && Array.isArray(set.weight) ? (
                                      <div className="flex-1 min-w-0 flex flex-col items-center justify-center rounded-xl bg-black/30 border border-white/10 px-2 py-1">
                                        <div className="text-sm font-bold text-white tabular-nums leading-tight truncate max-w-full">
                                          {set.weight.join(' → ')}
                                          <span className="text-white/50 font-semibold text-xs ml-0.5">{t('workout.kg')}</span>
                                        </div>
                                        <span className="text-[9px] text-white/40 mt-0.5">{t('workout.dropset')}</span>
                                      </div>
                                    ) : (
                                      <div className="flex-1 min-w-0 flex flex-col justify-center rounded-xl bg-black/35 border border-white/10 px-1.5 py-1 shadow-inner">
                                        <input
                                          type="number"
                                          min={0}
                                          step={0.5}
                                          inputMode="decimal"
                                          placeholder="0"
                                          className="w-full bg-transparent text-center text-base sm:text-lg font-bold text-white tabular-nums tracking-tight
                                            placeholder:text-white/25 focus:outline-none focus:ring-0
                                            [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                          value={
                                            editingWeightInput[`${exercise.id}-${setIndex}`] ??
                                            String(
                                              typeof set.weight === 'number'
                                                ? exerciseData[exercise.id]?.[setIndex]?.weight ?? set.weight
                                                : exerciseData[exercise.id]?.[setIndex]?.weight ?? 0
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
                                            const fallback =
                                              exerciseData[exercise.id]?.[setIndex]?.weight ?? set.weight ?? 0;
                                            const value = Number.isFinite(parsed) ? Math.max(0, parsed) : fallback;
                                            updateExerciseData(exercise.id, setIndex, 'weight', typeof value === 'number' ? value : 0);
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
                                        <span className="text-[9px] text-center text-white/40 font-medium">{t('workout.kgTapType')}</span>
                                      </div>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const currentWeight = exerciseData[exercise.id]?.[setIndex]?.weight ?? set.weight;
                                        const newWeight = typeof currentWeight === 'number' ? currentWeight + 2.5 : 2.5;
                                        updateExerciseData(exercise.id, setIndex, 'weight', newWeight);
                                        setEditingWeightInput(prev => { const n = { ...prev }; delete n[`${exercise.id}-${setIndex}`]; return n; });
                                      }}
                                      className="shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#dc1e3a]/25 to-[#dc1e3a]/10 border border-[#dc1e3a]/35 text-white hover:from-[#dc1e3a]/35 hover:to-[#dc1e3a]/15 active:scale-95 transition-all duration-200 flex items-center justify-center"
                                      aria-label={t('workout.increaseWeight')}
                                    >
                                      <Plus className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                              
                            </div>
                      </div>
                    ))}
                  </div>

                  {/* Save button for this exercise - saves performance to Supabase and updates coach + charts */}
                  <div className="flex justify-center mt-4 pt-4 border-t border-gray-700/50">
                    <button
                      type="button"
                      onClick={() => saveClientEdits()}
                      className="px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-semibold flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border border-green-500/30 shadow-lg text-sm sm:text-base"
                    >
                      <Save className="w-4 h-4 sm:w-5 sm:h-5" />
                      {t('workout.save')}
                    </button>
                  </div>
                </div>

                  {exercise.notes && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
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
              ))}
            </div>
        </div>
      )}



        {/* Locked Day Message */}
        {!isDayUnlocked && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-8 text-center">
            <div className="w-16 h-16 bg-slate-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-3">
              {t('workout.weekNLocked', { week: currentWeek })}
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              {t('workout.weekLockedFull')}
            </p>
            <div className="flex items-center justify-center space-x-2 text-slate-500">
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
      lastModifiedBy: clientView.workoutAssignment.lastModifiedBy as 'client' | 'coach' | undefined
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
