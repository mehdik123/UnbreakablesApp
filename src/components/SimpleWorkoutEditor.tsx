import React, { useState, useEffect } from 'react';
import { Client, WorkoutProgram, WorkoutExercise, WorkoutSet } from '../types';
import { exercises } from '../data/exercises';

interface SimpleWorkoutEditorProps {
  client: Client;
  isCoach: boolean;
  onClose: () => void;
}

export const SimpleWorkoutEditor: React.FC<SimpleWorkoutEditorProps> = ({
  client,
  isCoach,
  onClose
}) => {
  const [workoutProgram, setWorkoutProgram] = useState<WorkoutProgram | null>(null);
  const [currentDay, setCurrentDay] = useState(0);
  const [currentWeek, setCurrentWeek] = useState(1);

  // FIX: Refactored useEffect to remove setInterval and correctly handle state
  useEffect(() => {
    // Load the initial program from the prop when the component mounts
    if (client.workoutAssignment?.program) {
      setWorkoutProgram(client.workoutAssignment.program);
    }

    // Define a handler that reads FRESH data from localStorage
    const handleStorageChange = () => {
      console.log('Storage changed, reloading workout program...');
      const clientData = localStorage.getItem(`client_${client.id}_complete`);
      if (clientData) {
        const updatedClient = JSON.parse(clientData);
        if (updatedClient.workoutAssignment?.program) {
          setWorkoutProgram(updatedClient.workoutAssignment.program);
        }
      }
    };

    // Listen for the 'storage' event to sync with other tabs/windows
    window.addEventListener('storage', handleStorageChange);

    // Clean up the event listener when the component unmounts
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [client.id, client.workoutAssignment]);

  // Save workout program to localStorage
  const saveWorkoutProgram = (updatedProgram: WorkoutProgram) => {
    setWorkoutProgram(updatedProgram);
    
    // Update client's workout assignment
    const updatedClient = {
      ...client,
      workoutAssignment: {
        ...client.workoutAssignment!,
        program: updatedProgram
      }
    };
    
    // Save to localStorage
    localStorage.setItem(`client_${client.id}_complete`, JSON.stringify(updatedClient));
    
    // Trigger storage event for other interfaces
    window.dispatchEvent(new Event('storage'));
  };

  // Update reps for a specific set
  const updateReps = (exerciseId: string, setId: string, change: number) => {
    if (!workoutProgram) return;
    
    const updatedProgram = {
      ...workoutProgram,
      days: workoutProgram.days.map((day, dayIndex) => 
        dayIndex === currentDay 
          ? {
              ...day,
              exercises: day.exercises.map(exercise =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      sets: exercise.sets.map(set =>
                        set.id === setId
                          ? { ...set, reps: Math.max(1, set.reps + change) }
                          : set
                      )
                    }
                  : exercise
              )
            }
          : day
      )
    };
    
    saveWorkoutProgram(updatedProgram);
  };

  // Update weight for a specific set
  const updateWeight = (exerciseId: string, setId: string, change: number) => {
    if (!workoutProgram) return;
    
    const updatedProgram = {
      ...workoutProgram,
      days: workoutProgram.days.map((day, dayIndex) => 
        dayIndex === currentDay 
          ? {
              ...day,
              exercises: day.exercises.map(exercise =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      sets: exercise.sets.map(set =>
                        set.id === setId
                          ? { ...set, weight: Math.max(0, set.weight + change) }
                          : set
                      )
                    }
                  : exercise
              )
            }
          : day
      )
    };
    
    saveWorkoutProgram(updatedProgram);
  };

  // Replace exercise
  const replaceExercise = (exerciseId: string, newExerciseName: string) => {
    if (!workoutProgram || !isCoach) return;
    
    const newExercise = exercises.find(ex => ex.name === newExerciseName);
    if (!newExercise) return;
    
    const updatedProgram = {
      ...workoutProgram,
      days: workoutProgram.days.map((day, dayIndex) => 
        dayIndex === currentDay 
          ? {
              ...day,
              exercises: day.exercises.map(exercise =>
                exercise.id === exerciseId
                  ? {
                      ...exercise,
                      exercise: newExercise,
                      name: newExercise.name
                    }
                  : exercise
              )
            }
          : day
      )
    };
    
    saveWorkoutProgram(updatedProgram);
  };

  if (!workoutProgram) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading workout program...</div>
      </div>
    );
  }

  const currentDayData = workoutProgram.days[currentDay];
  const dayNames = ['Push Day', 'Pull Day', 'Legs Day'];

  return (
    <div className="bg-gray-900 text-white p-6 rounded-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">
          {isCoach ? 'Coach' : 'Client'} Workout Editor
        </h2>
        <button
          onClick={onClose}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Close
        </button>
      </div>

      {/* Day Navigation */}
      <div className="flex gap-2 mb-6">
        {dayNames.map((dayName, index) => (
          <button
            key={index}
            onClick={() => setCurrentDay(index)}
            className={`px-4 py-2 rounded ${
              currentDay === index
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {dayName}
          </button>
        ))}
      </div>

      {/* Exercises */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-4">
          {dayNames[currentDay]} - {currentDayData.exercises.length} exercises
        </h3>
        
        {currentDayData.exercises.map((workoutExercise) => (
          <div key={workoutExercise.id} className="bg-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-lg font-medium">{workoutExercise.name}</h4>
              {isCoach && (
                <button
                  onClick={() => {
                    const newName = prompt('Enter new exercise name:');
                    if (newName) replaceExercise(workoutExercise.id, newName);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Replace
                </button>
              )}
            </div>
            
            {/* Sets */}
            <div className="space-y-2">
              {workoutExercise.sets.map((set, setIndex) => (
                <div key={set.id} className="flex items-center gap-4 bg-gray-700 p-3 rounded">
                  <span className="w-8 text-center">Set {setIndex + 1}</span>
                  
                  <div className="flex items-center gap-2">
                    <span>Reps:</span>
                    <button
                      onClick={() => updateReps(workoutExercise.id, set.id, -1)}
                      className="bg-red-600 hover:bg-red-700 w-8 h-8 rounded flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{set.reps}</span>
                    <button
                      onClick={() => updateReps(workoutExercise.id, set.id, 1)}
                      className="bg-green-600 hover:bg-green-700 w-8 h-8 rounded flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span>Weight:</span>
                    <button
                      onClick={() => updateWeight(workoutExercise.id, set.id, -2.5)}
                      className="bg-red-600 hover:bg-red-700 w-8 h-8 rounded flex items-center justify-center"
                    >
                      -
                    </button>
                    <span className="w-12 text-center">{set.weight}kg</span>
                    <button
                      onClick={() => updateWeight(workoutExercise.id, set.id, 2.5)}
                      className="bg-green-600 hover:bg-green-700 w-8 h-8 rounded flex items-center justify-center"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
