import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { TrendingUp } from 'lucide-react';

interface WeightEntry {
  date: string;
  weight: number;
  weekNumber: number;
  dayKey: string;
}

interface UltraModernWeightChartProps {
  entries: WeightEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 backdrop-blur-xl border border-[#dc1e3a]/30 rounded-2xl p-5 shadow-2xl transform scale-105 transition-all duration-200">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#dc1e3a] rotate-45 border border-[#dc1e3a]/30"></div>
        <p className="text-white text-sm font-medium">
          {format(new Date(label), 'MMM dd, yyyy')}
        </p>
        <p className="text-[#dc1e3a] text-xl font-bold flex items-center">
          <span className="w-3 h-3 bg-[#dc1e3a] rounded-full mr-2 animate-pulse"></span>
          {payload[0].value.toFixed(1)} kg
        </p>
      </div>
    );
  }
  return null;
};

export const UltraModernWeightChart: React.FC<UltraModernWeightChartProps> = ({ entries }) => {
  const chartData = entries.map(entry => ({
    date: entry.date,
    weight: entry.weight,
    timestamp: new Date(entry.date).getTime(),
  }));

  const averageWeight = entries.length > 0 
    ? entries.reduce((sum, entry) => sum + entry.weight, 0) / entries.length 
    : 0;

  if (entries.length === 0) {
    return (
      <div className="bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 animate-pulse"></div>
        <div className="relative z-10">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-full flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[#dc1e3a]/40 border-t-[#dc1e3a] rounded-full animate-spin"></div>
          </div>
          <div className="text-white/80 text-xl font-semibold mb-2">No data available</div>
          <div className="text-white/50 text-base">Start logging your weight to see beautiful progress charts</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:border-[#dc1e3a]/30 transition-all duration-700 relative overflow-hidden group">
      <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-white text-2xl font-bold mb-1">Weight Progress</h3>
            <p className="text-white/60 text-sm">Track your fitness journey</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
              <div className="w-3 h-3 bg-[#dc1e3a] rounded-full animate-pulse"></div>
              <span className="text-white/80 text-sm font-medium">{entries.length} entries</span>
            </div>
            <div className="flex items-center space-x-2 bg-[#dc1e3a]/20 rounded-full px-4 py-2">
              <span className="text-[#dc1e3a] text-sm font-bold">Avg: {averageWeight.toFixed(1)}kg</span>
            </div>
          </div>
        </div>
      
        <div className="h-96 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#dc1e3a" stopOpacity={0.4} />
                  <stop offset="50%" stopColor="#dc1e3a" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#dc1e3a" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#dc1e3a" />
                  <stop offset="50%" stopColor="#ff1744" />
                  <stop offset="100%" stopColor="#dc1e3a" />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#ffffff80', fontSize: 13, fontWeight: 500 }}
                tickFormatter={(value) => format(new Date(value), 'MMM dd')}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#ffffff80', fontSize: 13, fontWeight: 500 }}
                domain={['dataMin - 2', 'dataMax + 2']}
              />
              <ReferenceLine 
                y={averageWeight} 
                stroke="#dc1e3a" 
                strokeDasharray="8 8" 
                strokeOpacity={0.6}
                strokeWidth={2}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="url(#strokeGradient)"
                strokeWidth={4}
                fill="url(#weightGradient)"
                dot={{ fill: '#dc1e3a', strokeWidth: 3, stroke: '#ffffff', r: 5 }}
                activeDot={{ r: 8, fill: '#dc1e3a', stroke: '#ffffff', strokeWidth: 3, filter: 'drop-shadow(0 0 8px #dc1e3a)' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};





