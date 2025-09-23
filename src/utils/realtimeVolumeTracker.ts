import { ClientWorkoutAssignment, WorkoutWeek, WorkoutProgram, WorkoutDay, WorkoutExercise, WorkoutSet } from '../types';
import { supabase } from '../lib/supabaseClient';

/**
 * Look up muscle group from exercises table (simplified for now, ideally from a cached list)
 */
async function getMuscleGroupFromDatabase(exerciseName: string): Promise<string | null> {
  if (!exerciseName) return null;
  
  console.log(`🔍 MUSCLE GROUP - Looking up muscle group for: "${exerciseName}"`);
  
  try {
    // First try exact match
    const { data, error } = await supabase
      .from('exercises')
      .select('muscle_group')
      .eq('name', exerciseName)
      .single();

    if (!error && data?.muscle_group) {
      console.log(`✅ MUSCLE GROUP - Found exact match for "${exerciseName}": ${data.muscle_group}`);
      return data.muscle_group;
    }

    console.log(`⚠️ MUSCLE GROUP - No exact match for "${exerciseName}", trying similar search...`);
    
    // Try to find similar exercise names using ILIKE for case-insensitive partial matching
    const { data: similarData, error: similarError } = await supabase
      .from('exercises')
      .select('name, muscle_group')
      .ilike('name', `%${exerciseName}%`)
      .limit(10);
    
    if (!similarError && similarData && similarData.length > 0) {
      console.log(`🔍 MUSCLE GROUP - Similar exercises found for "${exerciseName}":`, similarData);
      
      // Try to find the best match
      const bestMatch = similarData.find(ex => 
        ex.name.toLowerCase() === exerciseName.toLowerCase()
      );
      
      if (bestMatch) {
        console.log(`✅ MUSCLE GROUP - Found case-insensitive match: "${bestMatch.name}" -> ${bestMatch.muscle_group}`);
        return bestMatch.muscle_group;
      }
      
      // If no exact case-insensitive match, use the first similar result
      console.log(`✅ MUSCLE GROUP - Using first similar match: "${similarData[0].name}" -> ${similarData[0].muscle_group}`);
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
  console.log(`🔍 VOLUME SPECIFIC WEEK - Calculating volume for week ${weekNumber}`);
  console.log(`🔍 VOLUME SPECIFIC WEEK - workoutProgram:`, workoutProgram);
  console.log(`🔍 VOLUME SPECIFIC WEEK - workoutAssignment:`, workoutAssignment);
  console.log(`🔍 VOLUME SPECIFIC WEEK - workoutProgram.days:`, workoutProgram.days);
  console.log(`🔍 VOLUME SPECIFIC WEEK - workoutAssignment?.weeks:`, workoutAssignment?.weeks);
  
  const volumeTally: { [muscleGroup: string]: number } = {};
  
  // Check if this week is unlocked
  if (workoutAssignment?.weeks) {
    const weekData = workoutAssignment.weeks.find(w => w.weekNumber === weekNumber);
    const isUnlocked = weekData?.isUnlocked || false;
    
    console.log(`🔍 VOLUME SPECIFIC WEEK - Week ${weekNumber} is unlocked: ${isUnlocked}`);
    
    if (!isUnlocked) {
      console.log(`🔍 VOLUME SPECIFIC WEEK - Week ${weekNumber} is locked, returning 0 volume`);
      return volumeTally; // Return empty object for locked weeks
    }
  }
  
  let daysToProcess: WorkoutDay[] = [];
  
  if (workoutAssignment?.weeks && workoutAssignment.weeks.length > 0) {
    const specificWeek = workoutAssignment.weeks.find(week => week.weekNumber === weekNumber);
    console.log(`🔍 VOLUME SPECIFIC WEEK - Found specific week:`, specificWeek);
    console.log(`🔍 VOLUME SPECIFIC WEEK - Specific week days:`, specificWeek?.days);
    console.log(`🔍 VOLUME SPECIFIC WEEK - Specific week days length:`, specificWeek?.days?.length);
    
    if (specificWeek && specificWeek.days && specificWeek.days.length > 0) {
      console.log(`🔍 VOLUME SPECIFIC WEEK - Using specific week data for week ${weekNumber}`);
      daysToProcess = specificWeek.days;
    } else {
      console.log(`🔍 VOLUME SPECIFIC WEEK - No specific week data found, using base program with progression for week ${weekNumber}`);
      daysToProcess = applyWeekProgression(workoutProgram.days || [], weekNumber);
    }
  } else {
    console.log(`🔍 VOLUME SPECIFIC WEEK - No workout assignment weeks, using base program with progression for week ${weekNumber}`);
    daysToProcess = applyWeekProgression(workoutProgram.days || [], weekNumber);
  }
  
  console.log(`🔍 VOLUME SPECIFIC WEEK - Processing ${daysToProcess.length} days for week ${weekNumber}`);
  console.log(`🔍 VOLUME SPECIFIC WEEK - daysToProcess:`, daysToProcess);
  
  for (let dayIndex = 0; dayIndex < daysToProcess.length; dayIndex++) {
    const day = daysToProcess[dayIndex];
    console.log(`🔍 VOLUME SPECIFIC WEEK - Day ${dayIndex + 1}: ${day.name}`);
    console.log(`🔍 VOLUME SPECIFIC WEEK - Day ${dayIndex + 1} exercises:`, day.exercises);
    
    const exercises = day.exercises || [];
    console.log(`🔍 VOLUME SPECIFIC WEEK - Exercises count: ${exercises.length}`);
    
    for (let exerciseIndex = 0; exerciseIndex < exercises.length; exerciseIndex++) {
      const exercise = exercises[exerciseIndex];
      console.log(`🔍 VOLUME SPECIFIC WEEK - Exercise ${exerciseIndex + 1}: ${exercise.exercise?.name}`);
      
      const muscleGroup = await getMuscleGroupFromDatabase(exercise.exercise?.name || '');
      console.log(`🔍 VOLUME SPECIFIC WEEK - Muscle group: ${muscleGroup}`);
      
      if (!muscleGroup || muscleGroup.trim() === '') {
        console.log(`🔍 VOLUME SPECIFIC WEEK - Skipping: ${exercise.exercise?.name} (no muscle group found)`);
        continue;
      }

      const sets = exercise.sets || [];
      console.log(`🔍 VOLUME SPECIFIC WEEK - Sets count: ${sets.length}`);
      
      let exerciseTotalVolume = 0;
      for (let setIndex = 0; setIndex < sets.length; setIndex++) {
        const set = sets[setIndex];
        const setVolume = set.reps * Math.max(set.weight, 1);
        exerciseTotalVolume += setVolume;
        
        console.log(`🔍 VOLUME SPECIFIC WEEK - Set ${setIndex + 1}: ${set.weight}kg × ${set.reps} = ${setVolume}kg`);
        
        if (!volumeTally[muscleGroup]) {
          volumeTally[muscleGroup] = 0;
        }
        volumeTally[muscleGroup] += setVolume;
      }
      console.log(`🔍 VOLUME SPECIFIC WEEK - Exercise "${exercise.exercise?.name}" total volume: ${exerciseTotalVolume}kg for muscle group: ${muscleGroup}`);
    }
  }

  console.log(`🔍 VOLUME SPECIFIC WEEK - Final tally for week ${weekNumber}:`, volumeTally);
  console.log(`🔍 VOLUME SPECIFIC WEEK - Total volume for week ${weekNumber}:`, Object.values(volumeTally).reduce((sum, vol) => sum + vol, 0));
  
  Object.entries(volumeTally).forEach(([muscleGroup, volume]) => {
    console.log(`🔍 VOLUME SPECIFIC WEEK - ${muscleGroup}: ${volume}kg for week ${weekNumber}`);
  });
  
  return volumeTally;
}

/**
 * Apply week-specific progression to workout days
 */
export function applyWeekProgression(days: WorkoutDay[], weekNumber: number): WorkoutDay[] {
  if (weekNumber === 1) {
    console.log(`🔍 PROGRESSION - Week 1: No progression applied`);
    return days; // No progression for week 1
  }
  
  const progressionFactor = weekNumber - 1;
  const repIncrease = progressionFactor * 2;
  const weightIncrease = progressionFactor * 2.5;
  
  console.log(`🔍 PROGRESSION - Week ${weekNumber}: Applying +${repIncrease} reps, +${weightIncrease}kg per set`);
  
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
  console.log('🔍 RECALCULATE CURRENT WEEK - Starting recalculation');
  console.log('🔍 RECALCULATE CURRENT WEEK - workoutAssignment:', workoutAssignment);
  
  if (!workoutAssignment.program) {
    console.log('🔍 RECALCULATE CURRENT WEEK - No program found');
    return {};
  }

  const currentWeek = workoutAssignment.currentWeek || 1;
  console.log('🔍 RECALCULATE CURRENT WEEK - Current week:', currentWeek);
  
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
  console.log('🔍 CHART DATA - Getting volume data for chart');
  console.log('🔍 CHART DATA - workoutAssignment:', workoutAssignment);
  
  if (!workoutAssignment.program) {
    console.log('🔍 CHART DATA - No program found');
    return [];
  }

  const maxWeeks = workoutAssignment.duration || 12;
  console.log('🔍 CHART DATA - Max weeks:', maxWeeks);
  
  const chartDataPromises = Array.from({ length: maxWeeks }, async (_, i) => {
    const week = i + 1;
    
    // Check if this week is unlocked
    const weekData = workoutAssignment.weeks?.find(w => w.weekNumber === week);
    const isUnlocked = weekData?.isUnlocked || false;
    
    console.log(`🔍 CHART DATA - Week ${week} is unlocked: ${isUnlocked}`);
    
    if (!isUnlocked) {
      console.log(`🔍 CHART DATA - Week ${week} is locked, returning 0 volume`);
      return {
        week,
        // Return empty object for locked weeks (all muscle groups will be 0)
      };
    }
    
    // Only calculate volume for unlocked weeks
    const weekVolume = await calculateVolumeForSpecificWeek(
      clientId,
      workoutAssignment.id,
      workoutAssignment.program!,
      week,
      workoutAssignment
    );
    
    console.log(`🔍 CHART DATA - Week ${week} volume calculated:`, weekVolume);
    
    return {
      week,
      ...weekVolume,
    };
  });

  const chartData = await Promise.all(chartDataPromises);
  console.log('🔍 CHART DATA - Final chart data:', chartData);
  
  return chartData;
}
