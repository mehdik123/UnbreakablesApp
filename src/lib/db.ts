import { supabase, isSupabaseReady } from './supabaseClient';

export type DBResult<T> = { data: T | null; error?: any };

// ---------- Clients CRUD ----------
export async function dbListClients(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase.from('clients').select('*').order('full_name', { ascending: true });
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


