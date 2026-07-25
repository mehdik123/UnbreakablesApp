/**
 * Meal / food name search helpers.
 * Matches the full typed query: every token must appear in the haystack
 * (order-independent), so "chicken rice" matches "Rice & Chicken Bowl".
 */

export function normalizeSearchText(value: string): string {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function searchTokens(query: string): string[] {
  const normalized = normalizeSearchText(query);
  if (!normalized) return [];
  return normalized.split(' ').filter(Boolean);
}

/** True when every query token appears somewhere in text (full typed name). */
export function matchesSearchQuery(text: string, query: string): boolean {
  const tokens = searchTokens(query);
  if (tokens.length === 0) return true;
  const haystack = normalizeSearchText(text);
  if (!haystack) return false;
  // Prefer contiguous full-query match, then require all tokens
  const full = normalizeSearchText(query);
  if (full && haystack.includes(full)) return true;
  return tokens.every((token) => haystack.includes(token));
}

export function mealMatchesSearch(
  mealName: string,
  query: string,
  ingredientNames: Array<string | undefined | null> = []
): boolean {
  if (!searchTokens(query).length) return true;
  if (matchesSearchQuery(mealName, query)) return true;
  return ingredientNames.some((name) => name && matchesSearchQuery(name, query));
}
