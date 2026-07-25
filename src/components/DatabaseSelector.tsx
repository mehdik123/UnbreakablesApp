import React from 'react';
import { 
  Utensils, 
  Dumbbell, 
  ChefHat, 
  Grid3X3, 
  ArrowLeft,
  ArrowRight,
  Database
} from 'lucide-react';

interface DatabaseSelectorProps {
  onBack: () => void;
  onNavigateToMealDatabase: () => void;
  onNavigateToExerciseDatabase: () => void;
  onNavigateToIngredients: () => void;
  onNavigateToTemplates: () => void;
}

export const DatabaseSelector: React.FC<DatabaseSelectorProps> = ({
  onBack,
  onNavigateToMealDatabase,
  onNavigateToExerciseDatabase,
  onNavigateToIngredients,
  onNavigateToTemplates
}) => {
  const databases = [
    {
      id: 'meals',
      title: 'Meal Database',
      description: 'Recipes, portions and nutrition per meal',
      icon: Utensils,
      accent: 'var(--green)',
      onClick: onNavigateToMealDatabase,
      features: ['Recipe templates', 'Nutrition calculation', 'Ingredient portions']
    },
    {
      id: 'exercises',
      title: 'Exercise Database',
      description: 'Exercise library, videos and muscle targets',
      icon: Dumbbell,
      accent: 'var(--red)',
      onClick: onNavigateToExerciseDatabase,
      features: ['Video tutorials', 'Muscle targeting', 'Difficulty levels']
    },
    {
      id: 'ingredients',
      title: 'Ingredients Database',
      description: 'Foods and their macros per 100g',
      icon: ChefHat,
      accent: 'var(--orange)',
      onClick: onNavigateToIngredients,
      features: ['Nutrition data', 'Macro tracking', 'Custom additions']
    },
    {
      id: 'templates',
      title: 'Workout Templates',
      description: 'Reusable programs you assign to clients',
      icon: Grid3X3,
      accent: 'var(--blue)',
      onClick: onNavigateToTemplates,
      features: ['Program templates', 'Day-by-day plans', 'Exercise configuration']
    }
  ];

  return (
    <div className="coach-plan">
      {/* Header */}
      <div className="coach-plan-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="coach-plan-headrow">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={onBack}
                className="coach-touch rounded-xl text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-all duration-200"
                title="Back"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-2xl font-bold font-display text-[color:var(--txt-hi)] flex items-center gap-2">
                  <Database className="w-5 h-5 text-[color:var(--red)]" />
                  <span className="truncate">Database Manager</span>
                </h1>
                <p className="text-[color:var(--txt-lo)] text-[11px] sm:text-sm">Choose a database to manage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-5">
          {databases.map((db) => {
            const IconComponent = db.icon;
            return (
              <button
                key={db.id}
                onClick={db.onClick}
                className="coach-db-card"
                style={{ ['--card-accent' as string]: db.accent } as React.CSSProperties}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="coach-db-icon">
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base sm:text-lg font-bold font-display text-[color:var(--txt-hi)] truncate">
                        {db.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-[color:var(--txt-lo)]">
                        {db.description}
                      </p>
                    </div>
                  </div>
                  <span className="coach-db-go">
                    <ArrowRight className="w-4 h-4" />
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {db.features.map((feature) => (
                    <span key={feature} className="coach-db-chip">
                      {feature}
                    </span>
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSelector;
