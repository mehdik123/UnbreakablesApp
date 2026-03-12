import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, Dumbbell, ChevronDown, ChevronUp, Target, Zap } from 'lucide-react';
import { Client, ClientWorkoutAssignment, Exercise } from '../types';
import { supabase } from '../lib/supabaseClient';
import { computeVolumeFromAssignment, MuscleVolumeData } from '../utils/volumeCalculator';

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

export const IndependentMuscleGroupCharts: React.FC<IndependentMuscleGroupChartsProps> = memo(({
  client,
  isDark
}) => {
  const [loading, setLoading] = useState(true);
  const [expandedCharts, setExpandedCharts] = useState<{ [muscleGroup: string]: boolean }>({});
  const [workoutExercises, setWorkoutExercises] = useState<{ [muscleGroup: string]: Exercise[] }>({});
  const [availableMuscleGroups, setAvailableMuscleGroups] = useState<string[]>([]);
  const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});

  // Fetch muscle groups once on mount (static list)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase.from('exercises').select('muscle_group').not('muscle_group', 'is', null);
        if (cancelled || error) return;
        const raw = data?.map(item => item.muscle_group) || [];
        const normalized = [...new Set(raw.filter(Boolean).map((g: string) => g.trim().charAt(0).toUpperCase() + g.trim().slice(1).toLowerCase()))];
        setAvailableMuscleGroups(normalized);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Static chart data: derived from assignment + muscle groups. Recomputes only when they change; no loading spinner.
  const chartData = useMemo(
    () => computeVolumeFromAssignment(client.workoutAssignment ?? null, availableMuscleGroups),
    [client.workoutAssignment, availableMuscleGroups]
  );

  // Current week's days: use assignment.weeks[currentWeek].days (client-saved reps/weight) when present, else program.days
  const currentWeek = client.workoutAssignment?.currentWeek ?? 1;
  const displayDaysForCurrentWeek = useMemo(() => {
    const assignment = client.workoutAssignment;
    if (!assignment) return [];
    const weekData = assignment.weeks?.find((w: any) => w.weekNumber === currentWeek);
    const weekDays = weekData?.days && Array.isArray(weekData.days) ? weekData.days : [];
    const programDays = assignment.program?.days && Array.isArray(assignment.program.days) ? assignment.program.days : [];
    return weekDays.length > 0 ? weekDays : programDays;
  }, [client.workoutAssignment, currentWeek]);

  // Extract exercises by muscle group from current week's days (so volume and details use client-saved data)
  const muscleGroups = useMemo(() => availableMuscleGroups, [availableMuscleGroups]);

  useEffect(() => {
    if (displayDaysForCurrentWeek.length === 0) return;
    const byGroup: { [muscleGroup: string]: Exercise[] } = {};
    displayDaysForCurrentWeek.forEach((day: any) => {
      (day.exercises || []).forEach((workoutExercise: any) => {
        const mg = workoutExercise.exercise?.muscleGroup;
        if (!mg) return;
        const norm = mg.charAt(0).toUpperCase() + mg.slice(1).toLowerCase();
        if (!byGroup[norm]) byGroup[norm] = [];
        if (!byGroup[norm].some((ex: any) => ex.id === workoutExercise.exercise?.id)) {
          byGroup[norm].push(workoutExercise.exercise);
        }
      });
    });
    setWorkoutExercises(byGroup);
  }, [client.workoutAssignment, displayDaysForCurrentWeek]);

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

  // Muscle group image mapping
  const getMuscleImageUrls = (muscleGroup: string): string[] => {
    const normalized = muscleGroup.charAt(0).toUpperCase() + muscleGroup.slice(1).toLowerCase();
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
    
    return imageMap[normalized] || imageMap['Core'];
  };

  // Handle image load errors
  const handleImageError = (muscleGroup: string) => {
    console.warn(`Image not found for ${muscleGroup}`);
    setImageErrors(prev => ({ ...prev, [muscleGroup]: true }));
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
            
            // Calculate current week volume from current week's days (client-saved reps/weight)
            const currentWeekVolume = exercises.reduce((sum, exercise) => {
              let exerciseVolume = 0;
              displayDaysForCurrentWeek.forEach((day: any) => {
                (day.exercises || []).forEach((workoutExercise: any) => {
                  if (workoutExercise.exercise?.id === exercise.id) {
                    (workoutExercise.sets || []).forEach((set: any) => {
                      if (set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)) {
                        for (let i = 0; i < set.reps.length && i < set.weight.length; i++) {
                          const rep = typeof set.reps[i] === 'number' ? set.reps[i] : 0;
                          const w = typeof set.weight[i] === 'number' ? set.weight[i] : 0;
                          exerciseVolume += w === 0 ? rep : rep * w;
                        }
                      } else {
                        const r = typeof set.reps === 'number' ? set.reps : 0;
                        const w = typeof set.weight === 'number' ? set.weight : 0;
                        exerciseVolume += w === 0 ? r : r * w;
                      }
                    });
                  }
                });
              });
              return sum + exerciseVolume;
            }, 0);

            // Get chart series for this muscle group (from component chartData - assignment.weeks[].days)
            const seriesData = chartData.map(week => ({
              week: week.week,
              volume: (week[muscleGroup] as number) || 0,
              muscleGroup
            }));

            const currentWeekIndex = seriesData.findIndex(week => week.week === currentWeek);
            if (currentWeekIndex !== -1) {
              seriesData[currentWeekIndex].volume = currentWeekVolume;
            }

            const totalVolume = seriesData.reduce((sum, week) => sum + week.volume, 0);
            // Peak Volume = same as "Total X Volume" in the breakdown so they always match after refresh.
            // Use breakdown total (currentWeekVolume); fallback to max of chart when program.days is empty.
            const breakdownTotal = currentWeekVolume;
            const maxFromChart = chartData.length > 0 ? Math.max(...chartData.map(w => (w[muscleGroup] as number) || 0), 0) : 0;
            const maxVolume = breakdownTotal > 0 ? breakdownTotal : maxFromChart;

            const firstWeekVolume = seriesData[0]?.volume || 0;
            const completedWeeks = seriesData.filter(week => week.week <= currentWeek);
            const lastCompletedWeek = completedWeeks[completedWeeks.length - 1];
            const lastWeekVolume = lastCompletedWeek?.volume || 0;
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
                        className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl border relative overflow-hidden"
                        style={{ 
                          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
                          borderColor: `${color}30`
                        }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                        {!imageErrors[muscleGroup] ? (
                          <div className="relative z-10 w-full h-full flex items-center justify-center gap-0.5 p-1.5">
                            {getMuscleImageUrls(muscleGroup).map((imageUrl, index) => (
                              <img 
                                key={`${muscleGroup}-${index}`}
                                src={imageUrl}
                                alt={`${muscleGroup} muscle`}
                                className={`${getMuscleImageUrls(muscleGroup).length > 1 ? 'w-1/2' : 'w-full'} h-full`}
                                style={{ 
                                  filter: 'brightness(1.1) saturate(1.1)',
                                  imageRendering: 'crisp-edges',
                                  objectFit: 'contain',
                                  maxWidth: getMuscleImageUrls(muscleGroup).length > 1 ? '24px' : '48px',
                                  maxHeight: '48px'
                                }}
                                onError={() => handleImageError(muscleGroup)}
                              />
                            ))}
                          </div>
                        ) : (
                          <Activity className="relative z-10 w-6 h-6 text-white/80" />
                        )}
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
                        data={seriesData}
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
                          displayDaysForCurrentWeek.forEach((day: any) => {
                            (day.exercises || []).forEach((workoutExercise: any) => {
                              if (workoutExercise.exercise?.id === exercise.id) {
                                (workoutExercise.sets || []).forEach((set: any) => {
                                  if (set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)) {
                                    for (let i = 0; i < set.reps.length && i < set.weight.length; i++) {
                                      const rep = typeof set.reps[i] === 'number' ? set.reps[i] : 0;
                                      const w = typeof set.weight[i] === 'number' ? set.weight[i] : 0;
                                      exerciseVolume += w === 0 ? rep : rep * w;
                                    }
                                  } else {
                                    const r = typeof set.reps === 'number' ? set.reps : 0;
                                    const w = typeof set.weight === 'number' ? set.weight : 0;
                                    exerciseVolume += w === 0 ? r : r * w;
                                  }
                                });
                              }
                            });
                          });
                          return (
                            <div key={exercise.id} className="flex justify-between items-center py-1">
                              <span className="text-white/70 text-sm">{exercise.name}</span>
                              <span className="text-white font-bold text-sm">{exerciseVolume.toLocaleString()}kg</span>
                            </div>
                          );
                        })}
                        <div className="border-t border-white/20 pt-2 mt-3 flex justify-between items-center">
                          <span className="text-white font-bold">Total {muscleGroup} Volume</span>
                          <span className="text-[#dc1e3a] font-bold text-lg">
                            {exercises.reduce((sum, exercise) => {
                              let exerciseVolume = 0;
                              displayDaysForCurrentWeek.forEach((day: any) => {
                                  (day.exercises || []).forEach((workoutExercise: any) => {
                                    if (workoutExercise.exercise?.id === exercise.id) {
                                      (workoutExercise.sets || []).forEach((set: any) => {
                                        if (set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)) {
                                          for (let i = 0; i < set.reps.length && i < set.weight.length; i++) {
                                            const rep = typeof set.reps[i] === 'number' ? set.reps[i] : 0;
                                            const w = typeof set.weight[i] === 'number' ? set.weight[i] : 0;
                                            exerciseVolume += w === 0 ? rep : rep * w;
                                          }
                                        } else {
                                          const r = typeof set.reps === 'number' ? set.reps : 0;
                                          const w = typeof set.weight === 'number' ? set.weight : 0;
                                          exerciseVolume += w === 0 ? r : r * w;
                                        }
                                      });
                                    }
                                  });
                                });
                              return sum + exerciseVolume;
                            }, 0).toLocaleString()}kg
                          </span>
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
                            // Collect every day this exercise appears so we show all sets (e.g. Day 1 + Day 3 = 378)
                            type DaySets = { dayName: string; sets: any[] };
                            const occurrences: DaySets[] = [];
                            const volAcc = { vol: 0 };
                            const exerciseIdMatch = (ex: any) => ex?.id === exercise.id;
                            const exerciseNameMatch = (ex: any) => (ex?.name || ex?.exercise?.name || '').toString().trim().toLowerCase() === (exercise.name || '').toString().trim().toLowerCase();
                            const addSetVolume = (set: any, acc: { vol: number }) => {
                              if (set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)) {
                                for (let i = 0; i < set.reps.length && i < set.weight.length; i++) {
                                  const rep = typeof set.reps[i] === 'number' ? set.reps[i] : 0;
                                  const w = typeof set.weight[i] === 'number' ? set.weight[i] : 0;
                                  acc.vol += w === 0 ? rep : rep * w;
                                }
                              } else {
                                const r = typeof set.reps === 'number' ? set.reps : 0;
                                const w = typeof set.weight === 'number' ? set.weight : 0;
                                acc.vol += w === 0 ? r : r * w;
                              }
                            };
                            const getSetVolume = (set: any): number => {
                              const acc = { vol: 0 };
                              addSetVolume(set, acc);
                              return acc.vol;
                            };
                            for (const day of displayDaysForCurrentWeek) {
                              for (const workoutExercise of day.exercises || []) {
                                const match = exerciseIdMatch(workoutExercise.exercise) || exerciseNameMatch(workoutExercise.exercise);
                                if (match) {
                                  const sets = workoutExercise.sets || [];
                                  occurrences.push({ dayName: day.name || `Day ${occurrences.length + 1}`, sets });
                                  sets.forEach((set: any) => addSetVolume(set, volAcc));
                                }
                              }
                            }
                            const totalExerciseVolume = volAcc.vol;
                            
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
                                
                                {/* Sets Details: show every day this exercise appears so the total adds up */}
                                {occurrences.length > 0 && (
                                  <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                      <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                                      <div className="text-white/80 text-sm font-medium">Sets & Reps Breakdown</div>
                                    </div>
                                    {occurrences.map((occ, occIndex) => (
                                      <div key={occIndex}>
                                        {occurrences.length > 1 && (
                                          <div className="text-white/70 text-sm font-medium mb-2">{occ.dayName}</div>
                                        )}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                          {occ.sets.map((set, setIndex) => (
                                            <div
                                              key={setIndex}
                                              className="bg-gradient-to-br from-white/10 to-white/5 rounded-xl p-3 text-center border border-white/20 hover:from-white/15 hover:to-white/10 transition-all duration-300"
                                            >
                                              <div className="text-white text-sm font-bold mb-1">Set {setIndex + 1}</div>
                                              <div className="text-white/80 text-sm font-medium mb-1">
                                                {set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)
                                                  ? `${set.reps.join('→')} × ${set.weight.join('→')}kg`
                                                  : `${set.reps} × ${set.weight}kg`
                                                }
                                              </div>
                                              <div className="text-[#dc1e3a] text-sm font-bold">
                                                = {getSetVolume(set)}kg
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                    
                                    {/* Volume Calculation: all sets from all days so total = 378 */}
                                    <div className="mt-4 p-4 bg-gradient-to-br from-white/5 to-white/10 rounded-xl border border-white/20">
                                      <div className="flex items-center space-x-2 mb-3">
                                        <div className="w-2 h-2 bg-[#dc1e3a] rounded-full"></div>
                                        <div className="text-white/80 text-sm font-medium">Volume Calculation</div>
                                      </div>
                                      <div className="space-y-2">
                                        {occurrences.map((occ, occIndex) => (
                                          <div key={occIndex}>
                                            {occurrences.length > 1 && (
                                              <div className="text-white/60 text-xs font-medium mt-2 mb-1">{occ.dayName}</div>
                                            )}
                                            {occ.sets.map((set, setIndex) => (
                                              <div key={setIndex} className="flex justify-between items-center py-1">
                                                <span className="text-white/70 text-sm">
                                                  Set {setIndex + 1}: {set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)
                                                    ? `${set.reps.join('→')} reps × ${set.weight.join('→')}kg`
                                                    : `${set.reps} reps × ${set.weight}kg`
                                                  }
                                                </span>
                                                <span className="text-white font-bold text-sm">
                                                  = {getSetVolume(set)}kg
                                                </span>
                                              </div>
                                            ))}
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
                {chartData.length}
              </div>
              <div className="text-gray-400 text-sm">Weeks Tracked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

IndependentMuscleGroupCharts.displayName = 'IndependentMuscleGroupCharts';

export default IndependentMuscleGroupCharts;
