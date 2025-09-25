import { dbSaveWeeklyVolume, dbGetVolumeHistory, dbGetWeeklyVolume } from '../lib/db';
import { calculateWeeklyVolume } from './volumeCalculator';
import { WorkoutProgram } from '../types';

export interface WeeklyVolumeData {
  [weekNumber: number]: {
    [muscleGroup: string]: number;
  };
}

export interface VolumeHistoryEntry {
  client_id: string;
  week_number: number;
  muscle_group: string;
  volume: number;
  updated_at: string;
}

/**
 * Calculate and save weekly volume for a specific week
 */
export async function calculateAndSaveWeeklyVolume(
  clientId: string,
  weekNumber: number,
  workoutProgram: WorkoutProgram
): Promise<{ [muscleGroup: string]: number }> {

  
  // Calculate current week's volume
  const weeklyVolume = calculateWeeklyVolume(workoutProgram);

  
  // Save each muscle group's volume to database
  const savePromises = Object.entries(weeklyVolume).map(async ([muscleGroup, volume]) => {
    const result = await dbSaveWeeklyVolume(clientId, weekNumber, muscleGroup, volume);
    if (result.error) {
      console.error(`🔍 VOLUME MANAGER - Error saving ${muscleGroup} volume:`, result.error);
    } else {

    }
    return result;
  });
  
  await Promise.all(savePromises);
  
  return weeklyVolume;
}

/**
 * Get volume history for all weeks
 */
export async function getVolumeHistory(clientId: string): Promise<WeeklyVolumeData> {

  
  const { data: history, error } = await dbGetVolumeHistory(clientId);
  
  if (error) {
    console.error('🔍 VOLUME MANAGER - Error fetching volume history:', error);
    return {};
  }
  
  // Transform database records into WeeklyVolumeData format
  const volumeData: WeeklyVolumeData = {};
  
  history.forEach((entry: VolumeHistoryEntry) => {
    if (!volumeData[entry.week_number]) {
      volumeData[entry.week_number] = {};
    }
    volumeData[entry.week_number][entry.muscle_group] = entry.volume;
  });
  

  return volumeData;
}

/**
 * Get volume for a specific week
 */
export async function getWeeklyVolume(clientId: string, weekNumber: number): Promise<{ [muscleGroup: string]: number }> {

  
  const { data: weekData, error } = await dbGetWeeklyVolume(clientId, weekNumber);
  
  if (error) {
    console.error('🔍 VOLUME MANAGER - Error fetching weekly volume:', error);
    return {};
  }
  
  // Transform database records into muscle group volume format
  const volumeData: { [muscleGroup: string]: number } = {};
  
  weekData.forEach((entry: VolumeHistoryEntry) => {
    volumeData[entry.muscle_group] = entry.volume;
  });
  

  return volumeData;
}

/**
 * Generate chart data for all weeks up to maxWeeks
 */
export async function generateChartData(
  clientId: string,
  currentWeek: number,
  maxWeeks: number,
  allMuscleGroups: string[]
): Promise<Array<{ week: number; [muscleGroup: string]: number }>> {

  
  // Get volume history
  const volumeHistory = await getVolumeHistory(clientId);
  
  // Generate chart data
  const chartData = [];
  
  for (let week = 1; week <= maxWeeks; week++) {
    const weekData: { week: number; [muscleGroup: string]: number } = { week };
    
    // Initialize all muscle groups to 0
    allMuscleGroups.forEach(muscleGroup => {
      weekData[muscleGroup] = 0;
    });
    
    // If we have data for this week, use it
    if (volumeHistory[week]) {
      Object.entries(volumeHistory[week]).forEach(([muscleGroup, volume]) => {
        weekData[muscleGroup] = volume;
      });
    }
    
    chartData.push(weekData);
  }
  

  return chartData;
}

/**
 * Recalculate and save volume for current week when workout is modified
 */
export async function recalculateCurrentWeekVolume(
  clientId: string,
  currentWeek: number,
  workoutProgram: WorkoutProgram
): Promise<{ [muscleGroup: string]: number }> {

  
  // Calculate current week's volume with modified workout
  const weeklyVolume = calculateWeeklyVolume(workoutProgram);

  
  // Save each muscle group's volume to database
  const savePromises = Object.entries(weeklyVolume).map(async ([muscleGroup, volume]) => {
    const result = await dbSaveWeeklyVolume(clientId, currentWeek, muscleGroup, volume);
    if (result.error) {
      console.error(`🔍 VOLUME MANAGER - Error saving modified ${muscleGroup} volume:`, result.error);
    } else {

    }
    return result;
  });
  
  await Promise.all(savePromises);
  
  return weeklyVolume;
}

/**
 * Copy previous week's volume to current week (when week is unlocked)
 */
export async function copyPreviousWeekVolume(
  clientId: string,
  currentWeek: number,
  workoutProgram: WorkoutProgram
): Promise<void> {

  
  // Get previous week's volume
  const previousWeekVolume = await getWeeklyVolume(clientId, currentWeek - 1);
  
  if (Object.keys(previousWeekVolume).length > 0) {
    // Copy previous week's volume to current week
    const copyPromises = Object.entries(previousWeekVolume).map(async ([muscleGroup, volume]) => {
      const result = await dbSaveWeeklyVolume(clientId, currentWeek, muscleGroup, volume);
      if (result.error) {
        console.error(`🔍 VOLUME MANAGER - Error copying ${muscleGroup} volume:`, result.error);
      } else {

      }
      return result;
    });
    
    await Promise.all(copyPromises);
  } else {

  }
}
