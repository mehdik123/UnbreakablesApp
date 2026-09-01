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
  Sparkles,
  Star,
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

type Accent = 'red' | 'blue' | 'orange' | 'violet' | 'green';

const ACCENT_BY_KIND: Record<ClientMilestone['kind'], Accent> = {
  week_unlocked: 'blue',
  weight_streak_7: 'orange',
  first_workout_week: 'red',
  halfway_program: 'violet',
  week_complete: 'green',
};

const CONFETTI = [
  { left: '8%', delay: '0s', color: '#ff2d55', size: 7 },
  { left: '18%', delay: '0.12s', color: '#ff8a5c', size: 5 },
  { left: '32%', delay: '0.22s', color: '#5b8cff', size: 6 },
  { left: '48%', delay: '0.08s', color: '#34d399', size: 5 },
  { left: '62%', delay: '0.18s', color: '#a855f7', size: 7 },
  { left: '76%', delay: '0.04s', color: '#ff2d55', size: 5 },
  { left: '88%', delay: '0.28s', color: '#ff8a5c', size: 6 },
  { left: '94%', delay: '0.14s', color: '#5b8cff', size: 4 },
];

export const ClientMilestoneSheet: React.FC<ClientMilestoneSheetProps> = ({
  milestone,
  name,
  isRtl,
  t,
  onDismiss,
  onAction,
}) => {
  const Icon = ICONS[milestone.kind];
  const accent = ACCENT_BY_KIND[milestone.kind];
  const Fwd = isRtl ? ChevronLeft : ChevronRight;

  const titleKey = `milestone.${milestone.kind}.title`;
  const bodyKey = `milestone.${milestone.kind}.body`;
  const badgeKey = `milestone.${milestone.kind}.badge`;
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
      navigator.vibrate?.([10, 40, 20]);
    }
  }, []);

  const showCta = milestone.kind === 'week_unlocked' && !!onAction;
  const showWeekHero = milestone.kind === 'week_unlocked' && milestone.week != null;
  const showStreakHero = milestone.kind === 'weight_streak_7';

  return (
    <div
      className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center p-3 sm:p-4 milestone-sheet-backdrop"
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
      aria-labelledby="milestone-title"
      onClick={onDismiss}
    >
      <div
        className={`milestone-sheet-card milestone-sheet-card--${accent} w-full max-w-[340px] milestone-sheet-panel`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="milestone-sheet-hero">
          <div className="milestone-sheet-hero-grid" aria-hidden="true" />
          <div className="milestone-sheet-hero-glow" aria-hidden="true" />

          {CONFETTI.map((piece, i) => (
            <span
              key={i}
              className="milestone-confetti"
              aria-hidden="true"
              style={{
                left: piece.left,
                animationDelay: piece.delay,
                background: piece.color,
                width: piece.size,
                height: piece.size,
              }}
            />
          ))}

          <button
            type="button"
            onClick={onDismiss}
            className="milestone-sheet-close touch-manipulation"
            aria-label={t('milestone.dismiss')}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="milestone-sheet-hero-content">
            <span className="milestone-sheet-badge">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
              {t(badgeKey, vars)}
            </span>

            {showWeekHero ? (
              <div className="milestone-sheet-stat font-display tnum" aria-hidden="true">
                {milestone.week}
              </div>
            ) : showStreakHero ? (
              <div className="milestone-sheet-stat font-display tnum" aria-hidden="true">
                {milestone.streakDays ?? 7}
              </div>
            ) : null}

            <div className="milestone-sheet-icon-wrap milestone-sheet-icon">
              <div className="milestone-sheet-icon-ring" aria-hidden="true" />
              <div className="milestone-sheet-icon-core">
                <Icon className="w-9 h-9" />
              </div>
            </div>
          </div>
        </div>

        <div className="milestone-sheet-body">
          <div className="flex items-center justify-center gap-1 mb-2" aria-hidden="true">
            <Star className="w-3 h-3 milestone-sheet-star" />
            <Star className="w-4 h-4 milestone-sheet-star milestone-sheet-star--mid" />
            <Star className="w-3 h-3 milestone-sheet-star" />
          </div>

          <h3 id="milestone-title" className="milestone-sheet-title font-saira">
            {t(titleKey, vars)}
          </h3>

          <p className="milestone-sheet-copy">{t(bodyKey, vars)}</p>

          {quoteKey ? (
            <blockquote className="milestone-sheet-quote">
              <span className="milestone-sheet-quote-mark" aria-hidden="true">“</span>
              {t(quoteKey)}
            </blockquote>
          ) : null}
        </div>

        <div className="milestone-sheet-actions">
          <button
            type="button"
            onClick={onDismiss}
            className="milestone-sheet-btn-secondary touch-manipulation"
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
              className="milestone-sheet-btn-primary touch-manipulation"
            >
              {t('milestone.ctaWorkout')}
              <Fwd className="w-[18px] h-[18px]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onDismiss}
              className="milestone-sheet-btn-primary touch-manipulation"
            >
              {t('milestone.nice')}
              <Sparkles className="w-[16px] h-[16px]" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientMilestoneSheet;
