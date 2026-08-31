import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Target,
  TrendingUp,
  Share2,
  CheckCircle,
  X,
  Copy,
  Activity,
  Flame,
  Shield,
  Grid3X3,
  List,
  User,
  Archive,
  Key,
  LogOut,
  Database,
  CheckSquare,
  Square,
  Loader2,
  Layers,
  AlertTriangle,
  ArrowRight,
  Zap
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


interface UnbreakableSteamClientsManagerProps {
  isDark: boolean;
  clients: Client[];
  onAddClient: (client: Client, setup?: NewClientSetupOptions) => void | Promise<void>;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  onDeleteClient: (clientId: string) => void;
  onArchiveClient: (clientId: string) => void;
  onRestoreClient: (clientId: string) => void;
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
  onRestoreClient,
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
  const [showArchived, setShowArchived] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isLoading, setIsLoading] = useState(true);
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
    }, 600);
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

  const getGoalTone = (goal: string) => {
    if (goal === 'shredding' || goal === 'bulking' || goal === 'maintenance') return goal;
    return 'maintenance';
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'shredding': return <Flame className="w-4 h-4" />;
      case 'bulking': return <TrendingUp className="w-4 h-4" />;
      case 'maintenance': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  // Filter clients based on archive tab + search term
  const archivedCount = clients.filter((c) => c.isArchived).length;
  const visibleClients = clients.filter((client) => Boolean(client.isArchived) === showArchived);
  const filteredClients = visibleClients.filter(client => {
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

  const clientsWithPlan = clients.filter(
    (c) => !c.isArchived && (c.nutritionPlan || c.workoutAssignment)
  ).length;
  const activeClients = clients.filter((c) => !c.isArchived && c.isActive).length;
  const totalActiveClients = clients.filter((c) => !c.isArchived).length;

  const clientWeightLabel = (client: Client): string => {
    const log = client.weightLog;
    if (Array.isArray(log) && log.length > 0) {
      const last = log[log.length - 1] as { weight?: number } | number;
      const w =
        typeof last === 'number'
          ? last
          : typeof last?.weight === 'number'
            ? last.weight
            : null;
      if (w != null && Number.isFinite(w)) return `${w} kg`;
    }
    if (
      typeof client.startingWeight === 'number' &&
      Number.isFinite(client.startingWeight)
    ) {
      return `${client.startingWeight} kg`;
    }
    return '—';
  };

  if (isLoading) {
    return (
      <div className="coach-hub workout-shell">
        <div className="coach-hub-glow" aria-hidden />
        <div className="coach-hub-loading">
          <img src="/brand-logo-light.png" alt="" className="coach-hub-loading-logo" />
          <p className="font-saira text-sm tracking-widest" style={{ color: 'var(--red)' }}>
            UNBREAKABLES
          </p>
          <div className="coach-hub-loading-bar" aria-hidden>
            <span />
          </div>
          <p className="text-sm">Loading clients…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="coach-hub workout-shell">
      <div className="coach-hub-glow" aria-hidden />
      <div className="coach-hub-inner">
      <header className="coach-hub-header">
        <div className="coach-hub-header-row">
          <div className="coach-hub-brand">
            <img src="/brand-logo-light.png" alt="Unbreakables" className="coach-hub-logo" />
            <div className="min-w-0">
              <h1 className="coach-hub-brand-title font-saira">
                UNBREAKABLES<span>TEAM</span>
              </h1>
              <p className="coach-hub-brand-sub">Coach dashboard</p>
            </div>
          </div>
          <div className="coach-hub-actions">
            <div className="coach-hub-search">
              <Search className="coach-hub-search-ic" aria-hidden />
              <input
                type="search"
                placeholder="Search clients…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="coach-hub-search-input"
                aria-label="Search clients"
              />
            </div>
            <button
              type="button"
              onClick={onNavigateToMealDatabase}
              className="coach-hub-btn coach-hub-btn-primary"
            >
              <Database className="w-4 h-4" />
              <span className="hidden sm:inline">Database</span>
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="coach-hub-btn coach-hub-btn-ghost"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <div className="coach-hub-main">
        <div className="coach-hub-welcome home-anim">
          <h1 className="font-saira">Welcome back</h1>
          <p>Manage clients, plans, and programs from one place.</p>
        </div>

        <div className="coach-hub-stats home-anim" style={{ animationDelay: '40ms' }}>
          <div className="coach-hub-stat">
            <div className="coach-hub-stat-label">
              <span className="coach-hub-stat-dot" style={{ background: 'var(--blue)' }} />
              Total clients
            </div>
            <p className="coach-hub-stat-value font-display tnum">
              <AnimatedCounter value={totalActiveClients} duration={900} />
            </p>
          </div>
          <div className="coach-hub-stat">
            <div className="coach-hub-stat-label">
              <span className="coach-hub-stat-dot" style={{ background: 'var(--green)' }} />
              Active
            </div>
            <p className="coach-hub-stat-value font-display tnum">
              <AnimatedCounter value={activeClients} duration={900} />
            </p>
            <p className="coach-hub-stat-hint">Marked active</p>
          </div>
          <div className="coach-hub-stat">
            <div className="coach-hub-stat-label">
              <span className="coach-hub-stat-dot" style={{ background: 'var(--orange)' }} />
              With a plan
            </div>
            <p className="coach-hub-stat-value font-display tnum">
              <AnimatedCounter value={clientsWithPlan} duration={900} />
            </p>
            <p className="coach-hub-stat-hint">Nutrition or workout</p>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6">
            <div className="mb-3 sm:mb-0">
              <h2 className="text-lg sm:text-2xl font-bold font-saira italic" style={{ color: 'var(--txt-hi)' }}>
                {showArchived ? 'Archived clients' : 'Clients'}
              </h2>
              <p className="text-xs sm:text-sm" style={{ color: 'var(--txt-mid)' }}>
                {showArchived
                  ? 'Restore a client to show them on the main list again'
                  : 'Open a client to edit nutrition and workouts'}
              </p>
            </div>
            <div className="coach-client-toolbar">
              <button
                type="button"
                onClick={() => {
                  setShowArchived((v) => !v);
                  setSelectionMode(false);
                  setSelectedIds(new Set());
                  setOpenDropdownId(null);
                }}
                className={`coach-hub-btn ${showArchived ? 'coach-hub-btn-primary' : 'coach-hub-btn-ghost'}`}
                title={showArchived ? 'Back to active clients' : 'View archived clients'}
              >
                <Archive className="w-4 h-4" />
                <span>{showArchived ? 'Active' : `Archived${archivedCount ? ` (${archivedCount})` : ''}`}</span>
              </button>
              {!showArchived && (
              <button
                onClick={toggleSelectionMode}
                className={`coach-hub-btn ${selectionMode ? 'coach-hub-btn-primary' : 'coach-hub-btn-ghost'}`}
                title="Select multiple clients"
              >
                <Layers className="w-4 h-4" />
                <span>{selectionMode ? 'Done' : 'Select'}</span>
              </button>
              )}
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="coach-hub-btn coach-hub-btn-ghost"
                title={viewMode === 'grid' ? 'Switch to list' : 'Switch to grid'}
              >
                {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              </button>
              {!showArchived && (
              <button
                onClick={() => setShowAddModal(true)}
                className="coach-hub-btn coach-hub-btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Add Client</span>
              </button>
              )}
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

          {/* Clients Table/Grid — table is laptop-only; phone always uses compact cards */}
          {viewMode === 'list' ? (
            <>
            <div className="hidden sm:block coach-client-table-wrap">
              <div className="overflow-x-auto">
                <table className="coach-client-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={allFilteredSelected}
                          onChange={toggleSelectAll}
                          className="w-4 h-4 rounded cursor-pointer"
                          aria-label="Select all clients"
                        />
                      </th>
                      <th>Client</th>
                      <th>Goal</th>
                      <th>Weight</th>
                      <th>Status</th>
                      <th>Plans</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client) => (
                      <tr key={client.id} className={selectedIds.has(client.id) ? 'is-selected' : undefined}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedIds.has(client.id)}
                            onChange={() => toggleClientSelected(client.id)}
                            className="w-4 h-4 rounded cursor-pointer"
                            aria-label={`Select ${client.name}`}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="coach-client-avatar font-saira">{client.name.charAt(0).toUpperCase()}</div>
                            <div className="min-w-0">
                              <div className="font-saira coach-client-name truncate">{client.name}</div>
                              <div className="coach-client-email">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className={`coach-goal-chip ${getGoalTone(client.goal)}`} style={{ marginBottom: 0 }}>
                            {getGoalIcon(client.goal)}
                            <span>{client.goal}</span>
                          </div>
                        </td>
                        <td>
                          <div className="font-display tnum">{clientWeightLabel(client)}</div>
                        </td>
                        <td>
                          <span className={`coach-client-status ${client.isActive ? 'is-on' : ''}`}>
                            {client.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="coach-client-pips" style={{ marginBottom: 0 }}>
                            <span className={`coach-client-pip ${client.nutritionPlan ? 'is-on' : ''}`}>
                              <i /> Nutrition
                            </span>
                            <span className={`coach-client-pip ${client.workoutAssignment ? 'is-on' : ''}`}>
                              <i /> Workout
                            </span>
                          </div>
                        </td>
                        <td>
                          <div className="coach-client-actions">
                            <button
                              type="button"
                              onClick={() => onNavigateToClientPlan(client)}
                              className="coach-client-open"
                            >
                              <ArrowRight className="w-4 h-4" />
                              Open plan
                            </button>
                            <button
                              type="button"
                              onClick={() => openDuplicateModal(client)}
                              title="Duplicate program"
                              className="coach-client-iconbtn"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onShareWithClient(client)}
                              className="coach-client-iconbtn"
                              title="Share with client"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDropdownClick(e, client.id)}
                              className="coach-client-iconbtn is-more"
                              title="More options"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* Phone: list mode uses the same compact cards (wide table is laptop-only) */}
            <div className="sm:hidden coach-client-grid">
              {filteredClients.map((client) => (
                <div
                  key={`m-${client.id}`}
                  role="button"
                  tabIndex={0}
                  onClick={selectionMode ? () => toggleClientSelected(client.id) : () => onNavigateToClientPlan(client)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (selectionMode) toggleClientSelected(client.id);
                      else onNavigateToClientPlan(client);
                    }
                  }}
                  className={`coach-client-card ${selectedIds.has(client.id) ? 'is-selected' : ''}`}
                  style={{ padding: 12 }}
                >
                  <div className="coach-client-card-top" style={{ marginBottom: 0 }}>
                    {selectionMode && (
                      <span className="shrink-0">
                        {selectedIds.has(client.id) ? (
                          <CheckSquare className="w-5 h-5" style={{ color: 'var(--red)' }} />
                        ) : (
                          <Square className="w-5 h-5" style={{ color: 'var(--txt-lo)' }} />
                        )}
                      </span>
                    )}
                    <div className="coach-client-avatar font-saira">{client.name.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="coach-client-name font-saira truncate">{client.name}</h3>
                      <p className="coach-client-email">
                        {client.isActive ? 'Active' : 'Inactive'}
                        {client.email ? ` · ${client.email}` : ''}
                      </p>
                    </div>
                    {!selectionMode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDropdownClick(e, client.id);
                        }}
                        className="coach-client-iconbtn is-more"
                        title="More options"
                        aria-label="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
            </>
          ) : (
            <div className="coach-client-grid">
              {filteredClients.map((client, index) => (
                <div
                  key={client.id}
                  role="button"
                  tabIndex={0}
                  onClick={selectionMode ? () => toggleClientSelected(client.id) : () => onNavigateToClientPlan(client)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (selectionMode) toggleClientSelected(client.id);
                      else onNavigateToClientPlan(client);
                    }
                  }}
                  className={`coach-client-card home-anim ${selectedIds.has(client.id) ? 'is-selected' : ''}`}
                  style={{ animationDelay: `${Math.min(index, 12) * 40}ms` }}
                >
                  {selectionMode && (
                    <div className="absolute top-3 right-3 z-10">
                      {selectedIds.has(client.id) ? (
                        <CheckSquare className="w-6 h-6" style={{ color: 'var(--red)' }} />
                      ) : (
                        <Square className="w-6 h-6" style={{ color: 'var(--txt-lo)' }} />
                      )}
                    </div>
                  )}
                  <div className="coach-client-card-top">
                    <div className="coach-client-avatar font-saira">{client.name.charAt(0).toUpperCase()}</div>
                    <div className="min-w-0 flex-1">
                      <h3 className="coach-client-name font-saira truncate">{client.name}</h3>
                      <p className="coach-client-email">{client.email}</p>
                    </div>
                    <span className={`coach-client-status ${client.isActive ? 'is-on' : ''}`}>
                      {client.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className={`coach-goal-chip ${getGoalTone(client.goal)}`}>
                    {getGoalIcon(client.goal)}
                    <span>{client.goal}</span>
                  </div>

                  <div className="coach-client-pips">
                    <span className={`coach-client-pip ${client.nutritionPlan ? 'is-on' : ''}`}>
                      <i /> Nutrition
                    </span>
                    <span className={`coach-client-pip ${client.workoutAssignment ? 'is-on' : ''}`}>
                      <i /> Workout
                    </span>
                  </div>

                  {!selectionMode && (
                    <div
                      className="coach-client-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => onNavigateToClientPlan(client)}
                        className="coach-client-open"
                      >
                        <ArrowRight className="w-4 h-4" />
                        Open plan
                      </button>
                      <button
                        type="button"
                        onClick={() => openDuplicateModal(client)}
                        title="Duplicate program"
                        className="coach-client-iconbtn"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onShareWithClient(client)}
                        className="coach-client-iconbtn"
                        title="Share with client"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDropdownClick(e, client.id)}
                        className="coach-client-iconbtn is-more"
                        title="More options"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {filteredClients.length === 0 && (
            <div className="text-center py-10 sm:py-16 px-4">
              <div
                className="w-14 h-14 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-4"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
              >
                <Users className="w-7 h-7 sm:w-10 sm:h-10" style={{ color: 'var(--txt-lo)' }} />
              </div>
              <h3 className="text-base sm:text-xl font-bold mb-1" style={{ color: 'var(--txt-hi)' }}>
                {showArchived ? 'No archived clients' : 'No clients found'}
              </h3>
              <p className="text-xs sm:text-sm mb-5" style={{ color: 'var(--txt-mid)' }}>
                {showArchived
                  ? 'Archived clients are hidden from the main list but their data is kept.'
                  : 'Add your first client to get started'}
              </p>
              {!showArchived && (
              <button
                onClick={() => setShowAddModal(true)}
                className="coach-hub-btn coach-hub-btn-primary inline-flex mx-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
              )}
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
          className="dropdown-menu fixed w-56 rounded-lg shadow-2xl z-[10000]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            background: 'var(--surface-2)',
            border: '1px solid var(--hair-strong)',
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
                  {showArchived ? (
                  <button
                    onClick={() => {
                      onRestoreClient(currentClient.id);
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }}
                    className="w-full px-4 py-2 text-left text-green-400 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Restore Client</span>
                  </button>
                  ) : (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Archive ${currentClient.name}? They will be hidden from the main list but their data is kept.`
                        )
                      ) {
                        onArchiveClient(currentClient.id);
                      }
                      setOpenDropdownId(null);
                      setDropdownPosition(null);
                    }}
                    className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center space-x-2"
                  >
                    <Archive className="w-4 h-4" />
                    <span>Archive Client</span>
                  </button>
                  )}
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
    </div>
  );
};
