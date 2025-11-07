import React from 'react';
import { 
  Utensils, 
  Dumbbell, 
  ChefHat, 
  Grid3X3, 
  ArrowLeft,
  Database,
  Search,
  Plus,
  BookOpen,
  Target
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
      description: 'Manage meal templates and recipes',
      icon: Utensils,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-500/10 to-blue-600/5',
      borderColor: 'border-blue-500/20',
      iconColor: 'text-blue-400',
      onClick: onNavigateToMealDatabase,
      stats: '500+ meals',
      features: ['Recipe templates', 'Nutrition calculation', 'Ingredient portions']
    },
    {
      id: 'exercises',
      title: 'Exercise Database',
      description: 'Manage exercise library and videos',
      icon: Dumbbell,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-500/10 to-purple-600/5',
      borderColor: 'border-purple-500/20',
      iconColor: 'text-purple-400',
      onClick: onNavigateToExerciseDatabase,
      stats: '200+ exercises',
      features: ['Video tutorials', 'Muscle targeting', 'Difficulty levels']
    },
    {
      id: 'ingredients',
      title: 'Ingredients Database',
      description: 'Manage food ingredients and nutrition',
      icon: ChefHat,
      color: 'from-green-500 to-green-600',
      bgColor: 'from-green-500/10 to-green-600/5',
      borderColor: 'border-green-500/20',
      iconColor: 'text-green-400',
      onClick: onNavigateToIngredients,
      stats: '1000+ ingredients',
      features: ['Nutrition data', 'Macro tracking', 'Custom additions']
    },
    {
      id: 'templates',
      title: 'Workout Templates',
      description: 'Manage workout program templates',
      icon: Grid3X3,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-500/10 to-orange-600/5',
      borderColor: 'border-orange-500/20',
      iconColor: 'text-orange-400',
      onClick: onNavigateToTemplates,
      stats: '50+ templates',
      features: ['Program templates', 'Day-by-day plans', 'Exercise configuration']
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center space-x-2">
                  <Database className="w-6 h-6 text-red-400" />
                  <span>Database Manager</span>
                </h1>
                <p className="text-slate-400 text-sm">Choose a database to manage</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Utensils className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">500+</p>
                <p className="text-xs text-slate-400">Meals</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Dumbbell className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">200+</p>
                <p className="text-xs text-slate-400">Exercises</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <ChefHat className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">1000+</p>
                <p className="text-xs text-slate-400">Ingredients</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
                <Grid3X3 className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">50+</p>
                <p className="text-xs text-slate-400">Templates</p>
              </div>
            </div>
          </div>
        </div>

        {/* Database Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
          {databases.map((db) => {
            const IconComponent = db.icon;
            return (
              <button
                key={db.id}
                onClick={db.onClick}
                className={`group relative bg-gradient-to-br ${db.bgColor} backdrop-blur-sm rounded-2xl p-6 border ${db.borderColor} hover:border-opacity-40 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl hover:shadow-${db.color.split('-')[1]}-500/10 text-left`}
              >
                {/* Background Pattern */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className={`w-12 h-12 bg-gradient-to-br ${db.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <IconComponent className={`w-6 h-6 ${db.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white group-hover:text-white/90 transition-colors">
                          {db.title}
                        </h3>
                        <p className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">
                          {db.stats}
                        </p>
                      </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                        <ArrowLeft className="w-4 h-4 text-white rotate-180" />
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-slate-300 text-sm mb-4 group-hover:text-white/80 transition-colors">
                    {db.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2">
                    {db.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                        <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                          {feature}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Action Indicator */}
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
                      Click to manage
                    </span>
                    <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <ArrowLeft className="w-3 h-3 text-white rotate-180" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mt-8 bg-slate-800/30 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
            <Target className="w-5 h-5 text-red-400" />
            <span>Quick Actions</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors duration-200">
              <Search className="w-5 h-5 text-blue-400" />
              <div className="text-left">
                <p className="text-white font-medium text-sm">Search All</p>
                <p className="text-slate-400 text-xs">Find across databases</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors duration-200">
              <Plus className="w-5 h-5 text-green-400" />
              <div className="text-left">
                <p className="text-white font-medium text-sm">Add New</p>
                <p className="text-slate-400 text-xs">Create new content</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors duration-200">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <div className="text-left">
                <p className="text-white font-medium text-sm">Templates</p>
                <p className="text-slate-400 text-xs">Browse templates</p>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseSelector;
