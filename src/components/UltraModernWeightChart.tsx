import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Area,
} from 'recharts';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import {
  buildWeightChartPoints,
  getOverallAverageWeight,
  computeWeeklyWeightSummaries,
  type WeightChartEntry,
  type WeightChartPoint,
} from '../utils/weightChartData';

export type { WeightChartEntry };

interface UltraModernWeightChartProps {
  entries: WeightChartEntry[];
}

const DAILY_COLOR = '#ff2d55';
const WEEKLY_AVG_COLOR = '#5b8cff';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ dataKey: string; value: number; payload?: WeightChartPoint }>;
  label?: string;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const CustomTooltip = ({ active, payload, label, t }: TooltipProps) => {
  if (!active || !payload?.length) return null;

  const point = payload[0]?.payload;
  const daily = payload.find((p) => p.dataKey === 'weight' && p.value != null);
  const weekly = payload.find((p) => p.dataKey === 'weekAverage' && p.value != null);

  return (
    <div
      className="rounded-xl px-3 py-2.5 shadow-xl max-w-[220px]"
      style={{
        background: 'var(--surface-1)',
        border: '1px solid var(--hair)',
      }}
    >
      <p className="text-[12px] font-medium mb-2" style={{ color: 'var(--txt-mid)' }}>
        {label}
      </p>
      {daily && !point?.isWeekAverageMarker && (
        <p
          className="text-[16px] font-bold font-saira tnum flex items-center gap-1.5 mb-1"
          style={{ color: DAILY_COLOR }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DAILY_COLOR }} />
          {t('wt.tooltipDaily')}: {Number(daily.value).toFixed(1)} kg
        </p>
      )}
      {weekly && (
        <p
          className="text-[13px] font-semibold font-saira tnum flex items-center gap-1.5"
          style={{ color: WEEKLY_AVG_COLOR }}
        >
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: WEEKLY_AVG_COLOR }} />
          {t('wt.tooltipWeeklyAvg')}: {Number(weekly.value).toFixed(1)} kg
        </p>
      )}
    </div>
  );
};

export const UltraModernWeightChart: React.FC<UltraModernWeightChartProps> = ({ entries }) => {
  const { t } = useClientLocale();

  const chartData = useMemo(() => buildWeightChartPoints(entries), [entries]);
  const overallAverage = useMemo(() => getOverallAverageWeight(entries), [entries]);
  const weeklySummaries = useMemo(() => computeWeeklyWeightSummaries(entries), [entries]);

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

  const latestWeekAvg =
    weeklySummaries.length > 0 ? weeklySummaries[weeklySummaries.length - 1].average : null;

  return (
    <div className="wt-panel overflow-hidden">
      <div className="p-4 sm:p-5">
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
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: DAILY_COLOR }} />
              {t('wt.legendDaily')}
            </div>
            <div
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: WEEKLY_AVG_COLOR }} />
              {t('wt.legendWeeklyAvg')}
            </div>
            {latestWeekAvg != null && (
              <div
                className="rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold whitespace-nowrap tnum"
                style={{ background: 'rgba(91,140,255,.12)', border: '1px solid rgba(91,140,255,.28)', color: WEEKLY_AVG_COLOR }}
              >
                {t('wt.weekAvgBadge', { n: latestWeekAvg.toFixed(1) })}
              </div>
            )}
            <div
              className="rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap tnum"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-lo)' }}
            >
              {t('wt.overallAvg', { n: overallAverage.toFixed(1) })}
            </div>
          </div>
        </div>

        <div className="h-52 sm:h-64 md:h-72 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={DAILY_COLOR} stopOpacity={0.35} />
                  <stop offset="100%" stopColor={DAILY_COLOR} stopOpacity={0} />
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
              <Tooltip content={<CustomTooltip t={t} />} />
              <Area
                type="monotone"
                dataKey="weight"
                stroke={DAILY_COLOR}
                strokeWidth={2.5}
                fill="url(#weightGradient)"
                connectNulls={false}
                dot={{ fill: DAILY_COLOR, strokeWidth: 2, stroke: '#fff', r: 4 }}
                activeDot={{ r: 6, fill: DAILY_COLOR, stroke: '#fff', strokeWidth: 2 }}
              />
              <Line
                type="monotone"
                dataKey="weekAverage"
                stroke={WEEKLY_AVG_COLOR}
                strokeWidth={2.75}
                dot={(props: { cx?: number; cy?: number; payload?: WeightChartPoint }) => {
                  if (!props.payload?.isWeekAverageMarker || props.payload.weekAverage == null) {
                    return <g key={`empty-${props.payload?.label}`} />;
                  }
                  return (
                    <circle
                      key={`avg-${props.payload.label}`}
                      cx={props.cx}
                      cy={props.cy}
                      r={6}
                      fill={WEEKLY_AVG_COLOR}
                      stroke="#fff"
                      strokeWidth={2}
                    />
                  );
                }}
                activeDot={{ r: 8, fill: WEEKLY_AVG_COLOR, stroke: '#fff', strokeWidth: 2 }}
                connectNulls
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
