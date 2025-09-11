import React from 'react';
import { PersonalRecord, StrengthProgress } from '../types';
import { TrendingUp, Award, Calendar, Weight, Activity } from 'lucide-react';

interface StrengthProgressChartProps {
  strengthProgress: StrengthProgress;
  isDark: boolean;
}

export const StrengthProgressChart: React.FC<StrengthProgressChartProps> = ({
  strengthProgress,
  isDark
}) => {
  const { exerciseName, currentPR, progressData, improvement, sessions } = strengthProgress;

  // Calculate chart data
  const chartData = progressData.map((point, index) => ({
    x: index + 1,
    y: point.weight,
    date: point.date,
    reps: point.reps,
    volume: point.volume
  }));

  // Find max values for scaling
  const maxWeight = Math.max(...chartData.map(d => d.y));
  const minWeight = Math.min(...chartData.map(d => d.y));
  const weightRange = maxWeight - minWeight;

  // Simple line chart component
  const renderLineChart = () => {
    if (chartData.length < 2) {
      return (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-center">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Not enough data to display chart</p>
            <p className="text-sm">Complete at least 2 workouts to see progress</p>
          </div>
        </div>
      );
    }

    const points = chartData.map((point, index) => {
      const x = (index / (chartData.length - 1)) * 100;
      const y = weightRange > 0 ? ((point.y - minWeight) / weightRange) * 100 : 50;
      return { x, y, ...point };
    });

    return (
      <div className="relative h-64 w-full">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(y => (
            <line
              key={y}
              x1="0"
              y1={y}
              x2="100"
              y2={y}
              stroke={isDark ? '#374151' : '#e5e7eb'}
              strokeWidth="0.5"
            />
          ))}
          
          {/* Line path */}
          <path
            d={`M ${points.map(p => `${p.x},${100 - p.y}`).join(' L ')}`}
            fill="none"
            stroke={isDark ? '#10b981' : '#059669'}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          
          {/* Data points */}
          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={100 - point.y}
              r="2"
              fill={isDark ? '#10b981' : '#059669'}
              className="hover:r-3 transition-all duration-200"
            >
              <title>
                {point.date.toLocaleDateString()}: {point.y}kg x {point.reps} reps
              </title>
            </circle>
          ))}
        </svg>
        
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500">
          <span>{maxWeight}kg</span>
          <span>{Math.round((maxWeight + minWeight) / 2)}kg</span>
          <span>{minWeight}kg</span>
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-xl p-6 ${isDark ? 'bg-slate-800' : 'bg-white'} border ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-green-600' : 'bg-green-100'}`}>
            <Weight className={`w-5 h-5 ${isDark ? 'text-white' : 'text-green-600'}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{exerciseName}</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {sessions.length} session{sessions.length !== 1 ? 's' : ''} tracked
            </p>
          </div>
        </div>
        
        {currentPR && (
          <div className="text-right">
            <div className="flex items-center space-x-2 text-green-600 dark:text-green-400">
              <Award className="w-4 h-4" />
              <span className="text-sm font-medium">Current PR</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">
              {currentPR.weight}kg x {currentPR.reps}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {currentPR.date.toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Weight Progression</h4>
        {renderLineChart()}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Weight Gain</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {improvement.weightGain > 0 ? '+' : ''}{improvement.weightGain.toFixed(1)}kg
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="w-4 h-4 text-blue-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Volume Gain</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {improvement.volumeGain > 0 ? '+' : ''}{improvement.volumeGain.toFixed(0)}kg
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <Calendar className="w-4 h-4 text-purple-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Time Span</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {improvement.timeSpan} days
          </p>
        </div>

        <div className={`p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
          <div className="flex items-center space-x-2 mb-1">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Total PRs</span>
          </div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {strengthProgress.allPRs.length}
          </p>
        </div>
      </div>

      {/* Recent Sessions */}
      {sessions.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recent Sessions</h4>
          <div className="space-y-2">
            {sessions.slice(-3).reverse().map((session, index) => (
              <div key={session.id} className={`flex items-center justify-between p-3 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-slate-50'}`}>
                <div className="flex items-center space-x-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300' : 
                    'bg-slate-100 text-slate-600 dark:bg-slate-600 dark:text-slate-300'
                  }`}>
                    {sessions.length - index}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {session.bestWeight}kg x {session.bestReps} reps
                    </p>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {session.date.toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {session.totalVolume.toFixed(0)}kg total
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {session.sets.length} sets
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StrengthProgressChart;



