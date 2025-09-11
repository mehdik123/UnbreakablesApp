import React, { useState } from 'react';
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
  Copy
} from 'lucide-react';
import { Client, ClientWorkoutAssignment } from '../types';

interface ClientsManagerProps {
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

export const ClientsManager: React.FC<ClientsManagerProps> = ({
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
  const [newClient, setNewClient] = useState({
    name: '',
    email: '',
    phone: '',
    goal: 'maintenance' as const,
    numberOfWeeks: 4
  });

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         client.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGoal = filterGoal === 'all' || client.goal === filterGoal;
    return matchesSearch && matchesGoal;
  });

  const handleAddClient = () => {
    const client: Client = {
      id: Date.now().toString(),
      name: newClient.name,
      email: newClient.email,
      phone: newClient.phone,
      goal: newClient.goal,
      numberOfWeeks: newClient.numberOfWeeks,
      startDate: new Date(),
      isActive: true,
      favorites: [],
      weightLog: []
    };
    onAddClient(client);
    setShowAddModal(false);
    setNewClient({ name: '', email: '', phone: '', goal: 'maintenance', numberOfWeeks: 4 });
  };

  const getGoalColor = (goal: string) => {
    switch (goal) {
      case 'shredding': return 'bg-red-100 text-red-800';
      case 'bulking': return 'bg-green-100 text-green-800';
      case 'maintenance': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getGoalIcon = (goal: string) => {
    switch (goal) {
      case 'shredding': return '🔥';
      case 'bulking': return '💪';
      case 'maintenance': return '⚖️';
      default: return '🎯';
    }
  };

  return (
    <div className={`p-8 rounded-3xl shadow-2xl border-2 transition-all duration-200 ${
      isDark ? 'bg-black border-white text-white' : 'bg-white border-black text-black shadow-xl'
    }`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-3xl flex items-center justify-center shadow-2xl" style={{backgroundColor: '#dc1e3a'}}>
            <Users className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-bold" style={{color: '#dc1e3a'}}>Clients Manager</h2>
            <p className={`text-lg ${isDark ? 'text-white' : 'text-black'}`}>
              Manage your clients and their progress
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold text-white transition-all duration-200"
          style={{backgroundColor: '#dc1e3a'}}
        >
          <Plus className="w-5 h-5" />
          <span>Add Client</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-10 pr-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
              isDark 
                ? 'bg-black border-white text-white placeholder-white' 
                : 'bg-white border-black text-black placeholder-black'
            }`}
          />
        </div>
        <select
          value={filterGoal}
          onChange={(e) => setFilterGoal(e.target.value)}
          className={`px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
            isDark 
              ? 'bg-black border-white text-white' 
              : 'bg-white border-black text-black'
          }`}
        >
          <option value="all">All Goals</option>
          <option value="shredding">Shredding</option>
          <option value="bulking">Bulking</option>
          <option value="maintenance">Maintenance</option>
        </select>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div
            key={client.id}
            className={`p-6 rounded-3xl border-2 transition-all duration-200 hover:shadow-lg ${
              isDark 
                ? 'bg-black border-white hover:border-gray-300' 
                : 'bg-white border-black hover:border-gray-600'
            }`}
          >
            {/* Client Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-1">{client.name}</h3>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getGoalColor(client.goal)}`}>
                    {getGoalIcon(client.goal)} {client.goal}
                  </span>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    client.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {client.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <button className="p-2 rounded-xl hover:bg-gray-600 transition-all duration-200">
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>

            {/* Client Info */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{client.email}</span>
              </div>
              {client.phone && (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <span className="text-sm">{client.phone}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span className="text-sm">Since {client.startDate.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-sm">{client.numberOfWeeks} weeks program</span>
              </div>
            </div>

            {/* Progress Indicators */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 mx-auto mb-1">
                  <Utensils className="w-4 h-4 text-blue-600" />
                </div>
                <span className="text-xs font-semibold">
                  {client.nutritionPlan ? 'Plan Set' : 'No Plan'}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 mx-auto mb-1">
                  <Dumbbell className="w-4 h-4 text-purple-600" />
                </div>
                <span className="text-xs font-semibold">
                  {client.workoutAssignment ? 'Workout Set' : 'No Workout'}
                </span>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 mx-auto mb-1">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-xs font-semibold">
                  {client.weightLog.length} Logs
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedClient(client)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{backgroundColor: '#dc1e3a'}}
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
              <button
                onClick={() => onNavigateToClientPlan(client)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{backgroundColor: '#dc1e3a'}}
              >
                <Target className="w-3 h-3" />
                <span>Access Plan</span>
              </button>
              <button
                onClick={() => onDuplicateClient(client)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{backgroundColor: '#dc1e3a'}}
              >
                <Copy className="w-3 h-3" />
                <span>Duplicate</span>
              </button>
              <button 
                onClick={() => onShareWithClient(client)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                style={{backgroundColor: '#dc1e3a'}}
              >
                <Share2 className="w-3 h-3" />
                <span>Share</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Client Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-md w-full mx-6 ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600">Add New Client</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2">Name</label>
                <input
                  type="text"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="Client name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Email</label>
                <input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="client@email.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                  placeholder="+1234567890"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Goal</label>
                <select
                  value={newClient.goal}
                  onChange={(e) => setNewClient({ ...newClient, goal: e.target.value as any })}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value="maintenance">Maintenance</option>
                  <option value="shredding">Shredding</option>
                  <option value="bulking">Bulking</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-semibold mb-2">Number of Weeks</label>
                <select
                  value={newClient.numberOfWeeks}
                  onChange={(e) => setNewClient({ ...newClient, numberOfWeeks: parseInt(e.target.value) })}
                  className={`w-full px-4 py-3 rounded-2xl border-2 text-lg font-semibold ${
                    isDark 
                      ? 'bg-gray-600 border-gray-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                  }`}
                >
                  <option value={4}>4 weeks</option>
                  <option value={6}>6 weeks</option>
                  <option value={8}>8 weeks</option>
                  <option value={12}>12 weeks</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className={`px-6 py-3 rounded-2xl text-lg font-semibold ${
                  isDark 
                    ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handleAddClient}
                disabled={!newClient.name || !newClient.email}
                className="px-6 py-3 rounded-2xl text-lg font-semibold bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Client Detail Modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`p-8 rounded-3xl shadow-2xl max-w-4xl w-full mx-6 max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'
          }`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-blue-600">{selectedClient.name}</h3>
              <button
                onClick={() => setSelectedClient(null)}
                className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white hover:bg-gray-700 transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Client Info */}
              <div className={`p-6 rounded-3xl border-2 ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className="text-xl font-bold mb-4">Client Information</h4>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-400" />
                    <span>{selectedClient.email}</span>
                  </div>
                  {selectedClient.phone && (
                    <div className="flex items-center space-x-3">
                      <Phone className="w-5 h-5 text-gray-400" />
                      <span>{selectedClient.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-3">
                    <Calendar className="w-5 h-5 text-gray-400" />
                    <span>Started: {selectedClient.startDate.toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Target className="w-5 h-5 text-gray-400" />
                    <span className={`px-2 py-1 rounded-full text-sm font-semibold ${getGoalColor(selectedClient.goal)}`}>
                      {getGoalIcon(selectedClient.goal)} {selectedClient.goal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Progress Summary */}
              <div className={`p-6 rounded-3xl border-2 ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <h4 className="text-xl font-bold mb-4">Progress Summary</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Nutrition Plan</span>
                    <div className="flex items-center space-x-2">
                      {selectedClient.nutritionPlan ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                      <span className={selectedClient.nutritionPlan ? 'text-green-600' : 'text-red-600'}>
                        {selectedClient.nutritionPlan ? 'Active' : 'Not Set'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Workout Plan</span>
                    <div className="flex items-center space-x-2">
                      {selectedClient.workoutAssignment ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <X className="w-5 h-5 text-red-500" />
                      )}
                      <span className={selectedClient.workoutAssignment ? 'text-green-600' : 'text-red-600'}>
                        {selectedClient.workoutAssignment ? 'Active' : 'Not Set'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Weight Logs</span>
                    <span className="font-semibold">{selectedClient.weightLog.length} entries</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Favorites</span>
                    <span className="font-semibold">{selectedClient.favorites.length} meals</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-6">
              <button className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-gray-600 hover:bg-gray-700 text-white transition-all duration-200">
                <Share2 className="w-5 h-5" />
                <span>Share Progress</span>
              </button>
              <button className="flex items-center space-x-2 px-6 py-3 rounded-2xl text-lg font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200">
                <Edit3 className="w-5 h-5" />
                <span>Edit Client</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
