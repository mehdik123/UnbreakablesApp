import React, { useEffect, useState } from 'react';
import { dbListPrograms, dbCreateProgram, dbAddDay, dbListExercises, dbAddDayExercise, dbAddSet } from '../lib/db';
import { supabase } from '../lib/supabaseClient';

const TemplatesBuilder: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);
  const [newProgramName, setNewProgramName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const { data: prg } = await dbListPrograms();
    if (prg) {
      // Load days and exercises for each program
      for (const program of prg) {
        const { data: days } = await supabase
          .from('workout_days')
          .select(`
            *,
            workout_exercises (
              *,
              exercises (name, muscle_group, video_url),
              workout_sets (*)
            )
          `)
          .eq('program_id', program.id)
          .order('day_order');
        program._days = days || [];
      }
      setPrograms(prg);
    }
    const { data: exs } = await dbListExercises();
    if (exs) setExercises(exs);
    setLoading(false);
  };

  const createProgram = async () => {
    if (!newProgramName.trim()) return;
    const { data } = await dbCreateProgram(newProgramName);
    if (data) {
      setPrograms(prev => [data, ...prev]);
      setSelectedProgram(data);
      setNewProgramName('');
    }
  };

  const addDay = async () => {
    if (!selectedProgram) return;
    const order = (selectedProgram._days?.length || 0) + 1;
    const { data } = await dbAddDay(selectedProgram.id, `Day ${order}`, order);
    if (data) {
      selectedProgram._days = [...(selectedProgram._days || []), data];
      setSelectedProgram({ ...selectedProgram });
    }
  };

  const addExerciseToDay = async (day: any, exerciseId: string) => {
    const order = (day.workout_exercises?.length || 0) + 1;
    const { data } = await dbAddDayExercise(day.id, exerciseId, '90 sec', order);
    if (data) {
      // Seed 3 sets
      await Promise.all([1,2,3].map(i => dbAddSet(data.id, i, 8, 0)));
      // Reload data to show updated structure
      await loadData();
      // Reselect the program to maintain selection
      const updatedProgram = programs.find(p => p.id === selectedProgram?.id);
      if (updatedProgram) setSelectedProgram(updatedProgram);
    }
  };

  return (
    <div className="min-h-[100dvh] p-3 sm:p-6" style={{ background: 'var(--bg)' }}>
      <div className="flex items-center justify-between mb-3 sm:mb-6 gap-2">
        <h2 className="text-base sm:text-xl font-bold" style={{ color: 'var(--txt-hi)' }}>Workout Templates</h2>
        <button
          onClick={onBack}
          className="px-3 py-2 rounded-xl text-xs font-semibold"
          style={{ background: 'var(--surface-2)', color: 'var(--txt-hi)', border: '1px solid var(--hair)', minHeight: 40 }}
        >
          Back
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6">
        <div className="rounded-xl p-3 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--hair)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>Programs</h3>
          <div className="flex mb-2 gap-2">
            <input
              value={newProgramName}
              onChange={e => setNewProgramName(e.target.value)}
              placeholder="New program name"
              className="flex-1 px-2.5 py-2 rounded-lg outline-none text-sm"
              style={{ background: 'var(--surface-2)', color: 'var(--txt-hi)', border: '1px solid var(--hair)', fontSize: 16 }}
            />
            <button onClick={createProgram} className="px-3 py-2 rounded-lg text-white text-xs font-semibold" style={{ background: 'var(--grad-red)' }}>Add</button>
          </div>
          <ul className="space-y-1.5">
            {programs.map(p => (
              <li key={p.id}>
                <button
                  onClick={() => setSelectedProgram(p)}
                  className="w-full text-left px-2.5 py-2 rounded-lg text-sm"
                  style={{
                    background: selectedProgram?.id === p.id ? 'var(--surface-3)' : 'var(--surface-2)',
                    color: 'var(--txt-hi)',
                    border: '1px solid var(--hair)',
                    minHeight: 40,
                  }}
                >
                  {p.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-xl p-3 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--hair)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>Days</h3>
          {loading && <div className="text-xs" style={{ color: 'var(--txt-lo)' }}>Loading...</div>}
          {!loading && !selectedProgram && <div className="text-xs" style={{ color: 'var(--txt-lo)' }}>Select a program</div>}
          {!loading && selectedProgram && (
            <>
              <button onClick={addDay} className="mb-2 px-3 py-2 rounded-lg text-white text-xs font-semibold" style={{ background: 'var(--blue)' }}>Add Day</button>
              <div className="space-y-2.5 max-h-[60dvh] md:max-h-[70vh] overflow-y-auto">
                {(selectedProgram._days || []).map((d:any, idx:number) => (
                  <div key={d.id} className="p-2.5 rounded-lg" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                    <div className="text-sm font-medium mb-1.5" style={{ color: 'var(--txt-hi)' }}>{d.name || `Day ${idx+1}`}</div>
                    
                    <div className="mb-2">
                      <div className="text-[10px] mb-1" style={{ color: 'var(--txt-lo)' }}>Add exercises:</div>
                      <div className="flex flex-wrap gap-1">
                        {exercises.slice(0,8).map(ex => (
                          <button 
                            key={ex.id} 
                            onClick={() => addExerciseToDay(d, ex.id)} 
                            className="px-2 py-1 rounded text-[10px]"
                            style={{ background: 'var(--surface-3)', color: 'var(--txt-hi)' }}
                          >
                            + {ex.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {d.workout_exercises && d.workout_exercises.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium" style={{ color: 'var(--txt-mid)' }}>Exercises ({d.workout_exercises.length}):</div>
                        {d.workout_exercises.map((we: any) => (
                          <div key={we.id} className="p-2 rounded-lg" style={{ background: 'var(--surface-3)' }}>
                            <div className="text-xs font-medium" style={{ color: 'var(--txt-hi)' }}>
                              {we.exercises?.name || 'Unknown Exercise'}
                              <span className="text-[10px] ml-1.5" style={{ color: 'var(--txt-lo)' }}>
                                ({we.exercises?.muscle_group || 'No muscle group'})
                              </span>
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--txt-lo)' }}>Rest: {we.rest}</div>
                            {we.workout_sets && we.workout_sets.length > 0 && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {we.workout_sets.map((set: any) => (
                                  <span key={set.id} className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: 'var(--surface-2)', color: 'var(--txt-mid)' }}>
                                    {set.reps} @ {set.weight}kg
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(!d.workout_exercises || d.workout_exercises.length === 0) && (
                      <div className="text-xs" style={{ color: 'var(--txt-lo)' }}>No exercises added yet.</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl p-3 border" style={{ background: 'var(--surface-1)', borderColor: 'var(--hair)' }}>
          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>Exercises (DB)</h3>
          <div className="space-y-1.5 max-h-[50dvh] md:max-h-[60vh] overflow-y-auto">
            {exercises.map(ex => (
              <div key={ex.id} className="p-2 rounded-lg" style={{ background: 'var(--surface-2)', color: 'var(--txt-hi)' }}>
                <div className="text-xs font-medium">{ex.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--txt-lo)' }}>{ex.muscle_group || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesBuilder;


