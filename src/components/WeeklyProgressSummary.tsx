import React, { useState, useEffect } from 'react';
import { TrendingUp, Calendar, Dumbbell, CheckCircle2, Target, Zap, Award, ChevronDown, ChevronUp } from 'lucide-react';
import { Client } from '../types';
import { getWeightLogsForWeek } from '../lib/weightTracking';

interface WeeklyProgressSummaryProps {
  client: Client;
  week: number;
  isDark: boolean;
}

interface WeeklySummary {
  workoutsCompleted: number;
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  averageWeight: number;
  weightChange: number;
  prCount: number;
  adherenceRate: number;
}

export const WeeklyProgressSummary: React.FC<WeeklyProgressSummaryProps> = ({
  client,
  week,
  isDark
}) => {
  const [summary, setSummary] = useState<WeeklySummary | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWeeklySummary();
  }, [client.id, week]);

  const loadWeeklySummary = async () => {
    setLoading(true);
    try {
      // Get weight data for the week
      const weightLogs = await getWeightLogsForWeek(client.id, week);
      const weekWeights = weightLogs.filter(log => log.week === week);
      const previousWeekWeights = weightLogs.filter(log => log.week === week - 1);

      const avgCurrentWeight = weekWeights.length > 0
        ? weekWeights.reduce((sum, log) => sum + log.weight, 0) / weekWeights.length
        : 0;

      const avgPreviousWeight = previousWeekWeights.length > 0
        ? previousWeekWeights.reduce((sum, log) => sum + log.weight, 0) / previousWeekWeights.length
        : avgCurrentWeight;

      const weightChange = avgCurrentWeight - avgPreviousWeight;

      // Calculate workout statistics
      const program = client.workoutAssignment?.program;
      const totalWorkouts = program?.days.length || 0;
      
      // In a real implementation, you'd track completed workouts
      // For now, we'll use placeholder data
      const workoutsCompleted = 0; // TODO: Track from actual workout completion
      const totalSets = 0; // TODO: Calculate from completed sets
      const totalVolume = 0; // TODO: Calculate from sets × reps × weight
      const prCount = 0; // TODO: Count from PR tracking
      const adherenceRate = totalWorkouts > 0 ? (workoutsCompleted / totalWorkouts) * 100 : 0;

      setSummary({
        workoutsCompleted,
        totalWorkouts,
        totalSets,
        totalVolume,
        averageWeight: avgCurrentWeight,
        weightChange,
        prCount,
        adherenceRate
      });
    } catch (error) {
      console.error('Error loading weekly summary:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 shadow-xl">
      {/* Header */}
      <div 
        className="p-4 sm:p-6 cursor-pointer hover:bg-slate-700/20 transition-colors rounded-t-2xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-white">
                Week {week} Summary
              </h3>
              <p className="text-sm text-slate-400">
                {summary.adherenceRate.toFixed(0)}% Adherence
              </p>
            </div>
          </div>
          <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors">
            {isExpanded ? (
              <ChevronUp className="w-5 h-5 text-slate-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="px-4 sm:px-6 pb-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {/* Workouts Completed */}
            <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl p-3 sm:p-4 border border-blue-500/20">
              <div className="flex items-center justify-between mb-2">
                <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
                <span className="text-lg sm:text-2xl font-bold text-blue-300">
                  {summary.workoutsCompleted}/{summary.totalWorkouts}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Workouts</p>
            </div>

            {/* Total Sets */}
            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl p-3 sm:p-4 border border-purple-500/20">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
                <span className="text-lg sm:text-2xl font-bold text-purple-300">
                  {summary.totalSets}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Total Sets</p>
            </div>

            {/* Total Volume */}
            <div className="bg-gradient-to-br from-green-500/10 to-green-600/5 rounded-xl p-3 sm:p-4 border border-green-500/20">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
                <span className="text-lg sm:text-2xl font-bold text-green-300">
                  {(summary.totalVolume / 1000).toFixed(1)}k
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">Volume (kg)</p>
            </div>

            {/* PRs */}
            <div className="bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 rounded-xl p-3 sm:p-4 border border-yellow-500/20">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                <span className="text-lg sm:text-2xl font-bold text-yellow-300">
                  {summary.prCount}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400">New PRs</p>
            </div>
          </div>

          {/* Weight Progress */}
          {summary.averageWeight > 0 && (
            <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 rounded-xl p-4 border border-cyan-500/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Average Weight</p>
                  <p className="text-2xl font-bold text-cyan-300">
                    {summary.averageWeight.toFixed(1)} kg
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400 mb-1">Change</p>
                  <div className="flex items-center space-x-1">
                    <TrendingUp 
                      className={`w-5 h-5 ${
                        summary.weightChange > 0 ? 'text-green-400' : 
                        summary.weightChange < 0 ? 'text-red-400' : 
                        'text-slate-400'
                      }`}
                    />
                    <span className={`text-xl font-bold ${
                      summary.weightChange > 0 ? 'text-green-300' : 
                      summary.weightChange < 0 ? 'text-red-300' : 
                      'text-slate-300'
                    }`}>
                      {summary.weightChange > 0 ? '+' : ''}{summary.weightChange.toFixed(1)} kg
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-400">Weekly Goal</span>
              <span className="text-white font-semibold">
                {summary.workoutsCompleted} / {summary.totalWorkouts} Workouts
              </span>
            </div>
            <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500 rounded-full"
                style={{ width: `${summary.adherenceRate}%` }}
              />
            </div>
          </div>

          {/* Motivational Message */}
          {summary.adherenceRate >= 80 && (
            <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/10 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-start space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-green-300 font-semibold mb-1">Excellent Work!</p>
                  <p className="text-sm text-slate-300">
                    You're crushing your goals this week. Keep up the amazing work!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyProgressSummary;

