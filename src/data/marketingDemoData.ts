/**
 * DEV-only canned data for the marketing preview client (id: 'marketing-demo').
 * Returned by service shims so weight, measurements, supplements and hydration
 * screens render realistic content for Instagram screenshots — production is
 * untouched because every shim is gated on the marketing-demo id.
 */
import type { WeightEntry, BodyMeasurement } from '../lib/progressTracking';
import type { ClientSupplement, ClientHydration } from '../types/supplements';

export const MARKETING_DEMO_ID = 'marketing-demo';

const daysAgo = (n: number) => new Date(Date.now() - n * 86400000);

/** Steady lean bulk: 78.2kg → 80.4kg over ~3 weeks, logged several days per week. */
export const marketingDemoWeightLogs: WeightEntry[] = [
  { id: 'mw-1', clientId: MARKETING_DEMO_ID, date: daysAgo(20), weight: 78.2, notes: '' },
  { id: 'mw-2', clientId: MARKETING_DEMO_ID, date: daysAgo(18), weight: 78.4, notes: '' },
  { id: 'mw-3', clientId: MARKETING_DEMO_ID, date: daysAgo(16), weight: 78.3, notes: '' },
  { id: 'mw-4', clientId: MARKETING_DEMO_ID, date: daysAgo(13), weight: 78.7, notes: '' },
  { id: 'mw-5', clientId: MARKETING_DEMO_ID, date: daysAgo(11), weight: 79.0, notes: '' },
  { id: 'mw-6', clientId: MARKETING_DEMO_ID, date: daysAgo(9), weight: 79.2, notes: '' },
  { id: 'mw-7', clientId: MARKETING_DEMO_ID, date: daysAgo(6), weight: 79.6, notes: '' },
  { id: 'mw-8', clientId: MARKETING_DEMO_ID, date: daysAgo(4), weight: 79.9, notes: '' },
  { id: 'mw-9', clientId: MARKETING_DEMO_ID, date: daysAgo(2), weight: 80.1, notes: '' },
  { id: 'mw-10', clientId: MARKETING_DEMO_ID, date: daysAgo(0), weight: 80.4, notes: '' },
];

const mkMeasurement = (
  week: number,
  ago: number,
  v: Partial<BodyMeasurement>,
): BodyMeasurement => ({
  id: `mm-${week}`,
  clientId: MARKETING_DEMO_ID,
  weekNumber: week,
  measurementDate: daysAgo(ago),
  createdAt: daysAgo(ago),
  updatedAt: daysAgo(ago),
  ...v,
});

export const marketingDemoMeasurements: BodyMeasurement[] = [
  mkMeasurement(1, 20, {
    bodyFatPercentage: 16.5, neck: 39, chest: 104, shoulders: 122,
    bicepLeft: 37.5, bicepRight: 38, waist: 84, hips: 98, thighLeft: 58, thighRight: 58.5,
  }),
  mkMeasurement(2, 13, {
    bodyFatPercentage: 15.8, neck: 39, chest: 105, shoulders: 123,
    bicepLeft: 38, bicepRight: 38.5, waist: 83.5, hips: 98, thighLeft: 58.5, thighRight: 59,
  }),
  mkMeasurement(3, 0, {
    bodyFatPercentage: 15.1, neck: 39.5, chest: 106.5, shoulders: 124.5,
    bicepLeft: 39, bicepRight: 39.5, waist: 82.5, hips: 98.5, thighLeft: 59.5, thighRight: 60,
  }),
];

export const getMarketingDemoMeasurementByWeek = (week: number): BodyMeasurement | null =>
  marketingDemoMeasurements.find((m) => m.weekNumber === week) ?? null;

const supp = (
  id: string,
  name: string,
  category: ClientSupplement['supplement'] extends infer S ? any : any,
  timing: any,
  dosage: string,
  description: string,
  benefits: string[],
): ClientSupplement => ({
  id: `ms-${id}`,
  client_id: MARKETING_DEMO_ID,
  supplement_id: `sup-${id}`,
  custom_timing: timing,
  custom_dosage: dosage,
  is_active: true,
  assigned_at: daysAgo(20),
  updated_at: daysAgo(2),
  supplement: {
    id: `sup-${id}`,
    name,
    category,
    description,
    benefits,
    recommended_timing: timing,
    dosage_info: dosage,
    created_at: daysAgo(30),
    updated_at: daysAgo(30),
  },
});

export const marketingDemoSupplements: ClientSupplement[] = [
  supp('whey', 'Whey Protein', 'protein', 'post_workout', '1 scoop (30g)',
    'Fast-digesting protein to hit your daily target.',
    ['Muscle recovery', 'Easy protein', 'Post-workout']),
  supp('creatine', 'Creatine Monohydrate', 'performance', 'anytime', '5g daily',
    'The most researched strength & size supplement.',
    ['Strength', 'Power output', 'Muscle fullness']),
  supp('omega', 'Omega-3 Fish Oil', 'omega', 'with_meal', '2 softgels',
    'EPA/DHA for recovery and joint health.',
    ['Joint health', 'Recovery', 'Heart health']),
  supp('vitd', 'Vitamin D3', 'vitamins', 'morning', '2000 IU',
    'Supports hormones, bones and immunity.',
    ['Immunity', 'Bone health', 'Mood']),
  supp('mag', 'Magnesium Glycinate', 'minerals', 'before_bed', '300mg',
    'Helps sleep quality and muscle relaxation.',
    ['Sleep', 'Recovery', 'Cramps']),
];

export const marketingDemoHydration: ClientHydration = {
  id: 'mh-1',
  client_id: MARKETING_DEMO_ID,
  target_water_ml: 3500,
  notes: '',
  created_at: daysAgo(20),
  updated_at: daysAgo(2),
};

/** Progress photos for physique comparison (week 1 vs week 3). */
export const marketingDemoPhotos = (() => {
  const mk = (id: string, week: number, type: 'front' | 'side' | 'back', file: string) => ({
    id,
    client_id: MARKETING_DEMO_ID,
    week,
    type,
    image_url: `/marketing-photos/${file}.png`,
    imageUrl: `/marketing-photos/${file}.png`,
    uploaded_at: daysAgo(week === 1 ? 20 : 0).toISOString(),
    uploadedAt: daysAgo(week === 1 ? 20 : 0),
  });
  return [
    mk('mp-w1-f', 1, 'front', 'w1-front'),
    mk('mp-w1-s', 1, 'side', 'w1-side'),
    mk('mp-w1-b', 1, 'back', 'w1-back'),
    mk('mp-w3-f', 3, 'front', 'w3-front'),
    mk('mp-w3-s', 3, 'side', 'w3-side'),
    mk('mp-w3-b', 3, 'back', 'w3-back'),
  ];
})();
