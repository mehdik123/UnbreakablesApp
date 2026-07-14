import { Client, ClientWorkoutAssignment, NutritionPlan, WorkoutWeek } from '../types';
import { WeekProgressionManager } from './weekProgressionManager';

export interface DuplicateClientOptions {
  name: string;
  numberOfWeeks: number;
}

const newId = (prefix: string) => `${prefix}_${crypto.randomUUID()}`;

function deepClone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

/** Clear set weights so the new client logs their own loads. */
function resetSetWeight(weight: number | number[] | undefined): number | number[] {
  if (Array.isArray(weight)) return weight.map(() => 0);
  return 0;
}

function resetSet(set: any): any {
  return {
    ...set,
    id: newId('set'),
    completed: false,
    weight: resetSetWeight(set.weight),
    ...(set.actualWeight !== undefined ? { actualWeight: 0 } : {}),
  };
}

function resetExercises(exercises: any[] | undefined): any[] {
  return (exercises || []).map((exercise: any) => ({
    ...exercise,
    id: newId('exercise'),
    sets: (exercise.sets || []).map(resetSet),
  }));
}

/** Reset completion flags and weights on workout days. */
function resetDaysProgress(days: any[] | undefined): any[] {
  return (days || []).map((day) => ({
    ...day,
    id: newId('day'),
    exercises: resetExercises(day.exercises),
  }));
}

/** Pick the richest week template (most days with exercises) from source weeks. */
function getBestWeekTemplate(weeks: WorkoutWeek[]): any[] {
  if (!weeks.length) return [];
  const scored = [...weeks].sort((a, b) => {
    const score = (w: WorkoutWeek) =>
      (w.days || []).reduce(
        (sum, d) => sum + ((d as any).exercises?.length || 0),
        0
      );
    return score(b) - score(a);
  });
  const best = scored.find((w) => w.days?.length) ?? scored[0];
  return deepClone(best.days || []);
}

function buildWeeksForDuration(
  sourceWeeks: WorkoutWeek[],
  programDays: any[],
  totalWeeks: number
): WorkoutWeek[] {
  const templateDays =
    sourceWeeks.length > 0
      ? getBestWeekTemplate(sourceWeeks)
      : resetDaysProgress(programDays);

  const sourceByNumber = new Map(
    sourceWeeks.map((w) => [w.weekNumber, w])
  );

  const weeks: WorkoutWeek[] = [];
  for (let i = 0; i < totalWeeks; i++) {
    const weekNumber = i + 1;
    const sourceWeek = sourceByNumber.get(weekNumber);
    const days = sourceWeek?.days?.length
      ? resetDaysProgress(sourceWeek.days)
      : resetDaysProgress(templateDays);

    weeks.push({
      weekNumber,
      isUnlocked: weekNumber === 1,
      isCompleted: false,
      exercises: resetExercises(sourceWeek?.exercises),
      days,
      startDate: weekNumber === 1 ? new Date() : undefined,
      completedAt: undefined,
      deployedAt: undefined,
      progressionNotes: sourceWeek?.progressionNotes,
    });
  }
  return weeks;
}

function buildDuplicatedWorkoutAssignment(
  source: ClientWorkoutAssignment,
  newClientId: string,
  newClientName: string,
  numberOfWeeks: number
): ClientWorkoutAssignment {
  const program = deepClone(source.program);
  const sourceWeeks = deepClone(source.weeks || program.weeks || []);

  const resetProgramDays = resetDaysProgress(program.days);
  const weeks = buildWeeksForDuration(
    sourceWeeks,
    resetProgramDays,
    numberOfWeeks
  );

  const programWithWeeks = {
    ...program,
    name: program.name || source.program?.name || 'Workout Program',
    days: weeks[0]?.days?.length ? weeks[0].days : resetProgramDays,
    weeks,
  };

  return {
    ...source,
    id: newId('assignment'),
    clientId: newClientId,
    clientName: newClientName,
    startDate: new Date(),
    duration: numberOfWeeks,
    currentWeek: 1,
    currentDay: 1,
    weeks,
    program: programWithWeeks,
    isActive: true,
    lastModifiedBy: 'coach',
    lastModifiedAt: new Date(),
    assignedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    clientPerformance: [],
  };
}

function buildDuplicatedNutritionPlan(
  source: NutritionPlan | undefined,
  newClientId: string,
  newClientName: string
): NutritionPlan | undefined {
  if (!source) return undefined;
  const plan = deepClone(source);
  return {
    ...plan,
    id: newId('nutrition'),
    clientId: newClientId,
    clientName: newClientName,
    createdAt: new Date(),
    updatedAt: new Date(),
    assignedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Build a new client record copied from an existing one, with program reset to week 1.
 */
export function buildDuplicatedClient(
  source: Client,
  options: DuplicateClientOptions
): Client {
  const newClientId = crypto.randomUUID();
  const { name, numberOfWeeks } = options;

  let workoutAssignment: ClientWorkoutAssignment | undefined;
  if (source.workoutAssignment) {
    workoutAssignment = buildDuplicatedWorkoutAssignment(
      source.workoutAssignment,
      newClientId,
      name,
      numberOfWeeks
    );
  } else if (source.numberOfWeeks > 0) {
    const emptyWeeks = WeekProgressionManager.initializeWeeks(
      numberOfWeeks,
      []
    );
    workoutAssignment = {
      id: newId('assignment'),
      clientId: newClientId,
      clientName: name,
      program: { id: newId('program'), name: 'Workout Program', days: [] },
      startDate: new Date(),
      duration: numberOfWeeks,
      currentWeek: 1,
      currentDay: 1,
      weeks: emptyWeeks,
      progressionRules: [],
      isActive: true,
      lastModifiedBy: 'coach',
      lastModifiedAt: new Date(),
    };
  }

  return {
    id: newClientId,
    name,
    email: '',
    phone: source.phone,
    goal: source.goal,
    numberOfWeeks,
    startDate: new Date(),
    isActive: true,
    favorites: [],
    weightLog: [],
    startingWeight: source.startingWeight,
    nutritionPlan: buildDuplicatedNutritionPlan(
      source.nutritionPlan,
      newClientId,
      name
    ),
    workoutAssignment,
  };
}
