import { WorkoutWeek, ClientWorkoutAssignment } from '../types';

export interface WeekProgressionResult {
  success: boolean;
  message: string;
  updatedWeeks: WorkoutWeek[];
  currentWeek: number;
}

/**
 * Week Progression Manager
 * Handles the logic for week completion and progression
 */
export class WeekProgressionManager {
  
  /**
   * Mark a week as completed and unlock the next week
   */
  static markWeekComplete(
    weeks: WorkoutWeek[], 
    weekNumber: number,
    totalWeeks: number
  ): WeekProgressionResult {
    
    // Validate week number
    if (weekNumber < 1 || weekNumber > totalWeeks) {
      return {
        success: false,
        message: `Invalid week number: ${weekNumber}`,
        updatedWeeks: weeks,
        currentWeek: this.getCurrentWeek(weeks)
      };
    }

    // Find the week to complete
    const weekToComplete = weeks.find(w => w.weekNumber === weekNumber);
    if (!weekToComplete) {
      return {
        success: false,
        message: `Week ${weekNumber} not found`,
        updatedWeeks: weeks,
        currentWeek: this.getCurrentWeek(weeks)
      };
    }

    // Check if week is already completed
    if (weekToComplete.isCompleted) {
      return {
        success: false,
        message: `Week ${weekNumber} is already completed`,
        updatedWeeks: weeks,
        currentWeek: this.getCurrentWeek(weeks)
      };
    }

    // Check if week is unlocked
    if (!weekToComplete.isUnlocked) {
      return {
        success: false,
        message: `Week ${weekNumber} is not unlocked yet`,
        updatedWeeks: weeks,
        currentWeek: this.getCurrentWeek(weeks)
      };
    }

    // Create updated weeks array
    const updatedWeeks = weeks.map(week => {
      if (week.weekNumber === weekNumber) {
        // Mark current week as completed
        return {
          ...week,
          isCompleted: true,
          completedAt: new Date()
        };
      } else if (week.weekNumber === weekNumber + 1 && weekNumber < totalWeeks) {
        // Unlock next week
        return {
          ...week,
          isUnlocked: true,
          startDate: new Date()
        };
      }
      return week;
    });

    const newCurrentWeek = weekNumber < totalWeeks ? weekNumber + 1 : weekNumber;

    return {
      success: true,
      message: weekNumber < totalWeeks 
        ? `Week ${weekNumber} completed! Week ${weekNumber + 1} is now unlocked.`
        : `Week ${weekNumber} completed! Program finished.`,
      updatedWeeks,
      currentWeek: newCurrentWeek
    };
  }

  /**
   * Get the current active week (first unlocked, non-completed week)
   */
  static getCurrentWeek(weeks: WorkoutWeek[]): number {
    // Find the first week that is unlocked but not completed
    const activeWeek = weeks.find(week => week.isUnlocked && !week.isCompleted);
    if (activeWeek) {
      return activeWeek.weekNumber;
    }

    // If no active week found, return the last completed week or 1
    const lastCompletedWeek = weeks
      .filter(week => week.isCompleted)
      .sort((a, b) => b.weekNumber - a.weekNumber)[0];
    
    return lastCompletedWeek ? Math.min(lastCompletedWeek.weekNumber + 1, weeks.length) : 1;
  }

  /**
   * Get week status for display purposes
   */
  static getWeekStatus(week: WorkoutWeek): 'locked' | 'active' | 'completed' {
    if (week.isCompleted) return 'completed';
    if (week.isUnlocked) return 'active';
    return 'locked';
  }

  /**
   * Initialize weeks for a new client assignment
   */
  static initializeWeeks(totalWeeks: number, programDays: any[]): WorkoutWeek[] {
    return Array.from({ length: totalWeeks }, (_, index) => ({
      weekNumber: index + 1,
      isUnlocked: index === 0, // Only first week is unlocked initially
      isCompleted: false,
      exercises: [], // Required by WorkoutWeek interface
      days: programDays || [],
      startDate: index === 0 ? new Date() : undefined
    }));
  }

  /**
   * Check if a client can access a specific week
   */
  static canAccessWeek(weeks: WorkoutWeek[], weekNumber: number): boolean {
    const week = weeks.find(w => w.weekNumber === weekNumber);
    return week ? week.isUnlocked : false;
  }

  /**
   * Get progression summary for coach dashboard
   */
  static getProgressionSummary(weeks: WorkoutWeek[]) {
    const completed = weeks.filter(w => w.isCompleted).length;
    const total = weeks.length;
    const current = this.getCurrentWeek(weeks);
    const progress = (completed / total) * 100;

    return {
      completedWeeks: completed,
      totalWeeks: total,
      currentWeek: current,
      progressPercentage: Math.round(progress),
      isFinished: completed === total,
      weeksRemaining: total - completed
    };
  }
}
