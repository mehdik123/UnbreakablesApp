import { ClientWorkoutAssignment, WorkoutWeek, WorkoutProgram, WorkoutDay, WorkoutExercise, WorkoutSet } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * Look up muscle group from exercises table (simplified for now, ideally from a cached list)
 */
async function getMuscleGroupFromDatabase(exerciseName: string): Promise<string | null> {
  if (!exerciseName) return null;
  

  
  try {
    // First try exact match
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group')
      .eq('name', exerciseName)
      .single();

    if (!error && data?.muscle_group) {

      return data.muscle_group;
    }


    
    // Try to find similar exercise names using ILIKE for case-insensitive partial matching
    const { data: similarData, error: similarError } = await supabase
      .from('exercises')
      .select('name, muscle_group')
      .ilike('name', `%${exerciseName}%`)
      .limit(10);
    
    if (!similarError && similarData && similarData.length > 0) {

      
      // Try to find the best match
      const bestMatch = similarData.find(ex => 
        ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
      
      if (bestMatch) {

        return bestMatch.muscle_group;
      }
      
      // If no exact case-insensitive match, use the first similar result

      return similarData[0].muscle_group;
    }
    
    console.error(`❌ MUSCLE GROUP - No similar exercises found for "${exerciseName}"`);
    return null;
    
  } catch (error) {
    console.error(`❌ MUSCLE GROUP - Database error for "${exerciseName}":`, error);
    return null;
  }
}

/**
 * Calculate volume for a specific week based on workout assignments
 * This function now correctly uses the week-specific days data if available,
 * otherwise it applies progression to the base program days.
 */
export async function calculateVolumeForSpecificWeek(
  clientId: string,
  workoutAssignmentId: string,
  workoutProgram: WorkoutProgram,
  weekNumber: number,
  workoutAssignment?: ClientWorkoutAssignment
): Promise<{ [muscleGroup: string]: number }> {





  
  const volumeTally: { [muscleGroup: string]: number } = {};
  
  // Note: Week unlocking logic is now handled by the calling function
  // This function will calculate volume for any week it's called for
  
  let daysToProcess: WorkoutDay[] = [];
  
  if (workoutAssignment?.weeks && workoutAssignment.weeks.length > 0) {
    const specificWeek = workoutAssignment.weeks.find(week => week.weekNumber === weekNumber);



    
    if (specificWeek && specificWeek.days && specificWeek.days.length > 0) {

      daysToProcess = specificWeek.days;
    } else {

      daysToProcess = applyWeekProgression(workoutProgram.days || [], weekNumber);
    }
  } else {

    daysToProcess = applyWeekProgression(workoutProgram.days || [], weekNumber);
  }
  


  
  for (let dayIndex = 0; dayIndex < daysToProcess.length; dayIndex++) {
    const day = daysToProcess[dayIndex];


    
    const exercises = day.exercises || [];

    
    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
      const exercise = exercises[exerciseIndex];

      
      const muscleGroup = await getMuscleGroupFromDatabase(exercise.exercise?.name || '');

      
      if (!muscleGroup || muscleGroup.trim() === '') {

        continue;
      }

      const sets = exercise.sets || [];

      
      let exerciseTotalVolume = 0;
      for (let setIndex = 0; setIndex < sets.length; setIndex++) {
        const set = sets[setIndex];
        const setVolume = set.reps * Math.max(set.weight, 1);
        exerciseTotalVolume += setVolume;
        

        
        if (!volumeTally[muscleGroup]) {
          volumeTally[muscleGroup] = 0;
        }
        volumeTally[muscleGroup] += setVolume;
      }

    }
  }



  
  Object.entries(volumeTally).forEach(([muscleGroup, volume]) => {

  });
  
  return volumeTally;
}

/**
 * Apply week-specific progression to workout days
 */
export function applyWeekProgression(days: WorkoutDay[], weekNumber: number): WorkoutDay[] {
  if (weekNumber === 1) {

    return days; // No progression for week 1
  }
  
  const progressionFactor = weekNumber - 1;
  const repIncrease = progressionFactor * 2;
  const weightIncrease = progressionFactor * 2.5;
  

  
  return days.map(day => ({
    ...day,
    exercises: day.exercises.map(exercise => ({
      ...exercise,
      sets: exercise.sets.map(set => ({
        ...set,
        // Apply progression: increase reps by 2 per week, weight by 2.5kg per week
        reps: set.reps + repIncrease,
        weight: set.weight + weightIncrease
      }))
    }))
  }));
}

/**
 * Recalculate current week volume based on actual workout assignment data
 */
export async function recalculateCurrentWeekVolume(
  clientId: string,
  workoutAssignment: ClientWorkoutAssignment
): Promise<{ [muscleGroup: string]: number }> {


  
  if (!workoutAssignment.program) {

    return {};
  }

  const currentWeek = workoutAssignment.currentWeek || 1;

  
  return await calculateVolumeForSpecificWeek(
    clientId,
    workoutAssignment.id,
    workoutAssignment.program,
    currentWeek,
    workoutAssignment
  );
}

/**
 * Get volume data for chart display
 */
export async function getVolumeDataForChart(
  clientId: string,
  workoutAssignment: ClientWorkoutAssignment
): Promise<{ week: number; [muscleGroup: string]: number }[]> {


  
  if (!workoutAssignment.program) {

    return [];
  }

  const maxWeeks = workoutAssignment.duration || 12;

  
  const chartDataPromises = Array.from({ length: maxWeeks }, async (_, i) => {
    const week = i + 1;
    const currentWeek = workoutAssignment.currentWeek || 1;
    
    // Calculate volume for all weeks up to and including current week
    // Future weeks (beyond current week) should show 0 volume
    if (week > currentWeek) {

      return {
        week,
        // Return empty object for future weeks (all muscle groups will be 0)
      };
    }
    
    // Calculate volume for past and current weeks
    const weekVolume = await calculateVolumeForSpecificWeek(
      clientId,
      workoutAssignment.id,
      workoutAssignment.program!,
      week,
      workoutAssignment
    );
    

    
    return {
      week,
      ...weekVolume,
    };
  });

  const chartData = await Promise.all(chartDataPromises);

  
  return chartData;
}
