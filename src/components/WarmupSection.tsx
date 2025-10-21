import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle, 
  ChevronDown, 
  ChevronUp,
  Target,
  Timer,
  Zap,
  Clock
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface WarmupExercise {
  id: string;
  name: string;
  description: string;
  duration_seconds: number;
  muscle_groups: string[];
  instructions: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  equipment: string;
  image_url?: string;
  video_url?: string;
}

interface WarmupSectionProps {
  muscleGroups: string[];
  onComplete?: () => void;
}

export const WarmupSection: React.FC<WarmupSectionProps> = ({ 
  muscleGroups, 
  onComplete 
}) => {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [currentExercise, setCurrentExercise] = useState<WarmupExercise | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null);
  const [warmupExercises, setWarmupExercises] = useState<WarmupExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch warmup exercises from database
  useEffect(() => {
    const fetchWarmupExercises = async () => {
      if (!supabase) {
        setError('Database not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Use the database function to get warmup exercises for the specified muscle groups
        const { data, error: dbError } = await supabase
          .rpc('get_warmup_exercises_for_muscles', {
            target_muscles: muscleGroups
          });

        if (dbError) {
          console.error('Error fetching warmup exercises:', dbError);
          setError('Failed to load warmup exercises');
          return;
        }

        if (data) {
          setWarmupExercises(data);
        } else {
          setWarmupExercises([]);
        }
      } catch (err) {
        console.error('Error fetching warmup exercises:', err);
        setError('Failed to load warmup exercises');
      } finally {
        setLoading(false);
      }
    };

    fetchWarmupExercises();
  }, [muscleGroups]);

  const pauseExercise = () => {
    setIsPlaying(false);
  };

  const resumeExercise = () => {
    setIsPlaying(true);
  };

  const resetExercise = () => {
    if (currentExercise) {
      setTimeRemaining(currentExercise.duration_seconds);
      setIsPlaying(false);
    }
  };

  const completeExercise = () => {
    if (currentExercise) {
      setCompletedExercises(prev => new Set([...prev, currentExercise!.id]));
      setCurrentExercise(null);
      setIsPlaying(false);
      setTimeRemaining(0);
    }
  };

  // Timer effect
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsPlaying(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeRemaining]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const colors: { [key: string]: string } = {
      'CHEST': 'from-red-500 to-orange-500',
      'BACK': 'from-blue-500 to-cyan-500',
      'SHOULDERS': 'from-green-500 to-emerald-500',
      'TRICEPS': 'from-purple-500 to-pink-500',
      'BICEPS': 'from-yellow-500 to-orange-500',
      'LEGS': 'from-indigo-500 to-purple-500',
      'ABS': 'from-pink-500 to-rose-500',
      'CALVES': 'from-teal-500 to-cyan-500',
      'FOREARMS': 'from-amber-500 to-yellow-500',
      'CARDIO': 'from-gray-500 to-slate-500'
    };
    return colors[muscleGroup.toUpperCase()] || 'from-gray-500 to-slate-500';
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: { [key: string]: string } = {
      'beginner': 'from-green-500 to-emerald-500',
      'intermediate': 'from-yellow-500 to-orange-500',
      'advanced': 'from-red-500 to-pink-500'
    };
    return colors[difficulty] || 'from-gray-500 to-slate-500';
  };

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <h3 className="text-xl font-bold text-white mb-2">Loading Warmup Exercises</h3>
          <p className="text-slate-400">Please wait while we load your personalized warmup...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-red-500/50 p-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Error Loading Warmups</h3>
          <p className="text-slate-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (warmupExercises.length === 0) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
        <div className="text-center">
          <Target className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Warmup Exercises</h3>
          <p className="text-slate-400">
            No specific warmup exercises found for the muscle groups: {muscleGroups.join(', ')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Compact Mobile Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-800/80 via-slate-900/60 to-slate-800/80 backdrop-blur-xl rounded-xl md:rounded-3xl border border-slate-700/50 p-3 md:p-8 shadow-2xl">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-16 md:w-64 h-16 md:h-64 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full -translate-y-8 md:-translate-y-32 translate-x-8 md:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-12 md:w-48 h-12 md:h-48 bg-gradient-to-tr from-yellow-500/20 to-orange-500/20 rounded-full translate-y-6 md:translate-y-24 -translate-x-6 md:-translate-x-24"></div>
          <div className="absolute top-1/2 left-1/2 w-8 md:w-32 h-8 md:h-32 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-full -translate-x-4 md:-translate-x-16 -translate-y-4 md:-translate-y-16"></div>
        </div>

        <div className="relative">
          {/* Mobile: Stack vertically, Desktop: Side by side */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-3 md:mb-6 space-y-3 md:space-y-0">
            <div className="flex items-center space-x-2 md:space-x-4">
              <div className="relative w-10 h-10 md:w-16 md:h-16 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg md:rounded-2xl flex items-center justify-center shadow-2xl">
                <Zap className="w-5 h-5 md:w-8 md:h-8 text-white" />
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg md:rounded-2xl blur-lg opacity-50"></div>
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg md:text-3xl font-black text-white mb-1 md:mb-2 bg-gradient-to-r from-white via-orange-100 to-yellow-100 bg-clip-text text-transparent">
                  WARMUP CENTER
                </h2>
                <p className="text-slate-300 text-xs md:text-lg font-semibold">Prepare your muscles for peak performance</p>
              </div>
            </div>
            <div className="text-center md:text-right">
              <div className="text-xl md:text-4xl font-black text-white mb-1">
                {completedExercises.size}/{warmupExercises.length}
              </div>
              <div className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-wider">Completed</div>
            </div>
          </div>

          {/* Muscle Groups - Mobile optimized spacing */}
          <div className="flex flex-wrap gap-1.5 md:gap-3">
            {muscleGroups.map((muscle, index) => (
              <span
                key={index}
                className={`px-2 md:px-4 py-1 md:py-2 rounded-lg md:rounded-2xl text-xs md:text-sm font-black bg-gradient-to-r ${getMuscleGroupColor(muscle)} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 uppercase tracking-wide`}
              >
                {muscle}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Compact Mobile Timer */}
      {currentExercise && (
        <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-xl md:rounded-2xl border border-orange-500/30 p-3 md:p-6">
          <div className="text-center">
            <h3 className="text-base md:text-xl font-bold text-white mb-2 px-2 truncate">{currentExercise.name}</h3>
            <div className="text-2xl md:text-4xl font-bold text-orange-400 mb-3 md:mb-4">
              {formatTime(timeRemaining)}
            </div>
            {/* Mobile: Stack buttons vertically, Desktop: Horizontal */}
            <div className="flex flex-col sm:flex-row justify-center gap-2 md:gap-4">
              {isPlaying ? (
                <button
                  onClick={pauseExercise}
                  className="px-3 md:px-6 py-2 md:py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg md:rounded-xl font-semibold transition-colors flex items-center justify-center space-x-1 md:space-x-2 min-h-[40px] md:min-h-[48px] text-sm md:text-base"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  onClick={resumeExercise}
                  className="px-3 md:px-6 py-2 md:py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg md:rounded-xl font-semibold transition-colors flex items-center justify-center space-x-1 md:space-x-2 min-h-[40px] md:min-h-[48px] text-sm md:text-base"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
              )}
              <button
                onClick={resetExercise}
                className="px-3 md:px-6 py-2 md:py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg md:rounded-xl font-semibold transition-colors flex items-center justify-center space-x-1 md:space-x-2 min-h-[40px] md:min-h-[48px] text-sm md:text-base"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset</span>
              </button>
              <button
                onClick={completeExercise}
                className="px-3 md:px-6 py-2 md:py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg md:rounded-xl font-semibold transition-colors flex items-center justify-center space-x-1 md:space-x-2 min-h-[40px] md:min-h-[48px] text-sm md:text-base"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Complete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compact Mobile Exercise List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {warmupExercises.map((exercise) => (
          <div
            key={exercise.id}
            className={`group relative overflow-hidden rounded-2xl md:rounded-3xl border transition-all duration-500 hover:scale-105 hover:shadow-2xl ${
              completedExercises.has(exercise.id) 
                ? 'border-green-500/50 bg-gradient-to-br from-green-500/10 via-green-600/5 to-emerald-500/10' 
                : 'border-slate-700/50 bg-gradient-to-br from-slate-800/50 via-slate-900/30 to-slate-800/50 backdrop-blur-xl hover:border-slate-600/50'
            }`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
              <div className="absolute top-0 right-0 w-16 md:w-32 h-16 md:h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-8 md:-translate-y-16 translate-x-8 md:translate-x-16"></div>
              <div className="absolute bottom-0 left-0 w-12 md:w-24 h-12 md:h-24 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-6 md:translate-y-12 -translate-x-6 md:-translate-x-12"></div>
            </div>

            <div className="relative p-3 md:p-6">
              {/* Compact Mobile Header */}
              <div className="flex items-start justify-between mb-2 md:mb-4">
                <div className="flex items-center space-x-2 md:space-x-4 flex-1 min-w-0">
                  <div className={`relative w-8 h-8 md:w-14 md:h-14 rounded-lg md:rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0 ${
                    completedExercises.has(exercise.id)
                      ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                      : 'bg-gradient-to-br from-orange-500 to-red-500'
                  }`}>
                    {completedExercises.has(exercise.id) ? (
                      <CheckCircle className="w-4 h-4 md:w-7 md:h-7 text-white" />
                    ) : (
                      <Timer className="w-4 h-4 md:w-7 md:h-7 text-white" />
                    )}
                    {/* Glow effect */}
                    <div className={`absolute inset-0 rounded-lg md:rounded-2xl blur-md opacity-30 ${
                      completedExercises.has(exercise.id)
                        ? 'bg-green-400'
                        : 'bg-orange-400'
                    }`}></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-xl font-bold text-white mb-1 group-hover:text-orange-300 transition-colors duration-300 truncate">
                      {exercise.name}
                    </h3>
                    <p className="text-slate-400 text-xs md:text-sm leading-relaxed line-clamp-1 md:line-clamp-2">{exercise.description}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => setExpandedExercise(
                    expandedExercise === exercise.id ? null : exercise.id
                  )}
                  className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-slate-700/50 text-slate-400 hover:text-white transition-all duration-300 hover:scale-110 flex-shrink-0"
                >
                  {expandedExercise === exercise.id ? (
                    <ChevronUp className="w-3 h-3 md:w-5 md:h-5" />
                  ) : (
                    <ChevronDown className="w-3 h-3 md:w-5 md:h-5" />
                  )}
                </button>
              </div>

              {/* Compact Stats Row */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 md:mb-4 space-y-1 sm:space-y-0">
                <div className="flex items-center space-x-2 md:space-x-4">
                  <div className="flex items-center space-x-1 md:space-x-2">
                    <Clock className="w-3 h-3 md:w-4 md:h-4 text-slate-400" />
                    <span className="text-slate-300 font-semibold text-xs md:text-base">
                      {Math.floor(exercise.duration_seconds / 60)}:{(exercise.duration_seconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>
                  <div className={`px-1.5 md:px-3 py-0.5 md:py-1 rounded-full text-xs font-bold bg-gradient-to-r ${getDifficultyColor(exercise.difficulty)} text-white`}>
                    {exercise.difficulty.toUpperCase()}
                  </div>
                </div>
                <div className="text-slate-500 text-xs md:text-sm font-medium truncate">
                  {exercise.equipment}
                </div>
              </div>

              {/* Compact Muscle Groups */}
              <div className="flex flex-wrap gap-1 md:gap-2 mb-2 md:mb-4">
                {exercise.muscle_groups.map((muscle, index) => (
                  <span
                    key={index}
                    className={`px-1.5 md:px-3 py-0.5 md:py-1.5 rounded-full text-xs font-bold bg-gradient-to-r ${getMuscleGroupColor(muscle)} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105`}
                  >
                    {muscle}
                  </span>
                ))}
              </div>

              {/* Compact Instructions */}
              {expandedExercise === exercise.id && (
                <div className="mt-3 md:mt-6 pt-3 md:pt-6 border-t border-slate-700/50">
                  <h4 className="text-sm md:text-lg font-bold text-white mb-2 md:mb-4 flex items-center">
                    <Target className="w-3 h-3 md:w-5 md:h-5 mr-1 md:mr-2 text-orange-400" />
                    Instructions
                  </h4>
                  <ol className="space-y-1.5 md:space-y-3">
                    {exercise.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-2 md:space-x-4">
                        <span className="flex-shrink-0 w-5 h-5 md:w-8 md:h-8 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-md md:rounded-xl flex items-center justify-center text-xs md:text-sm font-bold shadow-lg">
                          {index + 1}
                        </span>
                        <span className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Compact Completion Section */}
      {completedExercises.size === warmupExercises.length && warmupExercises.length > 0 && (
        <div className="relative overflow-hidden bg-gradient-to-br from-green-500/20 via-emerald-500/15 to-green-600/20 backdrop-blur-xl rounded-xl md:rounded-3xl border border-green-500/30 p-3 md:p-8 shadow-2xl">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-0 right-0 w-12 md:w-48 h-12 md:h-48 bg-gradient-to-br from-green-400/30 to-emerald-400/30 rounded-full -translate-y-6 md:-translate-y-24 translate-x-6 md:translate-x-24"></div>
            <div className="absolute bottom-0 left-0 w-8 md:w-32 h-8 md:h-32 bg-gradient-to-tr from-emerald-400/30 to-green-400/30 rounded-full translate-y-4 md:translate-y-16 -translate-x-4 md:-translate-x-16"></div>
          </div>

          <div className="relative text-center">
            <div className="relative w-12 h-12 md:w-20 md:h-20 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-3xl flex items-center justify-center mx-auto mb-3 md:mb-6 shadow-2xl">
              <CheckCircle className="w-6 h-6 md:w-10 md:h-10 text-white" />
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-3xl blur-xl opacity-50"></div>
            </div>
            <h3 className="text-lg md:text-4xl font-black text-white mb-1 md:mb-3 bg-gradient-to-r from-green-400 via-emerald-300 to-green-400 bg-clip-text text-transparent">
              WARMUP COMPLETE!
            </h3>
            <p className="text-slate-300 text-sm md:text-xl font-semibold mb-3 md:mb-6">You're ready to dominate your workout</p>
            {onComplete && (
              <button
                onClick={onComplete}
                className="group relative px-4 md:px-10 py-2 md:py-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg md:rounded-2xl font-black text-sm md:text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl shadow-lg w-full sm:w-auto min-h-[40px] md:min-h-[48px]"
              >
                <span className="relative z-10 flex items-center justify-center space-x-1 md:space-x-3">
                  <Zap className="w-4 h-4 md:w-6 md:h-6" />
                  <span>START WORKOUT</span>
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg md:rounded-2xl blur opacity-0 group-hover:opacity-75 transition-opacity duration-300"></div>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
