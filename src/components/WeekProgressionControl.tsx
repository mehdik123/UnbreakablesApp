import React, { useState } from 'react';
import {
  CheckCircle,
  Lock,
  Unlock,
  Calendar,
  Trophy,
  ArrowRight,
  Clock,
  AlertCircle
} from 'lucide-react';
import { WorkoutWeek, ClientWorkoutAssignment } from '../types';
import { WeekProgressionManager } from '../utils/weekProgressionManager';

interface WeekProgressionControlProps {
  client: any;
  assignment: ClientWorkoutAssignment;
  onUpdateAssignment: (updatedAssignment: ClientWorkoutAssignment) => void;
  isDark?: boolean;
}

export const WeekProgressionControl: React.FC<WeekProgressionControlProps> = ({
  client,
  assignment,
  onUpdateAssignment,
  isDark = false
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<number | null>(null);

  const progressionSummary = WeekProgressionManager.getProgressionSummary(assignment.weeks);
  const currentWeek = WeekProgressionManager.getCurrentWeek(assignment.weeks);

  const handleMarkWeekComplete = async (weekNumber: number) => {
    setIsProcessing(true);
    
    try {
      const result = WeekProgressionManager.markWeekComplete(
        assignment.weeks,
        weekNumber,
        assignment.duration
      );

      if (result.success) {
        const updatedAssignment: ClientWorkoutAssignment = {
          ...assignment,
          weeks: result.updatedWeeks,
          currentWeek: result.currentWeek,
          lastModifiedBy: 'coach',
          lastModifiedAt: new Date()
        };

        onUpdateAssignment(updatedAssignment);
        
        // Show success message
        alert(result.message);
      } else {
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error('Error marking week complete:', error);
      alert('Failed to mark week as complete. Please try again.');
    } finally {
      setIsProcessing(false);
      setShowConfirmDialog(null);
    }
  };

  const getWeekStatusColor = (week: WorkoutWeek) => {
    const status = WeekProgressionManager.getWeekStatus(week);
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'active':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
      case 'locked':
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
      default:
        return 'bg-slate-500/10 border-slate-500/30 text-slate-400';
    }
  };

  const getWeekStatusIcon = (week: WorkoutWeek) => {
    const status = WeekProgressionManager.getWeekStatus(week);
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'active':
        return <Clock className="w-4 h-4" />;
      case 'locked':
        return <Lock className="w-4 h-4" />;
      default:
        return <Lock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Progress Summary */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            Week Progression Control
          </h3>
          <div className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>
              Week {currentWeek} of {progressionSummary.totalWeeks}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Overall Progress
            </span>
            <span className="text-sm font-bold text-blue-600">
              {progressionSummary.progressPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progressionSummary.progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
            <span>{progressionSummary.completedWeeks} completed</span>
            <span>{progressionSummary.weeksRemaining} remaining</span>
          </div>
        </div>

        {/* Current Week Status */}
        {!progressionSummary.isFinished && (
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Currently Active: Week {currentWeek}
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Client is working on week {currentWeek}. Mark as complete when ready to progress.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Finished Program */}
        {progressionSummary.isFinished && (
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-green-900 dark:text-green-100">
                  Program Completed! 🎉
                </h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {client.name} has successfully completed all {progressionSummary.totalWeeks} weeks.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Week Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h4 className="text-md font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Week Management
        </h4>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {assignment.weeks.map((week) => {
            const status = WeekProgressionManager.getWeekStatus(week);
            const isCurrentWeek = week.weekNumber === currentWeek;
            const canMarkComplete = status === 'active' && !week.isCompleted;

            return (
              <div
                key={week.weekNumber}
                className={`relative p-4 rounded-lg border transition-all duration-200 ${getWeekStatusColor(week)} ${
                  isCurrentWeek ? 'ring-2 ring-blue-500/50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getWeekStatusIcon(week)}
                    <span className="font-medium">Week {week.weekNumber}</span>
                  </div>
                  {isCurrentWeek && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  )}
                </div>

                <div className="text-xs space-y-1">
                  <div className="capitalize">{status}</div>
                  {week.startDate && (
                    <div className="text-slate-500">
                      Started: {new Date(week.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {week.completedAt && (
                    <div className="text-green-600">
                      Completed: {new Date(week.completedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>

                {/* Mark Complete Button */}
                {canMarkComplete && (
                  <button
                    onClick={() => setShowConfirmDialog(week.weekNumber)}
                    disabled={isProcessing}
                    className="mt-3 w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center space-x-1"
                  >
                    <CheckCircle className="w-3 h-3" />
                    <span>Mark Complete</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 max-w-md w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                <AlertCircle className="w-4 h-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Mark Week {showConfirmDialog} Complete?
              </h3>
            </div>
            
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              This will mark week {showConfirmDialog} as completed and unlock week {showConfirmDialog + 1} 
              {showConfirmDialog === assignment.duration ? ' (This is the final week)' : ''}.
              This action cannot be undone.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowConfirmDialog(null)}
                className="flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleMarkWeekComplete(showConfirmDialog)}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark Complete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeekProgressionControl;
