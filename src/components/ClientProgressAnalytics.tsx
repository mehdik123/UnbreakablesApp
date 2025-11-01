import React, { useState, useEffect, useMemo } from 'react';
import { 
  ArrowLeft, 
  TrendingUp, 
  Calendar, 
  Target, 
  Camera, 
  Scale, 
  Activity,
  BarChart3,
  PieChart,
  LineChart,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  Download,
  Share2,
  Dumbbell,
  Utensils,
  Zap,
  Trophy,
  Flame,
  TrendingDown,
  Users,
  Star
} from 'lucide-react';
import { getClientProgressData, ProgressTrackingData } from '../lib/progressTracking';
import { supabase } from '../lib/supabaseClient';

interface ClientProgressAnalyticsProps {
  client: any;
  onBack: () => void;
}

const ClientProgressAnalytics: React.FC<ClientProgressAnalyticsProps> = ({ client, onBack }) => {
  const [progressData, setProgressData] = useState<ProgressTrackingData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'all'>('month');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'overview' | 'weight' | 'training' | 'performance'>('overview');

  // Calculate subscription weeks
  const subscriptionWeeks = useMemo(() => {
    if (!client?.subscriptionStartDate) return 0;
    const startDate = new Date(client.subscriptionStartDate);
    const currentDate = new Date();
    const weeksDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 7));
    return Math.max(0, weeksDiff);
  }, [client?.subscriptionStartDate]);

  // Load real progress data from Supabase
  useEffect(() => {
    const loadProgressData = async () => {
      try {
        setIsLoading(true);
        const data = await getClientProgressData(client.id);
        setProgressData(data);
      } catch (error) {
        console.error('Error loading progress data:', error);
        // Fallback to empty data
        setProgressData({
          weightLogs: [],
          trainingVolume: [],
          personalRecords: [],
          weeklyPerformance: [],
          exerciseLogs: []
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProgressData();
  }, [client.id]);

  // Calculate comprehensive analytics
  const analytics = useMemo(() => {
    if (!progressData) return null;

    const { weightLogs, trainingVolume, personalRecords, weeklyPerformance, exerciseLogs } = progressData;

    // Weight Analytics
    const sortedWeights = [...weightLogs].sort((a, b) => a.date.getTime() - b.date.getTime());
    const weightChange = sortedWeights.length >= 2 
      ? sortedWeights[sortedWeights.length - 1].weight - sortedWeights[0].weight 
      : 0;
    const averageWeight = sortedWeights.length > 0 
      ? sortedWeights.reduce((sum, entry) => sum + entry.weight, 0) / sortedWeights.length 
      : 0;

    // Training Volume Analytics
    const totalVolume = trainingVolume.reduce((sum, entry) => sum + entry.totalVolume, 0);
    const muscleGroups = [...new Set(trainingVolume.map(entry => entry.muscleGroup))];
    const mostTrainedMuscle = muscleGroups.length > 0 
      ? muscleGroups.reduce((max, group) => {
          const groupVolume = trainingVolume
            .filter(entry => entry.muscleGroup === group)
            .reduce((sum, entry) => sum + entry.totalVolume, 0);
          const maxVolume = trainingVolume
            .filter(entry => entry.muscleGroup === max)
            .reduce((sum, entry) => sum + entry.totalVolume, 0);
          return groupVolume > maxVolume ? group : max;
        })
      : 'None';

    // Performance Analytics
    const totalPRs = personalRecords.length;
    const recentPRs = personalRecords.filter(pr => {
      const prDate = new Date(pr.dateAchieved);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return prDate >= thirtyDaysAgo;
    }).length;

    // Consistency Analytics
    const completedWeeks = weeklyPerformance.filter(week => week.isCompleted).length;
    const totalWeeks = weeklyPerformance.length;
    const consistencyRate = totalWeeks > 0 ? (completedWeeks / totalWeeks) * 100 : 0;

    return {
      weight: {
        change: weightChange,
        average: averageWeight,
        totalEntries: weightLogs.length,
        trend: weightChange > 0 ? 'up' : weightChange < 0 ? 'down' : 'stable'
      },
      training: {
        totalVolume,
        muscleGroups: muscleGroups.length,
        mostTrainedMuscle,
        totalSets: trainingVolume.reduce((sum, entry) => sum + entry.totalSets, 0),
        totalReps: trainingVolume.reduce((sum, entry) => sum + entry.totalReps, 0)
      },
      performance: {
        totalPRs,
        recentPRs,
        consistencyRate,
        completedWeeks,
        totalWeeks
      }
    };
  }, [progressData]);

  const renderOverviewCards = () => {
    if (!analytics) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Weight Progress */}
        <div className="bg-gradient-to-br from-green-500/20 to-emerald-600/20 backdrop-blur-xl rounded-2xl p-6 border border-green-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Scale className="w-6 h-6 text-green-400" />
            <span className="text-green-400 font-semibold">Weight Progress</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.weight.change > 0 ? '+' : ''}{analytics.weight.change.toFixed(1)}kg
          </div>
          <div className="text-sm text-green-300">
            {analytics.weight.totalEntries} entries logged
          </div>
          <div className="flex items-center gap-1 mt-2">
            {analytics.weight.trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-400" />
            ) : analytics.weight.trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-400" />
            ) : (
              <Activity className="w-4 h-4 text-blue-400" />
            )}
            <span className="text-xs text-slate-400 capitalize">{analytics.weight.trend}</span>
          </div>
        </div>

        {/* Training Volume */}
        <div className="bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-xl rounded-2xl p-6 border border-blue-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Dumbbell className="w-6 h-6 text-blue-400" />
            <span className="text-blue-400 font-semibold">Training Volume</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.training.totalVolume.toLocaleString()}kg
          </div>
          <div className="text-sm text-blue-300">
            {analytics.training.totalSets} sets • {analytics.training.totalReps} reps
          </div>
          <div className="text-xs text-slate-400 mt-1">
            Top: {analytics.training.mostTrainedMuscle}
          </div>
        </div>

        {/* Personal Records */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-600/20 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-purple-400" />
            <span className="text-purple-400 font-semibold">Personal Records</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.performance.totalPRs}
          </div>
          <div className="text-sm text-purple-300">
            {analytics.performance.recentPRs} in last 30 days
          </div>
          <div className="flex items-center gap-1 mt-2">
            <Star className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-slate-400">Achievements</span>
          </div>
        </div>

        {/* Consistency */}
        <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 backdrop-blur-xl rounded-2xl p-6 border border-orange-500/30">
          <div className="flex items-center gap-3 mb-2">
            <Target className="w-6 h-6 text-orange-400" />
            <span className="text-orange-400 font-semibold">Consistency</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {analytics.performance.consistencyRate.toFixed(0)}%
          </div>
          <div className="text-sm text-orange-300">
            {analytics.performance.completedWeeks}/{analytics.performance.totalWeeks} weeks
          </div>
          <div className="flex items-center gap-1 mt-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-slate-400">Completion rate</span>
          </div>
        </div>
      </div>
    );
  };

  const renderWeightAnalytics = () => {
    if (!progressData?.weightLogs.length) {
      return (
        <div className="text-center py-12">
          <Scale className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Weight Data</h3>
          <p className="text-slate-500 mb-4">Start logging your weight in the Weight section to see analytics</p>
          <button
            onClick={() => {/* Navigate to weight section */}}
            className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all"
          >
            Go to Weight Logging
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/40">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <LineChart className="w-5 h-5 text-green-400" />
            Weight Trend Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.weight.average.toFixed(1)}kg</div>
              <div className="text-sm text-slate-400">Average Weight</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.weight.totalEntries}</div>
              <div className="text-sm text-slate-400">Total Entries</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">
                {analytics?.weight.change > 0 ? '+' : ''}{analytics?.weight.change.toFixed(1)}kg
              </div>
              <div className="text-sm text-slate-400">Total Change</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white capitalize">{analytics?.weight.trend}</div>
              <div className="text-sm text-slate-400">Trend</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderTrainingAnalytics = () => {
    if (!progressData?.trainingVolume.length) {
      return (
        <div className="text-center py-12">
          <Dumbbell className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-400 mb-2">No Training Data</h3>
          <p className="text-slate-500 mb-4">Complete workouts to see training analytics</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/40">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-400" />
            Training Volume Analysis
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.training.totalVolume.toLocaleString()}kg</div>
              <div className="text-sm text-slate-400">Total Volume</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.training.totalSets}</div>
              <div className="text-sm text-slate-400">Total Sets</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.training.totalReps.toLocaleString()}</div>
              <div className="text-sm text-slate-400">Total Reps</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.training.muscleGroups}</div>
              <div className="text-sm text-slate-400">Muscle Groups</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPerformanceAnalytics = () => {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-slate-800/60 via-slate-700/50 to-slate-800/60 backdrop-blur-xl rounded-2xl p-6 border border-slate-600/40">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-purple-400" />
            Performance Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.performance.totalPRs}</div>
              <div className="text-sm text-slate-400">Total PRs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.performance.recentPRs}</div>
              <div className="text-sm text-slate-400">Recent PRs</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.performance.consistencyRate.toFixed(0)}%</div>
              <div className="text-sm text-slate-400">Consistency</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{analytics?.performance.completedWeeks}</div>
              <div className="text-sm text-slate-400">Completed Weeks</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="p-2 rounded-xl bg-slate-700/50 hover:bg-slate-600/50 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold">Progress Analytics</h1>
                <p className="text-slate-400 text-sm">Week {subscriptionWeeks} of your journey</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors">
                <Download className="w-4 h-4" />
              </button>
              <button className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-colors">
                <Share2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-slate-400">Loading your analytics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Metric Selector */}
            <div className="mb-6">
              <div className="flex gap-2 bg-slate-800/50 rounded-xl p-1 w-fit">
                {([
                  { id: 'overview', label: 'Overview', icon: BarChart3 },
                  { id: 'weight', label: 'Weight', icon: Scale },
                  { id: 'training', label: 'Training', icon: Dumbbell },
                  { id: 'performance', label: 'Performance', icon: Trophy }
                ] as const).map((metric) => (
                  <button
                    key={metric.id}
                    onClick={() => setSelectedMetric(metric.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedMetric === metric.id
                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg'
                        : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                    }`}
                  >
                    <metric.icon className="w-4 h-4" />
                    <span>{metric.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Content */}
            {selectedMetric === 'overview' && renderOverviewCards()}
            {selectedMetric === 'weight' && renderWeightAnalytics()}
            {selectedMetric === 'training' && renderTrainingAnalytics()}
            {selectedMetric === 'performance' && renderPerformanceAnalytics()}
          </>
        )}
      </div>
    </div>
  );
};

export default ClientProgressAnalytics;