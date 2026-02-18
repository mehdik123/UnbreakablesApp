import { WorkoutProgram } from '../types';

/**
 * Calculates the weekly training volume for each muscle group based on the workout program
 * @param program - The client's workout program containing days, exercises, and sets
 * @returns Object with muscle group names as keys and total volume as values
 */
export function calculateWeeklyVolume(program: WorkoutProgram): { [muscleGroup: string]: number } {


  
  // Initialize empty object to store results
  const volumeByMuscleGroup: { [muscleGroup: string]: number } = {};
  
  // Check if program has days
  if (!program.days || program.days.length === 0) {



    return volumeByMuscleGroup;
  }
  


  
  // Iterate through every day in the program
  for (let dayIndex = 0; dayIndex < program.days.length; dayIndex++) {
    try {
      const day = program.days[dayIndex];


      
      // Check if day has exercises
      if (!day.exercises || day.exercises.length === 0) {

        continue;
      }
      

    
    // Iterate through every exercise in the day
    for (let exerciseIndex = 0; exerciseIndex < day.exercises.length; exerciseIndex++) {
      const exercise = day.exercises[exerciseIndex];

      
      // Get the primary muscle group for this exercise
      const muscleGroup = exercise.exercise?.muscleGroup;
      if (!muscleGroup || muscleGroup.trim() === '') {

        continue;
      }
      

      
      // Check if exercise has sets
      if (!exercise.sets || exercise.sets.length === 0) {

        continue;
      }
      
      // Iterate through every set in the exercise
      for (let setIndex = 0; setIndex < exercise.sets.length; setIndex++) {
        const set = exercise.sets[setIndex];

        
        // Calculate volume load for this set using universal formula: reps * Math.max(weight, 1)
        // This handles weighted exercises (weight > 0) and bodyweight exercises (weight = 0)
        const setVolume = set.reps * Math.max(set.weight, 1);

        
        // Add the set volume to the corresponding muscle group
        if (!volumeByMuscleGroup[muscleGroup]) {
          volumeByMuscleGroup[muscleGroup] = 0;
        }
        volumeByMuscleGroup[muscleGroup] += setVolume;
        

      }
    }
    
    // Log day summary

    } catch (error) {
      console.error(`🔍 VOLUME CALC - Error processing day ${dayIndex + 1}:`, error);
      console.error(`🔍 VOLUME CALC - Day data:`, program.days[dayIndex]);
    }
  }
  




  
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

/** Week-level volume: { week: number, [muscleGroup: string]: number } */
export interface MuscleVolumeData {
  week: number;
  [muscleGroup: string]: number | string;
}

/**
 * Compute weekly volume from workout assignment (same source as Progress charts).
 * Each week's volume uses that week's days only. Sync, no async.
 */
export function computeVolumeFromAssignment(
  workoutAssignment: { program?: { days?: any[] }; weeks?: any[] } | null | undefined,
  muscleGroups: string[]
): MuscleVolumeData[] {
  if (!workoutAssignment?.program) return [];
  const deployedWeeks = (workoutAssignment.weeks || [])
    .filter((w: any) => w.weekNumber != null)
    .sort((a: any, b: any) => a.weekNumber - b.weekNumber);
  const weeksToShow =
    deployedWeeks.length > 0
      ? deployedWeeks.map((w: any) => w.weekNumber)
      : [1];
  const programDays =
    workoutAssignment.program?.days && Array.isArray(workoutAssignment.program.days)
      ? workoutAssignment.program.days
      : [];
  const chartData: MuscleVolumeData[] = [];
  for (const week of weeksToShow) {
    const weekData: MuscleVolumeData = { week };
    const volumeTally: { [key: string]: number } = {};
    const weekSpecificData = deployedWeeks.find((w: any) => w.weekNumber === week);
    const daysToProcess =
      weekSpecificData?.days?.length > 0
        ? weekSpecificData.days
        : deployedWeeks.length === 0 && week === 1 && programDays.length > 0
          ? programDays
          : [];
    for (const day of daysToProcess) {
      for (const workoutExercise of day.exercises || []) {
        const muscleGroup = workoutExercise.exercise?.muscleGroup;
        if (!muscleGroup) continue;
        let exerciseVolume = 0;
        for (const set of workoutExercise.sets || []) {
          if (set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)) {
            for (let i = 0; i < set.reps.length && i < set.weight.length; i++) {
              const rep = typeof set.reps[i] === 'number' ? set.reps[i] : 0;
              const weight = typeof set.weight[i] === 'number' ? Math.max(set.weight[i], 1) : 1;
              exerciseVolume += rep * weight;
            }
          } else {
            const reps = typeof set.reps === 'number' ? set.reps : 0;
            const weight = typeof set.weight === 'number' ? Math.max(set.weight, 1) : 1;
            exerciseVolume += reps * weight;
          }
        }
        const normalized = muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1).toLowerCase();
        volumeTally[normalized] = (volumeTally[normalized] || 0) + exerciseVolume;
      }
    }
    muscleGroups.forEach((mg) => {
      weekData[mg] = volumeTally[mg] || 0;
    });
    chartData.push(weekData);
  }
  return chartData;
}
