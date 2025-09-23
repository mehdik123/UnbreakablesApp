import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { 
  Dumbbell, 
  Clock,
  Play,
  Pause,
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
  Trophy,
  Activity
} from 'lucide-react';
import { Client, WorkoutProgram } from '../types';
import { logExercisePerformance } from '../lib/progressTracking';
import { usePerformanceTracking } from '../hooks/usePerformanceTracking';
import { useHorizontalScroll } from '../hooks/useHorizontalScroll';

interface ClientWorkoutViewProps {
  client: Client;
  currentWeek: number;
  unlockedWeeks: number[];
  isDark: boolean;
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

export const ClientWorkoutView: React.FC<ClientWorkoutViewProps> = ({
  client,
  currentWeek,
  unlockedWeeks
}) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<{ [exerciseId: string]: boolean }>({});
  const [exerciseData, setExerciseData] = useState<{ [exerciseId: string]: { [setIndex: number]: { reps: number; weight: number } } }>({});
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const SHARED_KEY = `client_${client.id}_assignment`;
  const [sharedVersion, setSharedVersion] = useState<number>(0);

  // Performance tracking
  const { recordExercise } = usePerformanceTracking({
    clientId: client.id,
    workoutAssignmentId: assignmentId || 'temp-id',
    onVolumeUpdate: (data) => {
      console.log('📊 WORKOUT VIEW - Volume updated:', data);
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
      
      // Create a map for quick lookup
      const exerciseMap = new Map();
      dbExercises.forEach(ex => {
        exerciseMap.set(ex.name, ex);
      });
      
      // Enrich the program
      const enrichedProgram = {
        ...program,
        days: program.days?.map((day: any) => ({
          ...day,
          exercises: day.exercises?.map((workoutEx: any) => {
            const dbExercise = exerciseMap.get(workoutEx.exercise.name);
            if (dbExercise) {
              return {
                ...workoutEx,
                exercise: {
                  ...workoutEx.exercise,
                  videoUrl: dbExercise.video_url,
                  muscleGroup: dbExercise.muscle_group
                }
              };
            }
            return workoutEx;
          }) || []
        })) || []
      };
      
      return enrichedProgram;
    } catch (error) {
      console.error('❌ Failed to enrich program with video URLs:', error);
      return program;
    }
  };

  // Function to preserve video URLs when updating program
  const preserveVideoUrlsInProgram = (updatedProgram: any, originalProgram: WorkoutProgram | null) => {
    if (!originalProgram) return updatedProgram;
    
    return {
      ...updatedProgram,
      days: updatedProgram.days.map((day: any, dayIndex: number) => ({
        ...day,
        exercises: day.exercises.map((exercise: any, exerciseIndex: number) => {
          const originalExercise = originalProgram.days[dayIndex]?.exercises[exerciseIndex];
          if (originalExercise?.exercise?.videoUrl) {
            return {
              ...exercise,
              exercise: {
                ...exercise.exercise,
                videoUrl: originalExercise.exercise.videoUrl,
                muscleGroup: originalExercise.exercise.muscleGroup
              }
            };
          }
          return exercise;
        })
      }))
    };
  };

  // Real-time sync - Prefer Supabase assignment, fallback to localStorage
  useEffect(() => {
    (async () => {
      if (isSupabaseReady && supabase) {
        try {
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          if (cRow?.id) {
            const { data: asg } = await supabase
              .from('workout_assignments')
              .select('id, program_json, current_week, current_day, version')
              .eq('client_id', cRow.id)
              .eq('is_active', true)
              .order('last_modified_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (asg?.id) {
              setAssignmentId(asg.id);
              if (asg.program_json) {
                // Enrich exercise data with video URLs from Supabase exercises table
                const enrichedProgram = await enrichProgramWithVideoUrls(asg.program_json);
                setWorkoutProgram(enrichedProgram as WorkoutProgram);
              }
              // Current week is managed by parent component
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
        if (sharedRaw) {
          const shared = JSON.parse(sharedRaw);
          if (shared?.workoutAssignment?.program) {
            setWorkoutProgram(shared.workoutAssignment.program);
            setSharedVersion(shared.version || 0);
          }
        } else if (client.workoutAssignment?.program) {
          setWorkoutProgram(client.workoutAssignment.program);
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
          if (row.program_json && row.last_modified_by !== 'client') {
            // Enrich the updated program with video URLs
            const enrichedProgram = await enrichProgramWithVideoUrls(row.program_json);
            setWorkoutProgram(enrichedProgram as WorkoutProgram);
            setSharedVersion(row.version || 0);
            
            // Update current week/day if changed
            if (typeof row.current_day === 'number' && row.current_day !== currentDay + 1) {
              setCurrentDay(Math.max(0, (row.current_day || 1) - 1));
            }
          }
        })
        .subscribe();
      return () => { 
        supabase?.removeChannel(channel); 
      };
    }
  }, [assignmentId, currentWeek, currentDay]);

  // Use assigned workout program or fallback to mock data
  const currentWorkoutProgram = workoutProgram || client.workoutAssignment?.program || {
    id: 'ppl-program',
    name: 'Push Pull Legs',
    description: '3-day split focusing on push, pull, and leg movements',
    duration: 12,
    difficulty: 'intermediate',
    days: []
  };
  
  // Heuristic: detect obviously old data (fallback sample IDs or missing videoUrl)
  // Only show old data warning if we have exercises but no video URLs AND no Supabase assignment
  const hasSupabaseAssignment = assignmentId && workoutProgram;
  const isUsingOldData = !hasSupabaseAssignment && currentWorkoutProgram.days.some(day =>
    day.exercises?.some(ex => !ex.exercise?.videoUrl)
  );
  
  
  // Check if using old data (not CSV data)

  const currentDayData = currentWorkoutProgram?.days?.[currentDay];
  const isDayUnlocked = unlockedWeeks.includes(currentWeek);

  // If no workout program is assigned, show a message
  if (!workoutProgram && !client.workoutAssignment?.program) {
  return (
      <div className="space-y-4 sm:space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 sm:p-6 lg:p-8 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <Dumbbell className="w-6 h-6 sm:w-8 sm:h-8 text-slate-400" />
            </div>
          <h3 className="text-lg sm:text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Workout Plan Assigned
          </h3>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 mb-4">
            Your coach hasn't assigned a workout plan yet. Please check back later or contact your coach.
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-3 sm:px-4 py-2 bg-red-500 text-white rounded-lg text-xs sm:text-sm"
            >
              Clear Cache & Reload
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
            ⚠️ Old Data Detected
          </h3>
          <p className="text-yellow-300 mb-4">
            This client is using old cached data instead of the fresh CSV exercise database. 
            The coach needs to re-assign the workout plan to use the correct exercise names and video links.
          </p>
          <div className="space-x-2">
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm"
            >
              Clear Cache & Reload
            </button>
          </div>
        </div>
      </div>
    );
  }


  const startWorkout = () => {
    setIsWorkoutActive(true);
        // Workout started
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
  };

  const completeExercise = (exerciseId: string) => {
    const isCurrentlyCompleted = completedExercises[exerciseId];
    const newCompletedState = !isCurrentlyCompleted;
    
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: newCompletedState
    }));

    // Record performance data when exercise is completed
    if (newCompletedState && workoutProgram) {
      const currentDayData = workoutProgram.days[currentDay];
      const exercise = currentDayData?.exercises.find(ex => ex.id === exerciseId);
      
      if (exercise) {
        const actualSets = exercise.sets.map((set, setIndex) => {
          const exerciseDataForSet = exerciseData[exerciseId]?.[setIndex];
          return {
            setId: set.id,
            actualReps: exerciseDataForSet?.reps || set.reps,
            actualWeight: exerciseDataForSet?.weight || set.weight,
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

    // Update the actual workout program structure for real-time sync with coach
    const baseProgram = workoutProgram || client.workoutAssignment?.program;
    if (baseProgram) {
      const updatedProgram = {
        ...baseProgram,
        days: baseProgram.days.map((day, dayIndex) => 
          dayIndex === currentDay 
            ? {
                ...day,
                exercises: day.exercises.map(exercise => 
                  exercise.id === exerciseId 
                    ? {
                        ...exercise,
                        sets: exercise.sets.map((set, setIdx) => 
                          setIdx === setIndex 
                            ? { ...set, [field]: value }
                            : set
                        )
                      }
                    : exercise
                )
              }
            : day
        )
      };

      // Preserve video URLs from the original program
      const updatedProgramWithVideos = preserveVideoUrlsInProgram(updatedProgram, workoutProgram);
      setWorkoutProgram(updatedProgramWithVideos);

      if (isSupabaseReady && supabase && assignmentId) {
        supabase
          .from('workout_assignments')
          .update({
            program_json: updatedProgramWithVideos as unknown as any,
            current_week: currentWeek,
            current_day: currentDay + 1,
            last_modified_by: 'client',
            version: (sharedVersion || 0) + 1
          })
          .eq('id', assignmentId)
        .then(() => {});
        // Enhanced progress tracking
        setTimeout(async () => {
          try {
            // Find the exercise details
            const exercise = currentWorkoutProgram?.days?.[currentDay]?.exercises?.find(ex => ex.id === exerciseId);
            if (!exercise || !client.workoutAssignment) return;

            const currentSet = exercise.sets[setIndex];
            if (!currentSet) return;

            // Get current values
            const currentData = exerciseData[exerciseId]?.[setIndex] || {};
            const actualReps = field === 'reps' ? value : (currentData.reps || currentSet.reps);
            const actualWeight = field === 'weight' ? value : (currentData.weight || currentSet.weight);

            // Map exercise name to muscle group
            const muscleGroupMap: { [key: string]: string } = {
              'chest': 'chest',
              'back': 'back', 
              'legs': 'legs',
              'shoulders': 'shoulders',
              'arms': 'arms',
              'core': 'core'
            };

            const muscleGroup = muscleGroupMap[exercise.exercise.muscleGroup.toLowerCase()] || 'other';

            // Log the performance using our enhanced tracking
            await logExercisePerformance({
              clientId: client.id,
              workoutAssignmentId: client.workoutAssignment.id,
              exerciseName: exercise.exercise.name.toLowerCase().replace(/\s+/g, '_'),
              muscleGroup: muscleGroup,
              weekNumber: currentWeek,
              dayNumber: currentDay + 1,
              setNumber: setIndex + 1,
              plannedReps: currentSet.reps,
              actualReps: actualReps,
              plannedWeight: currentSet.weight,
              actualWeight: actualWeight
            });

            console.log(`📊 Logged performance: ${exercise.exercise.name} - Week ${currentWeek}, Day ${currentDay + 1}, Set ${setIndex + 1}`);
          } catch (error) {
            console.error('Error logging exercise performance:', error);
          }
        }, 300);
      } else {
        // Fallback to shared key
        try {
          const existing = localStorage.getItem(SHARED_KEY);
          const prev = existing ? JSON.parse(existing) : {};
          const nextVersion = (prev?.version || 0) + 1;
          const sharedData = {
            clientName: client.name,
            clientId: client.id,
            workoutAssignment: { ...client.workoutAssignment, program: updatedProgram },
            lastModifiedBy: 'client' as const,
            lastModifiedAt: new Date().toISOString(),
            version: nextVersion
          };
          localStorage.setItem(SHARED_KEY, JSON.stringify(sharedData));
          setSharedVersion(nextVersion);
          window.dispatchEvent(new StorageEvent('storage', { key: SHARED_KEY, newValue: JSON.stringify(sharedData) }));
        } catch {}
      }
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

  // Function to get YouTube thumbnail
  const getYouTubeThumbnail = (videoUrl: string) => {
    if (!videoUrl) return null;
    const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    if (!videoId) return null;
    return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
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
          <span className="text-sm">Old cached workout data detected. Clear and reload to use latest video links.</span>
            <button
            onClick={clearClientCachedWorkout}
            className="px-3 py-1 bg-amber-500/30 hover:bg-amber-500/40 rounded text-xs"
          >
            Clear cached workout
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

          {/* Workout Status - Responsive */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <Heart className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-400" />
                <span className="text-xs sm:text-sm text-slate-300">Warmups</span>
          </div>
      </div>
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {isWorkoutActive ? (
            <button
                  onClick={pauseWorkout}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  <Pause className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Pause</span>
            </button>
              ) : (
                <button
                  onClick={startWorkout}
                  disabled={!isDayUnlocked}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 hover:bg-green-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-1.5 sm:space-x-2 text-xs sm:text-sm font-medium transition-all duration-200"
                >
                  <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="hidden xs:inline">Start</span>
                </button>
              )}
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
        {/* Success Indicator - Show when using fresh CSV data */}
        {client.workoutAssignment?.program && !isUsingOldData && (
          <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-2xl p-4 text-center backdrop-blur-sm">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">✅ Using Fresh CSV Data - All Exercise Names & Video Links Updated</span>
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
                <h4 className="text-lg sm:text-xl font-bold text-white">Workout Days</h4>
                <p className="text-gray-400 text-xs sm:text-sm">Select your training day</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-[#dc1e3a] rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-400">Active</span>
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
                  <p className="text-yellow-300 text-sm font-medium">Week Locked</p>
                  <p className="text-yellow-400/80 text-xs">Complete previous weeks to unlock this training week</p>
                </div>
              </div>
        </div>
          )}
      </div>

        {/* Current Day Workout */}
        {isDayUnlocked && currentDayData && (
          <div className="space-y-6 sm:space-y-8">
            {/* Workout Header */}
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 sm:p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
                    <Dumbbell className="w-6 h-6 text-[#dc1e3a]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white">{currentDayData.name}</h3>
                    <p className="text-gray-400 text-sm sm:text-base">Week {currentWeek} • {currentDayData.exercises.length} exercises</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-[#dc1e3a]">
                    {Object.values(completedExercises).filter(Boolean).length}/{currentDayData.exercises.length}
                  </div>
                  <div className="text-gray-400 text-xs sm:text-sm">Completed</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700/50 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#dc1e3a] to-red-600 rounded-full transition-all duration-500 ease-out"
                  style={{ 
                    width: `${(Object.values(completedExercises).filter(Boolean).length / currentDayData.exercises.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Exercises */}
            <div className="space-y-6 sm:space-y-8">
              {currentDayData.exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 sm:p-8 shadow-2xl hover:shadow-[#dc1e3a]/10 transition-all duration-300 group">
                  {/* Exercise Header - Premium Design with Theme Colors */}
                  <div className="flex items-start space-x-4 mb-6">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-xl flex items-center justify-center text-white font-bold text-lg border border-[#dc1e3a]/30">
                        <span>{exerciseIndex + 1}</span>
                      </div>
                      {completedExercises[exercise.id] && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h5 className="text-lg font-bold text-white mb-3 truncate">
                        {exercise.exercise.name}
                      </h5>
                      
                      <div className="flex flex-wrap gap-2">
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 px-3 py-1 rounded-lg">
                          <Target className="w-3 h-3 text-blue-400" />
                          <span className="text-xs font-medium text-blue-300">{exercise.exercise.muscleGroup}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-purple-500/10 to-purple-600/5 border border-purple-500/20 px-3 py-1 rounded-lg">
                          <Zap className="w-3 h-3 text-purple-400" />
                          <span className="text-xs font-medium text-purple-300">{exercise.exercise.equipment}</span>
                        </div>
                        <div className="flex items-center space-x-1 bg-gradient-to-r from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 px-3 py-1 rounded-lg">
                          <Dumbbell className="w-3 h-3 text-emerald-400" />
                          <span className="text-xs font-medium text-emerald-300">{exercise.sets.length} sets</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Video Player - Premium Design with Theme Colors */}
                  <div className="mb-6">
                    <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-2xl p-4 border border-gray-700/50">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-lg flex items-center justify-center border border-[#dc1e3a]/30">
                          <Play className="w-4 h-4 text-[#dc1e3a]" />
                        </div>
                        <h6 className="text-base font-semibold text-white">Exercise Demonstration</h6>
                      </div>
                      
                    <a 
                      href={exercise.exercise.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                        className="block relative bg-gray-900 rounded-xl overflow-hidden group shadow-2xl"
                    >
                      <div className="aspect-video relative">
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
                                <div className="text-lg font-medium">No video available</div>
                                <div className="text-sm text-gray-500 mt-2">Video demonstration coming soon</div>
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
                              <p className="text-white text-sm font-medium">Watch Demonstration</p>
                              <p className="text-gray-400 text-xs mt-1">Click to open on YouTube</p>
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
                                <span>Watch Now</span>
                              </div>
                    </div>
                    </div>
                      </div>
                    </a>
                    </div>
                  </div>

                  {/* Mark Complete Button - Premium Design with Theme Colors */}
                  <div className="flex justify-center mb-6 sm:mb-8">
                    <button
                      onClick={() => completeExercise(exercise.id)}
                      className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                        completedExercises[exercise.id]
                          ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 text-green-400 border border-green-500/30 hover:from-green-500/30 hover:to-emerald-500/20'
                          : 'bg-gradient-to-r from-[#dc1e3a]/20 to-red-500/10 text-[#dc1e3a] border border-[#dc1e3a]/30 hover:from-[#dc1e3a]/30 hover:to-red-500/20 hover:text-white'
                      }`}
                    >
                      {completedExercises[exercise.id] ? (
                        <div className="flex items-center space-x-2">
                          <CheckCircle className="w-4 h-4" />
                          <span>Completed</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <Circle className="w-4 h-4" />
                          <span>Mark Complete</span>
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Sets & Reps Section - Ultra Modern Design */}
                  {!completedExercises[exercise.id] && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-lg flex items-center justify-center border border-[#dc1e3a]/30">
                            <Dumbbell className="w-4 h-4 text-[#dc1e3a]" />
                          </div>
                          <div>
                            <h6 className="text-lg font-bold text-white">Sets & Reps</h6>
                            <p className="text-gray-400 text-xs">Track your performance</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-[#dc1e3a]">{exercise.sets.length}</div>
                          <div className="text-gray-400 text-xs">Sets</div>
                        </div>
                      </div>

                      {/* Set-based organization - Ultra Modern */}
                      <div className="space-y-4">
                        {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="bg-gradient-to-br from-gray-800/60 to-gray-900/40 rounded-2xl p-4 border border-gray-700/50 hover:border-[#dc1e3a]/20 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4">
                              {/* Set Number */}
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 flex items-center justify-center border border-[#dc1e3a]/30">
                                  <span className="text-[#dc1e3a] text-sm font-bold">{setIndex + 1}</span>
                                </div>
                                <div>
                                  <span className="text-white text-sm font-semibold">Set {setIndex + 1}</span>
                                </div>
                              </div>
                            </div>
                              
                            {/* Reps & Weight Controls - Mobile Optimized */}
                            <div className="space-y-4">
                              {/* Reps Section */}
                              <div className="bg-gradient-to-br from-blue-500/5 to-blue-600/5 rounded-2xl p-4 border border-blue-500/20">
                                <div className="flex items-center justify-between mb-4">
                                  <h6 className="text-sm font-semibold text-blue-300">Repetitions</h6>
                                  <Target className="w-4 h-4 text-blue-400" />
                                </div>
                                <div className="flex items-center justify-between max-w-xs mx-auto">
                                  <button
                                    onClick={() => updateExerciseData(exercise.id, setIndex, 'reps', Math.max(0, (exerciseData[exercise.id]?.[setIndex]?.reps || set.reps) - 1))}
                                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white transition-all duration-200 flex items-center justify-center touch-manipulation"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <div className="text-center px-4">
                                    <div className="text-2xl font-bold text-blue-300">
                                      {exerciseData[exercise.id]?.[setIndex]?.reps || set.reps}
                                    </div>
                                    <div className="text-blue-400 text-xs">reps</div>
                                  </div>
                                  <button
                                    onClick={() => updateExerciseData(exercise.id, setIndex, 'reps', (exerciseData[exercise.id]?.[setIndex]?.reps || set.reps) + 1)}
                                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/10 hover:from-blue-500/30 hover:to-blue-600/20 border border-blue-500/30 text-blue-300 hover:text-white transition-all duration-200 flex items-center justify-center touch-manipulation"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Weight Section */}
                              <div className="bg-gradient-to-br from-purple-500/5 to-purple-600/5 rounded-2xl p-4 border border-purple-500/20">
                                <div className="flex items-center justify-between mb-4">
                                  <h6 className="text-sm font-semibold text-purple-300">Weight</h6>
                                  <Zap className="w-4 h-4 text-purple-400" />
                                </div>
                                <div className="flex items-center justify-between max-w-xs mx-auto">
                                  <button
                                    onClick={() => updateExerciseData(exercise.id, setIndex, 'weight', Math.max(0, (exerciseData[exercise.id]?.[setIndex]?.weight || set.weight) - 2.5))}
                                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all duration-200 flex items-center justify-center touch-manipulation"
                                  >
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <div className="text-center px-4">
                                    <div className="text-2xl font-bold text-purple-300">
                                      {exerciseData[exercise.id]?.[setIndex]?.weight || set.weight}kg
                                    </div>
                                    <div className="text-purple-400 text-xs">weight</div>
                                  </div>
                                  <button
                                    onClick={() => updateExerciseData(exercise.id, setIndex, 'weight', (exerciseData[exercise.id]?.[setIndex]?.weight || set.weight) + 2.5)}
                                    className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/10 hover:from-purple-500/30 hover:to-purple-600/20 border border-purple-500/30 text-purple-300 hover:text-white transition-all duration-200 flex items-center justify-center touch-manipulation"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                      </div>
                    ))}
                  </div>
                </div>
                  )}

                  {exercise.notes && (
                    <div className="mt-6 p-6 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl backdrop-blur-sm">
                      <div className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Heart className="w-4 h-4 text-blue-400" />
                        </div>
                        <div>
                          <h6 className="text-sm font-semibold text-blue-300 mb-2">Exercise Notes</h6>
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

        {/* Workout Summary - Ultra Modern */}
        {isDayUnlocked && currentDayData && (
          <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl rounded-3xl border border-gray-700/50 p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="text-xl sm:text-2xl font-bold text-white">Workout Summary</h4>
                  <p className="text-gray-400 text-sm sm:text-base">Track your progress and achievements</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-bold text-[#dc1e3a]">
                  {Math.round((Object.values(completedExercises).filter(Boolean).length / currentDayData.exercises.length) * 100)}%
                </div>
                <div className="text-gray-400 text-sm">Complete</div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
              <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-green-400 mb-2">
                  {Object.values(completedExercises).filter(Boolean).length}
                </div>
                <div className="text-green-300 text-sm font-medium">Completed</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-blue-400 mb-2">
                  {currentDayData.exercises.length}
                </div>
                <div className="text-blue-300 text-sm font-medium">Total Exercises</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-400/30 rounded-2xl p-6 text-center backdrop-blur-sm">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <Activity className="w-6 h-6 text-purple-400" />
          </div>
                <div className="text-3xl sm:text-4xl font-bold text-purple-400 mb-2">
                  {currentDayData.exercises.reduce((total, exercise) => total + exercise.sets.length, 0)}
                </div>
                <div className="text-purple-300 text-sm font-medium">Total Sets</div>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-gray-300">Overall Progress</span>
                <span className="text-sm font-bold text-[#dc1e3a]">
                  {Object.values(completedExercises).filter(Boolean).length}/{currentDayData.exercises.length}
                </span>
              </div>
              <div className="w-full bg-gray-700/50 rounded-full h-4 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#dc1e3a] to-red-600 rounded-full transition-all duration-1000 ease-out shadow-lg"
                  style={{ 
                    width: `${(Object.values(completedExercises).filter(Boolean).length / currentDayData.exercises.length) * 100}%` 
                  }}
                ></div>
          </div>
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
              Week {currentWeek} is Locked
            </h3>
            <p className="text-slate-400 text-sm mb-4">
              Complete previous weeks to unlock this week's workouts.
            </p>
            <div className="flex items-center justify-center space-x-2 text-slate-500">
              <Flame className="w-4 h-4" />
              <span className="text-sm">Keep pushing forward!</span>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

// Combined version for ClientCombinedView
export const ClientWorkoutViewCombined: React.FC<ClientWorkoutViewCombinedProps> = ({
  clientView,
  isDark
}) => {
  const [unlockedWeeks, setUnlockedWeeks] = useState<number[]>([1]);

  // Update unlocked weeks based on workout assignment
  useEffect(() => {
    if (clientView.workoutAssignment?.weeks) {
      const unlocked = clientView.workoutAssignment.weeks
        .filter(week => week.isUnlocked)
        .map(week => week.weekNumber);
      setUnlockedWeeks(unlocked.length > 0 ? unlocked : [1]);
    }
  }, [clientView.workoutAssignment]);

  // Force refresh every 2 seconds to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      if (clientView.workoutAssignment?.weeks) {
        const unlocked = clientView.workoutAssignment.weeks
          .filter(week => week.isUnlocked)
          .map(week => week.weekNumber);
        setUnlockedWeeks(unlocked.length > 0 ? unlocked : [1]);
      }
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
      unlockedWeeks={unlockedWeeks}
      isDark={isDark}
    />
  );
};

export default ClientWorkoutView;