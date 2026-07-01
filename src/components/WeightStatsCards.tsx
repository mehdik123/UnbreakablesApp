import React from 'react';
import { TrendingUp, TrendingDown, Minus, Target, Calendar, BarChart3 } from 'lucide-react';
import { useClientLocale } from '../contexts/ClientLocaleContext';

interface StatsCardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  unit?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ title, value, change, icon, unit }) => {
  const getChangeColor = () => {
    if (change === undefined || change === 0) return 'var(--txt-lo)';
    return change > 0 ? 'var(--red)' : 'var(--emerald)';
  };

  const getChangeIcon = () => {
    if (change === undefined || change === 0) return <Minus className="w-4 h-4" />;
    return change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  return (
    <div className="wt-stat-tile group relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="wt-stat-icon">{icon}</div>
        {change !== undefined && (
          <div
            className="flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-bold tnum"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: getChangeColor() }}
          >
            {getChangeIcon()}
            <span>{Math.abs(change).toFixed(1)}{unit}</span>
          </div>
        )}
      </div>

      <h3 className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>{title}</h3>
      <div className="wt-stat-val mt-1">
        {typeof value === 'number' ? value.toFixed(1) : value}
        {unit && <span className="text-sm ml-1" style={{ color: 'var(--txt-mid)' }}>{unit}</span>}
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
  const { t } = useClientLocale();
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatsCard
        title={t('wt.currentWeight')}
        value={currentWeight}
        icon={<Target className="w-5 h-5" style={{ color: 'var(--red)' }} />}
        unit="kg"
      />
      <StatsCard
        title={t('wt.weeklyChange')}
        value={Math.abs(weeklyChange)}
        change={weeklyChange}
        icon={<TrendingUp className="w-5 h-5" style={{ color: 'var(--blue)' }} />}
        unit="kg"
      />
      <StatsCard
        title={t('wt.monthlyChange')}
        value={Math.abs(monthlyChange)}
        change={monthlyChange}
        icon={<Calendar className="w-5 h-5" style={{ color: 'var(--emerald)' }} />}
        unit="kg"
      />
      <StatsCard
        title={t('wt.averageWeight')}
        value={averageWeight}
        icon={<BarChart3 className="w-5 h-5" style={{ color: 'var(--amber)' }} />}
        unit="kg"
      />
    </div>
  );
};
