import { useState, useEffect, useCallback } from 'react';
import { 
  recalculateCurrentWeekVolume, 
  getVolumeDataForChart,
  CurrentWeekVolume 
} from '../utils/realtimeVolumeTracker';
import { WorkoutProgram, MuscleVolumeData, ClientWorkoutAssignment } from '../types';

interface UseRealtimeVolumeTrackingProps {
  clientId: string;
  workoutAssignmentId: string;
  workoutProgram: WorkoutProgram | undefined;
  workoutAssignment: ClientWorkoutAssignment | undefined;
  currentWeekNumber: number;
}

export const useRealtimeVolumeTracking = ({
  clientId,
  workoutAssignmentId,
  workoutProgram,
  workoutAssignment,
  currentWeekNumber
}: UseRealtimeVolumeTrackingProps) => {
  const [currentWeekVolume, setCurrentWeekVolume] = useState<CurrentWeekVolume | null>(null);
  const [volumeData, setVolumeData] = useState<MuscleVolumeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  console.log('🔍 VOLUME HOOK - Hook called with:', {
    clientId,
    workoutAssignmentId,
    hasWorkoutProgram: !!workoutProgram,
    programName: workoutProgram?.name,
    currentWeekNumber
  });

  const recalculateVolume = useCallback(async () => {
    if (!workoutProgram) return;

    console.log('🔍 VOLUME HOOK - Recalculating volume for program:', workoutProgram.name);
    
    try {
      const newVolume = await recalculateCurrentWeekVolume(
        clientId,
        workoutAssignmentId,
        workoutProgram,
        currentWeekNumber
      );
      
      setCurrentWeekVolume(newVolume);
      
      const newVolumeData = await getVolumeDataForChart(
        clientId,
        workoutAssignmentId,
        workoutProgram,
        12 // Assuming 12 weeks max
      );
      setVolumeData(newVolumeData);
    } catch (error) {
      console.error('🔍 VOLUME HOOK - Error recalculating volume:', error);
    }
  }, [clientId, workoutAssignmentId, workoutProgram, currentWeekNumber]);

  useEffect(() => {
    console.log('🔍 VOLUME HOOK - useEffect triggered with:', {
      clientId,
      workoutAssignmentId,
      hasWorkoutProgram: !!workoutProgram,
      programName: workoutProgram?.name,
      currentWeekNumber
    });
    
    const loadVolumeData = async () => {
      setIsLoading(true);
      
      if (clientId && workoutAssignmentId && workoutProgram) {
        console.log('🔍 VOLUME HOOK - Loading initial data for program:', workoutProgram.name);
        
        try {
          const currentVolume = await recalculateCurrentWeekVolume(
            clientId,
            workoutAssignmentId,
            workoutProgram,
            currentWeekNumber
          );
          setCurrentWeekVolume(currentVolume);
          
          const chartData = await getVolumeDataForChart(
            clientId,
            workoutAssignmentId,
            workoutProgram,
            12
          );
          setVolumeData(chartData);
        } catch (error) {
          console.error('🔍 VOLUME HOOK - Error loading initial data:', error);
        }
      } else {
        setCurrentWeekVolume(null);
        setVolumeData([]);
      }
      setIsLoading(false);
    };
    
    loadVolumeData().then(() => {
      console.log('🔍 VOLUME HOOK - useEffect completed, loadVolumeData finished');
    }).catch((error) => {
      console.error('🔍 VOLUME HOOK - Error in loadVolumeData:', error);
    });
  }, [clientId, workoutAssignmentId, workoutProgram, currentWeekNumber]);

  console.log('🔍 VOLUME HOOK - Returning data:', {
    currentWeekVolume,
    volumeDataLength: volumeData.length,
    isLoading,
    hasCurrentWeekVolume: !!currentWeekVolume,
    hasVolumeData: volumeData.length > 0
  });

  return { currentWeekVolume, volumeData, isLoading, recalculateVolume };
};