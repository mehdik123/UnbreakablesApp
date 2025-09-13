-- Fix RLS policies for exercises and ingredients tables

ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exercises_select_policy" ON public.exercises FOR SELECT USING (true);
CREATE POLICY "exercises_insert_policy" ON public.exercises FOR INSERT WITH CHECK (true);
CREATE POLICY "exercises_update_policy" ON public.exercises FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "exercises_delete_policy" ON public.exercises FOR DELETE USING (true);

ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ingredients_select_policy" ON public.ingredients FOR SELECT USING (true);
CREATE POLICY "ingredients_insert_policy" ON public.ingredients FOR INSERT WITH CHECK (true);
CREATE POLICY "ingredients_update_policy" ON public.ingredients FOR UPDATE USING (true) WITH CHECK (true);
CREATE POLICY "ingredients_delete_policy" ON public.ingredients FOR DELETE USING (true);

