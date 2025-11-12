import React from 'react';

// Base Skeleton Component
const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`animate-pulse bg-slate-700/50 rounded ${className}`} />
);

// Workout Day Skeleton
export const WorkoutDaySkeleton: React.FC = () => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-12 h-12 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-6" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
      <Skeleton className="w-20 h-8 rounded-lg" />
    </div>
    
    {[1, 2, 3].map((i) => (
      <div key={i} className="bg-slate-700/30 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="w-40 h-5" />
          <Skeleton className="w-16 h-5" />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
          <Skeleton className="h-10 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

// Meal Card Skeleton
export const MealCardSkeleton: React.FC = () => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
    <Skeleton className="w-full h-48" />
    <div className="p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <Skeleton className="w-3/4 h-6" />
          <Skeleton className="w-1/2 h-4" />
        </div>
        <Skeleton className="w-16 h-16 rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
        <Skeleton className="h-12 rounded-lg" />
      </div>
      <div className="flex space-x-2">
        <Skeleton className="flex-1 h-10 rounded-lg" />
        <Skeleton className="flex-1 h-10 rounded-lg" />
      </div>
    </div>
  </div>
);

// Nutrition Plan Skeleton
export const NutritionPlanSkeleton: React.FC = () => (
  <div className="space-y-6">
    {/* Header Stats */}
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 space-y-2">
          <Skeleton className="w-16 h-4" />
          <Skeleton className="w-20 h-8" />
        </div>
      ))}
    </div>
    
    {/* Meal Cards */}
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <MealCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// Weight Chart Skeleton
export const WeightChartSkeleton: React.FC = () => (
  <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 space-y-4">
    <div className="flex items-center justify-between">
      <div className="space-y-2">
        <Skeleton className="w-32 h-6" />
        <Skeleton className="w-48 h-4" />
      </div>
      <Skeleton className="w-24 h-10 rounded-lg" />
    </div>
    <Skeleton className="w-full h-64 rounded-xl" />
    <div className="grid grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="w-20 h-4" />
          <Skeleton className="w-full h-6" />
        </div>
      ))}
    </div>
  </div>
);

// Photo Grid Skeleton
export const PhotoGridSkeleton: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between px-1">
      <div className="flex items-center space-x-3">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-5" />
          <Skeleton className="w-24 h-4" />
        </div>
      </div>
    </div>
    <Skeleton className="w-full h-2 rounded-full" />
    <div className="grid grid-cols-3 gap-2 sm:gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
      ))}
    </div>
  </div>
);

// Analytics Skeleton
export const AnalyticsSkeleton: React.FC = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="w-24 h-5" />
            <Skeleton className="w-8 h-8 rounded-lg" />
          </div>
          <Skeleton className="w-full h-32 rounded-lg" />
          <div className="flex items-center justify-between">
            <Skeleton className="w-20 h-6" />
            <Skeleton className="w-16 h-4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Full Page Loading
export const FullPageSkeleton: React.FC = () => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-8" />
            <Skeleton className="w-32 h-4" />
          </div>
        </div>
        <Skeleton className="w-32 h-10 rounded-lg" />
      </div>
      
      {/* Tabs */}
      <div className="flex space-x-2 overflow-x-auto">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="flex-shrink-0 w-32 h-12 rounded-xl" />
        ))}
      </div>
      
      {/* Content */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="w-full h-48 rounded-2xl" />
        ))}
      </div>
    </div>
  </div>
);

// Compact Loading Spinner
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };
  
  return (
    <div className={`${sizeClasses[size]} border-2 border-slate-600 border-t-indigo-500 rounded-full animate-spin`} />
  );
};

// Loading Overlay
export const LoadingOverlay: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => (
  <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
    <div className="bg-slate-800/90 backdrop-blur-xl rounded-2xl p-8 text-center space-y-4 border border-slate-700/50">
      <LoadingSpinner size="lg" />
      <p className="text-white text-lg font-medium">{message}</p>
    </div>
  </div>
);

