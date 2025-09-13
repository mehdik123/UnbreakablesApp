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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Workout Templates</h2>
        <button onClick={onBack} className="px-4 py-2 rounded bg-slate-700 text-white">Back</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3">Programs</h3>
          <div className="flex mb-3 space-x-2">
            <input value={newProgramName} onChange={e => setNewProgramName(e.target.value)} placeholder="New program name" className="flex-1 px-3 py-2 rounded bg-slate-700 text-white border border-slate-600" />
            <button onClick={createProgram} className="px-3 py-2 rounded bg-red-600 text-white">Add</button>
          </div>
          <ul className="space-y-2">
            {programs.map(p => (
              <li key={p.id}>
                <button onClick={() => setSelectedProgram(p)} className={`w-full text-left px-3 py-2 rounded ${selectedProgram?.id===p.id?'bg-slate-700 text-white':'bg-slate-700/40 text-slate-300'}`}>{p.name}</button>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3">Days</h3>
          {loading && <div className="text-slate-400">Loading...</div>}
          {!loading && !selectedProgram && <div className="text-slate-400">Select a program</div>}
          {!loading && selectedProgram && (
            <>
              <button onClick={addDay} className="mb-3 px-3 py-2 rounded bg-blue-600 text-white">Add Day</button>
              <div className="space-y-4 max-h-[70vh] overflow-y-auto">
                {(selectedProgram._days || []).map((d:any, idx:number) => (
                  <div key={d.id} className="p-3 rounded bg-slate-700/40">
                    <div className="text-white font-medium mb-2">{d.name || `Day ${idx+1}`}</div>
                    
                    {/* Add Exercise Buttons */}
                    <div className="mb-3">
                      <div className="text-slate-400 text-xs mb-2">Add exercises:</div>
                      <div className="flex flex-wrap gap-1">
                        {exercises.slice(0,8).map(ex => (
                          <button 
                            key={ex.id} 
                            onClick={() => addExerciseToDay(d, ex.id)} 
                            className="px-2 py-1 rounded bg-slate-600 hover:bg-slate-500 text-white text-xs"
                          >
                            + {ex.name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Show existing exercises and sets */}
                    {d.workout_exercises && d.workout_exercises.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-slate-300 text-sm font-medium">Exercises ({d.workout_exercises.length}):</div>
                        {d.workout_exercises.map((we: any) => (
                          <div key={we.id} className="p-2 rounded bg-slate-600/40">
                            <div className="text-white text-sm font-medium">
                              {we.exercises?.name || 'Unknown Exercise'}
                              <span className="text-slate-400 text-xs ml-2">
                                ({we.exercises?.muscle_group || 'No muscle group'})
                              </span>
                            </div>
                            <div className="text-slate-400 text-xs">Rest: {we.rest}</div>
                            {we.workout_sets && we.workout_sets.length > 0 && (
                              <div className="mt-1 flex space-x-2">
                                {we.workout_sets.map((set: any) => (
                                  <span key={set.id} className="text-xs bg-slate-700/50 px-2 py-1 rounded">
                                    {set.reps} reps @ {set.weight}kg
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {(!d.workout_exercises || d.workout_exercises.length === 0) && (
                      <div className="text-slate-400 text-sm">No exercises added yet.</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
          <h3 className="text-white font-semibold mb-3">Exercises (DB)</h3>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto">
            {exercises.map(ex => (
              <div key={ex.id} className="p-2 rounded bg-slate-700/40 text-slate-200">
                <div className="font-medium">{ex.name}</div>
                <div className="text-xs text-slate-400">{ex.muscle_group || ''}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesBuilder;


