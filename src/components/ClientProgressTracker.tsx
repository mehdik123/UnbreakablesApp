import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Weight,
  Activity,
  Heart,
  Zap,
  Target,
  Calendar,
  BarChart3,
  Award,
  Clock,
  Droplets,
  Moon,
  Battery,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit3,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { 
  Client, 
  PersonalRecord, 
  BodyMeasurement, 
  EnduranceRecord, 
  FlexibilityRecord, 
  LifestyleMetrics, 
  WorkoutPerformance, 
  ProgressEntry, 
  ProgressAnalytics 
} from '../types';
import { createStrengthProgressExtractor, StrengthProgress } from '../utils/strengthProgressExtractor';
import StrengthProgressChart from './StrengthProgressChart';

interface ClientProgressTrackerProps {
  client: Client;
  isDark: boolean;
  onBack: () => void;
}

export const ClientProgressTracker: React.FC<ClientProgressTrackerProps> = ({
  client,
  isDark,
  onBack
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'strength' | 'body' | 'endurance' | 'lifestyle' | 'performance'>('overview');
  const [progressEntries, setProgressEntries] = useState<ProgressEntry[]>([]);
  const [showAddEntry, setShowAddEntry] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [strengthProgress, setStrengthProgress] = useState<StrengthProgress[]>([]);
  const [strengthExtractor, setStrengthExtractor] = useState(createStrengthProgressExtractor());

  // Mock data for demonstration
  useEffect(() => {
    const mockData: ProgressEntry[] = [
      {
        id: '1',
        clientId: client.id,
        date: new Date('2024-01-15'),
        personalRecords: [
          {
            id: 'pr1',
            exerciseId: 'bench-press',
            exerciseName: 'Bench Press',
            weight: 100,
            reps: 5,
            date: new Date('2024-01-15'),
            notes: 'New PR!'
          }
        ],
        bodyMeasurements: [
          {
            id: 'bm1',
            date: new Date('2024-01-15'),
            weight: 75,
            chest: 100,
            waist: 85,
            arms: 35,
            thighs: 60,
            bodyFatPercentage: 15
          }
        ],
        enduranceRecords: [
          {
            id: 'er1',
            date: new Date('2024-01-15'),
            exerciseType: 'running',
            duration: 30,
            distance: 5,
            averageHeartRate: 150,
            caloriesBurned: 300
          }
        ],
        flexibilityRecords: [],
        lifestyleMetrics: {
          id: 'lm1',
          date: new Date('2024-01-15'),
          sleepHours: 8,
          sleepQuality: 8,
          energyLevel: 7,
          stressLevel: 4,
          hydration: 2.5,
          nutritionAdherence: 85,
          workoutIntensity: 7,
          recoveryTime: 24
        },
        workoutPerformance: [],
        overallNotes: 'Great week!'
      }
    ];
    setProgressEntries(mockData);
  }, [client.id]);

  // Extract strength progress from client's workout data
  useEffect(() => {
    if (client.workoutAssignment?.workoutProgram) {
      // Extract strength data from the workout program
      const sessions = strengthExtractor.extractFromWorkoutProgram(
        client.workoutAssignment.workoutProgram,
        new Date()
      );
      
      // Get all strength progress data
      const allStrengthProgress = strengthExtractor.getAllStrengthProgress();
      setStrengthProgress(allStrengthProgress);
      
      console.log('Extracted strength progress:', allStrengthProgress);
    } else {
      // Generate sample strength data for demonstration
      generateSampleStrengthData();
    }
  }, [client.workoutAssignment, strengthExtractor]);

  const generateSampleStrengthData = () => {
    // Create sample workout sessions with progressive weights
    const sampleDates = [
      new Date('2024-01-01'),
      new Date('2024-01-08'),
      new Date('2024-01-15'),
      new Date('2024-01-22'),
      new Date('2024-01-29')
    ];

    const sampleExercises = [
      { id: 'bench-press', name: 'Bench Press' },
      { id: 'squat', name: 'Squat' },
      { id: 'deadlift', name: 'Deadlift' },
      { id: 'overhead-press', name: 'Overhead Press' }
    ];

    sampleExercises.forEach(exercise => {
      sampleDates.forEach((date, index) => {
        // Progressive weight increase
        const baseWeight = exercise.id === 'deadlift' ? 120 : exercise.id === 'squat' ? 100 : 80;
        const weight = baseWeight + (index * 5);
        const reps = 5 + Math.floor(Math.random() * 3); // 5-7 reps
        
        const session = {
          id: `session-${exercise.id}-${index}`,
          date,
          exerciseId: exercise.id,
          exerciseName: exercise.name,
          bestWeight: weight,
          bestReps: reps,
          totalVolume: weight * reps * 3, // 3 sets
          sets: [
            { weight, reps, completed: true },
            { weight: weight - 5, reps: reps + 1, completed: true },
            { weight: weight - 10, reps: reps + 2, completed: true }
          ],
          notes: `Week ${index + 1} - Feeling strong!`
        };

        strengthExtractor.extractFromExercise({
          exercise: { id: exercise.id, name: exercise.name, muscleGroup: 'chest', equipment: 'barbell' },
          sets: session.sets.map(set => ({
            weight: set.weight,
            reps: set.reps,
            completed: set.completed,
            rest: 180
          })),
          notes: session.notes,
          order: 1
        }, date);
      });
    });

    const allStrengthProgress = strengthExtractor.getAllStrengthProgress();
    setStrengthProgress(allStrengthProgress);
    console.log('Generated sample strength progress:', allStrengthProgress);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'strength', label: 'Strength', icon: Zap },
    { id: 'body', label: 'Body', icon: Weight },
    { id: 'endurance', label: 'Endurance', icon: Heart },
    { id: 'lifestyle', label: 'Lifestyle', icon: Moon },
    { id: 'performance', label: 'Performance', icon: Target }
  ];

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total PRs</p>
              <p className="text-3xl font-bold">
                {strengthProgress.reduce((total, progress) => total + progress.allPRs.length, 0)}
              </p>
            </div>
            <Award className="w-8 h-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Weight Change</p>
              <p className="text-3xl font-bold">-2.5kg</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Workout Consistency</p>
              <p className="text-3xl font-bold">92%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-purple-200" />
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Energy Level</p>
              <p className="text-3xl font-bold">8.2/10</p>
            </div>
            <Battery className="w-8 h-8 text-orange-200" />
          </div>
        </div>
      </div>

      {/* Recent Progress */}
      <div className="bg-slate-800/50 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Progress</h3>
        <div className="space-y-4">
          {strengthProgress.length > 0 ? (
            strengthProgress.slice(0, 3).map(progress => (
              <div key={progress.exerciseId} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">
                    {progress.exerciseName}: {progress.currentPR?.weight}kg x {progress.currentPR?.reps}
                    {progress.currentPR && (
                      <span className="text-green-400 ml-2">(+{progress.improvement.weightGain}kg)</span>
                    )}
                  </span>
                </div>
                <span className="text-slate-400 text-sm">
                  {progress.currentPR?.date.toLocaleDateString() || 'No recent data'}
                </span>
              </div>
            ))
          ) : (
            <>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Award className="w-5 h-5 text-yellow-400" />
                  <span className="text-white">New Bench Press PR: 100kg x 5</span>
                </div>
                <span className="text-slate-400 text-sm">2 days ago</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Weight className="w-5 h-5 text-green-400" />
                  <span className="text-white">Weight: 75kg (-0.5kg this week)</span>
                </div>
                <span className="text-slate-400 text-sm">1 week ago</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Heart className="w-5 h-5 text-red-400" />
                  <span className="text-white">5K Run: 25:30 (New best time!)</span>
                </div>
                <span className="text-slate-400 text-sm">3 days ago</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const renderStrengthTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Strength Progress & Charts</h3>
        <button
          onClick={() => setShowAddEntry(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add PR</span>
        </button>
      </div>

      {/* Strength Progress Charts */}
      {strengthProgress.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strengthProgress.map(progress => (
              <StrengthProgressChart
                key={progress.exerciseId}
                strengthProgress={progress}
                isDark={true}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/50 rounded-xl p-8 text-center border border-slate-700/50">
          <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-white mb-2">No Strength Data Yet</h4>
          <p className="text-slate-400 mb-4">
            Complete some workouts with major lifts to see your strength progress charts.
          </p>
          <div className="text-sm text-slate-500">
            <p>We track major lifts like:</p>
            <p className="mt-1">Bench Press, Squat, Deadlift, Overhead Press, and more...</p>
          </div>
        </div>
      )}

      {/* Personal Records Section */}
      <div className="mt-8">
        <h4 className="text-lg font-semibold text-white mb-4">All Personal Records</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {progressEntries.flatMap(entry => entry.personalRecords).map(pr => (
            <div key={pr.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-semibold text-white">{pr.exerciseName}</h4>
                <Award className="w-5 h-5 text-yellow-400" />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Weight:</span>
                  <span className="text-white font-semibold">{pr.weight}kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Reps:</span>
                  <span className="text-white font-semibold">{pr.reps}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Date:</span>
                  <span className="text-slate-300">{pr.date.toLocaleDateString()}</span>
                </div>
                {pr.notes && (
                  <p className="text-slate-400 text-sm mt-2">{pr.notes}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBodyTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Body Measurements</h3>
        <button
          onClick={() => setShowAddEntry(true)}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Measurement</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressEntries.flatMap(entry => entry.bodyMeasurements).map(measurement => (
          <div key={measurement.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Body Measurements</h4>
              <Weight className="w-5 h-5 text-green-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Weight:</span>
                <span className="text-white font-semibold">{measurement.weight}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Chest:</span>
                <span className="text-white font-semibold">{measurement.chest}cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Waist:</span>
                <span className="text-white font-semibold">{measurement.waist}cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Arms:</span>
                <span className="text-white font-semibold">{measurement.arms}cm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thighs:</span>
                <span className="text-white font-semibold">{measurement.thighs}cm</span>
              </div>
              {measurement.bodyFatPercentage && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Body Fat:</span>
                  <span className="text-white font-semibold">{measurement.bodyFatPercentage}%</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-300">{measurement.date.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderEnduranceTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Endurance Records</h3>
        <button
          onClick={() => setShowAddEntry(true)}
          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Record</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressEntries.flatMap(entry => entry.enduranceRecords).map(record => (
          <div key={record.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white capitalize">{record.exerciseType}</h4>
              <Heart className="w-5 h-5 text-red-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Duration:</span>
                <span className="text-white font-semibold">{record.duration} min</span>
              </div>
              {record.distance && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Distance:</span>
                  <span className="text-white font-semibold">{record.distance}km</span>
                </div>
              )}
              {record.averageHeartRate && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg HR:</span>
                  <span className="text-white font-semibold">{record.averageHeartRate} bpm</span>
                </div>
              )}
              {record.caloriesBurned && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Calories:</span>
                  <span className="text-white font-semibold">{record.caloriesBurned}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-300">{record.date.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLifestyleTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Lifestyle Metrics</h3>
        <button
          onClick={() => setShowAddEntry(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Metrics</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressEntries.map(entry => (
          <div key={entry.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">Daily Metrics</h4>
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Moon className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-400">Sleep:</span>
                </div>
                <span className="text-white font-semibold">{entry.lifestyleMetrics.sleepHours}h</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Battery className="w-4 h-4 text-green-400" />
                  <span className="text-slate-400">Energy:</span>
                </div>
                <span className="text-white font-semibold">{entry.lifestyleMetrics.energyLevel}/10</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400" />
                  <span className="text-slate-400">Stress:</span>
                </div>
                <span className="text-white font-semibold">{entry.lifestyleMetrics.stressLevel}/10</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  <span className="text-slate-400">Hydration:</span>
                </div>
                <span className="text-white font-semibold">{entry.lifestyleMetrics.hydration}L</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-400">Nutrition:</span>
                </div>
                <span className="text-white font-semibold">{entry.lifestyleMetrics.nutritionAdherence}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-300">{entry.lifestyleMetrics.date.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Workout Performance</h3>
        <button
          onClick={() => setShowAddEntry(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Performance</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {progressEntries.flatMap(entry => entry.workoutPerformance).map(performance => (
          <div key={performance.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-white">{performance.workoutName}</h4>
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Completion:</span>
                <span className="text-white font-semibold">{performance.completionRate}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Volume:</span>
                <span className="text-white font-semibold">{performance.totalVolume}kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Intensity:</span>
                <span className="text-white font-semibold">{performance.averageRPE}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Form:</span>
                <span className="text-white font-semibold">{performance.formQuality}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Date:</span>
                <span className="text-slate-300">{performance.date.toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'strength':
        return renderStrengthTracking();
      case 'body':
        return renderBodyTracking();
      case 'endurance':
        return renderEnduranceTracking();
      case 'lifestyle':
        return renderLifestyleTracking();
      case 'performance':
        return renderPerformanceTracking();
      default:
        return renderOverview();
    }
  };

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
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Progress Tracking</h1>
                <p className="text-slate-400 text-sm">Monitoring {client.name}'s fitness journey</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-slate-800/50 rounded-xl p-1">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default ClientProgressTracker;
