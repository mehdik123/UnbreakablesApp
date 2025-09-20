import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, Dumbbell } from 'lucide-react';

interface MuscleVolumeData {
  week: number;
  [muscleGroup: string]: number | string;
}

interface IndividualMuscleVolumeChartProps {
  data: MuscleVolumeData[];
  muscleGroup: string;
  color: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 backdrop-blur-xl border border-[#dc1e3a]/30 rounded-2xl p-4 shadow-2xl transform scale-105 transition-all duration-200">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#dc1e3a] rotate-45 border border-[#dc1e3a]/30"></div>
        <p className="text-white text-sm font-medium mb-2">
          Week {label}
        </p>
        <p className="text-[#dc1e3a] text-xl font-bold flex items-center">
          <span className="w-3 h-3 bg-[#dc1e3a] rounded-full mr-2 animate-pulse"></span>
          {payload[0].value.toLocaleString()} kg
        </p>
      </div>
    );
  }
  return null;
};

export const IndividualMuscleVolumeChart: React.FC<IndividualMuscleVolumeChartProps> = ({ 
  data, 
  muscleGroup, 
  color 
}) => {
  const chartData = data.map(week => ({
    week: week.week,
    volume: week[muscleGroup] as number || 0
  }));

  const totalVolume = chartData.reduce((sum, week) => sum + week.volume, 0);
  const averageVolume = chartData.length > 0 ? totalVolume / chartData.length : 0;
  const maxVolume = Math.max(...chartData.map(week => week.volume));

  // Calculate trend
  const firstWeekVolume = chartData[0]?.volume || 0;
  const lastWeekVolume = chartData[chartData.length - 1]?.volume || 0;
  const trend = firstWeekVolume > 0 ? ((lastWeekVolume - firstWeekVolume) / firstWeekVolume) * 100 : 0;

  if (chartData.length === 0 || totalVolume === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 animate-pulse"></div>
        <div className="relative z-10">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-gray-600/30">
            <Dumbbell className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2 capitalize">{muscleGroup}</h3>
          <p className="text-gray-400 text-sm">No volume data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#dc1e3a]/10 to-transparent rounded-full blur-2xl"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div 
              className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg border"
              style={{ 
                background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                borderColor: `${color}30`
              }}
            >
              <Activity className="w-5 h-5" style={{ color: color }} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white capitalize">{muscleGroup}</h3>
              <p className="text-gray-400 text-sm">Volume progression</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {averageVolume.toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs">Avg Volume (kg)</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-48 mb-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{
                top: 10,
                right: 10,
                left: 10,
                bottom: 10,
              }}
            >
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => `W${value}`}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="volume"
                stroke={color}
                strokeWidth={3}
                fill={`url(#gradient-${muscleGroup})`}
                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
              />
              <defs>
                <linearGradient id={`gradient-${muscleGroup}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0.05}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-xl p-3 border border-gray-600/30">
            <div className={`text-sm font-bold flex items-center space-x-1 ${
              trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-gray-400'
            }`}>
              <TrendingUp className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
              <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
            </div>
            <div className="text-gray-400 text-xs">Trend</div>
          </div>
        </div>
      </div>
    </div>
  );
};
