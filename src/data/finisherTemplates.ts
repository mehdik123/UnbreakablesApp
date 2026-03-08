import { Exercise, WorkoutExercise, WorkoutSet } from '../types';
import { exercises } from './exercises';

export type FinisherType = 'abs' | 'cardio';

export interface FinisherTemplateItem {
  exerciseId: string;
  sets: number;
  reps: number;
  rest: string;
  weight?: number;
}

const ABS_TEMPLATE: FinisherTemplateItem[] = [
  { exerciseId: '56', sets: 2, reps: 45, rest: '30 sec', weight: 0 },   // Plank (sec)
  { exerciseId: '57', sets: 2, reps: 15, rest: '30 sec', weight: 0 },   // Crunches
  { exerciseId: '61', sets: 2, reps: 12, rest: '30 sec', weight: 0 },    // Leg Raises
  { exerciseId: '62', sets: 2, reps: 20, rest: '45 sec', weight: 0 },   // Bicycle Kicks
];

const CARDIO_TEMPLATE: FinisherTemplateItem[] = [
  { exerciseId: '63', sets: 2, reps: 30, rest: '45 sec', weight: 0 },    // Mountain Climbers
  { exerciseId: '64', sets: 2, reps: 10, rest: '60 sec', weight: 0 },   // Burpees
];

function findExercise(exercisesList: Exercise[], id: string): Exercise | undefined {
  return exercisesList.find((e) => e.id === id);
}

function toWorkoutExercise(
  item: FinisherTemplateItem,
  exercise: Exercise,
  order: number,
  baseId: string
): WorkoutExercise {
  const setList: WorkoutSet[] = Array.from({ length: item.sets }, (_, i) => ({
    id: `${baseId}-set-${i}`,
    reps: item.reps,
    weight: item.weight ?? 0,
    isDropset: false,
    completed: false
  }));
  return {
    id: baseId,
    exercise,
    sets: setList,
    rest: item.rest,
    notes: '',
    order
  };
}

/** Returns WorkoutExercise[] for the abs finisher (Plank, Crunches, Leg Raises, Bicycle Kicks). */
export function getAbsFinisherExercises(
  exercisesList: Exercise[],
  startOrder: number = 0
): WorkoutExercise[] {
  const ts = Date.now();
  return ABS_TEMPLATE.map((item, index) => {
    const exercise = findExercise(exercisesList, item.exerciseId);
    if (!exercise) return null;
    return toWorkoutExercise(item, exercise, startOrder + index + 1, `finisher-abs-${ts}-${index}`);
  }).filter((x): x is WorkoutExercise => x !== null);
}

/** Returns WorkoutExercise[] for the cardio finisher (Mountain Climbers, Burpees). */
export function getCardioFinisherExercises(
  exercisesList: Exercise[],
  startOrder: number = 0
): WorkoutExercise[] {
  const ts = Date.now();
  return CARDIO_TEMPLATE.map((item, index) => {
    const exercise = findExercise(exercisesList, item.exerciseId);
    if (!exercise) return null;
    return toWorkoutExercise(item, exercise, startOrder + index + 1, `finisher-cardio-${ts}-${index}`);
  }).filter((x): x is WorkoutExercise => x !== null);
}
