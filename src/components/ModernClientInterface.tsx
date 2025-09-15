import React, { useState, useEffect } from 'react';
import {
  User,
  Calendar,
  Target,
  Utensils,
  Dumbbell,
  Award,
  CheckCircle,
  Clock,
  Heart,
  Zap,
  Star,
  TrendingUp,
  Play,
  ChevronRight,
  Fire,
  Activity,
  Timer,
  BarChart3,
  Trophy,
  Flame,
  Crown,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { Client, NutritionPlan } from '../types';
import { ClientNutritionView } from './ClientNutritionView';
import { ClientWorkoutView } from './ClientWorkoutView';
import { ClientProgressView } from './ClientProgressView';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { WeekProgressionManager } from '../utils/weekProgressionManager';

interface ModernClientInterfaceProps {
  client: Client;
  isDark: boolean;
}

export const ModernClientInterface: React.FC<ModernClientInterfaceProps> = ({
  client,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'progress'>('workout');
  const [currentWeek, setCurrentWeek] = useState(() => {
    if (client.workoutAssignment?.weeks) {
      return WeekProgressionManager.getCurrentWeek(client.workoutAssignment.weeks);
    }
    return 1;
  });
  const [unlockedWeeks, setUnlockedWeeks] = useState<number[]>(() => {
    if (client.workoutAssignment?.weeks) {
      return client.workoutAssignment.weeks
        .filter(week => week.isUnlocked)
        .map(week => week.weekNumber);
    }
    return [1];
  });
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [showMotivationQuote, setShowMotivationQuote] = useState(true);

  // Motivational quotes
  const motivationQuotes = [
    { text: "Your only limit is you", emoji: "🔥" },
    { text: "Push yourself, because no one else will", emoji: "💪" },
    { text: "Great things never come from comfort zones", emoji: "⚡" },
    { text: "Don't stop when you're tired, stop when you're done", emoji: "🎯" },
    { text: "The pain you feel today will be the strength you feel tomorrow", emoji: "🏆" }
  ];

  const todayQuote = motivationQuotes[new Date().getDay() % motivationQuotes.length];

  // Load nutrition plan
  useEffect(() => {
    const loadNutritionPlan = async () => {
      try {
        if (isSupabaseReady && supabase) {
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          
          if (cRow?.id) {
            const { data: nutritionPlan } = await supabase
              .from('nutrition_plans')
              .select('plan_json, updated_at')
              .eq('client_id', cRow.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (nutritionPlan?.plan_json) {
              setNutritionPlan(nutritionPlan.plan_json);
              return;
            }
          }
        }
        
        if (client.nutritionPlan) {
          setNutritionPlan(client.nutritionPlan);
        }
      } catch (error) {
        console.error('❌ Failed to load nutrition plan:', error);
      }
    };

    loadNutritionPlan();
  }, [client.id, client.nutritionPlan]);

  // Update weeks with real-time sync
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        if (isSupabaseReady && supabase && client.id) {
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          
          if (cRow?.id) {
            const { data: assignment } = await supabase
              .from('workout_assignments')
              .select('*')
              .eq('client_id', cRow.id)
              .eq('is_active', true)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (assignment?.program_json) {
              const freshWeeks = assignment.program_json.weeks || [];
              if (freshWeeks.length > 0) {
                const unlocked = freshWeeks
                  .filter((week: any) => week.isUnlocked)
                  .map((week: any) => week.weekNumber);
                setUnlockedWeeks(unlocked.length > 0 ? unlocked : [1]);
                
                const newCurrentWeek = WeekProgressionManager.getCurrentWeek(freshWeeks);
                setCurrentWeek(newCurrentWeek);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error refreshing workout assignment:', error);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [client.id, client.name]);

  const getWeekStatus = (weekNumber: number): 'locked' | 'active' | 'completed' => {
    if (!client.workoutAssignment?.weeks) return 'locked';
    
    const week = client.workoutAssignment.weeks.find(w => w.weekNumber === weekNumber);
    if (!week) return 'locked';
    
    return WeekProgressionManager.getWeekStatus(week);
  };

  const completedWeeks = client.workoutAssignment?.weeks?.filter(w => w.isCompleted).length || 0;
  const progressPercentage = Math.round((completedWeeks / (client.numberOfWeeks || 12)) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 bg-gradient-to-r from-slate-900/80 to-purple-900/80 backdrop-blur-xl border-b border-purple-500/20">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent">
                    Welcome back, {client.name.split(' ')[0]}!
                  </h1>
                  <p className="text-purple-300/80 text-lg">Ready to crush your goals? 🔥</p>
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="hidden md:flex items-center space-x-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">{currentWeek}</div>
                <div className="text-purple-300 text-sm">Current Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{completedWeeks}</div>
                <div className="text-purple-300 text-sm">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{progressPercentage}%</div>
                <div className="text-purple-300 text-sm">Progress</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Motivation Quote */}
      {showMotivationQuote && (
        <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
          <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/5 to-pink-500/5"></div>
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-4xl">{todayQuote.emoji}</div>
                <div>
                  <p className="text-xl font-semibold text-white mb-1">{todayQuote.text}</p>
                  <p className="text-purple-300/80">Daily Motivation</p>
                </div>
              </div>
              <button
                onClick={() => setShowMotivationQuote(false)}
                className="p-2 rounded-lg hover:bg-slate-800/50 text-slate-400 hover:text-white transition-all duration-200"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Ring */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <div className="bg-gradient-to-br from-slate-900/80 to-purple-900/80 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-white mb-2">Your Journey</h2>
              <p className="text-purple-300/80">Week {currentWeek} of {client.numberOfWeeks}</p>
            </div>
            
            {/* Circular Progress */}
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  className="text-slate-700"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={`${progressPercentage * 3.14} 314`}
                  className="text-gradient-to-r from-purple-500 to-pink-500 transition-all duration-1000"
                  style={{
                    stroke: `url(#gradient-${progressPercentage})`
                  }}
                />
                <defs>
                  <linearGradient id={`gradient-${progressPercentage}`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#ec4899" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{progressPercentage}%</div>
                  <div className="text-purple-300 text-xs">Complete</div>
                </div>
              </div>
            </div>
          </div>

          {/* Week Progress Bar */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Weekly Progress</span>
              <span className="text-purple-300 text-sm">{completedWeeks}/{client.numberOfWeeks} weeks</span>
            </div>
            <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-1000 relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-6">
        <div className="bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 p-2">
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'workout', label: 'Workouts', icon: Dumbbell, gradient: 'from-red-500 to-orange-500' },
              { id: 'nutrition', label: 'Nutrition', icon: Utensils, gradient: 'from-green-500 to-emerald-500' },
              { id: 'progress', label: 'Progress', icon: TrendingUp, gradient: 'from-blue-500 to-purple-500' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`relative overflow-hidden rounded-xl p-6 transition-all duration-300 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r ' + tab.gradient + ' shadow-2xl transform scale-105'
                    : 'bg-slate-800/50 hover:bg-slate-700/50 border border-slate-600/50'
                }`}
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`p-3 rounded-xl ${
                    activeTab === tab.id 
                      ? 'bg-white/20' 
                      : 'bg-slate-700/50'
                  }`}>
                    <tab.icon className={`w-6 h-6 ${
                      activeTab === tab.id ? 'text-white' : 'text-slate-400'
                    }`} />
                  </div>
                  <span className={`font-medium ${
                    activeTab === tab.id ? 'text-white' : 'text-slate-300'
                  }`}>
                    {tab.label}
                  </span>
                </div>
                
                {/* Active indicator */}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-white/50 to-white/20"></div>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 pb-12">
        {activeTab === 'nutrition' ? (
          <ClientNutritionView
            client={client}
            isDark={isDark}
            nutritionPlan={nutritionPlan}
          />
        ) : activeTab === 'workout' ? (
          <ClientWorkoutView
            client={client}
            currentWeek={currentWeek}
            unlockedWeeks={unlockedWeeks}
            isDark={isDark}
          />
        ) : (
          <ClientProgressView
            client={client}
            isDark={isDark}
          />
        )}
      </div>
    </div>
  );
};

export default ModernClientInterface;
