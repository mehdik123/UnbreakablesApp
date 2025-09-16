import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Target,
  Scale,
  BarChart3
} from 'lucide-react';
import { WeightEntry, Client } from '../types';
import { logClientWeight, getClientWeightLogs } from '../lib/progressTracking';

interface WeeklyWeightLoggerProps {
  client: Client;
  currentWeek: number;
  maxWeeks: number;
  isDark: boolean;
}

interface WeeklyWeightData {
  [day: string]: {
    weight: number | null;
    notes?: string;
    id?: string;
  };
}

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Mon', fullName: 'Monday' },
  { key: 'tuesday', label: 'Tue', fullName: 'Tuesday' },
  { key: 'wednesday', label: 'Wed', fullName: 'Wednesday' },
  { key: 'thursday', label: 'Thu', fullName: 'Thursday' },
  { key: 'friday', label: 'Fri', fullName: 'Friday' },
  { key: 'saturday', label: 'Sat', fullName: 'Saturday' },
  { key: 'sunday', label: 'Sun', fullName: 'Sunday' }
];

export default function WeeklyWeightLogger({ client, currentWeek, maxWeeks, isDark }: WeeklyWeightLoggerProps) {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [weeklyData, setWeeklyData] = useState<{ [week: number]: WeeklyWeightData }>({});
  const [loading, setLoading] = useState(true);
  const [editingCell, setEditingCell] = useState<{ week: number; day: string } | null>(null);
  const [tempValue, setTempValue] = useState('');

  // Load weight data
  useEffect(() => {
    loadWeightData();
  }, [client.id]);

  const loadWeightData = async () => {
    try {
      setLoading(true);
      const weightLogs = await getClientWeightLogs(client.id);
      
      // Group weight logs by week and day
      const groupedData: { [week: number]: WeeklyWeightData } = {};
      
      weightLogs.forEach(log => {
        const weekNumber = getWeekNumberFromDate(log.date);
        const dayKey = getDayKeyFromDate(log.date);
        
        if (!groupedData[weekNumber]) {
          groupedData[weekNumber] = initializeWeekData();
        }
        
        groupedData[weekNumber][dayKey] = {
          weight: log.weight,
          notes: log.notes,
          id: log.id
        };
      });
      
      setWeeklyData(groupedData);
    } catch (error) {
      console.error('Error loading weight data:', error);
    } finally {
      setLoading(false);
    }
  };

  const initializeWeekData = (): WeeklyWeightData => {
    const data: WeeklyWeightData = {};
    DAYS_OF_WEEK.forEach(day => {
      data[day.key] = { weight: null };
    });
    return data;
  };

  const getWeekNumberFromDate = (date: Date): number => {
    // Simple week calculation based on program start date
    const startDate = new Date(client.workoutAssignment?.startDate || client.startDate);
    const diffTime = date.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, Math.ceil((diffDays + 1) / 7));
  };

  const getDayKeyFromDate = (date: Date): string => {
    const dayIndex = date.getDay();
    const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return dayMap[dayIndex];
  };

  const getDateForWeekAndDay = (week: number, dayKey: string): Date => {
    const startDate = new Date(client.workoutAssignment?.startDate || client.startDate);
    const dayIndex = DAYS_OF_WEEK.findIndex(d => d.key === dayKey);
    
    // Calculate the start of the target week
    const weekStart = new Date(startDate);
    weekStart.setDate(startDate.getDate() + (week - 1) * 7);
    
    // Adjust to Monday of that week
    const mondayOffset = weekStart.getDay() === 0 ? -6 : 1 - weekStart.getDay();
    weekStart.setDate(weekStart.getDate() + mondayOffset);
    
    // Add the day offset
    const targetDate = new Date(weekStart);
    targetDate.setDate(weekStart.getDate() + dayIndex);
    
    return targetDate;
  };

  const handleCellClick = (week: number, dayKey: string) => {
    const currentData = weeklyData[week]?.[dayKey];
    setEditingCell({ week, day: dayKey });
    setTempValue(currentData?.weight?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell) return;
    
    const { week, day } = editingCell;
    const weight = parseFloat(tempValue);
    
    if (isNaN(weight) || weight <= 0) {
      setEditingCell(null);
      return;
    }

    try {
      const date = getDateForWeekAndDay(week, day);
      await logClientWeight(client.id, weight, date);
      
      // Update local state
      setWeeklyData(prev => ({
        ...prev,
        [week]: {
          ...prev[week],
          [day]: { weight, notes: '' }
        }
      }));
      
      setEditingCell(null);
    } catch (error) {
      console.error('Error saving weight:', error);
      alert('Failed to save weight. Please try again.');
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const calculateWeekAverage = (week: number): number | null => {
    const weekData = weeklyData[week];
    if (!weekData) return null;
    
    const weights = Object.values(weekData)
      .map(day => day.weight)
      .filter((weight): weight is number => weight !== null);
    
    if (weights.length === 0) return null;
    
    return weights.reduce((sum, weight) => sum + weight, 0) / weights.length;
  };

  const getWeekTrend = (week: number): { change: number; direction: 'up' | 'down' | 'stable' } | null => {
    if (week <= 1) return null;
    
    const currentAvg = calculateWeekAverage(week);
    const previousAvg = calculateWeekAverage(week - 1);
    
    if (!currentAvg || !previousAvg) return null;
    
    const change = currentAvg - previousAvg;
    return {
      change: Math.abs(change),
      direction: change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable'
    };
  };

  const getCurrentWeekData = () => {
    if (!weeklyData[selectedWeek]) {
      return initializeWeekData();
    }
    return weeklyData[selectedWeek];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const currentWeekData = getCurrentWeekData();
  const weekAverage = calculateWeekAverage(selectedWeek);
  const weekTrend = getWeekTrend(selectedWeek);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Scale className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold text-white">Weekly Weight Log</h3>
        </div>
        
        {/* Week Navigation */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
            disabled={selectedWeek <= 1}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          
          <div className="px-4 py-2 bg-slate-700/50 rounded-lg">
            <span className="text-white font-medium">Week {selectedWeek}</span>
          </div>
          
          <button
            onClick={() => setSelectedWeek(Math.min(maxWeeks, selectedWeek + 1))}
            disabled={selectedWeek >= maxWeeks}
            className="p-2 rounded-lg bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:opacity-50 text-white transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Week Summary */}
      {weekAverage && (
        <div className="bg-slate-700/30 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">{weekAverage.toFixed(1)} kg</div>
                <div className="text-slate-400 text-sm">Week Average</div>
              </div>
              
              {weekTrend && (
                <div className={`flex items-center space-x-2 ${
                  weekTrend.direction === 'up' ? 'text-red-400' : 
                  weekTrend.direction === 'down' ? 'text-green-400' : 'text-slate-400'
                }`}>
                  {weekTrend.direction === 'up' ? <TrendingUp className="w-5 h-5" /> : 
                   weekTrend.direction === 'down' ? <TrendingDown className="w-5 h-5" /> : 
                   <Target className="w-5 h-5" />}
                  <span className="font-medium">
                    {weekTrend.direction === 'stable' ? 'No change' : 
                     `${weekTrend.direction === 'up' ? '+' : '-'}${weekTrend.change.toFixed(1)}kg`}
                  </span>
                  <span className="text-sm">from last week</span>
                </div>
              )}
            </div>
            
            <BarChart3 className="w-6 h-6 text-slate-500" />
          </div>
        </div>
      )}

      {/* Daily Weight Grid */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3">
        {DAYS_OF_WEEK.map((day) => {
          const dayData = currentWeekData[day.key];
          const isEditing = editingCell?.week === selectedWeek && editingCell?.day === day.key;
          const date = getDateForWeekAndDay(selectedWeek, day.key);
          const isToday = date.toDateString() === new Date().toDateString();
          const isFuture = false; // Allow all dates for weight logging
          
          return (
            <div key={day.key} className="text-center">
              {/* Day Label */}
              <div className="text-slate-400 text-sm font-medium mb-2">
                {day.label}
              </div>
              
              {/* Weight Cell */}
              <div
                className={`relative h-20 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                  isToday 
                    ? 'border-blue-500 bg-blue-500/10' 
                    : dayData.weight
                    ? 'border-green-500/50 bg-green-500/10 hover:bg-green-500/20'
                    : 'border-slate-600 bg-slate-700/30 hover:bg-slate-600/30'
                }`}
                onClick={() => handleCellClick(selectedWeek, day.key)}
              >
                {isEditing ? (
                  <div className="absolute inset-1 flex flex-col">
                    <input
                      type="number"
                      step="0.1"
                      value={tempValue}
                      onChange={(e) => setTempValue(e.target.value)}
                      className="flex-1 bg-slate-800 text-white text-center text-sm rounded border border-slate-600 focus:outline-none focus:border-blue-500"
                      placeholder="kg"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCellSave();
                        if (e.key === 'Escape') handleCellCancel();
                      }}
                      onBlur={handleCellSave}
                    />
                  </div>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    {dayData.weight ? (
                      <>
                        <div className="text-white font-bold text-sm">
                          {dayData.weight.toFixed(1)}
                        </div>
                        <div className="text-slate-400 text-xs">kg</div>
                      </>
                    ) : (
                      <div className="text-slate-500 text-xs">
                        Tap to log
                      </div>
                    )}
                  </div>
                )}
                
                {/* Today Indicator */}
                {isToday && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                )}
              </div>
              
              {/* Date */}
              <div className="text-slate-500 text-xs mt-1">
                {date.getDate()}/{date.getMonth() + 1}
              </div>
            </div>
          );
        })}
      </div>

      {/* Instructions */}
      <div className="mt-4 text-center text-slate-400 text-sm">
        Tap on any cell to log your weight for that day. Navigate between weeks using the arrows above.
      </div>

      {/* Weight Progress Line Chart */}
      {Object.keys(weeklyData).length > 0 && (
        <div className="mt-8 bg-slate-700/30 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h4 className="text-lg font-semibold text-white">Weight Progress Line Chart</h4>
            <TrendingUp className="w-5 h-5 text-blue-400" />
          </div>
          
          {/* Line Chart */}
          <div className="h-64 bg-slate-800/50 rounded-lg p-6 relative overflow-hidden">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Background Grid */}
              <defs>
                <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgb(71 85 105)" strokeWidth="0.5" opacity="0.3"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {(() => {
                const sortedWeeks = Object.keys(weeklyData)
                  .map(w => parseInt(w))
                  .sort((a, b) => a - b)
                  .slice(-10); // Show last 10 weeks
                
                if (sortedWeeks.length < 2) return null;
                
                const weights = sortedWeeks.map(w => calculateWeekAverage(w)).filter(w => w !== null) as number[];
                if (weights.length < 2) return null;
                
                const minWeight = Math.min(...weights);
                const maxWeight = Math.max(...weights);
                const weightRange = maxWeight - minWeight || 1;
                
                const points = weights.map((weight, index) => {
                  const x = (index / (weights.length - 1)) * 360 + 20;
                  const y = 180 - ((weight - minWeight) / weightRange) * 160;
                  return { x, y, weight, week: sortedWeeks[index] };
                });
                
                const pathData = points.map((point, index) => 
                  `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ');
                
                return (
                  <g>
                    {/* Line */}
                    <path
                      d={pathData}
                      fill="none"
                      stroke="url(#lineGradient)"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    
                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                    
                    {/* Data Points */}
                    {points.map((point, index) => (
                      <g key={index}>
                        <circle
                          cx={point.x}
                          cy={point.y}
                          r="4"
                          fill="#3b82f6"
                          stroke="#1e293b"
                          strokeWidth="2"
                        />
                        <text
                          x={point.x}
                          y={point.y - 10}
                          textAnchor="middle"
                          fontSize="10"
                          fill="#94a3b8"
                          className="font-medium"
                        >
                          {point.weight.toFixed(1)}
                        </text>
                        <text
                          x={point.x}
                          y={195}
                          textAnchor="middle"
                          fontSize="9"
                          fill="#64748b"
                        >
                          W{point.week}
                        </text>
                      </g>
                    ))}
                  </g>
                );
              })()}
            </svg>
          </div>
          
          {/* Trend Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-400">
                {Object.keys(weeklyData).length}
              </div>
              <div className="text-slate-400 text-sm">Weeks Logged</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-400">
                {calculateWeekAverage(selectedWeek)?.toFixed(1) || '--'} kg
              </div>
              <div className="text-slate-400 text-sm">Current Avg</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-400">
                {weekTrend ? (weekTrend.direction === 'stable' ? '0' : 
                  `${weekTrend.direction === 'up' ? '+' : '-'}${weekTrend.change.toFixed(1)}`) : '--'} kg
              </div>
              <div className="text-slate-400 text-sm">Weekly Change</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
