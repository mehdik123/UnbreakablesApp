import React, { useState, useMemo, useEffect } from 'react';
import { 
  Dumbbell, 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  Save, 
  X, 
  Play,
  Eye,
  ChevronDown,
  ChevronUp,
  Upload,
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Video,
  List,
  Grid3X3,
  Image,
  Target,
  Clock,
  Zap
} from 'lucide-react';
import { dbListExercises, dbAddExercise, dbUpdateExercise, dbDeleteExercise } from '../lib/db';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';

// Simplified exercise type matching Supabase schema
interface DBExercise {
  id: string;
  name: string;
  muscle_group: string;
  video_url?: string;
}

interface ExerciseDatabaseManagerProps {
  onBack: () => void;
}

const muscleGroups = ['Chest', 'Back', 'Shoulders', 'Arms', 'Legs', 'Core', 'Cardio'];

export const ExerciseDatabaseManager: React.FC<ExerciseDatabaseManagerProps> = ({ onBack }) => {
  const [exercisesList, setExercisesList] = useState<DBExercise[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  // Load exercises from Supabase on mount
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setLoading(true);
    console.log('Loading exercises...');
    console.log('Supabase connection test:', { isSupabaseReady, supabase: !!supabase });
    
    // Test direct Supabase query
    if (supabase) {
      console.log('Testing direct Supabase query...');
      const directResult = await supabase.from('exercises').select('*').limit(5);
      console.log('Direct Supabase result:', directResult);
    }
    
    const { data, error } = await dbListExercises();
    console.log('Exercise load result:', { data, error, count: data?.length });
    if (data) setExercisesList(data);
    setLoading(false);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<DBExercise | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');

  const [newExercise, setNewExercise] = useState<Partial<DBExercise>>({
    name: '',
    muscle_group: '',
    video_url: ''
  });

  const filteredExercises = useMemo(() => {
    return exercisesList.filter(exercise => {
      const matchesSearch = searchTerm === '' || 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exercise.muscle_group || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || exercise.muscle_group === selectedMuscleGroup;
      
      return matchesSearch && matchesMuscleGroup;
    });
  }, [exercisesList, searchTerm, selectedMuscleGroup]);

  const handleAddExercise = async () => {
    if (!newExercise.name || !newExercise.muscle_group) {
      alert('Please fill in all required fields');
      return;
    }

    const { data } = await dbAddExercise({
      name: newExercise.name,
      muscle_group: newExercise.muscle_group,
      video_url: newExercise.video_url || ''
    });

    if (data) {
      await loadExercises(); // Refresh list
      setNewExercise({ name: '', muscle_group: '', video_url: '' });
      setShowAddModal(false);
    }
  };

  const handleEditExercise = (exercise: DBExercise) => {
    setEditingExercise(exercise);
    setShowEditModal(true);
  };

  const handleUpdateExercise = async () => {
    if (!editingExercise) return;

    const { data } = await dbUpdateExercise(editingExercise.id, {
      name: editingExercise.name,
      muscle_group: editingExercise.muscle_group,
      video_url: editingExercise.video_url || ''
    });

    if (data) {
      await loadExercises(); // Refresh list
      setEditingExercise(null);
      setShowEditModal(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      await dbDeleteExercise(exerciseId);
      await loadExercises(); // Refresh list
    }
  };

  const handleDuplicateExercise = async (exercise: DBExercise) => {
    const { data } = await dbAddExercise({
      name: `${exercise.name} (Copy)`,
      muscle_group: exercise.muscle_group,
      video_url: exercise.video_url || ''
    });

    if (data) {
      await loadExercises(); // Refresh list
    }
  };


  const ExerciseForm = ({ exercise, onSave, onCancel, title }: {
    exercise: Partial<DBExercise>;
    onSave: () => void;
    onCancel: () => void;
    title: string;
  }) => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-red-400">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-300">Exercise Name *</label>
          <input
            type="text"
            value={exercise.name || ''}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, name: e.target.value });
              } else {
                setNewExercise({ ...newExercise, name: e.target.value });
              }
            }}
            className="w-full px-4 py-3 rounded-xl border bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            placeholder="e.g., Bench Press"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-300">Muscle Group *</label>
          <select
            value={exercise.muscle_group || ''}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, muscle_group: e.target.value });
              } else {
                setNewExercise({ ...newExercise, muscle_group: e.target.value });
              }
            }}
            className="w-full px-4 py-3 rounded-xl border bg-slate-700 border-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
          >
            <option value="">Select Muscle Group</option>
            {muscleGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-semibold mb-2 text-slate-300">Video URL</label>
          <input
            type="url"
            value={exercise.video_url || ''}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, video_url: e.target.value });
              } else {
                setNewExercise({ ...newExercise, video_url: e.target.value });
              }
            }}
            className="w-full px-4 py-3 rounded-xl border bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50"
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className="px-6 py-3 rounded-xl font-medium bg-slate-700 hover:bg-slate-600 text-white transition-all duration-200"
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-6 py-3 rounded-xl font-medium bg-red-600 hover:bg-red-700 text-white transition-all duration-200"
        >
          Save Exercise
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-white">Exercise Database</h1>
                <p className="text-slate-400 text-sm">Manage your exercise library with {exercisesList.length} exercises</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exercise</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">

        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                />
              </div>
            </div>

          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Muscle Group</label>
              <select
                value={selectedMuscleGroup}
                onChange={(e) => setSelectedMuscleGroup(e.target.value)}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
              >
                <option value="all">All Muscle Groups</option>
                {muscleGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Exercise Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Exercises ({filteredExercises.length})
            </h3>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <RefreshCw className="w-16 h-16 text-slate-400 mx-auto mb-4 animate-spin" />
              <h4 className="text-xl font-semibold text-slate-300 mb-2">Loading exercises...</h4>
              <p className="text-slate-400">Please wait</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <Dumbbell className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h4 className="text-xl font-semibold text-slate-300 mb-2">No exercises found</h4>
              <p className="text-slate-400">Try adjusting your filters or add a new exercise</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="p-6 bg-slate-800/50 border border-slate-700/50 rounded-xl hover:bg-slate-800/70 transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-lg font-semibold text-white mb-2">{exercise.name}</h4>
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-600/20 text-red-400">
                          {exercise.muscle_group || 'No muscle group'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedVideoUrl(exercise.video_url || '');
                          setShowVideoModal(true);
                        }}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
                        disabled={!exercise.video_url}
                      >
                        <Play className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEditExercise(exercise)}
                        className="p-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white transition-all duration-200"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExercise(exercise.id)}
                        className="p-2 rounded-lg bg-red-600/80 hover:bg-red-600 text-white transition-all duration-200"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center space-x-2">
                      <Target className="w-4 h-4 text-slate-400" />
                      <span className="text-sm font-medium text-slate-300">{exercise.muscle_group || 'No muscle group'}</span>
                    </div>
                    {exercise.video_url && (
                      <div className="flex items-center space-x-2">
                        <Video className="w-4 h-4 text-slate-400" />
                        <span className="text-sm text-slate-300">Video available</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="text-xs text-slate-500">
                      From database
                    </div>
                    <button
                      onClick={() => handleDuplicateExercise(exercise)}
                      className="text-sm text-red-400 hover:text-red-300 font-medium"
                    >
                      Duplicate
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Add Exercise Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-6 max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-700">
            <ExerciseForm
              exercise={newExercise}
              onSave={handleAddExercise}
              onCancel={() => setShowAddModal(false)}
              title="Add New Exercise"
            />
          </div>
        </div>
      )}

      {/* Edit Exercise Modal */}
      {showEditModal && editingExercise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-8 rounded-2xl shadow-2xl max-w-2xl w-full mx-6 max-h-[90vh] overflow-y-auto bg-slate-800 border border-slate-700">
            <ExerciseForm
              exercise={editingExercise}
              onSave={handleUpdateExercise}
              onCancel={() => {
                setEditingExercise(null);
                setShowEditModal(false);
              }}
              title="Edit Exercise"
            />
          </div>
        </div>
      )}

      {/* Video Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="p-8 rounded-2xl shadow-2xl max-w-4xl w-full mx-6 bg-slate-800 border border-slate-700">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-red-400">Exercise Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white hover:bg-red-700 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {selectedVideoUrl ? (
              <div className="aspect-video rounded-xl overflow-hidden">
                <iframe
                  src={selectedVideoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-slate-300 mb-2">No video available</h4>
                <p className="text-slate-400">This exercise doesn't have a video demonstration</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};




