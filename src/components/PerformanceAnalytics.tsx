import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  Target,
  ChevronRight,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { computeVolumeFromAssignment } from '../utils/volumeCalculator';

interface MuscleGroupData {
  name: string;
  currentWeekVolume: number;
  previousWeekVolume: number;
  weeklyHistory: number[];
  trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  changePercentage: number;
  illustration: string; // SVG path for muscle highlight
  // Enhanced metrics
  week1Volume: number;
  totalProgressPercentage: number; // Current vs Week 1
  averageVolume: number; // Average of all previous weeks
  vsAveragePercentage: number; // Current vs Average
  consistencyScore: number; // 0-100, how consistent the training is
}

interface PerformanceAnalyticsProps {
  clientId: string;
  clientName: string;
  isDark?: boolean;
  workoutAssignment?: any; // ClientWorkoutAssignment
}

export const PerformanceAnalytics: React.FC<PerformanceAnalyticsProps> = ({
  clientId,
  clientName,
  workoutAssignment
}) => {
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Muscle group image mapping (using anatomically accurate diagrams)
  // Some muscle groups have multiple views (front/back)
  const getMuscleImageUrls = (muscleGroup: string): string[] => {
    const imageMap: { [key: string]: string[] } = {
      'Chest': ['/assets/muscles/Chest.png'],
      'Back': ['/assets/muscles/Back1.png'],
      'Lats': ['/assets/muscles/Back1.png'],
      'Traps': ['/assets/muscles/Back2.png'],
      'Trapezius': ['/assets/muscles/Back2.png'],
      'Shoulders': ['/assets/muscles/Shoulders.png'],
      'Arms': ['/assets/muscles/Biceps.png', '/assets/muscles/Triceps.png'],
      'Biceps': ['/assets/muscles/Biceps.png'],
      'Triceps': ['/assets/muscles/Triceps.png'],
      'Forearms': ['/assets/muscles/Forearms.png'],
      'Legs': ['/assets/muscles/Legs1.png'],
      'Quads': ['/assets/muscles/Legs1.png'],
      'Hamstrings': ['/assets/muscles/Legs2.png'],
      'Calves': ['/assets/muscles/Calves.png'],
      'Glutes': ['/assets/muscles/Legs2.png'],
      'Core': ['/assets/muscles/Abs.png'],
      'Abs': ['/assets/muscles/Abs.png']
    };
    
    return imageMap[muscleGroup] || imageMap['Core'];
  };

  // Handle image load errors
  const handleImageError = (muscleGroup: string) => {
    console.warn(`Image not found for ${muscleGroup}`);
    setImageErrors(prev => ({ ...prev, [muscleGroup]: true }));
  };

  // Anatomically realistic muscle group illustrations using images
  const getMuscleIllustration = (muscleGroup: string, trend: string) => {
    const imageUrls = getMuscleImageUrls(muscleGroup);
    const hasError = imageErrors[muscleGroup] || false;
    const hasMultipleImages = imageUrls.length > 1;
    
    // Enhanced color filters and glow based on trend
    const filterStyle = trend === 'increasing' 
      ? 'drop-shadow(0 0 20px rgba(239, 68, 68, 0.8)) drop-shadow(0 0 40px rgba(239, 68, 68, 0.4)) brightness(1.15) saturate(1.2)'
      : trend === 'decreasing' 
      ? 'drop-shadow(0 0 20px rgba(59, 130, 246, 0.8)) drop-shadow(0 0 40px rgba(59, 130, 246, 0.4)) brightness(1.1) saturate(1.1)'
      : 'drop-shadow(0 0 15px rgba(148, 163, 184, 0.5)) brightness(1.05)';
    
    const trendColor = trend === 'increasing' ? 'bg-red-500' : trend === 'decreasing' ? 'bg-blue-500' : 'bg-slate-500';
    const trendTextColor = trend === 'increasing' ? 'text-red-400' : trend === 'decreasing' ? 'text-blue-400' : 'text-slate-400';
    
    return (
      <div className="relative w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full h-full flex items-center justify-center max-w-[300px] max-h-[300px] mx-auto">
          {/* Background glow effect */}
          <div className={`absolute inset-0 rounded-full blur-3xl opacity-30 ${trendColor}`}></div>
          
          {!hasError ? (
            /* Muscle images - display horizontally if multiple */
            <div className={`relative z-10 flex ${hasMultipleImages ? 'flex-row gap-2' : 'items-center justify-center'} w-full h-full`}>
              {imageUrls.map((imageUrl, index) => (
                <img 
                  key={`${muscleGroup}-${index}`}
                  src={imageUrl}
                  alt={`${muscleGroup} muscle diagram ${hasMultipleImages ? `view ${index + 1}` : ''}`}
                  className={`${hasMultipleImages ? 'w-1/2' : 'w-full'} h-full animate-pulse`}
                  style={{ 
                    filter: filterStyle,
                    transition: 'all 0.5s ease',
                    imageRendering: 'crisp-edges',
                    objectFit: 'contain',
                    maxWidth: hasMultipleImages ? '150px' : '300px',
                    maxHeight: '300px'
                  }}
                  onError={() => handleImageError(muscleGroup)}
                />
              ))}
            </div>
          ) : (
            /* Fallback when image not available */
            <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
              <div className={`w-32 h-32 rounded-full ${trendColor} opacity-20 flex items-center justify-center mb-3`}>
                <Activity className={`w-16 h-16 ${trendTextColor} animate-pulse`} />
              </div>
              <p className={`text-sm font-bold ${trendTextColor}`}>{muscleGroup}</p>
              <p className="text-xs text-slate-500 mt-1">Image coming soon</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Fetch muscle groups once on mount (same as Progress charts) — no refetch on assignment change
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!supabase) return;
      try {
        const { data, error } = await supabase
          .from('exercises')
          .select('muscle_group')
          .not('muscle_group', 'is', null);
        if (cancelled || error) return;
        const raw = data?.map((item: { muscle_group: string }) => item.muscle_group) || [];
        const normalized = [
          ...new Set(
            raw
              .filter((g: string) => g && g.trim() !== '')
              .map((g: string) => g.trim().charAt(0).toUpperCase() + g.trim().slice(1).toLowerCase())
          )
        ];
        setAvailableMuscleGroups(normalized);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Derive analytics from assignment using shared weekly volume (no async, no reload every second)
  const muscleGroups = useMemo((): MuscleGroupData[] => {
    if (!workoutAssignment?.program || availableMuscleGroups.length === 0) return [];
    const volumeData = computeVolumeFromAssignment(workoutAssignment, availableMuscleGroups);
    const currentWeekNumber = workoutAssignment.currentWeek || 1;
    const result: MuscleGroupData[] = [];

    availableMuscleGroups.forEach((muscleGroup) => {
      const weeklyVolumes = volumeData.map((week) => (week[muscleGroup] as number) || 0);
      const currentWeekIndex = volumeData.findIndex((w) => w.week === currentWeekNumber);
      const previousWeekIndex = volumeData.findIndex((w) => w.week === currentWeekNumber - 1);
      const week1Index = volumeData.findIndex((w) => w.week === 1);

      const currentWeekVolume = currentWeekIndex >= 0 ? ((volumeData[currentWeekIndex][muscleGroup] as number) || 0) : 0;
      const previousWeekVolume = previousWeekIndex >= 0 ? ((volumeData[previousWeekIndex][muscleGroup] as number) || 0) : 0;
      const week1Volume = week1Index >= 0 ? ((volumeData[week1Index][muscleGroup] as number) || 0) : 0;

      let changePercentage = 0;
      if (previousWeekVolume > 0) {
        changePercentage = ((currentWeekVolume - previousWeekVolume) / previousWeekVolume) * 100;
      } else if (currentWeekVolume > 0 && previousWeekVolume === 0) {
        changePercentage = 100;
      }

      let totalProgressPercentage = 0;
      if (week1Volume > 0) {
        totalProgressPercentage = ((currentWeekVolume - week1Volume) / week1Volume) * 100;
      } else if (currentWeekVolume > 0 && week1Volume === 0) {
        totalProgressPercentage = 100;
      }

      const completedWeeksVolumes = weeklyVolumes.slice(0, currentWeekNumber).filter((vol) => vol > 0);
      const averageVolume =
        completedWeeksVolumes.length > 0
          ? completedWeeksVolumes.reduce((sum, vol) => sum + vol, 0) / completedWeeksVolumes.length
          : 0;

      let vsAveragePercentage = 0;
      if (averageVolume > 0) {
        vsAveragePercentage = ((currentWeekVolume - averageVolume) / averageVolume) * 100;
      }

      let consistencyScore = 0;
      if (completedWeeksVolumes.length >= 2 && averageVolume > 0) {
        const variance =
          completedWeeksVolumes.reduce((sum, vol) => sum + Math.pow(vol - averageVolume, 2), 0) /
          completedWeeksVolumes.length;
        const stdDev = Math.sqrt(variance);
        const cv = (stdDev / averageVolume) * 100;
        consistencyScore = Math.max(0, Math.min(100, 100 - cv * 2));
      } else {
        consistencyScore = 100;
      }

      let trend: 'increasing' | 'decreasing' | 'stable' | 'fluctuating' = 'stable';
      if (weeklyVolumes.length >= 3) {
        const last3Weeks = weeklyVolumes.slice(-3);
        const isIncreasing = last3Weeks.every((vol, idx) => idx === 0 || vol >= last3Weeks[idx - 1]);
        const isDecreasing = last3Weeks.every((vol, idx) => idx === 0 || vol <= last3Weeks[idx - 1]);
        if (isIncreasing && changePercentage > 1) trend = 'increasing';
        else if (isDecreasing && changePercentage < -1) trend = 'decreasing';
        else if (Math.abs(changePercentage) <= 1) trend = 'stable';
        else trend = 'fluctuating';
      } else if (weeklyVolumes.length === 2) {
        if (changePercentage > 1) trend = 'increasing';
        else if (changePercentage < -1) trend = 'decreasing';
        else trend = 'stable';
      }

      result.push({
        name: muscleGroup,
        currentWeekVolume,
        previousWeekVolume,
        weeklyHistory: weeklyVolumes,
        trend,
        changePercentage,
        illustration: '',
        week1Volume,
        totalProgressPercentage,
        averageVolume,
        vsAveragePercentage,
        consistencyScore
      });
    });

    result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [workoutAssignment, availableMuscleGroups]);

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'decreasing':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      case 'stable':
        return <Minus className="w-5 h-5 text-blue-400" />;
      default:
        return <Activity className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing':
        return 'from-green-500 to-emerald-500';
      case 'decreasing':
        return 'from-red-500 to-orange-500';
      case 'stable':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-yellow-500 to-orange-500';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg font-medium">Analyzing Performance Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-white">Performance Analytics</h1>
              <p className="text-slate-400 text-sm sm:text-base">Weekly muscle group progress analysis for {clientName}</p>
            </div>
          </div>
        </div>

        {/* Performance Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {muscleGroups.map((muscle) => (
            <div
              key={muscle.name}
              onClick={() => setSelectedMuscle(selectedMuscle === muscle.name ? null : muscle.name)}
              className="group relative bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-slate-700/50 overflow-hidden hover:border-purple-500/50 transition-all duration-500 cursor-pointer hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20"
            >
              {/* Background Pattern */}
              <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                <div className={`absolute inset-0 bg-gradient-to-br ${getTrendColor(muscle.trend)}`}></div>
              </div>
              
              {/* Animated Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/0 via-transparent to-pink-500/0 group-hover:from-purple-500/10 group-hover:to-pink-500/10 transition-all duration-700"></div>

              <div className="relative p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getTrendColor(muscle.trend)} flex items-center justify-center`}>
                      {getTrendIcon(muscle.trend)}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">{muscle.name}</h3>
                      <p className="text-slate-400 text-sm capitalize">{muscle.trend}</p>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${selectedMuscle === muscle.name ? 'rotate-90' : ''}`} />
                </div>

                {/* Enhanced Muscle Illustration */}
                <div className="mb-4 flex justify-center h-48 relative">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/20 to-transparent rounded-xl"></div>
                  <div className="relative z-10 w-full h-full flex items-center justify-center transform hover:scale-105 transition-transform duration-500">
                    {getMuscleIllustration(muscle.name, muscle.trend)}
                  </div>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Current Week</span>
                    <span className="text-white font-bold">{muscle.currentWeekVolume.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Previous Week</span>
                    <span className="text-slate-300 font-medium">{muscle.previousWeekVolume.toLocaleString()} kg</span>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-700/50">
                    <span className="text-slate-400 text-sm">Change</span>
                    <div className={`flex items-center gap-1 font-bold ${
                      muscle.changePercentage > 0 ? 'text-green-400' : 
                      muscle.changePercentage < 0 ? 'text-red-400' : 'text-blue-400'
                    }`}>
                      {muscle.changePercentage > 0 && <ArrowUp className="w-4 h-4" />}
                      {muscle.changePercentage < 0 && <ArrowDown className="w-4 h-4" />}
                      {muscle.changePercentage === 0 && <Minus className="w-4 h-4" />}
                      <span>{Math.abs(muscle.changePercentage).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                {/* Expanded Report */}
                {selectedMuscle === muscle.name && (
                  <div className="mt-4 pt-4 border-t border-slate-700/50 animate-fadeIn space-y-4">
                    {/* Week-to-Week Analysis */}
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                        <h4 className="text-sm font-bold text-purple-300">This Week vs Last Week</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">
                          {muscle.previousWeekVolume.toLocaleString()} kg → {muscle.currentWeekVolume.toLocaleString()} kg
                        </span>
                        <div className={`flex items-center gap-1 font-bold text-lg ${
                          muscle.changePercentage > 0 ? 'text-green-400' : 
                          muscle.changePercentage < 0 ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {muscle.changePercentage > 0 ? '+' : ''}{muscle.changePercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* Total Progress from Week 1 */}
                    <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 border border-emerald-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-sm font-bold text-emerald-300">Total Progress (vs Week 1)</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">
                          {muscle.week1Volume.toLocaleString()} kg → {muscle.currentWeekVolume.toLocaleString()} kg
                        </span>
                        <div className={`flex items-center gap-1 font-bold text-lg ${
                          muscle.totalProgressPercentage > 0 ? 'text-emerald-400' : 
                          muscle.totalProgressPercentage < 0 ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {muscle.totalProgressPercentage > 0 ? '+' : ''}{muscle.totalProgressPercentage.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {/* vs Average */}
                    <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="w-4 h-4 text-blue-400" />
                        <h4 className="text-sm font-bold text-blue-300">vs Your Average</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-300 text-sm">
                          Avg: {muscle.averageVolume.toLocaleString()} kg
                        </span>
                        <div className={`flex items-center gap-1 font-bold text-lg ${
                          muscle.vsAveragePercentage > 0 ? 'text-green-400' : 
                          muscle.vsAveragePercentage < 0 ? 'text-orange-400' : 'text-blue-400'
                        }`}>
                          {muscle.vsAveragePercentage > 0 ? '+' : ''}{muscle.vsAveragePercentage.toFixed(1)}%
                        </div>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        {muscle.vsAveragePercentage > 0 ? 'Above' : muscle.vsAveragePercentage < 0 ? 'Below' : 'At'} your typical performance
                      </p>
                    </div>

                    {/* Consistency Score */}
                    <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-violet-400" />
                        <h4 className="text-sm font-bold text-violet-300">Consistency Score</h4>
                      </div>
                      <div className="flex items-center gap-3">
                        {/* Circular Progress */}
                        <div className="relative w-16 h-16">
                          <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-slate-700"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${(muscle.consistencyScore / 100) * 251.2} 251.2`}
                              className={`${
                                muscle.consistencyScore >= 80 ? 'text-green-400' :
                                muscle.consistencyScore >= 60 ? 'text-yellow-400' :
                                'text-orange-400'
                              } transition-all duration-1000`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-white">{muscle.consistencyScore.toFixed(0)}</span>
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-slate-200 text-sm leading-relaxed">
                            {muscle.consistencyScore >= 80 
                              ? '🎯 Very consistent training!' 
                              : muscle.consistencyScore >= 60 
                              ? '👍 Fairly consistent, room for improvement' 
                              : '⚠️ Training volume varies significantly'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Mini Chart */}
                    <div className="mt-3">
                      <h5 className="text-xs font-semibold text-slate-400 mb-2">Weekly Volume History</h5>
                      <div className="flex items-end gap-1 h-16">
                        {muscle.weeklyHistory.map((volume, idx) => (
                          <div
                            key={idx}
                            className="flex-1 bg-gradient-to-t from-purple-500 to-pink-500 rounded-t opacity-60 hover:opacity-100 transition-opacity"
                            style={{
                              height: `${muscle.weeklyHistory.length ? (volume / Math.max(1, ...muscle.weeklyHistory)) * 100 : 0}%`
                            }}
                            title={`Week ${idx + 1}: ${volume.toLocaleString()} kg`}
                          />
                        ))}
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-slate-500">Week 1</span>
                        <span className="text-[10px] text-slate-500">Week {muscle.weeklyHistory.length}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Overall Summary */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Overall Summary</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-green-400 font-bold text-sm">Improving</span>
              </div>
              <p className="text-3xl font-black text-white">
                {muscleGroups.filter(m => m.trend === 'increasing').length}
              </p>
              <p className="text-slate-400 text-sm">Muscle groups</p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Minus className="w-5 h-5 text-blue-400" />
                <span className="text-blue-400 font-bold text-sm">Stable</span>
              </div>
              <p className="text-3xl font-black text-white">
                {muscleGroups.filter(m => m.trend === 'stable').length}
              </p>
              <p className="text-slate-400 text-sm">Muscle groups</p>
            </div>

            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="w-5 h-5 text-red-400" />
                <span className="text-red-400 font-bold text-sm">Declining</span>
              </div>
              <p className="text-3xl font-black text-white">
                {muscleGroups.filter(m => m.trend === 'decreasing').length}
              </p>
              <p className="text-slate-400 text-sm">Muscle groups</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerformanceAnalytics;

