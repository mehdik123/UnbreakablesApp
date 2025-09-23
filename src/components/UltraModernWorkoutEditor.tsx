import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Dumbbell, 
  Plus, 
  Minus,
  ChevronLeft, 
  ChevronRight,
  ChevronDown,
  User,
  CheckCircle,
  Calendar,
  Target,
  Lock,
  Unlock,
  Play,
  Zap,
  Activity,
  Trash2,
  X,
} from 'lucide-react';
import { Client, ClientWorkoutAssignment, WorkoutProgram, WorkoutExercise, Exercise, WorkoutDay } from '../types';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { exercises } from '../data/exercises';
import { dbListWorkoutPrograms, dbUpdateWorkoutAssignment } from '../lib/db';
// import { WeekProgressionManager } from '../utils/weekProgressionManager';
// import { unlockWeek, canUnlockWeek, getNextUnlockableWeek } from '../utils/weekUnlockManager';

interface UltraModernWorkoutEditorProps {
  client: Client;
  isDark: boolean;
  onSaveAssignment: (assignment: ClientWorkoutAssignment) => void;
}

export const UltraModernWorkoutEditor: React.FC<UltraModernWorkoutEditorProps> = ({
  client,
  onSaveAssignment
}) => {
  // Tab management
  const [activeTab, setActiveTab] = useState<'workout' | 'progression'>('workout');
  
  // Load workout templates from database
  const [workoutPrograms, setWorkoutPrograms] = useState<WorkoutProgram[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(true);
  // Load workout templates from database
  useEffect(() => {
    loadWorkoutTemplates();
  }, []);

  const loadWorkoutTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const { data } = await dbListWorkoutPrograms();
      if (data) {
        // Convert database programs to WorkoutProgram format
        const programs: WorkoutProgram[] = data.map((program: any) => ({
          id: program.id,
          name: program.name,
          description: program.description || '',
          days: (program.workout_days || []).map((day: any) => ({
            id: day.id,
            name: day.name,
            exercises: (day.workout_exercises || []).map((workoutExercise: any) => ({
              id: `${day.id}-${workoutExercise.id}`,
              exercise: {
                id: workoutExercise.exercises?.id || workoutExercise.exercise_id,
                name: workoutExercise.exercises?.name || workoutExercise.exercise_id || 'Unknown Exercise',
                muscleGroup: workoutExercise.exercises?.muscle_group || '',
                videoUrl: workoutExercise.exercises?.video_url || '',
                equipment: '',
                instructions: '',
                difficulty: 'intermediate' as const,
                category: 'strength' as const,
                primaryMuscles: [],
                secondaryMuscles: [],
                createdAt: new Date(),
                updatedAt: new Date()
              },
              sets: (workoutExercise.workout_sets || []).map((set: any) => ({
                id: `${workoutExercise.id}-set-${set.set_order}`,
                reps: set.reps,
                weight: set.weight,
                completed: false,
                restPeriod: set.rest_seconds || 90
              })),
              rest: workoutExercise.rest || '90 seconds',
              restPeriod: parseInt(workoutExercise.rest?.replace(/[^0-9]/g, '') || '90'),
              notes: workoutExercise.notes || '',
              order: workoutExercise.ex_order
            }))
          })),
          createdAt: new Date(program.created_at || Date.now()),
          updatedAt: new Date(program.updated_at || Date.now())
        }));
        setWorkoutPrograms(programs);
        console.log('Loaded workout programs:', programs);
      }
    } catch (error) {
      console.error('Failed to load workout programs:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };
  const [selectedProgram, setSelectedProgram] = useState<WorkoutProgram | null>(null);
  const [assignmentId, setAssignmentId] = useState<string | null>(null);
  // Single shared storage key so coach and client edit the same instance
  const SHARED_KEY = `client_${client.id}_assignment`;
  const [sharedVersion, setSharedVersion] = useState<number>(0);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [currentDay, setCurrentDay] = useState(0);
  const [weeks, setWeeks] = useState<Array<{
    weekNumber: number;
    isUnlocked: boolean;
    isCompleted: boolean;
    exercises: WorkoutExercise[];
  }>>([]);
  const [showProgramSelection, setShowProgramSelection] = useState(true);
  const [showModificationInterface, setShowModificationInterface] = useState(false);
  const [isEditingTemplate, setIsEditingTemplate] = useState(false);
  const [hasModifications, setHasModifications] = useState(false);
  const [originalWeeks, setOriginalWeeks] = useState<Array<{
    weekNumber: number;
    isUnlocked: boolean;
    isCompleted: boolean;
    exercises: WorkoutExercise[];
  }>>([]);
  const [customWorkout, setCustomWorkout] = useState<{
    name: string;
    description: string;
    days: Array<{
      id: string;
      name: string;
      exercises: WorkoutExercise[];
    }>;
  }>({
    name: '',
    description: '',
    days: []
  });
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number | null>(null);
  const [exerciseSearch, setExerciseSearch] = useState('');
  const [assignmentSuccess, setAssignmentSuccess] = useState(false);
  const [focusedField, setFocusedField] = useState<{
    dayIndex: number;
    exerciseIndex: number;
    setIndex: number;
    field: 'exercise' | 'reps' | 'weight' | 'rest';
  } | null>(null);
  const [showExerciseSearch, setShowExerciseSearch] = useState<string | null>(null);


  // FIX: Real-time sync via Supabase if available, else storage key
  useEffect(() => {
    (async () => {
      // Prefer Supabase
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
                setSelectedProgram(asg.program_json as unknown as WorkoutProgram);
                setShowProgramSelection(false); // Hide template selection, show workout editor
                
                // SIMPLIFIED: Generate weeks based on current week from database
                console.log('🔄 SIMPLE LOAD - Loading from Supabase, current_week:', asg.current_week);
                
                // Generate simple weeks array - only the current week is unlocked
                const simpleWeeks = Array.from({ length: client.numberOfWeeks || 12 }, (_, index) => ({
                  weekNumber: index + 1,
                  isUnlocked: index + 1 === asg.current_week, // Only current week is unlocked
                  isCompleted: false,
                  exercises: [],
                  days: []
                }));
                
                console.log('🔄 SIMPLE LOAD - Generated weeks with unlocked week:', asg.current_week);
                setWeeks(simpleWeeks);
                setOriginalWeeks(JSON.parse(JSON.stringify(simpleWeeks)));
              }
              if (asg.current_week) setCurrentWeek(asg.current_week);
              if (typeof asg.current_day === 'number') setCurrentDay(Math.max(0, (asg.current_day || 1) - 1));
            }
          }
        } catch {}
      } else {
        // Fallback: shared key/local client prop
        try {
          const sharedRaw = localStorage.getItem(SHARED_KEY);
          if (sharedRaw) {
            const shared = JSON.parse(sharedRaw);
            if (shared?.workoutAssignment?.program) {
              setSelectedProgram(shared.workoutAssignment.program);
              setSharedVersion(shared.version || 0);
            }
          } else if (client.workoutAssignment?.program) {
            setSelectedProgram(client.workoutAssignment.program);
          }
        } catch {}
      }
    })();

    // Supabase realtime subscribe for coach
    if (isSupabaseReady && supabase && assignmentId) {
      const channel = supabase
        .channel(`assignment-${assignmentId}-coach`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'workout_assignments',
          filter: `id=eq.${assignmentId}`
        }, (payload) => {
          const row: any = payload.new;
          if (row?.program_json && row.last_modified_by === 'client') {
            setSelectedProgram(row.program_json as WorkoutProgram);
            setSharedVersion(row.version || 0);
            
            // Update current week/day if changed
            if (row.current_week && row.current_week !== currentWeek) {
              setCurrentWeek(row.current_week);
            }
            if (typeof row.current_day === 'number' && row.current_day !== currentDay + 1) {
              setCurrentDay(Math.max(0, (row.current_day || 1) - 1));
            }
          }
        })
        .subscribe();
      return () => { 
        supabase?.removeChannel(channel); 
      };
    } else {
      // Local storage sync
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key !== SHARED_KEY) return;
        try {
          const shared = e.newValue ? JSON.parse(e.newValue) : null;
          if (!shared) return;
          if (typeof shared.version === 'number' && shared.version <= sharedVersion) return;
          if (shared?.workoutAssignment?.program) {
            setSharedVersion(shared.version || 0);
            setSelectedProgram(shared.workoutAssignment.program);
          }
        } catch {}
      };
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [client.id, client.workoutAssignment?.id, SHARED_KEY, sharedVersion, assignmentId]);

  // Derive weeks from selectedProgram (single source of truth)
  useEffect(() => {
    if (selectedProgram) {
      const weekData = createWeekBasedWorkout(selectedProgram, client.numberOfWeeks);
      setWeeks(weekData);
    }
  }, [selectedProgram, client.numberOfWeeks, currentDay]);

  // Simple keyboard navigation for workout editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!focusedField) return;
      
      const { dayIndex, exerciseIndex, setIndex, field } = focusedField;
      const day = customWorkout.days[dayIndex];
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (field === 'exercise' && exerciseIndex > 0) {
            setFocusedField(prev => prev ? { ...prev, exerciseIndex: prev.exerciseIndex - 1 } : null);
          }
          break;
          
        case 'ArrowDown':
          e.preventDefault();
          if (field === 'exercise' && exerciseIndex < (day?.exercises?.length || 0) - 1) {
            setFocusedField(prev => prev ? { ...prev, exerciseIndex: prev.exerciseIndex + 1 } : null);
          }
          break;
          
        case 'ArrowLeft':
          e.preventDefault();
          if (field === 'exercise') {
            setFocusedField(prev => prev ? { ...prev, field: 'rest' } : null);
          } else if (field === 'rest') {
            setFocusedField(prev => prev ? { ...prev, field: 'weight' } : null);
          } else if (field === 'weight') {
            setFocusedField(prev => prev ? { ...prev, field: 'reps' } : null);
          } else if (field === 'reps' && setIndex > 0) {
            setFocusedField(prev => prev ? { ...prev, setIndex: prev.setIndex - 1, field: 'reps' } : null);
          }
          break;
          
        case 'ArrowRight':
          e.preventDefault();
          if (field === 'reps') {
            setFocusedField(prev => prev ? { ...prev, field: 'weight' } : null);
          } else if (field === 'weight') {
            setFocusedField(prev => prev ? { ...prev, field: 'rest' } : null);
          } else if (field === 'rest') {
            setFocusedField(prev => prev ? { ...prev, field: 'exercise' } : null);
          } else if (field === 'exercise') {
            setFocusedField(prev => prev ? { ...prev, setIndex: prev.setIndex + 1, field: 'reps' } : null);
          }
          break;
          
        case 'Enter':
          e.preventDefault();
          if (field === 'exercise') {
            setShowExerciseModal(true);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setFocusedField(null);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [focusedField, customWorkout.days]);


  // Load existing workout assignment on component mount (only if no Supabase data available)
  useEffect(() => {
    console.log('🔄 SIMPLE USEEFFECT - client.id:', client.id, 'assignment.id:', client.workoutAssignment?.id);
    
    // Only run this if we don't have Supabase data available
    if (client.workoutAssignment?.program && !isSupabaseReady) {
      setSelectedProgram(client.workoutAssignment.program);
      setShowProgramSelection(false);
      setShowModificationInterface(false);
      setIsEditingTemplate(false);
      
      // SIMPLIFIED: Generate weeks based on current week from assignment
      const currentWeekFromAssignment = client.workoutAssignment.currentWeek || 1;
      console.log('🔄 SIMPLE LOAD - Loading from assignment, current_week:', currentWeekFromAssignment);
      
      const simpleWeeks = Array.from({ length: client.numberOfWeeks || 12 }, (_, index) => ({
        weekNumber: index + 1,
        isUnlocked: index + 1 === currentWeekFromAssignment, // Only current week is unlocked
        isCompleted: false,
        exercises: [],
        days: []
      }));
      
      console.log('🔄 SIMPLE LOAD - Generated weeks with unlocked week:', currentWeekFromAssignment);
      setWeeks(simpleWeeks);
      setOriginalWeeks(JSON.parse(JSON.stringify(simpleWeeks)));
      setHasModifications(false);
    }
  }, [client.id, client.workoutAssignment?.id, isSupabaseReady]); // Only run when client or assignment ID changes


  const createWeekBasedWorkout = (program: WorkoutProgram, numberOfWeeks: number) => {
    const weekData = [];
    
    for (let week = 1; week <= numberOfWeeks; week++) {
      // Create complete workout structure for all days
      const weekDays: WorkoutDay[] = program.days ? program.days.map((day, dayIndex) => ({
        ...day,
        exercises: day.exercises.map((exercise, exerciseIndex) => ({
          ...exercise,
          id: `${exercise.exercise.id}-day-${dayIndex}-week-${week}-exercise-${exerciseIndex}`,
          // Preserve the original exercise data including videoUrl
          exercise: exercise.exercise,
          sets: exercise.sets.map((set, setIndex) => ({
            ...set,
            id: `${exercise.exercise.id}-day-${dayIndex}-week-${week}-exercise-${exerciseIndex}-set-${setIndex}`,
            // Apply progression based on week number
            reps: week === 1 ? set.reps : set.reps + (week - 1) * 2,
            weight: week === 1 ? set.weight : set.weight + (week - 1) * 2.5
          }))
        }))
      })) : [];
      
      // Create exercises for the current day only (for backward compatibility)
      const currentDayExercises: WorkoutExercise[] = program.days && program.days[currentDay]?.exercises 
        ? program.days[currentDay].exercises.map((exercise, exerciseIndex) => ({
            ...exercise,
            id: `${exercise.exercise.id}-day-${currentDay}-week-${week}-exercise-${exerciseIndex}`,
            // Preserve the original exercise data including videoUrl
            exercise: exercise.exercise,
            sets: exercise.sets.map((set, setIndex) => ({
              ...set,
              id: `${exercise.exercise.id}-day-${currentDay}-week-${week}-exercise-${exerciseIndex}-set-${setIndex}`,
              // Apply progression based on week number
              reps: week === 1 ? set.reps : set.reps + (week - 1) * 2,
              weight: week === 1 ? set.weight : set.weight + (week - 1) * 2.5
            }))
          }))
        : [];
      
      weekData.push({
        weekNumber: week,
        isUnlocked: week === 1, // Only first week is unlocked initially
        isCompleted: false,
        exercises: currentDayExercises,
        days: weekDays // Add the complete days structure
      } as any);
    }
    
    return weekData;
  };

  const handleSelectProgram = (program: WorkoutProgram) => {
    setSelectedProgram(program);
    setShowProgramSelection(false);
    setShowModificationInterface(false);
    setIsEditingTemplate(false);
    
    // Create week-based workout structure
    const weekData = createWeekBasedWorkout(program, client.numberOfWeeks);
    setWeeks(weekData);
    
    // Automatically save the assignment when selecting a template
    const assignment: ClientWorkoutAssignment = {
      id: Date.now().toString(),
      clientId: client.id,
      clientName: client.name || 'Unknown Client',
      program: program,
      startDate: new Date(),
      duration: client.numberOfWeeks,
      currentWeek: 1,
      currentDay: 1,
      weeks: weekData.map(week => ({
        weekNumber: week.weekNumber,
        isUnlocked: week.isUnlocked,
        isCompleted: week.isCompleted,
        exercises: week.exercises || [], // Use the actual exercises from the week
        days: week.days || [], // Use the actual days from the week
        progressionNotes: week.weekNumber > 1 ? `Week ${week.weekNumber} progression applied` : undefined
      })),
      progressionRules: [],
      isActive: true
    };

    onSaveAssignment(assignment);
    
    // Show success message
    setAssignmentSuccess(true);
    setTimeout(() => setAssignmentSuccess(false), 3000);
  };

  // Simple week change handler
  const handleWeekChange = (weekNumber: number) => {
    console.log('📅 WEEK CHANGE - Changing to week:', weekNumber);
    setCurrentWeek(weekNumber);
  };

  // Proper week unlock function using the week unlock manager
  const handleUnlockCurrentWeek = async () => {
    console.log('🔓 WEEK UNLOCK - Unlocking week:', currentWeek);
    
    if (!client.workoutAssignment) {
      console.log('❌ WEEK UNLOCK - No workout assignment found');
      alert('No workout assignment found. Please assign a workout program first.');
      return;
    }

    // Simple check if week can be unlocked
    if (currentWeek <= 1) {
      alert('Cannot unlock the first week or a negative week number.');
      return;
    }

    const currentWeekData = client.workoutAssignment.weeks?.find(w => w.weekNumber === currentWeek);
    if (currentWeekData?.isUnlocked) {
      alert(`Week ${currentWeek} is already unlocked.`);
      return;
    }

    const previousWeekData = client.workoutAssignment.weeks?.find(w => w.weekNumber === currentWeek - 1);
    if (!previousWeekData || !previousWeekData.isUnlocked) {
      alert(`Week ${currentWeek - 1} must be unlocked first.`);
      return;
    }

    try {
      // Update the local state
      setWeeks(prevWeeks => 
        prevWeeks.map(week => 
          week.weekNumber === currentWeek 
            ? { ...week, isUnlocked: true }
            : week
        )
      );
      
      // Create updated assignment
      const updatedAssignment: ClientWorkoutAssignment = {
        ...client.workoutAssignment,
        weeks: client.workoutAssignment.weeks?.map(week => 
          week.weekNumber === currentWeek 
            ? { ...week, isUnlocked: true }
            : week
        ) || [],
        currentWeek: currentWeek,
        lastModifiedBy: 'coach',
        lastModifiedAt: new Date()
      };
      
      // Save the updated assignment
      onSaveAssignment(updatedAssignment);
      
      alert(`Week ${currentWeek} has been unlocked!`);
    } catch (error) {
      console.error('❌ WEEK UNLOCK - Error:', error);
      alert(`Error unlocking week: ${error}`);
    }
  };

  // Auto-save function for coach changes
  const autoSaveChanges = (updatedProgram: WorkoutProgram) => {
    if (client.workoutAssignment) {
      const updatedAssignment = {
        ...client.workoutAssignment,
        program: updatedProgram,
        lastModifiedBy: 'coach' as const,
        lastModifiedAt: new Date()
      };
      onSaveAssignment(updatedAssignment);
    }
  };

  // Handle exercise replacement
  const handleReplaceExercise = (exerciseId: string, newExercise: Exercise) => {
    if (selectedProgram) {
      const updatedProgram = {
        ...selectedProgram,
        days: selectedProgram.days.map((day, dayIndex) => 
          dayIndex === currentDay 
            ? {
                ...day,
                exercises: day.exercises.map(ex => 
                  ex.id === exerciseId
                    ? {
                        ...ex,
                        exercise: newExercise
                      }
                    : ex
                )
              }
            : day
        )
      };
      
      // Update both selectedProgram and weeks state immediately
      setSelectedProgram(updatedProgram);
      setWeeks(prev => prev.map(week => 
        week.weekNumber === currentWeek 
          ? {
              ...week,
              exercises: updatedProgram.days[currentDay].exercises
            }
          : week
      ));
      
      // Auto-save after modification (immediate)
      handleSaveAssignment();
    }
    
    setShowExerciseSearch(null);
  };



  const handleRemoveSet = (weekNumber: number, exerciseId: string, setId: string) => {
    setWeeks(prev => prev.map(week => 
      week.weekNumber === weekNumber 
        ? {
            ...week,
            exercises: week.exercises.map(exercise => 
              exercise.id === exerciseId 
                ? {
                    ...exercise,
                    sets: exercise.sets.filter(set => set.id !== setId)
                  }
                : exercise
            )
          }
        : week
    ));
  };

  const handleUpdateReps = (_weekNumber: number, exerciseId: string, setId: string, change: number) => {
    if (selectedProgram && selectedProgram.days && selectedProgram.days[currentDay] && selectedProgram.days[currentDay].exercises) {
      // Find the current set to get old value
      const currentExercise = selectedProgram.days[currentDay]?.exercises?.find(ex => ex.id === exerciseId);
      const currentSet = currentExercise?.sets?.find(set => set.id === setId);
      const oldReps = currentSet?.reps || 0;
      const newReps = Math.max(1, oldReps + change);
      
      // First update the selectedProgram (source of truth)
      const updatedProgram = {
        ...selectedProgram,
        days: selectedProgram.days.map((day, dayIndex) => 
          dayIndex === currentDay 
            ? {
                ...day,
                exercises: (day.exercises || []).map(exercise => 
                  exercise.id === exerciseId 
                    ? {
                        ...exercise,
                        sets: (exercise.sets || []).map(set => 
                          set.id === setId 
                            ? { ...set, reps: newReps }
                            : set
                        )
                      }
                    : exercise
                )
              }
            : day
        )
      };
      
      
      // Update source of truth only; weeks derive from selectedProgram effect
      setSelectedProgram(updatedProgram);
      // Auto-save the changes
      handleSaveAssignment(updatedProgram);
    }
  };

  const handleUpdateWeight = (_weekNumber: number, exerciseId: string, setId: string, change: number) => {
    if (selectedProgram && selectedProgram.days && selectedProgram.days[currentDay] && selectedProgram.days[currentDay].exercises) {
      // Find the current set to get old value
      const currentExercise = selectedProgram.days[currentDay]?.exercises?.find(ex => ex.id === exerciseId);
      const currentSet = currentExercise?.sets?.find(set => set.id === setId);
      const oldWeight = currentSet?.weight || 0;
      const newWeight = Math.max(0, oldWeight + change);
      
      // First update the selectedProgram (source of truth)
      const updatedProgram = {
        ...selectedProgram,
        days: selectedProgram.days.map((day, dayIndex) => 
          dayIndex === currentDay 
            ? {
                ...day,
                exercises: (day.exercises || []).map(exercise => 
                  exercise.id === exerciseId 
                    ? {
                        ...exercise,
                        sets: (exercise.sets || []).map(set => 
                          set.id === setId 
                            ? { ...set, weight: newWeight }
                            : set
                        )
                      }
                    : exercise
                )
              }
            : day
        )
      };
      
      console.log('🔵 UPDATED PROGRAM:', {
        before: selectedProgram.days[currentDay]?.exercises?.find(ex => ex.id === exerciseId)?.sets?.find(set => set.id === setId),
        after: updatedProgram.days[currentDay]?.exercises?.find(ex => ex.id === exerciseId)?.sets?.find(set => set.id === setId)
      });
      
      // Update source of truth only; weeks derive from selectedProgram effect
      setSelectedProgram(updatedProgram);
      // Save latest program explicitly to avoid boomerang
      setTimeout(() => handleSaveAssignment(updatedProgram), 25);
      
      console.log('🔵 handleUpdateWeight completed successfully');
    } else {
      console.log('🔵 ERROR: selectedProgram or required data is missing:', {
        selectedProgram: !!selectedProgram,
        days: selectedProgram?.days?.length,
        currentDay: currentDay,
        exercises: selectedProgram?.days?.[currentDay]?.exercises?.length
      });
    }
  };


  const handleSaveAssignment = async (programOverride?: WorkoutProgram) => {
    const programRef = programOverride || selectedProgram;
    if (!programRef) {
      return;
    }

    // Enrich the program with video URLs before saving
    let enrichedProgram = programRef;
    if (isSupabaseReady && supabase) {
      try {
        const { data: dbExercises } = await supabase
          .from('exercises')
          .select('name, video_url, muscle_group');
        
        if (dbExercises) {
          const exerciseMap = new Map();
          dbExercises.forEach(ex => {
            exerciseMap.set(ex.name, ex);
          });
          
          enrichedProgram = {
            ...programRef,
            days: programRef.days.map((day: any) => ({
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
        }
      } catch (error) {
        console.error('❌ Coach failed to enrich program with video URLs:', error);
      }
    }

    // Use the enriched program as the source of truth
    const updatedProgram = enrichedProgram;


    const assignment: ClientWorkoutAssignment = {
      id: client.workoutAssignment?.id || Date.now().toString(),
      clientId: client.id,
      clientName: client.name || 'Unknown Client',
      program: updatedProgram, // Use the updated program
      startDate: client.workoutAssignment?.startDate || new Date(),
      duration: client.numberOfWeeks,
      currentWeek: currentWeek,
      currentDay: currentDay + 1,
      weeks: weeks.map(week => {
        const weekData = {
        weekNumber: week.weekNumber,
        isUnlocked: week.isUnlocked,
        isCompleted: week.isCompleted,
        exercises: week.exercises || [], // Required by WorkoutWeek interface
          days: (week as any).days || [], // Use the actual days data from the week
        progressionNotes: week.weekNumber > 1 ? `Week ${week.weekNumber} progression applied` : undefined
        };
        console.log(`🔍 SAVE ASSIGNMENT - Week ${week.weekNumber} data:`, weekData);
        console.log(`🔍 SAVE ASSIGNMENT - Week ${week.weekNumber} days count:`, weekData.days.length);
        return weekData;
      }),
      progressionRules: [],
      isActive: true,
      // Real-time sync tracking
      lastModifiedBy: 'coach',
      lastModifiedAt: new Date()
    };

    if (isSupabaseReady && supabase && assignmentId) {
      // Include the complete assignment data with weeks progression
      const completeAssignmentData = {
        ...assignment,
        program: updatedProgram
      };
      
      try {
        await supabase
          .from('workout_assignments')
          .update({
            program_json: completeAssignmentData as unknown as any,
            current_week: assignment.currentWeek,
            current_day: assignment.currentDay,
            last_modified_by: 'coach',
            version: (sharedVersion || 0) + 1
          })
          .eq('id', assignmentId);
        console.log('✅ Assignment with week progression saved to Supabase');
      } catch (error: any) {
        console.error('❌ Error saving assignment to Supabase:', error);
      }
    } else {
      // Save to single shared key for real-time sync
      try {
        const existing = localStorage.getItem(SHARED_KEY);
        const prev = existing ? JSON.parse(existing) : {};
        const nextVersion = (prev?.version || 0) + 1;
        const sharedData = {
          clientName: client.name || 'Unknown Client',
          clientId: client.id,
          workoutAssignment: assignment,
          lastModifiedBy: 'coach' as const,
          lastModifiedAt: new Date().toISOString(),
          version: nextVersion
        };
        localStorage.setItem(SHARED_KEY, JSON.stringify(sharedData));
        setSharedVersion(nextVersion);
        window.dispatchEvent(new StorageEvent('storage', { key: SHARED_KEY, newValue: JSON.stringify(sharedData) }));
      } catch {}
    }

    onSaveAssignment(assignment);
    setHasModifications(false);
    setOriginalWeeks(JSON.parse(JSON.stringify(weeks))); // Update original state
  };

  // Check for modifications
  const checkForModifications = () => {
    if (originalWeeks.length === 0) {
      setHasModifications(false);
      return;
    }
    const hasChanges = JSON.stringify(weeks) !== JSON.stringify(originalWeeks);
    setHasModifications(hasChanges);
  };

  // Update modifications when weeks change
  useEffect(() => {
    // Only check modifications if we have original weeks to compare against
    if (originalWeeks.length > 0) {
      checkForModifications();
    }
  }, [weeks, originalWeeks]);


  const currentWeekData = React.useMemo(() => {
    const data = weeks.find(w => w.weekNumber === currentWeek);
    console.log('🔍 SIMPLE DEBUG - currentWeek:', currentWeek, 'isUnlocked:', data?.isUnlocked);
    return data;
  }, [weeks, currentWeek]);
  
  // Force re-render when weeks change
  // const [renderKey, setRenderKey] = useState(0);
  // useEffect(() => {
  //   setRenderKey(prev => prev + 1);
  // }, [weeks]);
  const currentDayData = selectedProgram?.days && currentDay >= 0 && currentDay < selectedProgram.days.length 
    ? selectedProgram.days[currentDay] 
    : null;
  const totalSets = currentDayData?.exercises?.reduce((total, exercise) => total + exercise.sets.length, 0) || 0;
  const completedSets = currentDayData?.exercises?.reduce((total, exercise) => 
    total + exercise.sets.filter(set => set.completed).length, 0) || 0;


  // Only show loading when templates are being loaded
  if (loadingTemplates) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading workout templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Success Message */}
      {assignmentSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="w-5 h-5" />
          <span>Workout assigned successfully!</span>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Back button - Only show when not in program selection */}
              {!showProgramSelection && (
              <button
                  onClick={() => {
                    if (showModificationInterface) {
                      setShowModificationInterface(false);
                      setShowProgramSelection(true);
                      setCustomWorkout({ name: '', description: '', days: [] });
                    } else {
                      setShowProgramSelection(true);
                      setSelectedProgram(null);
                      setWeeks([]);
                    }
                  }}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              )}
              <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Workout Editor</h1>
                <p className="text-slate-400 text-sm">Creating workout plan for {client.name}</p>
              </div>
            </div>
            
            {/* Tab Navigation - Show when client has workout assignment */}
            {client.workoutAssignment && (
              <div className="flex items-center space-x-1 bg-slate-700/30 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('workout')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'workout'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Dumbbell className="w-4 h-4" />
                    <span>Workout</span>
                  </div>
                </button>
                <button
                  onClick={() => setActiveTab('progression')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                    activeTab === 'progression'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-600/50'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>Week Progress</span>
                  </div>
                </button>
              </div>
            )}
            
            {/* Assignment Controls - Only show when program is selected */}
            {selectedProgram && !showProgramSelection && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => handleSaveAssignment()}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200"
                >
                  <Save className="w-4 h-4" />
                  <span>Assign to Client</span>
                </button>
                
                {/* Show modification indicator if there are changes */}
                {hasModifications && (
                  <div className="text-sm text-yellow-400">
                    ⚠️ Changes detected - Will assign to Week {currentWeek}
            </div>
                )}
              </div>
            )}
            
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        
        {/* Week Progression Tab Content */}
        {activeTab === 'progression' && client.workoutAssignment ? (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Week Progression Control</h2>
              <p className="text-slate-400 text-lg">Control which week {client.name} is currently on</p>
            </div>
            
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Current Week Display */}
              <div className="bg-slate-700/30 rounded-xl p-6 text-center">
                <div className="text-4xl font-bold text-blue-400 mb-2">
                  Week {client.workoutAssignment.currentWeek}
                </div>
                <div className="text-slate-300">Client's Current Active Week</div>
              </div>

              {/* Week Control Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={async () => {
                    if (!client.workoutAssignment || client.workoutAssignment.currentWeek <= 1) return;
                    
                    const newWeek = client.workoutAssignment.currentWeek - 1;
                    
                    const updatedAssignment: ClientWorkoutAssignment = {
                      ...client.workoutAssignment,
                      currentWeek: newWeek,
                      lastModifiedBy: 'coach' as const,
                      lastModifiedAt: new Date()
                    };
                    
                    // Update local state and database in one operation
                    await onSaveAssignment(updatedAssignment);
                    alert(`${client.name} moved back to Week ${newWeek}`);
                  }}
                  disabled={!client.workoutAssignment || client.workoutAssignment.currentWeek <= 1}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-slate-600 hover:bg-slate-500 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Previous Week</span>
                </button>

                <button
                  onClick={async () => {
                    if (!client.workoutAssignment || client.workoutAssignment.currentWeek >= client.workoutAssignment.duration) return;
                    
                    const newWeek = client.workoutAssignment.currentWeek + 1;
                    
                    console.log('🚀 COACH WEEK ADVANCE DEBUG:', {
                      clientName: client.name || 'Unknown Client',
                      currentWeek: client.workoutAssignment.currentWeek,
                      newWeek: newWeek,
                      assignmentId: client.workoutAssignment.id,
                      weeksData: client.workoutAssignment.weeks?.map(w => ({
                        weekNumber: w.weekNumber,
                        isUnlocked: w.isUnlocked
                      })),
                      programData: client.workoutAssignment.program,
                      hasWeeks: !!client.workoutAssignment.weeks,
                      weeksLength: client.workoutAssignment.weeks?.length
                    });
                    
                    // Initialize weeks array if it doesn't exist
                    let currentWeeks = client.workoutAssignment.weeks || [];
                    
                    // If weeks array is empty, create it based on the program duration
                    if (currentWeeks.length === 0) {
                      console.log('🔧 Initializing weeks array for duration:', client.workoutAssignment.duration);
                      currentWeeks = Array.from({ length: client.workoutAssignment.duration }, (_, index) => ({
                        weekNumber: index + 1,
                        isUnlocked: index === 0, // Only week 1 is unlocked by default
                        isCompleted: false,
                        exercises: [],
                        days: []
                      }));
                    }
                    
                    // Update the weeks array to unlock the new week
                    const updatedWeeks = currentWeeks.map(week => {
                      if (week.weekNumber === newWeek) {
                        console.log('🔓 Unlocking week:', newWeek);
                        return { ...week, isUnlocked: true };
                      }
                      return week;
                    });
                    
                    const updatedAssignment: ClientWorkoutAssignment = {
                      ...client.workoutAssignment,
                      currentWeek: newWeek,
                      weeks: updatedWeeks,
                      lastModifiedBy: 'coach' as const,
                      lastModifiedAt: new Date()
                    };
                    
                    console.log('🔄 Updated assignment before save:', {
                      currentWeek: updatedAssignment.currentWeek,
                      weeks: updatedAssignment.weeks?.map(w => ({
                        weekNumber: w.weekNumber,
                        isUnlocked: w.isUnlocked
                      }))
                    });
                    
                    // Update local state and database in one operation
                    await onSaveAssignment(updatedAssignment);
                    alert(`${client.name} advanced to Week ${newWeek}`);
                  }}
                  disabled={!client.workoutAssignment || client.workoutAssignment.currentWeek >= client.workoutAssignment.duration}
                  className="flex items-center justify-center space-x-3 px-6 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-700 disabled:opacity-50 text-white rounded-xl font-medium transition-all duration-200"
                >
                  <ChevronRight className="w-5 h-5" />
                  <span>Next Week</span>
                </button>
              </div>

              {/* Direct Week Selection */}
              <div className="bg-slate-700/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 text-center">Jump to Specific Week</h3>
                <div className="flex items-center justify-center space-x-4">
                  <label className="text-slate-300 font-medium">Week:</label>
                  <select
                    value={client.workoutAssignment.currentWeek}
                    onChange={async (e) => {
                      const newWeek = parseInt(e.target.value);
                      if (!client.workoutAssignment) return;
                      
                      // Update database first
                      if (client.workoutAssignment.id) {
                        const { error } = await dbUpdateWorkoutAssignment(client.workoutAssignment.id, {
                          current_week: newWeek,
                          last_modified_by: 'coach'
                        });
                        
                        if (error) {
                          console.error('❌ Failed to update week in database:', error);
                          alert('Failed to update week. Please try again.');
                          return;
                        }
                      }
                      
                      const updatedAssignment: ClientWorkoutAssignment = {
                        ...client.workoutAssignment,
                        currentWeek: newWeek,
                        lastModifiedBy: 'coach' as const,
                        lastModifiedAt: new Date()
                      };
                      
                      await onSaveAssignment(updatedAssignment);
                      alert(`${client.name} moved to Week ${newWeek}`);
                    }}
                    className="px-4 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Array.from({ length: client.workoutAssignment.duration }, (_, i) => i + 1).map(week => (
                      <option key={week} value={week}>Week {week}</option>
                    ))}
                  </select>
                </div>
                
                {/* Save Current Week Button */}
                <div className="mt-4 flex justify-center">
                  <button
                    onClick={async () => {
                      if (!client.workoutAssignment) return;
                      
                      try {
                        // Save the current week data to the database
                        const updatedAssignment: ClientWorkoutAssignment = {
                          ...client.workoutAssignment,
                          program: selectedProgram || client.workoutAssignment.program,
                          lastModifiedBy: 'coach' as const,
                          lastModifiedAt: new Date()
                        };
                        
                        // Update in database
                        if (isSupabaseReady && supabase && assignmentId) {
                          await supabase
                            .from('workout_assignments')
                            .update({
                              program_json: updatedAssignment as unknown as any,
                              current_week: updatedAssignment.currentWeek,
                              current_day: updatedAssignment.currentDay,
                              last_modified_by: 'coach',
                              version: (sharedVersion || 0) + 1
                            })
                            .eq('id', assignmentId);
                        }
                        
                        await onSaveAssignment(updatedAssignment);
                        alert(`Week ${client.workoutAssignment.currentWeek} data saved successfully!`);
                      } catch (error) {
                        console.error('Error saving week data:', error);
                        alert('Failed to save week data. Please try again.');
                      }
                    }}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg"
                  >
                    <Save className="w-5 h-5" />
                    <span>Save Current Week Data</span>
                  </button>
                </div>
              </div>

              {/* Program Info */}
              <div className="bg-slate-700/20 rounded-xl p-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-400">
                      {client.workoutAssignment.duration}
                    </div>
                    <div className="text-slate-300 text-sm">Total Weeks</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-400">
                      {Math.round((client.workoutAssignment.currentWeek / client.workoutAssignment.duration) * 100)}%
                    </div>
                    <div className="text-slate-300 text-sm">Progress</div>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm">
                  Changes are immediately reflected in the client's interface. The client will see Week {client.workoutAssignment.currentWeek} content.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
        {/* Client Performance Indicator */}
        {client.workoutAssignment?.lastModifiedBy === 'client' && (
          <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">
                Client has updated their performance - Refresh to see latest data
              </span>
              <button
                onClick={() => window.location.reload()}
                className="ml-2 px-3 py-1 bg-green-500/20 hover:bg-green-500/30 rounded text-xs transition-colors"
              >
                🔄 Refresh Now
              </button>
            </div>
          </div>
        )}

        
        {/* Client Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Client</p>
                <p className="text-xl font-bold text-white">{client.name}</p>
              </div>
              <div className="p-3 bg-blue-600/20 rounded-xl">
                <User className="w-6 h-6 text-blue-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Goal</p>
                <p className="text-xl font-bold text-white capitalize">{client.goal}</p>
              </div>
              <div className="p-3 bg-red-600/20 rounded-xl">
                <Target className="w-6 h-6 text-red-400" />
              </div>
            </div>
          </div>
          
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium">Duration</p>
                <p className="text-xl font-bold text-white">{client.numberOfWeeks} weeks</p>
              </div>
              <div className="p-3 bg-green-600/20 rounded-xl">
                <Calendar className="w-6 h-6 text-green-400" />
              </div>
            </div>
          </div>
        </div>

        {showProgramSelection && (
          /* Program Selection */
          <div key="program-selection" className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">Select Workout Program</h2>
              <p className="text-slate-400 text-lg">Choose the perfect program for {client.name}</p>
            </div>
            
            {loadingTemplates ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-slate-400 text-lg">Loading workout templates...</p>
              </div>
            ) : workoutPrograms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-slate-400 text-lg">No workout programs found.</p>
                <p className="text-slate-500 text-sm mt-2">Please run the database migration scripts to populate templates.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workoutPrograms.map(program => (
                <div
                  key={program.id}
                  onClick={() => handleSelectProgram(program)}
                  className="group bg-slate-700/50 hover:bg-slate-600/50 rounded-2xl border border-slate-600/50 hover:border-slate-500/50 p-6 cursor-pointer transition-all duration-300 hover:shadow-2xl hover:shadow-slate-900/25 hover:scale-105"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      program.id.startsWith('custom-') 
                        ? 'bg-gradient-to-br from-green-500 to-green-600' 
                        : 'bg-gradient-to-br from-red-500 to-red-600'
                    }`}>
                      <Dumbbell className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      {program.id.startsWith('custom-') && (
                        <span className="px-2 py-1 bg-green-600/20 text-green-400 text-xs font-medium rounded-full">
                          Custom
                        </span>
                      )}
                    <Play className="w-5 h-5 text-slate-400 group-hover:text-red-400 transition-colors duration-200" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-red-400 transition-colors duration-200">
                    {program.name}
                  </h3>
                  <p className="text-slate-400 text-sm mb-4 line-clamp-2">
                    {program.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-slate-600/50 text-slate-300 text-sm font-medium rounded-full">
                      {program.days.length} days
                    </span>
                    <span className="text-slate-400 text-sm">
                      {program.days.reduce((total, day) => total + day.exercises.length, 0)} exercises
                    </span>
                  </div>
                </div>
              ))}
            </div>
            )}
          </div>
        )}

        {showModificationInterface && (
          /* Workout Modification Interface */
          <div key="modification-interface" className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-8">
            {/* Keyboard Navigation Instructions */}
            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6">
              <h3 className="text-blue-300 font-semibold mb-2">🎯 Keyboard Navigation Guide</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-blue-200">
                <div>↑↓ Navigate exercises</div>
                <div>←→ Navigate fields</div>
                <div>Enter Open exercise search</div>
                <div>Esc Clear focus</div>
              </div>
              <div className="mt-2 text-xs text-blue-300">
                Click on any field to start keyboard navigation, then use arrow keys to move around like a spreadsheet!
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold text-white">
                  {isEditingTemplate ? 'Modify Template' : 'Create Custom Workout'}
                </h2>
                {isEditingTemplate && selectedProgram && (
                  <p className="text-slate-400 mt-2">
                    Editing: <span className="text-white font-medium">{selectedProgram.name}</span>
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowModificationInterface(false);
                  setShowProgramSelection(true);
                  setCustomWorkout({ name: '', description: '', days: [] });
                }}
                className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            </div>

            {/* Workout Basic Info */}
            <div className="space-y-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Workout Name</label>
                <input
                  type="text"
                  value={customWorkout.name}
                  onChange={(e) => setCustomWorkout(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., My Custom PPL Program"
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
                <textarea
                  value={customWorkout.description}
                  onChange={(e) => setCustomWorkout(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your workout program..."
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
            </div>

            {/* Days Management */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Workout Days</h3>
                <button
                  onClick={() => {
                    const newDay = {
                      id: `day-${Date.now()}`,
                      name: `Day ${customWorkout.days.length + 1}`,
                      exercises: []
                    };
                    setCustomWorkout(prev => ({ ...prev, days: [...prev.days, newDay] }));
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Day</span>
                </button>
              </div>

              {customWorkout.days.map((day, dayIndex) => (
                <div key={day.id} className="bg-slate-700/30 rounded-xl p-6 border border-slate-600/30">
                  <div className="flex items-center justify-between mb-4">
                    <input
                      type="text"
                      value={day.name}
                      onChange={(e) => {
                        const newDays = [...customWorkout.days];
                        newDays[dayIndex].name = e.target.value;
                        setCustomWorkout(prev => ({ ...prev, days: newDays }));
                      }}
                      className="text-lg font-bold text-white bg-transparent border-none outline-none"
                    />
                    <button
                      onClick={() => {
                        const newDays = customWorkout.days.filter((_, index) => index !== dayIndex);
                        setCustomWorkout(prev => ({ ...prev, days: newDays }));
                      }}
                      className="p-2 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Add Exercise Button */}
                  <button
                    onClick={() => {
                      setSelectedDayIndex(dayIndex);
                      setShowExerciseModal(true);
                    }}
                    className="w-full py-3 border-2 border-dashed border-slate-500 rounded-lg text-slate-400 hover:text-white hover:border-slate-400 transition-all duration-200 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Exercise</span>
                  </button>

                  {/* Exercises List */}
                  {day.exercises.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {day.exercises.map((exercise, exerciseIndex) => (
                        <div key={exercise.id} className="bg-slate-600/30 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <div
                              className={`flex-1 p-2 rounded cursor-pointer transition-all duration-200 ${
                                focusedField?.dayIndex === dayIndex && 
                                focusedField?.exerciseIndex === exerciseIndex && 
                                focusedField?.field === 'exercise'
                                  ? 'bg-blue-600/30 border-2 border-blue-500'
                                  : 'bg-slate-700/30 hover:bg-slate-600/30'
                              }`}
                              onClick={() => {
                                setFocusedField({
                                  dayIndex,
                                  exerciseIndex,
                                  setIndex: 0,
                                  field: 'exercise'
                                });
                              }}
                            >
                              <span className="text-white font-medium">{exercise.exercise.name}</span>
                            </div>
                            <button
                              onClick={() => {
                                const newDays = [...customWorkout.days];
                                newDays[dayIndex].exercises = newDays[dayIndex].exercises.filter((_, index) => index !== exerciseIndex);
                                setCustomWorkout(prev => ({ ...prev, days: newDays }));
                              }}
                              className="p-1 rounded bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                          
                          {/* Exercise Details */}
                          <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Rest Period</label>
                                <input
                                  type="text"
                                  value={exercise.rest}
                                  onChange={(e) => {
                                    const newDays = [...customWorkout.days];
                                    newDays[dayIndex].exercises[exerciseIndex].rest = e.target.value;
                                    setCustomWorkout(prev => ({ ...prev, days: newDays }));
                                  }}
                                  onFocus={() => {
                                    setFocusedField({
                                      dayIndex,
                                      exerciseIndex,
                                      setIndex: 0,
                                      field: 'rest'
                                    });
                                  }}
                                  className={`w-full px-2 py-1 border rounded text-white text-sm transition-all duration-200 ${
                                    focusedField?.dayIndex === dayIndex && 
                                    focusedField?.exerciseIndex === exerciseIndex && 
                                    focusedField?.field === 'rest'
                                      ? 'bg-blue-600/30 border-blue-500'
                                      : 'bg-slate-700/50 border-slate-600/50'
                                  }`}
                                />
                              </div>
                              <div>
                                <label className="block text-xs text-slate-400 mb-1">Sets</label>
                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      const newDays = [...customWorkout.days];
                                      if (newDays[dayIndex].exercises[exerciseIndex].sets.length > 1) {
                                        newDays[dayIndex].exercises[exerciseIndex].sets.pop();
                                        setCustomWorkout(prev => ({ ...prev, days: newDays }));
                                      }
                                    }}
                                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-white text-sm">{exercise.sets.length}</span>
                                  <button
                                    onClick={() => {
                                      const newDays = [...customWorkout.days];
                                      const lastSet = newDays[dayIndex].exercises[exerciseIndex].sets[newDays[dayIndex].exercises[exerciseIndex].sets.length - 1];
                                      newDays[dayIndex].exercises[exerciseIndex].sets.push({
                                        id: `set-${Date.now()}`,
                                        reps: lastSet?.reps || 8,
                                        weight: lastSet?.weight || 50,
                                        completed: false
                                      });
                                      setCustomWorkout(prev => ({ ...prev, days: newDays }));
                                    }}
                                    className="p-1 rounded bg-slate-700 hover:bg-slate-600 text-slate-300"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </div>
                            
                            {/* Sets Details */}
                            <div className="space-y-2">
                              {exercise.sets.map((set, setIndex) => (
                                <div key={set.id} className="flex items-center space-x-2">
                                  <span className="text-slate-400 text-xs w-8">Set {setIndex + 1}</span>
                                  <input
                                    type="number"
                                    value={set.reps}
                                    onChange={(e) => {
                                      const newDays = [...customWorkout.days];
                                      newDays[dayIndex].exercises[exerciseIndex].sets[setIndex].reps = parseInt(e.target.value) || 0;
                                      setCustomWorkout(prev => ({ ...prev, days: newDays }));
                                    }}
                                    onFocus={() => {
                                      setFocusedField({
                                        dayIndex,
                                        exerciseIndex,
                                        setIndex,
                                        field: 'reps'
                                      });
                                    }}
                                    className={`w-16 px-2 py-1 border rounded text-white text-sm transition-all duration-200 ${
                                      focusedField?.dayIndex === dayIndex && 
                                      focusedField?.exerciseIndex === exerciseIndex && 
                                      focusedField?.setIndex === setIndex && 
                                      focusedField?.field === 'reps'
                                        ? 'bg-blue-600/30 border-blue-500'
                                        : 'bg-slate-700/50 border-slate-600/50'
                                    }`}
                                    placeholder="Reps"
                                  />
                                  <span className="text-slate-400 text-xs">reps</span>
                                  <input
                                    type="number"
                                    value={set.weight}
                                    onChange={(e) => {
                                      const newDays = [...customWorkout.days];
                                      newDays[dayIndex].exercises[exerciseIndex].sets[setIndex].weight = parseFloat(e.target.value) || 0;
                                      setCustomWorkout(prev => ({ ...prev, days: newDays }));
                                    }}
                                    onFocus={() => {
                                      setFocusedField({
                                        dayIndex,
                                        exerciseIndex,
                                        setIndex,
                                        field: 'weight'
                                      });
                                    }}
                                    className={`w-16 px-2 py-1 border rounded text-white text-sm transition-all duration-200 ${
                                      focusedField?.dayIndex === dayIndex && 
                                      focusedField?.exerciseIndex === exerciseIndex && 
                                      focusedField?.setIndex === setIndex && 
                                      focusedField?.field === 'weight'
                                        ? 'bg-blue-600/30 border-blue-500'
                                        : 'bg-slate-700/50 border-slate-600/50'
                                    }`}
                                    placeholder="Weight"
                                  />
                                  <span className="text-slate-400 text-xs">kg</span>
                                </div>
                              ))}
                            </div>
                            
                            <div>
                              <label className="block text-xs text-slate-400 mb-1">Notes</label>
                              <input
                                type="text"
                                value={exercise.notes}
                                onChange={(e) => {
                                  const newDays = [...customWorkout.days];
                                  newDays[dayIndex].exercises[exerciseIndex].notes = e.target.value;
                                  setCustomWorkout(prev => ({ ...prev, days: newDays }));
                                }}
                                placeholder="Exercise notes..."
                                className="w-full px-2 py-1 bg-slate-700/50 border border-slate-600/50 rounded text-white text-sm"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Save Button */}
            {customWorkout.name && customWorkout.days.length > 0 && (
              <div className="mt-8 flex justify-end space-x-4">
                <button
                  onClick={() => {
                    setShowModificationInterface(false);
                    setShowProgramSelection(true);
                    setCustomWorkout({ name: '', description: '', days: [] });
                  }}
                  className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                
                {!isEditingTemplate && (
                  <button
                    onClick={() => {
                      // Save as new template
                      const newProgram: WorkoutProgram = {
                        id: `custom-${Date.now()}`,
                        name: customWorkout.name,
                        description: customWorkout.description,
                        days: customWorkout.days,
                        createdAt: new Date(),
                        updatedAt: new Date()
                      };
                      
                      // Add to workoutPrograms array
                      workoutPrograms.push(newProgram);
                      
                      // Go back to program selection
                      setShowModificationInterface(false);
                      setShowProgramSelection(true);
                      setCustomWorkout({ name: '', description: '', days: [] });
                    }}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save as Template</span>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    // Create final program and assign to client
                    const finalProgram: WorkoutProgram = {
                      id: isEditingTemplate ? selectedProgram?.id || `custom-${Date.now()}` : `custom-${Date.now()}`,
                      name: customWorkout.name,
                      description: customWorkout.description,
                      days: customWorkout.days,
                      createdAt: isEditingTemplate ? selectedProgram?.createdAt || new Date() : new Date(),
                      updatedAt: new Date()
                    };
                    
                    // If it's a new custom template, add to the list
                    if (!isEditingTemplate) {
                      workoutPrograms.push(finalProgram);
                    }
                    
                    // Set as selected program and create workout
                    setSelectedProgram(finalProgram);
                    const weekData = createWeekBasedWorkout(finalProgram, client.numberOfWeeks);
                    setWeeks(weekData);
                    
                    // Go to workout interface
                    setShowModificationInterface(false);
                    setShowProgramSelection(false);
                    setCustomWorkout({ name: '', description: '', days: [] });
                  }}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-all duration-200 flex items-center space-x-2"
                >
                  <Play className="w-4 h-4" />
                  <span>{isEditingTemplate ? 'Assign to Client' : 'Save & Assign'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {!showProgramSelection && !showModificationInterface && (
          /* Workout Program Interface */
          <div className="space-y-6">
            {/* Week Navigation */}
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Week {currentWeek}</h2>
                <div className="flex items-center space-x-3">
                  {/* Ultra-Modern Week Selector */}
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Unlock Week
                      </label>
                      <div className="relative">
                        <select
                          value={currentWeek}
                          onChange={(e) => handleWeekChange(parseInt(e.target.value))}
                          className="appearance-none bg-gradient-to-r from-slate-800 to-slate-700 border border-slate-600/50 rounded-2xl px-6 py-3 pr-10 text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300 hover:from-slate-700 hover:to-slate-600 shadow-lg backdrop-blur-sm"
                        >
                          {Array.from({ length: client.numberOfWeeks }, (_, i) => i + 1).map(week => (
                            <option key={week} value={week} className="bg-slate-800 text-white">
                              Week {week}
                            </option>
                          ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleUnlockCurrentWeek()}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                    >
                      <div className="flex items-center space-x-3">
                        <Unlock className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300" />
                        <span>Unlock Week {currentWeek}</span>
                      </div>
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    </button>
                  </div>
                  
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                    disabled={currentWeek === 1}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="px-4 py-2 bg-slate-700 text-white rounded-lg font-medium">
                    {currentWeek} / {client.numberOfWeeks}
                  </span>
                  <button
                    onClick={() => setCurrentWeek(Math.min(client.numberOfWeeks, currentWeek + 1))}
                    disabled={currentWeek === client.numberOfWeeks}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  </div>
                </div>
              </div>

              {/* Week Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm font-medium">Progress</span>
                  <span className="text-slate-300 text-sm font-medium">{completedSets} / {totalSets} sets</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalSets > 0 ? (completedSets / totalSets) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Week Status */}
              <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {currentWeekData?.isUnlocked ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Unlock className="w-4 h-4" />
                    <span className="text-sm font-medium">Unlocked</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-slate-400">
                    <Lock className="w-4 h-4" />
                    <span className="text-sm font-medium">Locked</span>
                  </div>
                )}
                
                {currentWeekData?.isCompleted && (
                  <div className="flex items-center space-x-2 text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Completed</span>
                    </div>
                  )}
                </div>

                {/* Week Status Display */}
                {currentWeekData?.isCompleted ? (
                  <div className="text-sm text-green-400">
                    ✓ Week Completed
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">
                    Week {currentWeek} - {currentWeekData?.isUnlocked ? 'Unlocked' : 'Locked'}
                  </div>
                )}
              </div>
            </div>

            {/* Day Navigation */}
            {selectedProgram && (
              <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                <h3 className="text-lg font-bold text-white mb-4">Day Navigation</h3>
                <div className="flex space-x-2 overflow-x-auto pb-2">
                  {selectedProgram?.days?.map((day, index) => (
                    <button
                      key={day.id}
                      onClick={() => setCurrentDay(index)}
                      className={`flex-shrink-0 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        currentDay === index
                          ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg'
                          : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                      }`}
                    >
                      {day.name}
                    </button>
                  ))}
                </div>
                <div className="mt-4 text-sm text-slate-400">
                  Day {currentDay + 1} of {selectedProgram?.days?.length || 0} • {currentDayData?.exercises?.length || 0} exercises
                </div>
              </div>
            )}

            {/* Exercises */}
            <div className="space-y-4">
              {currentDayData?.exercises && currentDayData.exercises.length > 0 ? (
                currentDayData.exercises.map((exercise) => (
                <div key={exercise.id} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                        <Dumbbell className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <button
                          onClick={() => setShowExerciseSearch(exercise.id)}
                          className="text-left"
                        >
                          <h3 className="text-xl font-bold text-white hover:text-red-400 transition-colors">{exercise.exercise.name}</h3>
                        <p className="text-slate-400 text-sm">{exercise.rest} rest</p>
                        </button>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          // Add a new set to this exercise
                          if (selectedProgram) {
                            const updatedProgram = {
                              ...selectedProgram,
                              days: selectedProgram.days.map((day, dayIndex) => 
                                dayIndex === currentDay
                                  ? {
                                      ...day,
                                      exercises: day.exercises.map(ex => 
                                        ex.id === exercise.id
                                          ? {
                                              ...ex,
                                              sets: [...ex.sets, {
                                                id: Date.now().toString(),
                                                reps: ex.sets[ex.sets.length - 1]?.reps || 8,
                                                weight: ex.sets[ex.sets.length - 1]?.weight || 50,
                                                completed: false
                                              }]
                                            }
                                          : ex
                                      )
                                    }
                                  : day
                              )
                            };
                            setSelectedProgram(updatedProgram);
                            
                            // Auto-save changes
                            setTimeout(() => autoSaveChanges(updatedProgram), 500);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Add reps to all sets of this exercise
                          if (selectedProgram) {
                            const updatedProgram = {
                              ...selectedProgram,
                              days: selectedProgram.days.map((day, dayIndex) => 
                                dayIndex === currentDay
                                  ? {
                                      ...day,
                                      exercises: day.exercises.map(ex => 
                                        ex.id === exercise.id
                                          ? {
                                              ...ex,
                                              sets: ex.sets.map(set => ({
                                                ...set,
                                                reps: set.reps + 1
                                              }))
                                            }
                                          : ex
                                      )
                                    }
                                  : day
                              )
                            };
                            setSelectedProgram(updatedProgram);
                            
                            // Auto-save changes
                            setTimeout(() => autoSaveChanges(updatedProgram), 500);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                      >
                        <Activity className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          // Add weight to all sets of this exercise
                          if (selectedProgram) {
                            const updatedProgram = {
                              ...selectedProgram,
                              days: selectedProgram.days.map((day, dayIndex) => 
                                dayIndex === currentDay
                                  ? {
                                      ...day,
                                      exercises: day.exercises.map(ex => 
                                        ex.id === exercise.id
                                          ? {
                                              ...ex,
                                              sets: ex.sets.map(set => ({
                                                ...set,
                                                weight: set.weight + 2.5
                                              }))
                                            }
                                          : ex
                                      )
                                    }
                                  : day
                              )
                            };
                            setSelectedProgram(updatedProgram);
                            
                            // Auto-save changes
                            setTimeout(() => autoSaveChanges(updatedProgram), 500);
                          }
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sets - Redesigned to match attached image */}
                  <div className="space-y-3">
                    {exercise.sets.map((set, setIndex) => {
                      // Client performance data available for reference
                      
                      return (
                        <div key={set.id} className="flex items-center space-x-4 p-4 bg-slate-700/30 rounded-xl border border-slate-600/30">
                          {/* Set Number */}
                        <div className="flex items-center space-x-2">
                            <span className="text-white text-sm font-medium w-8">Set {setIndex + 1}</span>
                        </div>
                        
                          {/* Reps Section */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateReps(currentWeek, exercise.id, set.id, -1)}
                              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                            <span className="text-white font-bold text-lg min-w-[2rem] text-center">{set.reps}</span>
                          <button
                            onClick={() => handleUpdateReps(currentWeek, exercise.id, set.id, 1)}
                              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <span className="text-slate-400 text-sm">reps</span>
                        </div>
                        
                          {/* Weight Section */}
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleUpdateWeight(currentWeek, exercise.id, set.id, -2.5)}
                              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                            <span className="text-white font-bold text-lg min-w-[3rem] text-center">{set.weight}kg</span>
                          <button
                            onClick={() => handleUpdateWeight(currentWeek, exercise.id, set.id, 2.5)}
                              className="w-8 h-8 rounded-lg bg-slate-600 hover:bg-slate-500 text-white transition-all duration-200 flex items-center justify-center"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        
                          {/* Client Performance Indicator */}
                          {client.workoutAssignment?.clientPerformance?.find(
                            perf => perf.exerciseId === exercise.id && 
                            perf.weekNumber === currentWeek &&
                            perf.dayNumber === currentDay + 1
                          ) && (
                            <div className="flex items-center space-x-1 text-green-400 text-xs">
                              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                              <span>Client</span>
                            </div>
                          )}
                          
                          {/* Delete Button */}
                        <button
                          onClick={() => handleRemoveSet(currentWeek, exercise.id, set.id)}
                            className="w-8 h-8 rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 hover:text-red-300 transition-all duration-200 flex items-center justify-center ml-auto"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                      );
                    })}
                  </div>

                  {/* Exercise Notes */}
                  {exercise.notes && (
                    <div className="mt-4 p-3 bg-slate-700/30 rounded-lg">
                      <p className="text-slate-300 text-sm">{exercise.notes}</p>
                    </div>
                  )}
                </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Dumbbell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-300 mb-2">No exercises found</h3>
                  <p className="text-slate-400">This day doesn't have any exercises assigned yet.</p>
                </div>
              )}
            </div>

            {/* Week Actions */}
            <div className="flex items-center justify-end">
              <div className="flex items-center space-x-3">
                {/* Ultra-Modern Week Unlock Button */}
                <button
                  onClick={() => handleUnlockCurrentWeek()}
                  className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-semibold px-6 py-3 rounded-2xl transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                >
                  <div className="flex items-center space-x-2">
                    <Unlock className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Unlock Week {currentWeek}</span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                </button>
                
                {/* Week Status Display */}
                <div className="text-sm text-slate-400">
                  {currentWeekData?.isUnlocked ? 'Week Unlocked' : 'Week Locked'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Selection Modal */}
        {showExerciseModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Select Exercise</h3>
                  <button
                    onClick={() => {
                      setShowExerciseModal(false);
                      setSelectedDayIndex(null);
                      setExerciseSearch('');
                    }}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercises
                    .filter(exercise => 
                      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                      exercise.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase())
                    )
                    .map(exercise => (
                      <div
                        key={exercise.id}
                        onClick={() => {
                          if (selectedDayIndex !== null) {
                            const newExercise: WorkoutExercise = {
                              id: `exercise-${Date.now()}`,
                              exercise: exercise,
                              sets: [
                                {
                                  id: `set-${Date.now()}`,
                                  reps: 8,
                                  weight: 50,
                                  completed: false
                                }
                              ],
                              rest: '2 min',
                              notes: '',
                              order: 1
                            };
                            
                            const newDays = [...customWorkout.days];
                            newDays[selectedDayIndex].exercises.push(newExercise);
                            setCustomWorkout(prev => ({ ...prev, days: newDays }));
                            
                            setShowExerciseModal(false);
                            setSelectedDayIndex(null);
                            setExerciseSearch('');
                          }
                        }}
                        className="p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl border border-slate-600/50 hover:border-slate-500/50 cursor-pointer transition-all duration-200 hover:scale-105"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{exercise.name}</h4>
                            <p className="text-slate-400 text-sm">
                              {exercise.muscleGroup}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Exercise Replacement Modal */}
        {showExerciseSearch && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 max-w-2xl w-full max-h-[80vh] overflow-hidden">
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">Replace Exercise</h3>
                  <button
                    onClick={() => {
                      setShowExerciseSearch(null);
                      setExerciseSearch('');
                    }}
                    className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="mt-4">
                  <input
                    type="text"
                    value={exerciseSearch}
                    onChange={(e) => setExerciseSearch(e.target.value)}
                    placeholder="Search exercises..."
                    className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {exercises
                    .filter(exercise => 
                      exercise.name.toLowerCase().includes(exerciseSearch.toLowerCase()) ||
                      exercise.muscleGroup.toLowerCase().includes(exerciseSearch.toLowerCase())
                    )
                    .map(exercise => (
                      <div
                        key={exercise.id}
                        onClick={() => {
                          handleReplaceExercise(showExerciseSearch, exercise);
                          setShowExerciseSearch(null);
                          setExerciseSearch('');
                        }}
                        className="p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl border border-slate-600/50 hover:border-red-500/50 transition-all duration-200 cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <h4 className="text-white font-medium">{exercise.name}</h4>
                            <p className="text-slate-400 text-sm">
                              {exercise.muscleGroup}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </div>
    </div>
  );
};

export default UltraModernWorkoutEditor;
