export type SupportedLanguage = 'en' | 'ar' | 'ary';

const ENDPOINTS = [
  'https://libretranslate.de/translate',
  'https://libretranslate.com/translate'
];

const cache = new Map<string, string>();

export async function translateText(text: string, target: SupportedLanguage): Promise<string> {
  const normalized = text.trim();
  if (!normalized) return text;
  const key = `${target}::${normalized}`;
  if (cache.has(key)) return cache.get(key)!;

  // If target is English, return as-is
  if (target === 'en') {
    cache.set(key, normalized);
    return normalized;
  }

  const body = (endpoint: string) => ({
    url: endpoint,
    options: {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: normalized, source: 'auto', target, format: 'text' })
    }
  });

  for (const endpoint of ENDPOINTS) {
    try {
      const { url, options } = body(endpoint);
      const res = await fetch(url, options as RequestInit);
      if (!res.ok) continue;
      const data = await res.json();
      const translated = (data?.translatedText as string) || normalized;
      cache.set(key, translated);
      return translated;
    } catch {
      // try next endpoint
      continue;
    }
  }
  // Fallback to original text if all endpoints fail
  cache.set(key, normalized);
  return normalized;
}




