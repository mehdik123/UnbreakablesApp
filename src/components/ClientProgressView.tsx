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
  Star,
  Trophy,
  Flame,
  ArrowUp,
  ArrowDown,
  Minus,
  Plus,
  ArrowLeft,
  ArrowRight,
  X,
  Camera,
  Upload,
  Image,
  Trash2
} from 'lucide-react';
import { Client, PersonalRecord, BodyMeasurement, EnduranceRecord, LifestyleMetrics, WorkoutPerformance } from '../types';
import { createStrengthProgressExtractor, StrengthProgress } from '../utils/strengthProgressExtractor';
import StrengthProgressChart from './StrengthProgressChart';
import IndependentMuscleGroupCharts from './IndependentMuscleGroupCharts';

interface ClientProgressViewProps {
  client: Client;
  isDark: boolean;
}

export const ClientProgressView: React.FC<ClientProgressViewProps> = ({
  client,
  isDark
}) => {
  const [activeCategory, setActiveCategory] = useState<'overview' | 'strength' | 'body' | 'endurance' | 'lifestyle' | 'performance' | 'volume'>('overview');
  const [strengthProgress, setStrengthProgress] = useState<StrengthProgress[]>([]);
  const [strengthExtractor, setStrengthExtractor] = useState(createStrengthProgressExtractor());
  const [weightEntries, setWeightEntries] = useState<Array<{date: string, weight: number, week: number, day: number}>>([]);
  const [currentWeek, setCurrentWeek] = useState(1);
  const [showWeekCalendar, setShowWeekCalendar] = useState(false);
  const [showPhysiqueUpload, setShowPhysiqueUpload] = useState(false);
  const [physiqueImages, setPhysiqueImages] = useState<{ [week: number]: string[] }>({});

  // Muscle group volume calculation
  const calculateMuscleGroupVolume = (week: number) => {
    if (!client.workoutAssignment?.program) return {};

    const muscleGroupVolume: { [muscleGroup: string]: number } = {};
    
    // Get all exercises from the workout program
    const allExercises = client.workoutAssignment.program.days.flatMap(day => 
      day.exercises.map(exercise => ({
        ...exercise,
        muscleGroup: exercise.exercise.muscleGroup
      }))
    );

    // Calculate volume for each muscle group
    allExercises.forEach(exercise => {
      const muscleGroup = exercise.muscleGroup;
      if (!muscleGroupVolume[muscleGroup]) {
        muscleGroupVolume[muscleGroup] = 0;
      }

      // Calculate volume: sets × reps × weight (using universal formula for bodyweight exercises)
      exercise.sets.forEach(set => {
        const reps = set.reps || 0;
        const weight = set.weight || 0;
        muscleGroupVolume[muscleGroup] += reps * Math.max(weight, 1);
      });
    });

    return muscleGroupVolume;
  };

  const weeklyMuscleVolume = calculateMuscleGroupVolume(currentWeek);

  // Generate sample progress data for demonstration
  useEffect(() => {
    generateSampleProgressData();
    loadWeightEntries();
  }, []);

  // Force re-render when weightEntries change to update chart
  useEffect(() => {
    // This will trigger a re-render of the chart when weightEntries change
  }, [weightEntries]);

  const loadWeightEntries = () => {
    const saved = localStorage.getItem(`weight_entries_${client.id}`);
    if (saved) {
      setWeightEntries(JSON.parse(saved));
    } else {
      // Generate sample weight data based on client's program duration
      const sampleEntries = [];
      const today = new Date();
      const totalDays = client.numberOfWeeks * 7;
      
      for (let i = totalDays - 1; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const week = Math.ceil((totalDays - i) / 7);
        const day = ((totalDays - i - 1) % 7) + 1;
        const weight = 75 + (Math.random() - 0.5) * 2; // Random weight around 75kg
        sampleEntries.push({
          date: date.toISOString().split('T')[0],
          weight: Math.round(weight * 10) / 10,
          week: week,
          day: day
        });
      }
      setWeightEntries(sampleEntries);
      localStorage.setItem(`weight_entries_${client.id}`, JSON.stringify(sampleEntries));
    }
  };


  const getWeekDays = (weekNumber: number) => {
    const programStartDate = new Date();
    programStartDate.setDate(programStartDate.getDate() - (client.numberOfWeeks * 7 - 1));
    
    const startDate = new Date(programStartDate);
    startDate.setDate(startDate.getDate() + (weekNumber - 1) * 7);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      const existingEntry = weightEntries.find(entry => entry.date === dateString);
      
      days.push({
        date: dateString,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: date.getDate(),
        weight: existingEntry?.weight || null,
        isLogged: !!existingEntry,
        isToday: dateString === new Date().toISOString().split('T')[0]
      });
    }
    return days;
  };

  const generateSampleProgressData = () => {
    // Create sample strength progress data
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
        const baseWeight = exercise.id === 'deadlift' ? 120 : exercise.id === 'squat' ? 100 : 80;
        const weight = baseWeight + (index * 5);
        const reps = 5 + Math.floor(Math.random() * 3);
        
        strengthExtractor.extractFromExercise({
          exercise: { id: exercise.id, name: exercise.name, muscleGroup: 'chest', equipment: 'barbell' },
          sets: [
            { weight, reps, completed: true, rest: 180 },
            { weight: weight - 5, reps: reps + 1, completed: true, rest: 180 },
            { weight: weight - 10, reps: reps + 2, completed: true, rest: 180 }
          ],
          notes: `Week ${index + 1} - Feeling strong!`,
          order: 1
        }, date);
      });
    });

    const allStrengthProgress = strengthExtractor.getAllStrengthProgress();
    setStrengthProgress(allStrengthProgress);
  };

  const categories = [
    { id: 'overview', label: 'Overview', icon: BarChart3, color: 'blue' },
    { id: 'strength', label: 'Strength', icon: Zap, color: 'green' },
    { id: 'body', label: 'Body', icon: Weight, color: 'purple' },
    { id: 'endurance', label: 'Endurance', icon: Heart, color: 'red' },
    { id: 'lifestyle', label: 'Lifestyle', icon: Moon, color: 'indigo' },
    { id: 'performance', label: 'Performance', icon: Target, color: 'orange' },
    { id: 'volume', label: 'Volume', icon: BarChart3, color: 'green' }
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

      {/* Recent Achievements */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-4">Recent Achievements</h3>
        <div className="space-y-4">
          {strengthProgress.slice(0, 3).map(progress => (
            <div key={progress.exerciseId} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
              <div className="flex items-center space-x-3">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  New {progress.exerciseName} PR: {progress.currentPR?.weight}kg x {progress.currentPR?.reps}
                </span>
                <span className="text-green-500 text-sm font-medium">
                  (+{progress.improvement.weightGain}kg)
                </span>
              </div>
              <span className="text-slate-500 dark:text-slate-400 text-sm">
                {progress.currentPR?.date.toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Progress Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Strength Progress</h4>
          <div className="space-y-3">
            {strengthProgress.slice(0, 4).map(progress => (
              <div key={progress.exerciseId} className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">{progress.exerciseName}</span>
                <div className="flex items-center space-x-2">
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">
                    {progress.currentPR?.weight}kg
                  </span>
                  <div className="flex items-center text-green-500">
                    <ArrowUp className="w-4 h-4" />
                    <span className="text-sm">+{progress.improvement.weightGain}kg</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Body Measurements</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Weight</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 dark:text-slate-100 font-semibold">75kg</span>
                <div className="flex items-center text-green-500">
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-sm">-2.5kg</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Body Fat</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 dark:text-slate-100 font-semibold">15%</span>
                <div className="flex items-center text-green-500">
                  <ArrowDown className="w-4 h-4" />
                  <span className="text-sm">-1.2%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600 dark:text-slate-400">Muscle Mass</span>
              <div className="flex items-center space-x-2">
                <span className="text-slate-900 dark:text-slate-100 font-semibold">+1.8kg</span>
                <div className="flex items-center text-green-500">
                  <ArrowUp className="w-4 h-4" />
                  <span className="text-sm">+1.8kg</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Physique Progress Photos */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center space-x-2">
              <Camera className="w-5 h-5 text-purple-500" />
              <span>Physique Progress</span>
            </h4>
            <button
              onClick={() => setShowPhysiqueUpload(!showPhysiqueUpload)}
              className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium flex items-center space-x-2 transition-all duration-200"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Photos</span>
            </button>
          </div>
          
          {/* Current Week Images */}
          {physiqueImages[currentWeek] && physiqueImages[currentWeek].length > 0 && (
            <div className="mb-6">
              <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Week {currentWeek} Progress</h5>
              <div className="grid grid-cols-2 gap-3">
                {physiqueImages[currentWeek].map((image, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={image} 
                      alt={`Week ${currentWeek} progress ${index + 1}`}
                      className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                    />
                    <button
                      onClick={() => {
                        const newImages = { ...physiqueImages };
                        newImages[currentWeek] = newImages[currentWeek].filter((_, i) => i !== index);
                        setPhysiqueImages(newImages);
                      }}
                      className="absolute top-2 right-2 w-6 h-6 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Interface */}
          {showPhysiqueUpload && (
            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
                  <Image className="w-8 h-8 text-purple-500" />
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Upload your physique progress photos</p>
                  <p className="text-xs text-slate-500 dark:text-slate-500">Take front, side, and back photos for best tracking</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    const files = Array.from(e.target.files || []);
                    const newImages = files.map(file => URL.createObjectURL(file));
                    setPhysiqueImages(prev => ({
                      ...prev,
                      [currentWeek]: [...(prev[currentWeek] || []), ...newImages]
                    }));
                    setShowPhysiqueUpload(false);
                  }}
                  className="hidden"
                  id="physique-upload"
                />
                <label
                  htmlFor="physique-upload"
                  className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-medium cursor-pointer transition-all duration-200"
                >
                  Choose Photos
                </label>
              </div>
            </div>
          )}

          {/* Previous Weeks */}
          {Object.keys(physiqueImages).length > 0 && (
            <div className="mt-6">
              <h5 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Previous Weeks</h5>
              <div className="space-y-2">
                {Object.entries(physiqueImages)
                  .filter(([week]) => parseInt(week) !== currentWeek)
                  .map(([week, images]) => (
                    <div key={week} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                      <span className="text-sm text-slate-600 dark:text-slate-400">Week {week} ({images.length} photos)</span>
                      <button
                        onClick={() => {
                          const newImages = { ...physiqueImages };
                          delete newImages[parseInt(week)];
                          setPhysiqueImages(newImages);
                        }}
                        className="text-red-500 hover:text-red-600 text-sm flex items-center space-x-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Remove</span>
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderStrengthTracking = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Your Strength Progress</h3>
        <div className="text-sm text-slate-500 dark:text-slate-400">
          Tracked by your coach
        </div>
      </div>

      {/* Strength Progress Charts */}
      {strengthProgress.length > 0 ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {strengthProgress.map(progress => (
              <StrengthProgressChart
                key={progress.exerciseId}
                strengthProgress={progress}
                isDark={isDark}
              />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-8 text-center">
          <Zap className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Strength Data Yet</h4>
          <p className="text-slate-600 dark:text-slate-400">
            Complete some workouts with major lifts to see your strength progress charts.
          </p>
        </div>
      )}
    </div>
  );

  const renderBodyTracking = () => {
    const currentWeight = weightEntries.length > 0 ? weightEntries[weightEntries.length - 1].weight : 0;
    const previousWeight = weightEntries.length > 1 ? weightEntries[weightEntries.length - 2].weight : currentWeight;
    const weightChange = currentWeight - previousWeight;
    const weightTrend = weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable';

    // Calculate weekly averages - recalculate every time weightEntries changes
    const weeklyAverages = [];
    for (let week = 1; week <= client.numberOfWeeks; week++) {
      const weekEntries = weightEntries.filter(entry => entry.week === week);
      const average = weekEntries.length > 0 
        ? (weekEntries.reduce((sum, entry) => sum + entry.weight, 0) / weekEntries.length).toFixed(1)
        : null;
      weeklyAverages.push({ week, average, entries: weekEntries });
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Weight Tracking</h3>
          <button
            onClick={() => setShowWeekCalendar(true)}
            className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl font-semibold"
          >
            <Calendar className="w-5 h-5" />
            <span>Weekly View</span>
          </button>
        </div>

        {/* Weight Progress Summary - Crypto Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Weight Card */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 border border-blue-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">Current Weight</h4>
                <div className="text-4xl font-bold text-blue-600 dark:text-blue-400">{currentWeight}kg</div>
                {currentWeight === 0 && (
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">No weight logged yet</p>
                )}
              </div>
              <div className="text-right">
                <div className={`flex items-center space-x-2 text-lg font-semibold ${
                  weightTrend === 'up' ? 'text-red-500' : weightTrend === 'down' ? 'text-green-500' : 'text-slate-500'
                }`}>
                  {weightTrend === 'up' ? <ArrowUp className="w-5 h-5" /> : 
                   weightTrend === 'down' ? <ArrowDown className="w-5 h-5" /> : 
                   <Minus className="w-5 h-5" />}
                  <span>{weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)}kg</span>
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">vs previous day</div>
              </div>
            </div>
          </div>

          {/* Starting Weight & Progress Card */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Progress Overview</h4>
            {(() => {
              const startingWeight = weightEntries.length > 0 ? weightEntries[0].weight : 0;
              const totalChange = currentWeight - startingWeight;
              const totalChangePercent = startingWeight > 0 ? (totalChange / startingWeight) * 100 : 0;
              
              return (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Starting Weight</span>
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {startingWeight > 0 ? `${startingWeight}kg` : 'Not set'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Total Change</span>
                    <div className="flex items-center space-x-2">
                      <span className={`font-semibold ${
                        totalChange > 0 ? 'text-red-500' : totalChange < 0 ? 'text-green-500' : 'text-slate-500'
                      }`}>
                        {totalChange > 0 ? '+' : ''}{totalChange.toFixed(1)}kg
                      </span>
                      <span className={`text-sm px-2 py-1 rounded-full ${
                        totalChangePercent > 0 
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                          : totalChangePercent < 0 
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {totalChangePercent > 0 ? '+' : ''}{totalChangePercent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* Progress Periods - Crypto Style */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
          <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
            <TrendingUp className="w-6 h-6 text-purple-500" />
            <span>Progress Tracking</span>
          </h4>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {(() => {
              const now = new Date();
              const startingWeight = weightEntries.length > 0 ? weightEntries[0].weight : 0;
              
              // Daily Progress
              const yesterday = new Date(now);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayWeight = weightEntries.find(entry => 
                entry.date === yesterday.toISOString().split('T')[0]
              )?.weight;
              const dailyChange = currentWeight - (yesterdayWeight || currentWeight);
              const dailyChangePercent = yesterdayWeight > 0 ? (dailyChange / yesterdayWeight) * 100 : 0;
              
              // Weekly Progress
              const oneWeekAgo = new Date(now);
              oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
              const weekAgoWeight = weightEntries.find(entry => 
                new Date(entry.date) <= oneWeekAgo
              )?.weight || startingWeight;
              const weeklyChange = currentWeight - weekAgoWeight;
              const weeklyChangePercent = weekAgoWeight > 0 ? (weeklyChange / weekAgoWeight) * 100 : 0;
              
              // Monthly Progress
              const oneMonthAgo = new Date(now);
              oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
              const monthAgoWeight = weightEntries.find(entry => 
                new Date(entry.date) <= oneMonthAgo
              )?.weight || startingWeight;
              const monthlyChange = currentWeight - monthAgoWeight;
              const monthlyChangePercent = monthAgoWeight > 0 ? (monthlyChange / monthAgoWeight) * 100 : 0;
              
              // Yearly Progress
              const oneYearAgo = new Date(now);
              oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
              const yearAgoWeight = weightEntries.find(entry => 
                new Date(entry.date) <= oneYearAgo
              )?.weight || startingWeight;
              const yearlyChange = currentWeight - yearAgoWeight;
              const yearlyChangePercent = yearAgoWeight > 0 ? (yearlyChange / yearAgoWeight) * 100 : 0;
              
              const periods = [
                { 
                  label: 'Daily', 
                  change: dailyChange, 
                  changePercent: dailyChangePercent,
                  icon: '📅',
                  color: dailyChange > 0 ? 'red' : dailyChange < 0 ? 'green' : 'slate'
                },
                { 
                  label: 'Weekly', 
                  change: weeklyChange, 
                  changePercent: weeklyChangePercent,
                  icon: '📊',
                  color: weeklyChange > 0 ? 'red' : weeklyChange < 0 ? 'green' : 'slate'
                },
                { 
                  label: 'Monthly', 
                  change: monthlyChange, 
                  changePercent: monthlyChangePercent,
                  icon: '📈',
                  color: monthlyChange > 0 ? 'red' : monthlyChange < 0 ? 'green' : 'slate'
                },
                { 
                  label: 'Yearly', 
                  change: yearlyChange, 
                  changePercent: yearlyChangePercent,
                  icon: '🎯',
                  color: yearlyChange > 0 ? 'red' : yearlyChange < 0 ? 'green' : 'slate'
                }
              ];
              
              return periods.map((period, index) => (
                <div key={index} className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 border border-slate-200 dark:border-slate-600">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{period.icon}</span>
                    <div className={`flex items-center space-x-1 ${
                      period.color === 'red' ? 'text-red-500' : 
                      period.color === 'green' ? 'text-green-500' : 
                      'text-slate-500'
                    }`}>
                      {period.change > 0 ? <ArrowUp className="w-4 h-4" /> : 
                       period.change < 0 ? <ArrowDown className="w-4 h-4" /> : 
                       <Minus className="w-4 h-4" />}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400">
                      {period.label}
                    </div>
                    
                    <div className={`text-lg font-bold ${
                      period.color === 'red' ? 'text-red-500' : 
                      period.color === 'green' ? 'text-green-500' : 
                      'text-slate-500'
                    }`}>
                      {period.change > 0 ? '+' : ''}{period.change.toFixed(1)}kg
                    </div>
                    
                    <div className={`text-sm px-2 py-1 rounded-full inline-block ${
                      period.color === 'red' 
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
                        : period.color === 'green' 
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                    }`}>
                      {period.changePercent > 0 ? '+' : ''}{period.changePercent.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>

        {/* Weight Log Table and Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Weight Log Table */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
              <Weight className="w-6 h-6 text-purple-500" />
              <span>Weight Log</span>
            </h4>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-600">
                    <th className="text-left py-3 px-2 text-sm font-semibold text-green-600 dark:text-green-400">Day</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-blue-600 dark:text-blue-400">Weight</th>
                    <th className="text-left py-3 px-2 text-sm font-semibold text-slate-600 dark:text-slate-400">Average Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {weeklyAverages.map((weekData) => (
                    <React.Fragment key={weekData.week}>
                      {/* Week Header */}
                      <tr className="bg-red-50 dark:bg-red-900/20">
                        <td colSpan={3} className="py-3 px-2">
                          <div className="text-lg font-bold text-red-600 dark:text-red-400">Week {weekData.week}</div>
                        </td>
                      </tr>
                      
                      {/* Days of the week */}
                      {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => {
                        const dayEntry = weekData.entries.find(entry => entry.day === dayIndex + 1);
                        const currentWeight = dayEntry?.weight || '';
                        
                        const handleWeightChange = (value: string) => {
                          if (value === '') {
                            // Remove entry if empty
                            const updatedEntries = weightEntries.filter(entry => 
                              !(entry.week === weekData.week && entry.day === dayIndex + 1)
                            );
                            setWeightEntries(updatedEntries);
                            localStorage.setItem(`weight_entries_${client.id}`, JSON.stringify(updatedEntries));
                            return;
                          }
                          
                          const weight = parseFloat(value);
                          if (isNaN(weight)) return;
                          
                          const programStartDate = new Date();
                          programStartDate.setDate(programStartDate.getDate() - (client.numberOfWeeks * 7 - 1));
                          const startDate = new Date(programStartDate);
                          startDate.setDate(startDate.getDate() + (weekData.week - 1) * 7 + dayIndex);
                          const dateString = startDate.toISOString().split('T')[0];
                          
                          const newEntry = {
                            date: dateString,
                            weight: weight,
                            week: weekData.week,
                            day: dayIndex + 1
                          };
                          
                          // Remove existing entry for this day
                          const updatedEntries = weightEntries.filter(entry => 
                            !(entry.week === weekData.week && entry.day === dayIndex + 1)
                          );
                          updatedEntries.push(newEntry);
                          
                          // Sort by date
                          updatedEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                          
                          setWeightEntries(updatedEntries);
                          localStorage.setItem(`weight_entries_${client.id}`, JSON.stringify(updatedEntries));
                        };
                        
                        return (
                          <tr key={day} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                            <td className="py-3 px-2 text-sm font-medium text-slate-700 dark:text-slate-300">{day}</td>
                            <td className="py-3 px-2 text-sm text-slate-600 dark:text-slate-400">
                              <div className="flex items-center space-x-1">
                                <input
                                  type="number"
                                  step="0.1"
                                  value={currentWeight}
                                  onChange={(e) => handleWeightChange(e.target.value)}
                                  className="w-20 px-2 py-1 text-center border border-slate-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  placeholder="0.0"
                                />
                                <span className="text-xs text-slate-500">kg</span>
                              </div>
                            </td>
                            <td className="py-3 px-2 text-center">
                              {dayIndex === 0 ? (
                                <div className="flex flex-col items-center space-y-1">
                                  <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                                    {weekData.average ? `${weekData.average}kg` : '-'}
                                  </div>
                                  {weekData.average && (
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                      ({weekData.entries.length} entries)
                                    </div>
                                  )}
                                </div>
                              ) : ''}
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Weight Progression Chart */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6 flex items-center space-x-2">
              <TrendingUp className="w-6 h-6 text-red-500" />
              <span>Weight Progression ({client.numberOfWeeks} weeks)</span>
            </h4>
            
            <div className="h-80 bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
              <div className="h-full flex items-end space-x-1">
                {weeklyAverages.map((weekData, index) => {
                  const weeksWithData = weeklyAverages.filter(w => w.average);
                  
                  // If no data at all, show empty chart
                  if (weeksWithData.length === 0) {
                    return (
                      <div key={weekData.week} className="flex flex-col items-center flex-1 group">
                        <div className="w-full bg-slate-300 dark:bg-slate-500 rounded-t" style={{ height: '5%' }} />
                        <div className="text-xs text-slate-500 mt-2 font-semibold">W{weekData.week}</div>
                      </div>
                    );
                  }
                  
                  const maxWeight = Math.max(...weeksWithData.map(w => parseFloat(w.average)));
                  const minWeight = Math.min(...weeksWithData.map(w => parseFloat(w.average)));
                  const weightRange = maxWeight - minWeight;
                  
                  // Calculate height - ensure minimum height for visibility
                  const height = weekData.average 
                    ? weightRange > 0 
                      ? ((parseFloat(weekData.average) - minWeight) / weightRange) * 70 + 15
                      : 50
                    : 5;
                  
                  const isLatest = weekData.week === client.numberOfWeeks;
                  const hasData = !!weekData.average;
                  
                  return (
                    <div key={weekData.week} className="flex flex-col items-center flex-1 group relative">
                      <div
                        className={`w-full rounded-t transition-all duration-300 hover:opacity-80 ${
                          hasData 
                            ? (isLatest ? 'bg-gradient-to-t from-blue-500 to-blue-400' : 'bg-gradient-to-t from-purple-500 to-purple-400')
                            : 'bg-slate-300 dark:bg-slate-500'
                        }`}
                        style={{ height: `${Math.max(height, 5)}%` }}
                      />
                      <div className="text-xs text-slate-500 mt-2 font-semibold">
                        W{weekData.week}
                      </div>
                      {hasData && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-12 bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 shadow-lg">
                          <div className="font-semibold">{weekData.average}kg</div>
                          <div className="text-xs opacity-75">{weekData.entries.length} entries</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Chart Legend */}
              <div className="mt-4 flex items-center justify-center space-x-4 text-xs text-slate-500">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-gradient-to-t from-purple-500 to-purple-400 rounded"></div>
                  <span>Logged Weeks</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-slate-300 dark:bg-slate-500 rounded"></div>
                  <span>No Data</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Calendar Modal */}
        {showWeekCalendar && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Weekly Weight Logging</h3>
                <button
                  onClick={() => setShowWeekCalendar(false)}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors duration-200"
                >
                  <X className="w-6 h-6 text-slate-500" />
                </button>
              </div>

              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setCurrentWeek(Math.max(1, currentWeek - 1))}
                  disabled={currentWeek === 1}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous Week</span>
                </button>
                <h4 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Week {currentWeek}</h4>
                <button
                  onClick={() => setCurrentWeek(Math.min(client.numberOfWeeks, currentWeek + 1))}
                  disabled={currentWeek === client.numberOfWeeks}
                  className="flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                >
                  <span>Next Week</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Week Days Grid */}
              <div className="grid grid-cols-7 gap-4 mb-6">
                {getWeekDays(currentWeek).map((day, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                      day.isLogged
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-600'
                        : day.isToday
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600'
                        : 'bg-slate-50 dark:bg-slate-700 border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
                    }`}
                    onClick={() => {
                      setSelectedDate(day.date);
                      setShowWeightModal(true);
                      setShowWeekCalendar(false);
                    }}
                  >
                    <div className="text-center">
                      <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                        {day.dayName}
                      </div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                        {day.dayNumber}
                      </div>
                      {day.isLogged ? (
                        <div className="text-lg font-semibold text-green-600 dark:text-green-400">
                          {day.weight}kg
                        </div>
                      ) : (
                        <div className="text-sm text-slate-500 dark:text-slate-400">
                          {day.isToday ? 'Today' : 'Click to log'}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Week Summary */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4">
                <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Week {currentWeek} Summary</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Logged Days</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {getWeekDays(currentWeek).filter(d => d.isLogged).length}/7
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Average Weight</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {(() => {
                        const loggedDays = getWeekDays(currentWeek).filter(d => d.isLogged);
                        const avg = loggedDays.reduce((sum, d) => sum + (d.weight || 0), 0) / loggedDays.length;
                        return loggedDays.length > 0 ? `${avg.toFixed(1)}kg` : 'N/A';
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Week Change</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {(() => {
                        const loggedDays = getWeekDays(currentWeek).filter(d => d.isLogged);
                        if (loggedDays.length < 2) return 'N/A';
                        const first = loggedDays[0].weight;
                        const last = loggedDays[loggedDays.length - 1].weight;
                        const change = last - first;
                        return `${change > 0 ? '+' : ''}${change.toFixed(1)}kg`;
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600 dark:text-slate-400">Progress</div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {Math.round((getWeekDays(currentWeek).filter(d => d.isLogged).length / 7) * 100)}%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderEnduranceTracking = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Endurance Records</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { type: '5K Run', time: '25:30', improvement: '-1:20', trend: 'up' },
          { type: '10K Run', time: '52:15', improvement: '-2:45', trend: 'up' },
          { type: 'Cycling', distance: '30km', time: '1:15:30', improvement: '+5km', trend: 'up' },
          { type: 'Swimming', distance: '1km', time: '18:45', improvement: '-0:30', trend: 'up' }
        ].map((record, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{record.type}</h4>
              <Heart className="w-5 h-5 text-red-500" />
            </div>
            <div className="space-y-2">
              <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {record.time || record.distance}
              </div>
              <div className="flex items-center space-x-1 text-sm text-green-500">
                <ArrowUp className="w-4 h-4" />
                <span>{record.improvement}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderLifestyleTracking = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Lifestyle Metrics</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { label: 'Sleep Quality', value: '8.2/10', icon: Moon, color: 'blue' },
          { label: 'Energy Level', value: '7.8/10', icon: Battery, color: 'green' },
          { label: 'Stress Level', value: '4.2/10', icon: AlertTriangle, color: 'orange' },
          { label: 'Hydration', value: '2.8L', icon: Droplets, color: 'cyan' },
          { label: 'Nutrition Adherence', value: '92%', icon: Target, color: 'purple' },
          { label: 'Workout Intensity', value: '8.5/10', icon: Zap, color: 'yellow' }
        ].map((metric, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{metric.label}</h4>
              <metric.icon className={`w-5 h-5 text-${metric.color}-500`} />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{metric.value}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderPerformanceTracking = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">Workout Performance</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          { workout: 'Push Day', completion: '95%', volume: '2,850kg', intensity: '8.5/10' },
          { workout: 'Pull Day', completion: '100%', volume: '3,200kg', intensity: '8.0/10' },
          { workout: 'Leg Day', completion: '90%', volume: '4,100kg', intensity: '9.0/10' },
          { workout: 'Upper Body', completion: '88%', volume: '2,600kg', intensity: '7.5/10' },
          { workout: 'Lower Body', completion: '92%', volume: '3,800kg', intensity: '8.8/10' },
          { workout: 'Full Body', completion: '85%', volume: '3,500kg', intensity: '8.2/10' }
        ].map((performance, index) => (
          <div key={index} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{performance.workout}</h4>
              <Target className="w-5 h-5 text-orange-500" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Completion:</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{performance.completion}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Volume:</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{performance.volume}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Intensity:</span>
                <span className="text-slate-900 dark:text-slate-100 font-semibold">{performance.intensity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderVolumeTracking = () => {
    return <IndependentMuscleGroupCharts client={client} isDark={isDark} />;
  };

  const renderTabContent = () => {
    switch (activeCategory) {
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
      case 'volume':
        return renderVolumeTracking();
      default:
        return renderOverview();
    }
  };

  return (
            <div className="text-right">
              <div className="text-3xl font-bold">{totalVolume.toLocaleString()} kg</div>
              <div className="text-blue-100 text-sm">Sets × Reps × Weight</div>
            </div>
          </div>
        </div>

        {/* Muscle Group Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {muscleGroups.map((muscleGroup) => {
            const volume = weeklyMuscleVolume[muscleGroup];
            const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
            
            return (
              <div key={muscleGroup} className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{muscleGroup}</h4>
                  <div className="text-2xl font-bold text-blue-600">{volume.toLocaleString()} kg</div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Volume</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">{volume.toLocaleString()} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600 dark:text-slate-400">Percentage</span>
                    <span className="text-slate-900 dark:text-slate-100 font-medium">{percentage.toFixed(1)}%</span>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mt-3">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Creative Volume Comparison Visualizations */}
        {muscleGroups.length > 0 && (
          <div className="space-y-6">
            {/* 1. Horizontal Bar Chart with Icons */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">📊 Volume Distribution</h4>
              <div className="space-y-4">
                {muscleGroups
                  .sort((a, b) => weeklyMuscleVolume[b] - weeklyMuscleVolume[a])
                  .map((muscleGroup, index) => {
                    const volume = weeklyMuscleVolume[muscleGroup];
                    const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
                    const maxVolume = Math.max(...Object.values(weeklyMuscleVolume));
                    const intensity = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
                    
                    // Different colors for different positions
                    const getColor = (index: number) => {
                      const colors = [
                        'from-yellow-400 to-orange-500', // 1st place - Gold
                        'from-gray-300 to-gray-500',     // 2nd place - Silver
                        'from-amber-600 to-amber-800',   // 3rd place - Bronze
                        'from-blue-400 to-blue-600',     // 4th place
                        'from-purple-400 to-purple-600', // 5th place
                        'from-green-400 to-green-600',   // 6th place
                        'from-red-400 to-red-600'        // 7th place
                      ];
                      return colors[index] || 'from-slate-400 to-slate-600';
                    };
                    
                    return (
                      <div key={muscleGroup} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <div className={`w-10 h-10 bg-gradient-to-r ${getColor(index)} rounded-full flex items-center justify-center text-white font-bold shadow-lg`}>
                              {index + 1}
                            </div>
                            <div>
                              <h5 className="font-semibold text-slate-900 dark:text-slate-100">{muscleGroup}</h5>
                              <p className="text-sm text-slate-600 dark:text-slate-400">
                                {volume.toLocaleString()} kg • {percentage.toFixed(1)}% of total
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                              {volume.toLocaleString()}
                            </div>
                            <div className="text-sm text-slate-600 dark:text-slate-400">kg</div>
                          </div>
                        </div>
                        
                        {/* Animated Progress Bar */}
                        <div className="relative">
                          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                            <div 
                              className={`bg-gradient-to-r ${getColor(index)} h-3 rounded-full transition-all duration-1000 ease-out relative`}
                              style={{ width: `${intensity}%` }}
                            >
                              <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                          </div>
                          {/* Percentage indicator */}
                          <div className="absolute top-0 right-0 -mt-6 text-xs font-medium text-slate-600 dark:text-slate-400">
                            {intensity.toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 2. Circular Progress Rings */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">🎯 Volume Balance</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {muscleGroups
                  .sort((a, b) => weeklyMuscleVolume[b] - weeklyMuscleVolume[a])
                  .slice(0, 6) // Show top 6 muscle groups
                  .map((muscleGroup, index) => {
                    const volume = weeklyMuscleVolume[muscleGroup];
                    const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
                    const circumference = 2 * Math.PI * 40; // radius = 40
                    const strokeDasharray = circumference;
                    const strokeDashoffset = circumference - (percentage / 100) * circumference;
                    
                    const colors = [
                      'text-yellow-500', 'text-gray-400', 'text-amber-600',
                      'text-blue-500', 'text-purple-500', 'text-green-500'
                    ];
                    
                    return (
                      <div key={muscleGroup} className="text-center">
                        <div className="relative w-24 h-24 mx-auto mb-2">
                          <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              className="text-slate-200 dark:text-slate-700"
                            />
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              stroke="currentColor"
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={strokeDasharray}
                              strokeDashoffset={strokeDashoffset}
                              className={`${colors[index]} transition-all duration-1000 ease-out`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                              {percentage.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <h5 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                          {muscleGroup}
                        </h5>
                        <p className="text-xs text-slate-600 dark:text-slate-400">
                          {volume.toLocaleString()} kg
                        </p>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 3. Volume Heatmap */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">🔥 Volume Heatmap</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {muscleGroups
                  .sort((a, b) => weeklyMuscleVolume[b] - weeklyMuscleVolume[a])
                  .map((muscleGroup, index) => {
                    const volume = weeklyMuscleVolume[muscleGroup];
                    const maxVolume = Math.max(...Object.values(weeklyMuscleVolume));
                    const intensity = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
                    
                    // Heat intensity based on volume
                    const getHeatIntensity = (intensity: number) => {
                      if (intensity >= 80) return 'from-red-500 to-red-700';
                      if (intensity >= 60) return 'from-orange-500 to-red-500';
                      if (intensity >= 40) return 'from-yellow-500 to-orange-500';
                      if (intensity >= 20) return 'from-green-500 to-yellow-500';
                      return 'from-blue-500 to-green-500';
                    };
                    
                    return (
                      <div 
                        key={muscleGroup}
                        className={`relative p-4 rounded-xl bg-gradient-to-r ${getHeatIntensity(intensity)} text-white overflow-hidden group hover:scale-105 transition-all duration-300`}
                      >
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-semibold text-lg">{muscleGroup}</h5>
                            <div className="text-right">
                              <div className="text-2xl font-bold">{volume.toLocaleString()}</div>
                              <div className="text-sm opacity-90">kg</div>
                            </div>
                          </div>
                          <div className="text-sm opacity-90">
                            {intensity.toFixed(0)}% of max volume
                          </div>
                        </div>
                        
                        {/* Animated background pattern */}
                        <div className="absolute inset-0 opacity-10">
                          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent transform -skew-x-12 animate-pulse"></div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* 4. Volume Comparison Table */}
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
              <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">📈 Detailed Comparison</h4>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-700">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Rank</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Muscle Group</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Volume (kg)</th>
                      <th className="text-right py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Percentage</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {muscleGroups
                      .sort((a, b) => weeklyMuscleVolume[b] - weeklyMuscleVolume[a])
                      .map((muscleGroup, index) => {
                        const volume = weeklyMuscleVolume[muscleGroup];
                        const percentage = totalVolume > 0 ? (volume / totalVolume) * 100 : 0;
                        const maxVolume = Math.max(...Object.values(weeklyMuscleVolume));
                        const relativeIntensity = maxVolume > 0 ? (volume / maxVolume) * 100 : 0;
                        
                        return (
                          <tr key={muscleGroup} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            <td className="py-3 px-4">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                                index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500' :
                                index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
                                'bg-gradient-to-r from-blue-500 to-blue-600'
                              }`}>
                                {index + 1}
                              </div>
                            </td>
                            <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100">{muscleGroup}</td>
                            <td className="py-3 px-4 text-right font-semibold text-slate-900 dark:text-slate-100">
                              {volume.toLocaleString()}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end space-x-2">
                                <div className="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full"
                                    style={{ width: `${percentage}%` }}
                                  ></div>
                                </div>
                                <span className="text-slate-900 dark:text-slate-100 font-medium w-12 text-right">
                                  {percentage.toFixed(1)}%
                                </span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">
                              <div className="flex items-center justify-center">
                                {relativeIntensity >= 80 ? (
                                  <div className="flex items-center space-x-1 text-red-500">
                                    <Flame className="w-4 h-4" />
                                    <span className="text-xs font-medium">High</span>
                                  </div>
                                ) : relativeIntensity >= 50 ? (
                                  <div className="flex items-center space-x-1 text-orange-500">
                                    <TrendingUp className="w-4 h-4" />
                                    <span className="text-xs font-medium">Medium</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-1 text-blue-500">
                                    <Minus className="w-4 h-4" />
                                    <span className="text-xs font-medium">Low</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {muscleGroups.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h4 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No Workout Data</h4>
            <p className="text-slate-600 dark:text-slate-400">Assign a workout plan to see muscle group volume tracking.</p>
          </div>
        )}
      </div>
    );
  };

  const renderTabContent = () => {
    switch (activeCategory) {
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
      case 'volume':
        return renderVolumeTracking();
      default:
        return renderOverview();
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Navigation */}
      <div className="flex space-x-2 overflow-x-auto pb-2">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id as any)}
              className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                activeCategory === category.id
                  ? `bg-${category.color}-600 text-white`
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 mr-2" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default ClientProgressView;
