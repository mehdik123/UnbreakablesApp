import React, { useState } from 'react';
import { 
  Plus, 
  Upload, 
  Dumbbell,
  CheckCircle,
  Play,
  Edit3,
  Users,
  Trash2,
  Copy,
  Settings,
  ChevronDown,
  ChevronUp,
  Target,
  Zap,
  Calendar,
  BarChart3,
  MoreVertical,
  RefreshCw,
  Save,
  Send,
  X,
  ArrowRight
} from 'lucide-react';
import { 
  WorkoutProgram, 
  WorkoutDay, 
  WorkoutExercise, 
  Exercise, 
  ClientWorkoutAssignment,
  WorkoutWeek,
  Client
} from '../types';
import { exercises } from '../data/exercises';

interface WorkoutBuilderProps {
  isDark: boolean;
  onAssignToClient: (assignment: ClientWorkoutAssignment) => void;
}

// Sample ready-to-use workouts
const readyWorkouts: WorkoutProgram[] = [
  {
    id: 'push-pull-legs',
    name: 'Push Pull Legs',
    description: '6-day split focusing on compound movements',
    days: [
      {
        id: 'push-day',
        name: 'Push Day',
        exercises: [
          {
            id: 'bench-press',
            exercise: exercises.find(e => e.id === 'bench-press')!,
            sets: 4,
            reps: '8-12',
            weight: '70% 1RM',
            rest: '3 min',
            notes: 'Focus on form and explosive concentric',
            videoUrl: 'https://www.youtube.com/watch?v=example1'
          },
          {
            id: 'overhead-press',
            exercise: exercises.find(e => e.id === 'overhead-press')!,
            sets: 3,
            reps: '8-10',
            weight: '65% 1RM',
            rest: '2 min',
            notes: 'Keep core tight',
            videoUrl: 'https://www.youtube.com/watch?v=example2'
          }
        ]
      },
      {
        id: 'pull-day',
        name: 'Pull Day',
        exercises: [
          {
            id: 'deadlift',
            exercise: exercises.find(e => e.id === 'deadlift')!,
            sets: 4,
            reps: '5-8',
            weight: '80% 1RM',
            rest: '4 min',
            notes: 'Focus on form, explosive lockout',
            videoUrl: 'https://www.youtube.com/watch?v=example4'
          }
        ]
      },
      {
        id: 'legs-day',
        name: 'Legs Day',
        exercises: [
          {
            id: 'squats',
            exercise: exercises.find(e => e.id === 'squats')!,
            sets: 4,
            reps: '8-12',
            weight: '75% 1RM',
            rest: '3 min',
            notes: 'Squat to parallel',
            videoUrl: 'https://www.youtube.com/watch?v=example6'
          }
        ]
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'upper-lower',
    name: 'Upper Lower',
    description: '4-day split for balanced development',
    days: [
      {
        id: 'upper-1',
        name: 'Upper Day 1',
        exercises: []
      },
      {
        id: 'lower-1',
        name: 'Lower Day 1',
        exercises: []
      },
      {
        id: 'upper-2',
        name: 'Upper Day 2',
        exercises: []
      },
      {
        id: 'lower-2',
        name: 'Lower Day 2',
        exercises: []
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'arnold-split',
    name: 'Arnold Split',
    description: '6-day classic bodybuilding split',
    days: [
      {
        id: 'chest-back',
        name: 'Chest & Back',
        exercises: []
      },
      {
        id: 'shoulders-arms',
        name: 'Shoulders & Arms',
        exercises: []
      },
      {
        id: 'legs',
        name: 'Legs',
        exercises: []
      }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

export const WorkoutBuilder: React.FC<WorkoutBuilderProps> = ({ 
  isDark, 
  onAssignToClient 
}) => {
  const [selectedWorkout, setSelectedWorkout] = useState<WorkoutProgram | null>(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState(4);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [programName, setProgramName] = useState('');
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [progressionRules, setProgressionRules] = useState<Array<{
    id: string;
    condition: string;
    action: string;
    target: string;
    value: number;
  }>>([]);

  const handleImportWorkout = (workout: WorkoutProgram) => {
    setSelectedWorkout(workout);
    setProgramName(workout.name);
    setShowProgramModal(false);
  };

  const handleCreateCustom = () => {
    const newWorkout: WorkoutProgram = {
      id: Date.now().toString(),
      name: 'Custom Workout',
      description: 'Custom workout program',
      days: [
        {
          id: 'day-1',
          name: 'Day 1',
          exercises: []
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    setSelectedWorkout(newWorkout);
    setProgramName('Custom Workout');
    setShowProgramModal(false);
  };

  const createWeekBasedWorkout = (baseWorkout: WorkoutProgram, numberOfWeeks: number): WorkoutWeek[] => {
    const weeks: WorkoutWeek[] = [];
    
    for (let week = 1; week <= numberOfWeeks; week++) {
      const weekExercises: WorkoutExercise[] = baseWorkout.days.flatMap(day => 
        day.exercises.map(exercise => ({
          ...exercise,
          id: `${exercise.id}-week-${week}`,
          // Apply progression based on week number
          reps: week === 1 ? exercise.reps : 
                exercise.reps.includes('-') ? 
                  exercise.reps.split('-').map(r => parseInt(r) + (week - 1) * 2).join('-') :
                  (parseInt(exercise.reps) + (week - 1) * 2).toString(),
          weight: week === 1 ? exercise.weight :
                 exercise.weight.includes('%') ?
                   exercise.weight.replace(/(\d+)%/, (match, p1) => `${parseInt(p1) + (week - 1) * 5}%`) :
                   exercise.weight,
          sets: week === 1 ? exercise.sets : exercise.sets + Math.floor((week - 1) / 2)
        }))
      );
      
      weeks.push({
        weekNumber: week,
        isUnlocked: week === 1, // Only first week is unlocked initially
        exercises: weekExercises,
        progressionNotes: week > 1 ? `Week ${week} progression applied` : undefined
      });
    }
    
    return weeks;
  };

  const addExerciseToDay = (dayId: string) => {
    if (!selectedWorkout) return;
    
    const updatedWorkout = { ...selectedWorkout };
    const day = updatedWorkout.days.find(d => d.id === dayId);
    
    if (day) {
      const newExercise: WorkoutExercise = {
        id: `exercise-${Date.now()}`,
        exercise: exercises[0],
        sets: 3,
        reps: '8-12',
        weight: '70% 1RM',
        rest: '90s',
        notes: '',
        videoUrl: ''
      };
      day.exercises.push(newExercise);
    }
    
    setSelectedWorkout(updatedWorkout);
  };

  const updateExercise = (dayId: string, exerciseId: string, field: string, value: any) => {
    if (!selectedWorkout) return;
    
    const updatedWorkout = { ...selectedWorkout };
    const day = updatedWorkout.days.find(d => d.id === dayId);
    if (day) {
      const exercise = day.exercises.find(e => e.id === exerciseId);
      if (exercise) {
        (exercise as any)[field] = value;
      }
    }
    setSelectedWorkout(updatedWorkout);
  };

  const deleteExercise = (dayId: string, exerciseId: string) => {
    if (!selectedWorkout) return;
    
    const updatedWorkout = { ...selectedWorkout };
    const day = updatedWorkout.days.find(d => d.id === dayId);
    if (day) {
      day.exercises = day.exercises.filter(e => e.id !== exerciseId);
    }
    setSelectedWorkout(updatedWorkout);
  };

  const addProgressionRule = () => {
    const newRule = {
      id: Date.now().toString(),
      condition: 'RPE ≤ 8',
      action: 'Add Reps',
      target: 'All Sets',
      value: 1
    };
    setProgressionRules([...progressionRules, newRule]);
  };

  const deleteProgressionRule = (ruleId: string) => {
    setProgressionRules(progressionRules.filter(rule => rule.id !== ruleId));
  };

  const assignToClient = () => {
    if (!selectedWorkout || !selectedClient) return;
    
    // Create week-based workout structure
    const weeks = createWeekBasedWorkout(selectedWorkout, selectedClient.numberOfWeeks);
    
    const assignment: ClientWorkoutAssignment = {
      id: Date.now().toString(),
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      program: selectedWorkout,
      startDate: new Date(startDate),
      duration: selectedClient.numberOfWeeks,
      currentWeek: 1,
      currentDay: 1,
      weeks: weeks,
      progressionRules,
      isActive: true,
      shareUrl: `${window.location.origin}/client/${selectedClient.id}`
    };
    
    onAssignToClient(assignment);
    setShowAssignmentModal(false);
    setSelectedClients([]);
    setSelectedClient(null);
  };

  const unlockWeek = (weekNumber: number) => {
    if (!selectedWorkout) return;
    
    const updatedWorkout = { ...selectedWorkout };
    // This would update the client's workout assignment to unlock the week
    console.log(`Unlocking week ${weekNumber}`);
  };

  const currentDay = selectedWorkout?.days[currentDayIndex];

  return (
    <div className={`p-8 rounded-3xl shadow-2xl border-2 transition-all duration-200 ${
      isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900 shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-purple-700 rounded-3xl flex items-center justify-center shadow-2xl">
            <Dumbbell className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold text-purple-600">Training Builder</h2>
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Create and customize training programs with automated progression.
            </p>
          </div>
        </div>
      </div>

      {!selectedWorkout ? (
        /* Program Configuration */
        <div className={`p-6 rounded-3xl border-2 ${
          isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center space-x-3 mb-6">
            <Calendar className="w-6 h-6 text-purple-500" />
            <h3 className="text-2xl font-bold text-purple-600">Program Configuration</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-semibold mb-2">Program Name</label>
              <input
                type="text"
                value={programName}
                onChange={(e) => setProgramName(e.target.value)}
                placeholder="e.g., Push Pull Legs"
                className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                  isDark 
                    ? 'bg-gray-600 border-gray-500 text-white placeholder-gray-400' 
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Duration (Weeks)</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                  isDark 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={4}>4 weeks</option>
                <option value={6}>6 weeks</option>
                <option value={8}>8 weeks</option>
                <option value={12}>12 weeks</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Current Week</label>
              <select
                value={currentWeek}
                onChange={(e) => setCurrentWeek(parseInt(e.target.value))}
                className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                  isDark 
                    ? 'bg-gray-600 border-gray-500 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value={1}>Week 1</option>
                <option value={2}>Week 2</option>
                <option value={3}>Week 3</option>
                <option value={4}>Week 4</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-semibold mb-2">Assign to Client</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    // This would fetch the client data - for now using mock data
                    const mockClient: Client = {
                      id: clientId,
                      name: clientId === 'client1' ? 'John Doe' : clientId === 'client2' ? 'Jane Smith' : 'Mike Johnson',
                      email: 'client@example.com',
                      goal: 'maintenance',
                      numberOfWeeks: clientId === 'client1' ? 4 : clientId === 'client2' ? 6 : 8,
                      startDate: new Date(),
                      isActive: true,
                      favorites: [],
                      weightLog: []
                    };
                    setSelectedClient(mockClient);
                  }}
                  className={`w-full pl-10 pr-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Select Client</option>
                  <option value="client1">John Doe (4 weeks)</option>
                  <option value="client2">Jane Smith (6 weeks)</option>
                  <option value="client3">Mike Johnson (8 weeks)</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-4">
            <button
              onClick={() => setShowProgramModal(true)}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200"
            >
              <Upload className="w-5 h-5" />
              <span>Import Training Program</span>
            </button>
            <button
              onClick={handleCreateCustom}
              className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200"
            >
              <Plus className="w-5 h-5" />
              <span>Use Template</span>
            </button>
          </div>
        </div>
      ) : (
        /* Selected Workout View */
        <div className="space-y-6">
          {/* Top Bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSelectedWorkout(null)}
                className={`px-4 py-2 rounded-2xl text-lg font-semibold transition-all duration-200 ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Back
              </button>
              <button
                onClick={() => addExerciseToDay(currentDay?.id || '')}
                className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Exercise</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-3">
              <button className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200">
                +1 Rep All Sets
              </button>
              <button className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200">
                +2.5kg All Sets
              </button>
              <button className="px-3 py-2 rounded-xl text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200">
                Add Set to All
              </button>
            </div>
          </div>

          {/* Day Navigation Tabs */}
          <div className="flex space-x-2">
            {selectedWorkout.days.map((day, index) => (
              <button
                key={day.id}
                onClick={() => setCurrentDayIndex(index)}
                className={`px-6 py-3 rounded-2xl text-lg font-semibold transition-all duration-200 ${
                  currentDayIndex === index
                    ? 'bg-gray-700 text-white'
                    : isDark
                      ? 'bg-gray-600 hover:bg-gray-500 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>

          {/* Exercise Table */}
          {currentDay && (
            <div className={`p-6 rounded-3xl border-2 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              {currentDay.exercises.map((exercise, exerciseIndex) => (
                <div key={exercise.id} className="mb-6 last:mb-0">
                  {/* Exercise Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-xl font-bold">{exercise.exercise.name}</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        isDark ? 'bg-gray-500 text-white' : 'bg-gray-200 text-gray-700'
                      }`}>
                        {exercise.exercise.muscleGroup}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center space-x-2 px-3 py-2 rounded-xl text-sm font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200">
                        <RefreshCw className="w-4 h-4" />
                        <span>Change Exercise</span>
                      </button>
                      <button className="p-2 rounded-xl hover:bg-gray-600 transition-all duration-200">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b-2 ${
                          isDark ? 'border-gray-600' : 'border-gray-200'
                        }`}>
                          <th className="text-left py-3 px-4">
                            <input type="checkbox" className="w-4 h-4" />
                          </th>
                          <th className="text-left py-3 px-4 font-semibold">Set</th>
                          <th className="text-left py-3 px-4 font-semibold">Reps</th>
                          <th className="text-left py-3 px-4 font-semibold">Weight (kg)</th>
                          <th className="text-left py-3 px-4 font-semibold">Rest</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Array.from({ length: exercise.sets }, (_, setIndex) => (
                          <tr key={setIndex} className={`border-b ${
                            isDark ? 'border-gray-600' : 'border-gray-200'
                          }`}>
                            <td className="py-3 px-4">
                              <input type="checkbox" className="w-4 h-4" />
                            </td>
                            <td className="py-3 px-4 font-semibold">{setIndex + 1}</td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={exercise.reps}
                                onChange={(e) => updateExercise(currentDay.id, exercise.id, 'reps', e.target.value)}
                                className={`w-16 px-2 py-1 rounded border text-center ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={exercise.weight}
                                onChange={(e) => updateExercise(currentDay.id, exercise.id, 'weight', e.target.value)}
                                className={`w-16 px-2 py-1 rounded border text-center ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </td>
                            <td className="py-3 px-4">
                              <input
                                type="text"
                                value={exercise.rest}
                                onChange={(e) => updateExercise(currentDay.id, exercise.id, 'rest', e.target.value)}
                                className={`w-16 px-2 py-1 rounded border text-center ${
                                  isDark 
                                    ? 'bg-gray-600 border-gray-500 text-white' 
                                    : 'bg-white border-gray-300 text-gray-900'
                                }`}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Exercise Footer */}
                  <div className="flex items-center justify-between mt-4">
                    <button
                      onClick={() => deleteExercise(currentDay.id, exercise.id)}
                      className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition-all duration-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Auto-Progression Rules */}
          <div className={`p-6 rounded-3xl border-2 ${
            isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-purple-600">Auto-Progression Rules</h3>
              <button
                onClick={addProgressionRule}
                className="flex items-center space-x-2 px-4 py-2 rounded-2xl text-lg font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Add Rule</span>
              </button>
            </div>

            {progressionRules.map((rule) => (
              <div key={rule.id} className="flex items-center space-x-4 mb-4 p-4 rounded-2xl border-2 bg-gray-600">
                <select
                  value={rule.condition}
                  onChange={(e) => {
                    const updatedRules = progressionRules.map(r => 
                      r.id === rule.id ? { ...r, condition: e.target.value } : r
                    );
                    setProgressionRules(updatedRules);
                  }}
                  className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                    isDark 
                      ? 'bg-gray-500 border-gray-400 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="RPE ≤ 8">RPE ≤ 8</option>
                  <option value="RPE ≤ 7">RPE ≤ 7</option>
                  <option value="All Sets Complete">All Sets Complete</option>
                </select>
                
                <select
                  value={rule.action}
                  onChange={(e) => {
                    const updatedRules = progressionRules.map(r => 
                      r.id === rule.id ? { ...r, action: e.target.value } : r
                    );
                    setProgressionRules(updatedRules);
                  }}
                  className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                    isDark 
                      ? 'bg-gray-500 border-gray-400 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="Add Reps">Add Reps</option>
                  <option value="Add Weight">Add Weight</option>
                  <option value="Add Sets">Add Sets</option>
                </select>
                
                <select
                  value={rule.target}
                  onChange={(e) => {
                    const updatedRules = progressionRules.map(r => 
                      r.id === rule.id ? { ...r, target: e.target.value } : r
                    );
                    setProgressionRules(updatedRules);
                  }}
                  className={`px-3 py-2 rounded-xl border text-sm font-semibold ${
                    isDark 
                      ? 'bg-gray-500 border-gray-400 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="All Sets">All Sets</option>
                  <option value="Last Set">Last Set</option>
                  <option value="First Set">First Set</option>
                </select>
                
                <input
                  type="number"
                  value={rule.value}
                  onChange={(e) => {
                    const updatedRules = progressionRules.map(r => 
                      r.id === rule.id ? { ...r, value: parseInt(e.target.value) || 1 } : r
                    );
                    setProgressionRules(updatedRules);
                  }}
                  className={`w-16 px-3 py-2 rounded-xl border text-sm font-semibold text-center ${
                    isDark 
                      ? 'bg-gray-500 border-gray-400 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
                
                <button className="p-2 rounded-xl bg-gray-500 hover:bg-gray-400 text-white transition-all duration-200">
                  <Play className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => deleteProgressionRule(rule.id)}
                  className="p-2 rounded-xl hover:bg-gray-500 text-white transition-all duration-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gray-600 hover:bg-gray-500 text-white transition-all duration-200">
                <Save className="w-5 h-5" />
                <span>Save as Template</span>
              </button>
              <button
                onClick={() => setShowAssignmentModal(true)}
                className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white transition-all duration-200"
              >
                <Send className="w-5 h-5" />
                <span>Publish Program</span>
              </button>
            </div>
          </div>

          {/* Week Progression Management */}
          {selectedClient && (
            <div className={`p-6 rounded-3xl border-2 ${
              isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-purple-600">Week Progression</h3>
                <span className="text-sm text-gray-500">Client: {selectedClient.name} ({selectedClient.numberOfWeeks} weeks)</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Array.from({ length: selectedClient.numberOfWeeks }, (_, weekIndex) => (
                  <div key={weekIndex} className={`p-4 rounded-2xl border-2 text-center ${
                    weekIndex === 0 
                      ? 'bg-green-100 border-green-300 text-green-800' 
                      : isDark 
                        ? 'bg-gray-600 border-gray-500 text-white' 
                        : 'bg-gray-100 border-gray-300 text-gray-700'
                  }`}>
                    <div className="font-bold text-lg">Week {weekIndex + 1}</div>
                    <div className="text-sm">
                      {weekIndex === 0 ? 'Unlocked' : 'Locked'}
                    </div>
                    {weekIndex > 0 && (
                      <button
                        onClick={() => unlockWeek(weekIndex + 1)}
                        className="mt-2 px-3 py-1 rounded-lg text-xs bg-purple-600 hover:bg-purple-700 text-white transition-all duration-200"
                      >
                        Unlock
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Program Selection Modal */}
      {showProgramModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-2xl w-full mx-6 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-purple-600">Select Training Program</h3>
              <button
                onClick={() => setShowProgramModal(false)}
                className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white hover:bg-purple-700 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              {readyWorkouts.map(workout => (
                <div
                  key={workout.id}
                  onClick={() => handleImportWorkout(workout)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    isDark 
                      ? 'bg-gray-700 border-gray-600 hover:border-gray-500' 
                      : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg mb-1">{workout.name}</h4>
                      <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        2x per week
                      </p>
                      <div className="flex space-x-2">
                        {workout.days.slice(0, 3).map(day => (
                          <span key={day.id} className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                          }`}>
                            {day.name}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      isDark ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {workout.days.length} days
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Assignment Modal */}
      {showAssignmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-md w-full mx-6 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <h3 className="text-2xl font-bold mb-6 text-purple-600">Assign Workout</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Select Client</label>
                <select
                  value={selectedClient?.id || ''}
                  onChange={(e) => {
                    const clientId = e.target.value;
                    const mockClient: Client = {
                      id: clientId,
                      name: clientId === 'client1' ? 'John Doe' : clientId === 'client2' ? 'Jane Smith' : 'Mike Johnson',
                      email: 'client@example.com',
                      goal: 'maintenance',
                      numberOfWeeks: clientId === 'client1' ? 4 : clientId === 'client2' ? 6 : 8,
                      startDate: new Date(),
                      isActive: true,
                      favorites: [],
                      weightLog: []
                    };
                    setSelectedClient(mockClient);
                    setDuration(mockClient.numberOfWeeks);
                  }}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="">Choose a client...</option>
                  <option value="client1">John Doe (4 weeks)</option>
                  <option value="client2">Jane Smith (6 weeks)</option>
                  <option value="client3">Mike Johnson (8 weeks)</option>
                </select>
              </div>
              
              {selectedClient && (
                <div className="p-4 rounded-2xl bg-blue-50 border-2 border-blue-200">
                  <div className="text-sm font-semibold text-blue-800 mb-2">Client Details:</div>
                  <div className="text-sm text-blue-700">
                    <div>Name: {selectedClient.name}</div>
                    <div>Program Duration: {selectedClient.numberOfWeeks} weeks</div>
                    <div>Goal: {selectedClient.goal}</div>
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-semibold mb-2">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Duration (weeks)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                  min="1"
                  max="52"
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                />
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAssignmentModal(false)}
                className={`px-6 py-3 rounded-2xl text-lg font-semibold ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={assignToClient}
                className="px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
              >
                Assign Workout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
