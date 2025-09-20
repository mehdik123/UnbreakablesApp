import { WorkoutProgram } from '../types';

/**
 * Calculates the weekly training volume for each muscle group based on the workout program
 * @param program - The client's workout program containing days, exercises, and sets
 * @returns Object with muscle group names as keys and total volume as values
 */
export function calculateWeeklyVolume(program: WorkoutProgram): { [muscleGroup: string]: number } {
  console.log('🔍 VOLUME CALC - Starting calculation for program:', program.name);
  console.log('🔍 VOLUME CALC - Full program structure:', JSON.stringify(program, null, 2));
  
  // Initialize empty object to store results
  const volumeByMuscleGroup: { [muscleGroup: string]: number } = {};
  
  // Check if program has days
  if (!program.days || program.days.length === 0) {
    console.log('🔍 VOLUME CALC - No days found in program');
    console.log('🔍 VOLUME CALC - Program structure:', program);
    console.log('🔍 VOLUME CALC - Program keys:', Object.keys(program));
    return volumeByMuscleGroup;
  }
  
  console.log('🔍 VOLUME CALC - Program has', program.days.length, 'days');
  console.log('🔍 VOLUME CALC - Days:', program.days.map(day => ({ name: day.name, exerciseCount: day.exercises?.length || 0 })));
  
  // Iterate through every day in the program
  for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
    try {
      const day = program.days[dayIndex];
      console.log(`🔍 VOLUME CALC - Processing day ${dayIndex + 1}/${program.days.length}: ${day.name}`);
      console.log(`🔍 VOLUME CALC - Day structure:`, JSON.stringify(day, null, 2));
      
      // Check if day has exercises
      if (!day.exercises || day.exercises.length === 0) {
        console.log(`🔍 VOLUME CALC - No exercises found in day: ${day.name}`);
        continue;
      }
      
      console.log(`🔍 VOLUME CALC - Day ${day.name} has ${day.exercises.length} exercises`);
    
    // Iterate through every exercise in the day
    for (let exerciseIndex = 0; exerciseIndex < day.exercises.length; exerciseIndex++) {
      const exercise = day.exercises[exerciseIndex];
      console.log(`🔍 VOLUME CALC - Processing exercise ${exerciseIndex + 1}: ${exercise.exercise?.name}`);
      
      // Get the primary muscle group for this exercise
      const muscleGroup = exercise.exercise?.muscleGroup;
      if (!muscleGroup || muscleGroup.trim() === '') {
        console.log(`🔍 VOLUME CALC - No muscle group found for exercise: ${exercise.exercise?.name}`);
        continue;
      }
      
      console.log(`🔍 VOLUME CALC - Muscle group: ${muscleGroup}`);
      
      // Check if exercise has sets
      if (!exercise.sets || exercise.sets.length === 0) {
        console.log(`🔍 VOLUME CALC - No sets found for exercise: ${exercise.exercise?.name}`);
        continue;
      }
      
      // Iterate through every set in the exercise
      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];
        console.log(`🔍 VOLUME CALC - Processing set ${setIndex + 1}: ${set.reps} reps × ${set.weight} kg`);
        
        // Calculate volume load for this set: reps * weight
        const setVolume = set.reps * set.weight;
        console.log(`🔍 VOLUME CALC - Set volume: ${setVolume} kg`);
        
        // Add the set volume to the corresponding muscle group
        if (!volumeByMuscleGroup[muscleGroup]) {
          volumeByMuscleGroup[muscleGroup] = 0;
        }
        volumeByMuscleGroup[muscleGroup] += setVolume;
        
        console.log(`🔍 VOLUME CALC - Updated ${muscleGroup} total: ${volumeByMuscleGroup[muscleGroup]} kg`);
      }
    }
    
    // Log day summary
    console.log(`🔍 VOLUME CALC - Day ${day.name} completed. Current totals:`, { ...volumeByMuscleGroup });
    } catch (error) {
      console.error(`🔍 VOLUME CALC - Error processing day ${dayIndex + 1}:`, error);
      console.error(`🔍 VOLUME CALC - Day data:`, program.days[dayIndex]);
    }
  }
  
  console.log('🔍 VOLUME CALC - Final volume by muscle group:', volumeByMuscleGroup);
  console.log('🔍 VOLUME CALC - Total volume:', Object.values(volumeByMuscleGroup).reduce((sum, vol) => sum + vol, 0));
  console.log('🔍 VOLUME CALC - Muscle groups processed:', Object.keys(volumeByMuscleGroup));
  console.log('🔍 VOLUME CALC - Days processed:', program.days.length);
  
  return volumeByMuscleGroup;
}

/**
 * Gets all unique muscle groups from a workout program
 * @param program - The client's workout program
 * @returns Array of unique muscle group names
 */
export function getMuscleGroupsFromProgram(program: WorkoutProgram): string[] {
  const muscleGroups = new Set<string>();
  
  if (!program.days) return [];
  
  for (const day of program.days) {
    if (!day.exercises) continue;
    
    for (const exercise of day.exercises) {
      const muscleGroup = exercise.exercise?.muscleGroup;
      if (muscleGroup && muscleGroup.trim() !== '') {
        muscleGroups.add(muscleGroup);
      }
    }
  }
  
  return Array.from(muscleGroups).sort();
}
