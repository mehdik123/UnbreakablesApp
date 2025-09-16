export interface Food {
  name: string;
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
}

export interface Ingredient {
  food: Food;
  quantity: number; // in grams
}

export interface Meal {
  id: string;
  name: string;
  ingredients: Ingredient[];
  cookingInstructions: string;
  image: string;
  category: 'breakfast' | 'lunch' | 'dinner' | 'snack';
}

export interface SelectedMeal {
  id: string;
  meal: Meal;
  quantity: number;
  customizations: any[];
}

export interface MealSlot {
  id: string;
  name: string;
  selectedMeals: SelectedMeal[];
}

export interface NutritionPlan {
  id: string;
  clientId: string;
  clientName: string;
  mealsPerDay: number;
  mealSlots: MealSlot[];
  createdAt: Date;
  updatedAt: Date;
  shareUrl?: string;
}

export interface NutritionSummary {
  totalKcal: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
}

// Client Management Types
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  goal: 'shredding' | 'bulking' | 'maintenance';
  numberOfWeeks: number;
  startDate: Date;
  isActive: boolean;
  favorites: string[]; // meal IDs
  weightLog: WeightEntry[];
  nutritionPlan?: NutritionPlan;
  workoutAssignment?: ClientWorkoutAssignment;
  shareUrl?: string;
}

export interface WeightEntry {
  id: string;
  date: Date;
  weight: number;
  notes?: string;
}

// Progress Tracking Types
export interface TrainingVolumeData {
  id: string;
  clientId: string;
  weekNumber: number;
  muscleGroup: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
  totalSets: number;
  totalReps: number;
  totalVolume: number; // weight * reps total
  volumeChangePercent?: number; // percentage change from previous week
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalRecord {
  id: string;
  clientId: string;
  exerciseName: 'bench_press' | 'squat' | 'deadlift' | 'pull_ups' | 'dips' | 'bicep_curls';
  weekNumber: number;
  bestSetWeight: number;
  bestSetReps: number;
  totalVolume: number; // weight * reps for the best set
  dateAchieved: Date;
  notes?: string;
  createdAt: Date;
}

export interface WeeklyPerformanceSummary {
  id: string;
  clientId: string;
  weekNumber: number;
  startDate: Date;
  endDate: Date;
  isCompleted: boolean;
  completedAt?: Date;
  totalWorkoutsCompleted: number;
  totalSetsCompleted: number;
  totalVolume: number;
  averageWeight?: number; // average weight for the week
  weightChange?: number; // weight change from previous week
  prCount: number; // number of PRs achieved this week
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ExercisePerformanceLog {
  id: string;
  clientId: string;
  workoutAssignmentId?: string;
  exerciseName: string;
  muscleGroup: string;
  weekNumber: number;
  dayNumber: number;
  setNumber: number;
  plannedReps: number;
  actualReps: number;
  plannedWeight: number;
  actualWeight: number;
  rpe?: number; // Rate of Perceived Exertion (1-10)
  notes?: string;
  loggedAt: Date;
}

export interface ProgressTrackingData {
  weightLogs: WeightEntry[];
  trainingVolume: TrainingVolumeData[];
  personalRecords: PersonalRecord[];
  weeklyPerformance: WeeklyPerformanceSummary[];
  exerciseLogs: ExercisePerformanceLog[];
}

// Workout Types
export interface Exercise {
  id: string;
  name: string;
  muscleGroup: string;
  equipment: string;
  instructions: string;
  videoUrl?: string;
  imageUrl?: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'strength' | 'cardio' | 'flexibility' | 'sports';
  primaryMuscles: string[];
  secondaryMuscles: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  category: 'push-pull-legs' | 'arnold-split' | 'upper-lower' | 'full-body' | 'custom';
  daysPerWeek: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in weeks
  days: WorkoutDay[];
  createdAt: Date;
  updatedAt: Date;
  isCustom: boolean;
  createdBy?: string; // coach ID
}

export interface WorkoutSet {
  id: string;
  reps: number;
  weight: number;
  completed: boolean;
  restPeriod?: number; // in seconds
  notes?: string;
  rpe?: number; // Rate of Perceived Exertion 1-10
}

export interface WorkoutExercise {
  id: string;
  exercise: Exercise;
  sets: WorkoutSet[];
  rest: string;
  restPeriod?: number; // in seconds
  notes?: string;
  order: number; // for ordering exercises in a workout
  superset?: string; // ID of superset group
}

export interface WorkoutDay {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
}

export interface WorkoutProgram {
  id: string;
  name: string;
  description: string;
  days: WorkoutDay[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutWeek {
  weekNumber: number;
  isUnlocked: boolean;
  isCompleted: boolean;
  exercises: WorkoutExercise[];
  progressionNotes?: string;
  completedAt?: Date;
  startDate?: Date;
  days: WorkoutDay[];
}

export interface ClientWorkoutAssignment {
  id: string;
  clientId: string;
  clientName: string;
  program: WorkoutProgram;
  startDate: Date;
  duration: number; // in weeks
  currentWeek: number;
  currentDay: number;
  weeks: WorkoutWeek[];
  progressionRules: ProgressionRule[];
  isActive: boolean;
  shareUrl?: string;
  lastModifiedBy?: 'coach' | 'client';
  lastModifiedAt?: Date;
  assignedAt?: string;
  lastUpdated?: string;
  clientPerformance?: any[];
}

export interface ProgressionRule {
  id: string;
  condition: string;
  action: string;
  target: string;
  value: number;
}

// App State Types
export interface AppState {
  currentView: 'clients' | 'client-plan' | 'client-view' | 'meal-database';
  selectedClient: Client | null;
  clients: Client[];
  isDark: boolean;
}

// Client View Types (for shared links)
export interface ClientNutritionView {
  clientName: string;
  nutritionPlan: NutritionPlan;
  isReadOnly: boolean;
}

export interface ClientWorkoutView {
  clientName: string;
  workoutAssignment: ClientWorkoutAssignment;
  isReadOnly: boolean;
  canEditRepsWeights: boolean;
}