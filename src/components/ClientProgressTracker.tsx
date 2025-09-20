import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Calendar, 
  Weight, 
  Activity, 
  Eye, 
  EyeOff,
  Plus,
  Minus,
  Target,
  BarChart3,
  Zap
} from 'lucide-react';
import { 
  WeightEntry, 
  TrainingVolumeData, 
  PersonalRecord, 
  WeeklyPerformanceSummary,
  ProgressTrackingData,
  Client 
} from '../types';
import {
  getClientProgressData,
  logClientWeight,
  calculateAndSaveTrainingVolume,
  calculateAndSavePRs,
  updateWeeklyPerformanceSummary
} from '../lib/progressTracking';
import { UltraModernMuscleVolumeChart } from './UltraModernMuscleVolumeChart';
import { IndividualMuscleVolumeChart } from './IndividualMuscleVolumeChart';
import { CurrentWeekVolumeDisplay } from './CurrentWeekVolumeDisplay';
import { useRealtimeVolumeTracking } from '../hooks/useRealtimeVolumeTracking';
import { getMuscleGroupsFromProgram, getMuscleGroupsFromProgramSync } from '../utils/realtimeVolumeTracker';

interface ClientProgressTrackerProps {
  client: Client;
  currentWeek: number;
  isDark: boolean;
}

interface ChartVisibility {
  volume: boolean;
  prs: boolean;
}

export default function ClientProgressTracker({ client, currentWeek, isDark }: ClientProgressTrackerProps) {
  const [progressData, setProgressData] = useState<ProgressTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [muscleGroups, setMuscleGroups] = useState<string[]>([]);
  const [chartVisibility, setChartVisibility] = useState<ChartVisibility>({
    volume: true,
    prs: true
  });

  // Debug: Log essential client data
  console.log('🔍 CLIENT PROGRESS - Client:', client.name, 'Program:', client.workoutAssignment?.program?.name, 'Days:', client.workoutAssignment?.program?.days?.length);

  // Real-time volume tracking
  const { 
    currentWeekVolume, 
    volumeData: realtimeVolumeData, 
    isLoading: volumeLoading 
  } = useRealtimeVolumeTracking({
    clientId: client.id,
    workoutAssignmentId: client.workoutAssignment?.id || 'temp-id',
    workoutProgram: client.workoutAssignment?.program,
    workoutAssignment: client.workoutAssignment, // Pass the full assignment data
    currentWeekNumber: currentWeek
  });

  // Debug the volume data
  console.log('🔍 CLIENT PROGRESS - Volume data from hook:', {
    currentWeekVolume,
    realtimeVolumeData: realtimeVolumeData?.length || 0,
    volumeLoading,
    hasProgram: !!client.workoutAssignment?.program
  });

  // Debug currentWeekVolume structure
  if (currentWeekVolume) {
    console.log('🔍 CLIENT PROGRESS - currentWeekVolume structure:', {
      totalVolume: currentWeekVolume.totalVolume,
      muscleGroupVolumes: currentWeekVolume.muscleGroupVolumes,
      muscleGroupKeys: Object.keys(currentWeekVolume.muscleGroupVolumes || {}),
      weekNumber: currentWeekVolume.weekNumber
    });
  }

  // Load progress data
  useEffect(() => {
    loadProgressData();
  }, [client.id, currentWeek]);

  // Recalculate muscle volume when workout assignment changes
  useEffect(() => {
    const loadMuscleGroups = async () => {
      if (client.workoutAssignment?.program) {
        console.log('📊 VOLUME - Calculating for program:', client.workoutAssignment.program.name);
        const muscleGroups = await getMuscleGroupsFromProgram(client.workoutAssignment.program);
        setMuscleGroups(muscleGroups);
        // Volume data will be handled by the realtime hook
      } else {
        setMuscleGroups([]);
      }
    };
    
    loadMuscleGroups();
  }, [client.workoutAssignment?.program]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      const data = await getClientProgressData(client.id);
      setProgressData(data);
    } catch (error) {
      console.error('Error loading progress data:', error);
    } finally {
      setLoading(false);
    }
  };


  const toggleChart = (chartType: keyof ChartVisibility) => {
    setChartVisibility(prev => ({
      ...prev,
      [chartType]: !prev[chartType]
    }));
  };

  const getWeightTrend = () => {
    if (!progressData?.weightLogs || progressData.weightLogs.length < 2) return null;
    
    const recent = progressData.weightLogs[0];
    const previous = progressData.weightLogs[1];
    const change = recent.weight - previous.weight;
    
    return {
      change: Math.abs(change),
      direction: change > 0 ? 'up' : change < 0 ? 'down' : 'stable',
      percentage: previous.weight > 0 ? Math.abs((change / previous.weight) * 100) : 0
    };
  };

  const getCurrentWeekPRs = () => {
    if (!progressData?.personalRecords) return [];
    return progressData.personalRecords.filter(pr => pr.weekNumber === currentWeek);
  };

  const getVolumeChanges = () => {
    if (!progressData?.trainingVolume) return [];
    
    const currentWeekVolume = progressData.trainingVolume.filter(v => v.weekNumber === currentWeek);
    return currentWeekVolume.map(volume => ({
      muscleGroup: volume.muscleGroup,
      change: volume.volumeChangePercent || 0,
      volume: volume.totalVolume
    }));
  };

  if (loading) {
    return (
      <div className="bg-gray-900 min-h-screen p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your progress...</p>
        </div>
      </div>
    );
  }

  const weightTrend = getWeightTrend();
  const currentPRs = getCurrentWeekPRs();
  const volumeChanges = getVolumeChanges();

  return (
    <div className="bg-gray-900 min-h-screen">
      {/* Header */}
      <div className="bg-gray-800 backdrop-blur-xl border-b border-gray-700 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-2">
            Progress Tracking
          </h1>
          <p className="text-purple-300/80">Week {currentWeek} • Track your fitness journey</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">
        
        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Current Weight */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <Weight className="w-8 h-8 text-blue-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {progressData?.weightLogs?.[0]?.weight?.toFixed(1) || '--'} kg
            </div>
            <div className="text-slate-400 text-sm">Current Weight</div>
            {weightTrend && (
              <div className={`flex items-center space-x-1 mt-2 text-sm ${
                weightTrend.direction === 'up' ? 'text-red-400' : 
                weightTrend.direction === 'down' ? 'text-green-400' : 'text-slate-400'
              }`}>
                {weightTrend.direction === 'up' ? <TrendingUp className="w-4 h-4" /> : 
                 weightTrend.direction === 'down' ? <TrendingDown className="w-4 h-4" /> : 
                 <Target className="w-4 h-4" />}
                <span>{weightTrend.direction === 'stable' ? 'No change' : 
                      `${weightTrend.direction === 'up' ? '+' : '-'}${weightTrend.change.toFixed(1)}kg`}</span>
              </div>
            )}
          </div>

          {/* PRs This Week */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-3">
              <Award className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">{currentPRs.length}</div>
            <div className="text-slate-400 text-sm">Personal Records</div>
            <div className="text-yellow-400 text-sm mt-2">This Week</div>
          </div>

          {/* Training Volume */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-3">
              <Activity className="w-8 h-8 text-green-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {volumeChanges.reduce((sum, v) => sum + v.volume, 0).toLocaleString()}
            </div>
            <div className="text-slate-400 text-sm">Total Volume (kg)</div>
            <div className="text-green-400 text-sm mt-2">Week {currentWeek}</div>
          </div>

          {/* Workout Days */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center mb-3">
              <Calendar className="w-8 h-8 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {progressData?.weeklyPerformance?.find(w => w.weekNumber === currentWeek)?.totalWorkoutsCompleted || 0}
            </div>
            <div className="text-slate-400 text-sm">Workouts Done</div>
            <div className="text-purple-400 text-sm mt-2">This Week</div>
          </div>
        </div>


        {/* Chart Visibility Controls */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">Progress Charts</h3>
          <div className="flex flex-wrap gap-3">
            {Object.entries(chartVisibility).map(([key, isVisible]) => (
              <button
                key={key}
                onClick={() => toggleChart(key as keyof ChartVisibility)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 ${
                  isVisible 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span className="capitalize">{key === 'prs' ? 'Personal Records' : key}</span>
              </button>
            ))}
          </div>
        </div>


        {/* Training Volume Changes */}
        {chartVisibility.volume && volumeChanges.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Training Volume Changes</h3>
              <BarChart3 className="w-6 h-6 text-green-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {volumeChanges.map((volume) => (
                <div key={volume.muscleGroup} className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium capitalize">{volume.muscleGroup}</span>
                    <div className={`flex items-center space-x-1 ${
                      volume.change > 0 ? 'text-green-400' : 
                      volume.change < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {volume.change > 0 ? <TrendingUp className="w-4 h-4" /> : 
                       volume.change < 0 ? <TrendingDown className="w-4 h-4" /> : 
                       <Target className="w-4 h-4" />}
                      <span className="text-sm font-medium">
                        {volume.change > 0 ? '+' : ''}{volume.change.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="text-slate-400 text-sm">
                    {volume.volume.toLocaleString()} kg total
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Personal Records */}
        {chartVisibility.prs && progressData?.personalRecords && progressData.personalRecords.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Personal Records</h3>
              <Award className="w-6 h-6 text-yellow-400" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {progressData.personalRecords
                .sort((a, b) => b.weekNumber - a.weekNumber)
                .slice(0, 8)
                .map((pr) => (
                <div key={`${pr.exerciseName}-${pr.weekNumber}`} className="bg-slate-700/30 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium capitalize">
                      {pr.exerciseName.replace(/_/g, ' ')}
                    </span>
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Zap className="w-4 h-4" />
                      <span className="text-sm">Week {pr.weekNumber}</span>
                    </div>
                  </div>
                  <div className="text-lg font-bold text-yellow-400 mb-1">
                    {pr.bestSetWeight}kg × {pr.bestSetReps} reps
                  </div>
                  <div className="text-slate-400 text-sm">
                    Volume: {pr.totalVolume.toFixed(0)} kg
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Current Week Volume Display */}
        {client.workoutAssignment?.program && (
          <div className="mb-8">
            <CurrentWeekVolumeDisplay 
              volume={currentWeekVolume}
              isLoading={volumeLoading}
            />
          </div>
        )}

        {/* Individual Muscle Group Charts */}
        {realtimeVolumeData.length > 0 && currentWeekVolume && (
          <div className="mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-white mb-2">Muscle Group Progress</h3>
              <p className="text-gray-400 text-sm">Individual volume progression for each muscle group</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.keys(currentWeekVolume.muscleGroupVolumes).map((muscleGroup, index) => {
                const colors = ['#dc1e3a', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'];
                return (
                  <IndividualMuscleVolumeChart
                    key={muscleGroup}
                    data={realtimeVolumeData}
                    muscleGroup={muscleGroup}
                    color={colors[index % colors.length]}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* Overall Muscle Volume Chart */}
        {realtimeVolumeData.length > 0 && muscleGroups.length > 0 ? (
          <div className="mb-8">
            <UltraModernMuscleVolumeChart 
              data={realtimeVolumeData}
              muscleGroups={muscleGroups}
            />
          </div>
        ) : !client.workoutAssignment?.program && (
          <div className="mb-8">
            <div className="bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-[#dc1e3a]/30">
                <Activity className="w-8 h-8 text-[#dc1e3a]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No Workout Program Assigned</h3>
              <p className="text-gray-400 text-sm leading-relaxed max-w-md mx-auto">
                Assign a workout program to this client to see their muscle volume progress. 
                The chart will show real volume data based on unlocked weeks and completed workouts.
              </p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!progressData?.weightLogs?.length && !progressData?.personalRecords?.length) && (
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-12 border border-slate-700/50 text-center">
            <Activity className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Start Tracking Your Progress</h3>
            <p className="text-slate-400 mb-6">
              Log your first weight and complete workouts to see your progress here.
            </p>
            <button
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors"
            >
              Log Your First Weight
            </button>
          </div>
        )}
      </div>
    </div>
  );
}