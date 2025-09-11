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
  MessageSquare,
  MessageCircle,
  PhoneCall,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  PhoneOff,
  Voicemail,
  Headphones,
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

interface CoachBoardClientsManagerProps {
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

export const CoachBoardClientsManager: React.FC<CoachBoardClientsManagerProps> = ({
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-slate-700 border-t-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-red-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          </div>
          <h2 className="text-2xl font-bold text-white mt-6 animate-pulse">Loading your clients...</h2>
          <p className="text-slate-400 mt-2">Preparing your dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Top Navigation Bar */}
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-xl border-b border-slate-700/50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                <Users className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">CoachBoard</h1>
                <p className="text-xs text-slate-400">AI-Powered</p>
              </div>
            </div>

            {/* Navigation Items */}
            <div className="hidden md:flex items-center space-x-1">
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 text-white">
                <BarChart3 className="w-4 h-4" />
                <span className="text-sm font-medium">Dashboard</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
                <Users className="w-4 h-4" />
                <span className="text-sm font-medium">Clients</span>
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{clients.length}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
                <Utensils className="w-4 h-4" />
                <span className="text-sm font-medium">Nutrition</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
                <Dumbbell className="w-4 h-4" />
                <span className="text-sm font-medium">Training</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Check-ins</span>
                <div className="w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs font-bold text-white">3</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-medium">Templates</span>
              </div>
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200">
                <Settings className="w-4 h-4" />
                <span className="text-sm font-medium">Settings</span>
              </div>
            </div>

            {/* Search and Actions */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  className="w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
              </div>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-medium hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-lg"
              >
                <Plus className="w-4 h-4" />
                <span>New Client</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Star className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white">Welcome back, John Coach!</h1>
            <div className="text-2xl">👋</div>
          </div>
          <p className="text-slate-400 text-lg">Here's what's happening with your coaching business today.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Total Clients</p>
                <p className="text-4xl font-bold text-white">{clients.length}</p>
                <div className="flex items-center mt-2">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm text-emerald-400 font-medium">+2 from last month</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                <Users className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Active Programs</p>
                <p className="text-4xl font-bold text-white">{clients.filter(c => c.nutritionPlan || c.workoutAssignment).length}</p>
                <div className="flex items-center mt-2">
                  <Activity className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm text-emerald-400 font-medium">94% success rate</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg">
                <Dumbbell className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Pending Check-ins</p>
                <p className="text-4xl font-bold text-white">3</p>
                <div className="flex items-center mt-2">
                  <Clock className="w-4 h-4 text-orange-500 mr-1" />
                  <span className="text-sm text-orange-400 font-medium">Need your review</span>
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:bg-slate-800/70 transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm font-medium mb-1">Client Satisfaction</p>
                <p className="text-4xl font-bold text-white">4.8/5</p>
                <div className="flex items-center mt-2">
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                  <Star className="w-4 h-4 text-yellow-500 mr-1" />
                </div>
              </div>
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center shadow-lg">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-3 p-6 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Users className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Add New Client</p>
                <p className="text-sm text-red-100">Create a new client profile</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white hover:bg-slate-800/70 transition-all duration-300">
              <Utensils className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Create Nutrition Plan</p>
                <p className="text-sm text-slate-400">Design meal plans</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white hover:bg-slate-800/70 transition-all duration-300">
              <Dumbbell className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Build Training Program</p>
                <p className="text-sm text-slate-400">Create workout routines</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-6 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-white hover:bg-slate-800/70 transition-all duration-300">
              <CheckCircle className="w-6 h-6" />
              <div className="text-left">
                <p className="font-semibold">Review Check-ins</p>
                <p className="text-sm text-slate-400">Monitor progress</p>
              </div>
            </button>
          </div>
        </div>

        {/* Clients Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Clients</h2>
              <p className="text-slate-400">Manage your clients and their plans from a single dashboard</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search clients..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                />
              </div>
              <button
                onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors duration-200"
              >
                {viewMode === 'grid' ? <List className="w-5 h-5" /> : <Grid3X3 className="w-5 h-5" />}
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
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                        <input type="checkbox" className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500" />
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Client</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Goal</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Weight</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Plans</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredClients.map((client, index) => (
                      <tr key={client.id} className="hover:bg-slate-800/30 transition-colors duration-200">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input type="radio" className="rounded border-slate-600 bg-slate-700 text-red-500 focus:ring-red-500" />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
                              <User className="w-5 h-5 text-slate-400" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-white">{client.name}</div>
                              <div className="text-sm text-slate-400">{client.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-sm font-medium border ${getGoalColor(client.goal)}`}>
                            {getGoalIcon(client.goal)}
                            <span className="capitalize">{client.goal}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-white">75.2 kg</div>
                          <div className="text-sm text-emerald-400">(-3.5)</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm ${client.nutritionPlan ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {client.nutritionPlan ? '✓' : '○'} Nutrition
                            </span>
                            <span className={`text-sm ${client.workoutAssignment ? 'text-emerald-400' : 'text-slate-500'}`}>
                              {client.workoutAssignment ? '✓' : '○'} Workout
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setSelectedClient(client)}
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onNavigateToClientPlan(client)}
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Target className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDuplicateClient(client)}
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onShareWithClient(client)}
                              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200">
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
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredClients.map((client, index) => (
                <div
                  key={client.id}
                  className="group bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6 hover:bg-slate-800/70 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-slate-700 flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white">{client.name}</h3>
                        <p className="text-slate-400 text-sm">{client.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${client.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`}></div>
                      <span className="text-xs text-slate-400">{client.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>

                  <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-lg text-sm font-medium border mb-4 ${getGoalColor(client.goal)}`}>
                    {getGoalIcon(client.goal)}
                    <span className="capitalize">{client.goal}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="text-center p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-white mb-1">
                        {client.nutritionPlan ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-slate-400">Nutrition</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-slate-700/50">
                      <div className="text-2xl font-bold text-white mb-1">
                        {client.workoutAssignment ? '✓' : '○'}
                      </div>
                      <div className="text-xs text-slate-400">Workout</div>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <button
                      onClick={() => setSelectedClient(client)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg text-slate-300 bg-slate-700 hover:bg-slate-600 font-medium text-sm transition-colors duration-200"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                    <button
                      onClick={() => onNavigateToClientPlan(client)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 font-medium text-sm transition-colors duration-200"
                    >
                      <Target className="w-4 h-4" />
                      <span>Plan</span>
                    </button>
                    <button
                      onClick={() => onDuplicateClient(client)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onShareWithClient(client)}
                      className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors duration-200"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {filteredClients.length === 0 && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-slate-400" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">No clients found</h3>
              <p className="text-slate-400 mb-6">Start by adding your first client to get started</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Client</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="relative w-full max-w-md">
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

              <form onSubmit={handleAddClient} className="p-6 space-y-4">
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

                <button
                  type="submit"
                  className="w-full px-6 py-4 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  Add Client
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};









