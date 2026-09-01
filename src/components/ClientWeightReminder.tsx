import React from 'react';
import { Scale, ChevronRight, ChevronLeft, X } from 'lucide-react';
import type { WeightReminderVariant } from '../utils/weightLogReminder';

interface ClientWeightReminderProps {
  variant: WeightReminderVariant;
  week: number;
  isRtl: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  onLog: () => void;
  onDismiss: () => void;
}

export const ClientWeightReminder: React.FC<ClientWeightReminderProps> = ({
  variant,
  week,
  isRtl,
  t,
  onLog,
  onDismiss,
}) => {
  const Fwd = isRtl ? ChevronLeft : ChevronRight;
  const titleKey = `weightReminder.${variant}.title`;
  const bodyKey = `weightReminder.${variant}.body`;

  return (
    <div className="home-weight-reminder home-anim" role="status">
      <div className="home-weight-reminder-glow" aria-hidden="true" />
      <button
        type="button"
        className="home-weight-reminder-dismiss touch-manipulation"
        onClick={onDismiss}
        aria-label={t('weightReminder.dismissAria')}
      >
        <X className="w-4 h-4" />
      </button>

      <button
        type="button"
        className="home-weight-reminder-main touch-manipulation"
        onClick={onLog}
      >
        <div className="home-weight-reminder-ic" aria-hidden="true">
          <Scale className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1 text-start">
          <div className="home-weight-reminder-kicker">{t('weightReminder.kicker')}</div>
          <div className="font-saira text-[17px] font-extrabold italic leading-tight mt-0.5" style={{ color: 'var(--txt-hi)' }}>
            {t(titleKey, { week })}
          </div>
          <p className="text-[12.5px] leading-snug mt-1 mb-0" style={{ color: 'var(--txt-mid)' }}>
            {t(bodyKey, { week })}
          </p>
          <span className="home-weight-reminder-cta">
            {t('weightReminder.cta')}
            <Fwd className="w-4 h-4" />
          </span>
        </div>
      </button>
    </div>
  );
};

export default ClientWeightReminder;
