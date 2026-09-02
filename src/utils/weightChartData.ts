export interface WeightChartEntry {
  label: string;
  weight: number;
  weekNumber?: number;
  dayKey?: string;
}

export interface WeightChartPoint extends WeightChartEntry {
  weekAverage: number | null;
}

export interface WeeklyWeightSummary {
  weekNumber: number;
  average: number;
  entryCount: number;
}

/** Mean weight per training week from logged day entries. */
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
      average: weights.reduce((sum, w) => sum + w, 0) / weights.length,
      entryCount: weights.length,
    }));
}

export function getOverallAverageWeight(entries: WeightChartEntry[]): number {
  if (entries.length === 0) return 0;
  return entries.reduce((sum, entry) => sum + entry.weight, 0) / entries.length;
}

/** Average for one training week, or null if no logs that week. */
export function getWeekAverageWeight(
  entries: WeightChartEntry[],
  weekNumber: number
): number | null {
  const weekEntries = entries.filter((e) => e.weekNumber === weekNumber);
  if (weekEntries.length === 0) return null;
  return weekEntries.reduce((sum, e) => sum + e.weight, 0) / weekEntries.length;
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

/** Attach each week's mean to every daily point so the average line tracks per week. */
export function buildWeightChartPoints(entries: WeightChartEntry[]): WeightChartPoint[] {
  const summaries = computeWeeklyWeightSummaries(entries);
  const avgByWeek = new Map(summaries.map((s) => [s.weekNumber, s.average]));

  return entries.map((entry) => ({
    ...entry,
    weekAverage:
      entry.weekNumber != null ? avgByWeek.get(entry.weekNumber) ?? null : null,
  }));
}
