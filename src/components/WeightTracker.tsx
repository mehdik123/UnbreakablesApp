import React, { useMemo, useState } from 'react';
import { TrendingUp, Calendar, Target, ChevronLeft, ChevronRight } from 'lucide-react';

interface Entry { day: number; value: number | null; }

interface WeightTrackerProps {
  weeks: number; // 1-4
  unit: 'kg' | 'lbs';
  onChangeUnit: (u: 'kg' | 'lbs') => void;
  isDark?: boolean;
}

export const WeightTracker: React.FC<WeightTrackerProps> = ({ weeks, unit, onChangeUnit, isDark = false }) => {
  const totalDays = Math.min(4, Math.max(1, weeks)) * 7;
  const [entries, setEntries] = useState<Entry[]>(Array.from({ length: totalDays }, (_, i) => ({ day: i + 1, value: null })));
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  const values = entries.map(e => e.value).filter((v): v is number => v !== null);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  const points = useMemo(() => {
    if (!values.length) return '';
    const xs = entries.map((_, i) => (i / (entries.length - 1)) * 300);
    const ys = entries.map(e => {
      const v = e.value ?? max; // missing -> flat
      const t = (v - min) / Math.max(0.0001, max - min);
      return 100 - t * 100;
    });
    return xs.map((x, i) => `${x},${ys[i]}`).join(' ');
  }, [entries, min, max]);

  const setValue = (index: number, raw: string) => {
    const n = raw ? parseFloat(raw) : NaN;
    setEntries(prev => prev.map((e, i) => i === index ? { ...e, value: isNaN(n) ? null : n } : e));
  };

  const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'].slice(0, weeks);
  
  // Get entries for selected week
  const weekStartIndex = (selectedWeek - 1) * 7;
  const weekEntries = entries.slice(weekStartIndex, weekStartIndex + 7);

  return (
    <div className={`p-8 rounded-3xl shadow-2xl border-2 transition-all duration-200 ${
      isDark 
        ? 'bg-gray-800 border-gray-700 text-white' 
        : 'bg-white border-gray-200 text-gray-900 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-3xl flex items-center justify-center shadow-2xl">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-red-600">Weight Progress Tracker</h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Track your weight journey over {weeks} week{weeks > 1 ? 's' : ''}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <Target className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className="text-lg font-semibold">Unit:</span>
            <select 
              value={unit} 
              onChange={(e) => onChangeUnit(e.target.value as 'kg' | 'lbs')} 
              className={`px-4 py-2 rounded-2xl border-2 text-lg font-semibold transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-900 shadow-lg'
              }`}
            >
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </div>
        </div>
      </div>

      {/* Week Selection */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-6 text-red-600">Select Week</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {weekLabels.map((week, index) => (
            <button
              key={index}
              onClick={() => setSelectedWeek(index + 1)}
              className={`p-6 rounded-3xl border-2 transition-all duration-200 hover:scale-105 ${
                selectedWeek === index + 1
                  ? 'bg-gradient-to-r from-red-600 to-red-700 text-white border-red-600 shadow-xl'
                  : isDark
                    ? 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                    : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300 shadow-lg'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl font-bold">{week}</div>
                <div className={`text-sm mt-2 ${selectedWeek === index + 1 ? 'text-red-100' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {entries.slice(index * 7, (index + 1) * 7).filter(e => e.value !== null).length}/7 days logged
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Week Weight Input */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-red-600">{weekLabels[selectedWeek - 1]} Weight Log</h3>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
              disabled={selectedWeek === 1}
              className={`p-2 rounded-2xl transition-all duration-200 ${
                selectedWeek === 1
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setSelectedWeek(Math.min(weeks, selectedWeek + 1))}
              disabled={selectedWeek === weeks}
              className={`p-2 rounded-2xl transition-all duration-200 ${
                selectedWeek === weeks
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-7 gap-4">
          {weekEntries.map((e, i) => {
            const globalIndex = weekStartIndex + i;
            return (
              <div key={i} className="flex flex-col items-center space-y-2">
                <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  D{globalIndex + 1}
                </span>
                <input
                  type="number"
                  value={e.value ?? ''}
                  onChange={(ev) => setValue(globalIndex, ev.target.value)}
                  className={`w-20 px-3 py-2 rounded-2xl border-2 text-lg font-semibold text-center transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-red-500/20 focus:border-red-500 ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500' 
                      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 shadow-lg'
                  }`}
                  placeholder="-"
                  step="0.1"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress Chart */}
      <div className={`p-6 rounded-3xl border-2 ${
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-red-600">Overall Progress Chart</h3>
          <div className="flex items-center space-x-2">
            <Calendar className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
            <span className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {values.length > 0 ? `${values.length} entries` : 'No data yet'}
            </span>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <svg viewBox="0 0 300 100" className="w-full h-40">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="50" height="20" patternUnits="userSpaceOnUse">
                <path d="M 50 0 L 0 0 0 20" fill="none" stroke={isDark ? "#374151" : "#e5e7eb"} strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart line */}
            {values.length > 0 && (
              <polyline 
                fill="none" 
                stroke="#ef4444" 
                strokeWidth="3" 
                points={points}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            
            {/* Data points */}
            {entries.map((e, i) => {
              if (e.value === null) return null;
              const x = (i / (entries.length - 1)) * 300;
              const v = e.value;
              const t = (v - min) / Math.max(0.0001, max - min);
              const y = 100 - t * 100;
              return (
                <circle
                  key={i}
                  cx={x}
                  cy={y}
                  r="4"
                  fill="#ef4444"
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
        
        {/* Stats */}
        {values.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className={`text-center p-4 rounded-2xl ${
              isDark ? 'bg-gray-600' : 'bg-white shadow-lg'
            }`}>
              <div className="text-2xl font-bold text-red-600">{min.toFixed(1)}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Lowest ({unit})</div>
            </div>
            <div className={`text-center p-4 rounded-2xl ${
              isDark ? 'bg-gray-600' : 'bg-white shadow-lg'
            }`}>
              <div className="text-2xl font-bold text-red-600">{max.toFixed(1)}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Highest ({unit})</div>
            </div>
            <div className={`text-center p-4 rounded-2xl ${
              isDark ? 'bg-gray-600' : 'bg-white shadow-lg'
            }`}>
              <div className="text-2xl font-bold text-red-600">{(max - min).toFixed(1)}</div>
              <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Range ({unit})</div>
            </div>
          </div>
        )}
      </div>

      {/* Empty state */}
      {values.length === 0 && (
        <div className="text-center py-12">
          <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-xl text-gray-600">Start logging your weight to see your progress chart!</p>
        </div>
      )}
    </div>
  );
};





