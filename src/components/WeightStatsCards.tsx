import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, BarChart3 } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  unit?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon, unit }) => {
  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'text-white/60';
    return change > 0 ? 'text-red-400' : 'text-green-400';
  };

  const getChangeIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-4 h-4" />;
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="bg-gray-800 backdrop-blur-xl border border-gray-700 rounded-2xl p-4 md:p-6 hover:border-[#dc1e3a]/40 hover:shadow-2xl hover:shadow-[#dc1e3a]/20 transition-all duration-700 group relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#dc1e3a]/10 via-transparent to-[#dc1e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="p-3 md:p-4 bg-gray-700 rounded-xl group-hover:bg-gray-600 group-hover:scale-110 transition-all duration-500 shadow-lg">
            {icon}
          </div>
          {change !== undefined && (
            <div className={`flex items-center space-x-2 px-2 md:px-3 py-1 md:py-2 rounded-full bg-gray-700 backdrop-blur-sm ${getChangeColor()}`}>
              {getChangeIcon()}
              <span className="text-sm font-bold">
                {Math.abs(change).toFixed(1)}{unit}
              </span>
            </div>
          )}
        </div>
        
        <div className="space-y-1 md:space-y-2">
          <h3 className="text-white/80 text-xs md:text-sm font-semibold uppercase tracking-wider">{title}</h3>
          <div className="text-white text-2xl md:text-3xl font-bold group-hover:text-[#dc1e3a] transition-colors duration-500">
            {typeof value === 'number' ? value.toFixed(1) : value}
            {unit && <span className="text-lg md:text-xl text-white/70 ml-1 group-hover:text-[#dc1e3a]/80 transition-colors duration-500">{unit}</span>}
          </div>
        </div>
      </div>
    </div>
  );
};

interface WeightStatsGridProps {
  currentWeight: number;
  weeklyChange: number;
  monthlyChange: number;
  totalEntries: number;
  averageWeight: number;
}

export const WeightStatsGrid: React.FC<WeightStatsGridProps> = ({
  currentWeight,
  weeklyChange,
  monthlyChange,
  totalEntries,
  averageWeight,
}) => {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      <StatsCard
        title="Current Weight"
        value={currentWeight}
        icon={<Target className="w-7 h-7 text-[#dc1e3a] drop-shadow-lg" />}
        unit="kg"
      />
      <StatsCard
        title="Weekly Change"
        value={Math.abs(weeklyChange)}
        change={weeklyChange}
        icon={<TrendingUp className="w-7 h-7 text-[#dc1e3a] drop-shadow-lg" />}
        unit="kg"
      />
      <StatsCard
        title="Monthly Change"
        value={Math.abs(monthlyChange)}
        change={monthlyChange}
        icon={<Calendar className="w-7 h-7 text-[#dc1e3a] drop-shadow-lg" />}
        unit="kg"
      />
      <StatsCard
        title="Average Weight"
        value={averageWeight}
        icon={<BarChart3 className="w-7 h-7 text-[#dc1e3a] drop-shadow-lg" />}
        unit="kg"
      />
    </div>
  );
};
