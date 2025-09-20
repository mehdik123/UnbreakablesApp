import React from 'react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell, Legend } from 'recharts';
import { Dumbbell, TrendingUp, Activity } from 'lucide-react';

interface MuscleVolumeData {
  week: number;
  [muscleGroup: string]: number | string;
}

interface UltraModernMuscleVolumeChartProps {
  data: MuscleVolumeData[];
  muscleGroups: string[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 backdrop-blur-xl border border-[#dc1e3a]/30 rounded-2xl p-5 shadow-2xl transform scale-105 transition-all duration-200">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#dc1e3a] rotate-45 border border-[#dc1e3a]/30"></div>
        <p className="text-white text-sm font-medium mb-3">
          Week {label}
        </p>
        <div className="space-y-2">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              ></div>
              <span className="text-white text-sm font-medium">{entry.dataKey}:</span>
              <span className="text-[#dc1e3a] text-sm font-bold">
                {entry.value.toLocaleString()} kg
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

const COLORS = [
  '#dc1e3a', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red-500
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
];

export const UltraModernMuscleVolumeChart: React.FC<UltraModernMuscleVolumeChartProps> = ({ 
  data, 
  muscleGroups 
}) => {
  const totalVolume = data.reduce((sum, week) => {
    return sum + muscleGroups.reduce((weekSum, muscle) => {
      return weekSum + (week[muscle] as number || 0);
    }, 0);
  }, 0);

  const averageVolume = data.length > 0 ? totalVolume / data.length : 0;

  if (data.length === 0) {
    return (
      <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 animate-pulse"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-[#dc1e3a]/30">
            <Dumbbell className="w-10 h-10 text-[#dc1e3a]" />
          </div>
          <h3 className="text-xl font-bold text-white mb-3">No Volume Data</h3>
          <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
            Complete some workouts to see your muscle volume progress over time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 animate-pulse"></div>
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#dc1e3a]/10 to-transparent rounded-full blur-3xl"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
              <Activity className="w-6 h-6 text-[#dc1e3a]" />
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Muscle Volume Progress</h3>
              <p className="text-gray-400 text-sm sm:text-base">Weekly training volume by muscle group</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-bold text-[#dc1e3a]">
              {averageVolume.toLocaleString()}
            </div>
            <div className="text-gray-400 text-xs sm:text-sm">Avg Volume (kg)</div>
          </div>
        </div>

        {/* Chart */}
        <div className="h-80 sm:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 20,
              }}
            >
              <XAxis 
                dataKey="week" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `Week ${value}`}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 500 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ 
                  paddingTop: '20px',
                  fontSize: '12px',
                  color: '#9ca3af'
                }}
              />
              {muscleGroups.map((muscle, index) => (
                <Bar
                  key={muscle}
                  dataKey={muscle}
                  stackId="volume"
                  fill={COLORS[index % COLORS.length]}
                  radius={[0, 0, 4, 4]}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={1}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Week Status Indicator */}
        <div className="mt-4 p-4 bg-gradient-to-r from-gray-700/30 to-gray-800/30 rounded-2xl border border-gray-600/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-gray-300">Unlocked weeks show volume</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
              <span className="text-gray-400">Locked weeks show 0</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
          <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-lg flex items-center justify-center border border-[#dc1e3a]/30">
                <TrendingUp className="w-4 h-4 text-[#dc1e3a]" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{totalVolume.toLocaleString()}</div>
                <div className="text-gray-400 text-xs">Total Volume</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Dumbbell className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{muscleGroups.length}</div>
                <div className="text-gray-400 text-xs">Muscle Groups</div>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-gray-700/50 to-gray-800/50 rounded-2xl p-4 border border-gray-600/30">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="text-lg font-bold text-white">{data.length}</div>
                <div className="text-gray-400 text-xs">Weeks Tracked</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
