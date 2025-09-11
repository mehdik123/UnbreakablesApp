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
import { Exercise } from '../types';
import { exercises, muscleGroups, equipment, difficulties, categories } from '../data/exercises';

interface ExerciseDatabaseManagerProps {
  exercises: Exercise[];
  onUpdateExercises: (exercises: Exercise[]) => void;
  isDark: boolean;
  onBack: () => void;
}

export const ExerciseDatabaseManager: React.FC<ExerciseDatabaseManagerProps> = ({
  exercises,
  onUpdateExercises,
  isDark,
  onBack
}) => {
  const [exercisesList, setExercisesList] = useState<Exercise[]>(exercises);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Update local state when exercises prop changes
  useEffect(() => {
    setExercisesList(exercises);
  }, [exercises]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string>('all');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState('');

  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({
    name: '',
    muscleGroup: '',
    equipment: '',
    instructions: '',
    videoUrl: '',
    imageUrl: '',
    difficulty: 'beginner',
    category: 'strength',
    primaryMuscles: [],
    secondaryMuscles: []
  });

  const filteredExercises = useMemo(() => {
    return exercisesList.filter(exercise => {
      const matchesSearch = searchTerm === '' || 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.muscleGroup.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exercise.instructions || '').toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesMuscleGroup = selectedMuscleGroup === 'all' || exercise.muscleGroup === selectedMuscleGroup;
      const matchesEquipment = selectedEquipment === 'all' || exercise.equipment === selectedEquipment;
      const matchesDifficulty = selectedDifficulty === 'all' || exercise.difficulty === selectedDifficulty;
      const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory;
      
      return matchesSearch && matchesMuscleGroup && matchesEquipment && matchesDifficulty && matchesCategory;
    });
  }, [exercisesList, searchTerm, selectedMuscleGroup, selectedEquipment, selectedDifficulty, selectedCategory]);

  const handleAddExercise = () => {
    if (!newExercise.name || !newExercise.muscleGroup || !newExercise.equipment) {
      alert('Please fill in all required fields');
      return;
    }

    const exercise: Exercise = {
      id: `exercise-${Date.now()}`,
      name: newExercise.name!,
      muscleGroup: newExercise.muscleGroup!,
      equipment: newExercise.equipment!,
      instructions: newExercise.instructions || '',
      videoUrl: newExercise.videoUrl || '',
      imageUrl: newExercise.imageUrl || '',
      difficulty: newExercise.difficulty as 'beginner' | 'intermediate' | 'advanced',
      category: newExercise.category as 'strength' | 'cardio' | 'flexibility' | 'sports',
      primaryMuscles: newExercise.primaryMuscles || [],
      secondaryMuscles: newExercise.secondaryMuscles || [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const updatedExercises = [...exercisesList, exercise];
    setExercisesList(updatedExercises);
    onUpdateExercises(updatedExercises);
    setNewExercise({
      name: '',
      muscleGroup: '',
      equipment: '',
      instructions: '',
      videoUrl: '',
      imageUrl: '',
      difficulty: 'beginner',
      category: 'strength',
      primaryMuscles: [],
      secondaryMuscles: []
    });
    setShowAddModal(false);
  };

  const handleEditExercise = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setShowEditModal(true);
  };

  const handleUpdateExercise = () => {
    if (!editingExercise) return;

    const updatedExercises = exercisesList.map(exercise => 
      exercise.id === editingExercise.id 
        ? { ...editingExercise, updatedAt: new Date() }
        : exercise
    );
    
    setExercisesList(updatedExercises);
    onUpdateExercises(updatedExercises);
    setEditingExercise(null);
    setShowEditModal(false);
  };

  const handleDeleteExercise = (exerciseId: string) => {
    if (window.confirm('Are you sure you want to delete this exercise?')) {
      const updatedExercises = exercisesList.filter(exercise => exercise.id !== exerciseId);
      setExercisesList(updatedExercises);
      onUpdateExercises(updatedExercises);
    }
  };

  const handleDuplicateExercise = (exercise: Exercise) => {
    const duplicatedExercise: Exercise = {
      ...exercise,
      id: `exercise-${Date.now()}`,
      name: `${exercise.name} (Copy)`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    const updatedExercises = [...exercisesList, duplicatedExercise];
    setExercisesList(updatedExercises);
    onUpdateExercises(updatedExercises);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-600 bg-green-100';
      case 'intermediate': return 'text-blue-600 bg-blue-100';
      case 'advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'strength': return 'text-purple-600 bg-purple-100';
      case 'cardio': return 'text-orange-600 bg-orange-100';
      case 'flexibility': return 'text-blue-600 bg-blue-100';
      case 'sports': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const ExerciseForm = ({ exercise, onSave, onCancel, title }: {
    exercise: Partial<Exercise>;
    onSave: () => void;
    onCancel: () => void;
    title: string;
  }) => (
    <div className="space-y-6">
      <h3 className="text-2xl font-bold text-purple-600">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold mb-2">Exercise Name *</label>
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
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="e.g., Bench Press"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Muscle Group *</label>
          <select
            value={exercise.muscleGroup || ''}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, muscleGroup: e.target.value });
              } else {
                setNewExercise({ ...newExercise, muscleGroup: e.target.value });
              }
            }}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Select Muscle Group</option>
            {muscleGroups.map(group => (
              <option key={group} value={group}>{group}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Equipment *</label>
          <select
            value={exercise.equipment || ''}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, equipment: e.target.value });
              } else {
                setNewExercise({ ...newExercise, equipment: e.target.value });
              }
            }}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            <option value="">Select Equipment</option>
            {equipment.map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Difficulty</label>
          <select
            value={exercise.difficulty || 'beginner'}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, difficulty: e.target.value as any });
              } else {
                setNewExercise({ ...newExercise, difficulty: e.target.value as any });
              }
            }}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {difficulties.map(diff => (
              <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Category</label>
          <select
            value={exercise.category || 'strength'}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, category: e.target.value as any });
              } else {
                setNewExercise({ ...newExercise, category: e.target.value as any });
              }
            }}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            }`}
          >
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2">Video URL</label>
          <input
            type="url"
            value={exercise.videoUrl || ''}
            onChange={(e) => {
              if (editingExercise) {
                setEditingExercise({ ...editingExercise, videoUrl: e.target.value });
              } else {
                setNewExercise({ ...newExercise, videoUrl: e.target.value });
              }
            }}
            className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
            }`}
            placeholder="https://youtube.com/watch?v=..."
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2">Instructions</label>
        <textarea
          value={exercise.instructions || ''}
          onChange={(e) => {
            if (editingExercise) {
              setEditingExercise({ ...editingExercise, instructions: e.target.value });
            } else {
              setNewExercise({ ...newExercise, instructions: e.target.value });
            }
          }}
          rows={4}
          className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
            isDark 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
          }`}
          placeholder="Detailed exercise instructions..."
        />
      </div>

      <div className="flex justify-end space-x-4">
        <button
          onClick={onCancel}
          className={`px-6 py-3 rounded-2xl text-lg font-semibold ${
            isDark 
              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
              : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
          }`}
        >
          Cancel
        </button>
        <button
          onClick={onSave}
          className="px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
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

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white rounded-xl font-medium transition-all duration-200"
            >
              <Filter className="w-4 h-4" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {showFilters && (
            <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
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

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Equipment</label>
                <select
                  value={selectedEquipment}
                  onChange={(e) => setSelectedEquipment(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                >
                  <option value="all">All Equipment</option>
                  {equipment.map(eq => (
                    <option key={eq} value={eq}>{eq}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Difficulty</label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                >
                <option value="all">All Levels</option>
                {difficulties.map(diff => (
                  <option key={diff} value={diff}>{diff.charAt(0).toUpperCase() + diff.slice(1)}</option>
                ))}
              </select>
            </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Category</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 transition-all duration-200"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Exercise Grid */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-white">
              Exercises ({filteredExercises.length})
            </h3>
          </div>

          {filteredExercises.length === 0 ? (
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
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(exercise.difficulty)}`}>
                          {exercise.difficulty}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(exercise.category)}`}>
                          {exercise.category}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setSelectedVideoUrl(exercise.videoUrl || '');
                          setShowVideoModal(true);
                        }}
                        className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 text-slate-300 hover:text-white transition-all duration-200"
                        disabled={!exercise.videoUrl}
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
                      <span className="text-sm font-medium text-slate-300">{exercise.muscleGroup}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Dumbbell className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-300">{exercise.equipment}</span>
                    </div>
                  </div>

                  <p className="text-sm mb-4 text-slate-400">
                    {exercise.instructions && exercise.instructions.length > 100 
                      ? `${exercise.instructions.substring(0, 100)}...` 
                      : exercise.instructions || 'No instructions available'
                    }
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      {(exercise.primaryMuscles || []).slice(0, 2).map(muscle => (
                        <span key={muscle} className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                          {muscle}
                        </span>
                      ))}
                      {(exercise.primaryMuscles || []).length > 2 && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-700/50 text-slate-300">
                          +{(exercise.primaryMuscles || []).length - 2}
                        </span>
                      )}
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
          <div className={`p-8 rounded-3xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
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
          <div className={`p-8 rounded-3xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
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
          <div className={`p-8 rounded-3xl shadow-2xl max-w-4xl w-full mx-6 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-purple-600">Exercise Video</h3>
              <button
                onClick={() => setShowVideoModal(false)}
                className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {selectedVideoUrl ? (
              <div className="aspect-video rounded-2xl overflow-hidden">
                <iframe
                  src={selectedVideoUrl.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-500 mb-2">No video available</h4>
                <p className="text-gray-400">This exercise doesn't have a video demonstration</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};




