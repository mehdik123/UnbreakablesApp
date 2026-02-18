import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Scale,
  Ruler
} from 'lucide-react';
import { WeightEntry, Client } from '../types';
import { logClientWeight, getClientWeightLogs, deleteClientWeight } from '../lib/progressTracking';
import { UltraModernWeightChart } from './UltraModernWeightChart';
import { WeightStatsGrid } from './WeightStatsCards';
import { WeeklyWeightOverview } from './WeeklyWeightOverview';
import { BodyMeasurementsTab } from './BodyMeasurementsTab';

interface UltraModernWeeklyWeightLoggerProps {
  client: Client;
  currentWeek: number;
  maxWeeks: number;
  isDark: boolean;
}

// Day 1 to Day 7 per week — no calendar dates
const DAYS_OF_WEEK = [
  { key: 'day1', label: 'Day 1' },
  { key: 'day2', label: 'Day 2' },
  { key: 'day3', label: 'Day 3' },
  { key: 'day4', label: 'Day 4' },
  { key: 'day5', label: 'Day 5' },
  { key: 'day6', label: 'Day 6' },
  { key: 'day7', label: 'Day 7' }
];

export const UltraModernWeeklyWeightLogger: React.FC<UltraModernWeeklyWeightLoggerProps> = ({
  client,
  currentWeek: initialWeek,
  maxWeeks,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'weight' | 'measurements'>('weight');
  const [selectedWeek, setSelectedWeek] = useState(initialWeek);
  const [weeklyData, setWeeklyData] = useState<Record<number, Record<string, WeightEntry>>>({});
  const [editingCell, setEditingCell] = useState<{week: number, day: string} | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Load weight data
  useEffect(() => {
    loadWeightData();
  }, [client.id, selectedWeek]);

  const loadWeightData = async () => {
    try {
      setIsLoading(true);
      setSaveError(null);
      
      const data = await getClientWeightLogs(client.id);
      const organizedData: Record<number, Record<string, WeightEntry>> = {};
      const startDate = client.startDate ? new Date(client.startDate) : null;
      const dayKeysByIndex = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
      
      if (startDate) {
        data.forEach(entry => {
          const date = new Date(entry.date);
          const startMs = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()).getTime();
          const dateMs = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
          const daysSinceStart = Math.floor((dateMs - startMs) / (1000 * 60 * 60 * 24));
          const weekIndex = Math.floor(daysSinceStart / 7);
          const dayIndex = ((daysSinceStart % 7) + 7) % 7;
          const weekNumber = Math.min(maxWeeks, Math.max(1, weekIndex + 1));
          const dayKey = dayKeysByIndex[dayIndex];
          if (!organizedData[weekNumber]) organizedData[weekNumber] = {};
          organizedData[weekNumber][dayKey] = {
            id: entry.id,
            clientId: client.id,
            weight: entry.weight,
            date: entry.date,
            weekNumber,
            dayKey,
            notes: entry.notes
          };
        });
      } else {
        // No startDate: assign by entry order — first 7 = week 1 day 1..7, next 7 = week 2 day 1..7, etc.
        const sorted = [...data].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        sorted.forEach((entry, i) => {
          const weekNumber = Math.min(maxWeeks, Math.floor(i / 7) + 1);
          const dayKey = dayKeysByIndex[i % 7];
          if (!organizedData[weekNumber]) organizedData[weekNumber] = {};
          organizedData[weekNumber][dayKey] = {
            id: entry.id,
            clientId: client.id,
            weight: entry.weight,
            date: entry.date,
            weekNumber,
            dayKey,
            notes: entry.notes
          };
        });
      }

      setWeeklyData(organizedData);
    } catch (error) {
      setSaveError('Failed to load weight data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Produces a stable date for DB save only (Week 1 Day 1..7, Week 2 Day 1..7, etc.) — no current date
  const getDateForWeekAndDay = (weekNumber: number, dayKey: string) => {
    const dayMap: { [key: string]: number } = {
      day1: 0, day2: 1, day3: 2, day4: 3, day5: 4, day6: 5, day7: 6
    };
    const dayIndex = dayMap[dayKey] ?? 0;
    const base = client.startDate ? new Date(client.startDate) : new Date(2020, 0, 1);
    const target = new Date(base.getFullYear(), base.getMonth(), base.getDate());
    target.setDate(target.getDate() + (weekNumber - 1) * 7 + dayIndex);
    return target;
  };

  const getCurrentWeekData = () => {
    return weeklyData[selectedWeek] || {};
  };

  const handleCellClick = (week: number, day: string) => {
    const dayData = weeklyData[week]?.[day];
    setEditingCell({ week, day });
    setTempValue(dayData?.weight?.toString() || '');
  };

  const handleCellSave = async () => {
    if (!editingCell || !tempValue) {
      setEditingCell(null);
      setTempValue('');
      return;
    }

    const weight = parseFloat(tempValue);
    if (isNaN(weight) || weight <= 0) {
      setEditingCell(null);
      setTempValue('');
      return;
    }

    try {
      setIsLoading(true);
      setSaveError(null);
      
      const date = getDateForWeekAndDay(editingCell.week, editingCell.day);
      
      const dateString = date.toISOString().split('T')[0];
      

      const savedData = await logClientWeight({
        clientId: client.id,
        weight,
        date: dateString,
        weekNumber: editingCell.week,
        dayKey: editingCell.day
      });



      // Update local state with the saved data
      setWeeklyData(prev => {
        const newData = {
          ...prev,
          [editingCell.week]: {
            ...prev[editingCell.week],
            [editingCell.day]: {
              id: savedData.id,
              clientId: client.id,
              weight,
              date: dateString,
              weekNumber: editingCell.week,
              dayKey: editingCell.day,
              notes: savedData.notes
            }
          }
        };
        



        
        return newData;
      });

      setEditingCell(null);
      setTempValue('');
      
      // Don't reload data immediately - the local state update should be sufficient
      // await loadWeightData();
    } catch (error) {
      setSaveError('Failed to save weight. Please try again.');
      setEditingCell(null);
      setTempValue('');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setTempValue('');
  };

  const handleWeightDelete = async (week: number, day: string) => {
    const dayData = weeklyData[week]?.[day];
    if (!dayData?.id) return;

    try {
      setIsLoading(true);
      setSaveError(null);
      
      // Delete from database
      await deleteClientWeight(dayData.id);
      
      // Update local state
      setWeeklyData(prev => {
        const newData = { ...prev };
        if (newData[week]) {
          const weekData = { ...newData[week] };
          delete weekData[day];
          newData[week] = weekData;
        }
        return newData;
      });
      
    } catch (error) {
      setSaveError('Failed to delete weight. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Chart data in order: W1 D1, W1 D2, … W1 D7, W2 D1, … — only slots that have data
  const getAllWeightEntries = () => {
    const dayOrder = ['day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7'];
    const entries: Array<{ label: string; weight: number; weekNumber: number; dayKey: string }> = [];
    for (let w = 1; w <= maxWeeks; w++) {
      const weekData = weeklyData[w];
      if (!weekData) continue;
      for (let d = 0; d < 7; d++) {
        const dayKey = dayOrder[d];
        const entry = weekData[dayKey];
        if (entry?.weight !== undefined) {
          entries.push({
            label: `W${w} D${d + 1}`,
            weight: entry.weight,
            weekNumber: w,
            dayKey
          });
        }
      }
    }
    return entries;
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
    const recentWeeks = Math.max(1, maxWeeks - 3);
    const recentEntries = entries.filter((e) => e.weekNumber >= recentWeeks);
    const oldEntries = entries.filter((e) => e.weekNumber < recentWeeks);
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
    <div className="space-y-4 md:space-y-8">
      {/* Header with Tabs and Week Navigation */}
      <div className="bg-gray-900 backdrop-blur-xl border border-gray-700 rounded-3xl p-4 md:p-6">
        {/* Tabs */}
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('weight')}
              className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === 'weight'
                  ? 'bg-[#dc1e3a] text-white shadow-lg shadow-[#dc1e3a]/30'
                  : 'bg-gray-800 text-white/60 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Scale className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-base">Weight</span>
            </button>
            <button
              onClick={() => setActiveTab('measurements')}
              className={`flex items-center space-x-2 px-4 md:px-6 py-2 md:py-3 rounded-xl md:rounded-2xl font-semibold transition-all duration-300 ${
                activeTab === 'measurements'
                  ? 'bg-[#dc1e3a] text-white shadow-lg shadow-[#dc1e3a]/30'
                  : 'bg-gray-800 text-white/60 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <Ruler className="w-4 h-4 md:w-5 md:h-5" />
              <span className="text-xs md:text-base">Measurements</span>
            </button>
          </div>
          
          {/* Week Navigation - Ultra Modern */}
          <div className="flex items-center gap-1">
            {/* Previous Week Button */}
            <button
              onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
              disabled={selectedWeek <= 1}
              className="group relative w-7 h-7 rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700 transition-all duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-tr from-[#dc1e3a]/0 via-[#dc1e3a]/0 to-[#dc1e3a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <ChevronLeft className="w-3.5 h-3.5 text-white group-hover:text-[#dc1e3a] transition-colors duration-300" />
              </div>
            </button>
            
            {/* Week Display */}
            <div className="relative px-3 py-1 overflow-hidden rounded-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/20 via-[#dc1e3a]/30 to-[#dc1e3a]/20"></div>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent"></div>
              <div className="relative flex items-center gap-0.5 text-xs font-bold">
                <span className="text-white">{selectedWeek}</span>
                <span className="text-white/40">/</span>
                <span className="text-white/60">{maxWeeks}</span>
              </div>
            </div>
            
            {/* Next Week Button */}
            <button
              onClick={() => setSelectedWeek(Math.min(maxWeeks, selectedWeek + 1))}
              disabled={selectedWeek >= maxWeeks}
              className="group relative w-7 h-7 rounded-lg overflow-hidden transition-all duration-300 disabled:opacity-30 disabled:cursor-not-allowed hover:scale-110 active:scale-95"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gray-700 to-gray-800 group-hover:from-gray-600 group-hover:to-gray-700 transition-all duration-300"></div>
              <div className="absolute inset-0 bg-gradient-to-tl from-[#dc1e3a]/0 via-[#dc1e3a]/0 to-[#dc1e3a]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative w-full h-full flex items-center justify-center">
                <ChevronRight className="w-3.5 h-3.5 text-white group-hover:text-[#dc1e3a] transition-colors duration-300" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'weight' ? (
        /* Ultra-Modern Weight Tracking Interface */
        <div className="space-y-4 md:space-y-8">
          {/* Weekly Overview with Interactive Cards */}
          <div className="bg-gray-900 backdrop-blur-xl border border-gray-700 rounded-3xl p-4 md:p-8 relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 md:mb-8">
              <div>
                <h3 className="text-lg md:text-2xl font-bold text-white mb-1">This Week</h3>
                <p className="text-white/60 text-xs md:text-sm">
                  {editingCell ? `Week ${editingCell.week} · ${editingCell.day}` : 'Click a slot to log weight'}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {isLoading && (
                  <div className="w-4 h-4 border-2 border-[#dc1e3a] border-t-transparent rounded-full animate-spin"></div>
                )}
                <div className="w-2 h-2 md:w-3 md:h-3 bg-[#dc1e3a] rounded-full animate-pulse"></div>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 md:gap-3">
              {DAYS_OF_WEEK.map((day) => {
                const dayData = getCurrentWeekData()[day.key];
                const weight = dayData?.weight;
                const hasWeight = weight !== undefined;
                const isEditing = editingCell?.week === selectedWeek && editingCell?.day === day.key;
                
                return (
                  <div
                    key={day.key}
                    className={`relative rounded-xl p-2 md:p-4 transition-all duration-300 cursor-pointer ${
                      hasWeight
                        ? 'bg-gray-800 border-2 border-[#dc1e3a] shadow-lg shadow-[#dc1e3a]/20'
                        : 'bg-gray-800 border border-gray-600'
                    }`}
                    onClick={() => handleCellClick(selectedWeek, day.key)}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="w-full bg-transparent text-white text-center text-sm md:text-lg font-bold focus:outline-none touch-target"
                        placeholder="kg"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCellSave();
                          if (e.key === 'Escape') handleCellCancel();
                        }}
                        onBlur={handleCellSave}
                      />
                    ) : (
                      <div className="text-center">
                        <div className={`text-xs font-semibold mb-1 md:mb-2 ${
                          hasWeight ? 'text-white' : 'text-white/60'
                        }`}>
                          {day.label}
                        </div>
                        <div className={`text-xs md:text-sm font-medium ${
                          hasWeight ? 'text-[#dc1e3a]' : 'text-white/40'
                        }`}>
                          {hasWeight ? `${weight.toFixed(1)} kg` : '--'}
                        </div>
                      </div>
                    )}
                    
                    {hasWeight && !isEditing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeightDelete(selectedWeek, day.key);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold transition-colors"
                        title="Delete weight"
                      >
                        ×
                      </button>
                    )}
                    {hasWeight && isEditing && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#dc1e3a] rounded-full animate-pulse"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Error Display */}
            {saveError && (
              <div className="mt-4 p-3 bg-red-900/20 border border-red-500/50 rounded-lg">
                <p className="text-red-400 text-sm">{saveError}</p>
              </div>
            )}
          </div>
        </div>

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
      ) : (
        /* Body Measurements Tab */
        <BodyMeasurementsTab
          client={client}
          currentWeek={selectedWeek}
          maxWeeks={maxWeeks}
        />
      )}
    </div>
  );
};
