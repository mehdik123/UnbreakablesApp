import { useCallback } from 'react';
import { recalculateCurrentWeekVolume } from '../utils/weeklyVolumeManager';
import { WorkoutProgram } from '../types';

interface UseVolumeRecalculationProps {
  clientId: string;
  currentWeek: number;
  onVolumeUpdated?: (newVolume: { [muscleGroup: string]: number }) => void;
}

export const useVolumeRecalculation = ({
  clientId,
  currentWeek,
  onVolumeUpdated
}: UseVolumeRecalculationProps) => {
  
  const recalculateVolume = useCallback(async (workoutProgram: WorkoutProgram) => {
    console.log('🔍 VOLUME RECALCULATION - Workout modified, recalculating volume...');
    
    try {
      const newVolume = await recalculateCurrentWeekVolume(
        clientId,
        currentWeek,
        workoutProgram
      );
      
      console.log('🔍 VOLUME RECALCULATION - Volume recalculated:', newVolume);
      
      // Notify parent component that volume was updated
      if (onVolumeUpdated) {
        onVolumeUpdated(newVolume);
      }
      
      return newVolume;
    } catch (error) {
      console.error('🔍 VOLUME RECALCULATION - Error recalculating volume:', error);
      throw error;
    }
  }, [clientId, currentWeek, onVolumeUpdated]);

  return { recalculateVolume };
};


