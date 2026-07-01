import React, { useState, useEffect } from 'react';
import { Pill, Droplets, Clock, Info, Sparkles, ChevronDown } from 'lucide-react';
import { ClientSupplement, ClientHydration, groupSupplementsByTiming, categoryLabels } from '../types/supplements';
import { getClientSupplements, getClientHydration } from '../services/supplementsService';
import { useClientLocale } from '../contexts/ClientLocaleContext';

interface ClientSupplementsViewProps {
  clientId: string;
}

export const ClientSupplementsView: React.FC<ClientSupplementsViewProps> = ({ clientId }) => {
  const { t } = useClientLocale();
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
      <div className="supp-shell px-1">
        <div className="cardio-loading" aria-busy="true" aria-label="Loading">
          <div className="cardio-loading-pulse" />
          <div className="cardio-loading-pulse" style={{ height: 140 }} />
        </div>
      </div>
    );
  }

  const groupedSupplements = groupSupplementsByTiming(supplements);
  const timingKeys = Object.keys(groupedSupplements).filter(key => groupedSupplements[key as keyof typeof groupedSupplements]?.length > 0);

  return (
    <div className="supp-shell px-1 space-y-4">
      <div className="supp-summary">
        <div className="supp-summary-icon">
          <Pill className="w-[22px] h-[22px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-saira font-semibold text-[18px] truncate" style={{ color: 'var(--txt-hi)' }}>
            {t('supp.title')}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
            {t('home.supplementsDesc')}
          </div>
        </div>
        <div className="text-center shrink-0">
          <div className="font-saira font-bold text-[24px] leading-none tnum" style={{ color: 'var(--red)' }}>
            {supplements.length}
          </div>
          <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--txt-lo)' }}>
            {t('nav.supplements')}
          </div>
        </div>
      </div>

      <div className="supp-badge">
        <Sparkles className="w-4 h-4" style={{ color: 'var(--red)' }} />
        {t('supp.prescribed', { count: supplements.length })}
      </div>

      {hydration && (
        <div className="supp-hydro">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="supp-hydro-icon">
                <Droplets className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="font-saira font-semibold text-[16px]" style={{ color: 'var(--txt-hi)' }}>
                  {t('supp.waterGoal')}
                </h3>
                <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
                  {t('supp.waterSubtitle')}
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="supp-hydro-stat">{(hydration.target_water_ml / 1000).toFixed(1)}L</div>
              <div className="text-[12px] mt-1" style={{ color: 'var(--txt-lo)' }}>
                {t('supp.mlPerDay', { ml: hydration.target_water_ml })}
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="supp-hydro-split">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--txt-lo)' }}>
                {t('supp.morning')}
              </div>
              <div className="font-saira font-bold text-[15px] tnum mt-0.5" style={{ color: 'var(--txt-hi)' }}>
                {((hydration.target_water_ml * 0.3) / 1000).toFixed(1)}L
              </div>
            </div>
            <div className="supp-hydro-split">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--txt-lo)' }}>
                {t('supp.duringDay')}
              </div>
              <div className="font-saira font-bold text-[15px] tnum mt-0.5" style={{ color: 'var(--txt-hi)' }}>
                {((hydration.target_water_ml * 0.5) / 1000).toFixed(1)}L
              </div>
            </div>
            <div className="supp-hydro-split">
              <div className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--txt-lo)' }}>
                {t('supp.evening')}
              </div>
              <div className="font-saira font-bold text-[15px] tnum mt-0.5" style={{ color: 'var(--txt-hi)' }}>
                {((hydration.target_water_ml * 0.2) / 1000).toFixed(1)}L
              </div>
            </div>
          </div>
        </div>
      )}

      {supplements.length === 0 ? (
        <div className="workout-empty">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-red"
            style={{ background: 'var(--grad-red)' }}
          >
            <Pill className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-saira text-xl font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>
            {t('supp.noneTitle')}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {t('supp.noneBody')}
          </p>
        </div>
      ) : (
        <div>
          <div className="workout-seclabel">
            <span>{t('supp.subtitle')}</span>
            <span className="line" />
          </div>

          {timingKeys.map(timing => {
            const suppsForTiming = groupedSupplements[timing as keyof typeof groupedSupplements] || [];
            const isExpanded = expandedTiming === timing;
            
            return (
              <div key={timing} className="supp-timing">
                <button
                  type="button"
                  onClick={() => setExpandedTiming(isExpanded ? null : timing)}
                  className="supp-timing-btn"
                  aria-expanded={isExpanded}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="supp-timing-icon">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-left min-w-0">
                      <h3 className="font-saira font-semibold text-[16px] truncate" style={{ color: 'var(--txt-hi)' }}>
                        {t(`supp.timing.${timing}`)}
                      </h3>
                      <p className="text-[12px] mt-0.5" style={{ color: 'var(--txt-lo)' }}>
                        {suppsForTiming.length > 1 ? t('supp.many', { count: suppsForTiming.length }) : t('supp.one', { count: suppsForTiming.length })}
                      </p>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                    style={{ color: 'var(--txt-lo)' }}
                  />
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-0" style={{ borderTop: '1px solid var(--hair)' }}>
                    {suppsForTiming.map(clientSupplement => {
                      const supplement = clientSupplement.supplement;
                      if (!supplement) return null;
                      
                      const categoryInfo = categoryLabels[supplement.category];
                      
                      return (
                        <div key={clientSupplement.id} className="supp-item">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl flex-shrink-0">{categoryInfo.emoji}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-saira font-semibold text-[15px] mb-1" style={{ color: 'var(--txt-hi)' }}>
                                {supplement.name}
                              </h4>
                              <p className="text-[12.5px] mb-2 leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
                                {supplement.description}
                              </p>
                              
                              {supplement.benefits && supplement.benefits.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {supplement.benefits.slice(0, 3).map((benefit, idx) => (
                                    <span key={idx} className="supp-benefit">
                                      {benefit}
                                    </span>
                                  ))}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-[12.5px]">
                                <Info className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--blue)' }} />
                                <span className="font-medium" style={{ color: 'var(--txt-hi)' }}>
                                  {clientSupplement.custom_dosage || supplement.dosage_info || t('supp.asDirected')}
                                </span>
                              </div>
                              
                              {clientSupplement.notes && (
                                <div className="supp-note">
                                  {clientSupplement.notes}
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

      <div className="supp-tips">
        <h3 className="font-saira font-semibold text-[16px] mb-3 flex items-center gap-2" style={{ color: 'var(--txt-hi)' }}>
          <Sparkles className="w-4 h-4" style={{ color: 'var(--red)' }} />
          {t('supp.tipsTitle')}
        </h3>
        <ul className="space-y-2.5">
          <li>
            <span>💊</span>
            <span>{t('supp.tip1')}</span>
          </li>
          <li>
            <span>🍽️</span>
            <span>{t('supp.tip2')}</span>
          </li>
          <li>
            <span>⏰</span>
            <span>{t('supp.tip3')}</span>
          </li>
          <li>
            <span>📝</span>
            <span>{t('supp.tip4')}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
