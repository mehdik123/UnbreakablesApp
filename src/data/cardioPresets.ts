import { CardioAbsExercise, CardioItem, CardioModality, CardioPlan, CardioTemplateData } from '../types';

export interface CardioModalityMeta {
  id: CardioModality;
  label: string;
  icon: 'Footprints' | 'TreePine' | 'Wind' | 'Bike' | 'Timer' | 'Activity';
  gradient: string;
}

export const CARDIO_MODALITIES: CardioModalityMeta[] = [
  { id: 'incline_walk', label: 'Incline treadmill', icon: 'Footprints', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'outdoor_walk', label: 'Outdoor walk', icon: 'TreePine', gradient: 'from-green-500 to-lime-500' },
  { id: 'jog', label: 'Jog / Run', icon: 'Wind', gradient: 'from-orange-500 to-amber-500' },
  { id: 'bike', label: 'Bike', icon: 'Bike', gradient: 'from-blue-500 to-cyan-500' },
  { id: 'sprints', label: 'Sprints', icon: 'Timer', gradient: 'from-red-500 to-rose-500' },
  { id: 'custom', label: 'Custom', icon: 'Activity', gradient: 'from-violet-500 to-fuchsia-500' },
];

export const CARDIO_WHEN_OPTIONS: { value: CardioItem['when']; label: string }[] = [
  { value: 'after_workout', label: 'After workout' },
  { value: 'off_day', label: 'Off day' },
  { value: 'morning', label: 'Morning' },
  { value: 'evening', label: 'Evening' },
];

export function getModalityMeta(modality: CardioModality): CardioModalityMeta {
  return CARDIO_MODALITIES.find((m) => m.id === modality) || CARDIO_MODALITIES[CARDIO_MODALITIES.length - 1];
}

function newId() {
  return `cardio-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Built-in template defaults (coach can edit per client after adding). */
export function builtInTemplateData(modality: CardioModality): CardioTemplateData {
  const base = { timesPerWeek: 3, when: 'after_workout' as const };
  switch (modality) {
    case 'incline_walk':
      return { ...base, modality, name: 'Incline walking (treadmill)', durationMin: 30, speedKmh: 5, inclinePct: 8 };
    case 'outdoor_walk':
      return { ...base, modality, name: 'Outdoor walk', durationMin: 40, speedKmh: 6, distanceKm: 4, when: 'off_day' };
    case 'jog':
      return { ...base, modality, name: 'Jog / Run', durationMin: 25, speedKmh: 9, distanceKm: 4, when: 'off_day' };
    case 'bike':
      return { ...base, modality, name: 'Bike', durationMin: 30, speedKmh: 20, when: 'off_day' };
    case 'sprints':
      return {
        ...base,
        modality,
        name: 'Sprints',
        durationMin: 15,
        speedKmh: 14,
        timesPerWeek: 2,
        workSec: 20,
        restSec: 90,
        rounds: 8,
        when: 'after_workout',
      };
    default:
      return { ...base, modality, name: 'Cardio', durationMin: 20, speedKmh: 5 };
  }
}

export function itemFromTemplate(data: CardioTemplateData): CardioItem {
  return { id: newId(), ...data };
}

function normalizeAbsExercises(raw: unknown): CardioAbsExercise[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const name = String(r.name || '').trim();
      if (!name) return null;
      return {
        id: String(r.id || newId()),
        exerciseId: r.exerciseId != null ? String(r.exerciseId) : undefined,
        name,
        videoUrl: r.videoUrl ? String(r.videoUrl) : undefined,
        muscleGroup: r.muscleGroup ? String(r.muscleGroup) : undefined,
        sets: Math.max(1, Number(r.sets) || 3),
        reps: Math.max(1, Number(r.reps) || 12),
        weight: Math.max(0, Number(r.weight) || 0),
        restSec: r.restSec != null ? Math.max(0, Number(r.restSec) || 0) : undefined,
      } satisfies CardioAbsExercise;
    })
    .filter((x): x is CardioAbsExercise => x != null);
}

/** Migrate legacy week-based cardio_plan_json to the new shape. */
export function normalizeCardioPlan(data: unknown): CardioPlan {
  if (!data || typeof data !== 'object') return { items: [], absExercises: [], notes: '' };
  const d = data as Record<string, unknown>;
  const absExercises = normalizeAbsExercises(d.absExercises);
  const notes = typeof d.notes === 'string' ? d.notes : '';

  if (Array.isArray(d.items)) {
    return { items: d.items as CardioItem[], absExercises, notes };
  }

  const weeks = d.weeks as { weekNumber?: number; sessions?: Record<string, unknown>[] }[] | undefined;
  if (Array.isArray(weeks) && weeks.length) {
    const w = weeks.find((x) => x.weekNumber === 1) || weeks[0];
    const items: CardioItem[] = (w.sessions || []).map((s) => ({
      id: String(s.id || newId()),
      modality: (s.modality as CardioModality) || 'custom',
      name: String(s.name || 'Cardio'),
      durationMin: Number(s.durationMin) || 30,
      speedKmh: s.speedKmh != null ? Number(s.speedKmh) : undefined,
      inclinePct: s.inclinePct != null ? Number(s.inclinePct) : undefined,
      distanceKm: s.distanceKm != null ? Number(s.distanceKm) : undefined,
      timesPerWeek: 3,
      when: s.placement === 'off_day' ? 'off_day' : 'after_workout',
      whenNote: s.note ? String(s.note) : undefined,
      workSec: (s.intervals as { workSec?: number })?.workSec,
      restSec: (s.intervals as { restSec?: number })?.restSec,
      rounds: (s.intervals as { rounds?: number })?.rounds,
    }));
    return { items, absExercises, notes };
  }
  return { items: [], absExercises, notes };
}

export function modalityShowsDistance(modality: CardioModality): boolean {
  return modality === 'outdoor_walk' || modality === 'jog' || modality === 'custom';
}

export function modalityShowsIncline(modality: CardioModality): boolean {
  return modality === 'incline_walk' || modality === 'custom';
}

export function modalityIsSprints(modality: CardioModality): boolean {
  return modality === 'sprints';
}
