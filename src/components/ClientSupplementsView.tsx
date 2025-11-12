import React, { useState, useEffect } from 'react';
import { Pill, Droplets, Clock, Info, Sparkles } from 'lucide-react';
import { ClientSupplement, ClientHydration, groupSupplementsByTiming, timingLabels, categoryLabels } from '../types/supplements';
import { getClientSupplements, getClientHydration } from '../services/supplementsService';

interface ClientSupplementsViewProps {
  clientId: string;
}

export const ClientSupplementsView: React.FC<ClientSupplementsViewProps> = ({ clientId }) => {
  const [supplements, setSupplements] = useState<ClientSupplement[]>([]);
  const [hydration, setHydration] = useState<ClientHydration | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedTiming, setExpandedTiming] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    
    const { data: supps } = await getClientSupplements(clientId);
    if (supps) {
      setSupplements(supps);
    }

    const { data: hydro } = await getClientHydration(clientId);
    if (hydro) {
      setHydration(hydro);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  const groupedSupplements = groupSupplementsByTiming(supplements);
  const timingKeys = Object.keys(groupedSupplements).filter(key => groupedSupplements[key as keyof typeof groupedSupplements]?.length > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 backdrop-blur-xl rounded-2xl border border-purple-500/30 p-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
            <Pill className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Your Supplements</h2>
            <p className="text-purple-200/70 text-sm">Optimized supplement schedule</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 px-4 py-2 bg-purple-500/20 backdrop-blur-sm rounded-xl border border-purple-500/30">
          <Sparkles className="w-4 h-4 text-purple-300" />
          <span className="text-sm text-purple-200 font-medium">
            {supplements.length} supplements prescribed by your coach
          </span>
        </div>
      </div>

      {/* Hydration Card */}
      {hydration && (
        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-2xl border border-blue-500/30 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Droplets className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Daily Water Goal</h3>
                <p className="text-blue-200/70 text-sm">Stay hydrated throughout the day</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-4xl font-black text-blue-400">{(hydration.target_water_ml / 1000).toFixed(1)}L</div>
              <div className="text-sm text-blue-300">{hydration.target_water_ml} ml/day</div>
            </div>
          </div>
          
          {/* Water intake tips */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="px-3 py-2 bg-blue-500/10 rounded-lg">
              <div className="text-xs text-blue-300 font-medium">Morning</div>
              <div className="text-sm text-white font-bold">{((hydration.target_water_ml * 0.3) / 1000).toFixed(1)}L</div>
            </div>
            <div className="px-3 py-2 bg-blue-500/10 rounded-lg">
              <div className="text-xs text-blue-300 font-medium">During Day</div>
              <div className="text-sm text-white font-bold">{((hydration.target_water_ml * 0.5) / 1000).toFixed(1)}L</div>
            </div>
            <div className="px-3 py-2 bg-blue-500/10 rounded-lg">
              <div className="text-xs text-blue-300 font-medium">Evening</div>
              <div className="text-sm text-white font-bold">{((hydration.target_water_ml * 0.2) / 1000).toFixed(1)}L</div>
            </div>
          </div>
        </div>
      )}

      {/* Supplements by Timing */}
      {supplements.length === 0 ? (
        <div className="text-center py-12 bg-slate-800/30 rounded-2xl border border-slate-700/50">
          <Pill className="w-16 h-16 text-slate-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No Supplements Assigned</h3>
          <p className="text-slate-400">Your coach hasn't assigned any supplements yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {timingKeys.map(timing => {
            const suppsForTiming = groupedSupplements[timing as keyof typeof groupedSupplements] || [];
            const isExpanded = expandedTiming === timing;
            
            return (
              <div key={timing} className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 overflow-hidden">
                {/* Timing Header */}
                <button
                  onClick={() => setExpandedTiming(isExpanded ? null : timing)}
                  className="w-full p-5 flex items-center justify-between hover:bg-slate-700/30 transition-all"
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <h3 className="text-lg font-bold text-white">{timingLabels[timing as keyof typeof timingLabels]}</h3>
                      <p className="text-sm text-slate-400">{suppsForTiming.length} supplement{suppsForTiming.length > 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <div className={`text-purple-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    ▼
                  </div>
                </button>

                {/* Supplements List */}
                {isExpanded && (
                  <div className="border-t border-slate-700/50 p-5 space-y-3 bg-slate-800/30">
                    {suppsForTiming.map(clientSupplement => {
                      const supplement = clientSupplement.supplement;
                      if (!supplement) return null;
                      
                      const categoryInfo = categoryLabels[supplement.category];
                      
                      return (
                        <div key={clientSupplement.id} className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <div className="flex items-start space-x-3">
                            <div className="text-2xl flex-shrink-0">{categoryInfo.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-bold text-white mb-1">{supplement.name}</h4>
                              <p className="text-sm text-slate-400 mb-2">{supplement.description}</p>
                              
                              {/* Benefits */}
                              {supplement.benefits && supplement.benefits.length > 0 && (
                                <div className="mb-2">
                                  <div className="flex flex-wrap gap-1">
                                    {supplement.benefits.slice(0, 3).map((benefit, idx) => (
                                      <span key={idx} className="px-2 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded-full">
                                        ✨ {benefit}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                              
                              {/* Dosage */}
                              <div className="flex items-center space-x-2 text-sm">
                                <Info className="w-4 h-4 text-blue-400 flex-shrink-0" />
                                <span className="text-blue-300 font-medium">
                                  {clientSupplement.custom_dosage || supplement.dosage_info || 'As directed'}
                                </span>
                              </div>
                              
                              {/* Custom Notes */}
                              {clientSupplement.notes && (
                                <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                  <p className="text-xs text-yellow-200">📝 {clientSupplement.notes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick Tips */}
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-2xl border border-indigo-500/30 p-6">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center">
          <Sparkles className="w-5 h-5 mr-2 text-indigo-400" />
          Supplement Tips
        </h3>
        <ul className="space-y-2 text-sm text-slate-300">
          <li className="flex items-start">
            <span className="mr-2">💊</span>
            <span>Always take supplements with water unless specified otherwise</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">🍽️</span>
            <span>Fat-soluble vitamins (A, D, E, K) work best with meals containing fats</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">⏰</span>
            <span>Consistency is key - try to take supplements at the same time each day</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">📝</span>
            <span>Track how you feel and report any concerns to your coach</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

