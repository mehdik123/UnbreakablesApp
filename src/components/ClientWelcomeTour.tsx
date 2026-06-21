import React, { useState } from 'react';
import {
  Sparkles,
  LayoutGrid,
  Save,
  CalendarClock,
  HelpCircle,
  ChevronRight,
  ChevronLeft,
  X,
  Check,
} from 'lucide-react';

interface ClientWelcomeTourProps {
  name: string;
  isRtl: boolean;
  /** translation helper from the client locale context */
  t: (key: string, vars?: Record<string, string | number>) => string;
  onClose: () => void;
}

type Slide = {
  Icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  iconBg: string;
  iconColor: string;
  titleKey: string;
  bodyKey: string;
};

const SLIDES: Slide[] = [
  { Icon: Sparkles, iconBg: 'rgba(255,45,85,.14)', iconColor: '#ff8a5c', titleKey: 'tour.welcomeTitle', bodyKey: 'tour.welcomeBody' },
  { Icon: LayoutGrid, iconBg: 'rgba(91,140,255,.14)', iconColor: 'var(--blue)', titleKey: 'tour.navTitle', bodyKey: 'tour.navBody' },
  { Icon: Save, iconBg: 'rgba(52,211,153,.14)', iconColor: 'var(--emerald)', titleKey: 'tour.saveTitle', bodyKey: 'tour.saveBody' },
  { Icon: CalendarClock, iconBg: 'rgba(168,85,247,.14)', iconColor: '#a855f7', titleKey: 'tour.weeksTitle', bodyKey: 'tour.weeksBody' },
  { Icon: HelpCircle, iconBg: 'rgba(255,138,92,.14)', iconColor: '#ff8a5c', titleKey: 'tour.helpTitle', bodyKey: 'tour.helpBody' },
];

export const ClientWelcomeTour: React.FC<ClientWelcomeTourProps> = ({ name, isRtl, t, onClose }) => {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Back = isRtl ? ChevronRight : ChevronLeft;
  const Fwd = isRtl ? ChevronLeft : ChevronRight;

  const next = () => (isLast ? onClose() : setStep((s) => Math.min(SLIDES.length - 1, s + 1)));
  const prev = () => setStep((s) => Math.max(0, s - 1));

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
      dir={isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-[24px] overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
      >
        <div className="flex items-center justify-between px-4 pt-4">
          <span className="text-[11px] font-bold uppercase tracking-[0.16em]" style={{ color: 'var(--txt-lo)' }}>
            {t('tour.kicker')}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center active:scale-90 transition-transform"
            style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
            aria-label={t('tour.skip')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-5 pb-2 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: slide.iconBg }}
          >
            <slide.Icon className="w-8 h-8" style={{ color: slide.iconColor }} />
          </div>
          <h3 className="font-display text-[19px] font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>
            {t(slide.titleKey, { name })}
          </h3>
          <p className="text-[13.5px] leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {t(slide.bodyKey, { name })}
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-4">
          {SLIDES.map((_, i) => (
            <span
              key={i}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: i === step ? 18 : 6,
                background: i === step ? 'var(--red)' : 'var(--hair-strong)',
              }}
            />
          ))}
        </div>

        <div className="flex items-center gap-2 px-4 pb-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={prev}
              className="w-11 h-11 rounded-[14px] flex items-center justify-center active:scale-95 transition-transform shrink-0"
              style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-hi)' }}
              aria-label={t('tour.back')}
            >
              <Back className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 h-11 rounded-[14px] text-[13px] font-semibold active:scale-95 transition-transform shrink-0"
              style={{ background: 'var(--glass)', border: '1px solid var(--hair)', color: 'var(--txt-mid)' }}
            >
              {t('tour.skip')}
            </button>
          )}

          <button
            type="button"
            onClick={next}
            className="flex-1 h-11 rounded-[14px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{ background: 'var(--grad-red)', boxShadow: '0 12px 28px -10px rgba(255,45,85,.6)' }}
          >
            {isLast ? (
              <>
                <Check className="w-[18px] h-[18px]" />
                {t('tour.done')}
              </>
            ) : (
              <>
                {t('tour.next')}
                <Fwd className="w-[18px] h-[18px]" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientWelcomeTour;
