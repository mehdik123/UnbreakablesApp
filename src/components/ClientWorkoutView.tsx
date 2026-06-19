import React, { useState, useEffect, memo, useCallback } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { 
  Dumbbell, 
  Clock,
  Play,
  CheckCircle,
  Circle,
  Zap,
  Flame,
  Lock,
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

  // Per-exercise save feedback state ('saving' | 'saved')
  const [exerciseSaveState, setExerciseSaveState] = useState<{ [exerciseId: string]: 'saving' | 'saved' }>({});
  const handleSaveExercise = async (exerciseId: string) => {
    setExerciseSaveState(prev => ({ ...prev, [exerciseId]: 'saving' }));
    try {
      await saveClientEdits();
      setExerciseSaveState(prev => ({ ...prev, [exerciseId]: 'saved' }));
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
    <div className="workout-shell min-h-screen overflow-x-hidden relative">

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
        {/* Week navigation - only deployed weeks */}
        {deployedWeeks.length > 0 && onWeekChange && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--txt-lo)' }}>
                {t('workout.trainingWeek')}
              </span>
              <span className="flex-1 h-px" style={{ background: 'var(--hair)' }} />
            </div>
            <div
              className="flex gap-1 p-1 overflow-x-auto scrollbar-hide rounded-[15px]"
              style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
            >
              {deployedWeeks.map((w) => {
                const isActive = w.weekNumber === currentWeek;
                const done = (w as any).isCompleted === true || w.weekNumber < currentWeek;
                const label = isActive ? t('workout.wkCurrent') : done ? t('workout.wkDone') : t('workout.wkSoon');
                return (
                  <button
                    key={w.weekNumber}
                    onClick={() => handleWeekSelect(w.weekNumber)}
                    className={`flex-1 min-w-[64px] text-center py-2 rounded-[11px] text-[13px] font-semibold transition-all duration-200 ${
                      isActive ? 'text-white bg-grad-red shadow-red' : ''
                    }`}
                    style={isActive ? undefined : { color: 'var(--txt-mid)' }}
                  >
                    <span
                      className="block text-[9px] font-semibold uppercase tracking-[0.1em] mb-0.5"
                      style={{ color: isActive ? 'rgba(255,255,255,.75)' : done ? 'var(--emerald)' : 'var(--txt-lo)' }}
                    >
                      {label}
                    </span>
                    {t('workout.weekN', { n: w.weekNumber })}
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

        {/* Day Navigation - token-styled cards */}
        <div>
          <div className="flex items-center gap-2 mb-3 px-1">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--txt-lo)' }}>
              {t('workout.selectDay')}
            </span>
            <span className="flex-1 h-px" style={{ background: 'var(--hair)' }} />
          </div>

          {/* Horizontal Scrolling Days */}
          <div className="relative">
            <div
              ref={daysScrollRef}
              data-horizontal-scroll="true"
              className="overflow-x-auto scrollbar-hide horizontal-scroll touch-pan-x"
              style={{ WebkitOverflowScrolling: 'touch' }}
            >
              <div className="flex gap-3 pb-2 min-w-max">
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
                  const subline = muscles.length ? muscles.slice(0, 3).join(' · ') : t('workout.nExercises', { count: total });
                  const statusText =
                    completedCount > 0
                      ? t('workout.ofComplete', { done: completedCount, total })
                      : t('workout.nExercises', { count: total });

                  return (
                    <button
                      key={day.id}
                      data-scroll-item
                      onClick={() => setCurrentDay(index)}
                      disabled={!isDayUnlocked}
                      className={`group relative flex-shrink-0 w-[152px] text-left p-4 rounded-[18px] transition-all duration-300 active:scale-[0.97] ${
                        isCurrentDay ? 'shadow-glow-red' : ''
                      } ${!isDayUnlocked ? 'cursor-not-allowed opacity-60' : ''}`}
                      style={{
                        background: isCurrentDay
                          ? 'radial-gradient(120% 100% at 0% 0%, rgba(255,45,85,.22), transparent 60%), var(--surface-2)'
                          : 'var(--surface-1)',
                        border: isCurrentDay ? '1px solid rgba(255,45,85,.4)' : '1px solid var(--hair)',
                      }}
                    >
                      {isCurrentDay && (
                        <span
                          className="wk-live-dot absolute top-3.5 right-3.5 w-[9px] h-[9px] rounded-full"
                          style={{ background: 'var(--red)' }}
                        />
                      )}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center mb-3.5 transition-all duration-300"
                        style={{
                          background: isCurrentDay ? 'var(--grad-red)' : isCompleted ? 'rgba(52,211,153,.1)' : 'var(--surface-3)',
                          border: isCurrentDay ? '1px solid transparent' : isCompleted ? '1px solid rgba(52,211,153,.3)' : '1px solid var(--hair)',
                          color: isCurrentDay ? '#fff' : isCompleted ? 'var(--emerald)' : 'var(--txt-mid)',
                        }}
                      >
                        {isDayUnlocked ? getDayStatusIcon(status) : <Lock className="w-4 h-4" />}
                      </div>
                      <div className="font-display font-semibold text-[16px] truncate" style={{ color: 'var(--txt-hi)' }}>
                        {day.name}
                      </div>
                      <div className="text-[11.5px] mt-0.5 truncate" style={{ color: 'var(--txt-mid)' }}>
                        {subline}
                      </div>
                      <div
                        className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold"
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
              onClick={() => scrollDaysBy('left')}
              className="absolute top-1/2 -left-2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--txt-hi)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scrollDaysBy('right')}
              className="absolute top-1/2 -right-2 transform -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center opacity-50 hover:opacity-100 transition-all duration-200"
              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}
            >
              <svg className="w-4 h-4" style={{ color: 'var(--txt-hi)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            {/* Workout Header (today) */}
            <div
              className="flex items-center gap-3.5 p-4 rounded-[18px]"
              style={{ background: 'linear-gradient(135deg, var(--surface-2), var(--surface-1))', border: '1px solid var(--hair)' }}
            >
              <div
                className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center shrink-0 shadow-red"
                style={{ background: 'var(--grad-red)', color: '#fff' }}
              >
                <Dumbbell className="w-[22px] h-[22px]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-display font-semibold text-[20px] truncate" style={{ color: 'var(--txt-hi)' }}>
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
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className="text-[11px] font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--txt-lo)' }}>
                {t('workout.todaysExercises')}
              </span>
              <span className="flex-1 h-px" style={{ background: 'var(--hair)' }} />
            </div>

            {/* Exercises */}
            <div className="space-y-4">
              {currentDayData.exercises.map((exercise, exerciseIndex) => (
                <div
                  key={exercise.id}
                  className="overflow-hidden rounded-[24px] transition-all duration-300 group"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
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
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 text-white" style={{ background: 'var(--grad-coral)' }}>
                            {exercise.supersetName || exercise.superset}
                          </span>
                        )}
                      </div>

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

                  {/* Video block */}
                  <a
                    href={exercise.exercise.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative mx-4 mb-4 rounded-[18px] overflow-hidden group"
                    style={{
                      aspectRatio: '16 / 9',
                      border: '1px solid var(--hair)',
                      background:
                        'radial-gradient(120% 120% at 70% 20%, rgba(255,45,85,.22), transparent 55%), linear-gradient(135deg,#23262f,#0e0f14)',
                    }}
                  >
                    {getYouTubeThumbnail(exercise.exercise.videoUrl || '') && (
                      <img
                        src={getYouTubeThumbnail(exercise.exercise.videoUrl || '') || ''}
                        alt={`${exercise.exercise.name} demonstration`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}

                    <div className="wk-video-grid absolute inset-0" />

                    <div
                      className="absolute top-3 left-3 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] px-2.5 py-1.5 rounded-lg"
                      style={{
                        color: 'rgba(255,255,255,.7)',
                        background: 'rgba(0,0,0,.35)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,.1)',
                      }}
                    >
                      <Circle className="w-2.5 h-2.5" />
                      {t('workout.formDemo')}
                    </div>

                    <div className="wk-play absolute left-1/2 top-1/2 w-14 h-14 rounded-full flex items-center justify-center text-white">
                      <Play className="w-5 h-5 ml-0.5" fill="currentColor" strokeWidth={0} />
                    </div>

                    <div
                      className="absolute bottom-3 right-3 flex items-center gap-1.5 text-[12px] font-semibold text-white px-2.5 py-1.5 rounded-lg"
                      style={{
                        background: 'rgba(0,0,0,.35)',
                        backdropFilter: 'blur(8px)',
                        border: '1px solid rgba(255,255,255,.12)',
                      }}
                    >
                      {t('workout.watchDemo')}
                    </div>
                  </a>

                  {/* Sets & Reps Section */}
                  <div className="space-y-2 sm:space-y-4 px-4 pb-4">
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
                        {exercise.sets.map((set, setIndex) => (
                          <div
                            key={setIndex}
                            className="flex items-center gap-2.5 rounded-[18px] p-3"
                            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                          >
                            <div
                              className="w-[26px] h-[26px] rounded-[8px] flex items-center justify-center font-display font-bold text-[12px] shrink-0"
                              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair-strong)', color: 'var(--txt-mid)' }}
                            >
                              {setIndex + 1}
                            </div>

                            {/* Reps stepper */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-1.5 pl-0.5 flex items-center gap-1" style={{ color: 'var(--txt-lo)' }}>
                                {set.isDropset ? t('workout.dropset') : t('workout.reps')}
                              </div>
                              <div className="flex items-center rounded-[11px] overflow-hidden" style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentReps = exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps;
                                    const newReps = typeof currentReps === 'number' ? Math.max(0, currentReps - 1) : 0;
                                    updateExerciseData(exercise.id, setIndex, 'reps', newReps);
                                  }}
                                  className="wk-step w-8 h-[34px] flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--blue)' }}
                                  aria-label="Decrease reps"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <div
                                  className={`flex-1 text-center font-display font-bold tnum truncate px-0.5 ${
                                    set.isDropset && Array.isArray(set.reps) ? 'text-[13px]' : 'text-[17px]'
                                  }`}
                                  style={{ color: 'var(--txt-hi)' }}
                                >
                                  {set.isDropset && Array.isArray(set.reps)
                                    ? set.reps.join('→')
                                    : (exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps)}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentReps = exerciseData[exercise.id]?.[setIndex]?.reps ?? set.reps;
                                    const newReps = typeof currentReps === 'number' ? currentReps + 1 : 1;
                                    updateExerciseData(exercise.id, setIndex, 'reps', newReps);
                                  }}
                                  className="wk-step w-8 h-[34px] flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--red)' }}
                                  aria-label="Increase reps"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Weight stepper */}
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-semibold uppercase tracking-[0.12em] mb-1.5 pl-0.5" style={{ color: 'var(--txt-lo)' }}>
                                {t('workout.weight')}
                              </div>
                              <div className="flex items-center rounded-[11px] overflow-hidden" style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const currentWeight = exerciseData[exercise.id]?.[setIndex]?.weight ?? set.weight;
                                    const newWeight = typeof currentWeight === 'number' ? Math.max(0, currentWeight - 2.5) : 0;
                                    updateExerciseData(exercise.id, setIndex, 'weight', newWeight);
                                    setEditingWeightInput(prev => { const n = { ...prev }; delete n[`${exercise.id}-${setIndex}`]; return n; });
                                  }}
                                  className="wk-step w-8 h-[34px] flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--blue)' }}
                                  aria-label="Decrease weight 2.5 kg"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                {set.isDropset && Array.isArray(set.weight) ? (
                                  <div className="flex-1 text-center font-display font-bold text-[13px] tnum truncate px-1" style={{ color: 'var(--txt-hi)' }}>
                                    {set.weight.join('→')}
                                    <span className="text-[10px] font-medium ml-0.5" style={{ color: 'var(--txt-lo)' }}>{t('workout.kg')}</span>
                                  </div>
                                ) : (
                                  <div className="flex-1 flex items-baseline justify-center px-1">
                                    <input
                                      type="number"
                                      min={0}
                                      step={0.5}
                                      inputMode="decimal"
                                      placeholder="0"
                                      className="w-[44px] max-w-full bg-transparent text-center font-display font-bold text-[17px] tnum
                                        focus:outline-none focus:ring-0
                                        [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                                      style={{ color: 'var(--txt-hi)' }}
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
                                    <span className="text-[10px] font-medium" style={{ color: 'var(--txt-lo)' }}>{t('workout.kg')}</span>
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
                                  className="wk-step w-8 h-[34px] flex items-center justify-center shrink-0"
                                  style={{ color: 'var(--red)' }}
                                  aria-label={t('workout.increaseWeight')}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
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
                          className="w-full py-3 rounded-[15px] font-semibold text-[14px] text-white flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.97] disabled:cursor-not-allowed"
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
              ))}
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
