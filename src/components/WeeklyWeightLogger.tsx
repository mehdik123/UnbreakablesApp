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
import { UltraModernWeightChart } from './UltraModernWeightChart';
import { WeightStatsGrid } from './WeightStatsCards';
import { WeeklyWeightOverview } from './WeeklyWeightOverview';

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
      console.log('📊 WEIGHT LOAD DEBUG - Starting to load weight data for client:', client.id);
      setLoading(true);
      const weightLogs = await getClientWeightLogs(client.id);
      
      console.log('📊 WEIGHT LOAD DEBUG - Raw weight logs from DB:', weightLogs);
      
      // Group weight logs by week and day
      const groupedData: { [week: number]: WeeklyWeightData } = {};
      
      weightLogs.forEach(log => {
        const weekNumber = getWeekNumberFromDate(log.date);
        const dayKey = getDayKeyFromDate(log.date);
        
        console.log('📊 WEIGHT LOAD DEBUG - Processing log:', {
          log,
          weekNumber,
          dayKey,
          date: log.date
        });
        
        if (!groupedData[weekNumber]) {
          groupedData[weekNumber] = initializeWeekData();
        }
        
        groupedData[weekNumber][dayKey] = {
          weight: log.weight,
          notes: log.notes,
          id: log.id
        };
      });
      
      console.log('📊 WEIGHT LOAD DEBUG - Grouped data:', groupedData);
      setWeeklyData(groupedData);
    } catch (error) {
      console.error('❌ WEIGHT LOAD DEBUG - Error loading weight data:', error);
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
    
    console.log('💾 WEIGHT SAVE DEBUG - Starting save:', {
      editingCell,
      weight,
      tempValue,
      clientId: client.id
    });
    
    if (isNaN(weight) || weight <= 0) {
      console.log('❌ WEIGHT SAVE DEBUG - Invalid weight:', weight);
      setEditingCell(null);
      return;
    }

    try {
      const date = getDateForWeekAndDay(week, day);
      console.log('💾 WEIGHT SAVE DEBUG - Calculated date:', date);
      
      const result = await logClientWeight(client.id, weight, date);
      console.log('💾 WEIGHT SAVE DEBUG - Database save result:', result);
      
      // Update local state
      setWeeklyData(prev => {
        const newData = {
          ...prev,
          [week]: {
            ...prev[week],
            [day]: { weight, notes: '' }
          }
        };
        console.log('💾 WEIGHT SAVE DEBUG - Updated weekly data:', newData);
        return newData;
      });
      
      setEditingCell(null);
      console.log('✅ WEIGHT SAVE DEBUG - Save completed successfully');
    } catch (error) {
      console.error('❌ WEIGHT SAVE DEBUG - Error saving weight:', error);
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

  // Helper functions for new components
  const getAllWeightEntries = () => {
    const entries: Array<{date: string, weight: number, weekNumber: number, dayKey: string}> = [];
    Object.keys(weeklyData).forEach(week => {
      const weekNum = parseInt(week);
      Object.keys(weeklyData[weekNum]).forEach(day => {
        const weight = weeklyData[weekNum][day]?.weight;
        if (weight !== undefined) {
          const date = getDateForWeekAndDay(weekNum, day);
          entries.push({
            date: date.toISOString().split('T')[0],
            weight,
            weekNumber: weekNum,
            dayKey: day
          });
        }
      });
    });
    return entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  };

  const getCurrentWeight = () => {
    const entries = getAllWeightEntries();
    return entries.length > 0 ? entries[entries.length - 1].weight : 0;
  };

  const getWeeklyChange = () => {
    const entries = getAllWeightEntries();
    if (entries.length < 2) return 0;
    const currentWeek = selectedWeek;
    const lastWeek = currentWeek - 1;
    
    const currentWeekEntries = entries.filter(e => e.weekNumber === currentWeek);
    const lastWeekEntries = entries.filter(e => e.weekNumber === lastWeek);
    
    if (currentWeekEntries.length === 0 || lastWeekEntries.length === 0) return 0;
    
    const currentAvg = currentWeekEntries.reduce((sum, e) => sum + e.weight, 0) / currentWeekEntries.length;
    const lastAvg = lastWeekEntries.reduce((sum, e) => sum + e.weight, 0) / lastWeekEntries.length;
    
    return currentAvg - lastAvg;
  };

  const getMonthlyChange = () => {
    const entries = getAllWeightEntries();
    if (entries.length < 2) return 0;
    
    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
    
    const recentEntries = entries.filter(e => new Date(e.date) >= oneMonthAgo);
    const oldEntries = entries.filter(e => new Date(e.date) < oneMonthAgo);
    
    if (recentEntries.length === 0 || oldEntries.length === 0) return 0;
    
    const recentAvg = recentEntries.reduce((sum, e) => sum + e.weight, 0) / recentEntries.length;
    const oldAvg = oldEntries.reduce((sum, e) => sum + e.weight, 0) / oldEntries.length;
    
    return recentAvg - oldAvg;
  };

  const getTotalEntries = () => {
    return getAllWeightEntries().length;
  };

  const getAverageWeight = () => {
    const entries = getAllWeightEntries();
    if (entries.length === 0) return 0;
    return entries.reduce((sum, e) => sum + e.weight, 0) / entries.length;
  };

  return (
    <div className="space-y-8">
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
                    : dayData?.weight
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
                    {dayData?.weight ? (
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
      {(() => {
        console.log('📊 WEIGHT CHART DEBUG - Weekly data:', weeklyData);
        console.log('📊 WEIGHT CHART DEBUG - Object keys:', Object.keys(weeklyData));
        console.log('📊 WEIGHT CHART DEBUG - Keys length:', Object.keys(weeklyData).length);
        
        const sortedWeeks = Object.keys(weeklyData)
          .map(w => parseInt(w))
          .sort((a, b) => a - b)
          .slice(-10); // Show last 10 weeks
        
        console.log('📊 WEIGHT CHART DEBUG - Sorted weeks:', sortedWeeks);
        
        const weights = sortedWeeks.map(w => {
          const avg = calculateWeekAverage(w);
          console.log(`📊 WEIGHT CHART DEBUG - Week ${w} average:`, avg);
          return avg;
        }).filter(w => w !== null) as number[];
        
        console.log('📊 WEIGHT CHART DEBUG - Weights array:', weights);
        console.log('📊 WEIGHT CHART DEBUG - Weights length:', weights.length);
        
        return Object.keys(weeklyData).length > 0 && (
          <div className="mt-8 bg-slate-700/30 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-lg font-semibold text-white">Weight Progress Line Chart</h4>
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
            
            {/* Debug Info */}
            <div className="mb-4 p-3 bg-slate-800/50 rounded text-xs text-slate-300">
              <div>Weekly Data Keys: {Object.keys(weeklyData).join(', ')}</div>
              <div>Sorted Weeks: {sortedWeeks.join(', ')}</div>
              <div>Weights: {weights.join(', ')}</div>
              <div>Chart Status: {weights.length === 0 ? 'No data' : weights.length === 1 ? 'Single point' : 'Multiple points'}</div>
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
                  // Real-time chart: Show as soon as there's at least one weight entry
                  if (weights.length === 0) {
                    console.log('📊 WEIGHT CHART DEBUG - No weight data yet');
                    return (
                      <text x="200" y="100" textAnchor="middle" className="text-slate-400">
                        Start logging weights to see your progress chart
                      </text>
                    );
                  }
                
                const minWeight = Math.min(...weights);
                const maxWeight = Math.max(...weights);
                // For single data point, create a reasonable range around it
                const weightRange = maxWeight - minWeight || (weights[0] * 0.1) || 1;
                
                const points = weights.map((weight, index) => {
                  // For single data point, center it; for multiple points, spread them out
                  const x = weights.length === 1 ? 200 : (index / Math.max(1, weights.length - 1)) * 360 + 20;
                  const y = 180 - ((weight - minWeight) / weightRange) * 160;
                  return { x, y, weight, week: sortedWeeks[index] };
                });
                
                // Only create line if there are multiple points
                const pathData = weights.length > 1 ? points.map((point, index) => 
                  `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`
                ).join(' ') : '';
                
                return (
                  <g>
                    {/* Y-axis labels */}
                    {(() => {
                      const yLabels = [];
                      const numLabels = 5;
                      for (let i = 0; i <= numLabels; i++) {
                        const weight = minWeight + (weightRange * i / numLabels);
                        const y = 180 - (i / numLabels) * 160;
                        yLabels.push(
                          <text
                            key={i}
                            x="10"
                            y={y + 4}
                            fontSize="10"
                            fill="#94a3b8"
                            className="font-medium"
                          >
                            {weight.toFixed(1)}
                          </text>
                        );
                      }
                      return yLabels;
                    })()}
                    
                    {/* Line - only show if there are multiple points */}
                    {weights.length > 1 && (
                      <path
                        d={pathData}
                        fill="none"
                        stroke="url(#lineGradient)"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    )}
                    
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
      );
      })()}

      {/* Ultra-Modern Weight Tracking Interface */}
      <div className="mt-8 space-y-8">
        {/* Weekly Overview */}
        <WeeklyWeightOverview 
          entries={getAllWeightEntries()} 
          currentWeek={selectedWeek} 
        />

        {/* Stats Cards */}
        <WeightStatsGrid
          currentWeight={getCurrentWeight()}
          weeklyChange={getWeeklyChange()}
          monthlyChange={getMonthlyChange()}
          totalEntries={getTotalEntries()}
          averageWeight={getAverageWeight()}
        />

        {/* Weight Progress Chart */}
        <UltraModernWeightChart entries={getAllWeightEntries()} />
      </div>
    </div>
  );
}
