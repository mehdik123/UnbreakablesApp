import React from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart, ReferenceLine } from 'recharts';
import { useClientLocale } from '../contexts/ClientLocaleContext';

export interface WeightChartEntry {
  label: string;
  weight: number;
  weekNumber?: number;
  dayKey?: string;
}

interface UltraModernWeightChartProps {
  entries: WeightChartEntry[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="rounded-xl px-3 py-2.5 shadow-xl max-w-[200px]"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hair)',
        }}
      >
        <p className="text-[12px] font-medium mb-0.5" style={{ color: 'var(--txt-mid)' }}>{label}</p>
        <p className="text-[17px] font-bold font-saira tnum flex items-center gap-1.5" style={{ color: 'var(--red)' }}>
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
          {payload[0].value.toFixed(1)} kg
        </p>
      </div>
    );
  }
  return null;
};

export const UltraModernWeightChart: React.FC<UltraModernWeightChartProps> = ({ entries }) => {
  const { t } = useClientLocale();
  const chartData = entries.map((entry) => ({
    label: entry.label,
    weight: entry.weight,
  }));

  const averageWeight =
    entries.length > 0
      ? entries.reduce((sum, entry) => sum + entry.weight, 0) / entries.length
      : 0;

  if (entries.length === 0) {
    return (
      <div className="wt-panel p-6 sm:p-8 text-center">
        <div
          className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(255,45,85,.1)', border: '1px solid rgba(255,45,85,.2)' }}
        >
          <div
            className="w-6 h-6 border-2 rounded-full animate-spin"
            style={{ borderColor: 'var(--red)', borderTopColor: 'transparent' }}
          />
        </div>
        <div className="font-saira font-semibold text-[15px] mb-1" style={{ color: 'var(--txt-hi)' }}>
          {t('wt.noData')}
        </div>
        <div className="text-[13px]" style={{ color: 'var(--txt-mid)' }}>{t('wt.startLogging')}</div>
      </div>
    );
  }

  return (
    <div className="wt-panel overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Header — stacks on narrow phones so badges are never clipped */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
          <div className="min-w-0">
            <h3 className="font-saira font-semibold text-[17px] sm:text-[18px]" style={{ color: 'var(--txt-hi)' }}>
              {t('wt.weightProgress')}
            </h3>
            <p className="text-[12px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>{t('wt.trackJourney')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: 'var(--red)' }} />
              {t('wt.entries', { n: entries.length })}
            </div>
            <div
              className="rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold whitespace-nowrap"
              style={{ background: 'rgba(255,45,85,.12)', border: '1px solid rgba(255,45,85,.25)', color: 'var(--red)' }}
            >
              {t('wt.avg', { n: averageWeight.toFixed(1) })}
            </div>
          </div>
        </div>

        <div className="h-52 sm:h-64 md:h-72 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff2d55" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#ff2d55" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="label"
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--txt-lo)', fontSize: 10, fontWeight: 500 }}
                interval="preserveStartEnd"
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: 'var(--txt-lo)', fontSize: 10, fontWeight: 500 }}
                domain={['dataMin - 2', 'dataMax + 2']}
                width={32}
                tickFormatter={(v) => `${v}`}
              />
              <ReferenceLine
                y={averageWeight}
                stroke="#ff2d55"
                strokeDasharray="6 6"
                strokeOpacity={0.5}
                strokeWidth={1.5}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke="#ff2d55"
                strokeWidth={2.5}
                fill="url(#weightGradient)"
                dot={{ fill: '#ff2d55', strokeWidth: 2, stroke: '#fff', r: 4 }}
                activeDot={{ r: 6, fill: '#ff2d55', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
