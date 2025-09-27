import React, { useState, useEffect, useRef } from 'react';
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
  Archive
} from 'lucide-react';
import { Client, ClientWorkoutAssignment } from '../types';

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
  onAddClient: (client: Client) => void;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  onDeleteClient: (clientId: string) => void;
  onArchiveClient: (clientId: string) => void;
  onAssignNutritionPlan: (clientId: string, plan: any) => void;
  onAssignWorkoutPlan: (clientId: string, assignment: ClientWorkoutAssignment) => void;
  onShareWithClient: (client: Client) => void;
  onNavigateToClientPlan: (client: Client) => void;
  onDuplicateClient: (client: Client) => void;
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
    isActive: true
  });
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      if (openDropdownId) {
        setOpenDropdownId(null);
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

  const handleAddClient = (e: React.FormEvent) => {
    e.preventDefault();
    const client: Client = {
      id: Date.now().toString(),
      ...newClient,
      weightLog: [],
      favorites: [],
      nutritionPlan: undefined,
      workoutAssignment: undefined
    };
    onAddClient(client);
    setShowAddModal(false);
    setNewClient({
      name: '',
      email: '',
      phone: '',
      goal: 'maintenance',
      numberOfWeeks: 12,
      startDate: new Date(),
      isActive: true
    });
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
      <div className="sticky top-0 z-50 bg-gray-800 backdrop-blur-xl border-b border-gray-700">
        <div className="w-full px-4 lg:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-lg p-1">
                {/* UNBREAKABLES TEAM Logo - Shield with V shape */}
                <div className="relative w-10 h-10">
                  {/* Black shield outer shape - inverted V */}
                  <div className="absolute inset-0 bg-black" style={{
                    clipPath: 'polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)',
                    borderRadius: '4px 4px 0 0'
                  }}></div>
                  {/* Red V shape inside */}
                  <div className="absolute inset-2 bg-red-500" style={{
                    clipPath: 'polygon(20% 0%, 80% 0%, 60% 100%, 40% 100%)',
                    borderRadius: '2px'
                  }}></div>
                </div>
              </div>
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
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={onNavigateToMealDatabase}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition-all duration-200 text-xs sm:text-sm shadow-lg"
                  title="Meal Database"
                >
                  <Utensils className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:block sm:block">Meal DB</span>
                </button>
                <button
                  onClick={onNavigateToIngredients}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-medium transition-all duration-200 text-xs sm:text-sm shadow-lg"
                  title="Ingredients Database"
                >
                  <Utensils className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:block sm:block">Ingredients</span>
                </button>
                <button
                  onClick={onNavigateToExerciseDatabase}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white font-medium transition-all duration-200 text-xs sm:text-sm shadow-lg"
                  title="Exercise Database"
                >
                  <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:block sm:block">Exercise DB</span>
                </button>
                <button
                  onClick={onNavigateToTemplates}
                  className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-medium transition-all duration-200 text-xs sm:text-sm shadow-lg"
                  title="Templates"
                >
                  <Grid3X3 className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden xs:block sm:block">Templates</span>
                </button>
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 sm:px-6 py-2 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-red-500/30 hover:scale-105"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm sm:text-base">New Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Welcome Section - Mobile Optimized */}
        <div className="mb-6">
          <div className="flex items-center space-x-2 sm:space-x-3 mb-2">
            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Star className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold text-white">Welcome back, Mehdi!</h1>
            <div className="text-2xl sm:text-3xl">👋</div>
          </div>
          <p className="text-slate-400 text-sm sm:text-xl">Here's what's happening with your coaching business today.</p>
        </div>

        {/* Stats Cards - Enhanced Design */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Mobile: Show only 2 cards, Desktop: Show all 4 */}
          <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20">
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

          <div className="group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-purple-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20">
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
          <div className="hidden lg:block group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-orange-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
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

          <div className="hidden lg:block group bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/50 hover:border-yellow-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-yellow-500/20">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Clients</h2>
              <p className="text-slate-400 text-sm sm:text-lg">Manage your clients and their plans from a single dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 sm:p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5 sm:w-6 sm:h-6" /> : <Grid3X3 className="w-5 h-5 sm:w-6 sm:h-6" />}
              </button>
            </div>
          </div>

          {/* Clients Table/Grid */}
          {viewMode === 'list' ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-800/70">
                    <tr>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500" />
                      </th>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Goal</th>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Weight</th>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Plans</th>
                      <th className="px-8 py-6 text-left text-sm font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredClients.map((client) => (
                      <tr key={client.id} className="hover:bg-slate-800/30 transition-colors duration-200">
                        <td className="px-8 py-6 whitespace-nowrap">
                          <input type="radio" className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500" />
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
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
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full text-sm font-medium border ${getGoalColor(client.goal)}`}>
                            {getGoalIcon(client.goal)}
                            <span className="capitalize">{client.goal}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="text-lg text-white">75.2 kg</div>
                          <div className="text-sm text-emerald-400">(-3.5)</div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Active
                          </span>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
                          <div className="flex items-center space-x-3">
                            <span className={`text-sm ${client.nutritionPlan ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {client.nutritionPlan ? '✓' : '○'} Nutrition
                            </span>
                            <span className={`text-sm ${client.workoutAssignment ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {client.workoutAssignment ? '✓' : '○'} Workout
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-6 whitespace-nowrap">
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
                              onClick={() => onDuplicateClient(client)}
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
                            <div className="relative">
                              <button 
                                onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
                                className="p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                              >
                                <MoreVertical className="w-5 h-5" />
                              </button>
                              {/* Dropdown Menu - Only show when clicked */}
                              {openDropdownId === client.id && (
                                <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
                                  <div className="py-2">
                                    <button
                                      onClick={() => {
                                        onArchiveClient(client.id);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center space-x-2"
                                    >
                                      <Archive className="w-4 h-4" />
                                      <span>Archive Client</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm(`Are you sure you want to permanently delete ${client.name}? This action cannot be undone.`)) {
                                          onDeleteClient(client.id);
                                        }
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center space-x-2"
                                    >
                                      <X className="w-4 h-4" />
                                      <span>Delete Client</span>
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
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
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 hover:bg-slate-800/70 transition-all duration-300"
                >
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

                  <div className="flex space-x-2">
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
                      onClick={() => onDuplicateClient(client)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onShareWithClient(client)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Share2 className="w-3 h-3" />
                    </button>
                    <div className="relative">
                      <button 
                        onClick={() => setOpenDropdownId(openDropdownId === client.id ? null : client.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>
                      {/* Dropdown Menu - Only show when clicked */}
                      {openDropdownId === client.id && (
                        <div className="absolute right-0 mt-2 w-48 bg-slate-800 rounded-lg shadow-lg border border-slate-700 z-10">
                          <div className="py-2">
                            <button
                              onClick={() => {
                                onArchiveClient(client.id);
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-slate-300 hover:bg-slate-700 flex items-center space-x-2"
                            >
                              <Archive className="w-4 h-4" />
                              <span>Archive Client</span>
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to permanently delete ${client.name}? This action cannot be undone.`)) {
                                  onDeleteClient(client.id);
                                }
                                setOpenDropdownId(null);
                              }}
                              className="w-full px-4 py-2 text-left text-red-400 hover:bg-slate-700 flex items-center space-x-2"
                            >
                              <X className="w-4 h-4" />
                              <span>Delete Client</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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
            <div className="relative bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-slate-700/50 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-700/50">
                <h2 className="text-2xl font-bold text-white">Add New Client</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-lg text-slate-400 hover:text-slate-300 hover:bg-slate-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="p-6 space-y-4 max-h-96 overflow-y-auto">
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

                <div className="sticky bottom-0 bg-slate-800/95 backdrop-blur-sm pt-4">
                  <button
                    type="submit"
                    className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    Add Client
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
