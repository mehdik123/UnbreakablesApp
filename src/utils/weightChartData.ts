export interface WeightChartEntry {
  label: string;
  weight: number;
  weekNumber?: number;
  dayKey?: string;
}

export interface DailyWeightChartPoint {
  label: string;
  weight: number;
}

export interface WeeklyAvgChartPoint {
  label: string;
  average: number;
  weekNumber: number;
}

export interface WeeklyWeightSummary {
  weekNumber: number;
  /** Sum of logged weights that week ÷ number of logs that week. */
  average: number;
  entryCount: number;
}

/** Mean of logged weights in the week (sum ÷ count). Returns null if nothing logged. */
export function computeWeekAverage(loggedWeights: number[]): number | null {
  if (loggedWeights.length === 0) return null;
  return loggedWeights.reduce((sum, w) => sum + w, 0) / loggedWeights.length;
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
      average: computeWeekAverage(weights)!,
      entryCount: weights.length,
    }));
}

export function getOverallAverageWeight(entries: WeightChartEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + entry.weight, 0) / entries.length;
}

/** Weekly average for one training week, or null if no logs. */
export function getWeekAverageWeight(
  entries: WeightChartEntry[],
  weekNumber: number
): number | null {
  const weekEntries = entries.filter((e) => e.weekNumber === weekNumber);
  if (weekEntries.length === 0) return null;
  return computeWeekAverage(weekEntries.map((e) => e.weight));
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

/** Daily weight series — one point per logged day, in entry order. */
export function buildDailyWeightChartPoints(entries: WeightChartEntry[]): DailyWeightChartPoint[] {
  return entries.map((entry) => ({
    label: entry.label,
    weight: entry.weight,
  }));
}

/** Weekly average series — one point per training week (W1, W2, …). */
export function buildWeeklyAverageChartPoints(entries: WeightChartEntry[]): WeeklyAvgChartPoint[] {
  return computeWeeklyWeightSummaries(entries).map(({ weekNumber, average }) => ({
    label: `W${weekNumber}`,
    average,
    weekNumber,
  }));
}

export function getWeeklyAverageOverall(summaries: WeeklyWeightSummary[]): number {
  if (summaries.length === 0) return 0;
  return summaries.reduce((sum, row) => sum + row.average, 0) / summaries.length;
}
