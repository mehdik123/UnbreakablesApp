/** Rest between sets is one value per exercise (seconds). */

export function getExerciseRestSeconds(exercise: {
  rest?: string;
  restPeriod?: number;
  sets?: Array<{ restPeriod?: number; rest_seconds?: number }>;
}): number {
  if (typeof exercise.restPeriod === 'number' && Number.isFinite(exercise.restPeriod) && exercise.restPeriod > 0) {
    return Math.round(exercise.restPeriod);
  }
  const fromLabel = parseInt(String(exercise.rest || '').replace(/[^0-9]/g, ''), 10);
  if (Number.isFinite(fromLabel) && fromLabel > 0) return fromLabel;
  const setRest = (exercise.sets || []).find((s) => {
    const n = typeof s.restPeriod === 'number' ? s.restPeriod : s.rest_seconds;
    return typeof n === 'number' && n > 0;
  });
  if (setRest) {
    const n = typeof setRest.restPeriod === 'number' ? setRest.restPeriod : setRest.rest_seconds;
    if (typeof n === 'number' && n > 0) return Math.round(n);
  }
  return 90;
}

export function formatRestSeconds(seconds: number): string {
  return `${Math.max(0, Math.round(seconds))}s`;
}
