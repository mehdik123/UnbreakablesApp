-- Disable RLS completely for exercises and ingredients tables

ALTER TABLE public.exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients DISABLE ROW LEVEL SECURITY;

-- Also disable for other tables if they exist
ALTER TABLE public.workout_programs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_days DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sets DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_assignments DISABLE ROW LEVEL SECURITY;

