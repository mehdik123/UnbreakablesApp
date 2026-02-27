/**
 * Enriches program_json (program.days and weeks[].days) with muscle_group and video_url
 * from the Supabase exercises table. Used on app load and on client sync so volume charts
 * and "View Exercise Details" always have muscleGroup set.
 */

export async function enrichProgramAndWeeksWithExercises(
  supabase: any,
  raw: { days?: any[]; weeks?: any[]; program?: any; [k: string]: any }
): Promise<{ program: any; weeks: any[] }> {
  if (!supabase || !raw) {
    const program = raw?.program ?? raw;
    return { program: program ?? {}, weeks: raw?.weeks ?? [] };
  }

  try {
    const { data: dbExercises } = await supabase
      .from('exercises')
      .select('name, video_url, muscle_group');

    if (!dbExercises?.length) {
      const program = raw.program ?? raw;
      return { program: program ?? {}, weeks: raw.weeks ?? [] };
    }

    const exerciseMap = new Map<string, any>();
    dbExercises.forEach((ex: any) => {
      if (ex?.name) {
        exerciseMap.set(ex.name, ex);
        exerciseMap.set(ex.name.trim().toLowerCase(), ex);
      }
    });

    const enrichExercisesInDays = (days: any[]) =>
      (days || []).map((day: any) => ({
        ...day,
        exercises: (day.exercises || []).map((workoutEx: any) => {
          const name =
            workoutEx.exercise?.name ??
            workoutEx.exercise?.id ??
            workoutEx.name ??
            '';
          const dbExercise =
            exerciseMap.get(name) ||
            (name ? exerciseMap.get(String(name).trim().toLowerCase()) : null);
          if (dbExercise) {
            return {
              ...workoutEx,
              exercise: {
                ...workoutEx.exercise,
                videoUrl: dbExercise.video_url ?? workoutEx.exercise?.videoUrl,
                muscleGroup:
                  dbExercise.muscle_group ?? workoutEx.exercise?.muscleGroup,
              },
            };
          }
          return workoutEx;
        }),
      }));

    let program = raw.program ?? raw;
    if (program?.days?.length) {
      program = {
        ...program,
        days: enrichExercisesInDays(program.days),
      };
    }

    const weeks = (raw.weeks || []).map((w: any) =>
      w.days?.length ? { ...w, days: enrichExercisesInDays(w.days) } : w
    );

    return { program, weeks };
  } catch (error) {
    console.error('❌ enrichAssignment: Failed to enrich with muscle groups:', error);
    const program = raw.program ?? raw;
    return { program: program ?? {}, weeks: raw.weeks ?? [] };
  }
}
