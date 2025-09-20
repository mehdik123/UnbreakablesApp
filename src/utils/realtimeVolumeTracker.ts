import { WorkoutProgram, MuscleVolumeData, CurrentWeekVolume } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * Look up muscle group from exercises table
 */
async function getMuscleGroupFromDatabase(exerciseName: string): Promise<string | null> {
  console.log(`🔍 DB LOOKUP - Looking up muscle group for exercise: "${exerciseName}"`);
  
  if (!supabase) {
    console.log(`🔍 DB LOOKUP - Supabase not available`);
    return null;
  }
  
  try {
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group')
      .eq('name', exerciseName)
      .single();
    
    console.log(`🔍 DB LOOKUP - Query result for "${exerciseName}":`, { data, error });
    
    if (error || !data) {
      console.log(`🔍 DB LOOKUP - No muscle group found for: ${exerciseName}, error:`, error);
      console.log(`🔍 DB LOOKUP - This exercise "${exerciseName}" does not exist in your database!`);
      return null;
    }
    
    console.log(`🔍 DB LOOKUP - Found muscle group for "${exerciseName}": "${data.muscle_group}"`);
    return data.muscle_group;
  } catch (error) {
    console.log(`🔍 DB LOOKUP - Error looking up muscle group for: ${exerciseName}`, error);
    return null;
  }
}

/**
 * Calculate weekly volume using simple aggregation approach
 * Only uses muscle groups from exercises table - no fallbacks
 */
export async function calculateWeeklyVolume(workoutProgram: WorkoutProgram): Promise<{ [muscleGroup: string]: number }> {
  console.log('🔍 VOLUME - Program:', workoutProgram.name, 'Days:', workoutProgram.days?.length);
  
  // First, let's check what's in the exercises table
  if (supabase) {
    try {
      const { data: allExercises, error } = await supabase
        .from('exercises')
        .select('name, muscle_group')
        .order('name');
      
      if (!error && allExercises) {
        console.log('🔍 DB DEBUG - All exercises in database:', allExercises);
        const muscleGroups = [...new Set(allExercises.map(ex => ex.muscle_group).filter(Boolean))];
        console.log('🔍 DB DEBUG - Unique muscle groups in database:', muscleGroups);
        console.log('🔍 DB DEBUG - Total exercises in database:', allExercises.length);
        
        // Show exercise names that are in the program but not in database
        const programExerciseNames = new Set();
        workoutProgram.days?.forEach(day => {
          day.exercises?.forEach(ex => {
            if (ex.exercise?.name) {
              programExerciseNames.add(ex.exercise.name);
            }
          });
        });
        
        const dbExerciseNames = new Set(allExercises.map(ex => ex.name));
        const missingFromDB = [...programExerciseNames].filter(name => !dbExerciseNames.has(name));
        const missingFromProgram = [...dbExerciseNames].filter(name => !programExerciseNames.has(name));
        
        console.log('🔍 DB DEBUG - Exercise names in program:', [...programExerciseNames]);
        console.log('🔍 DB DEBUG - Exercise names in database:', [...dbExerciseNames]);
        console.log('🔍 DB DEBUG - Exercises in program but NOT in database:', missingFromDB);
        console.log('🔍 DB DEBUG - Exercises in database but NOT in program:', missingFromProgram);
      }
    } catch (error) {
      console.log('🔍 DB DEBUG - Error fetching exercises:', error);
    }
  }
  
  // Check if the program has muscle groups populated
  const hasMuscleGroups = workoutProgram.days?.some(day => 
    day.exercises?.some(ex => ex.exercise?.muscleGroup && ex.exercise.muscleGroup.trim() !== '')
  );
  console.log('🔍 VOLUME - Program has muscle groups populated:', hasMuscleGroups);
  
  if (!hasMuscleGroups) {
    console.log('🔍 VOLUME - WARNING: Program does not have muscle groups populated!');
    console.log('🔍 VOLUME - Sample exercise structure:', JSON.stringify(workoutProgram.days?.[0]?.exercises?.[0], null, 2));
  }
  
  const volumeTally: { [muscleGroup: string]: number } = {};
  const days = workoutProgram.days || [];
  
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    console.log(`🔍 VOLUME - Day ${dayIndex + 1}: ${day.name}`);
    
    const exercises = day.exercises || [];
    console.log(`🔍 VOLUME - Exercises count: ${exercises.length}`);
    
    // List all exercises in this day
    const exerciseNames = exercises.map(ex => ex.exercise?.name).filter(Boolean);
    console.log(`🔍 VOLUME - Exercise names in ${day.name}:`, exerciseNames);
    
    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
      const exercise = exercises[exerciseIndex];
      console.log(`🔍 VOLUME - Exercise ${exerciseIndex + 1} structure:`, JSON.stringify(exercise, null, 2));
      
      let muscleGroup = exercise.exercise?.muscleGroup;
      console.log(`🔍 VOLUME - Exercise: ${exercise.exercise?.name} -> muscleGroup from exercise: "${muscleGroup}"`);
      
      // Always look up muscle group from database to ensure we have the latest data
      console.log(`🔍 VOLUME - Looking up muscle group for: ${exercise.exercise?.name}`);
      muscleGroup = await getMuscleGroupFromDatabase(exercise.exercise?.name || '');
      console.log(`🔍 VOLUME - Database lookup result: "${muscleGroup}"`);
      
      if (!muscleGroup || muscleGroup.trim() === '') {
        console.log(`🔍 VOLUME - Skipping: ${exercise.exercise?.name} (no muscle group found)`);
        continue;
      }

      const sets = exercise.sets || [];
      console.log(`🔍 VOLUME - Sets count: ${sets.length}`);
      console.log(`🔍 VOLUME - Sets structure:`, JSON.stringify(sets, null, 2));
      
      let exerciseTotalVolume = 0;
      for (let setIndex = 0; setIndex < sets.length; setIndex++) {
        const set = sets[setIndex];
        const setVolume = set.weight * set.reps;
        exerciseTotalVolume += setVolume;
        
        console.log(`🔍 VOLUME - Set ${setIndex + 1}: ${set.weight}kg × ${set.reps} = ${setVolume}kg`);
        
        if (!volumeTally[muscleGroup]) {
          volumeTally[muscleGroup] = 0;
        }
        volumeTally[muscleGroup] += setVolume;
      }
      console.log(`🔍 VOLUME - Exercise "${exercise.exercise?.name}" total volume: ${exerciseTotalVolume}kg for muscle group: ${muscleGroup}`);
    }
  }

  console.log('🔍 VOLUME - Final tally:', volumeTally);
  console.log('🔍 VOLUME - Total volume:', Object.values(volumeTally).reduce((sum, vol) => sum + vol, 0));
  return volumeTally;
}

/**
 * Get muscle groups from program asynchronously (with database lookup)
 */
export async function getMuscleGroupsFromProgram(workoutProgram: WorkoutProgram): Promise<string[]> {
  console.log('🔍 MUSCLE GROUPS - Starting detection for program:', workoutProgram.name);
  console.log('🔍 MUSCLE GROUPS - Program has', workoutProgram.days?.length || 0, 'days');
  const muscleGroups = new Set<string>();
  const days = workoutProgram.days || [];
  
  for (let dayIndex = 0; dayIndex < days.length; dayIndex++) {
    const day = days[dayIndex];
    console.log(`🔍 MUSCLE GROUPS - Processing day ${dayIndex + 1}: ${day.name}`);
    
    const exercises = day.exercises || [];
    console.log(`🔍 MUSCLE GROUPS - Day has ${exercises.length} exercises`);
    const exerciseNames = exercises.map(ex => ex.exercise?.name).filter(Boolean);
    console.log(`🔍 MUSCLE GROUPS - Exercise names in ${day.name}:`, exerciseNames);
    
    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
      const exercise = exercises[exerciseIndex];
      let muscleGroup = exercise.exercise?.muscleGroup;
      
      console.log(`🔍 MUSCLE GROUPS - Exercise ${exerciseIndex + 1}: ${exercise.exercise?.name} -> muscleGroup from exercise: "${muscleGroup}"`);
      
      // Always look up muscle group from database to ensure we have the latest data
      console.log(`🔍 MUSCLE GROUPS - Looking up muscle group for: ${exercise.exercise?.name}`);
      muscleGroup = await getMuscleGroupFromDatabase(exercise.exercise?.name || '');
      console.log(`🔍 MUSCLE GROUPS - Database lookup result: "${muscleGroup}"`);
      
      if (muscleGroup && muscleGroup.trim() !== '') {
        muscleGroups.add(muscleGroup);
        console.log(`🔍 MUSCLE GROUPS - Added muscle group: "${muscleGroup}"`);
      } else {
        console.log(`🔍 MUSCLE GROUPS - Skipping exercise: ${exercise.exercise?.name} (no muscle group)`);
      }
    }
  }

  const result = Array.from(muscleGroups);
  console.log('🔍 MUSCLE GROUPS - Final result:', result);
  console.log('🔍 MUSCLE GROUPS - Total muscle groups found:', result.length);
  console.log('🔍 MUSCLE GROUPS - All unique muscle groups:', result.sort());
  return result;
}

/**
 * Get muscle groups from program synchronously (fallback)
 */
export function getMuscleGroupsFromProgramSync(workoutProgram: WorkoutProgram): string[] {
  const muscleGroups = new Set<string>();
  const days = workoutProgram.days || [];
  
  for (const day of days) {
    const exercises = day.exercises || [];
    for (const exercise of exercises) {
      const muscleGroup = exercise.exercise?.muscleGroup;
      if (muscleGroup && muscleGroup.trim() !== '') {
        muscleGroups.add(muscleGroup);
      }
    }
  }

  return Array.from(muscleGroups);
}

/**
 * Calculate current week volume from program
 */
export async function calculateCurrentWeekVolumeFromProgram(
  clientId: string,
  workoutAssignmentId: string,
  workoutProgram: WorkoutProgram,
  currentWeekNumber: number
): Promise<CurrentWeekVolume> {
  const weeklyVolume = await calculateWeeklyVolume(workoutProgram);
  const muscleGroups = await getMuscleGroupsFromProgram(workoutProgram);
  
  const totalVolume = Object.values(weeklyVolume).reduce((sum, volume) => sum + volume, 0);
  
  return {
    clientId,
    workoutAssignmentId,
    weekNumber: currentWeekNumber,
    totalVolume,
    muscleGroupVolumes: weeklyVolume,
    muscleGroups,
    lastUpdated: new Date()
  };
}

/**
 * Get volume data for chart display
 */
export async function getVolumeDataForChart(
  clientId: string,
  workoutAssignmentId: string,
  workoutProgram: WorkoutProgram,
  maxWeeks: number
): Promise<MuscleVolumeData[]> {
  const muscleGroups = await getMuscleGroupsFromProgram(workoutProgram);
  const weeklyVolume = await calculateWeeklyVolume(workoutProgram);
  
  const chartData: MuscleVolumeData[] = [];
  
  for (let week = 1; week <= maxWeeks; week++) {
    const weekData: MuscleVolumeData = {
      week: week,
      totalVolume: Object.values(weeklyVolume).reduce((sum, volume) => sum + volume, 0),
      muscleGroups: { ...weeklyVolume }
    };
    
    chartData.push(weekData);
  }
  
  return chartData;
}

/**
 * Recalculate current week volume
 */
export async function recalculateCurrentWeekVolume(
  clientId: string,
  workoutAssignmentId: string,
  workoutProgram: WorkoutProgram,
  currentWeekNumber: number
): Promise<CurrentWeekVolume> {
  return await calculateCurrentWeekVolumeFromProgram(
    clientId,
    workoutAssignmentId,
    workoutProgram,
    currentWeekNumber
  );
}