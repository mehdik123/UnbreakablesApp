import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Target,
  TrendingUp,
  Dumbbell,
  Utensils,
  Eye,
  Share2,
  CheckCircle,
  X,
  Copy,
  Activity,
  Clock,
  Flame,
  Shield,
  ArrowUpRight,
  Grid3X3,
  List,
  Star,
  Crown,
  User,
  Archive,
  Key,
  LogOut,
  Database,
  Zap,
  CheckSquare,
  Square,
  Loader2,
  Layers,
  AlertTriangle,
  ArrowRight
} from 'lucide-react';
import { Client, ClientWorkoutAssignment } from '../types';
import { ClientCredentialsManager } from './ClientCredentialsManager';
import { authService } from '../lib/authService';
import {
  planBulkProgression,
  BulkPlanEntry,
  ProgressionMode,
} from '../utils/bulkProgression';
import { dbListWorkoutPrograms } from '../lib/db';
import { getMealSlotNames } from '../utils/nutritionMealSlots';

export type NewClientSetupOptions = {
  mealsPerDay: number;
  workoutProgramId?: string;
};

// Animated Counter Component
const AnimatedCounter: React.FC<{ value: number; duration?: number }> = ({ value, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  const countRef = useRef(0);

  useEffect(() => {
    const startTime = Date.now();

    const updateCount = () => {
      const now = Date.now();
      const progress = Math.min((now - startTime) / duration, 1);
      const easeOutQuart = 1 - Math.pow(1 - progress, 4);
      const currentCount = Math.floor(easeOutQuart * value);
      
      setCount(currentCount);
      countRef.current = currentCount;

      if (progress < 1) {
        requestAnimationFrame(updateCount);
      }
    };

    requestAnimationFrame(updateCount);
  }, [value, duration]);

  return <span>{count}</span>;
};

// Floating Particles Component
const FloatingParticles: React.FC = () => {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-red-500/20 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${3 + Math.random() * 4}s`
          }}
        />
      ))}
    </div>
  );
};


interface UnbreakableSteamClientsManagerProps {
  isDark: boolean;
  clients: Client[];
  onAddClient: (client: Client, setup?: NewClientSetupOptions) => void | Promise<void>;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  onDeleteClient: (clientId: string) => void;
  onArchiveClient: (clientId: string) => void;
  onAssignNutritionPlan: (clientId: string, plan: any) => void;
  onAssignWorkoutPlan: (clientId: string, assignment: ClientWorkoutAssignment) => void;
  onShareWithClient: (client: Client) => void;
  onNavigateToClientPlan: (client: Client) => void;
  onDuplicateClient: (client: Client, options: { name: string; numberOfWeeks: number }) => void | Promise<void>;
  onNavigateToMealDatabase: () => void;
  onNavigateToExerciseDatabase: () => void;
  onNavigateToIngredients: () => void;
  onNavigateToTemplates: () => void;
}

export const UnbreakableSteamClientsManager: React.FC<UnbreakableSteamClientsManagerProps> = ({
  clients,
  onAddClient,
  onDeleteClient,
  onArchiveClient,
  onShareWithClient,
  onNavigateToClientPlan,
  onDuplicateClient,
  onAssignWorkoutPlan,
  onNavigateToMealDatabase,
  onNavigateToExerciseDatabase,
  onNavigateToIngredients,
  onNavigateToTemplates
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'maintenance' as 'shredding' | 'bulking' | 'maintenance',
    numberOfWeeks: 12,
    startDate: new Date(),
    isActive: true,
    startingWeight: '' as string,
  });
  const [mealsPerDay, setMealsPerDay] = useState(3);
  const [workoutProgramId, setWorkoutProgramId] = useState('');
  const [workoutTemplates, setWorkoutTemplates] = useState<{ id: string; name: string }[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const [credentialsManagerClient, setCredentialsManagerClient] = useState<Client | null>(null);
  const [duplicateSourceClient, setDuplicateSourceClient] = useState<Client | null>(null);
  const [duplicateForm, setDuplicateForm] = useState({ name: '', numberOfWeeks: 12 });
  const [isDuplicating, setIsDuplicating] = useState(false);

  // ---- Bulk progressive overload ----
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState<ProgressionMode>('progress');
  const [bulkApplying, setBulkApplying] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number }>({ done: 0, total: 0 });
  const [bulkDone, setBulkDone] = useState<{ applied: number; skipped: number; failed: number } | null>(null);

  // Logout handler
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      authService.logout();
      window.location.reload();
    }
  };

  // Handle dropdown positioning
  const handleDropdownClick = (e: React.MouseEvent, clientId: string) => {
    const button = e.currentTarget as HTMLElement;
    const rect = button.getBoundingClientRect();
    
    if (openDropdownId === clientId) {
      setOpenDropdownId(null);
      setDropdownPosition(null);
    } else {
      setOpenDropdownId(clientId);
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 224 // 224px = w-56 (14rem * 16px)
      });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!showAddModal) return;
    let cancelled = false;
    const loadTemplates = async () => {
      setLoadingTemplates(true);
      try {
        const { data } = await dbListWorkoutPrograms();
        if (cancelled) return;
        setWorkoutTemplates(
          (data || []).map((p: any) => ({
            id: p.id,
            name: p.name || p.program_json?.name || 'Untitled template',
          }))
        );
      } catch {
        if (!cancelled) setWorkoutTemplates([]);
      } finally {
        if (!cancelled) setLoadingTemplates(false);
      }
    };
    loadTemplates();
    return () => {
      cancelled = true;
    };
  }, [showAddModal]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (openDropdownId) {
        const target = e.target as HTMLElement;
        // Don't close if clicking inside dropdown or on the button
        if (!target.closest('.dropdown-menu') && !target.closest('button[title="More options"]')) {
          setOpenDropdownId(null);
          setDropdownPosition(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openDropdownId]);

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'shredding': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
      case 'bulking': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
      case 'maintenance': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
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

  // Filter clients based on search term
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const openDuplicateModal = (client: Client) => {
    setDuplicateSourceClient(client);
    setDuplicateForm({
      name: `${client.name} (Copy)`,
      numberOfWeeks: client.numberOfWeeks || client.workoutAssignment?.duration || 12,
    });
  };

  const handleDuplicateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateSourceClient || !duplicateForm.name.trim()) return;
    setIsDuplicating(true);
    try {
      await onDuplicateClient(duplicateSourceClient, {
        name: duplicateForm.name.trim(),
        numberOfWeeks: duplicateForm.numberOfWeeks,
      });
      setDuplicateSourceClient(null);
    } finally {
      setIsDuplicating(false);
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingClient) return;
    const parsedStart =
      newClient.startingWeight.trim() === ''
        ? undefined
        : Number.parseFloat(newClient.startingWeight.replace(',', '.'));
    const startingWeight =
      typeof parsedStart === 'number' && Number.isFinite(parsedStart) && parsedStart > 0
        ? Math.round(parsedStart * 10) / 10
        : undefined;
    const { startingWeight: _sw, ...rest } = newClient;
    const client: Client = {
      id: Date.now().toString(),
      ...rest,
      startingWeight,
      weightLog: [],
      favorites: [],
      nutritionPlan: undefined,
      workoutAssignment: undefined
    };
    const setup: NewClientSetupOptions = {
      mealsPerDay,
      workoutProgramId: workoutProgramId || undefined,
    };
    setIsAddingClient(true);
    try {
      await onAddClient(client, setup);
      setShowAddModal(false);
      setNewClient({
        name: '',
        email: '',
        phone: '',
        goal: 'maintenance',
        numberOfWeeks: 12,
        startDate: new Date(),
        isActive: true,
        startingWeight: '',
      });
      setMealsPerDay(3);
      setWorkoutProgramId('');
    } finally {
      setIsAddingClient(false);
    }
  };

  // ---- Bulk selection helpers ----
  const toggleSelectionMode = () => {
    setSelectionMode((prev) => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  };

  const toggleClientSelected = (clientId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) next.delete(clientId);
      else next.add(clientId);
      return next;
    });
  };

  const allFilteredSelected =
    filteredClients.length > 0 && filteredClients.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      if (allFilteredSelected) {
        const next = new Set(prev);
        filteredClients.forEach((c) => next.delete(c.id));
        return next;
      }
      const next = new Set(prev);
      filteredClients.forEach((c) => next.add(c.id));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const selectedClients = clients.filter((c) => selectedIds.has(c.id));

  const openBulkModal = () => {
    if (selectedClients.length === 0) return;
    setBulkMode('progress');
    setBulkDone(null);
    setBulkProgress({ done: 0, total: 0 });
    setBulkModalOpen(true);
  };

  const closeBulkModal = () => {
    if (bulkApplying) return;
    setBulkModalOpen(false);
    setBulkDone(null);
  };

  const bulkPlan: BulkPlanEntry[] = React.useMemo(
    () => (bulkModalOpen ? planBulkProgression(selectedClients, bulkMode) : []),
    [bulkModalOpen, selectedClients, bulkMode]
  );

  const readyPlan = bulkPlan.filter((p) => p.status === 'ready');
  const skippedPlan = bulkPlan.filter((p) => p.status === 'skipped');

  const handleApplyBulk = async () => {
    if (readyPlan.length === 0 || bulkApplying) return;
    setBulkApplying(true);
    setBulkProgress({ done: 0, total: readyPlan.length });
    let applied = 0;
    let failed = 0;
    for (const entry of readyPlan) {
      try {
        if (entry.updatedAssignment) {
          await onAssignWorkoutPlan(entry.clientId, entry.updatedAssignment);
          applied += 1;
        }
      } catch (err) {
        console.error('Bulk progression failed for', entry.clientName, err);
        failed += 1;
      }
      setBulkProgress((p) => ({ ...p, done: p.done + 1 }));
    }
    setBulkApplying(false);
    setBulkDone({ applied, skipped: skippedPlan.length, failed });
    // Clear selection so the coach sees a clean slate after applying.
    clearSelection();
    setSelectionMode(false);
  };

  const modeMeta: Record<ProgressionMode, { label: string; hint: string; icon: React.ReactNode }> = {
    progress: {
      label: 'Progressive overload',
      hint: 'Auto-increase reps/weight from each client’s last week',
      icon: <TrendingUp className="w-5 h-5" />,
    },
    copy: {
      label: 'Keep the same',
      hint: 'Repeat last week (same exercises, reps & weights)',
      icon: <Copy className="w-5 h-5" />,
    },
    deload: {
      label: 'Deload week',
      hint: 'Reduce load for recovery (keep reps)',
      icon: <Activity className="w-5 h-5" />,
    },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
        {/* Animated background particles */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-r from-red-500/30 to-orange-500/30 rounded-full animate-ping"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`
              }}
            />
          ))}
        </div>
        
        {/* Loading content */}
        <div className="text-center z-10">
          <div className="relative mb-8">
            <div className="w-24 h-24 border-4 border-slate-700/50 border-t-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-red-400 rounded-full animate-spin opacity-70" 
                 style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
            <div className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-orange-400 rounded-full animate-spin opacity-40" 
                 style={{animationDuration: '3s'}}></div>
          </div>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-bold text-white animate-pulse bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
              Initializing UNBREAKABLES TEAM
            </h2>
            <div className="flex items-center justify-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
            </div>
            <p className="text-slate-400 text-lg">Preparing your AI-powered dashboard</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-800 relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.03)_1px,transparent_1px)] bg-[size:20px_20px]"></div>
      
      {/* Dynamic gradient overlay */}
      <div 
        className="absolute inset-0 bg-gradient-radial from-red-500/5 via-transparent to-transparent transition-all duration-1000"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(239, 68, 68, 0.05), transparent)`
        }}
      />

      <FloatingParticles />
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl" style={{ background: 'rgba(16,18,24,.92)', borderBottom: '1px solid var(--hair)' }}>
        <div className="w-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <img src="/brand-logo-light.png" alt="Unbreakables Team" className="w-12 h-12 object-contain shrink-0" />
              <div>
                <h1 className="text-2xl font-bold text-white">
                  <span className="text-white">UNBREAKABLES</span>
                  <span className="text-red-500 ml-2">TEAM</span>
                </h1>
                <p className="text-xs text-slate-400">AI-Powered Coaching Platform</p>
              </div>
            </div>

            {/* Search and Actions - Mobile Optimized */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
              </div>
              <button
                onClick={onNavigateToMealDatabase}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-indigo-500/30 hover:scale-105"
              >
                <Database className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Database Manager</span>
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-all duration-200"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-8 relative">
        {/* Welcome Section - Mobile Optimized */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold font-display text-white">Welcome back, Mehdi!</h1>
            <div className="text-2xl sm:text-3xl">👋</div>
          </div>
          <p className="text-slate-400 text-sm sm:text-xl">Here's what's happening with your coaching business today.</p>
        </div>

        {/* Stats Cards - Enhanced Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Mobile: Show only 2 cards, Desktop: Show all 4 */}
          <div className="group bg-[var(--surface-1)] backdrop-blur-sm rounded-xl p-4 border border-[color:var(--hair)] hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Total Clients</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-2">
                  <AnimatedCounter value={clients.length} />
                </p>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-emerald-500/20 rounded-full px-2 py-1">
                    <ArrowUpRight className="w-3 h-3 text-emerald-400 mr-1" />
                    <span className="text-xs text-emerald-300 font-semibold">+2 this month</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg group-hover:shadow-blue-500/30 transition-all duration-300">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="group bg-[var(--surface-1)] backdrop-blur-sm rounded-xl p-4 border border-[color:var(--hair)] hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Active Programs</p>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-white mb-2">{clients.filter(c => c.nutritionPlan || c.workoutAssignment).length}</p>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-emerald-500/20 rounded-full px-2 py-1">
                    <Activity className="w-3 h-3 text-emerald-400 mr-1" />
                    <span className="text-xs text-emerald-300 font-semibold">94% success</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:shadow-purple-500/30 transition-all duration-300">
                <Dumbbell className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          {/* Hidden on mobile, visible on desktop */}
          <div className="hidden lg:block group bg-[var(--surface-1)] backdrop-blur-sm rounded-xl p-4 border border-[color:var(--hair)] hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Pending Check-ins</p>
                </div>
                <p className="text-2xl font-bold text-white mb-2">3</p>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center bg-orange-500/20 rounded-full px-2 py-1">
                    <Clock className="w-3 h-3 text-orange-400 mr-1" />
                    <span className="text-xs text-orange-300 font-semibold">Need review</span>
                  </div>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg group-hover:shadow-orange-500/30 transition-all duration-300">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>

          <div className="hidden lg:block group bg-[var(--surface-1)] backdrop-blur-sm rounded-xl p-4 border border-[color:var(--hair)] hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></div>
                  <p className="text-slate-300 text-xs font-semibold uppercase tracking-wide">Client Satisfaction</p>
                </div>
                <p className="text-2xl font-bold text-white mb-2">4.8/5</p>
                <div className="flex items-center space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-yellow-400" />
                  ))}
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg group-hover:shadow-yellow-500/30 transition-all duration-300">
                <Crown className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>


        {/* Clients Section - Mobile Optimized */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
            <div className="mb-3 sm:mb-0">
              <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">Clients</h2>
              <p className="text-slate-400 text-sm sm:text-lg">Manage your clients and their plans from a single dashboard</p>
            </div>
            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={toggleSelectionMode}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 sm:py-3 rounded-xl font-semibold transition-all duration-200 border ${
                  selectionMode
                    ? 'bg-red-500/15 text-red-300 border-red-500/40'
                    : 'text-slate-300 border-[color:var(--hair)] hover:bg-slate-800'
                }`}
                title="Select multiple clients"
              >
                <Layers className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">{selectionMode ? 'Done' : 'Select'}</span>
              </button>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 sm:p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
                title={viewMode === 'grid' ? 'Switch to List View' : 'Switch to Grid View'}
              >
                {viewMode === 'grid' ? <List className="w-5 h-5 sm:w-6 sm:h-6" /> : <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 sm:py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-red-500/30 hover:scale-105"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-sm sm:text-base">Add Client</span>
              </button>
            </div>
          </div>

          {/* Selection toolbar */}
          {selectionMode && (
            <div className="flex items-center justify-between gap-3 mb-4 p-3 rounded-xl bg-[var(--surface-1)] border border-[color:var(--hair)]">
              <button
                onClick={toggleSelectAll}
                className="flex items-center space-x-2 text-sm font-medium text-slate-200 hover:text-white"
              >
                {allFilteredSelected ? (
                  <CheckSquare className="w-5 h-5 text-red-400" />
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
                <span>{allFilteredSelected ? 'Deselect all' : 'Select all'}</span>
              </button>
              <span className="text-sm text-slate-400">
                {selectedIds.size} selected
              </span>
            </div>
          )}

          {/* Clients Table/Grid */}
          {viewMode === 'list' ? (
            <div className="bg-[var(--surface-1)] backdrop-blur-sm rounded-2xl border border-[color:var(--hair)] overflow-visible">
              <div className="overflow-x-auto rounded-2xl">
                <table className="w-full min-w-[760px]">
                  <thead style={{ background: 'var(--surface-2)' }}>
                    <tr>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500 cursor-pointer"
                        />
                      </th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Goal</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Weight</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Plans</th>
                      <th className="px-4 sm:px-8 py-4 sm:py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className={`hover:bg-slate-800/30 transition-colors duration-200 relative ${selectedIds.has(client.id) ? 'bg-red-500/5' : ''}`}>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(client.id)}
                            onChange={() => toggleClientSelected(client.id)}
                            className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500 cursor-pointer"
                          />
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center">
                              <User className="w-6 h-6 text-slate-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-lg font-medium text-white">{client.name}</div>
                              <div className="text-slate-400">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getGoalColor(client.goal)}`}>
                            {getGoalIcon(client.goal)}
                            <span className="capitalize">{client.goal}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className="text-lg text-white">75.2 kg</div>
                          <div className="text-sm text-emerald-400">(-3.5)</div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Active
                          </span>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${client.nutritionPlan ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {client.nutritionPlan ? '✓' : '○'} Nutrition
                            </span>
                            <span className={`text-sm ${client.workoutAssignment ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {client.workoutAssignment ? '✓' : '○'} Workout
                            </span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-8 py-4 sm:py-6 whitespace-nowrap relative">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => onNavigateToClientPlan(client)}
                              className="p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onNavigateToClientPlan(client)}
                              className="p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Target className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => openDuplicateModal(client)}
                              title="Duplicate program"
                              className="p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Copy className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => onShareWithClient(client)}
                              className="p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={(e) => handleDropdownClick(e, client.id)}
                              className="p-3 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                              title="More options"
                            >
                              <MoreVertical className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredClients.map((client) => (
                <div
                  key={client.id}
                  onClick={selectionMode ? () => toggleClientSelected(client.id) : undefined}
                  className={`group bg-[var(--surface-1)] backdrop-blur-sm rounded-xl border p-4 transition-all duration-300 relative ${
                    selectionMode ? 'cursor-pointer' : ''
                  } ${
                    selectedIds.has(client.id)
                      ? 'border-red-500/60 ring-2 ring-red-500/40'
                      : 'border-[color:var(--hair)] hover:border-[color:var(--hair-strong)]'
                  }`}
                >
                  {selectionMode && (
                    <div className="absolute top-3 right-3 z-10">
                      {selectedIds.has(client.id) ? (
                        <CheckSquare className="w-6 h-6 text-red-400" />
                      ) : (
                        <Square className="w-6 h-6 text-slate-500" />
                      )}
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-700 flex items-center justify-center">
                        <User className="w-5 h-5 text-slate-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-white truncate">{client.name}</h3>
                        <p className="text-slate-400 text-sm truncate">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className={`w-2 h-2 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                      <span className="text-xs text-slate-400 hidden sm:block">{client.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-xs font-medium border mb-3 ${getGoalColor(client.goal)}`}>
                    {getGoalIcon(client.goal)}
                    <span className="capitalize">{client.goal}</span>
                  </div>

                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${client.nutritionPlan ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                        <span className="text-xs text-slate-400">Nutrition</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <div className={`w-2 h-2 rounded-full ${client.workoutAssignment ? 'bg-emerald-500' : 'bg-slate-500'}`}></div>
                        <span className="text-xs text-slate-400">Workout</span>
                      </div>
                    </div>
                  </div>

                  <div className={`flex space-x-2 ${selectionMode ? 'pointer-events-none opacity-40' : ''}`}>
                    <button
                      onClick={() => onNavigateToClientPlan(client)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 font-medium text-xs transition-colors duration-200"
                    >
                      <Eye className="w-3 h-3" />
                      <span className="hidden sm:block">View</span>
                    </button>
                    <button
                      onClick={() => onNavigateToClientPlan(client)}
                      className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 font-medium text-xs transition-colors duration-200"
                    >
                      <Target className="w-3 h-3" />
                      <span className="hidden sm:block">Plan</span>
                    </button>
                    <button
                      onClick={() => openDuplicateModal(client)}
                      title="Duplicate program"
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onShareWithClient(client)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                      title="Share with client"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => handleDropdownClick(e, client.id)}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors duration-200"
                      title="More options"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredClients.length === 0 && (
            <div className="text-center py-20">
              <div className="w-32 h-32 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-8">
                <Users className="w-16 h-16 text-slate-400" />
              </div>
              <h3 className="text-3xl font-bold text-white mb-4">No clients found</h3>
              <p className="text-slate-400 text-lg mb-8">Start by adding your first client to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-3 px-8 py-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Plus className="w-6 h-6" />
                <span>Add Your First Client</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg my-8">
            <div className="absolute inset-0 rounded-3xl blur-xl bg-gradient-to-r from-red-500/20 to-red-600/20"></div>
            <div className="relative backdrop-blur-xl rounded-3xl shadow-2xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">Add New Client</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="p-6 space-y-4 max-h-[min(70vh,32rem)] overflow-y-auto">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    placeholder="Client name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    placeholder="client@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Goal</label>
                  <select
                    value={newClient.goal}
                    onChange={(e) => setNewClient({...newClient, goal: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                  >
                    <option value="shredding">🔥 Shredding</option>
                    <option value="bulking">💪 Bulking</option>
                    <option value="maintenance">🛡️ Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Program Duration (weeks)</label>
                  <input
                    type="number"
                    value={newClient.numberOfWeeks}
                    onChange={(e) => setNewClient({...newClient, numberOfWeeks: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    min="1"
                    max="52"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Starting weight (kg)
                  </label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.1"
                    min="20"
                    max="400"
                    value={newClient.startingWeight}
                    onChange={(e) => setNewClient({ ...newClient, startingWeight: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    placeholder="e.g. 70"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Baseline for the home weight highlight. Shown once the client logs their first weight.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Meals per day
                  </label>
                  <select
                    value={mealsPerDay}
                    onChange={(e) => setMealsPerDay(Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                  >
                    <option value={2}>2 meals — Breakfast, Dinner</option>
                    <option value={3}>3 meals — Breakfast, Lunch, Dinner</option>
                    <option value={4}>4 — 3 meals + Evening Snack</option>
                    <option value={5}>5 — 3 meals + Morning &amp; Evening Snack</option>
                    <option value={6}>6 — 3 meals + 3 snacks</option>
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Diet slots: {getMealSlotNames(mealsPerDay).join(', ')}. You pick the meals after create.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">
                    Workout template
                  </label>
                  <select
                    value={workoutProgramId}
                    onChange={(e) => setWorkoutProgramId(e.target.value)}
                    disabled={loadingTemplates}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300 disabled:opacity-60"
                  >
                    <option value="">
                      {loadingTemplates ? 'Loading templates…' : 'None — assign later'}
                    </option>
                    {workoutTemplates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1.5 text-xs text-slate-400">
                    Optional. Assigns Week 1 from the selected template (same as the workout editor).
                  </p>
                </div>

                <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm pt-4">
                  <button
                    type="submit"
                    disabled={isAddingClient}
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:hover:scale-100 flex items-center justify-center gap-2"
                  >
                    {isAddingClient ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating…
                      </>
                    ) : (
                      'Add Client'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Portal Dropdown Menu */}
      {openDropdownId && dropdownPosition && createPortal(
        <div 
          className="dropdown-menu fixed w-56 bg-slate-800 rounded-lg shadow-2xl border-2 border-blue-500 z-[10000]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="py-2">
            {(() => {
              const currentClient = filteredClients.find(c => c.id === openDropdownId);
              if (!currentClient) return null;
              
              return (
                <>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      openDuplicateModal(currentClient);
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Duplicate Program</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('🔑 Opening credentials manager for:', currentClient.name, currentClient.id);
                      setCredentialsManagerClient(currentClient);
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }}
                    className="w-full px-4 py-2 text-left text-blue-400 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Key className="w-4 h-4" />
                    <span>Manage Credentials</span>
                  </button>
                  <button
                    onClick={() => {
                      onArchiveClient(currentClient.id);
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Client</span>
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`Are you sure you want to permanently delete ${currentClient.name}? This action cannot be undone.`)) {
                        onDeleteClient(currentClient.id);
                      }
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }}
                    className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Delete Client</span>
                  </button>
                </>
              );
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Duplicate Program Modal */}
      {duplicateSourceClient && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="relative w-full max-w-lg my-8">
            <div className="absolute inset-0 rounded-3xl blur-xl bg-gradient-to-r from-red-500/20 to-red-600/20"></div>
            <div className="relative backdrop-blur-xl rounded-3xl shadow-2xl" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <div>
                  <h2 className="text-2xl font-bold text-white">Duplicate Program</h2>
                  <p className="text-slate-400 text-sm mt-1">
                    Copy from {duplicateSourceClient.name} — starts at week 1
                  </p>
                </div>
                <button
                  onClick={() => setDuplicateSourceClient(null)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors duration-200"
                  disabled={isDuplicating}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleDuplicateSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">New client name</label>
                  <input
                    type="text"
                    value={duplicateForm.name}
                    onChange={(e) => setDuplicateForm({ ...duplicateForm, name: e.target.value })}
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    placeholder="Client name"
                    required
                    disabled={isDuplicating}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">Number of weeks</label>
                  <input
                    type="number"
                    value={duplicateForm.numberOfWeeks}
                    onChange={(e) =>
                      setDuplicateForm({
                        ...duplicateForm,
                        numberOfWeeks: Math.max(1, Math.min(52, parseInt(e.target.value, 10) || 1)),
                      })
                    }
                    className="w-full px-4 py-3 rounded-lg border border-slate-600 bg-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-300"
                    min={1}
                    max={52}
                    required
                    disabled={isDuplicating}
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Workout and nutrition plans are copied. Weights reset to 0, progress starts at week 1 (only week 1 unlocked).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isDuplicating}
                  className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {isDuplicating ? 'Creating copy...' : 'Create duplicate'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Floating bulk action bar */}
      {selectedIds.size > 0 && !bulkModalOpen && (
        <div className="fixed inset-x-0 bottom-0 z-[9000] p-3 sm:p-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.75rem)' }}>
          <div className="mx-auto w-full max-w-2xl flex items-center gap-3 rounded-2xl px-4 py-3 shadow-2xl backdrop-blur-xl" style={{ background: 'rgba(16,18,24,.96)', border: '1px solid var(--hair)' }}>
            <div className="flex items-center gap-2 text-white">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0">
                <Zap className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <div className="text-sm font-semibold">{selectedIds.size} selected</div>
                <button onClick={clearSelection} className="text-xs text-slate-400 hover:text-slate-200">Clear</button>
              </div>
            </div>
            <button
              onClick={openBulkModal}
              className="ml-auto flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold text-sm hover:from-red-600 hover:to-red-700 transition-all shadow-lg hover:shadow-red-500/30"
            >
              <TrendingUp className="w-4 h-4" />
              <span>Apply overload</span>
            </button>
          </div>
        </div>
      )}

      {/* Bulk Progressive Overload Modal */}
      {bulkModalOpen && (
        <div className="fixed inset-0 z-[9500] flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4">
          <div
            className="relative w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] flex flex-col rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3 p-5 sm:p-6 border-b border-[color:var(--hair)]">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-display text-white">Bulk progression</h2>
                  <p className="text-slate-400 text-xs sm:text-sm">Create the next week for {selectedClients.length} client{selectedClients.length === 1 ? '' : 's'}</p>
                </div>
              </div>
              <button
                onClick={closeBulkModal}
                disabled={bulkApplying}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              {bulkDone ? (
                <div className="text-center py-6">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-9 h-9 text-emerald-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Done!</h3>
                  <p className="text-slate-300">
                    {bulkDone.applied} new week{bulkDone.applied === 1 ? '' : 's'} deployed
                    {bulkDone.skipped > 0 && <> · {bulkDone.skipped} skipped</>}
                    {bulkDone.failed > 0 && <> · <span className="text-red-400">{bulkDone.failed} failed</span></>}
                  </p>
                </div>
              ) : (
                <>
                  {/* Mode selector */}
                  <div>
                    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Action</h3>
                    <div className="grid grid-cols-1 gap-2">
                      {(['progress', 'copy', 'deload'] as ProgressionMode[]).map((mode) => {
                        const meta = modeMeta[mode];
                        const active = bulkMode === mode;
                        return (
                          <button
                            key={mode}
                            onClick={() => setBulkMode(mode)}
                            disabled={bulkApplying}
                            className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all disabled:opacity-50 ${
                              active
                                ? 'border-red-500/60 bg-red-500/10'
                                : 'border-[color:var(--hair)] hover:border-[color:var(--hair-strong)]'
                            }`}
                          >
                            <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-red-500/20 text-red-300' : 'bg-slate-700/60 text-slate-300'}`}>
                              {meta.icon}
                            </div>
                            <div className="min-w-0">
                              <div className="text-sm font-semibold text-white">{meta.label}</div>
                              <div className="text-xs text-slate-400">{meta.hint}</div>
                            </div>
                            {active && <CheckCircle className="w-5 h-5 text-red-400 ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Preview */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Preview</h3>
                      <span className="text-xs text-slate-400">
                        {readyPlan.length} ready{skippedPlan.length > 0 && <> · {skippedPlan.length} skipped</>}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {bulkPlan.map((entry) => (
                        <div
                          key={entry.clientId}
                          className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border border-[color:var(--hair)]"
                        >
                          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                            <User className="w-5 h-5 text-slate-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate">{entry.clientName}</div>
                            {entry.status === 'ready' ? (
                              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                <span>Week {entry.fromWeekNumber}</span>
                                <ArrowRight className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-300 font-medium">Week {entry.nextWeekNumber}</span>
                                <span className="text-slate-500">of {entry.totalWeeks}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1.5 text-xs text-amber-400/90">
                                <AlertTriangle className="w-3 h-3" />
                                <span>{entry.reason}</span>
                              </div>
                            )}
                          </div>
                          {entry.status === 'ready' ? (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shrink-0">Ready</span>
                          ) : (
                            <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-1 rounded-full bg-slate-600/30 text-slate-400 border border-slate-500/30 shrink-0">Skip</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-5 sm:p-6 border-t border-[color:var(--hair)]" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}>
              {bulkDone ? (
                <button
                  onClick={() => { setBulkModalOpen(false); setBulkDone(null); }}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                >
                  Close
                </button>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    onClick={closeBulkModal}
                    disabled={bulkApplying}
                    className="px-4 py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-medium transition-colors disabled:opacity-40"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleApplyBulk}
                    disabled={bulkApplying || readyPlan.length === 0}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {bulkApplying ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Deploying {bulkProgress.done}/{bulkProgress.total}…</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-5 h-5" />
                        <span>Deploy to {readyPlan.length} client{readyPlan.length === 1 ? '' : 's'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Client Credentials Manager Modal */}
      {credentialsManagerClient && (
        <>
          {console.log('📋 Rendering ClientCredentialsManager:', credentialsManagerClient)}
          <ClientCredentialsManager
            clientId={credentialsManagerClient.id}
            clientName={credentialsManagerClient.name}
            onClose={() => {
              console.log('❌ Closing credentials manager');
              setCredentialsManagerClient(null);
            }}
          />
        </>
      )}
    </div>
  );
};
