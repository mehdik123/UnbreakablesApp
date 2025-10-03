import React, { useState, useEffect } from 'react';
import { 
  Zap, 
  Target, 
  Plus, 
  Minus, 
  Copy, 
  RotateCcw, 
  CheckCircle, 
  X,
  ArrowUp,
  ArrowDown,
  Settings,
  Dumbbell,
  Activity
} from 'lucide-react';
import { WorkoutProgram, WorkoutExercise } from '../types';

interface BulkWorkoutEditorProps {
  workout: WorkoutProgram;
  onUpdateWorkout: (updatedWorkout: WorkoutProgram) => void;
  currentDay: number;
  onClose: () => void;
}

interface BulkOperation {
  id: string;
  type: 'reps' | 'weight' | 'sets';
  value: number;
  operation: 'set' | 'add' | 'subtract' | 'multiply' | 'divide';
  scope: 'all' | 'selected' | 'first_sets' | 'last_sets';
  selectedExercises: string[];
}

export const BulkWorkoutEditor: React.FC<BulkWorkoutEditorProps> = ({
  workout,
  onUpdateWorkout,
  currentDay,
  onClose
}) => {
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [bulkOperations, setBulkOperations] = useState<BulkOperation[]>([]);
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<Partial<BulkOperation>>({
    type: 'reps',
    operation: 'set',
    scope: 'selected',
    value: 0
  });

  const currentDayData = workout.days[currentDay];
  const allExercises = currentDayData?.exercises || [];

  // Select all exercises by default
  useEffect(() => {
    if (allExercises.length > 0 && selectedExercises.length === 0) {
      setSelectedExercises(allExercises.map(ex => ex.id));
    }
  }, [allExercises, selectedExercises.length]);

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId) 
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  const selectAllExercises = () => {
    setSelectedExercises(allExercises.map(ex => ex.id));
  };

  const deselectAllExercises = () => {
    setSelectedExercises([]);
  };

  const addBulkOperation = () => {
    if (!currentOperation.type || !currentOperation.operation || !currentOperation.value) return;

    const operation: BulkOperation = {
      id: `op-${Date.now()}`,
      type: currentOperation.type,
      operation: currentOperation.operation,
      scope: currentOperation.scope || 'selected',
      value: currentOperation.value,
      selectedExercises: [...selectedExercises]
    };

    setBulkOperations(prev => [...prev, operation]);
    setCurrentOperation({
      type: 'reps',
      operation: 'set',
      scope: 'selected',
      value: 0
    });
    setShowOperationForm(false);
  };

  const removeBulkOperation = (operationId: string) => {
    setBulkOperations(prev => prev.filter(op => op.id !== operationId));
  };

  const executeBulkOperations = () => {
    if (bulkOperations.length === 0) return;

    const updatedWorkout = { ...workout };
    const updatedDay = { ...updatedWorkout.days[currentDay] };
    const updatedExercises = [...updatedDay.exercises];

    bulkOperations.forEach(operation => {
      const targetExercises = getTargetExercises(operation, updatedExercises);
      
      targetExercises.forEach(exercise => {
        const updatedSets = exercise.sets.map((set, setIndex) => {
          if (shouldApplyToSet(operation, setIndex, exercise.sets.length)) {
            return applyOperationToSet(set, operation);
          }
          return set;
        });

        const exerciseIndex = updatedExercises.findIndex(ex => ex.id === exercise.id);
        if (exerciseIndex !== -1) {
          updatedExercises[exerciseIndex] = {
            ...updatedExercises[exerciseIndex],
            sets: updatedSets
          };
        }
      });
    });

    updatedDay.exercises = updatedExercises;
    updatedWorkout.days[currentDay] = updatedDay;
    onUpdateWorkout(updatedWorkout);
    
    // Clear operations after execution
    setBulkOperations([]);
  };

  const getTargetExercises = (operation: BulkOperation, exercises: WorkoutExercise[]) => {
    switch (operation.scope) {
      case 'all':
        return exercises;
      case 'selected':
        return exercises.filter(ex => operation.selectedExercises.includes(ex.id));
      case 'first_sets':
        return exercises.filter(ex => operation.selectedExercises.includes(ex.id));
      case 'last_sets':
        return exercises.filter(ex => operation.selectedExercises.includes(ex.id));
      default:
        return exercises.filter(ex => operation.selectedExercises.includes(ex.id));
    }
  };

  const shouldApplyToSet = (operation: BulkOperation, setIndex: number, totalSets: number) => {
    switch (operation.scope) {
      case 'all':
        return true;
      case 'first_sets':
        return setIndex === 0;
      case 'last_sets':
        return setIndex === totalSets - 1;
      default:
        return true;
    }
  };

  const applyOperationToSet = (set: any, operation: BulkOperation) => {
    const currentValue = operation.type === 'reps' ? set.reps : set.weight;
    let newValue = currentValue;

    switch (operation.operation) {
      case 'set':
        newValue = operation.value;
        break;
      case 'add':
        newValue = currentValue + operation.value;
        break;
      case 'subtract':
        newValue = Math.max(0, currentValue - operation.value);
        break;
      case 'multiply':
        newValue = Math.round(currentValue * operation.value);
        break;
      case 'divide':
        newValue = Math.round(currentValue / operation.value);
        break;
    }

    return {
      ...set,
      [operation.type]: newValue
    };
  };

  const quickActions = [
    {
      id: 'add-reps-all',
      label: '+2 Reps All Sets',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        const operation: BulkOperation = {
          id: `quick-${Date.now()}`,
          type: 'reps',
          operation: 'add',
          scope: 'all',
          value: 2,
          selectedExercises: allExercises.map(ex => ex.id)
        };
        setBulkOperations(prev => [...prev, operation]);
      }
    },
    {
      id: 'add-weight-all',
      label: '+2.5kg All Sets',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        const operation: BulkOperation = {
          id: `quick-${Date.now()}`,
          type: 'weight',
          operation: 'add',
          scope: 'all',
          value: 2.5,
          selectedExercises: allExercises.map(ex => ex.id)
        };
        setBulkOperations(prev => [...prev, operation]);
      }
    },
    {
      id: 'copy-first-sets',
      label: 'Copy First Set to All',
      icon: <Copy className="w-4 h-4" />,
      action: () => {
        allExercises.forEach(exercise => {
          if (exercise.sets.length > 1) {
            const firstSet = exercise.sets[0];
            const updatedSets = exercise.sets.map(set => ({
              ...set,
              reps: firstSet.reps,
              weight: firstSet.weight
            }));
            
            const updatedWorkout = { ...workout };
            const updatedDay = { ...updatedWorkout.days[currentDay] };
            const updatedExercises = [...updatedDay.exercises];
            const exerciseIndex = updatedExercises.findIndex(ex => ex.id === exercise.id);
            
            if (exerciseIndex !== -1) {
              updatedExercises[exerciseIndex] = {
                ...updatedExercises[exerciseIndex],
                sets: updatedSets
              };
              updatedDay.exercises = updatedExercises;
              updatedWorkout.days[currentDay] = updatedDay;
              onUpdateWorkout(updatedWorkout);
            }
          }
        });
      }
    },
    {
      id: 'add-sets-all',
      label: '+1 Set All Exercises',
      icon: <Plus className="w-4 h-4" />,
      action: () => {
        const updatedWorkout = { ...workout };
        const updatedDay = { ...updatedWorkout.days[currentDay] };
        const updatedExercises = updatedDay.exercises.map(exercise => {
          const lastSet = exercise.sets[exercise.sets.length - 1];
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: `set-${Date.now()}-${Math.random()}`,
                reps: lastSet?.reps || 8,
                weight: lastSet?.weight || 50,
                completed: false,
                restPeriod: lastSet?.restPeriod || 90
              }
            ]
          };
        });
        
        updatedDay.exercises = updatedExercises;
        updatedWorkout.days[currentDay] = updatedDay;
        onUpdateWorkout(updatedWorkout);
      }
    },
    {
      id: 'first-sets-only',
      label: 'Modify First Sets Only',
      icon: <Target className="w-4 h-4" />,
      action: () => {
        setCurrentOperation({
          type: 'reps',
          operation: 'set',
          scope: 'first_sets',
          value: 0
        });
        setShowOperationForm(true);
      }
    },
    {
      id: 'selected-exercises',
      label: 'Modify Selected Only',
      icon: <CheckCircle className="w-4 h-4" />,
      action: () => {
        if (selectedExercises.length === 0) {
          alert('Please select exercises first');
          return;
        }
        setCurrentOperation({
          type: 'reps',
          operation: 'set',
          scope: 'selected',
          value: 0
        });
        setShowOperationForm(true);
      }
    },
    {
      id: 'progressive-loading',
      label: 'Progressive Loading',
      icon: <ArrowUp className="w-4 h-4" />,
      action: () => {
        const updatedWorkout = { ...workout };
        const updatedDay = { ...updatedWorkout.days[currentDay] };
        const updatedExercises = updatedDay.exercises.map(exercise => {
          const updatedSets = exercise.sets.map((set, index) => ({
            ...set,
            weight: set.weight + (index * 2.5), // Add 2.5kg per set
            reps: Math.max(1, set.reps - index) // Decrease reps by 1 per set
          }));
          return { ...exercise, sets: updatedSets };
        });
        
        updatedDay.exercises = updatedExercises;
        updatedWorkout.days[currentDay] = updatedDay;
        onUpdateWorkout(updatedWorkout);
      }
    },
    {
      id: 'reset-weights',
      label: 'Reset All Weights',
      icon: <RotateCcw className="w-4 h-4" />,
      action: () => {
        const updatedWorkout = { ...workout };
        const updatedDay = { ...updatedWorkout.days[currentDay] };
        const updatedExercises = updatedDay.exercises.map(exercise => ({
          ...exercise,
          sets: exercise.sets.map(set => ({ ...set, weight: 0 }))
        }));
        
        updatedDay.exercises = updatedExercises;
        updatedWorkout.days[currentDay] = updatedDay;
        onUpdateWorkout(updatedWorkout);
      }
    }
  ];

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700/50 w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Bulk Workout Editor</h2>
                <p className="text-slate-400 text-sm">Quickly modify sets, reps, and weights across exercises</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Exercise Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Select Exercises</h3>
              <div className="flex space-x-2">
                <button
                  onClick={selectAllExercises}
                  className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
                >
                  Select All
                </button>
                <button
                  onClick={deselectAllExercises}
                  className="px-3 py-1 bg-slate-600/20 text-slate-400 rounded-lg text-sm hover:bg-slate-600/30 transition-colors"
                >
                  Deselect All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  onClick={() => toggleExerciseSelection(exercise.id)}
                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedExercises.includes(exercise.id)
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-slate-600 bg-slate-700/30 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                      selectedExercises.includes(exercise.id)
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-slate-500'
                    }`}>
                      {selectedExercises.includes(exercise.id) && (
                        <CheckCircle className="w-3 h-3 text-white" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-medium">{exercise.exercise.name}</h4>
                      <p className="text-slate-400 text-sm">{exercise.sets.length} sets</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-3">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  onClick={action.action}
                  className="p-3 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg border border-slate-600/50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-2 text-slate-300 group-hover:text-white">
                    {action.icon}
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom Operations */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Custom Operations</h3>
              <button
                onClick={() => setShowOperationForm(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Operation</span>
              </button>
            </div>

            {/* Operation Form */}
            {showOperationForm && (
              <div className="mb-4 p-4 bg-slate-700/30 rounded-lg border border-slate-600/50">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Property</label>
                    <select
                      value={currentOperation.type || 'reps'}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, type: e.target.value as 'reps' | 'weight' }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    >
                      <option value="reps">Reps</option>
                      <option value="weight">Weight</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Operation</label>
                    <select
                      value={currentOperation.operation || 'set'}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, operation: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    >
                      <option value="set">Set to</option>
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                      <option value="multiply">Multiply by</option>
                      <option value="divide">Divide by</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Value</label>
                    <input
                      type="number"
                      value={currentOperation.value || ''}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, value: parseFloat(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                      placeholder="0"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm text-slate-400 mb-1">Scope</label>
                    <select
                      value={currentOperation.scope || 'selected'}
                      onChange={(e) => setCurrentOperation(prev => ({ ...prev, scope: e.target.value as any }))}
                      className="w-full px-3 py-2 bg-slate-600 border border-slate-500 rounded-lg text-white"
                    >
                      <option value="all">All Sets</option>
                      <option value="selected">Selected Exercises</option>
                      <option value="first_sets">First Sets Only</option>
                      <option value="last_sets">Last Sets Only</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <button
                    onClick={addBulkOperation}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Add Operation
                  </button>
                  <button
                    onClick={() => setShowOperationForm(false)}
                    className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Operations List */}
            {bulkOperations.length > 0 && (
              <div className="space-y-2">
                {bulkOperations.map((operation) => (
                  <div key={operation.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600/50">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                        <Settings className="w-4 h-4 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          {operation.operation === 'set' ? 'Set' : operation.operation} {operation.type} to {operation.value}
                        </p>
                        <p className="text-slate-400 text-sm">
                          {operation.scope === 'all' ? 'All exercises' : 
                           operation.scope === 'selected' ? `${operation.selectedExercises.length} selected exercises` :
                           operation.scope === 'first_sets' ? 'First sets only' : 'Last sets only'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeBulkOperation(operation.id)}
                      className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4 text-slate-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Execute Button */}
          {bulkOperations.length > 0 && (
            <div className="flex justify-end">
              <button
                onClick={executeBulkOperations}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
              >
                <Zap className="w-5 h-5" />
                <span>Execute {bulkOperations.length} Operation{bulkOperations.length > 1 ? 's' : ''}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BulkWorkoutEditor;
