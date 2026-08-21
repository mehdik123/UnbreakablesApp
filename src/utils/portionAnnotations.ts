/**
 * Human-readable portion hints for common whole foods that are easier
 * to plate by piece/scoop than by grams alone.
 *
 * Rules are coach-defined (e.g. eggs: 1 = 50 g).
 */

export type PortionRule = {
  /** Stable id for tests / debugging */
  id: string;
  /** Return true when this food name should use the rule */
  matches: (foodName: string) => boolean;
  /** Grams for one unit (egg, half avocado, scoop, …) */
  gramsPerUnit: number;
  /** Singular unit label, e.g. "egg", "scoop" */
  unitSingular: string;
  /** Plural unit label, e.g. "eggs", "scoops" */
  unitPlural: string;
  /** Optional: treat 1 unit as a fraction of a named whole (avocado halves) */
  wholeName?: string;
  unitsPerWhole?: number;
};

const normalizeName = (name: string) =>
  String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export const PORTION_RULES: PortionRule[] = [
  {
    id: 'egg',
    matches: (n) => {
      const name = normalizeName(n);
      if (name.includes('white')) return false;
      return name === 'egg' || name === 'eggs' || name === 'whole egg' || name === 'whole eggs';
    },
    gramsPerUnit: 50,
    unitSingular: 'egg',
    unitPlural: 'eggs',
  },
  {
    id: 'avocado',
    // ½ avocado = 80 g
    matches: (n) => normalizeName(n).includes('avocado'),
    gramsPerUnit: 80,
    unitSingular: '½',
    unitPlural: '½',
    wholeName: 'avocado',
    unitsPerWhole: 2,
  },
  {
    id: 'kiwi',
    matches: (n) => {
      const name = normalizeName(n);
      return name === 'kiwi' || name === 'kiwis' || name.startsWith('kiwi ');
    },
    gramsPerUnit: 70,
    unitSingular: 'kiwi',
    unitPlural: 'kiwis',
  },
  {
    id: 'banana',
    matches: (n) => {
      const name = normalizeName(n);
      return name === 'banana' || name === 'bananas' || name.startsWith('banana ');
    },
    gramsPerUnit: 100,
    unitSingular: 'banana',
    unitPlural: 'bananas',
  },
  {
    id: 'whole-wheat-wrap',
    matches: (n) => {
      const name = normalizeName(n);
      return name.includes('wrap') && (name.includes('wheat') || name.includes('whole'));
    },
    gramsPerUnit: 40,
    unitSingular: 'wrap',
    unitPlural: 'wraps',
  },
  {
    // Body Attack label: 30 g = 2 scoops → 15 g per level scoop
    id: 'body-attack-whey-scoop',
    matches: (n) => {
      const name = normalizeName(n);
      return name.includes('body attack') && name.includes('whey');
    },
    gramsPerUnit: 15,
    unitSingular: 'scoop',
    unitPlural: 'scoops',
  },
  {
    // Label serving: 2½ scoops/cups = 333 g → ~133 g per scoop
    id: 'dymatize-mass-gainer-scoop',
    matches: (n) => {
      const name = normalizeName(n);
      return name.includes('dymatize') && name.includes('mass');
    },
    gramsPerUnit: 133,
    unitSingular: 'scoop',
    unitPlural: 'scoops',
  },
  {
    id: 'whey-scoop',
    matches: (n) => {
      const name = normalizeName(n);
      if (name.includes('body attack') || name.includes('dymatize')) return false;
      if (!name.includes('protein') && !name.includes('whey') && !name.includes('isolate')) return false;
      // Prefer whey / gold standard / ON Gold style powders
      return (
        name.includes('whey') ||
        name.includes('gold standard') ||
        name.includes('optimum') ||
        name.includes('on gold') ||
        name.includes('isolate')
      );
    },
    gramsPerUnit: 32,
    unitSingular: 'scoop',
    unitPlural: 'scoops',
  },
  {
    id: 'whole-bread-toast',
    matches: (n) => {
      const name = normalizeName(n);
      return name.includes('toast') || (name.includes('bread') && name.includes('whole'));
    },
    gramsPerUnit: 30,
    unitSingular: 'slice',
    unitPlural: 'slices',
  },
  {
    id: 'rice-cake',
    matches: (n) => {
      const name = normalizeName(n);
      return name === 'rice cake' || name === 'rice cakes' || name.includes('rice cake');
    },
    gramsPerUnit: 7,
    unitSingular: 'rice cake',
    unitPlural: 'rice cakes',
  },
];

function formatUnitCount(count: number): string {
  const rounded = Math.round(count * 4) / 4; // nearest quarter
  if (Math.abs(rounded - 0.25) < 0.001) return '¼';
  if (Math.abs(rounded - 0.5) < 0.001) return '½';
  if (Math.abs(rounded - 0.75) < 0.001) return '¾';
  if (Math.abs(rounded - 1.25) < 0.001) return '1¼';
  if (Math.abs(rounded - 1.5) < 0.001) return '1½';
  if (Math.abs(rounded - 1.75) < 0.001) return '1¾';
  if (Math.abs(rounded - Math.round(rounded)) < 0.001) return String(Math.round(rounded));
  return rounded.toFixed(2).replace(/\.?0+$/, '');
}

function formatAvocado(unitsOfHalf: number): string {
  const wholes = unitsOfHalf / 2;
  const roundedWholes = Math.round(wholes * 4) / 4;
  if (Math.abs(roundedWholes - 0.5) < 0.001) return '½ avocado';
  if (Math.abs(roundedWholes - 1) < 0.001) return '1 avocado';
  if (Math.abs(roundedWholes - 1.5) < 0.001) return '1½ avocados';
  if (Math.abs(roundedWholes - Math.round(roundedWholes)) < 0.001) {
    const n = Math.round(roundedWholes);
    return `${n} avocado${n === 1 ? '' : 's'}`;
  }
  return `${formatUnitCount(unitsOfHalf)} × ½ avocado`;
}

/**
 * Returns a short annotation like "≈ 3 eggs" for a food + grams, or null.
 */
export function formatPortionAnnotation(foodName: string, grams: number): string | null {
  if (!foodName || !Number.isFinite(grams) || grams <= 0) return null;

  const rule = PORTION_RULES.find((r) => r.matches(foodName));
  if (!rule) return null;

  const rawCount = grams / rule.gramsPerUnit;
  // Skip tiny leftovers that aren't a meaningful portion
  if (rawCount < 0.2) return null;

  if (rule.id === 'avocado') {
    return `≈ ${formatAvocado(rawCount)}`;
  }

  const label = formatUnitCount(rawCount);
  const numeric = Number(label);
  const isOne = label === '1' || (Number.isFinite(numeric) && Math.abs(numeric - 1) < 0.001);
  const unit = isOne ? rule.unitSingular : rule.unitPlural;
  return `≈ ${label} ${unit}`;
}

/** Full display string: "150g · ≈ 3 eggs" (or just "150g" when no rule). */
export function formatIngredientQuantityLabel(foodName: string, grams: number): string {
  const g = Number.isFinite(grams) ? Math.round(grams * 10) / 10 : 0;
  const gramsLabel = Number.isInteger(g) ? `${g}g` : `${g}g`;
  const note = formatPortionAnnotation(foodName, grams);
  return note ? `${gramsLabel} · ${note}` : gramsLabel;
}
