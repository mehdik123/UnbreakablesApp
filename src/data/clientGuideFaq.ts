export type GuideSectionId = 'start' | 'workout' | 'nutrition' | 'cardio' | 'progress' | 'offline' | 'troubleshoot';

export const CLIENT_GUIDE_SECTIONS: { id: GuideSectionId; faqIds: string[] }[] = [
  {
    id: 'start',
    faqIds: ['login', 'install', 'language', 'home'],
  },
  {
    id: 'workout',
    faqIds: ['openWorkout', 'logSets', 'save', 'weeks', 'exerciseVideos', 'completeExercise'],
  },
  {
    id: 'nutrition',
    faqIds: ['meals', 'supplements'],
  },
  {
    id: 'cardio',
    faqIds: ['cardioPlan'],
  },
  {
    id: 'progress',
    faqIds: ['weight', 'photos', 'charts'],
  },
  {
    id: 'offline',
    faqIds: ['offlineGym', 'syncPending'],
  },
  {
    id: 'troubleshoot',
    faqIds: ['noPlan', 'wrongWeek', 'contactCoach'],
  },
];
