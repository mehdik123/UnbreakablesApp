import React from 'react';
import { Wrench } from 'lucide-react';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import type { ClientLocale } from '../locales/client/types';

const LANGS: { code: ClientLocale; short: string }[] = [
  { code: 'en', short: 'EN' },
  { code: 'fr', short: 'FR' },
  { code: 'ar', short: 'AR' },
];

/**
 * Safe screen for client links when the portal cannot load
 * (backend down, crash recovery, missing client data, etc.).
 * Never links into the coach dashboard.
 */
export const ClientPortalUnavailableScreen: React.FC<{ onRetry?: () => void }> = ({
  onRetry,
}) => {
  const { t, locale, setLocale } = useClientLocale();

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
            <Wrench className="w-6 h-6" />
          </div>
          <h1 className="coaching-ended-title font-saira">{t('portalDown.title')}</h1>
          <p className="coaching-ended-body">{t('portalDown.body')}</p>
          <p className="coaching-ended-wish">{t('portalDown.contact')}</p>
          <button
            type="button"
            onClick={() => (onRetry ? onRetry() : window.location.reload())}
            className="mt-5 min-h-12 w-full rounded-2xl font-semibold text-white"
            style={{ background: 'var(--grad-red)', touchAction: 'manipulation' }}
          >
            {t('portalDown.retry')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalUnavailableScreen;
