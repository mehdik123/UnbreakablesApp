import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Client, ClientWorkoutAssignment, WorkoutProgram, WorkoutDay, WorkoutExercise, WorkoutSet } from '../types';
import { getVolumeDataForChart, recalculateCurrentWeekVolume } from '../utils/realtimeVolumeTracker';

export interface VolumeData {
  currentWeekVolume: { [muscleGroup: string]: number } | null;
  weeklyVolumeChartData: { week: number; [muscleGroup: string]: number }[];
  isLoading: boolean;
  lastUpdated: Date;
}

interface UseRealtimeVolumeTrackingProps {
  clientId: string;
  workoutAssignment: ClientWorkoutAssignment | null;
}

export const useRealtimeVolumeTracking = ({
  clientId,
  workoutAssignment,
}: UseRealtimeVolumeTrackingProps) => {
  const [volumeData, setVolumeData] = useState<VolumeData>({
    currentWeekVolume: null,
    weeklyVolumeChartData: [],
    isLoading: true,
    lastUpdated: new Date(),
  });

  const fetchVolumeData = useCallback(async () => {
    if (!clientId || !workoutAssignment || !workoutAssignment.program) {
      setVolumeData({
        currentWeekVolume: null,
        weeklyVolumeChartData: [],
        isLoading: false,
        lastUpdated: new Date(),
      });
      return;
    }

    setVolumeData((prev) => ({ ...prev, isLoading: true }));

    try {
      // Get current week volume
      const currentVolume = await recalculateCurrentWeekVolume(clientId, workoutAssignment);
      
      // Get chart data for all weeks
      const chartData = await getVolumeDataForChart(clientId, workoutAssignment);

      setVolumeData({
        currentWeekVolume: currentVolume,
        weeklyVolumeChartData: chartData,
        isLoading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      console.error('Error fetching volume data:', error);
      setVolumeData((prev) => ({ ...prev, isLoading: false }));
    }
  }, [clientId, workoutAssignment]);

  useEffect(() => {
    fetchVolumeData();

    // Set up real-time listener for workout assignment changes
    if (workoutAssignment?.id) {
      const channel = supabase
        .channel(`workout_assignments:${workoutAssignment.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'workout_assignments',
            filter: `id=eq.${workoutAssignment.id}`,
          },
          (payload) => {
            console.log('🔍 REALTIME - Update received for workout assignment:', payload);
            console.log('🔍 REALTIME - Payload event type:', payload.eventType);
            console.log('🔍 REALTIME - Payload new data:', payload.new);
            fetchVolumeData(); // Re-fetch data on any change
          }
        )
        .subscribe();

      return () => {
        console.log('🔍 REALTIME - Removing channel for workout assignment:', workoutAssignment.id);
        supabase.removeChannel(channel);
      };
    }
  }, [fetchVolumeData, workoutAssignment?.id, workoutAssignment?.lastModifiedAt]);

  return volumeData;
};
