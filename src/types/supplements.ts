export type SupplementCategory = 
  | 'protein'
  | 'amino_acids'
  | 'pre_workout'
  | 'vitamins'
  | 'minerals'
  | 'omega'
  | 'adaptogen'
  | 'recovery'
  | 'performance'
  | 'digestive'
  | 'fat_loss'
  | 'joint_health'
  | 'multivitamin';

export type SupplementTiming = 
  | 'morning'
  | 'pre_workout'
  | 'during_workout'
  | 'post_workout'
  | 'with_meal'
  | 'before_bed'
  | 'evening'
  | 'before_meal'
  | 'anytime';

export interface Supplement {
  id: string;
  name: string;
  category: SupplementCategory;
  description?: string;
  benefits: string[];
  recommended_timing: SupplementTiming;
  dosage_info?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ClientSupplement {
  id: string;
  client_id: string;
  supplement_id: string;
  supplement?: Supplement; // Joined data
  custom_timing?: SupplementTiming;
  custom_dosage?: string;
  notes?: string;
  is_active: boolean;
  assigned_at: Date;
  updated_at: Date;
}

export interface ClientHydration {
  id: string;
  client_id: string;
  target_water_ml: number;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

// Timing display helpers
export const timingLabels: Record<SupplementTiming, string> = {
  morning: '🌅 Morning',
  pre_workout: '💪 Pre-Workout (30min before)',
  during_workout: '🏋️ During Workout',
  post_workout: '✅ Post-Workout',
  with_meal: '🍽️ With Meal',
  before_bed: '🌙 Before Bed',
  evening: '🌆 Evening',
  before_meal: '⏰ Before Meal',
  anytime: '⚡ Anytime'
};

// Category display helpers
export const categoryLabels: Record<SupplementCategory, { label: string; emoji: string; color: string }> = {
  protein: { label: 'Protein', emoji: '🥛', color: 'blue' },
  amino_acids: { label: 'Amino Acids', emoji: '💪', color: 'purple' },
  pre_workout: { label: 'Pre-Workout', emoji: '⚡', color: 'red' },
  vitamins: { label: 'Vitamins', emoji: '🍊', color: 'orange' },
  minerals: { label: 'Minerals', emoji: '⚙️', color: 'slate' },
  omega: { label: 'Omega & Fats', emoji: '🐟', color: 'cyan' },
  adaptogen: { label: 'Adaptogens', emoji: '🌿', color: 'green' },
  recovery: { label: 'Recovery', emoji: '😴', color: 'indigo' },
  performance: { label: 'Performance', emoji: '🚀', color: 'pink' },
  digestive: { label: 'Digestive', emoji: '🦠', color: 'emerald' },
  fat_loss: { label: 'Fat Loss', emoji: '🔥', color: 'amber' },
  joint_health: { label: 'Joint Health', emoji: '🦴', color: 'teal' },
  multivitamin: { label: 'Multivitamin', emoji: '💊', color: 'violet' }
};

// Hydration calculation helpers (for future implementation)
export const calculateWaterIntake = (weight: number, activityLevel: 'sedentary' | 'moderate' | 'active' | 'very_active'): number => {
  // Base formula: weight (kg) × 35ml
  let baseIntake = weight * 35;
  
  // Adjust for activity level
  const activityMultipliers = {
    sedentary: 1.0,
    moderate: 1.15,
    active: 1.3,
    very_active: 1.5
  };
  
  return Math.round(baseIntake * activityMultipliers[activityLevel]);
};

// Group supplements by timing for display
export const groupSupplementsByTiming = (supplements: ClientSupplement[]): Record<SupplementTiming, ClientSupplement[]> => {
  const grouped: Record<string, ClientSupplement[]> = {};
  
  supplements.forEach(clientSupplement => {
    const timing = clientSupplement.custom_timing || clientSupplement.supplement?.recommended_timing || 'anytime';
    if (!grouped[timing]) {
      grouped[timing] = [];
    }
    grouped[timing].push(clientSupplement);
  });
  
  return grouped as Record<SupplementTiming, ClientSupplement[]>;
};

