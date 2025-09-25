import React from 'react';
import { format, startOfWeek, addDays } from 'date-fns';

interface WeightEntry {
  date: string;
  weight: number;
  weekNumber: number;
  dayKey: string;
}

interface WeeklyWeightOverviewProps {
  entries: WeightEntry[];
  currentWeek: number;
}

export const WeeklyWeightOverview: React.FC<WeeklyWeightOverviewProps> = ({ entries, currentWeek }) => {
  const getWeekDates = (weekNumber: number) => {
    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday start
    const weekOffset = (weekNumber - 1) * 7;
    const targetWeekStart = addDays(weekStart, weekOffset);
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(targetWeekStart, i);
      return {
        day: format(date, 'EEE').toUpperCase(),
        date: format(date, 'd'),
        fullDate: format(date, 'yyyy-MM-dd'),
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      };
    });
  };

  const weekDates = getWeekDates(currentWeek);
  
  const getWeightForDate = (date: string) => {
    return entries.find(entry => entry.date === date)?.weight;
  };

  const hasData = weekDates.some(day => getWeightForDate(day.fullDate) !== undefined);

  return (
    <div className="bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-white text-2xl font-bold mb-1">This Week</h3>
            <p className="text-white/60 text-sm">Quick weekly overview</p>
          </div>
          {hasData && (
            <div className="w-3 h-3 bg-[#dc1e3a] rounded-full animate-pulse"></div>
          )}
        </div>

        <div className="grid grid-cols-7 gap-3">
          {weekDates.map((day, index) => {
            const weight = getWeightForDate(day.fullDate);
            const hasWeight = weight !== undefined;
            
            return (
              <div
                key={index}
                className={`relative rounded-2xl p-4 transition-all duration-300 ${
                  hasWeight
                    ? 'bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 border-2 border-[#dc1e3a] shadow-lg shadow-[#dc1e3a]/20'
                    : day.isToday
                    ? 'bg-gradient-to-br from-blue-500/20 to-blue-500/10 border-2 border-blue-500'
                    : 'bg-gradient-to-br from-white/5 to-white/10 border border-white/20'
                }`}
              >
                <div className="text-center">
                  <div className={`text-xs font-semibold mb-2 ${
                    hasWeight ? 'text-white' : 'text-white/60'
                  }`}>
                    {day.day}
                  </div>
                  <div className={`text-lg font-bold mb-2 ${
                    hasWeight ? 'text-white' : 'text-white/80'
                  }`}>
                    {day.date}
                  </div>
                  <div className={`text-sm font-medium ${
                    hasWeight ? 'text-[#dc1e3a]' : 'text-white/40'
                  }`}>
                    {hasWeight ? `${weight.toFixed(1)}` : '--'}
                  </div>
                </div>
                
                {hasWeight && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#dc1e3a] rounded-full animate-pulse"></div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};



