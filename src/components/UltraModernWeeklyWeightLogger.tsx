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
import { useClientLocale } from '../contexts/ClientLocaleContext';

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

function formatLocalDate(date: Date): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export const UltraModernWeeklyWeightLogger: React.FC<UltraModernWeeklyWeightLoggerProps> = ({
  client,
  currentWeek: initialWeek,
  maxWeeks,
  isDark
}) => {
  const { t } = useClientLocale();
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
      setSaveError(t('wt.loadFailed'));
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
    return formatLocalDate(target);
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
      
      const dateString = getDateForWeekAndDay(editingCell.week, editingCell.day);
      

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
      navigator.vibrate?.(8);
      
      // Don't reload data immediately - the local state update should be sufficient
      // await loadWeightData();
    } catch (error) {
      setSaveError(t('wt.saveFailed'));
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
      setSaveError(t('wt.deleteWeightFailed'));
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
    <div className="wt-shell space-y-4">
      <div className="wt-summary">
        <div className="wt-summary-icon">
          <Scale className="w-[22px] h-[22px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-saira font-semibold text-[18px] truncate" style={{ color: 'var(--txt-hi)' }}>
            {t('nav.weight')}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
            {t('home.weightDesc')}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="font-saira font-bold text-[24px] leading-none tnum" style={{ color: 'var(--red)' }}>
            {getCurrentWeight() > 0 ? getCurrentWeight().toFixed(1) : '—'}
          </div>
          <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--txt-lo)' }}>
            kg
          </div>
        </div>
      </div>

      <div className="wt-panel">
        <div className="wt-tabs">
          <div className="wt-tab-group">
            <button
              type="button"
              onClick={() => setActiveTab('weight')}
              className={`wt-tab ${activeTab === 'weight' ? 'wt-tab--active' : ''}`}
            >
              <Scale className="w-4 h-4" />
              <span>{t('wt.weight')}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('measurements')}
              className={`wt-tab ${activeTab === 'measurements' ? 'wt-tab--active' : ''}`}
            >
              <Ruler className="w-4 h-4" />
              <span>{t('wt.measurements')}</span>
            </button>
          </div>

          <div className="wt-week-nav">
            <button
              type="button"
              onClick={() => setSelectedWeek(Math.max(1, selectedWeek - 1))}
              disabled={selectedWeek <= 1}
              className="wt-week-btn"
              aria-label="Previous week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="wt-week-pill">
              {selectedWeek} / {maxWeeks}
            </div>
            <button
              type="button"
              onClick={() => setSelectedWeek(Math.min(maxWeeks, selectedWeek + 1))}
              disabled={selectedWeek >= maxWeeks}
              className="wt-week-btn"
              aria-label="Next week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'weight' ? (
        <div className="space-y-4">
          <div className="wt-panel relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-saira font-semibold text-[18px]" style={{ color: 'var(--txt-hi)' }}>{t('wt.thisWeek')}</h3>
                <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
                  {editingCell ? t('wt.editingCell', { week: editingCell.week, day: editingCell.day }) : t('wt.clickToLog')}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--red)', borderTopColor: 'transparent' }} />
                )}
                <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: 'var(--red)' }} />
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {DAYS_OF_WEEK.map((day, dayIndex) => {
                const dayData = getCurrentWeekData()[day.key];
                const weight = dayData?.weight;
                const hasWeight = weight !== undefined;
                const isEditing = editingCell?.week === selectedWeek && editingCell?.day === day.key;
                
                return (
                  <div
                    key={day.key}
                    className={`wt-day-cell relative ${hasWeight ? 'wt-day-cell--filled' : ''}`}
                    onClick={() => handleCellClick(selectedWeek, day.key)}
                  >
                    {isEditing ? (
                      <input
                        type="number"
                        step="0.1"
                        inputMode="decimal"
                        value={tempValue}
                        onChange={(e) => setTempValue(e.target.value)}
                        className="wt-day-input touch-target"
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
                        <div className="text-[10px] font-semibold mb-1 uppercase tracking-wide" style={{ color: hasWeight ? 'var(--txt-hi)' : 'var(--txt-lo)' }}>
                          {t('wt.day', { n: dayIndex + 1 })}
                        </div>
                        <div className="text-[12px] font-bold tnum" style={{ color: hasWeight ? 'var(--red)' : 'var(--txt-lo)' }}>
                          {hasWeight ? `${weight.toFixed(1)}` : '--'}
                        </div>
                      </div>
                    )}
                    
                    {hasWeight && !isEditing && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleWeightDelete(selectedWeek, day.key);
                        }}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ background: 'var(--red)' }}
                        title={t('wt.deleteWeight')}
                      >
                        ×
                      </button>
                    )}
                    {hasWeight && isEditing && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse" style={{ background: 'var(--red)' }} />
                    )}
                  </div>
                );
              })}
            </div>
            
            {saveError && (
              <div className="wt-error">
                {saveError}
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
