import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  MoreVertical, 
  Mail, 
  Phone, 
  Calendar,
  Target,
  TrendingUp,
  Dumbbell,
  Utensils,
  Eye,
  Edit3,
  Share2,
  CheckCircle,
  X,
  Copy,
  Sparkles,
  Zap,
  Activity,
  BarChart3,
  Clock,
  Heart,
  Flame,
  Shield,
  ArrowRight,
  Filter,
  SortAsc,
  Grid3X3,
  List,
  Star,
  Crown,
  User,
  ChevronDown,
  Settings,
  Filter as FilterIcon,
  Bell,
  BellRing,
  Award,
  Trophy,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Maximize2,
  Minimize2,
  RotateCcw,
  RefreshCw,
  Download,
  Upload,
  FileText,
  PieChart,
  BarChart,
  LineChart,
  Layers,
  Compass,
  Navigation,
  MapPin,
  Globe,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalLow,
  Battery,
  BatteryCharging,
  Power,
  PowerOff,
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Camera,
  Video,
  Image,
  File,
  Folder,
  FolderOpen,
  Archive,
  Inbox,
  Send,
  Mail,
  MessageSquare,
  MessageCircle,
  Phone,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Voicemail,
  Headphones,
  HeadphonesIcon,
  Speaker,
  Radio,
  Music,
  Music2,
  Music3,
  Music4,
  Disc,
  Disc2,
  Disc3,
  PlayCircle,
  PauseCircle,
  StopCircle,
  SkipBackCircle,
  SkipForwardCircle,
  Repeat,
  Repeat1,
  Shuffle,
  Shuffle2,
  Shuffle3,
  Shuffle4,
  Shuffle5,
  Shuffle6,
  Shuffle7,
  Shuffle8,
  Shuffle9,
  Shuffle10,
  Shuffle11,
  Shuffle12,
  Shuffle13,
  Shuffle14,
  Shuffle15,
  Shuffle16,
  Shuffle17,
  Shuffle18,
  Shuffle19,
  Shuffle20,
  Shuffle21,
  Shuffle22,
  Shuffle23,
  Shuffle24,
  Shuffle25,
  Shuffle26,
  Shuffle27,
  Shuffle28,
  Shuffle29,
  Shuffle30,
  Shuffle31,
  Shuffle32,
  Shuffle33,
  Shuffle34,
  Shuffle35,
  Shuffle36,
  Shuffle37,
  Shuffle38,
  Shuffle39,
  Shuffle40,
  Shuffle41,
  Shuffle42,
  Shuffle43,
  Shuffle44,
  Shuffle45,
  Shuffle46,
  Shuffle47,
  Shuffle48,
  Shuffle49,
  Shuffle50,
  Shuffle51,
  Shuffle52,
  Shuffle53,
  Shuffle54,
  Shuffle55,
  Shuffle56,
  Shuffle57,
  Shuffle58,
  Shuffle59,
  Shuffle60,
  Shuffle61,
  Shuffle62,
  Shuffle63,
  Shuffle64,
  Shuffle65,
  Shuffle66,
  Shuffle67,
  Shuffle68,
  Shuffle69,
  Shuffle70,
  Shuffle71,
  Shuffle72,
  Shuffle73,
  Shuffle74,
  Shuffle75,
  Shuffle76,
  Shuffle77,
  Shuffle78,
  Shuffle79,
  Shuffle80,
  Shuffle81,
  Shuffle82,
  Shuffle83,
  Shuffle84,
  Shuffle85,
  Shuffle86,
  Shuffle87,
  Shuffle88,
  Shuffle89,
  Shuffle90,
  Shuffle91,
  Shuffle92,
  Shuffle93,
  Shuffle94,
  Shuffle95,
  Shuffle96,
  Shuffle97,
  Shuffle98,
  Shuffle99,
  Shuffle100
} from 'lucide-react';
import { Client, ClientWorkoutAssignment } from '../types';

interface UltraModernClientsManagerProps {
  isDark: boolean;
  clients: Client[];
  onAddClient: (client: Client) => void;
  onUpdateClient: (clientId: string, updates: Partial<Client>) => void;
  onDeleteClient: (clientId: string) => void;
  onAssignNutritionPlan: (clientId: string, plan: any) => void;
  onAssignWorkoutPlan: (clientId: string, assignment: ClientWorkoutAssignment) => void;
  onShareWithClient: (client: Client) => void;
  onNavigateToClientPlan: (client: Client) => void;
  onDuplicateClient: (client: Client) => void;
}

export const UltraModernClientsManager: React.FC<UltraModernClientsManagerProps> = ({
  isDark,
  clients,
  onAddClient,
  onShareWithClient,
  onNavigateToClientPlan,
  onDuplicateClient
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'goal' | 'date'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'maintenance' as 'shredding' | 'bulking' | 'maintenance',
    numberOfWeeks: 12,
    startDate: new Date(),
    isActive: true
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'shredding': return 'text-orange-500 bg-orange-50 dark:bg-orange-950/20 dark:text-orange-400 border-orange-200 dark:border-orange-800';
      case 'bulking': return 'text-blue-500 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'maintenance': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      default: return 'text-slate-500 bg-slate-50 dark:bg-slate-950/20 dark:text-slate-400 border-slate-200 dark:border-slate-800';
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

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = filterGoal === 'all' || client.goal === filterGoal;
    return matchesSearch && matchesGoal;
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-indigo-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-indigo-300 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-6 animate-pulse">Loading your clients...</h2>
          <p className="text-slate-600 dark:text-slate-400 mt-2">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <div className="relative z-10 sticky top-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-2xl">
                  <Users className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{clients.length}</span>
                </div>
              </div>
              
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 dark:from-slate-100 dark:via-indigo-100 dark:to-purple-100 bg-clip-text text-transparent">
                  Client Studio
                </h1>
                <p className="text-slate-600 dark:text-slate-400 text-lg">
                  Manage your clients and their progress
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-300 hover:scale-105"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="group relative inline-flex items-center space-x-3 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300 relative z-10" />
                <span className="relative z-10">Add Client</span>
                <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Search and Filter Bar */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute inset-0 rounded-2xl blur-sm bg-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 shadow-xl">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search clients by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                  />
                </div>
                
                <select
                  value={filterGoal}
                  onChange={(e) => setFilterGoal(e.target.value)}
                  className="px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                >
                  <option value="all">All Goals</option>
                  <option value="shredding">🔥 Shredding</option>
                  <option value="bulking">💪 Bulking</option>
                  <option value="maintenance">🛡️ Maintenance</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="goal">Sort by Goal</option>
                  <option value="date">Sort by Date</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl blur-sm bg-gradient-to-r from-indigo-500/20 to-blue-500/20 group-hover:from-indigo-500/30 group-hover:to-blue-500/30 transition-all duration-300"></div>
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Total Clients</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">{clients.length}</p>
                  <div className="flex items-center mt-2">
                    <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">+12% this month</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl blur-sm bg-gradient-to-r from-emerald-500/20 to-teal-500/20 group-hover:from-emerald-500/30 group-hover:to-teal-500/30 transition-all duration-300"></div>
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Active Plans</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">
                    {clients.filter(c => c.nutritionPlan || c.workoutAssignment).length}
                  </p>
                  <div className="flex items-center mt-2">
                    <Activity className="w-4 h-4 text-emerald-500 mr-1" />
                    <span className="text-sm text-emerald-600 dark:text-emerald-400 font-medium">94% success rate</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg">
                  <Activity className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl blur-sm bg-gradient-to-r from-blue-500/20 to-cyan-500/20 group-hover:from-blue-500/30 group-hover:to-cyan-500/30 transition-all duration-300"></div>
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">This Month</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">+{Math.floor(clients.length * 0.3)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="w-4 h-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Growing fast</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>

          <div className="group relative">
            <div className="absolute inset-0 rounded-2xl blur-sm bg-gradient-to-r from-amber-500/20 to-orange-500/20 group-hover:from-amber-500/30 group-hover:to-orange-500/30 transition-all duration-300"></div>
            <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">Success Rate</p>
                  <p className="text-4xl font-bold text-slate-900 dark:text-slate-100">94%</p>
                  <div className="flex items-center mt-2">
                    <Crown className="w-4 h-4 text-amber-500 mr-1" />
                    <span className="text-sm text-amber-600 dark:text-amber-400 font-medium">Excellent</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                  <Crown className="w-8 h-8 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Clients Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client, index) => (
              <div
                key={client.id}
                className="group relative animate-fadeInUp"
                style={{animationDelay: `${index * 0.1}s`}}
              >
                <div className="absolute inset-0 rounded-3xl blur-sm bg-gradient-to-r from-indigo-500/10 to-purple-500/10 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-2xl transition-all duration-500 group-hover:scale-105 group-hover:-translate-y-2">
                  {/* Client Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white dark:border-slate-800`}></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{client.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400 text-sm">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{client.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  {/* Goal Badge */}
                  <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold mb-4 border ${getGoalColor(client.goal)}`}>
                    {getGoalIcon(client.goal)}
                    <span className="capitalize">{client.goal}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {client.nutritionPlan ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Nutrition</div>
                    </div>
                    <div className="text-center p-3 rounded-xl bg-slate-50 dark:bg-slate-700">
                      <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {client.workoutAssignment ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">Workout</div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 font-medium text-sm transition-all duration-300 hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onNavigateToClientPlan(client)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 font-medium text-sm transition-all duration-300 hover:scale-105 shadow-lg"
                    >
                      <Target className="w-4 h-4" />
                      <span>Plan</span>
                    </button>
                    <button
                      onClick={() => onDuplicateClient(client)}
                      className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onShareWithClient(client)}
                      className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredClients.map((client, index) => (
              <div
                key={client.id}
                className="group relative animate-fadeInUp"
                style={{animationDelay: `${index * 0.05}s`}}
              >
                <div className="absolute inset-0 rounded-2xl blur-sm bg-gradient-to-r from-indigo-500/10 to-purple-500/10 group-hover:from-indigo-500/20 group-hover:to-purple-500/20 transition-all duration-500"></div>
                <div className="relative bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-slate-700/50 p-6 hover:shadow-xl transition-all duration-500 group-hover:scale-[1.02]">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center shadow-lg">
                          <User className="w-6 h-6 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white dark:border-slate-800`}></div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{client.name}</h3>
                        <p className="text-slate-600 dark:text-slate-400">{client.email}</p>
                      </div>
                      <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium border ${getGoalColor(client.goal)}`}>
                        {getGoalIcon(client.goal)}
                        <span className="capitalize">{client.goal}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {client.nutritionPlan ? '✓' : '○'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Nutrition</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-slate-900 dark:text-slate-100">
                            {client.workoutAssignment ? '✓' : '○'}
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400">Workout</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setSelectedClient(client)}
                          className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onNavigateToClientPlan(client)}
                          className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 hover:scale-105 shadow-lg"
                        >
                          <Target className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDuplicateClient(client)}
                          className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onShareWithClient(client)}
                          className="p-3 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-105"
                        >
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredClients.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Users className="w-12 h-12 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">No clients found</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">Start by adding your first client to get started</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
            >
              <Plus className="w-5 h-5" />
              <span>Add Your First Client</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
            <div className="absolute inset-0 rounded-3xl blur-xl bg-gradient-to-r from-indigo-500/20 to-purple-500/20"></div>
            <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-slate-200/50 dark:border-slate-700/50 shadow-2xl">
              <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Add New Client</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Name</label>
                  <input
                    type="text"
                    value={newClient.name}
                    onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                    placeholder="Client name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email</label>
                  <input
                    type="email"
                    value={newClient.email}
                    onChange={(e) => setNewClient({...newClient, email: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                    placeholder="client@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={newClient.phone}
                    onChange={(e) => setNewClient({...newClient, phone: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                    placeholder="+1 (555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Goal</label>
                  <select
                    value={newClient.goal}
                    onChange={(e) => setNewClient({...newClient, goal: e.target.value as any})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                  >
                    <option value="shredding">🔥 Shredding</option>
                    <option value="bulking">💪 Bulking</option>
                    <option value="maintenance">🛡️ Maintenance</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Program Duration (weeks)</label>
                  <input
                    type="number"
                    value={newClient.numberOfWeeks}
                    onChange={(e) => setNewClient({...newClient, numberOfWeeks: parseInt(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 shadow-sm"
                    min="1"
                    max="52"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add Client
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </div>
  );
};