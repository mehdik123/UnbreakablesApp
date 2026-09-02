import React, { useMemo, useId } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import {
  buildDailyWeightChartPoints,
  buildWeeklyAverageChartPoints,
  getOverallAverageWeight,
  computeWeeklyWeightSummaries,
  getWeeklyAverageOverall,
  type WeightChartEntry,
} from '../utils/weightChartData';

export type { WeightChartEntry };

interface UltraModernWeightChartProps {
  entries: WeightChartEntry[];
}

const DAILY_COLOR = '#ff2d55';
const WEEKLY_AVG_COLOR = '#5b8cff';

interface WeightAreaChartProps {
  data: Array<{ label: string; [key: string]: string | number }>;
  dataKey: string;
  color: string;
  gradientId: string;
  tooltipLabel: string;
  heightClass?: string;
}

const WeightAreaChart = ({
  data,
  dataKey,
  color,
  gradientId,
  tooltipLabel,
  heightClass = 'h-52 sm:h-64 md:h-72',
}: WeightAreaChartProps) => (
  <div className={`${heightClass} -mx-1`}>
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
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
        <Tooltip
          content={({ active, payload, label }) => {
            if (!active || !payload?.length || payload[0]?.value == null) return null;
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
                <p
                  className="text-[16px] font-bold font-saira tnum flex items-center gap-1.5"
                  style={{ color }}
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                  {tooltipLabel}: {Number(payload[0].value).toFixed(1)} kg
                </p>
              </div>
            );
          }}
        />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ fill: color, strokeWidth: 2, stroke: '#fff', r: 4 }}
          activeDot={{ r: 6, fill: color, stroke: '#fff', strokeWidth: 2 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

interface ChartHeaderProps {
  title: string;
  subtitle: string;
  legendColor: string;
  legendLabel: string;
  badges: React.ReactNode;
}

const ChartHeader = ({ title, subtitle, legendColor, legendLabel, badges }: ChartHeaderProps) => (
  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-4">
    <div className="min-w-0">
      <h3 className="font-saira font-semibold text-[17px] sm:text-[18px]" style={{ color: 'var(--txt-hi)' }}>
        {title}
      </h3>
      <p className="text-[12px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>{subtitle}</p>
    </div>
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <div
        className="flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
      >
        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: legendColor }} />
        {legendLabel}
      </div>
      {badges}
    </div>
  </div>
);

export const UltraModernWeightChart: React.FC<UltraModernWeightChartProps> = ({ entries }) => {
  const { t } = useClientLocale();
  const dailyGradientId = useId().replace(/:/g, '');
  const weeklyGradientId = useId().replace(/:/g, '');

  const dailyData = useMemo(() => buildDailyWeightChartPoints(entries), [entries]);
  const weeklyData = useMemo(() => buildWeeklyAverageChartPoints(entries), [entries]);
  const overallAverage = useMemo(() => getOverallAverageWeight(entries), [entries]);
  const weeklySummaries = useMemo(() => computeWeeklyWeightSummaries(entries), [entries]);
  const weeklyOverall = useMemo(() => getWeeklyAverageOverall(weeklySummaries), [weeklySummaries]);

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
    <div className="space-y-4">
      <div className="wt-panel overflow-hidden">
        <div className="p-4 sm:p-5">
          <ChartHeader
            title={t('wt.weightProgress')}
            subtitle={t('wt.trackJourney')}
            legendColor={DAILY_COLOR}
            legendLabel={t('wt.legendDaily')}
            badges={
              <div
                className="rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap tnum"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-lo)' }}
              >
                {t('wt.overallAvg', { n: overallAverage.toFixed(1) })}
              </div>
            }
          />
          <WeightAreaChart
            data={dailyData}
            dataKey="weight"
            color={DAILY_COLOR}
            gradientId={dailyGradientId}
            tooltipLabel={t('wt.tooltipDaily')}
          />
        </div>
      </div>

      {weeklyData.length > 0 && (
        <div className="wt-panel overflow-hidden">
          <div className="p-4 sm:p-5">
            <ChartHeader
              title={t('wt.weeklyAvgProgress')}
              subtitle={t('wt.weeklyAvgSubtitle')}
              legendColor={WEEKLY_AVG_COLOR}
              legendLabel={t('wt.legendWeeklyAvg')}
              badges={
                <>
                  {latestWeekAvg != null && (
                    <div
                      className="rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-bold whitespace-nowrap tnum"
                      style={{
                        background: 'rgba(91,140,255,.12)',
                        border: '1px solid rgba(91,140,255,.28)',
                        color: WEEKLY_AVG_COLOR,
                      }}
                    >
                      {t('wt.weekAvgBadge', { n: latestWeekAvg.toFixed(1) })}
                    </div>
                  )}
                  <div
                    className="rounded-full px-2.5 py-1.5 text-[11px] sm:text-[12px] font-medium whitespace-nowrap tnum"
                    style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-lo)' }}
                  >
                    {t('wt.overallAvg', { n: weeklyOverall.toFixed(1) })}
                  </div>
                </>
              }
            />
            <WeightAreaChart
              data={weeklyData}
              dataKey="average"
              color={WEEKLY_AVG_COLOR}
              gradientId={weeklyGradientId}
              tooltipLabel={t('wt.tooltipWeeklyAvg')}
              heightClass="h-44 sm:h-56 md:h-64"
            />
          </div>
        </div>
      )}
    </div>
  );
};
