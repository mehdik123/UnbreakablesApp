import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, Dumbbell, ChevronDown, ChevronUp, Target, Zap } from 'lucide-react';
import { Client, ClientWorkoutAssignment, Exercise } from '../types';
import { getVolumeDataForChart } from '../utils/realtimeVolumeTracker';
import { supabase } from '../lib/supabaseClient';

interface MuscleVolumeData {
  week: number;
  [muscleGroup: string]: number | string;
}

interface IndependentMuscleGroupChartsProps {
  client: Client;
  isDark: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const muscleGroup = payload[0]?.payload?.muscleGroup || 'Unknown';
    const volume = payload[0]?.value || 0;
    
    return (
      <div className="bg-black/95 backdrop-blur-xl border border-[#dc1e3a]/30 rounded-2xl p-5 shadow-2xl transform scale-105 transition-all duration-200">
        <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-[#dc1e3a] rotate-45 border border-[#dc1e3a]/30"></div>
        <p className="text-white text-sm font-medium mb-1">
          Week {label}
        </p>
        <p className="text-[#dc1e3a] text-xl font-bold flex items-center">
          <span className="w-3 h-3 bg-[#dc1e3a] rounded-full mr-2 animate-pulse"></span>
          {volume.toLocaleString()} kg
        </p>
        <p className="text-white/60 text-xs mt-1 capitalize">{muscleGroup} Volume</p>
      </div>
    );
  }
  return null;
};

const COLORS = [
  '#dc1e3a', // Red
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ef4444', // Red-500
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
];

export const IndependentMuscleGroupCharts: React.FC<IndependentMuscleGroupChartsProps> = ({
  client,
  isDark
}) => {
  const [volumeData, setVolumeData] = useState<MuscleVolumeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCharts, setExpandedCharts] = useState<{ [muscleGroup: string]: boolean }>({});
  const [workoutExercises, setWorkoutExercises] = useState<{ [muscleGroup: string]: Exercise[] }>({});
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);

  // Load volume data and extract exercises
  useEffect(() => {
    const loadData = async () => {
      if (!client.workoutAssignment) return;
      
      setLoading(true);
      try {
        // First, get all unique muscle groups from the exercises table
        const { data: muscleGroupData, error: muscleGroupError } = await supabase
          .from('exercises')
          .select('muscle_group')
          .not('muscle_group', 'is', null);
        
        if (muscleGroupError) {
          console.error('Error fetching muscle groups:', muscleGroupError);
          return;
        }
        
        // Extract unique muscle groups and normalize them (remove duplicates and normalize case)
        const rawMuscleGroups = muscleGroupData?.map(item => item.muscle_group) || [];
        const normalizedMuscleGroups = rawMuscleGroups
          .filter(group => group && group.trim() !== '') // Remove empty/null groups
          .map(group => group.trim()) // Remove whitespace
          .map(group => group.charAt(0).toUpperCase() + group.slice(1).toLowerCase()); // Normalize case
        
        const uniqueMuscleGroups = [...new Set(normalizedMuscleGroups)];
        setAvailableMuscleGroups(uniqueMuscleGroups);
        console.log('Available muscle groups from database:', uniqueMuscleGroups);
        console.log('Raw muscle groups before normalization:', rawMuscleGroups);

        // Calculate volume data directly from current workout assignment
        console.log('🔄 Calculating volume for muscle groups:', uniqueMuscleGroups);
        console.log('🔄 Workout assignment:', client.workoutAssignment);
        const chartData = await calculateVolumeFromAssignment(client.workoutAssignment, uniqueMuscleGroups);
        console.log('📊 Calculated chart data:', chartData);
        setVolumeData(chartData);

        // Extract exercises by muscle group from workout assignment
        const exercisesByMuscleGroup: { [muscleGroup: string]: Exercise[] } = {};
        
        if (client.workoutAssignment.program) {
          console.log('🏋️ Extracting exercises from workout program...');
          client.workoutAssignment.program.days.forEach((day, dayIndex) => {
            console.log(`📅 Day ${dayIndex + 1}: ${day.name} (${day.exercises.length} exercises)`);
            day.exercises.forEach((workoutExercise, exerciseIndex) => {
              const muscleGroup = workoutExercise.exercise.muscleGroup;
              console.log(`  Exercise ${exerciseIndex + 1}: ${workoutExercise.exercise.name} (${muscleGroup})`);
              
              if (!muscleGroup) {
                console.log('⚠️ Exercise without muscle group:', workoutExercise.exercise.name);
                return;
              }
              
              // Normalize muscle group name
              const normalizedMuscleGroup = muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1).toLowerCase();
              
              if (!exercisesByMuscleGroup[normalizedMuscleGroup]) {
                exercisesByMuscleGroup[normalizedMuscleGroup] = [];
              }
              
              // Check if exercise already exists (avoid duplicates)
              const exists = exercisesByMuscleGroup[normalizedMuscleGroup].some(
                ex => ex.id === workoutExercise.exercise.id
              );
              
              if (!exists) {
                exercisesByMuscleGroup[normalizedMuscleGroup].push(workoutExercise.exercise);
              }
            });
          });
        }
        
        console.log('🏋️ Extracted exercises by muscle group:', exercisesByMuscleGroup);
        
        setWorkoutExercises(exercisesByMuscleGroup);
      } catch (error) {
        console.error('Error loading muscle group data:', error);
      } finally {
        setLoading(false);
      }
    };

        loadData();
      }, [client.id, client.workoutAssignment]);

  // Recalculate volume when workout assignment changes
  useEffect(() => {
    const recalculateVolume = async () => {
      if (!client.workoutAssignment || availableMuscleGroups.length === 0) return;
      
      const chartData = await calculateVolumeFromAssignment(client.workoutAssignment, availableMuscleGroups);
      setVolumeData(chartData);
    };

    recalculateVolume();
  }, [client.workoutAssignment, availableMuscleGroups]);

  const toggleChartExpansion = (muscleGroup: string) => {
    setExpandedCharts(prev => ({
      ...prev,
      [muscleGroup]: !prev[muscleGroup]
    }));
  };

  const getMuscleGroupColor = (muscleGroup: string) => {
    const index = availableMuscleGroups.indexOf(muscleGroup);
    return COLORS[index % COLORS.length];
  };

  const getMuscleGroupIcon = (muscleGroup: string) => {
    const iconMap: { [key: string]: string } = {
      'Back': '🏋️',
      'Chest': '💪',
      'Shoulders': '🤸',
      'Arms': '💪',
      'Legs': '🦵',
      'Core': '🔥',
      'Traps': '🏋️',
      'Calves': '🦵',
      'Forearms': '✋',
      'back': '🏋️',
      'chest': '💪',
      'shoulders': '🤸',
      'arms': '💪',
      'legs': '🦵',
      'core': '🔥',
      'traps': '🏋️',
      'calves': '🦵',
      'forearms': '✋'
    };
    return iconMap[muscleGroup] || '🏋️';
  };

  // Calculate volume directly from current workout assignment data
  const calculateVolumeFromAssignment = async (workoutAssignment: ClientWorkoutAssignment, muscleGroups: string[]): Promise<MuscleVolumeData[]> => {
    if (!workoutAssignment.program) return [];

    const maxWeeks = workoutAssignment.duration || 12;
    const chartData: MuscleVolumeData[] = [];

    for (let week = 1; week <= maxWeeks; week++) {
      const weekData: MuscleVolumeData = { week };
      
      // Check if this week is unlocked
      const weekInfo = workoutAssignment.weeks?.find(w => w.weekNumber === week);
      const isUnlocked = weekInfo?.isUnlocked || false;
      
      if (!isUnlocked) {
        // For locked weeks, set all muscle groups to 0
        muscleGroups.forEach(muscleGroup => {
          weekData[muscleGroup] = 0;
        });
        chartData.push(weekData);
        continue;
      }

      // Calculate volume for unlocked weeks using current data
      const volumeTally: { [muscleGroup: string]: number } = {};
      
      // Use week-specific data if available, otherwise use base program
      let daysToProcess = workoutAssignment.program.days;
      if (workoutAssignment.weeks && workoutAssignment.weeks.length > 0) {
        const weekData = workoutAssignment.weeks.find(w => w.weekNumber === week);
        if (weekData && weekData.days && weekData.days.length > 0) {
          daysToProcess = weekData.days;
        }
      }

      // Process each day
      for (const day of daysToProcess) {
        for (const workoutExercise of day.exercises) {
          const muscleGroup = workoutExercise.exercise.muscleGroup;
          if (!muscleGroup) {
            console.log('⚠️ Exercise without muscle group:', workoutExercise.exercise.name);
            continue;
          }

          // Calculate volume for this exercise
          let exerciseVolume = 0;
          for (const set of workoutExercise.sets) {
            const setVolume = set.reps * Math.max(set.weight, 1);
            exerciseVolume += setVolume;
          }

          // Normalize muscle group name to match the available muscle groups
          const normalizedMuscleGroup = muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1).toLowerCase();
          
          if (!volumeTally[normalizedMuscleGroup]) {
            volumeTally[normalizedMuscleGroup] = 0;
          }
          volumeTally[normalizedMuscleGroup] += exerciseVolume;
          
          console.log(`📊 Week ${week} - ${workoutExercise.exercise.name} (${normalizedMuscleGroup}): ${exerciseVolume}kg`);
        }
      }

      // Add all muscle groups to week data (0 for groups not trained this week)
      muscleGroups.forEach(muscleGroup => {
        weekData[muscleGroup] = volumeTally[muscleGroup] || 0;
      });

      chartData.push(weekData);
      console.log(`📈 Week ${week} volume tally:`, volumeTally);
    }

    console.log('📊 Final chart data:', chartData);
    return chartData;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-slate-300">Loading muscle group charts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
              <Target className="w-6 h-6 text-[#dc1e3a]" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Muscle Group Progress</h1>
              <p className="text-slate-400">Individual charts for each muscle group</p>
            </div>
          </div>
        </div>

        {/* Muscle Group Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {availableMuscleGroups.map((muscleGroup, index) => {
            const color = getMuscleGroupColor(muscleGroup);
            const isExpanded = expandedCharts[muscleGroup];
            const exercises = workoutExercises[muscleGroup] || [];
            
            // Get chart data for this muscle group
            const chartData = volumeData.map(week => ({
              week: week.week,
              volume: week[muscleGroup] as number || 0,
              muscleGroup: muscleGroup // Add muscle group to chart data
            }));

            const totalVolume = chartData.reduce((sum, week) => sum + week.volume, 0);
            const maxVolume = Math.max(...chartData.map(week => week.volume), 0);

            // Calculate trend
            const firstWeekVolume = chartData[0]?.volume || 0;
            const lastWeekVolume = chartData[chartData.length - 1]?.volume || 0;
            const trend = firstWeekVolume > 0 ? ((lastWeekVolume - firstWeekVolume) / firstWeekVolume) * 100 : 0;

            return (
              <div key={muscleGroup} className="bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl relative overflow-hidden group hover:border-[#dc1e3a]/30 transition-all duration-700">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#dc1e3a]/10 to-transparent rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full blur-2xl"></div>
                
                <div className="relative z-10 p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div 
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border text-2xl relative overflow-hidden"
                        style={{ 
                          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                          borderColor: `${color}30`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        <span className="relative z-10">{getMuscleGroupIcon(muscleGroup)}</span>
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-white capitalize mb-1">{muscleGroup}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-[#dc1e3a] rounded-full animate-pulse"></div>
                          <p className="text-white/60 text-sm">
                            {exercises.length} exercise{exercises.length !== 1 ? 's' : ''} in workout
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
                        <div className="w-3 h-3 bg-[#dc1e3a] rounded-full animate-pulse"></div>
                        <span className="text-white/80 text-sm font-medium">{exercises.length} exercises</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-48 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={chartData}
                        margin={{
                          top: 10,
                          right: 10,
                          left: 10,
                          bottom: 10,
                        }}
                      >
                        <XAxis 
                          dataKey="week" 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                          tickFormatter={(value) => `W${value}`}
                        />
                        <YAxis 
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: '#9ca3af', fontSize: 11, fontWeight: 500 }}
                          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="volume"
                          stroke={color}
                          strokeWidth={3}
                          fill={`url(#gradient-${muscleGroup})`}
                          dot={{ fill: color, strokeWidth: 2, r: 4 }}
                          activeDot={{ r: 6, stroke: color, strokeWidth: 2 }}
                        />
                        <defs>
                          <linearGradient id={`gradient-${muscleGroup}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                            <stop offset="30%" stopColor={color} stopOpacity={0.3} />
                            <stop offset="70%" stopColor={color} stopOpacity={0.1} />
                            <stop offset="100%" stopColor={color} stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id={`stroke-${muscleGroup}`} x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor={color} />
                            <stop offset="50%" stopColor={color} stopOpacity={0.8} />
                            <stop offset="100%" stopColor={color} />
                          </linearGradient>
                        </defs>
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
                      <div className={`text-lg font-bold flex items-center space-x-2 ${
                        trend > 0 ? 'text-green-400' : trend < 0 ? 'text-red-400' : 'text-white/60'
                      }`}>
                        <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                        <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
                      </div>
                      <div className="text-white/60 text-sm mt-1">Progress Trend</div>
                    </div>
                    
                    <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-4 border border-white/20 backdrop-blur-sm">
                      <div className="text-lg font-bold text-white flex items-center space-x-2">
                        <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                        <span>{maxVolume.toLocaleString()}</span>
                      </div>
                      <div className="text-white/60 text-sm mt-1">Peak Volume (kg)</div>
                    </div>
                  </div>

                  {/* Volume Calculation Summary */}
                  {exercises.length > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/20 backdrop-blur-sm">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                        <div className="text-white/80 text-sm font-medium">Volume Breakdown for {muscleGroup}</div>
                      </div>
                      <div className="space-y-2">
                        {exercises.map((exercise, exerciseIndex) => {
                          let exerciseVolume = 0;
                          if (client.workoutAssignment?.program) {
                            client.workoutAssignment.program.days.forEach(day => {
                              day.exercises.forEach(workoutExercise => {
                                if (workoutExercise.exercise.id === exercise.id) {
                                  exerciseVolume = workoutExercise.sets.reduce((sum, set) => sum + (set.reps * Math.max(set.weight, 1)), 0);
                                }
                              });
                            });
                          }
                          return (
                            <div key={exercise.id} className="flex justify-between items-center py-1">
                              <span className="text-white/70 text-sm">{exercise.name}</span>
                              <span className="text-white font-bold text-sm">{exerciseVolume.toLocaleString()}kg</span>
                            </div>
                          );
                        })}
                        <div className="border-t border-white/20 pt-2 mt-3 flex justify-between items-center">
                          <span className="text-white font-bold">Total {muscleGroup} Volume</span>
                          <span className="text-[#dc1e3a] font-bold text-lg">{totalVolume.toLocaleString()}kg</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Exercises Section */}
                  <div className="border-t border-white/20 pt-6">
                    <button
                      onClick={() => toggleChartExpansion(muscleGroup)}
                      className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-white/10 to-white/5 rounded-2xl hover:from-white/15 hover:to-white/10 transition-all duration-300 border border-white/20 backdrop-blur-sm group"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-lg flex items-center justify-center">
                          <Dumbbell className="w-4 h-4 text-[#dc1e3a]" />
                        </div>
                        <span className="text-white font-medium">View Exercise Details ({exercises.length})</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-white/60 group-hover:text-white transition-colors" />
                      )}
                    </button>

                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {exercises.length > 0 ? (
                          exercises.map((exercise, exerciseIndex) => {
                            // Find the exercise in the workout program to get sets data
                            let exerciseSets: any[] = [];
                            let totalExerciseVolume = 0;
                            
                            if (client.workoutAssignment?.program) {
                              client.workoutAssignment.program.days.forEach(day => {
                                day.exercises.forEach(workoutExercise => {
                                  if (workoutExercise.exercise.id === exercise.id) {
                                    exerciseSets = workoutExercise.sets;
                                    // Calculate volume for this exercise: sum of (sets × reps × weight)
                                    totalExerciseVolume = workoutExercise.sets.reduce((sum, set) => {
                                      return sum + (set.reps * Math.max(set.weight, 1));
                                    }, 0);
                                  }
                                });
                              });
                            }
                            
                            return (
                              <div
                                key={exercise.id}
                                className="p-5 bg-gradient-to-br from-white/5 to-white/10 rounded-2xl border border-white/20 backdrop-blur-sm hover:from-white/10 hover:to-white/15 transition-all duration-300"
                              >
                                <div className="flex items-center space-x-4 mb-4">
                                  <div className="w-10 h-10 bg-gradient-to-br from-[#dc1e3a]/20 to-[#dc1e3a]/10 rounded-xl flex items-center justify-center border border-[#dc1e3a]/30">
                                    <Dumbbell className="w-5 h-5 text-[#dc1e3a]" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-white font-bold text-base mb-1">
                                      {exercise.name}
                                    </div>
                                    <div className="flex items-center space-x-2 text-white/60 text-sm">
                                      <span>{exercise.equipment}</span>
                                      <span>•</span>
                                      <span className="capitalize">{exercise.difficulty}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-[#dc1e3a] font-bold text-lg">
                                      {totalExerciseVolume.toLocaleString()} kg
                                    </div>
                                    <div className="text-white/60 text-xs">Total Volume</div>
                                  </div>
                                </div>
                                
                                {/* Sets Details */}
                                {exerciseSets.length > 0 && (
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                                      <div className="text-white/80 text-sm font-medium">Sets & Reps Breakdown</div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                      {exerciseSets.map((set, setIndex) => (
                                        <div
                                          key={setIndex}
                                          className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 text-center border border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300"
                                        >
                                          <div className="text-white text-sm font-bold mb-1">Set {setIndex + 1}</div>
                                          <div className="text-white/80 text-sm font-medium mb-1">
                                            {set.reps} × {set.weight}kg
                                          </div>
                                          <div className="text-[#dc1e3a] text-sm font-bold">
                                            = {set.reps * Math.max(set.weight, 1)}kg
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                    
                                    {/* Volume Calculation Breakdown */}
                                    <div className="mt-4 p-4 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/20">
                                      <div className="flex items-center space-x-2 mb-3">
                                        <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                                        <div className="text-white/80 text-sm font-medium">Volume Calculation</div>
                                      </div>
                                      <div className="space-y-2">
                                        {exerciseSets.map((set, setIndex) => (
                                          <div key={setIndex} className="flex justify-between items-center py-1">
                                            <span className="text-white/70 text-sm">
                                              Set {setIndex + 1}: {set.reps} reps × {set.weight}kg
                                            </span>
                                            <span className="text-white font-bold text-sm">
                                              = {set.reps * Math.max(set.weight, 1)}kg
                                            </span>
                                          </div>
                                        ))}
                                        <div className="border-t border-white/20 pt-2 mt-3 flex justify-between items-center">
                                          <span className="text-white font-bold">Total Exercise Volume</span>
                                          <span className="text-[#dc1e3a] font-bold text-lg">
                                            {totalExerciseVolume.toLocaleString()}kg
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        ) : (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center border border-white/20">
                              <Dumbbell className="w-8 h-8 text-white/40" />
                            </div>
                            <div className="text-white/60 text-sm font-medium mb-1">
                              No exercises targeting {muscleGroup.toLowerCase()}
                            </div>
                            <div className="text-white/40 text-xs">
                              This muscle group is not included in the current workout plan
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary Stats */}
        <div className="mt-8 bg-gradient-to-br from-gray-800/80 to-gray-900/60 backdrop-blur-xl border border-gray-700/50 rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-xl flex items-center justify-center border border-[#dc1e3a]/30">
              <Activity className="w-4 h-4 text-[#dc1e3a]" />
            </div>
            <h3 className="text-lg font-bold text-white">Summary</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {availableMuscleGroups.length}
              </div>
              <div className="text-gray-400 text-sm">Muscle Groups Available</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {Object.values(workoutExercises).reduce((sum, exercises) => sum + exercises.length, 0)}
              </div>
              <div className="text-gray-400 text-sm">Total Exercises</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {volumeData.length}
              </div>
              <div className="text-gray-400 text-sm">Weeks Tracked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndependentMuscleGroupCharts;
