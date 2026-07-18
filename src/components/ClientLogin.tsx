import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff, Shield } from 'lucide-react';
import { authService } from '../lib/authService';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import type { ClientLocale } from '../locales/client/types';

interface ClientLoginProps {
  clientId?: string;
  onLoginSuccess: (clientId: string) => void;
}

const LANGS: { code: ClientLocale; short: string; labelKey: string }[] = [
  { code: 'en', short: 'EN', labelKey: 'modern.langEnglish' },
  { code: 'fr', short: 'FR', labelKey: 'modern.langFrench' },
  { code: 'ar', short: 'AR', labelKey: 'modern.langArabic' },
];

export const ClientLogin: React.FC<ClientLoginProps> = ({ clientId, onLoginSuccess }) => {
  const { t, locale, setLocale } = useClientLocale();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authService.loginClient(username, password, clientId);

      if (result.success && result.clientId) {
        onLoginSuccess(result.clientId);
      } else {
        setError(result.error || t('login.failed'));
      }
    } catch {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="client-login-shell workout-shell">
      <div className="client-login-glow" aria-hidden />

      <div className="client-login-inner">
        <header className="client-login-brand home-anim">
          <img
            src="/brand-logo-light.png"
            alt="Unbreakables"
            className="client-login-logo"
          />
          <p className="client-login-eyebrow font-saira">UNBREAKABLES</p>
          <h1 className="client-login-title font-saira">{t('login.welcome')}</h1>
          <p className="client-login-sub">{t('login.subtitle')}</p>
        </header>

        <div className="client-login-card home-anim" style={{ animationDelay: '60ms' }}>
          <div className="client-login-langs" role="group" aria-label={t('modern.language')}>
            {LANGS.map((l) => {
              const active = locale === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code)}
                  className={`client-login-lang${active ? ' is-active' : ''}`}
                  aria-pressed={active}
                  title={t(l.labelKey)}
                >
                  <span className="chip-code">{l.short}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="client-login-form">
            <label className="client-login-field" htmlFor="client-username">
              <span className="client-login-label">{t('login.username')}</span>
              <div className="client-login-input-wrap">
                <User className="client-login-ic" aria-hidden />
                <input
                  type="text"
                  id="client-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="client-login-input"
                  placeholder={t('login.usernamePlaceholder')}
                  required
                  autoComplete="username"
                />
              </div>
            </label>

            <label className="client-login-field" htmlFor="client-password">
              <span className="client-login-label">{t('login.password')}</span>
              <div className="client-login-input-wrap">
                <Lock className="client-login-ic" aria-hidden />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="client-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="client-login-input client-login-input--pwd"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="client-login-eye"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </label>

            {error && (
              <div className="client-login-error" role="alert">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="client-login-submit"
            >
              {loading ? (
                <>
                  <span className="client-login-spinner" aria-hidden />
                  {t('login.signingIn')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          <p className="client-login-help">{t('login.help')}</p>
        </div>

        <div className="client-login-note home-anim" style={{ animationDelay: '120ms' }}>
          <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--red)' }} aria-hidden />
          <p>{t('login.secureNote')}</p>
        </div>
      </div>
    </div>
  );
};
