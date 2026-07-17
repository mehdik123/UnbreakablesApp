import React, { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
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
    } catch (err) {
      setError(t('login.error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      {/* Animated background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <img src="/brand-logo-light.png" alt="Unbreakables" className="w-28 h-28 object-contain mx-auto mb-4 drop-shadow-2xl" />
          <h1 className="text-4xl font-bold text-white mb-2">
            {t('login.welcome')}
          </h1>
          <p className="text-slate-400 text-lg">{t('login.subtitle')}</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8">
          {/* Language switcher EN / FR / AR */}
          <div className="flex gap-2 mb-6" role="group" aria-label={t('modern.language')}>
            {LANGS.map((l) => {
              const active = locale === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLocale(l.code)}
                  className="flex-1 min-h-[44px] rounded-xl text-sm font-semibold transition-colors"
                  style={{
                    background: active ? 'rgba(16,185,129,0.35)' : 'rgba(255,255,255,0.08)',
                    border: active ? '1px solid rgba(52,211,153,0.5)' : '1px solid rgba(255,255,255,0.15)',
                    color: active ? '#fff' : 'rgba(226,232,240,0.85)',
                  }}
                  aria-pressed={active}
                  title={t(l.labelKey)}
                >
                  {l.short}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label htmlFor="client-username" className="block text-sm font-medium text-slate-200 mb-2">
                {t('login.username')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  id="client-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
                  placeholder={t('login.usernamePlaceholder')}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="client-password" className="block text-sm font-medium text-slate-200 mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="client-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-12 pr-12 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-base"
                  placeholder={t('login.passwordPlaceholder')}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-white transition-colors min-w-[44px] justify-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4">
                <p className="text-red-200 text-sm text-center">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full min-h-[48px] bg-gradient-to-r from-emerald-500 to-cyan-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-emerald-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {t('login.signingIn')}
                </div>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              Need help? Contact Mehdi.
            </p>
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4">
          <p className="text-slate-400 text-xs text-center">
            🔒 Your credentials were provided by Mehdi along with your program link.
          </p>
        </div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};
