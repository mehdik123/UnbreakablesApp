import { Client, WorkoutProgram, WorkoutExercise, WorkoutSet } from '../types';

export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  sets: Array<{
    setId: string;
    plannedReps: number;
    actualReps: number;
    plannedWeight: number;
    actualWeight: number;
    completed: boolean;
    completedAt?: Date;
  }>;
  totalVolume: number; // actualReps * actualWeight for all sets
  weekNumber: number;
  dayNumber: number;
  completedAt: Date;
}

export interface WeeklyPerformance {
  weekNumber: number;
  isCompleted: boolean;
  completedAt?: Date;
  exercises: ExercisePerformance[];
  totalVolume: number; // sum of all exercise volumes
  muscleGroupVolumes: { [muscleGroup: string]: number };
}

export interface PerformanceData {
  clientId: string;
  workoutAssignmentId: string;
  weeklyPerformances: WeeklyPerformance[];
  lastUpdated: Date;
}

/**
 * Calculate actual volume from exercise performance
 */
export function calculateExerciseVolumeFromPerformance(performance: ExercisePerformance): number {
  return performance.sets.reduce((total, set) => {
    if (set.completed) {
      return total + (set.actualReps * set.actualWeight);
    }
    return total;
  }, 0);
}

/**
 * Calculate muscle group volume from weekly performance
 */
export function calculateMuscleGroupVolumeFromPerformance(
  weeklyPerformance: WeeklyPerformance,
  muscleGroup: string
): number {
  return weeklyPerformance.exercises
    .filter(exercise => exercise.muscleGroup.toLowerCase() === muscleGroup.toLowerCase())
    .reduce((total, exercise) => total + exercise.totalVolume, 0);
}

/**
 * Get or create performance data for a client
 */
export function getPerformanceData(clientId: string, workoutAssignmentId: string): PerformanceData {
  const key = `performance_${clientId}_${workoutAssignmentId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      const data = JSON.parse(stored);
      return {
        ...data,
        weeklyPerformances: data.weeklyPerformances.map((wp: any) => ({
          ...wp,
          completedAt: wp.completedAt ? new Date(wp.completedAt) : undefined,
          exercises: wp.exercises.map((ex: any) => ({
            ...ex,
            completedAt: ex.completedAt ? new Date(ex.completedAt) : undefined,
            sets: ex.sets.map((set: any) => ({
              ...set,
              completedAt: set.completedAt ? new Date(set.completedAt) : undefined
            }))
          }))
        }))
      };
    } catch (error) {
      console.error('Error parsing performance data:', error);
    }
  }
  
  return {
    clientId,
    workoutAssignmentId,
    weeklyPerformances: [],
    lastUpdated: new Date()
  };
}

/**
 * Save performance data
 */
export function savePerformanceData(data: PerformanceData): void {
  const key = `performance_${data.clientId}_${data.workoutAssignmentId}`;
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Record exercise performance
 */
export function recordExercisePerformance(
  clientId: string,
  workoutAssignmentId: string,
  weekNumber: number,
  dayNumber: number,
  exerciseId: string,
  exerciseName: string,
  muscleGroup: string,
  actualSets: Array<{
    setId: string;
    actualReps: number;
    actualWeight: number;
    completed: boolean;
  }>,
  plannedSets: WorkoutSet[]
): void {
  console.log('📊 PERFORMANCE TRACKING - Recording exercise performance:', {
    clientId,
    weekNumber,
    dayNumber,
    exerciseName,
    muscleGroup,
    actualSets: actualSets.length,
    plannedSets: plannedSets.length
  });

  const performanceData = getPerformanceData(clientId, workoutAssignmentId);
  
  // Find or create weekly performance
  let weeklyPerformance = performanceData.weeklyPerformances.find(wp => wp.weekNumber === weekNumber);
  if (!weeklyPerformance) {
    weeklyPerformance = {
      weekNumber,
      isCompleted: false,
      exercises: [],
      totalVolume: 0,
      muscleGroupVolumes: {}
    };
    performanceData.weeklyPerformances.push(weeklyPerformance);
  }

  // Find or create exercise performance
  let exercisePerformance = weeklyPerformance.exercises.find(ex => ex.exerciseId === exerciseId);
  if (!exercisePerformance) {
    exercisePerformance = {
      exerciseId,
      exerciseName,
      muscleGroup,
      sets: [],
      totalVolume: 0,
      weekNumber,
      dayNumber,
      completedAt: new Date()
    };
    weeklyPerformance.exercises.push(exercisePerformance);
  }

  // Update exercise performance with actual data
  exercisePerformance.sets = actualSets.map((actualSet, index) => {
    const plannedSet = plannedSets[index] || { reps: 0, weight: 0 };
    return {
      setId: actualSet.setId,
      plannedReps: plannedSet.reps,
      actualReps: actualSet.actualReps,
      plannedWeight: plannedSet.weight,
      actualWeight: actualSet.actualWeight,
      completed: actualSet.completed,
      completedAt: actualSet.completed ? new Date() : undefined
    };
  });

  // Calculate total volume for this exercise
  exercisePerformance.totalVolume = calculateExerciseVolumeFromPerformance(exercisePerformance);

  // Recalculate weekly totals
  weeklyPerformance.totalVolume = weeklyPerformance.exercises.reduce(
    (total, ex) => total + ex.totalVolume, 0
  );

  // Recalculate muscle group volumes
  const muscleGroups = [...new Set(weeklyPerformance.exercises.map(ex => ex.muscleGroup))];
  muscleGroups.forEach(muscleGroup => {
    weeklyPerformance.muscleGroupVolumes[muscleGroup] = 
      calculateMuscleGroupVolumeFromPerformance(weeklyPerformance, muscleGroup);
  });

  // Update last updated time
  performanceData.lastUpdated = new Date();

  // Save to localStorage
  savePerformanceData(performanceData);

  console.log('📊 PERFORMANCE TRACKING - Updated performance data:', {
    weekNumber,
    exerciseName,
    totalVolume: exercisePerformance.totalVolume,
    weeklyTotalVolume: weeklyPerformance.totalVolume,
    muscleGroupVolumes: weeklyPerformance.muscleGroupVolumes
  });
}

/**
 * Mark week as completed
 */
export function markWeekCompleted(
  clientId: string,
  workoutAssignmentId: string,
  weekNumber: number
): void {
  const performanceData = getPerformanceData(clientId, workoutAssignmentId);
  const weeklyPerformance = performanceData.weeklyPerformances.find(wp => wp.weekNumber === weekNumber);
  
  if (weeklyPerformance) {
    weeklyPerformance.isCompleted = true;
    weeklyPerformance.completedAt = new Date();
    performanceData.lastUpdated = new Date();
    savePerformanceData(performanceData);
    
    console.log('📊 PERFORMANCE TRACKING - Week marked as completed:', {
      weekNumber,
      totalVolume: weeklyPerformance.totalVolume
    });
  }
}

/**
 * Get muscle volume data from performance tracking
 */
export function getMuscleVolumeFromPerformance(
  clientId: string,
  workoutAssignmentId: string,
  numberOfWeeks: number
): Array<{ week: number; [muscleGroup: string]: number | string }> {
  const performanceData = getPerformanceData(clientId, workoutAssignmentId);
  const volumeData: Array<{ week: number; [muscleGroup: string]: number | string }> = [];

  // Get all unique muscle groups from performance data
  const allMuscleGroups = new Set<string>();
  performanceData.weeklyPerformances.forEach(wp => {
    Object.keys(wp.muscleGroupVolumes).forEach(mg => allMuscleGroups.add(mg));
  });

  for (let week = 1; week <= numberOfWeeks; week++) {
    const weekData: { week: number; [muscleGroup: string]: number | string } = { week };
    
    const weeklyPerformance = performanceData.weeklyPerformances.find(wp => wp.weekNumber === week);
    
    if (weeklyPerformance && weeklyPerformance.isCompleted) {
      // Use actual performance data
      allMuscleGroups.forEach(muscleGroup => {
        weekData[muscleGroup] = weeklyPerformance.muscleGroupVolumes[muscleGroup] || 0;
      });
    } else {
      // Week not completed or no data, show 0
      allMuscleGroups.forEach(muscleGroup => {
        weekData[muscleGroup] = 0;
      });
    }
    
    volumeData.push(weekData);
  }

  console.log('📊 PERFORMANCE TRACKING - Generated volume data from performance:', {
    clientId,
    numberOfWeeks,
    volumeData: volumeData.slice(0, 3) // Log first 3 weeks for debugging
  });

  return volumeData;
}
