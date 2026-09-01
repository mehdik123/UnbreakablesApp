import React, { useEffect, useMemo } from 'react';
import {
  X,
  Unlock,
  Flame,
  Dumbbell,
  Flag,
  Trophy,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import type { ClientMilestone } from '../utils/clientMilestones';

interface ClientMilestoneSheetProps {
  milestone: ClientMilestone;
  name: string;
  isRtl: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onDismiss: () => void;
  onAction?: () => void;
}

const ICONS = {
  week_unlocked: Unlock,
  weight_streak_7: Flame,
  first_workout_week: Dumbbell,
  halfway_program: Flag,
  week_complete: Trophy,
} as const;

const ICON_STYLES: Record<
  ClientMilestone['kind'],
  { bg: string; color: string }
> = {
  week_unlocked: { bg: 'rgba(91,140,255,.14)', color: 'var(--blue)' },
  weight_streak_7: { bg: 'rgba(255,138,92,.14)', color: '#ff8a5c' },
  first_workout_week: { bg: 'rgba(255,45,85,.14)', color: 'var(--red)' },
  halfway_program: { bg: 'rgba(168,85,247,.14)', color: '#a855f7' },
  week_complete: { bg: 'rgba(52,211,153,.14)', color: 'var(--emerald)' },
};

export const ClientMilestoneSheet: React.FC<ClientMilestoneSheetProps> = ({
  milestone,
  name,
  isRtl,
  t,
  onDismiss,
  onAction,
}) => {
  const Icon = ICONS[milestone.kind];
  const iconStyle = ICON_STYLES[milestone.kind];
  const Fwd = isRtl ? ChevronLeft : ChevronRight;

  const titleKey = `milestone.${milestone.kind}.title`;
  const bodyKey = `milestone.${milestone.kind}.body`;
  const quoteKey =
    milestone.kind === 'week_unlocked' && milestone.quoteIndex != null
      ? `milestone.week_unlocked.quote${milestone.quoteIndex}`
      : null;

  const vars = useMemo(
    () => ({
      name,
      week: milestone.week ?? 0,
      totalWeeks: milestone.totalWeeks ?? 0,
      days: milestone.streakDays ?? 7,
    }),
    [name, milestone]
  );

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      navigator.vibrate?.(12);
    }
  }, []);

  const showCta = milestone.kind === 'week_unlocked' && !!onAction;

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 milestone-sheet-backdrop"
      style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-title"
      onClick={onDismiss}
    >
      <div
        className="w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl milestone-sheet-panel"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--txt-lo)' }}>
            {t('milestone.kicker')}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            className="w-10 h-10 rounded-xl flex items-center justify-center active:scale-90 transition-transform touch-manipulation"
            style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
            aria-label={t('milestone.dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-5 pb-2 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5 milestone-sheet-icon"
            style={{ background: iconStyle.bg }}
          >
            <Icon className="w-8 h-8" style={{ color: iconStyle.color }} />
          </div>
          <h3
            id="milestone-title"
            className="font-saira text-[22px] font-extrabold italic mb-2 leading-tight"
            style={{ color: 'var(--txt-hi)' }}
          >
            {t(titleKey, vars)}
          </h3>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {t(bodyKey, vars)}
          </p>
          {quoteKey ? (
            <p
              className="text-[13px] leading-relaxed mt-3 pt-3 italic"
              style={{
                color: 'var(--txt-mid)',
                borderTop: '1px solid var(--hair)',
              }}
            >
              “{t(quoteKey)}”
            </p>
          ) : null}
        </div>

        <div className="flex items-center gap-2 px-4 pb-4 pt-3">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 h-11 rounded-[14px] text-[13px] font-semibold active:scale-95 transition-transform shrink-0 touch-manipulation"
            style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
          >
            {t('milestone.dismiss')}
          </button>

          {showCta ? (
            <button
              type="button"
              onClick={() => {
                onAction?.();
                onDismiss();
              }}
              className="flex-1 h-11 rounded-[14px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform touch-manipulation"
              style={{ background: 'var(--grad-red)', boxShadow: '0 12px 28px -10px rgba(255,45,85,.6)' }}
            >
              {t('milestone.ctaWorkout')}
              <Fwd className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="flex-1 h-11 rounded-[14px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform touch-manipulation"
              style={{ background: 'var(--grad-red)', boxShadow: '0 12px 28px -10px rgba(255,45,85,.6)' }}
            >
              {t('milestone.nice')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientMilestoneSheet;
