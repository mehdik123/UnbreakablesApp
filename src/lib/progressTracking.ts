import { supabase } from './supabaseClient';
import { 
  WeightEntry, 
  TrainingVolumeData, 
  PersonalRecord, 
  WeeklyPerformanceSummary, 
  ExercisePerformanceLog,
  ProgressTrackingData
} from '../types';

// ========== Weight Logging Functions ==========

export async function logClientWeight(clientId: string, weight: number, date?: Date, notes?: string) {
  if (!supabase) throw new Error('Supabase not initialized');
  
  const logDate = date || new Date();
  const { data, error } = await supabase
    .from('client_weight_logs')
    .upsert({
      client_id: clientId,
      date: logDate.toISOString().split('T')[0],
      weight: weight,
      notes: notes || null
    }, {
      onConflict: 'client_id,date'
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

export async function getClientWeightLogs(clientId: string, limit?: number): Promise<WeightEntry[]> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  let query = supabase
    .from('client_weight_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('date', { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(log => ({
    id: log.id,
    date: new Date(log.date),
    weight: parseFloat(log.weight),
    notes: log.notes
  }));
}

export async function getWeightAverage(clientId: string, weekNumber: number): Promise<number | null> {
  if (!supabase) throw new Error('Supabase not initialized');
  
  // Calculate date range for the week
  const { data, error } = await supabase
    .from('client_weight_logs')
    .select('weight')
    .eq('client_id', clientId)
    .gte('date', `2024-01-01`) // This should be calculated based on start date and week
    .lte('date', `2024-12-31`); // This should be calculated based on start date and week

  if (error) throw error;
  if (!data || data.length === 0) return null;

  const totalWeight = data.reduce((sum, log) => sum + parseFloat(log.weight), 0);
  return totalWeight / data.length;
}

// ========== Training Volume Functions ==========

export async function calculateAndSaveTrainingVolume(
  clientId: string, 
  weekNumber: number, 
  exerciseData: ExercisePerformanceLog[]
): Promise<TrainingVolumeData[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  // Group exercises by muscle group and calculate volume
  const volumeByMuscleGroup: { [key: string]: { sets: number, reps: number, volume: number } } = {};

  exerciseData.forEach(log => {
    if (!volumeByMuscleGroup[log.muscleGroup]) {
      volumeByMuscleGroup[log.muscleGroup] = { sets: 0, reps: 0, volume: 0 };
    }
    
    volumeByMuscleGroup[log.muscleGroup].sets += 1;
    volumeByMuscleGroup[log.muscleGroup].reps += log.actualReps;
    volumeByMuscleGroup[log.muscleGroup].volume += log.actualWeight * log.actualReps;
  });

  // Get previous week's data for percentage calculation
  const { data: previousWeekData } = await supabase
    .from('weekly_training_volume')
    .select('*')
    .eq('client_id', clientId)
    .eq('week_number', weekNumber - 1);

  const previousVolumeMap = new Map(
    (previousWeekData || []).map(item => [item.muscle_group, item.total_volume])
  );

  // Save current week's data
  const volumeData: TrainingVolumeData[] = [];
  
  for (const [muscleGroup, data] of Object.entries(volumeByMuscleGroup)) {
    const previousVolume = previousVolumeMap.get(muscleGroup) || 0;
    const volumeChangePercent = previousVolume > 0 
      ? ((data.volume - previousVolume) / previousVolume) * 100 
      : 0;

    const { data: savedData, error } = await supabase
      .from('weekly_training_volume')
      .upsert({
        client_id: clientId,
        week_number: weekNumber,
        muscle_group: muscleGroup,
        total_sets: data.sets,
        total_reps: data.reps,
        total_volume: data.volume,
        volume_change_percent: volumeChangePercent,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'client_id,week_number,muscle_group'
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error saving training volume:', error);
      continue;
    }

    volumeData.push({
      id: savedData.id,
      clientId: savedData.client_id,
      weekNumber: savedData.week_number,
      muscleGroup: savedData.muscle_group as any,
      totalSets: savedData.total_sets,
      totalReps: savedData.total_reps,
      totalVolume: parseFloat(savedData.total_volume),
      volumeChangePercent: savedData.volume_change_percent ? parseFloat(savedData.volume_change_percent) : undefined,
      createdAt: new Date(savedData.created_at),
      updatedAt: new Date(savedData.updated_at)
    });
  }

  return volumeData;
}

export async function getTrainingVolumeHistory(clientId: string, weeks?: number): Promise<TrainingVolumeData[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  let query = supabase
    .from('weekly_training_volume')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: false });

  if (weeks) {
    query = query.limit(weeks * 6); // 6 muscle groups per week
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(item => ({
    id: item.id,
    clientId: item.client_id,
    weekNumber: item.week_number,
    muscleGroup: item.muscle_group,
    totalSets: item.total_sets,
    totalReps: item.total_reps,
    totalVolume: parseFloat(item.total_volume),
    volumeChangePercent: item.volume_change_percent ? parseFloat(item.volume_change_percent) : undefined,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at)
  }));
}

// ========== Personal Records Functions ==========

export async function calculateAndSavePRs(
  clientId: string, 
  weekNumber: number, 
  exerciseData: ExercisePerformanceLog[]
): Promise<PersonalRecord[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  const prExercises = ['bench_press', 'squat', 'deadlift', 'pull_ups', 'dips', 'bicep_curls'];
  const prs: PersonalRecord[] = [];

  for (const exerciseName of prExercises) {
    const exerciseLogs = exerciseData.filter(log => 
      log.exerciseName.toLowerCase().replace(/\s+/g, '_') === exerciseName
    );

    if (exerciseLogs.length === 0) continue;

    // Find the set with highest volume (weight * reps)
    let bestSet = exerciseLogs[0];
    let bestVolume = bestSet.actualWeight * bestSet.actualReps;

    exerciseLogs.forEach(log => {
      const volume = log.actualWeight * log.actualReps;
      if (volume > bestVolume) {
        bestVolume = volume;
        bestSet = log;
      }
    });

    const { data: savedPR, error } = await supabase
      .from('client_personal_records')
      .upsert({
        client_id: clientId,
        exercise_name: exerciseName,
        week_number: weekNumber,
        best_set_weight: bestSet.actualWeight,
        best_set_reps: bestSet.actualReps,
        total_volume: bestVolume,
        date_achieved: new Date().toISOString().split('T')[0]
      }, {
        onConflict: 'client_id,exercise_name,week_number'
      })
      .select('*')
      .single();

    if (error) {
      console.error(`Error saving PR for ${exerciseName}:`, error);
      continue;
    }

    prs.push({
      id: savedPR.id,
      clientId: savedPR.client_id,
      exerciseName: savedPR.exercise_name as any,
      weekNumber: savedPR.week_number,
      bestSetWeight: parseFloat(savedPR.best_set_weight),
      bestSetReps: savedPR.best_set_reps,
      totalVolume: parseFloat(savedPR.total_volume),
      dateAchieved: new Date(savedPR.date_achieved),
      notes: savedPR.notes,
      createdAt: new Date(savedPR.created_at)
    });
  }

  return prs;
}

export async function getClientPRHistory(clientId: string, exerciseName?: string): Promise<PersonalRecord[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  let query = supabase
    .from('client_personal_records')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: false });

  if (exerciseName) {
    query = query.eq('exercise_name', exerciseName);
  }

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map(pr => ({
    id: pr.id,
    clientId: pr.client_id,
    exerciseName: pr.exercise_name,
    weekNumber: pr.week_number,
    bestSetWeight: parseFloat(pr.best_set_weight),
    bestSetReps: pr.best_set_reps,
    totalVolume: parseFloat(pr.total_volume),
    dateAchieved: new Date(pr.date_achieved),
    notes: pr.notes,
    createdAt: new Date(pr.created_at)
  }));
}

// ========== Exercise Performance Logging ==========

export async function logExercisePerformance(performanceLog: Omit<ExercisePerformanceLog, 'id' | 'loggedAt'>) {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('exercise_performance_logs')
    .insert({
      client_id: performanceLog.clientId,
      workout_assignment_id: performanceLog.workoutAssignmentId,
      exercise_name: performanceLog.exerciseName,
      muscle_group: performanceLog.muscleGroup,
      week_number: performanceLog.weekNumber,
      day_number: performanceLog.dayNumber,
      set_number: performanceLog.setNumber,
      planned_reps: performanceLog.plannedReps,
      actual_reps: performanceLog.actualReps,
      planned_weight: performanceLog.plannedWeight,
      actual_weight: performanceLog.actualWeight,
      rpe: performanceLog.rpe,
      notes: performanceLog.notes
    })
    .select('*')
    .single();

  if (error) throw error;
  return data;
}

// ========== Weekly Performance Summary ==========

export async function updateWeeklyPerformanceSummary(
  clientId: string, 
  weekNumber: number, 
  isCompleted: boolean = false
): Promise<WeeklyPerformanceSummary> {
  if (!supabase) throw new Error('Supabase not initialized');

  // Get all exercise logs for this week
  const { data: exerciseLogs } = await supabase
    .from('exercise_performance_logs')
    .select('*')
    .eq('client_id', clientId)
    .eq('week_number', weekNumber);

  // Calculate totals
  const totalSets = exerciseLogs?.length || 0;
  const totalVolume = exerciseLogs?.reduce((sum, log) => sum + (log.actual_weight * log.actual_reps), 0) || 0;

  // Get PRs for this week
  const { data: prs } = await supabase
    .from('client_personal_records')
    .select('*')
    .eq('client_id', clientId)
    .eq('week_number', weekNumber);

  // Get weight average for this week
  const averageWeight = await getWeightAverage(clientId, weekNumber);

  const { data, error } = await supabase
    .from('weekly_performance_summary')
    .upsert({
      client_id: clientId,
      week_number: weekNumber,
      start_date: new Date().toISOString().split('T')[0], // This should be calculated properly
      end_date: new Date().toISOString().split('T')[0], // This should be calculated properly
      is_completed: isCompleted,
      completed_at: isCompleted ? new Date().toISOString() : null,
      total_sets_completed: totalSets,
      total_volume: totalVolume,
      average_weight: averageWeight,
      pr_count: prs?.length || 0,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'client_id,week_number'
    })
    .select('*')
    .single();

  if (error) throw error;

  return {
    id: data.id,
    clientId: data.client_id,
    weekNumber: data.week_number,
    startDate: new Date(data.start_date),
    endDate: new Date(data.end_date),
    isCompleted: data.is_completed,
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    totalWorkoutsCompleted: data.total_workouts_completed || 0,
    totalSetsCompleted: data.total_sets_completed,
    totalVolume: parseFloat(data.total_volume),
    averageWeight: data.average_weight ? parseFloat(data.average_weight) : undefined,
    weightChange: data.weight_change ? parseFloat(data.weight_change) : undefined,
    prCount: data.pr_count,
    notes: data.notes,
    createdAt: new Date(data.created_at),
    updatedAt: new Date(data.updated_at)
  };
}

// ========== Comprehensive Progress Data ==========

export async function getClientProgressData(clientId: string): Promise<ProgressTrackingData> {
  const [weightLogs, trainingVolume, personalRecords, exerciseLogs] = await Promise.all([
    getClientWeightLogs(clientId),
    getTrainingVolumeHistory(clientId),
    getClientPRHistory(clientId),
    getExercisePerformanceLogs(clientId)
  ]);

  const { data: weeklyPerformanceData } = await supabase!
    .from('weekly_performance_summary')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: false });

  const weeklyPerformance = (weeklyPerformanceData || []).map(item => ({
    id: item.id,
    clientId: item.client_id,
    weekNumber: item.week_number,
    startDate: new Date(item.start_date),
    endDate: new Date(item.end_date),
    isCompleted: item.is_completed,
    completedAt: item.completed_at ? new Date(item.completed_at) : undefined,
    totalWorkoutsCompleted: item.total_workouts_completed || 0,
    totalSetsCompleted: item.total_sets_completed,
    totalVolume: parseFloat(item.total_volume),
    averageWeight: item.average_weight ? parseFloat(item.average_weight) : undefined,
    weightChange: item.weight_change ? parseFloat(item.weight_change) : undefined,
    prCount: item.pr_count,
    notes: item.notes,
    createdAt: new Date(item.created_at),
    updatedAt: new Date(item.updated_at)
  }));

  return {
    weightLogs,
    trainingVolume,
    personalRecords,
    weeklyPerformance,
    exerciseLogs
  };
}

async function getExercisePerformanceLogs(clientId: string): Promise<ExercisePerformanceLog[]> {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('exercise_performance_logs')
    .select('*')
    .eq('client_id', clientId)
    .order('logged_at', { ascending: false });

  if (error) throw error;

  return (data || []).map(log => ({
    id: log.id,
    clientId: log.client_id,
    workoutAssignmentId: log.workout_assignment_id,
    exerciseName: log.exercise_name,
    muscleGroup: log.muscle_group,
    weekNumber: log.week_number,
    dayNumber: log.day_number,
    setNumber: log.set_number,
    plannedReps: log.planned_reps,
    actualReps: log.actual_reps,
    plannedWeight: log.planned_weight,
    actualWeight: log.actual_weight,
    rpe: log.rpe,
    notes: log.notes,
    loggedAt: new Date(log.logged_at)
  }));
}
