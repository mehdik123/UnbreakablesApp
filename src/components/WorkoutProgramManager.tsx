import React, { useState, useEffect } from 'react';
import { Dumbbell, Plus, Search, Edit3, Trash2, X, ChevronDown, ChevronUp, RefreshCw, AlertCircle, Copy } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface WorkoutProgramManagerProps {
  onBack: () => void;
}

export const WorkoutProgramManager: React.FC<WorkoutProgramManagerProps> = ({ onBack }) => {
  const [programs, setPrograms] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Form state
  const [programName, setProgramName] = useState('');
  const [programDescription, setProgramDescription] = useState('');
  const [numberOfDays, setNumberOfDays] = useState(3);
  const [days, setDays] = useState<any[]>([]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);

  useEffect(() => {
    loadPrograms();
    loadExercises();
  }, []);

  const loadPrograms = async () => {
    if (!supabase) return;
    setLoading(true);
    try {
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
        .order('name');
      
      if (error) throw error;
      console.log('Loaded programs:', data);
      setPrograms(data || []);
    } catch (error: any) {
      console.error('Error loading programs:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadExercises = async () => {
    if (!supabase) return;
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, muscle_group')
        .order('name');
      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error loading exercises:', error);
    }
  };

  const handleOpenCreate = () => {
    setProgramName('');
    setProgramDescription('');
    setNumberOfDays(3);
    setDays([]);
    setCurrentDayIndex(0);
    setShowCreateModal(true);
  };

  const handleSetNumberOfDays = (num: number) => {
    setNumberOfDays(num);
    const newDays = [];
    for (let i = 0; i < num; i++) {
      newDays.push({
        order: i + 1,
        name: `Day ${i + 1}`,
        exercises: []
      });
    }
    setDays(newDays);
    setCurrentDayIndex(0);
  };

  const handleUpdateDayName = (index: number, name: string) => {
    const updated = [...days];
    updated[index].name = name;
    setDays(updated);
  };

  const handleAddExercise = (dayIndex: number) => {
    if (!exercises[0]) return;
    const updated = [...days];
    updated[dayIndex].exercises.push({
      exercise_id: exercises[0].name, // Store exercise NAME as text
      ex_order: updated[dayIndex].exercises.length + 1,
      notes: '',
      sets: [
        { set_order: 1, reps: 10, weight: 0, rest_seconds: 90 }
      ]
    });
    setDays(updated);
  };

  const handleCopySet1ToAll = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    const sets = updated[dayIndex].exercises[exIndex].sets;
    if (sets.length === 0) return;
    
    const firstSet = sets[0];
    updated[dayIndex].exercises[exIndex].sets = sets.map((set: any, idx: number) => ({
      set_order: idx + 1,
      reps: firstSet.reps,
      weight: firstSet.weight,
      rest_seconds: firstSet.rest_seconds
    }));
    setDays(updated);
  };

  const handleUpdateExercise = (dayIndex: number, exIndex: number, field: string, value: any) => {
    const updated = [...days];
    updated[dayIndex].exercises[exIndex][field] = value;
    setDays(updated);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    updated[dayIndex].exercises.splice(exIndex, 1);
    // Reorder
    updated[dayIndex].exercises.forEach((ex: any, idx: number) => {
      ex.ex_order = idx + 1;
    });
    setDays(updated);
  };

  const handleAddSet = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    const sets = updated[dayIndex].exercises[exIndex].sets;
    sets.push({
      set_order: sets.length + 1,
      reps: 10,
      weight: 0,
      rest_seconds: 90
    });
    setDays(updated);
  };

  const handleRemoveSet = (dayIndex: number, exIndex: number, setIndex: number) => {
    const updated = [...days];
    updated[dayIndex].exercises[exIndex].sets.splice(setIndex, 1);
    // Reorder
    updated[dayIndex].exercises[exIndex].sets.forEach((set: any, idx: number) => {
      set.set_order = idx + 1;
    });
    setDays(updated);
  };

  const handleUpdateSet = (dayIndex: number, exIndex: number, setIndex: number, field: string, value: any) => {
    const updated = [...days];
    updated[dayIndex].exercises[exIndex].sets[setIndex][field] = value;
    setDays(updated);
  };

  const handleSave = async () => {
    if (!supabase || !programName.trim()) {
      alert('Please enter a program name');
      return;
    }
    if (days.length === 0) {
      alert('Please add at least one day');
      return;
    }

    setLoading(true);
    try {
      // Insert program
      const { data: prog, error: progError } = await supabase
        .from('workout_programs')
        .insert({ name: programName, description: programDescription })
        .select()
        .single();
      
      if (progError) throw progError;

      // Insert days and exercises
      for (const day of days) {
        const { data: dayData, error: dayError } = await supabase
          .from('workout_days')
          .insert({
            program_id: prog.id,
            name: day.name,
            day_order: day.order
          })
          .select()
          .single();
        
        if (dayError) throw dayError;

        for (const ex of day.exercises) {
          const { data: exData, error: exError } = await supabase
            .from('workout_exercises')
            .insert({
              day_id: dayData.id,
              exercise_id: ex.exercise_id, // Text field
              ex_order: ex.ex_order,
              rest: '90', // Default rest value
              notes: ex.notes || ''
            })
            .select()
            .single();
          
          if (exError) throw exError;

          // Insert sets
          const setsToInsert = ex.sets.map((s: any) => ({
            workout_exercise_id: exData.id, // FIXED: correct column name
            set_order: s.set_order,
            reps: s.reps,
            weight: s.weight,
            rest_seconds: s.rest_seconds
          }));

          const { error: setsError } = await supabase
            .from('workout_sets')
            .insert(setsToInsert);
          
          if (setsError) throw setsError;
        }
      }

      alert('✅ Program created successfully!');
      setShowCreateModal(false);
      loadPrograms();
    } catch (error: any) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!supabase || !confirm(`Delete "${name}"?`)) return;
    try {
      const { error } = await supabase.from('workout_programs').delete().eq('id', id);
      if (error) throw error;
      alert('✅ Deleted!');
      loadPrograms();
    } catch (error: any) {
      alert('Error: ' + error.message);
    }
  };

  const filteredPrograms = programs.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10">
              <X className="w-5 h-5 text-white" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <Dumbbell className="w-8 h-8 text-purple-400" />
                Workout Programs Manager
              </h1>
              <p className="text-gray-400 mt-1">Manage your workout programs</p>
            </div>
          </div>
          <button
            onClick={handleOpenCreate}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600"
          >
            <Plus className="w-5 h-5" />
            Create Program
          </button>
        </div>

        {/* Search */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search programs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
            />
          </div>
          <button
            onClick={loadPrograms}
            className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl text-white hover:bg-white/10 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>

        {/* Programs List */}
        {loading ? (
          <div className="text-center py-20">
            <RefreshCw className="w-12 h-12 text-purple-400 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading...</p>
          </div>
        ) : filteredPrograms.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Programs Found</h3>
            <p className="text-gray-400 mb-6">Create your first program</p>
            <button
              onClick={handleOpenCreate}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold inline-flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create Program
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredPrograms.map((prog) => (
              <div key={prog.id} className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-2">{prog.name}</h3>
                      {prog.description && <p className="text-gray-400 mb-3">{prog.description}</p>}
                      <div className="flex gap-2">
                        <span className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg text-sm">
                          {prog.workout_days?.length || 0} days
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => setExpandedProgram(expandedProgram === prog.id ? null : prog.id)}
                        className="p-2 bg-blue-500/20 text-blue-300 rounded-lg hover:bg-blue-500/30"
                      >
                        {expandedProgram === prog.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      <button
                        onClick={() => handleDelete(prog.id, prog.name)}
                        className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {expandedProgram === prog.id && prog.workout_days && (
                  <div className="border-t border-white/10 p-6 bg-black/20">
                    <h4 className="text-lg font-semibold text-white mb-4">Program Details</h4>
                    <div className="space-y-4">
                      {prog.workout_days.map((day: any) => (
                        <div key={day.id} className="bg-white/5 rounded-xl p-4 border border-white/10">
                          <h5 className="text-white font-semibold mb-3">{day.name}</h5>
                          {!day.workout_exercises || day.workout_exercises.length === 0 ? (
                            <p className="text-gray-400 text-sm">No exercises</p>
                          ) : (
                            <div className="space-y-3">
                              {day.workout_exercises.map((ex: any, idx: number) => (
                                <div key={ex.id} className="bg-black/30 rounded-lg p-3">
                                  <p className="text-white font-medium mb-2">
                                    {idx + 1}. {ex.exercise_id}
                                  </p>
                                  {ex.workout_sets && ex.workout_sets.length > 0 && (
                                    <div className="grid grid-cols-4 gap-2 text-sm">
                                      {ex.workout_sets.map((set: any) => (
                                        <div key={set.id} className="bg-white/5 rounded p-2">
                                          <p className="text-gray-300">
                                            Set {set.set_order}: {set.reps} reps
                                          </p>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center p-6 overflow-y-auto">
          <div className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl border border-white/10 w-full max-w-5xl my-6">
            {/* Modal Header */}
            <div className="p-6 border-b border-white/10 flex items-center justify-between sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-purple-400" />
                Create Workout Program
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-white/10 rounded-lg">
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Step 1: Name & Description */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Step 1: Program Info</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Name *</label>
                    <input
                      type="text"
                      value={programName}
                      onChange={(e) => setProgramName(e.target.value)}
                      placeholder="e.g., Push Pull Legs"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                    <textarea
                      value={programDescription}
                      onChange={(e) => setProgramDescription(e.target.value)}
                      placeholder="Describe this program..."
                      rows={3}
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500/50"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Number of Days */}
              <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Step 2: Number of Days *</h3>
                <div className="flex gap-3">
                  {[3, 4, 5, 6, 7].map(num => (
                    <button
                      key={num}
                      onClick={() => handleSetNumberOfDays(num)}
                      className={`flex-1 py-4 rounded-xl font-semibold transition-all ${
                        numberOfDays === num
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                          : 'bg-white/5 text-gray-300 hover:bg-white/10'
                      }`}
                    >
                      {num} Days
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Configure Days */}
              {days.length > 0 && (
                <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Step 3: Configure Days</h3>
                  
                  {/* Day Tabs */}
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {days.map((day, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentDayIndex(idx)}
                        className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap ${
                          currentDayIndex === idx
                            ? 'bg-purple-500 text-white'
                            : 'bg-white/5 text-gray-300 hover:bg-white/10'
                        }`}
                      >
                        {day.name}
                      </button>
                    ))}
                  </div>

                  {/* Current Day */}
                  {days[currentDayIndex] && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Day Name</label>
                        <input
                          type="text"
                          value={days[currentDayIndex].name}
                          onChange={(e) => handleUpdateDayName(currentDayIndex, e.target.value)}
                          className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500/50"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="text-sm font-medium text-gray-300">Exercises</label>
                          <button
                            onClick={() => handleAddExercise(currentDayIndex)}
                            className="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 flex items-center gap-1 text-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Add Exercise
                          </button>
                        </div>

                        {days[currentDayIndex].exercises.length === 0 ? (
                          <div className="text-center py-8 bg-black/20 rounded-lg border border-dashed border-white/10">
                            <p className="text-gray-400 mb-3">No exercises</p>
                            <button
                              onClick={() => handleAddExercise(currentDayIndex)}
                              className="px-4 py-2 bg-purple-500/20 text-purple-300 rounded-lg hover:bg-purple-500/30 inline-flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add Exercise
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {days[currentDayIndex].exercises.map((ex: any, exIdx: number) => (
                              <div key={exIdx} className="bg-black/30 rounded-lg p-4 border border-white/10">
                                <div className="flex items-start justify-between mb-3">
                                  <div className="flex-1">
                                    <label className="block text-xs text-gray-400 mb-1">Exercise {exIdx + 1}</label>
                                    <select
                                      value={ex.exercise_id}
                                      onChange={(e) => handleUpdateExercise(currentDayIndex, exIdx, 'exercise_id', e.target.value)}
                                      className="w-full px-3 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 hover:bg-white/10 transition-colors"
                                    >
                                      {exercises.map(e => (
                                        <option key={e.id} value={e.name} className="bg-slate-800 text-white">
                                          {e.name} ({e.muscle_group})
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveExercise(currentDayIndex, exIdx)}
                                    className="ml-2 p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Sets */}
                                <div>
                                  <div className="flex items-center justify-between mb-3">
                                    <label className="text-sm font-medium text-gray-300">Sets Configuration</label>
                                    <div className="flex gap-2">
                                      {ex.sets.length > 1 && (
                                        <button
                                          onClick={() => handleCopySet1ToAll(currentDayIndex, exIdx)}
                                          className="px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-xs hover:bg-green-500/30 flex items-center gap-1.5 font-medium transition-colors"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                          Copy Set 1 to All
                                        </button>
                                      )}
                                      <button
                                        onClick={() => handleAddSet(currentDayIndex, exIdx)}
                                        className="px-3 py-1.5 bg-blue-500/20 text-blue-300 rounded-lg text-xs hover:bg-blue-500/30 flex items-center gap-1 font-medium transition-colors"
                                      >
                                        <Plus className="w-3.5 h-3.5" />
                                        Add Set
                                      </button>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    {ex.sets.map((set: any, setIdx: number) => (
                                      <div key={setIdx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                                        <div className="flex items-center gap-3">
                                          <span className="text-sm text-gray-300 font-semibold w-16">Set {set.set_order}</span>
                                          <div className="flex-1 grid grid-cols-3 gap-3">
                                            {/* Reps */}
                                            <div>
                                              <label className="block text-xs text-gray-400 mb-1.5">Reps</label>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'reps', Math.max(1, set.reps - 1))}
                                                  className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-purple-500/30 border border-white/10 rounded-lg text-white transition-colors"
                                                >
                                                  −
                                                </button>
                                                <input
                                                  type="number"
                                                  value={set.reps}
                                                  onChange={(e) => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'reps', parseInt(e.target.value) || 1)}
                                                  className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white text-center text-sm focus:outline-none focus:border-purple-500/50"
                                                />
                                                <button
                                                  onClick={() => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'reps', set.reps + 1)}
                                                  className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-purple-500/30 border border-white/10 rounded-lg text-white transition-colors"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                            {/* Weight */}
                                            <div>
                                              <label className="block text-xs text-gray-400 mb-1.5">Weight (kg)</label>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'weight', Math.max(0, set.weight - 2.5))}
                                                  className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-purple-500/30 border border-white/10 rounded-lg text-white transition-colors"
                                                >
                                                  −
                                                </button>
                                                <input
                                                  type="number"
                                                  value={set.weight}
                                                  onChange={(e) => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'weight', parseFloat(e.target.value) || 0)}
                                                  step="2.5"
                                                  className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white text-center text-sm focus:outline-none focus:border-purple-500/50"
                                                />
                                                <button
                                                  onClick={() => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'weight', set.weight + 2.5)}
                                                  className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-purple-500/30 border border-white/10 rounded-lg text-white transition-colors"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                            {/* Rest */}
                                            <div>
                                              <label className="block text-xs text-gray-400 mb-1.5">Rest (sec)</label>
                                              <div className="flex items-center gap-1">
                                                <button
                                                  onClick={() => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'rest_seconds', Math.max(30, set.rest_seconds - 15))}
                                                  className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-purple-500/30 border border-white/10 rounded-lg text-white transition-colors"
                                                >
                                                  −
                                                </button>
                                                <input
                                                  type="number"
                                                  value={set.rest_seconds}
                                                  onChange={(e) => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'rest_seconds', parseInt(e.target.value) || 90)}
                                                  step="15"
                                                  className="flex-1 px-2 py-1.5 bg-black/30 border border-white/10 rounded-lg text-white text-center text-sm focus:outline-none focus:border-purple-500/50"
                                                />
                                                <button
                                                  onClick={() => handleUpdateSet(currentDayIndex, exIdx, setIdx, 'rest_seconds', set.rest_seconds + 15)}
                                                  className="w-8 h-8 flex items-center justify-center bg-black/40 hover:bg-purple-500/30 border border-white/10 rounded-lg text-white transition-colors"
                                                >
                                                  +
                                                </button>
                                              </div>
                                            </div>
                                          </div>
                                          <button
                                            onClick={() => handleRemoveSet(currentDayIndex, exIdx, setIdx)}
                                            className="p-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
                                            title="Remove Set"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-white/10 flex items-center justify-between bg-slate-900/95 sticky bottom-0">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-6 py-3 bg-white/5 text-white rounded-xl font-semibold hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!programName.trim() || days.length === 0}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
                Create Program
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

