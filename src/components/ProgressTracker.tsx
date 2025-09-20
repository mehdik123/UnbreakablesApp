import React, { useState, useEffect } from 'react';
import { Target, Database, Activity, Dumbbell, TrendingUp } from 'lucide-react';
import { Client } from '../types';
import { supabase } from '../lib/supabaseClient';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, Area, AreaChart } from 'recharts';

interface ProgressTrackerProps {
  client: Client;
  currentWeek: number;
  isDark: boolean;
}

interface ExerciseByMuscleGroup {
  [muscleGroup: string]: Array<{
    name: string;
    sets: number;
    reps: number;
    weight: number;
    volume: number;
  }>;
}

interface MuscleGroupVolume {
  [muscleGroup: string]: {
    totalVolume: number;
    exerciseCount: number;
  };
}

interface VolumeChartData {
  week: number;
  [muscleGroup: string]: number;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  client,
  currentWeek,
  isDark
}) => {
  const [allMuscleGroups, setAllMuscleGroups] = useState<string[]>([]);
  const [exercisesByMuscleGroup, setExercisesByMuscleGroup] = useState<ExerciseByMuscleGroup>({});
  const [muscleGroupVolumes, setMuscleGroupVolumes] = useState<MuscleGroupVolume>({});
  const [chartData, setChartData] = useState<VolumeChartData[]>([]);
  const [visibleCharts, setVisibleCharts] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const processData = async () => {
      try {
        console.log('🔍 PROGRESS TRACKER - Processing data for exercises by muscle group');
        
        // First, get all muscle groups from the database
        const { data: dbMuscleGroups, error: muscleError } = await supabase
          .from('exercises')
          .select('muscle_group')
          .not('muscle_group', 'is', null)
          .not('muscle_group', 'eq', '');
        
        if (muscleError) {
          console.error('🔍 PROGRESS TRACKER - Error fetching muscle groups:', muscleError);
          setAllMuscleGroups([]);
        } else if (dbMuscleGroups) {
          // Get unique muscle groups and normalize them (trim whitespace, handle case)
          const muscleGroups = dbMuscleGroups
            .map(exercise => exercise.muscle_group?.trim())
            .filter(Boolean); // Remove null/undefined/empty values
          
          console.log('🔍 PROGRESS TRACKER - Raw muscle groups before deduplication:', muscleGroups);
          
          // Check for specific "Back" variations
          const backVariations = muscleGroups.filter(mg => mg.toLowerCase().includes('back'));
          console.log('🔍 PROGRESS TRACKER - Back variations found:', backVariations);
          
          // Create a case-insensitive deduplication
          const seen = new Set();
          const uniqueMuscleGroups = muscleGroups.filter(muscleGroup => {
            const normalized = muscleGroup.toLowerCase();
            if (seen.has(normalized)) {
              console.log(`🔍 PROGRESS TRACKER - Duplicate found: "${muscleGroup}" (normalized: "${normalized}")`);
              return false;
            }
            seen.add(normalized);
            return true;
          }).sort();
          
          setAllMuscleGroups(uniqueMuscleGroups);
          console.log('🔍 PROGRESS TRACKER - Found muscle groups from database:', uniqueMuscleGroups);
          console.log('🔍 PROGRESS TRACKER - Total unique muscle groups:', uniqueMuscleGroups.length);
        }

        // Then, process the client's program
        const exercisesByMuscle: ExerciseByMuscleGroup = {};
        const volumesByMuscle: MuscleGroupVolume = {};

        if (client.workoutAssignment?.program?.days) {
          // Process each day in the program
          client.workoutAssignment.program.days.forEach((day, dayIndex) => {
            console.log(`🔍 PROGRESS TRACKER - Processing day ${dayIndex + 1}: ${day.name}`);
            
            if (!day.exercises) return;

            day.exercises.forEach((exercise, exerciseIndex) => {
              const muscleGroup = exercise.exercise?.muscleGroup?.trim();
              const exerciseName = exercise.exercise?.name;
              
              if (!muscleGroup || !exerciseName) {
                console.log(`🔍 PROGRESS TRACKER - Skipping exercise ${exerciseIndex + 1}: missing muscle group or name`);
                return;
              }

              console.log(`🔍 PROGRESS TRACKER - Found exercise: ${exerciseName} -> ${muscleGroup}`);

              // Initialize muscle group if not exists
              if (!exercisesByMuscle[muscleGroup]) {
                exercisesByMuscle[muscleGroup] = [];
                volumesByMuscle[muscleGroup] = { totalVolume: 0, exerciseCount: 0 };
              }

              // Calculate total volume for the entire exercise
              let exerciseVolume = 0;
              if (exercise.sets && exercise.sets.length > 0) {
                // Get total reps and check if any set has weight > 0
                const totalReps = exercise.sets.reduce((sum, set) => sum + set.reps, 0);
                const hasWeight = exercise.sets.some(set => set.weight > 0);
                const totalSets = exercise.sets.length;
                
                console.log(`🔍 PROGRESS TRACKER - Exercise: ${exerciseName}, Total sets: ${totalSets}, Total reps: ${totalReps}, Has weight: ${hasWeight}`);
                
                if (totalReps === 0) {
                  // If total reps are 0, volume is 0
                  exerciseVolume = 0;
                  console.log(`🔍 PROGRESS TRACKER - Exercise volume: 0 (total reps: ${totalReps})`);
                } else if (!hasWeight) {
                  // If no weight, volume = sets × reps
                  exerciseVolume = totalSets * totalReps;
                  console.log(`🔍 PROGRESS TRACKER - Exercise volume: ${totalSets} sets × ${totalReps} reps = ${exerciseVolume}`);
                } else {
                  // If has weight, calculate per set and sum
                  exercise.sets.forEach((set, setIndex) => {
                    if (set.reps > 0) {
                      const setVolume = 1 * set.reps * set.weight;
                      exerciseVolume += setVolume;
                      console.log(`🔍 PROGRESS TRACKER - Set ${setIndex + 1}: 1 set × ${set.reps} reps × ${set.weight}kg = ${setVolume} volume`);
                    }
                  });
                }
              }

              // Calculate total sets, reps, and weight for this exercise (only counting sets with reps > 0)
              const validSets = exercise.sets?.filter(set => set.reps > 0) || [];
              const totalSets = validSets.length;
              const totalReps = validSets.reduce((sum, set) => sum + set.reps, 0);
              const totalWeight = validSets.reduce((sum, set) => sum + set.weight, 0);

              // Add exercise to the muscle group
              exercisesByMuscle[muscleGroup].push({
                name: exerciseName,
                sets: totalSets,
                reps: totalReps,
                weight: totalWeight,
                volume: exerciseVolume
              });

              // Add to muscle group volume
              volumesByMuscle[muscleGroup].totalVolume += exerciseVolume;
              volumesByMuscle[muscleGroup].exerciseCount += 1;

              console.log(`🔍 PROGRESS TRACKER - Exercise "${exerciseName}" volume: ${exerciseVolume}kg for ${muscleGroup}`);
            });
          });
        }

        console.log('🔍 PROGRESS TRACKER - Final exercises by muscle group:', exercisesByMuscle);
        console.log('🔍 PROGRESS TRACKER - Final volumes by muscle group:', volumesByMuscle);
        console.log('🔍 PROGRESS TRACKER - All muscle groups from database:', allMuscleGroups);
        console.log('🔍 PROGRESS TRACKER - Muscle groups with exercises:', Object.keys(exercisesByMuscle));
        setExercisesByMuscleGroup(exercisesByMuscle);
        setMuscleGroupVolumes(volumesByMuscle);

        // Generate chart data for all weeks
        const maxWeeks = client.workoutAssignment?.weeks?.length || 12; // Default to 12 weeks if not specified
        const chartDataArray: VolumeChartData[] = [];
        
        for (let week = 1; week <= maxWeeks; week++) {
          const weekData: VolumeChartData = { week };
          
          // Include all muscle groups from database, even those with 0 volume
          allMuscleGroups.forEach(muscleGroup => {
            if (week <= currentWeek && volumesByMuscle[muscleGroup]) {
              // For current week and previous weeks, use actual volume data
              weekData[muscleGroup] = volumesByMuscle[muscleGroup].totalVolume;
            } else {
              // For future weeks or muscle groups with no exercises, set volume to 0
              weekData[muscleGroup] = 0;
            }
          });
          
          chartDataArray.push(weekData);
        }
        
        console.log('🔍 PROGRESS TRACKER - Generated chart data:', chartDataArray);
        setChartData(chartDataArray);

        // Initialize all charts as visible by default
        const initialVisibility: Record<string, boolean> = {};
        allMuscleGroups.forEach(muscleGroup => {
          initialVisibility[muscleGroup] = true;
        });
        setVisibleCharts(initialVisibility);
      } catch (error) {
        console.error('🔍 PROGRESS TRACKER - Error processing data:', error);
        setAllMuscleGroups([]);
        setExercisesByMuscleGroup({});
        setMuscleGroupVolumes({});
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [client.workoutAssignment?.program]);

  const toggleChart = (muscleGroup: string) => {
    setVisibleCharts(prev => ({
      ...prev,
      [muscleGroup]: !prev[muscleGroup]
    }));
  };

  const toggleAllCharts = () => {
    const allVisible = Object.values(visibleCharts).every(visible => visible);
    const newVisibility: Record<string, boolean> = {};
    allMuscleGroups.forEach(muscleGroup => {
      newVisibility[muscleGroup] = !allVisible;
    });
    setVisibleCharts(newVisibility);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-gray-600/30 animate-pulse">
              <Activity className="w-6 h-6 text-gray-400" />
            </div>
            <div className="flex-1">
              <div className="h-6 bg-gray-700 rounded-lg w-48 mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
            <Dumbbell className="w-6 h-6 text-[#dc1e3a]" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Program Exercises & Volume</h2>
            <p className="text-gray-400">Exercises organized by target muscle group with volume calculations</p>
            {Object.keys(muscleGroupVolumes).length > 0 && (
              <p className="text-[#dc1e3a] text-sm font-semibold mt-2">
                Total Weekly Volume: {Object.values(muscleGroupVolumes).reduce((sum, vol) => sum + vol.totalVolume, 0).toLocaleString()} kg
              </p>
            )}
          </div>
        </div>
      </div>

      {/* No Program Message */}
      {!client.workoutAssignment?.program ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-gray-600/30 mx-auto mb-4">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Workout Program Assigned</h3>
          <p className="text-gray-400">This client doesn't have a workout program assigned yet.</p>
        </div>
      ) : allMuscleGroups.length === 0 ? (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700 shadow-xl text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-gray-600/30 mx-auto mb-4">
            <Database className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No Muscle Groups Found</h3>
          <p className="text-gray-400">No muscle groups found in the exercises database.</p>
        </div>
      ) : null}

      {/* Volume Charts Section */}
      {chartData.length > 0 && allMuscleGroups.length > 0 && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
                  <TrendingUp className="w-6 h-6 text-[#dc1e3a]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">Weekly Volume Progress</h2>
                  <p className="text-gray-400">Track your training volume progression by muscle group</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleAllCharts}
                  className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white text-sm font-medium transition-colors"
                >
                  {Object.values(visibleCharts).every(visible => visible) ? 'Hide All' : 'Show All'}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {allMuscleGroups
                .filter(muscleGroup => visibleCharts[muscleGroup])
                .map((muscleGroup, index) => {
                  console.log(`🔍 PROGRESS TRACKER - Rendering chart ${index + 1}: "${muscleGroup}"`);
                const colors = [
                  '#dc1e3a', // Red
                  '#3b82f6', // Blue
                  '#10b981', // Green
                  '#f59e0b', // Yellow
                  '#8b5cf6', // Purple
                  '#ef4444', // Red-500
                  '#06b6d4', // Cyan
                  '#84cc16', // Lime
                  '#f97316', // Orange
                  '#ec4899'  // Pink
                ];
                const color = colors[index % colors.length];
                
                return (
                  <div key={muscleGroup} className="bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:border-[#dc1e3a]/30 transition-all duration-700 relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/5 via-transparent to-[#dc1e3a]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-4 h-4 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <h3 className="text-white text-xl font-bold capitalize">
                              {muscleGroup.toLowerCase()}
                            </h3>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className={`flex items-center space-x-2 rounded-full px-3 py-1 ${
                              muscleGroupVolumes[muscleGroup] && muscleGroupVolumes[muscleGroup].totalVolume > 0
                                ? 'bg-[#dc1e3a]/20'
                                : 'bg-gray-600/20'
                            }`}>
                              <span className={`text-sm font-bold ${
                                muscleGroupVolumes[muscleGroup] && muscleGroupVolumes[muscleGroup].totalVolume > 0
                                  ? 'text-[#dc1e3a]'
                                  : 'text-gray-400'
                              }`}>
                                {muscleGroupVolumes[muscleGroup] && muscleGroupVolumes[muscleGroup].totalVolume > 0
                                  ? `${muscleGroupVolumes[muscleGroup].totalVolume.toLocaleString()} kg`
                                  : '0 kg'
                                }
                              </span>
                            </div>
                            <button
                              onClick={() => toggleChart(muscleGroup)}
                              className="bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-lg p-2 text-gray-300 hover:text-white transition-colors"
                              title="Hide chart"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      
                      {muscleGroupVolumes[muscleGroup] && muscleGroupVolumes[muscleGroup].totalVolume > 0 ? (
                        <div className="h-64 relative">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                              <defs>
                                <linearGradient id={`${muscleGroup}Gradient`} x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={color} stopOpacity={0.4} />
                                  <stop offset="50%" stopColor={color} stopOpacity={0.2} />
                                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis 
                                dataKey="week"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#ffffff80', fontSize: 12, fontWeight: 500 }}
                                tickFormatter={(value) => `Week ${value}`}
                              />
                              <YAxis 
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#ffffff60', fontSize: 11 }}
                                tickFormatter={(value) => `${value}k`}
                              />
                              <Tooltip
                                content={({ active, payload, label }) => {
                                  if (active && payload && payload.length) {
                                    return (
                                      <div className="bg-black/95 backdrop-blur-xl border border-[#dc1e3a]/30 rounded-2xl p-4 shadow-2xl">
                                        <p className="text-white text-sm font-medium mb-1">
                                          Week {label}
                                        </p>
                                        <p className="text-[#dc1e3a] text-lg font-bold">
                                          {payload[0].value.toLocaleString()} kg
                                        </p>
                                      </div>
                                    );
                                  }
                                  return null;
                                }}
                              />
                              <Area
                                type="monotone"
                                dataKey={muscleGroup}
                                stroke={color}
                                strokeWidth={3}
                                fill={`url(#${muscleGroup}Gradient)`}
                                dot={{ fill: color, strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: color, strokeWidth: 2, fill: '#fff' }}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="h-64 flex items-center justify-center text-center">
                          <div>
                            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-full flex items-center justify-center">
                              <Target className="w-8 h-8 text-gray-400" />
                            </div>
                            <h4 className="text-white text-lg font-semibold mb-2">No Exercises Assigned</h4>
                            <p className="text-gray-400 text-sm mb-3">
                              Add exercises to this muscle group to start tracking volume
                            </p>
                            <div className="inline-flex items-center space-x-2 bg-gray-700/50 rounded-full px-4 py-2">
                              <span className="text-gray-300 text-sm">Ready for exercises</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hidden Charts Section */}
            {allMuscleGroups.some(muscleGroup => !visibleCharts[muscleGroup]) && (
              <div className="mt-6">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4">Hidden Charts</h3>
                  <div className="flex flex-wrap gap-2">
                    {allMuscleGroups
                      .filter(muscleGroup => !visibleCharts[muscleGroup])
                      .map((muscleGroup, index) => {
                        const colors = [
                          '#dc1e3a', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6',
                          '#ef4444', '#06b6d4', '#84cc16', '#f97316', '#ec4899'
                        ];
                        const color = colors[index % colors.length];
                        
                        return (
                          <button
                            key={muscleGroup}
                            onClick={() => toggleChart(muscleGroup)}
                            className="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 rounded-xl px-4 py-2 text-white text-sm font-medium transition-colors"
                          >
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="capitalize">{muscleGroup.toLowerCase()}</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
