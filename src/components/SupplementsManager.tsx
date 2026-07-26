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
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm p-0 sm:p-4">
      <div
        className="w-full sm:max-w-3xl sm:rounded-2xl rounded-t-2xl overflow-hidden flex flex-col"
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--hair)',
          maxHeight: '92dvh',
        }}
      >
        <div
          className="flex items-center justify-between gap-3 px-3.5 py-3 shrink-0"
          style={{ borderBottom: '1px solid var(--hair)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: 'var(--grad-coral)' }}
            >
              <Pill className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm sm:text-base font-bold truncate" style={{ color: 'var(--txt-hi)' }}>
                Supplements & Hydration
              </h2>
              <p className="text-[11px] truncate" style={{ color: 'var(--txt-mid)' }}>
                {client.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'var(--surface-2)' }}
            aria-label="Close"
          >
            <X className="w-5 h-5" style={{ color: 'var(--txt-mid)' }} />
          </button>
        </div>

        <div className="p-3 sm:p-4 overflow-y-auto flex-1" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
          <div
            className="mb-3 rounded-xl p-3"
            style={{ background: 'rgba(59,130,246,.08)', border: '1px solid rgba(59,130,246,.25)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Droplets className="w-4 h-4" style={{ color: 'var(--blue)' }} />
              <h3 className="text-sm font-semibold" style={{ color: 'var(--txt-hi)' }}>Daily water</h3>
            </div>
            <div className="flex items-end gap-2">
              <label className="flex-1 min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--txt-lo)' }}>
                  Target (ml)
                </span>
                <input
                  type="number"
                  value={waterTarget}
                  onChange={(e) => setWaterTarget(Number(e.target.value))}
                  className="w-full px-2.5 py-2 rounded-lg outline-none tnum"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', fontSize: 16 }}
                  step={250}
                  min={1000}
                  max={10000}
                />
              </label>
              <div className="text-center px-1 shrink-0">
                <div className="text-[10px]" style={{ color: 'var(--txt-lo)' }}>Liters</div>
                <div className="text-lg font-bold tnum" style={{ color: 'var(--blue)' }}>{(waterTarget / 1000).toFixed(1)}L</div>
              </div>
              <button
                onClick={handleSaveHydration}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-white shrink-0"
                style={{ background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', minHeight: 40 }}
              >
                Save
              </button>
            </div>
          </div>

          <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>Select supplements</h3>

          <div className="flex flex-col sm:flex-row gap-2 mb-3">
            <div className="flex-1 relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--txt-lo)' }} />
              <input
                type="text"
                placeholder="Search…"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-lg outline-none"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', fontSize: 16 }}
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-2.5 py-2 rounded-lg outline-none text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', fontSize: 16 }}
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

          <div className="mb-2 text-[11px] font-medium" style={{ color: 'var(--violet)' }}>
            {clientSupplements.length} assigned
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-8 h-8 border-2 border-[color:var(--red)] border-t-transparent rounded-full mx-auto mb-2" />
              <p className="text-xs" style={{ color: 'var(--txt-lo)' }}>Loading…</p>
            </div>
          ) : allSupplements.length === 0 ? (
            <div className="text-center py-6 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
              <Pill className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--txt-lo)' }} />
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--txt-hi)' }}>No supplements found</h3>
              <p className="text-xs px-4" style={{ color: 'var(--txt-mid)' }}>
                Run create_supplements_system.sql in Supabase to populate the database.
              </p>
            </div>
          ) : filteredSupplements.length === 0 ? (
            <div className="text-center py-6 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
              <Search className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--txt-lo)' }} />
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--txt-hi)' }}>No results</h3>
              <p className="text-xs" style={{ color: 'var(--txt-mid)' }}>Try another search or category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredSupplements.map(supplement => {
                const assigned = isSupplementAssigned(supplement.id);
                const categoryInfo = categoryLabels[supplement.category];

                return (
                  <button
                    key={supplement.id}
                    onClick={() => handleToggleSupplement(supplement)}
                    className="text-left p-2.5 rounded-xl transition-transform active:scale-[0.99]"
                    style={{
                      background: assigned ? 'rgba(139,92,246,.12)' : 'var(--surface-2)',
                      border: assigned ? '1px solid rgba(139,92,246,.45)' : '1px solid var(--hair)',
                      minHeight: 48,
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-base shrink-0">{categoryInfo.emoji}</span>
                        <div className="min-w-0">
                          <h4 className="font-semibold text-xs truncate" style={{ color: 'var(--txt-hi)' }}>{supplement.name}</h4>
                          <p className="text-[10px]" style={{ color: 'var(--txt-lo)' }}>{categoryInfo.label}</p>
                        </div>
                      </div>
                      <div
                        className="w-5 h-5 rounded-full border flex items-center justify-center shrink-0"
                        style={{
                          background: assigned ? 'var(--violet)' : 'transparent',
                          borderColor: assigned ? 'var(--violet)' : 'var(--hair-strong)',
                        }}
                      >
                        {assigned && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </div>
                    {supplement.description && (
                      <p className="text-[10px] line-clamp-2 mb-1.5" style={{ color: 'var(--txt-mid)' }}>{supplement.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ background: 'var(--surface-3)', color: 'var(--txt-mid)' }}
                      >
                        {timingLabels[supplement.recommended_timing]}
                      </span>
                      {assigned && (
                        <span className="text-[10px] font-semibold" style={{ color: 'var(--violet)' }}>Assigned</span>
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
  );
};

