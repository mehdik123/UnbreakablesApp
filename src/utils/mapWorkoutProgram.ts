import { WorkoutProgram } from '../types';

/** Map a workout_programs DB row (from dbListWorkoutPrograms) to WorkoutProgram */
export function mapDbProgramToWorkoutProgram(program: any): WorkoutProgram {
  if (program.program_json && Array.isArray(program.program_json.days)) {
    return {
      ...program.program_json,
      id: program.id,
      name: program.name || program.program_json.name || 'Custom Program',
      description: program.description || program.program_json.description || '',
      createdAt: new Date(program.created_at || Date.now()),
      updatedAt: new Date(program.updated_at || Date.now()),
    } as WorkoutProgram;
  }

  return {
    id: program.id,
    name: program.name,
    description: program.description || '',
    days: (program.workout_days || []).map((day: any) => ({
      id: day.id,
      name: day.name,
      exercises: (day.workout_exercises || []).map((workoutExercise: any) => ({
        id: `${day.id}-${workoutExercise.id}`,
        exercise: {
          id: workoutExercise.exercises?.id || workoutExercise.exercise_id,
          name:
            workoutExercise.exercises?.name ||
            workoutExercise.exercise_id ||
            'Unknown Exercise',
          muscleGroup: workoutExercise.exercises?.muscle_group || '',
          videoUrl: workoutExercise.exercises?.video_url || '',
          equipment: '',
          instructions: '',
          difficulty: 'intermediate' as const,
          category: 'strength' as const,
          primaryMuscles: [],
          secondaryMuscles: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        sets: (workoutExercise.workout_sets || []).map((set: any) => ({
          id: `${workoutExercise.id}-set-${set.set_order}`,
          reps: set.reps,
          weight: set.weight,
          completed: false,
          restPeriod: set.rest_seconds || 120,
        })),
        rest: workoutExercise.rest || '120 seconds',
        restPeriod: parseInt(
          workoutExercise.rest?.replace(/[^0-9]/g, '') || '120',
          10
        ),
        notes: workoutExercise.notes || '',
        order: workoutExercise.ex_order,
      })),
    })),
    createdAt: new Date(program.created_at || Date.now()),
    updatedAt: new Date(program.updated_at || Date.now()),
  } as WorkoutProgram;
}
