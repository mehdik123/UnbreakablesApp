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

        // Volume: if weight is 0 kg (bodyweight) = sum of reps; if weight !== 0 = reps * weight per set
        const reps = typeof set.reps === 'number' ? set.reps : 0;
        const weight = typeof set.weight === 'number' ? set.weight : 0;
        const setVolume = weight === 0 ? reps : reps * weight;

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
 * Each week's volume uses that week's days only. No position-based fallback (avoids misattribution e.g. Abs/Back).
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
  const programDaysRaw =
    workoutAssignment.program?.days && Array.isArray(workoutAssignment.program.days)
      ? workoutAssignment.program.days
      : [];
  const week1Days = deployedWeeks[0]?.days && Array.isArray(deployedWeeks[0].days) ? deployedWeeks[0].days : [];
  const programDays = programDaysRaw.length > 0 ? programDaysRaw : week1Days;
  // Muscle group lookup by exercise id/name only (no position) to avoid wrong attribution between weeks
  const programExerciseToMuscleById: Record<string, string> = {};
  const programExerciseToMuscleByName: Record<string, string> = {};
  for (const d of programDays) {
    for (const ex of d.exercises || []) {
      const id = ex.exercise?.id;
      const name = ex.exercise?.name;
      const mg = ex.exercise?.muscleGroup;
      if (id && mg) programExerciseToMuscleById[id] = mg;
      if (name && mg) programExerciseToMuscleByName[name.trim().toLowerCase()] = mg;
    }
  }
  const chartData: MuscleVolumeData[] = [];
  for (const week of weeksToShow) {
    const weekData: MuscleVolumeData = { week };
    const volumeTally: { [key: string]: number } = {};
    const weekSpecificData = deployedWeeks.find((w: any) => w.weekNumber === week);
    const daysToProcess =
      weekSpecificData?.days?.length > 0
        ? weekSpecificData.days
        : week === 1 && programDays.length > 0
          ? programDays
          : [];
    // Count each exercise only once per week (first occurrence) so chart matches Volume Breakdown and avoids double-counting when same exercise appears in multiple days
    const seenExerciseIdsThisWeek = new Set<string>();
    for (const day of daysToProcess) {
      for (const workoutExercise of day.exercises || []) {
        const exId = workoutExercise.exercise?.id;
        if (exId && seenExerciseIdsThisWeek.has(exId)) continue;
        if (exId) seenExerciseIdsThisWeek.add(exId);
        let muscleGroup = workoutExercise.exercise?.muscleGroup;
        if (!muscleGroup && workoutExercise.exercise?.id)
          muscleGroup = programExerciseToMuscleById[workoutExercise.exercise.id];
        if (!muscleGroup && workoutExercise.exercise?.name)
          muscleGroup = programExerciseToMuscleByName[workoutExercise.exercise.name.trim().toLowerCase()];
        if (!muscleGroup) continue;
        let exerciseVolume = 0;
        for (const set of workoutExercise.sets || []) {
          if (set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)) {
            for (let i = 0; i < set.reps.length && i < set.weight.length; i++) {
              const rep = typeof set.reps[i] === 'number' ? set.reps[i] : 0;
              const w = typeof set.weight[i] === 'number' ? set.weight[i] : 0;
              exerciseVolume += w === 0 ? rep : rep * w;
            }
          } else {
            const reps = typeof set.reps === 'number' ? set.reps : 0;
            const w = typeof set.weight === 'number' ? set.weight : 0;
            exerciseVolume += w === 0 ? reps : reps * w;
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
