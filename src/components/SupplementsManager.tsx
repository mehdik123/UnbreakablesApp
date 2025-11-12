import React, { useState, useEffect } from 'react';
import { X, Plus, Check, Search, Pill, Droplets } from 'lucide-react';
import { Client } from '../types';
import { Supplement, ClientSupplement, categoryLabels, timingLabels } from '../types/supplements';
import { 
  listAllSupplements, 
  getClientSupplements, 
  assignSupplementToClient,
  removeSupplementFromClient,
  getClientHydration,
  upsertClientHydration
} from '../services/supplementsService';
import { useToast } from '../contexts/ToastContext';

interface SupplementsManagerProps {
  client: Client;
  onClose: () => void;
}

export const SupplementsManager: React.FC<SupplementsManagerProps> = ({ client, onClose }) => {
  const [allSupplements, setAllSupplements] = useState<Supplement[]>([]);
  const [clientSupplements, setClientSupplements] = useState<ClientSupplement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [waterTarget, setWaterTarget] = useState(3000);
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [client.id]);

  const loadData = async () => {
    setLoading(true);
    
    console.log('🔄 Starting to load supplements...');
    
    // Load all supplements
    const { data: supplements, error: suppError } = await listAllSupplements();
    
    console.log('📦 Raw response:', { 
      hasData: !!supplements, 
      dataLength: supplements?.length || 0, 
      hasError: !!suppError,
      error: suppError 
    });
    
    if (suppError) {
      toast.error('Failed to load supplements');
      console.error('❌ Supplements loading error:', suppError);
      console.error('❌ Error details:', JSON.stringify(suppError, null, 2));
    } else if (supplements && supplements.length > 0) {
      console.log('✅ Loaded supplements:', supplements.length);
      console.log('📋 First supplement:', supplements[0]);
      setAllSupplements(supplements);
    } else if (supplements) {
      console.log('⚠️ Query succeeded but returned empty array');
      setAllSupplements([]);
    } else {
      console.log('⚠️ No supplements returned from database (null/undefined)');
      setAllSupplements([]);
    }

    // Load client's assigned supplements
    const { data: clientSupps, error: clientError } = await getClientSupplements(client.id);
    if (clientError) {
      console.error('❌ Client supplements error:', clientError);
    } else if (clientSupps) {
      console.log('✅ Client has', clientSupps.length, 'supplements assigned');
      setClientSupplements(clientSupps);
    }

    // Load client's hydration goal
    const { data: hydration, error: hydrationError } = await getClientHydration(client.id);
    if (hydrationError) {
      console.log('ℹ️ No hydration goal set (this is normal for new clients)');
    } else if (hydration) {
      setWaterTarget(hydration.target_water_ml);
    }

    setLoading(false);
  };

  const isSupplementAssigned = (supplementId: string) => {
    return clientSupplements.some(cs => cs.supplement_id === supplementId && cs.is_active);
  };

  const handleToggleSupplement = async (supplement: Supplement) => {
    const assigned = isSupplementAssigned(supplement.id);

    if (assigned) {
      // Remove
      const clientSupplement = clientSupplements.find(cs => cs.supplement_id === supplement.id);
      if (clientSupplement) {
        const { error } = await removeSupplementFromClient(clientSupplement.id);
        if (error) {
          toast.error('Failed to remove supplement');
        } else {
          toast.success(`${supplement.name} removed`);
          loadData();
        }
      }
    } else {
      // Add
      const { error } = await assignSupplementToClient(
        client.id,
        supplement.id
      );
      if (error) {
        toast.error('Failed to assign supplement');
      } else {
        toast.success(`${supplement.name} assigned`);
        loadData();
      }
    }
  };

  const handleSaveHydration = async () => {
    const { error } = await upsertClientHydration(client.id, waterTarget);
    if (error) {
      toast.error('Failed to save hydration goal');
    } else {
      toast.success('Hydration goal saved');
    }
  };

  const filteredSupplements = allSupplements.filter(supp => {
    const matchesSearch = supp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supp.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || supp.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = Object.keys(categoryLabels);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700/50 w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 border-b border-slate-700/50 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                <Pill className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Supplements & Hydration</h2>
                <p className="text-slate-300 text-sm">Manage {client.name}'s supplements</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Hydration Section */}
          <div className="mb-8 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-2xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center">
                <Droplets className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Daily Water Intake</h3>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Target (ml per day)
                </label>
                <input
                  type="number"
                  value={waterTarget}
                  onChange={(e) => setWaterTarget(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
                  step={250}
                  min={1000}
                  max={10000}
                />
              </div>
              <div className="text-center">
                <div className="text-sm text-slate-400 mb-2">Liters</div>
                <div className="text-3xl font-black text-blue-400">{(waterTarget / 1000).toFixed(1)}L</div>
              </div>
              <button
                onClick={handleSaveHydration}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 rounded-xl text-white font-semibold transition-all duration-300 hover:scale-105 shadow-lg"
              >
                Save
              </button>
            </div>
          </div>

          {/* Supplements Section */}
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Select Supplements</h3>
            
            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search supplements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white placeholder-slate-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 bg-slate-800/50 border border-slate-600/50 rounded-xl text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => {
                  const info = categoryLabels[cat as keyof typeof categoryLabels];
                  return (
                    <option key={cat} value={cat}>
                      {info.emoji} {info.label}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Assigned Count */}
            <div className="mb-4 px-4 py-2 bg-purple-500/10 border border-purple-500/30 rounded-lg inline-block">
              <span className="text-purple-300 text-sm font-medium">
                {clientSupplements.length} supplements assigned
              </span>
            </div>

            {/* Supplements Grid */}
            {loading ? (
              <div className="text-center py-12">
                <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-slate-400">Loading supplements...</p>
              </div>
            ) : allSupplements.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Pill className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Supplements Found</h3>
                <p className="text-slate-400 mb-4">The supplements database is empty.</p>
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-yellow-200 text-sm">
                    ⚠️ Please run the <code className="px-2 py-1 bg-slate-700 rounded">create_supplements_system.sql</code> script in your Supabase SQL Editor to populate the supplements database.
                  </p>
                </div>
              </div>
            ) : filteredSupplements.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
                <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
                <p className="text-slate-400">Try a different search term or category filter.</p>
                <p className="text-slate-500 text-sm mt-2">Total supplements available: {allSupplements.length}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredSupplements.map(supplement => {
                  const assigned = isSupplementAssigned(supplement.id);
                  const categoryInfo = categoryLabels[supplement.category];
                  
                  return (
                    <button
                      key={supplement.id}
                      onClick={() => handleToggleSupplement(supplement)}
                      className={`text-left p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                        assigned
                          ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border-purple-500/50 shadow-lg shadow-purple-500/20'
                          : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600/50'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{categoryInfo.emoji}</span>
                          <div>
                            <h4 className="font-bold text-white text-sm">{supplement.name}</h4>
                            <p className="text-xs text-slate-400">{categoryInfo.label}</p>
                          </div>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                          assigned
                            ? 'bg-purple-500 border-purple-400'
                            : 'border-slate-600'
                        }`}>
                          {assigned && <Check className="w-4 h-4 text-white" />}
                        </div>
                      </div>
                      
                      <p className="text-xs text-slate-400 mb-2 line-clamp-2">{supplement.description}</p>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs px-2 py-1 bg-slate-700/50 rounded-md text-slate-300">
                          {timingLabels[supplement.recommended_timing]}
                        </span>
                        {assigned && (
                          <span className="text-xs text-purple-400 font-semibold">✓ Assigned</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

