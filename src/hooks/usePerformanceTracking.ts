import { useState, useEffect } from 'react';
import { 
  recordExercisePerformance, 
  markWeekCompleted, 
  getPerformanceData,
  PerformanceData 
} from '../utils/performanceTracker';

export interface UsePerformanceTrackingProps {
  clientId: string;
  workoutAssignmentId: string;
  onVolumeUpdate?: (volumeData: any) => void;
}

export function usePerformanceTracking({
  clientId,
  workoutAssignmentId,
  onVolumeUpdate
}: UsePerformanceTrackingProps) {
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load performance data
  useEffect(() => {
    if (clientId && workoutAssignmentId) {
      const data = getPerformanceData(clientId, workoutAssignmentId);
      setPerformanceData(data);
      setIsLoading(false);
    }
  }, [clientId, workoutAssignmentId]);

  // Record exercise performance
  const recordExercise = (
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
    plannedSets: any[]
  ) => {
    console.log('📊 PERFORMANCE HOOK - Recording exercise:', {
      weekNumber,
      dayNumber,
      exerciseName,
      muscleGroup,
      actualSets: actualSets.length
    });

    recordExercisePerformance(
      clientId,
      workoutAssignmentId,
      weekNumber,
      dayNumber,
      exerciseId,
      exerciseName,
      muscleGroup,
      actualSets,
      plannedSets
    );

    // Reload performance data
    const updatedData = getPerformanceData(clientId, workoutAssignmentId);
    setPerformanceData(updatedData);

    // Notify parent component of volume update
    if (onVolumeUpdate) {
      onVolumeUpdate(updatedData);
    }
  };

  // Mark week as completed
  const completeWeek = (weekNumber: number) => {
    console.log('📊 PERFORMANCE HOOK - Completing week:', weekNumber);

    markWeekCompleted(clientId, workoutAssignmentId, weekNumber);

    // Reload performance data
    const updatedData = getPerformanceData(clientId, workoutAssignmentId);
    setPerformanceData(updatedData);

    // Notify parent component of volume update
    if (onVolumeUpdate) {
      onVolumeUpdate(updatedData);
    }
  };

  // Get volume for specific week and muscle group
  const getVolumeForWeekAndMuscle = (weekNumber: number, muscleGroup: string): number => {
    if (!performanceData) return 0;

    const weeklyPerformance = performanceData.weeklyPerformances.find(
      wp => wp.weekNumber === weekNumber
    );

    if (!weeklyPerformance) return 0;

    return weeklyPerformance.muscleGroupVolumes[muscleGroup] || 0;
  };

  // Get total volume for specific week
  const getTotalVolumeForWeek = (weekNumber: number): number => {
    if (!performanceData) return 0;

    const weeklyPerformance = performanceData.weeklyPerformances.find(
      wp => wp.weekNumber === weekNumber
    );

    if (!weeklyPerformance) return 0;

    return weeklyPerformance.totalVolume;
  };

  // Check if week is completed
  const isWeekCompleted = (weekNumber: number): boolean => {
    if (!performanceData) return false;

    const weeklyPerformance = performanceData.weeklyPerformances.find(
      wp => wp.weekNumber === weekNumber
    );

    return weeklyPerformance?.isCompleted || false;
  };

  return {
    performanceData,
    isLoading,
    recordExercise,
    completeWeek,
    getVolumeForWeekAndMuscle,
    getTotalVolumeForWeek,
    isWeekCompleted
  };
}
