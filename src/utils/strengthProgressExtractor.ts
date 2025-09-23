import { WorkoutExercise, PersonalRecord, WorkoutProgram, WorkoutDay } from '../types';

// Major compound lifts that we want to track for PRs
export const MAJOR_LIFTS = [
  'bench-press',
  'squat', 
  'deadlift',
  'overhead-press',
  'barbell-row',
  'pull-ups',
  'dips',
  'incline-bench-press',
  'romanian-deadlift',
  'front-squat',
  'clean',
  'snatch',
  'push-press',
  'bent-over-row',
  'lat-pulldown',
  'military-press'
];

// Alternative names for the same exercises
export const EXERCISE_ALIASES: { [key: string]: string } = {
  'barbell-bench-press': 'bench-press',
  'flat-bench-press': 'bench-press',
  'back-squat': 'squat',
  'conventional-deadlift': 'deadlift',
  'ohp': 'overhead-press',
  'standing-press': 'overhead-press',
  'barbell-rows': 'barbell-row',
  'pendlay-row': 'barbell-row',
  'chin-ups': 'pull-ups',
  'weighted-dips': 'dips',
  'incline-press': 'incline-bench-press',
  'rdl': 'romanian-deadlift',
  'front-squats': 'front-squat',
  'power-clean': 'clean',
  'hang-clean': 'clean',
  'push-press': 'push-press',
  'bent-rows': 'bent-over-row',
  'lat-pull-down': 'lat-pulldown',
  'military-press': 'military-press'
};

export interface StrengthSession {
  id: string;
  date: Date;
  exerciseId: string;
  exerciseName: string;
  bestWeight: number;
  bestReps: number;
  totalVolume: number;
  sets: Array<{
    weight: number;
    reps: number;
    completed: boolean;
  }>;
  notes?: string;
}

export interface StrengthProgress {
  exerciseId: string;
  exerciseName: string;
  currentPR: PersonalRecord | null;
  allPRs: PersonalRecord[];
  sessions: StrengthSession[];
  progressData: Array<{
    date: Date;
    weight: number;
    reps: number;
    volume: number;
  }>;
  improvement: {
    weightGain: number;
    volumeGain: number;
    timeSpan: number; // days
  };
}

export class StrengthProgressExtractor {
  private personalRecords: PersonalRecord[] = [];
  private strengthSessions: StrengthSession[] = [];

  constructor(existingPRs: PersonalRecord[] = []) {
    this.personalRecords = [...existingPRs];
  }

  // Extract strength data from a workout program
  extractFromWorkoutProgram(program: WorkoutProgram, workoutDate: Date = new Date()): StrengthSession[] {
    const sessions: StrengthSession[] = [];

    program.days.forEach(day => {
      day.exercises.forEach(exercise => {
        if (this.isMajorLift(exercise.exercise.id)) {
          const session = this.extractStrengthSession(exercise, workoutDate);
          if (session) {
            sessions.push(session);
          }
        }
      });
    });

    return sessions;
  }

  // Extract strength data from a single workout day
  extractFromWorkoutDay(day: WorkoutDay, workoutDate: Date = new Date()): StrengthSession[] {
    const sessions: StrengthSession[] = [];

    day.exercises.forEach(exercise => {
      if (this.isMajorLift(exercise.exercise.id)) {
        const session = this.extractStrengthSession(exercise, workoutDate);
        if (session) {
          sessions.push(session);
        }
      }
    });

    return sessions;
  }

  // Extract strength data from a single exercise
  extractFromExercise(exercise: WorkoutExercise, workoutDate: Date = new Date()): StrengthSession | null {
    if (!this.isMajorLift(exercise.exercise.id)) {
      return null;
    }

    return this.extractStrengthSession(exercise, workoutDate);
  }

  private extractStrengthSession(exercise: WorkoutExercise, workoutDate: Date): StrengthSession | null {
    if (!exercise.sets || exercise.sets.length === 0) {
      return null;
    }

    // Filter out incomplete sets
    const completedSets = exercise.sets.filter(set => set.completed);
    if (completedSets.length === 0) {
      return null;
    }

    // Find the best weight and reps combination
    const bestSet = completedSets.reduce((best, current) => {
      // Prioritize by weight first, then by reps
      if (current.weight > best.weight) {
        return current;
      } else if (current.weight === best.weight && current.reps > best.reps) {
        return current;
      }
      return best;
    });

    // Calculate total volume
    const totalVolume = completedSets.reduce((total, set) => 
      total + (set.reps * Math.max(set.weight, 1)), 0
    );

    const session: StrengthSession = {
      id: `session-${Date.now()}-${Math.random()}`,
      date: workoutDate,
      exerciseId: this.normalizeExerciseId(exercise.exercise.id),
      exerciseName: exercise.exercise.name,
      bestWeight: bestSet.weight,
      bestReps: bestSet.reps,
      totalVolume,
      sets: completedSets.map(set => ({
        weight: set.weight,
        reps: set.reps,
        completed: set.completed
      })),
      notes: exercise.notes
    };

    this.strengthSessions.push(session);
    this.updatePersonalRecords(session);

    return session;
  }

  private isMajorLift(exerciseId: string): boolean {
    const normalizedId = this.normalizeExerciseId(exerciseId);
    return MAJOR_LIFTS.includes(normalizedId);
  }

  private normalizeExerciseId(exerciseId: string): string {
    // Check if it's already a major lift
    if (MAJOR_LIFTS.includes(exerciseId)) {
      return exerciseId;
    }

    // Check aliases
    if (EXERCISE_ALIASES[exerciseId]) {
      return EXERCISE_ALIASES[exerciseId];
    }

    return exerciseId;
  }

  private updatePersonalRecords(session: StrengthSession): void {
    const existingPR = this.personalRecords.find(pr => 
      pr.exerciseId === session.exerciseId
    );

    // Check if this is a new PR
    const isNewPR = !existingPR || 
      session.bestWeight > existingPR.weight ||
      (session.bestWeight === existingPR.weight && session.bestReps > existingPR.reps);

    if (isNewPR) {
      const newPR: PersonalRecord = {
        id: `pr-${Date.now()}-${Math.random()}`,
        exerciseId: session.exerciseId,
        exerciseName: session.exerciseName,
        weight: session.bestWeight,
        reps: session.bestReps,
        date: session.date,
        notes: `New PR! Previous: ${existingPR ? `${existingPR.weight}kg x ${existingPR.reps}` : 'None'}`
      };

      // Remove old PR if exists
      if (existingPR) {
        this.personalRecords = this.personalRecords.filter(pr => pr.id !== existingPR.id);
      }

      this.personalRecords.push(newPR);
    }
  }

  // Get strength progress for a specific exercise
  getStrengthProgress(exerciseId: string): StrengthProgress | null {
    const normalizedId = this.normalizeExerciseId(exerciseId);
    const sessions = this.strengthSessions.filter(session => session.exerciseId === normalizedId);
    
    if (sessions.length === 0) {
      return null;
    }

    const currentPR = this.personalRecords.find(pr => pr.exerciseId === normalizedId) || null;
    const allPRs = this.personalRecords.filter(pr => pr.exerciseId === normalizedId);

    // Sort sessions by date
    sessions.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Create progress data for charting
    const progressData = sessions.map(session => ({
      date: session.date,
      weight: session.bestWeight,
      reps: session.bestReps,
      volume: session.totalVolume
    }));

    // Calculate improvements
    const firstSession = sessions[0];
    const lastSession = sessions[sessions.length - 1];
    const timeSpan = Math.ceil((lastSession.date.getTime() - firstSession.date.getTime()) / (1000 * 60 * 60 * 24));

    const improvement = {
      weightGain: lastSession.bestWeight - firstSession.bestWeight,
      volumeGain: lastSession.totalVolume - firstSession.totalVolume,
      timeSpan
    };

    return {
      exerciseId: normalizedId,
      exerciseName: sessions[0].exerciseName,
      currentPR,
      allPRs,
      sessions,
      progressData,
      improvement
    };
  }

  // Get all strength progress data
  getAllStrengthProgress(): StrengthProgress[] {
    const exerciseIds = [...new Set(this.strengthSessions.map(session => session.exerciseId))];
    return exerciseIds
      .map(exerciseId => this.getStrengthProgress(exerciseId))
      .filter(progress => progress !== null) as StrengthProgress[];
  }

  // Get recent PRs (last 30 days)
  getRecentPRs(days: number = 30): PersonalRecord[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return this.personalRecords.filter(pr => pr.date >= cutoffDate);
  }

  // Get PRs for a specific exercise
  getPRsForExercise(exerciseId: string): PersonalRecord[] {
    const normalizedId = this.normalizeExerciseId(exerciseId);
    return this.personalRecords.filter(pr => pr.exerciseId === normalizedId);
  }

  // Get all personal records
  getAllPersonalRecords(): PersonalRecord[] {
    return [...this.personalRecords];
  }

  // Get all strength sessions
  getAllStrengthSessions(): StrengthSession[] {
    return [...this.strengthSessions];
  }
}

// Utility function to create a strength progress extractor
export function createStrengthProgressExtractor(existingPRs: PersonalRecord[] = []): StrengthProgressExtractor {
  return new StrengthProgressExtractor(existingPRs);
}

// Utility function to extract strength data from workout
export function extractStrengthFromWorkout(
  program: WorkoutProgram, 
  workoutDate: Date = new Date(),
  existingPRs: PersonalRecord[] = []
): { sessions: StrengthSession[], newPRs: PersonalRecord[] } {
  const extractor = createStrengthProgressExtractor(existingPRs);
  const sessions = extractor.extractFromWorkoutProgram(program, workoutDate);
  const newPRs = extractor.getAllPersonalRecords();
  
  return { sessions, newPRs };
}



