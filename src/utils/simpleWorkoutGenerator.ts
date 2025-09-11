import { WorkoutProgram, WorkoutExercise, WorkoutSet } from '../types';
import { exercises } from '../data/exercises';

// Simple workout templates using your CSV exercise data
const workoutTemplates = {
  '3-day-push-pull-legs': {
    name: '3-Day Push/Pull/Legs',
    days: [
      {
        name: 'Push Day',
        exercises: [
          'Bench Press',
          'Incline Dumbbell Press', 
          'Dumbbell Flyes',
          'Overhead Press',
          'Lateral Raises',
          'Tricep Dips'
        ]
      },
      {
        name: 'Pull Day', 
        exercises: [
          'Deadlifts',
          'Pull-ups',
          'Barbell Rows',
          'Lat Pulldowns',
          'Bicep Curls',
          'Hammer Curls'
        ]
      },
      {
        name: 'Legs Day',
        exercises: [
          'Squats',
          'Romanian Deadlifts',
          'Leg Press',
          'Walking Lunges',
          'Calf Raises',
          'Leg Curls'
        ]
      }
    ]
  }
};

export const createSimpleWorkoutProgram = (templateName: string = '3-day-push-pull-legs'): WorkoutProgram => {
  const template = workoutTemplates[templateName as keyof typeof workoutTemplates];
  
  if (!template) {
    throw new Error(`Template ${templateName} not found`);
  }

  const days = template.days.map((day, dayIndex) => ({
    id: `day-${dayIndex}`,
    name: day.name,
    exercises: day.exercises.map((exerciseName, exerciseIndex) => {
      const exercise = exercises.find(ex => ex.name === exerciseName);
      
      if (!exercise) {
        console.warn(`Exercise ${exerciseName} not found in database`);
        return null;
      }

      return {
        id: `exercise-${dayIndex}-${exerciseIndex}`,
        name: exercise.name,
        exercise: exercise,
        sets: [
          { id: `set-${dayIndex}-${exerciseIndex}-1`, reps: 8, weight: 0 },
          { id: `set-${dayIndex}-${exerciseIndex}-2`, reps: 8, weight: 0 },
          { id: `set-${dayIndex}-${exerciseIndex}-3`, reps: 8, weight: 0 }
        ]
      } as WorkoutExercise;
    }).filter(Boolean) as WorkoutExercise[]
  }));

  return {
    id: `workout-${Date.now()}`,
    name: template.name,
    days: days
  };
};
