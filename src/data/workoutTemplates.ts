import { WorkoutTemplate, WorkoutDay, WorkoutExercise, WorkoutSet } from '../types';
import { exercises } from './exercises';

const createWorkoutDay = (id: string, name: string, exerciseNames: string[]): WorkoutDay => {
  return {
    id,
    name,
    exercises: exerciseNames.map((exerciseName, index) => {
      const exercise = exercises.find(e => e.name === exerciseName);
      if (!exercise) {
        console.error(`Exercise ${exerciseName} not found in database`);
        throw new Error(`Exercise ${exerciseName} not found`);
      }
      
      return {
        id: `${id}-${exercise.id}`,
        exercise,
        sets: [
          { id: `${id}-${exercise.id}-set-1`, reps: 8, weight: 50, completed: false, restPeriod: 90 },
          { id: `${id}-${exercise.id}-set-2`, reps: 8, weight: 50, completed: false, restPeriod: 90 },
          { id: `${id}-${exercise.id}-set-3`, reps: 8, weight: 50, completed: false, restPeriod: 90 }
        ],
        rest: '90 seconds',
        restPeriod: 90,
        notes: '',
        order: index + 1
      };
    })
  };
};

export const workoutTemplates: WorkoutTemplate[] = [
  // Push Pull Legs Templates
  {
    id: 'ppl-3-day',
    name: 'Push Pull Legs (3 Days)',
    description: 'Classic 3-day split focusing on push, pull, and leg movements',
    category: 'push-pull-legs',
    daysPerWeek: 3,
    difficulty: 'intermediate',
    duration: 12,
    days: [
      createWorkoutDay('push-day', 'Push Day', [
        'Flat Barbell Bench Press', 'Incline Barbell Bench Press', 'Incline Dumbbell Flyes', 'Seated Barbell Overhead Press', 'Standing Dumbbell Lateral Raises', 'Dips'
      ]),
      createWorkoutDay('pull-day', 'Pull Day', [
        'Deadlifts', 'Pull Ups', 'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns', 'Dumbbell Rear Delt Raises', 'Straight Bar Bicep Curls'
      ]),
      createWorkoutDay('legs-day', 'Legs Day', [
        'High Bar Back Squats', 'Leg Press', 'Dumbbell Romanian Deadlifts', 'Dumbbell Lunges', 'Plank', 'Crunches'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  },
  {
    id: 'ppl-6-day',
    name: 'Push Pull Legs (6 Days)',
    description: 'High-frequency 6-day split for advanced trainees',
    category: 'push-pull-legs',
    daysPerWeek: 6,
    difficulty: 'advanced',
    duration: 8,
    days: [
      createWorkoutDay('push-day-1', 'Push Day 1', [
        'Flat Barbell Bench Press', 'Incline Barbell Bench Press', 'Incline Dumbbell Flyes', 'Seated Barbell Overhead Press', 'Standing Dumbbell Lateral Raises', 'Dips'
      ]),
      createWorkoutDay('pull-day-1', 'Pull Day 1', [
        'Deadlifts', 'Pull Ups', 'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns', 'Dumbbell Rear Delt Raises', 'Straight Bar Bicep Curls'
      ]),
      createWorkoutDay('legs-day-1', 'Legs Day 1', [
        'High Bar Back Squats', 'Leg Press', 'Dumbbell Romanian Deadlifts', 'Dumbbell Lunges', 'Plank', 'Crunches'
      ]),
      createWorkoutDay('push-day-2', 'Push Day 2', [
        'Incline Barbell Bench Press', 'Chest Flyes', 'Push Ups', 'Cable Lateral Raises', 'Dumbbell Rear Delt Kickbacks', 'Dumbbell Hammer Curls'
      ]),
      createWorkoutDay('pull-day-2', 'Pull Day 2', [
        'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns', 'Chin Ups', 'Dumbbell Rear Delt Raises', 'Wide Grip EZ Bar Curls', 'Rope Triceps Extensions'
      ]),
      createWorkoutDay('legs-day-2', 'Legs Day 2', [
        'Leg Press', 'Dumbbell Lunges', 'Dumbbell Romanian Deadlifts', 'Mountain Climbers', 'Plank', 'Crunches'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  },

  // Arnold Split Templates
  {
    id: 'arnold-split-3-day',
    name: 'Arnold Split (3 Days)',
    description: 'Arnold Schwarzenegger\'s classic 3-day split routine',
    category: 'arnold-split',
    daysPerWeek: 3,
    difficulty: 'intermediate',
    duration: 12,
    days: [
      createWorkoutDay('chest-back', 'Chest & Back', [
        'Flat Barbell Bench Press', 'Incline Barbell Bench Press', 'Incline Dumbbell Flyes', 'Deadlifts', 'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns'
      ]),
      createWorkoutDay('shoulders-arms', 'Shoulders & Arms', [
        'Seated Barbell Overhead Press', 'Standing Dumbbell Lateral Raises', 'Dumbbell Rear Delt Raises', 'Straight Bar Bicep Curls', 'Dumbbell Hammer Curls', 'Dips'
      ]),
      createWorkoutDay('legs', 'Legs', [
        'High Bar Back Squats', 'Leg Press', 'Dumbbell Romanian Deadlifts', 'Dumbbell Lunges', 'Plank', 'Crunches'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  },
  {
    id: 'arnold-split-6-day',
    name: 'Arnold Split (6 Days)',
    description: 'High-frequency Arnold split for advanced bodybuilders',
    category: 'arnold-split',
    daysPerWeek: 6,
    difficulty: 'advanced',
    duration: 8,
    days: [
      createWorkoutDay('chest-back-1', 'Chest & Back 1', [
        'Flat Barbell Bench Press', 'Incline Barbell Bench Press', 'Incline Dumbbell Flyes', 'Deadlifts', 'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns'
      ]),
      createWorkoutDay('shoulders-arms-1', 'Shoulders & Arms 1', [
        'Seated Barbell Overhead Press', 'Standing Dumbbell Lateral Raises', 'Dumbbell Rear Delt Raises', 'Straight Bar Bicep Curls', 'Dumbbell Hammer Curls', 'Dips'
      ]),
      createWorkoutDay('legs-1', 'Legs 1', [
        'High Bar Back Squats', 'Leg Press', 'Dumbbell Romanian Deadlifts', 'Dumbbell Lunges', 'Plank', 'Crunches'
      ]),
      createWorkoutDay('chest-back-2', 'Chest & Back 2', [
        'Incline Barbell Bench Press', 'Chest Flyes', 'Push Ups', 'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns', 'Pull Ups'
      ]),
      createWorkoutDay('shoulders-arms-2', 'Shoulders & Arms 2', [
        'Cable Lateral Raises', 'Dumbbell Rear Delt Kickbacks', 'Seated Barbell Overhead Press', 'Wide Grip EZ Bar Curls', 'Rope Triceps Extensions', 'Dumbbell Hammer Curls'
      ]),
      createWorkoutDay('legs-2', 'Legs 2', [
        'Leg Press', 'Dumbbell Lunges', 'Dumbbell Romanian Deadlifts', 'Mountain Climbers', 'Plank', 'Crunches'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  },

  // Upper/Lower Templates
  {
    id: 'upper-lower-4-day',
    name: 'Upper/Lower (4 Days)',
    description: 'Balanced 4-day split alternating upper and lower body',
    category: 'upper-lower',
    daysPerWeek: 4,
    difficulty: 'intermediate',
    duration: 10,
    days: [
      createWorkoutDay('upper-1', 'Upper Body 1', [
        'Flat Barbell Bench Press', 'Seated Barbell Overhead Press', 'Barbell Bent Over Rows', 'Wide Grip Lat Pulldowns', 'Straight Bar Bicep Curls', 'Dips'
      ]),
      createWorkoutDay('lower-1', 'Lower Body 1', [
        'High Bar Back Squats', 'Leg Press', 'Dumbbell Romanian Deadlifts', 'Dumbbell Lunges', 'Plank', 'Crunches'
      ]),
      createWorkoutDay('upper-2', 'Upper Body 2', [
        'Incline Barbell Bench Press', 'Standing Dumbbell Lateral Raises', 'Dumbbell Rear Delt Raises', 'Pull Ups', 'Dumbbell Hammer Curls', 'Rope Triceps Extensions'
      ]),
      createWorkoutDay('lower-2', 'Lower Body 2', [
        'Deadlifts', 'Leg Press', 'Dumbbell Lunges', 'Mountain Climbers', 'Plank', 'Crunches'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  },

  // Full Body Templates
  {
    id: 'full-body-3-day',
    name: 'Full Body (3 Days)',
    description: 'Complete full-body workout 3 times per week',
    category: 'full-body',
    daysPerWeek: 3,
    difficulty: 'beginner',
    duration: 12,
    days: [
      createWorkoutDay('full-body-1', 'Full Body 1', [
        'High Bar Back Squats', 'Flat Barbell Bench Press', 'Barbell Bent Over Rows', 'Seated Barbell Overhead Press', 'Straight Bar Bicep Curls', 'Dips', 'Plank'
      ]),
      createWorkoutDay('full-body-2', 'Full Body 2', [
        'Deadlifts', 'Incline Barbell Bench Press', 'Wide Grip Lat Pulldowns', 'Standing Dumbbell Lateral Raises', 'Dumbbell Hammer Curls', 'Rope Triceps Extensions', 'Crunches'
      ]),
      createWorkoutDay('full-body-3', 'Full Body 3', [
        'Leg Press', 'Push Ups', 'Pull Ups', 'Dumbbell Rear Delt Raises', 'Wide Grip EZ Bar Curls', 'Overhead Cable Triceps Extensions', 'Mountain Climbers'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  },
  {
    id: 'full-body-4-day',
    name: 'Full Body (4 Days)',
    description: 'High-frequency full-body training for intermediate trainees',
    category: 'full-body',
    daysPerWeek: 4,
    difficulty: 'intermediate',
    duration: 8,
    days: [
      createWorkoutDay('full-body-1', 'Full Body 1', [
        'High Bar Back Squats', 'Flat Barbell Bench Press', 'Barbell Bent Over Rows', 'Seated Barbell Overhead Press', 'Straight Bar Bicep Curls', 'Dips', 'Plank'
      ]),
      createWorkoutDay('full-body-2', 'Full Body 2', [
        'Deadlifts', 'Incline Barbell Bench Press', 'Wide Grip Lat Pulldowns', 'Standing Dumbbell Lateral Raises', 'Dumbbell Hammer Curls', 'Rope Triceps Extensions', 'Crunches'
      ]),
      createWorkoutDay('full-body-3', 'Full Body 3', [
        'Leg Press', 'Push Ups', 'Pull Ups', 'Dumbbell Rear Delt Raises', 'Wide Grip EZ Bar Curls', 'Overhead Cable Triceps Extensions', 'Mountain Climbers'
      ]),
      createWorkoutDay('full-body-4', 'Full Body 4', [
        'Dumbbell Lunges', 'Chest Flyes', 'Barbell Bent Over Rows', 'Cable Lateral Raises', 'Close Grip EZ Bar Curls', 'Dumbbell Skull Crushers', 'Plank'
      ])
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
    isCustom: false
  }
];

export const getTemplatesByDaysPerWeek = (daysPerWeek: number) => {
  return workoutTemplates.filter(template => template.daysPerWeek === daysPerWeek);
};

export const getTemplatesByCategory = (category: string) => {
  return workoutTemplates.filter(template => template.category === category);
};

export const getTemplatesByDifficulty = (difficulty: string) => {
  return workoutTemplates.filter(template => template.difficulty === difficulty);
};