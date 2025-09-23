import { supabase, isSupabaseReady } from './supabaseClient';

export type DBResult<T> = { data: T | null; error?: any };

// ---------- Clients CRUD ----------
export async function dbListClients(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase.from('clients').select('*').order('full_name', { ascending: true });
  return { data: data || [], error };
}

export async function dbListClientsWithWorkoutAssignments(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      workout_assignments(
        *,
        workout_programs(*)
      )
    `)
    .eq('workout_assignments.is_active', true)
    .order('full_name', { ascending: true });
  
  return { data: data || [], error };
}

export async function dbAddClient(payload: { full_name: string }): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('clients').insert({ full_name: payload.full_name }).select('*').single();
  return { data, error };
}

export async function dbUpdateClient(id: string, updates: { full_name?: string }): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select('*').maybeSingle();
  return { data, error };
}

export async function dbDeleteClient(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { error } = await supabase.from('clients').delete().eq('id', id);
  return { data: null, error };
}

// ---------- Exercises CRUD ----------
export async function dbListExercises(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase.from('exercises').select('*').order('name', { ascending: true });
  return { data: data || [], error };
}

export async function dbAddExercise(payload: { name: string; video_url?: string; muscle_group?: string }): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('exercises').insert(payload).select('*').single();
  return { data, error };
}

export async function dbUpdateExercise(id: string, updates: any): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('exercises').update(updates).eq('id', id).select('*').maybeSingle();
  return { data, error };
}

export async function dbDeleteExercise(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { error } = await supabase.from('exercises').delete().eq('id', id);
  return { data: null, error };
}

// ---------- Weekly Volume Tracking CRUD ----------
export async function dbSaveWeeklyVolume(
  clientId: string, 
  weekNumber: number, 
  muscleGroup: string, 
  volume: number
): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  
  const { data, error } = await supabase
    .from('weekly_volume_tracking')
    .upsert({
      client_id: clientId,
      week_number: weekNumber,
      muscle_group: muscleGroup,
      volume: volume,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'client_id,week_number,muscle_group'
    })
    .select('*')
    .single();
  
  return { data, error };
}

export async function dbGetWeeklyVolume(
  clientId: string, 
  weekNumber?: number
): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  
  let query = supabase
    .from('weekly_volume_tracking')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true });
  
  if (weekNumber !== undefined) {
    query = query.eq('week_number', weekNumber);
  }
  
  const { data, error } = await query;
  return { data: data || [], error };
}

export async function dbGetVolumeHistory(clientId: string): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  
  const { data, error } = await supabase
    .from('weekly_volume_tracking')
    .select('*')
    .eq('client_id', clientId)
    .order('week_number', { ascending: true });
  
  return { data: data || [], error };
}

// ---------- Ingredients CRUD ----------
export async function dbListIngredients(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase.from('ingredients').select('id,name,kcal,protein,fat,carbs').order('name', { ascending: true });
  return { data: data || [], error };
}

export async function dbAddIngredient(payload: { name: string; kcal: number; protein: number; fat: number; carbs: number }): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('ingredients').insert(payload).select('*').single();
  return { data, error };
}

export async function dbUpdateIngredient(id: string, updates: any): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('ingredients').update(updates).eq('id', id).select('*').maybeSingle();
  return { data, error };
}

export async function dbDeleteIngredient(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { error } = await supabase.from('ingredients').delete().eq('id', id);
  return { data: null, error };
}

// ---------- Workout Templates (Programs) ----------
export async function dbListPrograms(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase.from('workout_programs').select('*').order('name', { ascending: true });
  return { data: data || [], error };
}

export async function dbCreateProgram(name: string, description?: string): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('workout_programs').insert({ name, description, is_template: true }).select('*').single();
  return { data, error };
}

export async function dbAddDay(programId: string, name: string, order: number): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('workout_days').insert({ program_id: programId, name, day_order: order }).select('*').single();
  return { data, error };
}

export async function dbAddDayExercise(dayId: string, exerciseId: string, rest: string, order: number): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('workout_exercises').insert({ day_id: dayId, exercise_id: exerciseId, rest, ex_order: order }).select('*').single();
  return { data, error };
}

export async function dbAddSet(workoutExerciseId: string, order: number, reps: number, weight: number): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('workout_sets').insert({ workout_exercise_id: workoutExerciseId, set_order: order, reps, weight }).select('*').single();
  return { data, error };
}

// ---------- Meals CRUD ----------
export async function dbListMeals(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase
    .from('meals')
    .select(`
      *,
      meal_items (
        *,
        ingredients (name, kcal, protein, fat, carbs)
      )
    `)
    .order('name', { ascending: true });
  return { data: data || [], error };
}

export async function dbAddMeal(payload: { name: string; image?: string; cooking_instructions?: string; is_template?: boolean; kcal_target?: number }): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('meals').insert(payload).select('*').single();
  return { data, error };
}

export async function dbUpdateMeal(id: string, updates: any): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('meals').update(updates).eq('id', id).select('*').maybeSingle();
  return { data, error };
}

export async function dbDeleteMeal(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { error } = await supabase.from('meals').delete().eq('id', id);
  return { data: null, error };
}

export async function dbAddMealItem(mealId: string, ingredientId: string, quantity: number): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('meal_items').insert({ meal_id: mealId, ingredient_id: ingredientId, quantity_g: quantity }).select('*').single();
  return { data, error };
}

export async function dbDeleteMealItem(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { error } = await supabase.from('meal_items').delete().eq('id', id);
  return { data: null, error };
}

// ---------- Nutrition Plans ----------
// We store the entire client-specific plan as JSON to guarantee copy-on-assign semantics.
export async function dbUpsertNutritionPlan(clientId: string, planJson: any): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  
  // Calculate total daily kcal from plan
  const dailyKcal = planJson.dailyCalories || planJson.meals?.reduce((total: number, meal: any) => total + (meal.calories || 0), 0) || 0;
  
  const payload = { 
    client_id: clientId, 
    plan_json: planJson, 
    updated_at: new Date().toISOString(),
    name: planJson.clientName ? `${planJson.clientName}'s Nutrition Plan` : 'Nutrition Plan',
    daily_kcal_goal: dailyKcal
  } as any;
  
  const { data, error } = await supabase
    .from('nutrition_plans')
    .upsert(payload, { onConflict: 'client_id' })
    .select('*')
    .maybeSingle();
  return { data, error };
}

export async function dbGetNutritionPlan(clientId: string): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('nutrition_plans')
    .select('plan_json, updated_at')
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data?.plan_json || null, error };
}

// ---------- Workout Programs CRUD (Using your existing tables) ----------
export async function dbListWorkoutPrograms(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase
    .from('workout_programs')
    .select(`
      *,
      workout_days (
        *,
        workout_exercises (
          *,
          workout_sets (*)
        )
      )
    `)
    .order('name', { ascending: true }); // Use name since created_at might not exist yet
  return { data: data || [], error };
}

export async function dbCreateWorkoutProgram(payload: {
  name: string;
  description?: string;
  category?: string;
  days_per_week: number;
  difficulty?: string;
  duration_weeks?: number;
  is_custom?: boolean;
  created_by?: string;
}): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('workout_programs')
    .insert(payload)
    .select('*')
    .single();
  return { data, error };
}

export async function dbCreateWorkoutDay(programId: string, name: string, dayOrder: number): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('workout_days')
    .insert({ program_id: programId, name, day_order: dayOrder })
    .select('*')
    .single();
  return { data, error };
}

export async function dbAddWorkoutExercise(dayId: string, exerciseId: string, exerciseOrder: number, rest?: string, notes?: string): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('workout_exercises')
    .insert({ 
      day_id: dayId, 
      exercise_id: exerciseId, // Use text column as it exists
      ex_order: exerciseOrder,
      rest: rest || '90 seconds',
      notes: notes || ''
    })
    .select('*')
    .single();
  return { data, error };
}

export async function dbAddWorkoutSet(workoutExerciseId: string, setOrder: number, reps: number, weight?: number): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('workout_sets')
    .insert({ 
      workout_exercise_id: workoutExerciseId, // Match your actual column name
      set_order: setOrder,
      reps,
      weight: weight || 0
    })
    .select('*')
    .single();
  return { data, error };
}

export async function dbDeleteWorkoutProgram(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { error } = await supabase.from('workout_programs').delete().eq('id', id);
  return { data: null, error };
}

// ---------- Workout Assignments CRUD ----------
export async function dbCreateWorkoutAssignment(payload: {
  client_id: string;
  program_id?: string;
  program_json: any;
  start_date?: string;
  duration_weeks: number;
  current_week?: number;
  current_day?: number;
  is_active?: boolean;
  last_modified_by?: string;
}): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  
  // If no program_id is provided, try to find a matching program by name
  let programId = payload.program_id;
  if (!programId && payload.program_json?.name) {
    const { data: program } = await supabase
      .from('workout_programs')
      .select('id')
      .eq('name', payload.program_json.name)
      .maybeSingle();
    programId = program?.id;
  }
  
  // If still no program_id, create a temporary one or use a default
  if (!programId) {
    // Create a temporary program entry for this assignment
    const { data: tempProgram } = await supabase
      .from('workout_programs')
      .insert({
        name: payload.program_json?.name || 'Custom Program',
        description: payload.program_json?.description || 'Custom workout program',
        is_template: false
      })
      .select('id')
      .single();
    programId = tempProgram?.id;
  }
  
  const insertPayload = {
    client_id: payload.client_id,
    program_id: programId,
    program_json: payload.program_json,
    start_date: payload.start_date || new Date().toISOString().split('T')[0],
    duration_weeks: payload.duration_weeks,
    current_week: payload.current_week || 1,
    current_day: payload.current_day || 1,
    is_active: payload.is_active !== false,
    last_modified_by: payload.last_modified_by || 'coach'
  };
  
  console.log('🗄️ DB CREATE DEBUG - Insert payload:', insertPayload);
  console.log('🗄️ DB CREATE DEBUG - program_json in payload:', insertPayload.program_json);
  console.log('🗄️ DB CREATE DEBUG - weeks in program_json:', insertPayload.program_json?.weeks);
  
  const { data, error } = await supabase
    .from('workout_assignments')
    .insert(insertPayload)
    .select('*')
    .single();
    
  console.log('🗄️ DB CREATE DEBUG - Insert result:', { data, error });
  console.log('🗄️ DB CREATE DEBUG - Created program_json:', data?.program_json);
  console.log('🗄️ DB CREATE DEBUG - Weeks in created result:', data?.program_json?.weeks);
  return { data, error };
}

export async function dbUpdateWorkoutAssignment(id: string, payload: {
  program_json?: any;
  current_week?: number;
  current_day?: number;
  is_active?: boolean;
  last_modified_by?: string;
}): Promise<DBResult<any>> {
  console.log('🗄️ DB UPDATE DEBUG - Updating workout assignment:', {
    id,
    payload,
    isSupabaseReady,
    hasSupabase: !!supabase
  });
  
  if (!isSupabaseReady || !supabase) {
    console.log('❌ DB UPDATE DEBUG - Supabase not ready');
    return { data: null };
  }
  
  const updatePayload = {
    ...payload,
    last_modified_at: new Date().toISOString()
  };
  
  console.log('🗄️ DB UPDATE DEBUG - Final update payload:', updatePayload);
  console.log('🗄️ DB UPDATE DEBUG - program_json in payload:', updatePayload.program_json);
  console.log('🗄️ DB UPDATE DEBUG - weeks in program_json:', updatePayload.program_json?.weeks);
  
  console.log('🗄️ DB UPDATE DEBUG - About to execute update query');
  console.log('🗄️ DB UPDATE DEBUG - Table: workout_assignments');
  console.log('🗄️ DB UPDATE DEBUG - ID filter:', id);
  
  const { data, error } = await supabase
    .from('workout_assignments')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();
    
  console.log('🗄️ DB UPDATE DEBUG - Update result:', { data, error });
  console.log('🗄️ DB UPDATE DEBUG - Updated program_json in result:', data?.program_json);
  console.log('🗄️ DB UPDATE DEBUG - Weeks in updated result:', data?.program_json?.weeks);
  
  return { data, error };
}

export async function dbGetClientWorkoutAssignment(clientId: string): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('workout_assignments')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('last_modified_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data, error };
}


