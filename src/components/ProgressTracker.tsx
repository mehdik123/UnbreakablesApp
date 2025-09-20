import React, { useState, useEffect } from 'react';
import { Target, Database, Activity, Dumbbell } from 'lucide-react';
import { Client } from '../types';
import { supabase } from '../lib/supabaseClient';

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
  }>;
}

export const ProgressTracker: React.FC<ProgressTrackerProps> = ({
  client,
  currentWeek,
  isDark
}) => {
  const [allMuscleGroups, setAllMuscleGroups] = useState<string[]>([]);
  const [exercisesByMuscleGroup, setExercisesByMuscleGroup] = useState<ExerciseByMuscleGroup>({});
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
          const uniqueMuscleGroups = [...new Set(dbMuscleGroups.map(exercise => exercise.muscle_group))].sort();
          setAllMuscleGroups(uniqueMuscleGroups);
          console.log('🔍 PROGRESS TRACKER - Found muscle groups from database:', uniqueMuscleGroups);
        }

        // Then, process the client's program
        const exercisesByMuscle: ExerciseByMuscleGroup = {};

        if (client.workoutAssignment?.program?.days) {
          // Process each day in the program
          client.workoutAssignment.program.days.forEach((day, dayIndex) => {
            console.log(`🔍 PROGRESS TRACKER - Processing day ${dayIndex + 1}: ${day.name}`);
            
            if (!day.exercises) return;

            day.exercises.forEach((exercise, exerciseIndex) => {
              const muscleGroup = exercise.exercise?.muscleGroup;
              const exerciseName = exercise.exercise?.name;
              
              if (!muscleGroup || !exerciseName) {
                console.log(`🔍 PROGRESS TRACKER - Skipping exercise ${exerciseIndex + 1}: missing muscle group or name`);
                return;
              }

              console.log(`🔍 PROGRESS TRACKER - Found exercise: ${exerciseName} -> ${muscleGroup}`);

              // Initialize muscle group if not exists
              if (!exercisesByMuscle[muscleGroup]) {
                exercisesByMuscle[muscleGroup] = [];
              }

              // Calculate total sets, reps, and weight for this exercise
              const totalSets = exercise.sets?.length || 0;
              const totalReps = exercise.sets?.reduce((sum, set) => sum + set.reps, 0) || 0;
              const totalWeight = exercise.sets?.reduce((sum, set) => sum + set.weight, 0) || 0;

              // Add exercise to the muscle group
              exercisesByMuscle[muscleGroup].push({
                name: exerciseName,
                sets: totalSets,
                reps: totalReps,
                weight: totalWeight
              });
            });
          });
        }

        console.log('🔍 PROGRESS TRACKER - Final exercises by muscle group:', exercisesByMuscle);
        setExercisesByMuscleGroup(exercisesByMuscle);
      } catch (error) {
        console.error('🔍 PROGRESS TRACKER - Error processing data:', error);
        setAllMuscleGroups([]);
        setExercisesByMuscleGroup({});
      } finally {
        setIsLoading(false);
      }
    };

    processData();
  }, [client.workoutAssignment?.program]);

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
            <h2 className="text-2xl font-bold text-white mb-1">Program Exercises</h2>
            <p className="text-gray-400">Exercises organized by target muscle group</p>
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
      ) : (
        /* All Muscle Groups with Exercises or No Exercises Message */
        <div className="space-y-6">
          {allMuscleGroups.map((muscleGroup, index) => {
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
            const exercises = exercisesByMuscleGroup[muscleGroup] || [];
            
            return (
              <div key={muscleGroup} className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
                {/* Muscle Group Header */}
                <div className="flex items-center space-x-3 mb-6">
                  <div 
                    className="w-8 h-8 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${color}20` }}
                  >
                    <Target className="w-4 h-4" style={{ color }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white capitalize">
                      {muscleGroup.toLowerCase()}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {exercises.length > 0 
                        ? `${exercises.length} exercise${exercises.length !== 1 ? 's' : ''}`
                        : 'No exercises in program'
                      }
                    </p>
                  </div>
                </div>

                {/* Exercises List or No Exercises Message */}
                {exercises.length > 0 ? (
                  <div className="space-y-3">
                    {exercises.map((exercise, exerciseIndex) => (
                      <div key={exerciseIndex} className="bg-gray-700/50 rounded-xl p-4 border border-gray-600/50 hover:bg-gray-600/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: color }}
                            ></div>
                            <span className="text-white font-medium text-lg">
                              {exercise.name}
                            </span>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-400">
                            <span>{exercise.sets} sets</span>
                            <span>{exercise.reps} reps</span>
                            <span>{exercise.weight} kg</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-700/30 rounded-xl p-6 border border-gray-600/30 text-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-xl flex items-center justify-center shadow-lg border border-gray-600/30 mx-auto mb-3">
                      <Dumbbell className="w-6 h-6 text-gray-400" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      No associated exercises in your program
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;
