import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';
import { Activity, TrendingUp, Dumbbell, ChevronDown, ChevronUp, Target, Zap } from 'lucide-react';
import { Client, ClientWorkoutAssignment, Exercise } from '../types';
import { supabase } from '../lib/supabaseClient';
import { computeVolumeFromAssignment, filterVolumeChartMuscleGroups, isExcludedVolumeChartMuscleGroup, MuscleVolumeData } from '../utils/volumeCalculator';
import { formatChartVolume } from '../utils/youtube';
import { getLatestDeployedWeekNumber } from '../utils/weekCreation';
import { useClientLocale } from '../contexts/ClientLocaleContext';

interface IndependentMuscleGroupChartsProps {
  client: Client;
  isDark: boolean;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  const { t } = useClientLocale();
  if (active && payload && payload.length) {
    const muscleGroup = payload[0]?.payload?.muscleGroup || 'Unknown';
    const volume = payload[0]?.value || 0;
    
    return (
      <div className="ch-tooltip">
        <p className="text-sm font-medium mb-1" style={{ color: 'var(--txt-hi)' }}>
          {t('ch.week', { n: label })}
        </p>
        <p className="text-xl font-bold flex items-center font-saira tnum" style={{ color: 'var(--red)' }}>
          <span className="w-3 h-3 rounded-full mr-2 animate-pulse" style={{ background: 'var(--red)' }} />
          {volume.toLocaleString()} kg
        </p>
        <p className="text-xs mt-1 capitalize text-mid">{t('ch.muscleVolume', { muscle: muscleGroup })}</p>
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
  const { t } = useClientLocale();
  const [loading, setLoading] = useState(true);
  const [expandedCharts, setExpandedCharts] = useState<{ [muscleGroup: string]: boolean }>({});
  const [showNumbers, setShowNumbers] = useState(true);
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
        setAvailableMuscleGroups(filterVolumeChartMuscleGroups(normalized));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Belt-and-suspenders: never render traps / cardio / arms charts even if a stale list sneaks in
  const muscleGroups = useMemo(
    () => filterVolumeChartMuscleGroups(availableMuscleGroups),
    [availableMuscleGroups]
  );

  // Static chart data: derived from assignment + muscle groups. Recomputes only when they change; no loading spinner.
  const chartData = useMemo(
    () => computeVolumeFromAssignment(client.workoutAssignment ?? null, muscleGroups),
    [client.workoutAssignment, muscleGroups]
  );

  // Latest deployed week (not a stale assignment.currentWeek that can stay at 1 after week 2 is added)
  const currentWeek = getLatestDeployedWeekNumber(client.workoutAssignment);
  const displayDaysForCurrentWeek = useMemo(() => {
    const assignment = client.workoutAssignment;
    if (!assignment) return [];
    const weekData = assignment.weeks?.find((w: any) => w.weekNumber === currentWeek);
    const weekDays = weekData?.days && Array.isArray(weekData.days) ? weekData.days : [];
    const programDays = assignment.program?.days && Array.isArray(assignment.program.days) ? assignment.program.days : [];
    return weekDays.length > 0 ? weekDays : programDays;
  }, [client.workoutAssignment, currentWeek]);

  useEffect(() => {
    if (displayDaysForCurrentWeek.length === 0) return;
    const byGroup: { [muscleGroup: string]: Exercise[] } = {};
    displayDaysForCurrentWeek.forEach((day: any) => {
      (day.exercises || []).forEach((workoutExercise: any) => {
        const mg = workoutExercise.exercise?.muscleGroup;
        if (!mg) return;
        const norm = mg.charAt(0).toUpperCase() + mg.slice(1).toLowerCase();
        if (isExcludedVolumeChartMuscleGroup(norm)) return;
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
    const index = muscleGroups.indexOf(muscleGroup);
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

  const totalExercises = Object.values(workoutExercises).reduce((sum, exercises) => sum + exercises.length, 0);

  const progressVerdictKey = useMemo(() => {
    if (!chartData.length || muscleGroups.length === 0) return 'progress.verdictEmpty';
    const weekTotals = chartData.map((week) =>
      muscleGroups.reduce((sum, mg) => sum + ((week[mg] as number) || 0), 0)
    );
    const first = weekTotals[0] || 0;
    const last = weekTotals[weekTotals.length - 1] || 0;
    if (first === 0 && last === 0) return 'progress.verdictEmpty';
    if (last > first) return 'progress.verdictUp';
    if (last < first) return 'progress.verdictDown';
    return 'progress.verdictFlat';
  }, [chartData, muscleGroups]);

  if (loading) {
    return (
      <div className="ch-shell px-1">
        <div className="cardio-loading" aria-busy="true">
          <div className="cardio-loading-pulse" />
          <div className="cardio-loading-pulse" style={{ height: 140 }} />
        </div>
      </div>
    );
  }

  return (
    <div className="ch-shell py-2">
      <div className="max-w-7xl mx-auto px-1">
        <div className="ch-summary">
          <div className="ch-summary-icon">
            <Target className="w-[22px] h-[22px]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-saira font-semibold text-[18px] truncate" style={{ color: 'var(--txt-hi)' }}>
              {t('nav.whatYouTrain')}
            </div>
            <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
              {t(progressVerdictKey)}
            </div>
          </div>
          <div className="text-center shrink-0">
            <div className="font-saira font-bold text-[24px] leading-none tnum" style={{ color: 'var(--blue)' }}>
              {muscleGroups.length}
            </div>
            <div className="text-[10px] uppercase tracking-[0.08em] mt-1 text-lo">
              {t('ch.muscleGroupsAvailable')}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowNumbers((o) => !o)}
          className="workout-week-toggle w-full mt-3"
          aria-expanded={showNumbers}
          style={{ minHeight: 44 }}
        >
          <span className="font-saira font-semibold text-[14px]" style={{ color: 'var(--txt-hi)' }}>
            {showNumbers ? t('home.hideNumbers') : t('home.seeTheNumbers')}
          </span>
          <ChevronDown
            className={`w-4 h-4 shrink-0 transition-transform duration-200 ${showNumbers ? 'rotate-180' : ''}`}
            style={{ color: 'var(--txt-lo)' }}
          />
        </button>

        {showNumbers && (
        <>
        <div className="workout-seclabel mt-4">
          <span>{t('ch.title')}</span>
          <span className="line" />
        </div>

        {/* Muscle Group Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {muscleGroups.map((muscleGroup, index) => {
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
              <div key={muscleGroup} className="ch-muscle-card group">
                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-40 pointer-events-none" style={{ background: 'rgba(255,45,85,.08)' }} />
                
                <div className="relative z-10 p-4 sm:p-6">
                  {/* Header */}
                  <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-6">
                    <div className="flex items-center gap-3 min-w-0">
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
                        <h3 className="text-xl font-saira font-semibold capitalize mb-1" style={{ color: 'var(--txt-hi)' }}>{muscleGroup}</h3>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--red)' }} />
                          <p className="text-mid text-sm">
                            {t('ch.exercisesInWorkout', { count: exercises.length })}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0">
                      <div className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] sm:text-sm font-medium whitespace-nowrap" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                        <div className="w-2 h-2 rounded-full animate-pulse shrink-0" style={{ background: 'var(--red)' }} />
                        <span className="text-mid">{t('ch.exercises', { count: exercises.length })}</span>
                      </div>
                    </div>
                  </div>

                  {/* Chart */}
                  <div className="h-40 sm:h-48 mb-4 -mx-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={seriesData}
                        margin={{
                          top: 8,
                          right: 4,
                          left: -4,
                          bottom: 0,
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
                          tick={{ fill: '#9ca3af', fontSize: 10, fontWeight: 500 }}
                          width={36}
                          domain={[0, 'dataMax + 20']}
                          tickFormatter={formatChartVolume}
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
                    <div className="ch-stat-box">
                      <div className="text-lg font-bold flex items-center space-x-2 tnum" style={{
                        color: trend > 0 ? 'var(--emerald)' : trend < 0 ? 'var(--red)' : 'var(--txt-mid)',
                      }}>
                        <TrendingUp className={`w-4 h-4 ${trend < 0 ? 'rotate-180' : ''}`} />
                        <span>{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
                      </div>
                      <div className="text-mid text-sm mt-1">{t('ch.progressTrend')}</div>
                    </div>
                    
                    <div className="ch-stat-box">
                      <div className="text-lg font-bold font-saira tnum flex items-center space-x-2" style={{ color: 'var(--txt-hi)' }}>
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--red)' }} />
                        <span>{maxVolume.toLocaleString()}</span>
                      </div>
                      <div className="text-mid text-sm mt-1">{t('ch.peakVolume')}</div>
                    </div>
                  </div>

                  {/* Volume Calculation Summary */}
                  {exercises.length > 0 && (
                    <div className="mb-6 p-4 ch-inner-panel">
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-2 h-2 rounded-full" style={{ background: 'var(--red)' }} />
                        <div className="text-mid text-sm font-medium">{t('ch.volumeBreakdown', { muscle: muscleGroup })}</div>
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
                              <span className="text-sm" style={{ color: 'var(--txt-mid)' }}>{exercise.name}</span>
                              <span className="font-bold text-sm tnum" style={{ color: 'var(--txt-hi)' }}>{exerciseVolume.toLocaleString()}kg</span>
                            </div>
                          );
                        })}
                        <div className="pt-2 mt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--hair)' }}>
                          <span className="font-bold" style={{ color: 'var(--txt-hi)' }}>{t('ch.totalVolume', { muscle: muscleGroup })}</span>
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
                  <div className="pt-6" style={{ borderTop: '1px solid var(--hair)' }}>
                    <button
                      type="button"
                      onClick={() => toggleChartExpansion(muscleGroup)}
                      className="w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 group active:scale-[0.99]"
                      style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,45,85,.12)' }}>
                          <Dumbbell className="w-4 h-4" style={{ color: 'var(--red)' }} />
                        </div>
                        <span className="font-medium" style={{ color: 'var(--txt-hi)' }}>{t('ch.viewExerciseDetails', { count: exercises.length })}</span>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 transition-colors" style={{ color: 'var(--txt-mid)' }} />
                      ) : (
                        <ChevronDown className="w-5 h-5 transition-colors" style={{ color: 'var(--txt-mid)' }} />
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
                                className="p-3 sm:p-5 rounded-xl sm:rounded-2xl"
                                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                              >
                                <div className="flex items-center gap-2 sm:space-x-4 mb-2 sm:mb-4">
                                  <div
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0"
                                    style={{ background: 'rgba(255,45,85,.12)', border: '1px solid rgba(255,45,85,.25)' }}
                                  >
                                    <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: 'var(--red)' }} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-bold text-sm sm:text-base truncate" style={{ color: 'var(--txt-hi)' }}>
                                      {exercise.name}
                                    </div>
                                    <div className="flex items-center space-x-1.5 text-[10px] sm:text-sm" style={{ color: 'var(--txt-mid)' }}>
                                      <span className="truncate">{exercise.equipment}</span>
                                      <span>•</span>
                                      <span className="capitalize">{exercise.difficulty}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <div className="font-bold text-sm sm:text-lg tnum" style={{ color: 'var(--red)' }}>
                                      {totalExerciseVolume.toLocaleString()} kg
                                    </div>
                                    <div className="text-[9px] sm:text-xs" style={{ color: 'var(--txt-lo)' }}>{t('ch.totalVolumeShort')}</div>
                                  </div>
                                </div>
                                
                                {occurrences.length > 0 && (
                                  <div className="space-y-2 sm:space-y-4">
                                    <div className="flex items-center space-x-1.5">
                                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
                                      <div className="text-[11px] sm:text-sm font-medium" style={{ color: 'var(--txt-mid)' }}>{t('ch.setsRepsBreakdown')}</div>
                                    </div>
                                    {occurrences.map((occ, occIndex) => (
                                      <div key={occIndex}>
                                        {occurrences.length > 1 && (
                                          <div className="text-[10px] sm:text-sm font-medium mb-1" style={{ color: 'var(--txt-mid)' }}>{occ.dayName}</div>
                                        )}
                                        <div className="grid grid-cols-3 sm:grid-cols-3 gap-1.5 sm:gap-3">
                                          {occ.sets.map((set, setIndex) => (
                                            <div
                                              key={setIndex}
                                              className="rounded-lg sm:rounded-xl p-1.5 sm:p-3 text-center"
                                              style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}
                                            >
                                              <div className="text-[10px] sm:text-sm font-bold mb-0.5" style={{ color: 'var(--txt-hi)' }}>{t('ch.set', { n: setIndex + 1 })}</div>
                                              <div className="text-[9px] sm:text-sm font-medium mb-0.5 leading-tight" style={{ color: 'var(--txt-mid)' }}>
                                                {set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)
                                                  ? `${set.reps.join('→')} × ${set.weight.join('→')}kg`
                                                  : `${set.reps} × ${set.weight}kg`
                                                }
                                              </div>
                                              <div className="text-[10px] sm:text-sm font-bold tnum" style={{ color: 'var(--red)' }}>
                                                = {getSetVolume(set)}kg
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                    
                                    <div className="mt-2 sm:mt-4 p-2 sm:p-4 rounded-lg sm:rounded-xl" style={{ background: 'var(--surface-3)', border: '1px solid var(--hair)' }}>
                                      <div className="flex items-center space-x-1.5 mb-1.5 sm:mb-3">
                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--red)' }} />
                                        <div className="text-[11px] sm:text-sm font-medium" style={{ color: 'var(--txt-mid)' }}>{t('ch.volumeCalc')}</div>
                                      </div>
                                      <div className="space-y-1">
                                        {occurrences.map((occ, occIndex) => (
                                          <div key={occIndex}>
                                            {occurrences.length > 1 && (
                                              <div className="text-xs font-medium mt-2 mb-1" style={{ color: 'var(--txt-lo)' }}>{occ.dayName}</div>
                                            )}
                                            {occ.sets.map((set, setIndex) => (
                                              <div key={setIndex} className="flex justify-between items-center py-0.5 sm:py-1">
                                                <span className="text-[10px] sm:text-sm" style={{ color: 'var(--txt-mid)' }}>
                                                  {t('ch.set', { n: setIndex + 1 })}: {set.isDropset && Array.isArray(set.reps) && Array.isArray(set.weight)
                                                    ? `${set.reps.join('→')} ${t('ch.reps')} × ${set.weight.join('→')}kg`
                                                    : `${set.reps} ${t('ch.reps')} × ${set.weight}kg`
                                                  }
                                                </span>
                                                <span className="font-bold text-[10px] sm:text-sm tnum" style={{ color: 'var(--txt-hi)' }}>
                                                  = {getSetVolume(set)}kg
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        ))}
                                        <div className="pt-1.5 sm:pt-2 mt-2 sm:mt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--hair)' }}>
                                          <span className="font-bold text-[10px] sm:text-sm" style={{ color: 'var(--txt-hi)' }}>{t('ch.totalExerciseVolume')}</span>
                                          <span className="font-bold text-sm sm:text-lg tnum" style={{ color: 'var(--red)' }}>
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
                            <div
                              className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
                              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                            >
                              <Dumbbell className="w-8 h-8" style={{ color: 'var(--txt-lo)' }} />
                            </div>
                            <div className="text-sm font-medium mb-1" style={{ color: 'var(--txt-mid)' }}>
                              {t('ch.noExercisesTargeting', { muscle: muscleGroup.toLowerCase() })}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--txt-lo)' }}>
                              {t('ch.notInPlan')}
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
        <div className="ch-summary-footer">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,45,85,.12)', border: '1px solid rgba(255,45,85,.22)' }}>
              <Activity className="w-4 h-4" style={{ color: 'var(--red)' }} />
            </div>
            <h3 className="text-lg font-saira font-semibold" style={{ color: 'var(--txt-hi)' }}>{t('ch.summary')}</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="wt-stat-tile text-center">
              <div className="wt-stat-val">{muscleGroups.length}</div>
              <div className="text-mid text-sm mt-1">{t('ch.muscleGroupsAvailable')}</div>
            </div>
            
            <div className="wt-stat-tile text-center">
              <div className="wt-stat-val">{totalExercises}</div>
              <div className="text-mid text-sm mt-1">{t('ch.totalExercises')}</div>
            </div>
            
            <div className="wt-stat-tile text-center">
              <div className="wt-stat-val">{chartData.length}</div>
              <div className="text-mid text-sm mt-1">{t('ch.weeksTracked')}</div>
            </div>
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
});

IndependentMuscleGroupCharts.displayName = 'IndependentMuscleGroupCharts';

export default IndependentMuscleGroupCharts;
