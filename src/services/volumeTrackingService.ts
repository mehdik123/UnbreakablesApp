import { ClientWorkoutAssignment, WorkoutProgram } from '../types';
import { dbUpsertWeeklyVolume, dbGetWeeklyVolumeHistory } from '../lib/db';

export interface WeeklyVolumeRecord {
  weekNumber: number;
  muscleGroup: string;
  volume: number;
}

export class VolumeTrackingService {
  /**
   * Calculate volume for a specific week's workout data
   */
  static calculateWeekVolume(workoutData: any, weekNumber: number): WeeklyVolumeRecord[] {
    const records: WeeklyVolumeRecord[] = [];
    const muscleGroupVolumes: { [muscleGroup: string]: number } = {};

    // Process all days in the workout data
    workoutData.days?.forEach((day: any) => {
      day.exercises?.forEach((workoutExercise: any) => {
        const muscleGroup = workoutExercise.exercise.muscleGroup;
        if (!muscleGroup) return;

        // Calculate volume for this exercise
        let exerciseVolume = 0;
        workoutExercise.sets?.forEach((set: any) => {
          exerciseVolume += set.reps * Math.max(set.weight, 0);
        });

        // Add to muscle group total
        if (!muscleGroupVolumes[muscleGroup]) {
          muscleGroupVolumes[muscleGroup] = 0;
        }
        muscleGroupVolumes[muscleGroup] += exerciseVolume;
      });
    });

    // Convert to records
    Object.entries(muscleGroupVolumes).forEach(([muscleGroup, volume]) => {
      records.push({
        weekNumber,
        muscleGroup: muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1).toLowerCase(),
        volume
      });
    });

    return records;
  }

  /**
   * Save volume records to database
   */
  static async saveWeekVolume(clientId: string, records: WeeklyVolumeRecord[]): Promise<void> {
    try {
      await Promise.all(
        records.map(record => 
          dbUpsertWeeklyVolume(clientId, record.weekNumber, record.muscleGroup, record.volume)
        )
      );
      console.log(`✅ VOLUME TRACKING - Saved ${records.length} volume records for client ${clientId}`);
    } catch (error) {
      console.error('❌ VOLUME TRACKING - Failed to save volume records:', error);
    }
  }

  /**
   * Get historical volume data for charts
   */
  static async getHistoricalVolumeData(clientId: string, maxWeeks: number): Promise<any[]> {
    try {
      const { data: history } = await dbGetWeeklyVolumeHistory(clientId);
      
      if (!history || history.length === 0) {
        // Return empty data for all weeks
        return Array.from({ length: maxWeeks }, (_, index) => ({
          week: index + 1,
          ...Object.fromEntries(
            ['Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Calves', 'Forearms', 'Hamstrings', 'Traps', 'Cardio'].map(mg => [mg, 0])
          )
        }));
      }

      // Group by week
      const weekData: { [week: number]: any } = {};
      
      // Initialize all weeks
      for (let week = 1; week <= maxWeeks; week++) {
        weekData[week] = { week };
        ['Back', 'Chest', 'Shoulders', 'Biceps', 'Triceps', 'Legs', 'Abs', 'Calves', 'Forearms', 'Hamstrings', 'Traps', 'Cardio'].forEach(mg => {
          weekData[week][mg] = 0;
        });
      }

      // Fill in historical data
      history.forEach(record => {
        if (weekData[record.week_number]) {
          weekData[record.week_number][record.muscle_group] = record.volume;
        }
      });

      return Object.values(weekData);
    } catch (error) {
      console.error('❌ VOLUME TRACKING - Failed to get historical data:', error);
      return [];
    }
  }

  /**
   * Update live week volume (Principle 1: Live Working Week)
   */
  static async updateLiveWeekVolume(clientId: string, currentWeek: number, workoutData: any): Promise<void> {
    console.log(`🔄 VOLUME TRACKING - Updating live week ${currentWeek} volume for client ${clientId}`);
    
    const records = this.calculateWeekVolume(workoutData, currentWeek);
    await this.saveWeekVolume(clientId, records);
  }

  /**
   * Advance to new week (Principle 3: Progressive Carry-Over)
   */
  static async advanceToNewWeek(
    clientId: string, 
    oldWeek: number, 
    newWeek: number, 
    finalWorkoutData: any
  ): Promise<void> {
    console.log(`🔄 VOLUME TRACKING - Advancing from week ${oldWeek} to week ${newWeek}`);
    
    // Finalize the old week with its final data
    const oldWeekRecords = this.calculateWeekVolume(finalWorkoutData, oldWeek);
    await this.saveWeekVolume(clientId, oldWeekRecords);
    
    // The new week will start with the same workout data (carry-over)
    // This is handled by the workout assignment update logic
  }
}


