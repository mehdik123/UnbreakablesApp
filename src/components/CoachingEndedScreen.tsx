import React from 'react';
import { Heart } from 'lucide-react';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import type { ClientLocale } from '../locales/client/types';

interface CoachingEndedScreenProps {
  clientName?: string;
}

const LANGS: { code: ClientLocale; short: string }[] = [
  { code: 'en', short: 'EN' },
  { code: 'fr', short: 'FR' },
  { code: 'ar', short: 'AR' },
];

/**
 * Shown when a client whose coaching has ended opens their program link.
 * Blocks the rest of the app (no login / no portal).
 */
export const CoachingEndedScreen: React.FC<CoachingEndedScreenProps> = ({
  clientName,
}) => {
  const { t, locale, setLocale } = useClientLocale();
  const greeting = clientName?.trim()
    ? t('ended.greetingName', { name: clientName.trim() })
    : t('ended.greeting');

  return (
    <div className="app-splash workout-shell" role="status">
      <div className="coach-hub-glow" aria-hidden />
      <div className="app-splash-inner coaching-ended-inner">
        <div className="client-login-langs coaching-ended-langs" role="group" aria-label={t('modern.language')}>
          {LANGS.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLocale(l.code)}
              className={`client-login-lang${locale === l.code ? ' is-active' : ''}`}
              aria-pressed={locale === l.code}
            >
              <span className="chip-code">{l.short}</span>
            </button>
          ))}
        </div>

        <div className="app-splash-mark">
          <img src="/brand-logo-light.png" alt="" className="app-splash-logo" />
          <p className="app-splash-wordmark font-saira">UNBREAKABLES</p>
        </div>

        <div className="coaching-ended-card">
          <div className="coaching-ended-icon" aria-hidden>
            <Heart className="w-6 h-6" />
          </div>
          <h1 className="coaching-ended-title font-saira">{t('ended.title')}</h1>
          <p className="coaching-ended-greeting">{greeting}</p>
          <p className="coaching-ended-body">{t('ended.body')}</p>
          <p className="coaching-ended-wish">{t('ended.wish')}</p>
          <p className="coaching-ended-signoff">{t('ended.signoff')}</p>
        </div>
      </div>
    </div>
  );
};
