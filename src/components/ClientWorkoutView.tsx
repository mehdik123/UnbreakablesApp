import React, { useState, useEffect } from 'react';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { 
  Dumbbell, 
  Clock,
  Play,
  Pause,
  CheckCircle,
  Circle,
  RotateCcw,
  Target,
  Flame,
  Award,
  Lock,
  Unlock,
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Timer,
  Plus,
  Minus,
  Heart,
  Camera,
  Upload,
  Image,
  Trash2
} from 'lucide-react';
import { Client, WorkoutProgram, WorkoutDay, WorkoutExercise, WorkoutSet } from '../types';

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
  unlockedWeeks,
  isDark
}) => {
  const [currentDay, setCurrentDay] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<{ [exerciseId: string]: boolean }>({});
  const [exerciseData, setExerciseData] = useState<{ [exerciseId: string]: { [setIndex: number]: { reps: number; weight: number } } }>({});
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [workoutStartTime, setWorkoutStartTime] = useState<Date | null>(null);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  const SHARED_KEY = `client_${client.id}_assignment`;
  const [sharedVersion, setSharedVersion] = useState<number>(0);

  // Function to enrich program with video URLs from Supabase exercises table
  const enrichProgramWithVideoUrls = async (program: any) => {
    try {
      if (!isSupabaseReady || !supabase) return program;
      
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
        days: program.days.map((day: any) => ({
          ...day,
          exercises: day.exercises.map((workoutEx: any) => {
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
          })
        }))
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
        supabase.removeChannel(channel); 
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

  const currentDayData = currentWorkoutProgram.days[currentDay];
  const isDayUnlocked = unlockedWeeks.includes(currentWeek);

  // If no workout program is assigned, show a message
  if (!workoutProgram && !client.workoutAssignment?.program) {
  return (
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Dumbbell className="w-8 h-8 text-slate-400" />
            </div>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
            No Workout Plan Assigned
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-4">
            Your coach hasn't assigned a workout plan yet. Please check back later or contact your coach.
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
    setWorkoutStartTime(new Date());
  };

  const pauseWorkout = () => {
    setIsWorkoutActive(false);
  };

  const completeExercise = (exerciseId: string) => {
    setCompletedExercises(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId]
    }));
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
          .then(() => {})
          .catch(() => {});
        // Optional: log performance
        supabase.from('performance_logs').insert({
          assignment_id: assignmentId,
          week_number: currentWeek,
          day_number: currentDay + 1,
          exercise_id: exerciseId,
          set_index: setIndex,
          actual_reps: field === 'reps' ? value : (exerciseData[exerciseId]?.[setIndex]?.reps || 0),
          actual_weight: field === 'weight' ? value : (exerciseData[exerciseId]?.[setIndex]?.weight || 0)
        }).then(() => {}).catch(() => {});
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

  const resetWorkout = () => {
    setCompletedExercises({});
    setExerciseData({});
    setIsWorkoutActive(false);
    setWorkoutStartTime(null);
    setWorkoutDuration(0);
  };

  const getDayStatus = (dayIndex: number) => {
    const dayExercises = currentWorkoutProgram.days[dayIndex].exercises;
    const completedCount = dayExercises.filter(ex => completedExercises[ex.id]).length;
    const totalCount = dayExercises.length;
    
    if (completedCount === 0) return 'not-started';
    if (completedCount === totalCount) return 'completed';
    return 'in-progress';
  };

  const getDayStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'in-progress': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      default: return 'text-slate-600 bg-slate-50 dark:bg-slate-700';
    }
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

      <div className="px-3 sm:px-4 py-3 sm:py-4 space-y-3 sm:space-y-4 pb-20 max-w-full overflow-x-hidden">
        {/* Success Indicator - Show when using fresh CSV data */}
        {client.workoutAssignment?.program && !isUsingOldData && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">✅ Using Fresh CSV Data - All Exercise Names & Video Links Updated</span>
                <button
                onClick={() => window.location.reload()}
                className="ml-2 px-2 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs transition-colors"
                >
                🔄 Refresh
                </button>
        </div>
      </div>
        )}
        
        {/* Day Navigation - Ultra Responsive */}
        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <h4 className="text-sm sm:text-base font-semibold text-white">Workout Days</h4>
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
          <div className="flex space-x-1.5 sm:space-x-2 overflow-x-auto pb-1 sm:pb-2 scrollbar-hide max-w-full">
            {currentWorkoutProgram.days.map((day, index) => {
              const status = getDayStatus(index);
              const isCurrentDay = index === currentDay;
              
              return (
            <button
              key={day.id}
              onClick={() => setCurrentDay(index)}
                  disabled={!isDayUnlocked}
                  className={`flex-shrink-0 px-3 sm:px-4 py-2 sm:py-3 rounded-lg font-medium transition-all duration-200 ${
                    isCurrentDay
                      ? 'bg-blue-500 text-white shadow-lg'
                      : isDayUnlocked
                      ? 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
                      : 'bg-slate-700/30 text-slate-500 cursor-not-allowed border border-slate-600/30'
                  }`}
                >
                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                    {isDayUnlocked ? (
                      getDayStatusIcon(status)
                    ) : (
                      <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                    )}
                    <span className="text-xs sm:text-sm font-medium">{day.name}</span>
                  </div>
            </button>
              );
            })}
          </div>
          {!isDayUnlocked && (
            <div className="mt-2 sm:mt-3 p-2.5 sm:p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-xs flex items-center space-x-1.5 sm:space-x-2">
                <Lock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span>This week is locked. Complete previous weeks to unlock.</span>
              </p>
        </div>
          )}
      </div>

        {/* Current Day Workout */}
        {isDayUnlocked && currentDayData && (
          <div className="space-y-3 sm:space-y-4">
            {/* Exercises */}
            <div className="space-y-3 sm:space-y-4">
              {currentDayData.exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-3 sm:p-4 max-w-full overflow-hidden">
                  {/* Exercise Header - Ultra Responsive */}
                  <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-purple-500 rounded-lg flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {exerciseIndex + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h5 className="text-sm sm:text-base font-semibold text-white mb-1 truncate">
                        {exercise.exercise.name}
                      </h5>
                      <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap gap-1 sm:gap-0">
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-center">
                          {exercise.exercise.muscleGroup}
                        </span>
                        <span className="text-xs text-slate-400 bg-slate-700/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-center">
                          {exercise.exercise.equipment}
                        </span>
                      </div>
            </div>
          </div>

                  {/* Video Player - Enhanced */}
                  <div className="mb-4">
                    <a 
                      href={exercise.exercise.videoUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block relative bg-slate-900 rounded-lg overflow-hidden group"
                    >
                      <div className="aspect-video relative">
                        {getYouTubeThumbnail(exercise.exercise.videoUrl || '') ? (
                          <img 
                            src={getYouTubeThumbnail(exercise.exercise.videoUrl || '') || ''} 
                            alt={`${exercise.exercise.name} demonstration`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling.style.display = 'flex';
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <div className="text-center text-slate-400">
                              <div className="text-4xl mb-2">...</div>
                              <div className="text-sm">No video available</div>
                            </div>
                          </div>
                        )}
                        <div 
                          className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center group-hover:from-slate-700 group-hover:to-slate-800 transition-all duration-300" 
                          style={{ display: getYouTubeThumbnail(exercise.exercise.videoUrl || '') ? 'none' : 'flex' }}
                        >
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto group-hover:bg-white/30 transition-all duration-300">
                              <Play className="w-6 h-6 text-white ml-1" />
                            </div>
                            <p className="text-white/80 text-sm group-hover:text-white transition-colors duration-300">Video Demonstration</p>
                            <p className="text-white/60 text-xs mt-1 group-hover:text-white/80 transition-colors duration-300">Click to watch on YouTube</p>
                          </div>
                        </div>
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center">
                          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                            <Play className="w-6 h-6 text-white ml-1" />
                          </div>
            </div>
                        <div className="absolute bottom-2 right-2">
                          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded">
                            1:00
                    </div>
                    </div>
                      </div>
                    </a>
                  </div>

                  {/* Mark Complete Button */}
                  <div className="flex justify-center mb-4">
                    <button
                      onClick={() => completeExercise(exercise.id)}
                      className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        completedExercises[exercise.id]
                          ? 'bg-green-500 text-white'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
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

                  {/* Sets & Reps Section - Only show if not completed */}
                  {!completedExercises[exercise.id] && (
                    <div className="space-y-3">
                      <h6 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                        <Dumbbell className="w-4 h-4 text-purple-400" />
                        <span>Sets & Reps</span>
                      </h6>

                      {/* Set-based organization - Redesigned to match attached image */}
                  <div className="space-y-3">
                    {exercise.sets.map((set, setIndex) => (
                          <div key={setIndex} className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/50 max-w-full overflow-hidden">
                            <div className="flex items-center space-x-4">
                              {/* Set Number */}
                              <div className="flex items-center space-x-2">
                                <span className="text-white text-sm font-medium w-8">Set {setIndex + 1}</span>
                              </div>
                              
                              {/* Reps Section */}
                        <div className="flex items-center space-x-2">
                          <button
                                  onClick={() => updateExerciseData(exercise.id, setIndex, 'reps', Math.max(0, (exerciseData[exercise.id]?.[setIndex]?.reps || set.reps) - 1))}
                                  className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                                <span className="text-white font-bold text-lg min-w-[2rem] text-center">
                                  {exerciseData[exercise.id]?.[setIndex]?.reps || set.reps}
                                </span>
                          <button
                                  onClick={() => updateExerciseData(exercise.id, setIndex, 'reps', (exerciseData[exercise.id]?.[setIndex]?.reps || set.reps) + 1)}
                                  className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                                <span className="text-slate-400 text-sm">reps</span>
                        </div>

                              {/* Weight Section */}
                        <div className="flex items-center space-x-2">
                          <button
                                  onClick={() => updateExerciseData(exercise.id, setIndex, 'weight', Math.max(0, (exerciseData[exercise.id]?.[setIndex]?.weight || set.weight) - 2.5))}
                                  className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                                <span className="text-white font-bold text-lg min-w-[3rem] text-center">
                                  {exerciseData[exercise.id]?.[setIndex]?.weight || set.weight}kg
                                </span>
                          <button
                                  onClick={() => updateExerciseData(exercise.id, setIndex, 'weight', (exerciseData[exercise.id]?.[setIndex]?.weight || set.weight) + 2.5)}
                                  className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>

                              {/* Delete Button */}
                              <button className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center justify-center ml-auto">
                                <Trash2 className="w-4 h-4" />
                        </button>
                            </div>
                      </div>
                    ))}
                  </div>
                </div>
                  )}

                  {exercise.notes && (
                    <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <p className="text-sm text-blue-300 italic font-medium">{exercise.notes}</p>
            </div>
          )}
                </div>
              ))}
            </div>
        </div>
      )}

        {/* Workout Summary */}
        {isDayUnlocked && currentDayData && (
          <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-4">
            <h4 className="text-base font-semibold text-white mb-4 flex items-center space-x-2">
              <Target className="w-4 h-4 text-green-400" />
              <span>Workout Summary</span>
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <div className="text-lg font-bold text-green-400 mb-1">
                  {Object.values(completedExercises).filter(Boolean).length}
                </div>
                <div className="text-slate-300 text-xs">Completed</div>
              </div>
              <div className="text-center bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <div className="text-lg font-bold text-blue-400 mb-1">
                  {currentDayData.exercises.length}
                </div>
                <div className="text-slate-300 text-xs">Total</div>
              </div>
              <div className="text-center bg-slate-700/30 rounded-lg p-3 border border-slate-600/50">
                <div className="text-lg font-bold text-purple-400 mb-1">
                  {Math.round((Object.values(completedExercises).filter(Boolean).length / currentDayData.exercises.length) * 100)}%
          </div>
                <div className="text-slate-300 text-xs">Progress</div>
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
  const [currentWeek, setCurrentWeek] = useState(1);
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
    id: clientView.clientId,
    name: clientView.clientName,
    email: '',
    phone: '',
    goal: 'general_fitness',
    numberOfWeeks: clientView.workoutAssignment?.duration || 12,
    startDate: new Date(),
    weightLog: [],
    physiqueImages: {},
    workoutAssignment: clientView.workoutAssignment,
    nutritionPlan: clientView.nutritionPlan
  };

  return (
    <ClientWorkoutView
      client={client}
      currentWeek={currentWeek}
      unlockedWeeks={unlockedWeeks}
      isDark={isDark}
    />
  );
};

export default ClientWorkoutView;