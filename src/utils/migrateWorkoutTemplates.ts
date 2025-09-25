import { dbListExercises, dbAddWorkoutExercise, dbAddWorkoutSet } from '../lib/db';
import { supabase } from '../lib/supabaseClient';
import { workoutTemplates } from '../data/workoutTemplates';

// Migration function to populate exercises and sets for your existing workout tables
export async function migrateWorkoutTemplateExercises() {
  try {

    
    // Get all exercises from database
    const { data: dbExercises } = await dbListExercises();
    if (!dbExercises) {
      throw new Error('Could not load exercises from database');
    }
    
    // Get all workout days from database
    const { data: workoutDays } = await supabase
      .from('workout_days')
      .select('*')
      .order('program_id, day_order');
      
    if (!workoutDays) {
      throw new Error('Could not load workout days from database');
    }
    
    // Map frontend templates to database structure
    for (const template of workoutTemplates) {

      
      for (let dayIndex = 0; dayIndex < template.days.length; dayIndex++) {
        const frontendDay = template.days[dayIndex];
        const dbDay = workoutDays.find(d => 
          d.program_id === template.id && d.day_order === dayIndex + 1
        );
        
        if (!dbDay) {
          console.warn(`Day not found for ${template.name}, day ${dayIndex + 1}`);
          continue;
        }
        

        
        // Add exercises to this day
        for (let exerciseIndex = 0; exerciseIndex < frontendDay.exercises.length; exerciseIndex++) {
          const frontendExercise = frontendDay.exercises[exerciseIndex];
          const dbExercise = dbExercises.find(e => e.name === frontendExercise.exercise.name);
          
          if (!dbExercise) {
            console.warn(`Exercise not found: ${frontendExercise.exercise.name}`);
            continue;
          }
          

          
          // Add exercise to workout day (using exercise name as text for now)
          const { data: workoutExercise } = await dbAddWorkoutExercise(
            dbDay.id,
            dbExercise.name, // Use name instead of id since exercise_id is text
            exerciseIndex + 1,
            frontendExercise.rest || '90 seconds',
            frontendExercise.notes || ''
          );
          
          if (!workoutExercise) {
            console.warn(`Failed to add exercise: ${frontendExercise.exercise.name}`);
            continue;
          }
          
          // Add sets for this exercise
          for (let setIndex = 0; setIndex < frontendExercise.sets.length; setIndex++) {
            const frontendSet = frontendExercise.sets[setIndex];
            
            await dbAddWorkoutSet(
              workoutExercise.id,
              setIndex + 1,
              frontendSet.reps,
              frontendSet.weight,
              frontendSet.restPeriod || 90
            );
          }
          

        }
      }
    }
    

    return { success: true, message: 'Migration completed successfully' };
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    return { success: false, error: error.message };
  }
}
