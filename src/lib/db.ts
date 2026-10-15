import { supabase, isSupabaseReady } from './supabaseClient';

export type DBResult<T> = { data: T | null; error?: any };

// Photo storage types
export interface WeeklyPhoto {
  id: string;
  client_id: string;
  week: number;
  type: 'front' | 'side' | 'back';
  image_url: string;
  uploaded_at: string;
  // Component interface
  imageUrl?: string;
  uploadedAt?: Date;
}

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

/** Fetch a single client by id with workout assignments (for client login fallback). */
export async function dbGetClientWithWorkoutAssignment(clientId: string): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      workout_assignments(
        *,
        workout_programs(*)
      )
    `)
    .eq('id', clientId)
    .maybeSingle();
  return { data, error };
}

export async function dbAddClient(payload: { 
  full_name: string;
  number_of_weeks?: number;
  goal?: string;
  email?: string;
  phone?: string;
  start_date?: string;
  is_active?: boolean;
  is_archived?: boolean;
  favorites?: any;
  weight_log?: any;
  starting_weight?: number | null;
}): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('clients').insert({
    full_name: payload.full_name,
    number_of_weeks: payload.number_of_weeks || 12,
    goal: payload.goal || 'maintenance',
    email: payload.email || '',
    phone: payload.phone || '',
    start_date: payload.start_date || new Date().toISOString().split('T')[0],
    is_active: payload.is_active !== false,
    is_archived: payload.is_archived === true,
    favorites: payload.favorites || [],
    weight_log: payload.weight_log || [],
    starting_weight:
      typeof payload.starting_weight === 'number' && Number.isFinite(payload.starting_weight)
        ? payload.starting_weight
        : null,
  }).select('*').single();
  return { data, error };
}

export async function dbUpdateClient(id: string, updates: {
  full_name?: string;
  number_of_weeks?: number;
  goal?: string;
  email?: string;
  phone?: string;
  start_date?: string;
  is_active?: boolean;
  is_archived?: boolean;
  starting_weight?: number | null;
}): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase.from('clients').update(updates).eq('id', id).select('*').maybeSingle();
  return { data, error };
}

function weeklyPhotoStoragePathsFromUrl(imageUrl: string): string[] {
  const marker = '/weekly-photos/';
  const idx = imageUrl.indexOf(marker);
  if (idx === -1) return [];
  let fullPath = imageUrl.slice(idx + marker.length).split('?')[0] || '';
  try {
    fullPath = decodeURIComponent(fullPath);
  } catch {
    /* keep raw */
  }
  if (!fullPath) return [];
  const thumbPath = /\.thumb\.jpe?g$/i.test(fullPath)
    ? fullPath
    : fullPath.replace(/\.jpe?g$/i, '.thumb.jpg');
  return fullPath === thumbPath ? [fullPath] : [fullPath, thumbPath];
}

/** Tables keyed by client_id that must be cleared when a client is removed. */
const CLIENT_DATA_TABLES = [
  'weekly_photos',
  'nutrition_plans',
  'workout_assignments',
  'cardio_plans',
  'weekly_volume_tracking',
  'weekly_training_volume',
  'client_weight_logs',
  'client_personal_records',
  'exercise_performance_logs',
  'weekly_performance_summary',
  'body_measurements',
  'client_supplements',
  'client_hydration',
  'client_credentials',
] as const;

export type OrphanClientDataReport = {
  orphanClientIds: string[];
  byTable: Record<string, number>;
  storageFolderIds: string[];
  liveClientCount: number;
};

/**
 * Delete every known child row + storage objects for a client.
 * Does not touch the clients row itself (caller deactivates or hard-deletes).
 */
async function wipeClientRelatedData(clientId: string): Promise<DBResult<boolean>> {
  if (!isSupabaseReady || !supabase) return { data: false };

  const errors: string[] = [];
  const run = async (label: string, fn: () => PromiseLike<{ error: any }>) => {
    const { error } = await fn();
    if (error) {
      // Missing table / RLS — log and continue so one gap doesn't abort the wipe
      console.warn(`[wipe client] ${label}:`, error.message || error);
      errors.push(label);
    }
  };

  // Progress photos: DB rows + storage (full + thumb) + leftover folder objects
  const { data: photos } = await supabase
    .from('weekly_photos')
    .select('id, image_url')
    .eq('client_id', clientId);

  const pathSet = new Set<string>();
  for (const p of photos || []) {
    for (const path of weeklyPhotoStoragePathsFromUrl(String(p.image_url || ''))) {
      pathSet.add(path);
    }
  }

  try {
    const { data: top } = await supabase.storage.from('weekly-photos').list(clientId, {
      limit: 1000,
      offset: 0,
    });
    for (const entry of top || []) {
      if (!entry?.name) continue;
      const topPath = `${clientId}/${entry.name}`;
      // File at client root
      if (entry.id != null || (entry.metadata && (entry.metadata as { size?: number }).size != null)) {
        pathSet.add(topPath);
        continue;
      }
      // Week (or other) subfolder — list files inside
      const { data: nested } = await supabase.storage
        .from('weekly-photos')
        .list(topPath, { limit: 1000, offset: 0 });
      for (const file of nested || []) {
        if (file?.name) pathSet.add(`${topPath}/${file.name}`);
      }
    }
  } catch (err) {
    console.warn('[wipe client] storage list:', err);
  }

  const paths = [...pathSet];
  if (paths.length) {
    // Storage remove accepts batches; chunk to stay under request limits
    for (let i = 0; i < paths.length; i += 100) {
      const chunk = paths.slice(i, i + 100);
      const { error } = await supabase.storage.from('weekly-photos').remove(chunk);
      if (error) {
        console.warn('[wipe client] storage remove:', error.message || error);
        errors.push('storage');
      }
    }
  }

  await run('weekly_photos', () =>
    supabase!.from('weekly_photos').delete().eq('client_id', clientId)
  );
  await run('nutrition_plans', () =>
    supabase!.from('nutrition_plans').delete().eq('client_id', clientId)
  );
  await run('workout_assignments', () =>
    supabase!.from('workout_assignments').delete().eq('client_id', clientId)
  );
  await run('cardio_plans', () =>
    supabase!.from('cardio_plans').delete().eq('client_id', clientId)
  );
  await run('weekly_volume_tracking', () =>
    supabase!.from('weekly_volume_tracking').delete().eq('client_id', clientId)
  );
  await run('weekly_training_volume', () =>
    supabase!.from('weekly_training_volume').delete().eq('client_id', clientId)
  );
  await run('client_weight_logs', () =>
    supabase!.from('client_weight_logs').delete().eq('client_id', clientId)
  );
  await run('client_personal_records', () =>
    supabase!.from('client_personal_records').delete().eq('client_id', clientId)
  );
  await run('exercise_performance_logs', () =>
    supabase!.from('exercise_performance_logs').delete().eq('client_id', clientId)
  );
  await run('weekly_performance_summary', () =>
    supabase!.from('weekly_performance_summary').delete().eq('client_id', clientId)
  );
  await run('body_measurements', () =>
    supabase!.from('body_measurements').delete().eq('client_id', clientId)
  );
  await run('client_supplements', () =>
    supabase!.from('client_supplements').delete().eq('client_id', clientId)
  );
  await run('client_hydration', () =>
    supabase!.from('client_hydration').delete().eq('client_id', clientId)
  );
  await run('client_credentials', () =>
    supabase!.from('client_credentials').delete().eq('client_id', clientId)
  );

  return {
    data: errors.length === 0,
    error: errors.length ? { message: `Partial wipe: ${errors.join(', ')}` } : null,
  };
}

/**
 * Hard-delete a client: wipe all related plan/performance/photo data, then
 * remove the clients row. Prefer this over a bare DELETE on clients.
 */
export async function dbDeleteClient(id: string): Promise<DBResult<null>> {
  if (!isSupabaseReady || !supabase) return { data: null };

  const wipe = await wipeClientRelatedData(id);
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) return { data: null, error };
  if (wipe.error) return { data: null, error: wipe.error };
  return { data: null, error: null };
}

async function collectDistinctClientIds(table: string): Promise<{ ids: string[]; error?: string }> {
  if (!supabase) return { ids: [] };
  const ids = new Set<string>();
  const pageSize = 1000;
  for (let from = 0; from < 50_000; from += pageSize) {
    const { data, error } = await supabase
      .from(table)
      .select('client_id')
      .range(from, from + pageSize - 1);
    if (error) return { ids: [...ids], error: error.message };
    if (!data?.length) break;
    for (const row of data) {
      const id = String((row as { client_id?: string }).client_id || '');
      if (id) ids.add(id);
    }
    if (data.length < pageSize) break;
  }
  return { ids: [...ids] };
}

/**
 * Find client_ids that still have plan/photo/performance rows (or storage folders)
 * but no longer exist in `clients` — leftovers from deletes before full wipe.
 */
export async function dbFindOrphanedClientData(): Promise<DBResult<OrphanClientDataReport>> {
  if (!isSupabaseReady || !supabase) {
    return {
      data: {
        orphanClientIds: [],
        byTable: {},
        storageFolderIds: [],
        liveClientCount: 0,
      },
    };
  }

  const { data: clients, error: clientsErr } = await supabase.from('clients').select('id');
  if (clientsErr) return { data: null, error: clientsErr };

  const live = new Set((clients || []).map((c) => String(c.id)));
  const orphanSet = new Set<string>();
  const byTable: Record<string, number> = {};

  for (const table of CLIENT_DATA_TABLES) {
    const { ids, error } = await collectDistinctClientIds(table);
    if (error) {
      console.warn(`[orphan scan] ${table}:`, error);
      continue;
    }
    let orphanRows = 0;
    for (const id of ids) {
      if (!live.has(id)) {
        orphanSet.add(id);
        orphanRows += 1;
      }
    }
    if (orphanRows > 0) byTable[table] = orphanRows;
  }

  const storageFolderIds: string[] = [];
  try {
    const { data: folders } = await supabase.storage.from('weekly-photos').list('', {
      limit: 1000,
      offset: 0,
    });
    for (const entry of folders || []) {
      const name = entry?.name;
      if (!name) continue;
      // UUID-like client folders only
      if (!/^[0-9a-f-]{36}$/i.test(name) && !/^[0-9a-f]{8}-/i.test(name)) continue;
      if (!live.has(name)) {
        storageFolderIds.push(name);
        orphanSet.add(name);
      }
    }
  } catch (err) {
    console.warn('[orphan scan] storage:', err);
  }

  return {
    data: {
      orphanClientIds: [...orphanSet],
      byTable,
      storageFolderIds,
      liveClientCount: live.size,
    },
    error: null,
  };
}

/**
 * Wipe all leftover rows/files for orphan client ids (no clients row exists).
 */
export async function dbPurgeOrphanedClientData(
  orphanClientIds?: string[]
): Promise<DBResult<{ purged: number; failed: string[] }>> {
  if (!isSupabaseReady || !supabase) return { data: { purged: 0, failed: [] } };

  let ids = orphanClientIds;
  if (!ids) {
    const scan = await dbFindOrphanedClientData();
    if (scan.error || !scan.data) return { data: null, error: scan.error };
    ids = scan.data.orphanClientIds;
  }

  const failed: string[] = [];
  let purged = 0;
  for (const id of ids) {
    const wipe = await wipeClientRelatedData(id);
    if (wipe.error) failed.push(id);
    else purged += 1;
  }

  return {
    data: { purged, failed },
    error: failed.length
      ? { message: `Purged ${purged}; failed ${failed.length}: ${failed.join(', ')}` }
      : null,
  };
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

/**
 * Save a coach-created custom template, storing the full program structure
 * (days/exercises/sets incl. supersets, dropsets, rest) as JSON so it can be
 * reused exactly as designed and assigned to any client.
 */
export async function dbSaveCustomWorkoutTemplate(payload: {
  name: string;
  description?: string;
  program_json: any;
}): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('workout_programs')
    .insert({
      name: payload.name,
      description: payload.description || '',
      is_template: true,
      is_custom: true,
      program_json: payload.program_json,
    })
    .select('*')
    .single();
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
      rest: rest || '120 seconds',
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
  



  
  const { data, error } = await supabase
    .from('workout_assignments')
    .insert(insertPayload)
    .select('*')
    .single();
    



  return { data, error };
}

export async function dbUpdateWorkoutAssignment(id: string, payload: {
  program_json?: any;
  current_week?: number;
  current_day?: number;
  duration_weeks?: number;
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

    return { data: null };
  }
  
  const updatePayload = {
    ...payload,
    last_modified_at: new Date().toISOString()
  };
  



  



  
  const { data, error } = await supabase
    .from('workout_assignments')
    .update(updatePayload)
    .eq('id', id)
    .select('*')
    .single();
    



  
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

// ---------- Photo Storage Functions ----------
export async function dbSaveWeeklyPhoto(photo: Omit<WeeklyPhoto, 'id' | 'uploaded_at'>): Promise<DBResult<WeeklyPhoto>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  
  const { data, error } = await supabase
    .from('weekly_photos')
    .insert({
      client_id: photo.client_id,
      week: photo.week,
      type: photo.type,
      image_url: photo.image_url,
      uploaded_at: new Date().toISOString()
    })
    .select()
    .single();
  
  return { data, error };
}

/**
 * Upload full + thumb JPEGs. Replaces any existing photo for the same
 * client/week/pose so Storage does not accumulate orphan retakes (egress + size).
 */
export async function uploadWeeklyPhoto(
  file: File | { full: File; thumb?: File },
  clientId: string,
  week: number,
  type: 'front' | 'side' | 'back'
): Promise<DBResult<WeeklyPhoto>> {
  if (!isSupabaseReady || !supabase) return { data: null };

  const fullFile = file instanceof File ? file : file.full;
  const thumbFile = file instanceof File ? undefined : file.thumb;

  try {
    const stamp = Date.now();
    const fullPath = `${clientId}/${week}/${type}-${stamp}.jpg`;
    const thumbPath = `${clientId}/${week}/${type}-${stamp}.thumb.jpg`;

    const { data: existingRows } = await supabase
      .from('weekly_photos')
      .select('id, image_url')
      .eq('client_id', clientId)
      .eq('week', week)
      .eq('type', type);

    const { error: uploadError } = await supabase.storage
      .from('weekly-photos')
      .upload(fullPath, fullFile, {
        contentType: 'image/jpeg',
        upsert: false,
        cacheControl: '31536000',
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return { data: null, error: uploadError };
    }

    if (thumbFile) {
      const { error: thumbError } = await supabase.storage
        .from('weekly-photos')
        .upload(thumbPath, thumbFile, {
          contentType: 'image/jpeg',
          upsert: false,
          cacheControl: '31536000',
        });
      if (thumbError) {
        console.warn('Thumb upload failed (full photo kept):', thumbError);
      }
    }

    const { data: urlData } = supabase.storage.from('weekly-photos').getPublicUrl(fullPath);
    const imageUrl = urlData.publicUrl;
    const uploadedAt = new Date().toISOString();

    const primaryId = existingRows?.[0]?.id;
    let savedPhoto: WeeklyPhoto | null = null;
    let dbError: unknown = null;

    if (primaryId) {
      const { data, error } = await supabase
        .from('weekly_photos')
        .update({ image_url: imageUrl, uploaded_at: uploadedAt })
        .eq('id', primaryId)
        .select()
        .single();
      savedPhoto = data;
      dbError = error;

      const duplicateIds = (existingRows || []).slice(1).map((row) => row.id).filter(Boolean);
      if (duplicateIds.length) {
        await supabase.from('weekly_photos').delete().in('id', duplicateIds);
      }
    } else {
      const { data, error } = await supabase
        .from('weekly_photos')
        .insert({
          client_id: clientId,
          week,
          type,
          image_url: imageUrl,
          uploaded_at: uploadedAt,
        })
        .select()
        .single();
      savedPhoto = data;
      dbError = error;
    }

    if (dbError || !savedPhoto) {
      await supabase.storage.from('weekly-photos').remove([fullPath, thumbPath]);
      return { data: null, error: dbError };
    }

    const stalePaths = (existingRows || []).flatMap((row) =>
      weeklyPhotoStoragePathsFromUrl(String(row.image_url || ''))
    );
    if (stalePaths.length) {
      await supabase.storage.from('weekly-photos').remove(stalePaths);
    }

    return { data: savedPhoto, error: null };
  } catch (error) {
    console.error('Error uploading photo:', error);
    return { data: null, error };
  }
}

export async function dbGetClientPhotos(clientId: string): Promise<DBResult<WeeklyPhoto[]>> {
  if (import.meta.env.DEV && clientId === 'marketing-demo') {
    const { marketingDemoPhotos } = await import('../data/marketingDemoData');
    return { data: marketingDemoPhotos as WeeklyPhoto[], error: null };
  }
  if (!isSupabaseReady || !supabase) return { data: [] };
  
  const { data, error } = await supabase
    .from('weekly_photos')
    .select('*')
    .eq('client_id', clientId)
    .order('week', { ascending: false })
    .order('uploaded_at', { ascending: false });
  
  return { data: data || [], error };
}

export async function dbDeleteWeeklyPhoto(photoId: string): Promise<DBResult<boolean>> {
  if (!isSupabaseReady || !supabase) return { data: false };

  const { data: row } = await supabase
    .from('weekly_photos')
    .select('image_url')
    .eq('id', photoId)
    .maybeSingle();

  const { error } = await supabase
    .from('weekly_photos')
    .delete()
    .eq('id', photoId);

  if (!error && row?.image_url) {
    const paths = weeklyPhotoStoragePathsFromUrl(String(row.image_url));
    if (paths.length) {
      await supabase.storage.from('weekly-photos').remove(paths);
    }
  }

  return { data: !error, error };
}

// ---------- Cardio plans ----------
// Resolve the clients table UUID from the client's full name (mirrors other views).
export async function dbResolveClientIdByName(name: string): Promise<string | null> {
  if (!isSupabaseReady || !supabase) return null;
  const { data } = await supabase
    .from('clients')
    .select('id')
    .eq('full_name', name)
    .maybeSingle();
  return data?.id || null;
}

export async function dbGetCardioPlan(clientId: string): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('cardio_plans')
    .select('plan_json')
    .eq('client_id', clientId)
    .maybeSingle();
  return { data: data?.plan_json ?? null, error };
}

export async function dbUpsertCardioPlan(clientId: string, plan: any): Promise<DBResult<boolean>> {
  if (!isSupabaseReady || !supabase) return { data: false };
  const { error } = await supabase
    .from('cardio_plans')
    .upsert(
      { client_id: clientId, plan_json: plan, updated_at: new Date().toISOString() },
      { onConflict: 'client_id' }
    );
  return { data: !error, error };
}

export async function dbListCardioTemplates(): Promise<DBResult<any[]>> {
  if (!isSupabaseReady || !supabase) return { data: [] };
  const { data, error } = await supabase
    .from('cardio_templates')
    .select('*')
    .order('created_at', { ascending: false });
  return { data: data || [], error };
}

export async function dbSaveCardioTemplate(payload: {
  name: string;
  template_json: any;
}): Promise<DBResult<any>> {
  if (!isSupabaseReady || !supabase) return { data: null };
  const { data, error } = await supabase
    .from('cardio_templates')
    .insert({
      name: payload.name,
      template_json: payload.template_json,
      is_custom: true,
    })
    .select('*')
    .single();
  return { data, error };
}

export async function dbDeleteCardioTemplate(id: string): Promise<DBResult<boolean>> {
  if (!isSupabaseReady || !supabase) return { data: false };
  const { error } = await supabase.from('cardio_templates').delete().eq('id', id);
  return { data: !error, error };
}

/**
 * Permanently end coaching: wipe plan/performance data, deactivate access.
 * Keeps the client row (name) so their link can show the thank-you screen.
 */
export async function dbEndClientCoaching(clientId: string): Promise<DBResult<boolean>> {
  if (!isSupabaseReady || !supabase) return { data: false };

  const wipe = await wipeClientRelatedData(clientId);
  const errors: string[] = wipe.error?.message
    ? String(wipe.error.message).replace(/^Partial wipe:\s*/, '').split(', ').filter(Boolean)
    : [];

  // Stub remains for thank-you gate; archive so they leave the active list
  const { error: clientErr } = await supabase
    .from('clients')
    .update({
      is_active: false,
      is_archived: true,
      weight_log: [],
      favorites: [],
      starting_weight: null,
    })
    .eq('id', clientId);
  if (clientErr) {
    console.warn('[end coaching] clients update:', clientErr.message);
    errors.push('clients');
  }

  return { data: errors.length === 0, error: errors.length ? { message: errors.join(', ') } : null };
}


