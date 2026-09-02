export interface WeightChartEntry {
  label: string;
  weight: number;
  weekNumber?: number;
  dayKey?: string;
}

export interface WeightChartPoint {
  label: string;
  weight?: number | null;
  weekNumber?: number;
  dayKey?: string;
  weekAverage?: number | null;
  /** True for the single weekly summary point (e.g. label "W1"). */
  isWeekAverageMarker?: boolean;
}

export interface WeeklyWeightSummary {
  weekNumber: number;
  /** Sum of logged weights that week ÷ 7 (program week has 7 day slots). */
  average: number;
  entryCount: number;
}

export const WEIGHT_DAYS_PER_WEEK = 7;

function daySortIndex(dayKey?: string): number {
  if (!dayKey) return 99;
  const n = Number(dayKey.replace('day', ''));
  return Number.isFinite(n) ? n : 99;
}

/** Sum of logged weights in the week ÷ 7. Returns null if nothing logged that week. */
export function computeWeekAverageOverSeven(loggedWeights: number[]): number | null {
  if (loggedWeights.length === 0) return null;
  return loggedWeights.reduce((sum, w) => sum + w, 0) / WEIGHT_DAYS_PER_WEEK;
}

/** One summary row per training week that has at least one log. */
export function computeWeeklyWeightSummaries(
  entries: WeightChartEntry[]
): WeeklyWeightSummary[] {
  const byWeek = new Map<number, number[]>();

  for (const entry of entries) {
    const week = entry.weekNumber;
    if (week == null || week < 1) continue;
    const bucket = byWeek.get(week) ?? [];
    bucket.push(entry.weight);
    byWeek.set(week, bucket);
  }

  return [...byWeek.entries()]
    .sort(([a], [b]) => a - b)
    .map(([weekNumber, weights]) => ({
      weekNumber,
      average: computeWeekAverageOverSeven(weights)!,
      entryCount: weights.length,
    }));
}

export function getOverallAverageWeight(entries: WeightChartEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + entry.weight, 0) / entries.length;
}

/** Weekly average (sum ÷ 7) for one training week, or null if no logs. */
export function getWeekAverageWeight(
  entries: WeightChartEntry[],
  weekNumber: number
): number | null {
  const weekEntries = entries.filter((e) => e.weekNumber === weekNumber);
  if (weekEntries.length === 0) return null;
  return computeWeekAverageOverSeven(weekEntries.map((e) => e.weight));
}

/** Latest training week that has at least one log. */
export function getLatestWeekWithWeight(entries: WeightChartEntry[]): number | null {
  const weeks = entries
    .map((e) => e.weekNumber)
    .filter((w): w is number => w != null && w >= 1);
  return weeks.length ? Math.max(...weeks) : null;
}

/** Prefer selected week average; fall back to latest week with data. */
export function getDisplayWeekAverage(
  entries: WeightChartEntry[],
  selectedWeek?: number
): number {
  if (selectedWeek != null && selectedWeek >= 1) {
    const selected = getWeekAverageWeight(entries, selectedWeek);
    if (selected != null) return selected;
  }
  const latestWeek = getLatestWeekWithWeight(entries);
  if (latestWeek == null) return 0;
  return getWeekAverageWeight(entries, latestWeek) ?? 0;
}

/**
 * Chart series: daily logged points, then one weekly-average marker per week (label "W{n}").
 * Weekly average = sum of that week's logs ÷ 7 — only one blue point per week.
 */
export function buildWeightChartPoints(entries: WeightChartEntry[]): WeightChartPoint[] {
  const summaries = computeWeeklyWeightSummaries(entries);
  const avgByWeek = new Map(summaries.map((s) => [s.weekNumber, s.average]));

  const byWeek = new Map<number, WeightChartEntry[]>();
  for (const entry of entries) {
    if (entry.weekNumber == null || entry.weekNumber < 1) continue;
    const bucket = byWeek.get(entry.weekNumber) ?? [];
    bucket.push(entry);
    byWeek.set(entry.weekNumber, bucket);
  }

  const points: WeightChartPoint[] = [];

  for (const weekNumber of [...byWeek.keys()].sort((a, b) => a - b)) {
    const weekEntries = [...(byWeek.get(weekNumber) ?? [])].sort(
      (a, b) => daySortIndex(a.dayKey) - daySortIndex(b.dayKey)
    );

    for (const entry of weekEntries) {
      points.push({
        label: entry.label,
        weight: entry.weight,
        weekNumber: entry.weekNumber,
        dayKey: entry.dayKey,
        weekAverage: null,
      });
    }

    const avg = avgByWeek.get(weekNumber);
    if (avg != null) {
      points.push({
        label: `W${weekNumber}`,
        weight: null,
        weekNumber,
        weekAverage: avg,
        isWeekAverageMarker: true,
      });
    }
  }

  return points;
}
