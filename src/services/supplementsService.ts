import { supabase } from '../lib/supabaseClient';
import { Supplement, ClientSupplement, ClientHydration } from '../types/supplements';

// ============================================
// SUPPLEMENTS MASTER LIST
// ============================================

export const listAllSupplements = async () => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error } = await supabase
    .from('supplements')
    .select('*')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  return { data: data as Supplement[] | null, error };
};

export const getSupplementsByCategory = async (category: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error } = await supabase
    .from('supplements')
    .select('*')
    .eq('category', category)
    .order('name', { ascending: true });

  return { data: data as Supplement[] | null, error };
};

// ============================================
// CLIENT SUPPLEMENTS ASSIGNMENTS
// ============================================

export const getClientSupplements = async (clientId: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error } = await supabase
    .from('client_supplements')
    .select(`
      *,
      supplement:supplements(*)
    `)
    .eq('client_id', clientId)
    .eq('is_active', true)
    .order('assigned_at', { ascending: false });

  return { data: data as ClientSupplement[] | null, error };
};

export const assignSupplementToClient = async (
  clientId: string,
  supplementId: string,
  customTiming?: string,
  customDosage?: string,
  notes?: string
) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error} = await supabase
    .from('client_supplements')
    .upsert({
      client_id: clientId,
      supplement_id: supplementId,
      custom_timing: customTiming,
      custom_dosage: customDosage,
      notes: notes,
      is_active: true
    }, {
      onConflict: 'client_id,supplement_id'
    })
    .select();

  return { data, error };
};

export const removeSupplementFromClient = async (clientSupplementId: string) => {
  if (!supabase) {
    return { error: new Error('Supabase not initialized') };
  }

  const { error } = await supabase
    .from('client_supplements')
    .delete()
    .eq('id', clientSupplementId);

  return { error };
};

export const updateClientSupplement = async (
  clientSupplementId: string,
  updates: {
    custom_timing?: string;
    custom_dosage?: string;
    notes?: string;
    is_active?: boolean;
  }
) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error } = await supabase
    .from('client_supplements')
    .update(updates)
    .eq('id', clientSupplementId)
    .select();

  return { data, error };
};

// ============================================
// CLIENT HYDRATION
// ============================================

export const getClientHydration = async (clientId: string) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error } = await supabase
    .from('client_hydration')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 error when no data exists

  return { data: data as ClientHydration | null, error };
};

export const upsertClientHydration = async (
  clientId: string,
  targetWaterMl: number,
  notes?: string
) => {
  if (!supabase) {
    return { data: null, error: new Error('Supabase not initialized') };
  }

  const { data, error } = await supabase
    .from('client_hydration')
    .upsert({
      client_id: clientId,
      target_water_ml: targetWaterMl,
      notes: notes
    }, {
      onConflict: 'client_id'
    })
    .select();

  return { data, error };
};

