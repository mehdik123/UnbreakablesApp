import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { clientMessages } from '../locales/client/messages';
import type { ClientLocale } from '../locales/client/types';

const STORAGE_KEY = 'client_ui_locale';

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, key) =>
    vars[key] !== undefined && vars[key] !== null ? String(vars[key]) : `{${key}}`
  );
}

type ClientLocaleContextValue = {
  locale: ClientLocale;
  setLocale: (locale: ClientLocale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  isRtl: boolean;
};

const ClientLocaleContext = createContext<ClientLocaleContextValue | null>(null);

export function ClientLocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<ClientLocale>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'ar' || stored === 'en') return stored;
    } catch {
      /* ignore */
    }
    return 'en';
  });

  const setLocale = useCallback((next: ClientLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const table = clientMessages[locale] ?? clientMessages.en;
      const fallback = clientMessages.en;
      const raw = table[key] ?? fallback[key] ?? key;
      return interpolate(raw, vars);
    },
    [locale]
  );

  const isRtl = locale === 'ar';

  const value = useMemo(
    () => ({ locale, setLocale, t, isRtl }),
    [locale, setLocale, t, isRtl]
  );

  useEffect(() => {
    document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', locale === 'ar' ? 'ar' : 'en');
    return () => {
      document.documentElement.setAttribute('dir', 'ltr');
      document.documentElement.setAttribute('lang', 'en');
    };
  }, [isRtl, locale]);

  return <ClientLocaleContext.Provider value={value}>{children}</ClientLocaleContext.Provider>;
}

/** Safe outside provider: English, no-op setLocale. */
export function useClientLocale(): ClientLocaleContextValue {
  const ctx = useContext(ClientLocaleContext);
  if (!ctx) {
    return {
      locale: 'en',
      setLocale: () => {},
      t: (key: string, vars?: Record<string, string | number>) =>
        interpolate(clientMessages.en[key] ?? key, vars),
      isRtl: false,
    };
  }
  return ctx;
}
