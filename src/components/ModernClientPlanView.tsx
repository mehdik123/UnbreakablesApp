import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Target, 
  Utensils, 
  Dumbbell, 
  Calendar, 
  User, 
  Settings,
  Save,
  Download,
  Share2,
  Plus,
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  Flame,
  TrendingUp,
  Shield,
  Activity,
  BarChart3,
  Heart,
  Zap,
  Award,
  Crown,
  Star,
  ArrowRight,
  ChevronDown,
  Filter,
  Search,
  Grid3X3,
  List,
  Eye,
  Copy,
  MoreVertical,
  Camera,
  Pill,
  HeartPulse
} from 'lucide-react';
import { Client, Food, Meal, NutritionPlan, WorkoutPlan, Workout, Exercise } from '../types';
import { UltraModernNutritionEditor } from './UltraModernNutritionEditor';
import UltraModernWorkoutEditor from './UltraModernWorkoutEditor';
import { IndependentMuscleGroupCharts } from './IndependentMuscleGroupCharts';
import { UltraModernWeeklyWeightLogger } from './UltraModernWeeklyWeightLogger';
import WeeklyPhotoGallery from './WeeklyPhotoGallery';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { SupplementsManager } from './SupplementsManager';
import { CardioEditor } from './CardioEditor';
import { supabase, isSupabaseReady } from '../lib/supabaseClient';
import { dbGetClientPhotos } from '../lib/db';

interface ModernClientPlanViewProps {
  client: Client;
  foods: Food[];
  meals: Meal[];
  onBack: () => void;
  onSaveNutritionPlan: (clientId: string, plan: NutritionPlan) => void;
  onSaveWorkoutPlan: (clientId: string, plan: WorkoutPlan) => void;
  onAssignWorkout: (clientId: string, workout: Workout) => void;
  isDark: boolean;
}

export const ModernClientPlanView: React.FC<ModernClientPlanViewProps> = ({
  client,
  foods,
  meals,
  onBack,
  onSaveNutritionPlan,
  onSaveWorkoutPlan,
  onAssignWorkout,
  isDark
}) => {
  const [activeTab, setActiveTab] = useState<'nutrition' | 'workout' | 'cardio' | 'progress' | 'weight' | 'photos' | 'performance'>('nutrition');
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showProgressTracker, setShowProgressTracker] = useState(false);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [weeklyPhotos, setWeeklyPhotos] = useState<any[]>([]);
  const [showSupplementsManager, setShowSupplementsManager] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  // Load weekly photos for the client
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        if (isSupabaseReady && supabase) {
          // First resolve the database client UUID from client name
          const { data: cRow } = await supabase
            .from('clients')
            .select('id')
            .eq('full_name', client.name)
            .maybeSingle();
          
          if (cRow?.id) {
            const { data: dbPhotos, error } = await dbGetClientPhotos(cRow.id);
            if (error) {
              console.error('Error loading photos:', error);
              return;
            }
            
            if (dbPhotos) {
              // Convert database format to component format
              const convertedPhotos = dbPhotos.map(photo => ({
                id: photo.id,
                week: photo.week,
                type: photo.type,
                imageUrl: photo.image_url,
                uploadedAt: new Date(photo.uploaded_at)
              }));
              
              setWeeklyPhotos(convertedPhotos);
            }
          }
        }
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    };

    loadPhotos();
  }, [client.name]);

  // Generate unique client share link
  const handleShareClient = () => {
    // Create a unique share ID that remains consistent for this client
    const clientShareId = `${client.name.toLowerCase().replace(/\s+/g, '-')}-${client.id}`;
    const shareUrl = `${window.location.origin}/?client=${clientShareId}`;
    
    setShareUrl(shareUrl);
    setShowShareModal(true);
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl).then(() => {

    }).catch(() => {

    });
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'shredding': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400';
      case 'bulking': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400';
      case 'maintenance': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-950/20 dark:text-slate-400';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'shredding': return <Flame className="w-4 h-4" />;
      case 'bulking': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="coach-plan flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-2 border-[color:var(--hair)] border-t-[color:var(--red)] rounded-full animate-spin"></div>
          </div>
          <h2 className="text-xl font-semibold font-display text-[color:var(--txt-hi)] mt-4">Loading plan...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-plan">
      {/* Header */}
      <div className="coach-plan-header">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="coach-plan-headrow">
            <div className="flex items-center gap-1 sm:gap-3 min-w-0 flex-1">
              <button
                onClick={onBack}
                className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
                title="Back to clients"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                <div className="hidden sm:flex w-10 h-10 rounded-lg items-center justify-center shadow-lg shrink-0" style={{ background: 'var(--grad-red)' }}>
                  <User className="w-5 h-5 text-white" />
                </div>

                <div className="flex-1 min-w-0">
                  <h1 className="text-base sm:text-xl lg:text-2xl font-bold font-display text-[color:var(--txt-hi)] truncate">
                    {client.name}'s Plan
                  </h1>
                  <div className="coach-plan-meta">
                    <div className={`inline-flex items-center gap-1 px-2 py-0.5 sm:px-3 sm:py-1 rounded-lg text-[11px] sm:text-sm font-medium ${getGoalColor(client.goal)}`}>
                      {getGoalIcon(client.goal)}
                      <span className="capitalize">{client.goal}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[color:var(--txt-lo)] text-[11px] sm:text-sm">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{client.numberOfWeeks} weeks</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="coach-plan-actions">
              <button
                onClick={() => setShowSupplementsManager(true)}
                className="coach-touch rounded-lg transition-colors duration-200"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--violet)' }}
                title="Manage Supplements & Hydration"
              >
                <Pill className="w-5 h-5" />
              </button>
              <button
                onClick={() => setShowStats(!showStats)}
                className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
                title="Toggle stats"
              >
                <BarChart3 className="w-5 h-5" />
              </button>
              <button 
                onClick={handleShareClient}
                className="coach-touch rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
                title="Share client link"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                className="coach-touch hidden sm:inline-flex rounded-lg text-[color:var(--txt-lo)] hover:text-[color:var(--txt-hi)] hover:bg-[var(--surface-2)] transition-colors duration-200"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">

        {/* Modern Horizontal Coach Navbar */}
        <div className="coach-plan-tabs">
          <div className="coach-plan-tabrow">
            {[
              { id: 'nutrition', label: 'Nutrition', icon: Utensils, accent: 'var(--green)' },
              { id: 'workout', label: 'Workout', icon: Dumbbell, accent: 'var(--red)' },
              { id: 'cardio', label: 'Cardio & Abs', icon: HeartPulse, accent: 'var(--orange)' },
              { id: 'progress', label: 'Progress', icon: Award, accent: 'var(--blue)' },
              { id: 'performance', label: 'Analytics', icon: BarChart3, accent: 'var(--violet)' },
              { id: 'weight', label: 'Weight', icon: Activity, accent: 'var(--coral)' },
              { id: 'photos', label: 'Photos', icon: Camera, accent: 'var(--blue)' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setShowProgressTracker(false);
                }}
                className={`coach-plan-tab${activeTab === tab.id ? ' is-active' : ''}`}
                style={{ ['--tab-accent' as string]: tab.accent } as React.CSSProperties}
              >
                <tab.icon className="coach-plan-tab-ic" />
                <span className="coach-plan-tab-label">{tab.label}</span>
                {activeTab === tab.id && <span className="coach-plan-tab-underline" />}
              </button>
            ))}
          </div>
        </div>


        {/* Content Area */}
        {activeTab === 'nutrition' ? (
          <UltraModernNutritionEditor
            client={client}
            foods={foods}
            meals={meals}
            onSavePlan={(plan) => onSaveNutritionPlan(client.id, plan)}
            onAssignPlan={(plan) => onSaveNutritionPlan(client.id, plan)}
            onBack={() => {}}
            isDark={isDark}
          />
        ) : activeTab === 'workout' ? (
          <div className="bg-[var(--surface-1)] rounded-xl shadow-soft border border-[color:var(--hair)] p-4 sm:p-6 lg:p-8">
            <UltraModernWorkoutEditor
              client={client}
              onSaveAssignment={(assignment) => onSaveWorkoutPlan(client.id, assignment)}
              onBack={() => {}}
              isDark={isDark}
            />
          </div>
        ) : activeTab === 'cardio' ? (
          <div className="bg-[var(--surface-1)] rounded-xl shadow-soft border border-[color:var(--hair)] p-4 sm:p-6 lg:p-8">
            <CardioEditor client={client} isDark={isDark} />
          </div>
        ) : activeTab === 'progress' ? (
          <div className="bg-[var(--surface-1)] rounded-xl shadow-soft border border-[color:var(--hair)] p-4 sm:p-6 lg:p-8">
            <IndependentMuscleGroupCharts client={client} isDark={isDark} />
          </div>
        ) : activeTab === 'performance' ? (
          <PerformanceAnalytics
            clientId={client.id}
            clientName={client.name}
            isDark={isDark}
            workoutAssignment={client.workoutAssignment}
          />
        ) : activeTab === 'weight' ? (
          <div className="bg-[var(--surface-1)] rounded-xl shadow-soft border border-[color:var(--hair)] p-4 sm:p-6 lg:p-8">
            <UltraModernWeeklyWeightLogger
              client={client}
              currentWeek={client.workoutAssignment?.currentWeek || 1}
              maxWeeks={client.numberOfWeeks}
              isDark={isDark}
            />
          </div>
        ) : activeTab === 'photos' ? (
          <div className="bg-[var(--surface-1)] rounded-xl shadow-soft border border-[color:var(--hair)] p-4 sm:p-6 lg:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold font-display text-[color:var(--txt-hi)] mb-2 flex items-center">
                <Camera className="w-6 h-6 mr-3 text-[color:var(--red)]" />
                Client Progress Photos
              </h2>
              <p className="text-[color:var(--txt-lo)]">
                View {client.name}'s weekly progress photos
              </p>
            </div>
            <WeeklyPhotoGallery
              photos={weeklyPhotos}
              onPhotosUpdate={setWeeklyPhotos}
              isCoachView={true}
            />
          </div>
        ) : null}

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="rounded-2xl p-6 max-w-md w-full" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
              <h3 className="text-lg font-semibold font-display text-[color:var(--txt-hi)] mb-4">
                Share Client Link
              </h3>
              <p className="text-[color:var(--txt-lo)] mb-4">
                Share this link with {client.name} to give them access to their personalized plan:
              </p>
              <div className="rounded-lg p-3 mb-4" style={{ background: 'var(--surface-2)' }}>
                <code className="text-sm text-[color:var(--txt-mid)] break-all">
                  {shareUrl}
                </code>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setShowShareModal(false);
                  }}
                  className="flex-1 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                  style={{ background: 'var(--grad-red)' }}
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="flex-1 text-[color:var(--txt-mid)] px-4 py-2 rounded-lg transition-colors duration-200"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Supplements Manager Modal */}
        {showSupplementsManager && (
          <SupplementsManager
            client={client}
            onClose={() => setShowSupplementsManager(false)}
          />
        )}
      </div>
    </div>
  );
};
