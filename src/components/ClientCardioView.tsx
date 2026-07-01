import React, { useEffect, useState } from 'react';
import {
  HeartPulse,
  Footprints,
  TreePine,
  Wind,
  Bike,
  Timer,
  Activity,
  Clock,
  Gauge,
  Mountain,
  StickyNote,
  Loader2,
} from 'lucide-react';
import { Client, CardioItem, CardioPlan } from '../types';
import {
  getModalityMeta,
  modalityIsSprints,
  modalityShowsDistance,
  modalityShowsIncline,
  normalizeCardioPlan,
} from '../data/cardioPresets';
import { dbResolveClientIdByName, dbGetCardioPlan } from '../lib/db';
import { useClientLocale } from '../contexts/ClientLocaleContext';

interface ClientCardioViewProps {
  client: Client;
  isDark?: boolean;
}

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Footprints,
  TreePine,
  Wind,
  Bike,
  Timer,
  Activity,
};

const WHEN_KEYS: Record<CardioItem['when'], string> = {
  after_workout: 'cardio.afterWorkout',
  off_day: 'cardio.offDay',
  morning: 'cardio.morning',
  evening: 'cardio.evening',
};

export const ClientCardioView: React.FC<ClientCardioViewProps> = ({ client }) => {
  const { t } = useClientLocale();
  const [plan, setPlan] = useState<CardioPlan>({ items: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const id = await dbResolveClientIdByName(client.name);
      let raw = client.cardioPlan;
      if (id) {
        const { data } = await dbGetCardioPlan(id);
        if (data) raw = data;
      }
      if (!cancelled) {
        setPlan(normalizeCardioPlan(raw));
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [client.name, client.cardioPlan]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--red)' }} />
      </div>
    );
  }

  if (plan.items.length === 0) {
    return (
      <div className="rounded-2xl p-10 text-center" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
        <div className="w-14 h-14 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br from-red-500 to-rose-500">
          <HeartPulse className="w-7 h-7 text-white" />
        </div>
        <p className="text-base font-semibold font-display" style={{ color: 'var(--txt-hi)' }}>
          {t('cardio.emptyTitle')}
        </p>
        <p className="text-sm mt-1.5" style={{ color: 'var(--txt-lo)' }}>
          {t('cardio.emptyDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {plan.items.map((item) => (
        <CardioCard key={item.id} item={item} t={t} />
      ))}
    </div>
  );
};

const Chip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span
    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11.5px] font-medium"
    style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)' }}
  >
    <span style={{ color: 'var(--red)' }}>{icon}</span>
    {children}
  </span>
);

const CardioCard: React.FC<{
  item: CardioItem;
  t: (key: string, params?: Record<string, unknown>) => string;
}> = ({ item, t }) => {
  const meta = getModalityMeta(item.modality);
  const Icon = ICONS[meta.icon] || Activity;
  const isSprints = modalityIsSprints(item.modality);

  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
      <div className="flex items-center gap-3 p-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br ${meta.gradient} shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-sm" style={{ color: 'var(--txt-hi)' }}>
            {item.name}
          </div>
          <div className="text-[11px] mt-0.5" style={{ color: 'var(--txt-lo)' }}>
            {t('cardio.timesPerWeek', { count: item.timesPerWeek })}
            {' · '}
            {t(WHEN_KEYS[item.when])}
          </div>
        </div>
      </div>

      <div className="px-4 pb-4 flex flex-wrap gap-1.5">
        <Chip icon={<Clock className="w-3 h-3" />}>
          {item.durationMin} {t('cardio.min')}
        </Chip>
        {item.speedKmh != null && (
          <Chip icon={<Gauge className="w-3 h-3" />}>
            {item.speedKmh} km/h
          </Chip>
        )}
        {modalityShowsIncline(item.modality) && item.inclinePct != null && (
          <Chip icon={<Mountain className="w-3 h-3" />}>
            {item.inclinePct}%
          </Chip>
        )}
        {modalityShowsDistance(item.modality) && item.distanceKm != null && (
          <Chip icon={<Activity className="w-3 h-3" />}>
            {item.distanceKm} km
          </Chip>
        )}
        {isSprints && item.rounds != null && (
          <Chip icon={<Timer className="w-3 h-3" />}>
            {item.rounds}× {item.workSec}s / {item.restSec}s
          </Chip>
        )}
      </div>

      {item.whenNote && (
        <div className="mx-4 mb-4 rounded-xl p-3 flex gap-2" style={{ background: 'var(--surface-2)' }}>
          <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {item.whenNote}
          </p>
        </div>
      )}
    </div>
  );
};

export default ClientCardioView;
