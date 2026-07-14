import type { Client, ClientWorkoutAssignment, NutritionPlan } from '../types';
import { normalizeCardioPlan } from './cardioPresets';

/** Rich demo client for Instagram / marketing screenshots (DEV only). */
export function getMarketingDemoClient(): Client {
  /** Demo YouTube form clips so marketing screenshots show the in-app form demo player. */
  const day = (
    name: string,
    exercises: { name: string; mg: string; sets: number; reps: number; weight: number; video?: string }[],
  ) => ({
    id: `day-${name}`,
    name,
    exercises: exercises.map((ex, i) => ({
      id: `ex-${name}-${i}`,
      exercise: {
        id: `base-${name}-${i}`,
        name: ex.name,
        muscleGroup: ex.mg,
        equipment: 'Barbell',
        difficulty: 'intermediate' as const,
        category: 'strength' as const,
        instructions: '',
        videoUrl: ex.video || 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
        primaryMuscles: [ex.mg],
        secondaryMuscles: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      sets: Array.from({ length: ex.sets }, (_, s) => ({
        id: `set-${name}-${i}-${s}`,
        reps: ex.reps + (s === 0 ? 0 : -1),
        weight: ex.weight + s * 2.5,
        completed: false,
      })),
      restTime: 90,
    })),
  });

  const weekDays = [
    day('Day 1', [
      { name: 'Barbell Bench Press', mg: 'Chest', sets: 4, reps: 8, weight: 80, video: 'https://www.youtube.com/watch?v=rT7DgCr-3pg' },
      { name: 'Incline Dumbbell Press', mg: 'Chest', sets: 3, reps: 10, weight: 32, video: 'https://www.youtube.com/watch?v=8iPEnn-ltC8' },
      { name: 'Cable Flys', mg: 'Chest', sets: 3, reps: 12, weight: 20, video: 'https://www.youtube.com/watch?v=Iwe6EpTBRqM' },
      { name: 'Lateral Raises', mg: 'Shoulders', sets: 3, reps: 15, weight: 12, video: 'https://www.youtube.com/watch?v=3VcKaXpzqRo' },
      { name: 'Rope Triceps Extensions', mg: 'Triceps', sets: 3, reps: 12, weight: 25, video: 'https://www.youtube.com/watch?v=vB5OHsJ3EME' },
      { name: 'Plank', mg: 'Core', sets: 3, reps: 45, weight: 0, video: 'https://www.youtube.com/watch?v=ASdvN_XEl_c' },
    ]),
    day('Day 2', [
      { name: 'Barbell Back Squat', mg: 'Quads', sets: 4, reps: 6, weight: 100, video: 'https://www.youtube.com/watch?v=ultWZbUMPL8' },
      { name: 'Romanian Deadlift', mg: 'Hamstrings', sets: 3, reps: 8, weight: 90, video: 'https://www.youtube.com/watch?v=jEy_czb3RKA' },
      { name: 'Walking Lunges', mg: 'Quads', sets: 3, reps: 10, weight: 24, video: 'https://www.youtube.com/watch?v=D7KaGlUzvxM' },
      { name: 'Leg Curl', mg: 'Hamstrings', sets: 3, reps: 12, weight: 45, video: 'https://www.youtube.com/watch?v=1Tq3QdYUu_I' },
      { name: 'Calf Raise', mg: 'Calves', sets: 4, reps: 15, weight: 60, video: 'https://www.youtube.com/watch?v=-M4-G8p8fmc' },
    ]),
    day('Day 3', [
      { name: 'Pull Ups', mg: 'Back', sets: 4, reps: 8, weight: 0, video: 'https://www.youtube.com/watch?v=eGo4IYlbE5g' },
      { name: 'Barbell Row', mg: 'Back', sets: 4, reps: 8, weight: 70, video: 'https://www.youtube.com/watch?v=FWJR5Ve8bnQ' },
      { name: 'Lat Pulldown', mg: 'Back', sets: 3, reps: 10, weight: 55, video: 'https://www.youtube.com/watch?v=CAwf7n6Luuc' },
      { name: 'Face Pulls', mg: 'Shoulders', sets: 3, reps: 15, weight: 20, video: 'https://www.youtube.com/watch?v=rep-AVujAy4' },
      { name: 'EZ Bar Curl', mg: 'Biceps', sets: 3, reps: 10, weight: 30, video: 'https://www.youtube.com/watch?v=ykJmrZ5v0Oo' },
    ]),
  ];

  const mkWeek = (n: number, unlocked: boolean) => ({
    weekNumber: n,
    isUnlocked: unlocked,
    isCompleted: n < 2,
    exercises: [],
    deployedAt: unlocked ? new Date().toISOString() : undefined,
    days: weekDays.map((d) => ({
      ...d,
      id: `w${n}-${d.id}`,
      exercises: d.exercises.map((ex) => ({
        ...ex,
        id: `w${n}-${ex.id}`,
        sets: ex.sets.map((s, si) => ({
          ...s,
          id: `w${n}-${ex.id}-s${si}`,
          weight: typeof s.weight === 'number' && s.weight > 0 ? s.weight + (n - 1) * 2.5 : s.weight,
        })),
      })),
    })),
  });

  const workoutAssignment: ClientWorkoutAssignment = {
    id: 'marketing-asg',
    clientId: 'marketing-demo',
    clientName: 'Alex',
    program: {
      id: 'prog-1',
      name: 'Unbreakables Strength',
      description: 'Progressive coaching program',
      days: weekDays as any,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    startDate: new Date(),
    duration: 8,
    currentWeek: 2,
    currentDay: 1,
    weeks: [mkWeek(1, true), mkWeek(2, true)] as any,
    progressionRules: [],
    isActive: true,
    lastModifiedBy: 'coach',
    lastModifiedAt: new Date(),
  };

  const img = (file: string) => `/marketing-food/${file}.png`;
  type Ing = { name: string; kcal: number; protein: number; fat: number; carbs: number; qty: number };
  const meal = (id: string, name: string, category: string, image: string, instr: string, ings: Ing[]) => ({
    id,
    meal: {
      id: `meal-${id}`,
      name,
      ingredients: ings.map((i) => ({
        food: { name: i.name, kcal: i.kcal, protein: i.protein, fat: i.fat, carbs: i.carbs },
        quantity: i.qty,
      })),
      cookingInstructions: instr,
      image,
      category,
    },
    quantity: 1,
    customizations: [],
  });

  const nutritionPlan: NutritionPlan = {
    id: 'nut-1',
    clientId: 'marketing-demo',
    clientName: 'Alex',
    mealsPerDay: 4,
    createdAt: new Date(),
    updatedAt: new Date(),
    // Lean-bulk day ≈ 2,850 kcal / ~185g protein. Each slot has 2 interchangeable versions.
    mealSlots: [
      {
        id: 'slot-1',
        slotName: 'Breakfast',
        selectedMeals: [
          meal(
            'bf-1', 'Oats, eggs & banana', 'breakfast', img('food-breakfast'),
            '1) Cook 90g oats with 250ml milk.\n2) Fry 3 whole eggs in 5g olive oil.\n3) Slice the banana on top of the oats and add the peanut butter.',
            [
              { name: 'Oats', kcal: 389, protein: 17, fat: 7, carbs: 66, qty: 90 },
              { name: 'Whole eggs', kcal: 155, protein: 13, fat: 11, carbs: 1, qty: 150 },
              { name: 'Banana', kcal: 89, protein: 1.1, fat: 0.3, carbs: 23, qty: 120 },
              { name: 'Peanut butter', kcal: 588, protein: 25, fat: 50, carbs: 20, qty: 20 },
              { name: 'Semi-skimmed milk', kcal: 50, protein: 3.4, fat: 1.8, carbs: 5, qty: 250 },
            ],
          ),
          meal(
            'bf-2', 'Greek yogurt & granola bowl', 'breakfast', img('food-snack'),
            '1) Add 300g Greek yogurt to a bowl.\n2) Top with granola, mixed berries and a drizzle of honey.',
            [
              { name: 'Greek yogurt 2%', kcal: 73, protein: 10, fat: 2, carbs: 4, qty: 300 },
              { name: 'Granola', kcal: 471, protein: 10, fat: 20, carbs: 64, qty: 60 },
              { name: 'Mixed berries', kcal: 43, protein: 1, fat: 0.3, carbs: 10, qty: 100 },
              { name: 'Honey', kcal: 304, protein: 0, fat: 0, carbs: 82, qty: 15 },
            ],
          ),
        ],
      },
      {
        id: 'slot-2',
        slotName: 'Lunch',
        selectedMeals: [
          meal(
            'ln-1', 'Chicken, rice & greens', 'lunch', img('food-lunch'),
            '1) Season and grill 200g chicken breast.\n2) Steam 250g cooked rice.\n3) Steam broccoli and finish with 10g olive oil.',
            [
              { name: 'Chicken breast', kcal: 165, protein: 31, fat: 3.6, carbs: 0, qty: 200 },
              { name: 'White rice (cooked)', kcal: 130, protein: 2.7, fat: 0.3, carbs: 28, qty: 250 },
              { name: 'Broccoli', kcal: 34, protein: 2.8, fat: 0.4, carbs: 7, qty: 150 },
              { name: 'Olive oil', kcal: 884, protein: 0, fat: 100, carbs: 0, qty: 10 },
            ],
          ),
          meal(
            'ln-2', 'Lean beef & potatoes', 'lunch', img('food-dinner'),
            '1) Pan-sear 180g lean beef mince.\n2) Roast 300g potatoes with 8g olive oil.\n3) Serve with a side salad.',
            [
              { name: 'Lean beef mince 5%', kcal: 137, protein: 21, fat: 5, carbs: 0, qty: 180 },
              { name: 'Potatoes', kcal: 77, protein: 2, fat: 0.1, carbs: 17, qty: 300 },
              { name: 'Olive oil', kcal: 884, protein: 0, fat: 100, carbs: 0, qty: 8 },
              { name: 'Mixed salad', kcal: 20, protein: 1.2, fat: 0.2, carbs: 3.5, qty: 120 },
            ],
          ),
        ],
      },
      {
        id: 'slot-3',
        slotName: 'Snack',
        selectedMeals: [
          meal(
            'sn-1', 'Protein shake & fruit', 'snack', img('food-snack'),
            '1) Blend 1 scoop whey with 300ml milk.\n2) Add a banana for extra carbs.',
            [
              { name: 'Whey protein', kcal: 400, protein: 80, fat: 7, carbs: 8, qty: 30 },
              { name: 'Semi-skimmed milk', kcal: 50, protein: 3.4, fat: 1.8, carbs: 5, qty: 300 },
              { name: 'Banana', kcal: 89, protein: 1.1, fat: 0.3, carbs: 23, qty: 100 },
            ],
          ),
          meal(
            'sn-2', 'Tuna sandwich', 'snack', img('food-lunch'),
            '1) Mix 1 can tuna with light mayo.\n2) Fill 2 slices wholegrain bread and add tomato.',
            [
              { name: 'Tuna (in water)', kcal: 116, protein: 26, fat: 1, carbs: 0, qty: 120 },
              { name: 'Wholegrain bread', kcal: 247, protein: 13, fat: 3.4, carbs: 41, qty: 80 },
              { name: 'Light mayonnaise', kcal: 300, protein: 1, fat: 30, carbs: 8, qty: 15 },
            ],
          ),
        ],
      },
      {
        id: 'slot-4',
        slotName: 'Dinner',
        selectedMeals: [
          meal(
            'dn-1', 'Salmon, sweet potato & avocado', 'dinner', img('food-dinner'),
            '1) Bake 200g salmon at 200°C for 15 min.\n2) Roast 200g sweet potato.\n3) Serve with sliced avocado.',
            [
              { name: 'Salmon fillet', kcal: 208, protein: 20, fat: 13, carbs: 0, qty: 200 },
              { name: 'Sweet potato', kcal: 86, protein: 1.6, fat: 0.1, carbs: 20, qty: 200 },
              { name: 'Avocado', kcal: 160, protein: 2, fat: 15, carbs: 9, qty: 80 },
            ],
          ),
          meal(
            'dn-2', 'Turkey pasta', 'dinner', img('food-lunch'),
            '1) Brown 180g turkey mince.\n2) Stir through tomato sauce.\n3) Serve over 220g cooked pasta.',
            [
              { name: 'Turkey mince', kcal: 148, protein: 22, fat: 7, carbs: 0, qty: 180 },
              { name: 'Pasta (cooked)', kcal: 158, protein: 6, fat: 0.9, carbs: 31, qty: 220 },
              { name: 'Tomato sauce', kcal: 32, protein: 1.6, fat: 0.5, carbs: 6, qty: 120 },
            ],
          ),
        ],
      },
    ],
  } as any;

  return {
    id: 'marketing-demo',
    name: 'Alex',
    email: 'alex@unbreakables.app',
    goal: 'bulking',
    numberOfWeeks: 8,
    startDate: new Date(),
    isActive: true,
    favorites: [],
    startingWeight: 78.2,
    weightLog: [
      { id: 'w1', clientId: 'marketing-demo', date: new Date(Date.now() - 14 * 86400000), weight: 78.2, weekNumber: 1 },
      { id: 'w2', clientId: 'marketing-demo', date: new Date(Date.now() - 7 * 86400000), weight: 78.8, weekNumber: 2 },
      { id: 'w3', clientId: 'marketing-demo', date: new Date(), weight: 79.1, weekNumber: 2 },
    ],
    nutritionPlan,
    workoutAssignment,
    cardioPlan: normalizeCardioPlan({
      items: [
        {
          id: 'c1',
          modality: 'incline_walk',
          name: 'Zone 2 incline walk',
          timesPerWeek: 3,
          durationMin: 30,
          speedKmh: 5,
          inclinePct: 8,
          when: 'after_workout',
        },
        {
          id: 'c2',
          modality: 'bike',
          name: 'Bike intervals',
          timesPerWeek: 1,
          durationMin: 20,
          when: 'off_day',
          workSec: 40,
          restSec: 20,
          rounds: 10,
        },
      ],
    }),
  };
}
