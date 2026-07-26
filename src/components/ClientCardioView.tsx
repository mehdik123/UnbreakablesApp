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
  Dumbbell,
} from 'lucide-react';
import { Client, CardioAbsExercise, CardioItem, CardioPlan } from '../types';
import {
  getModalityMeta,
  modalityIsSprints,
  modalityShowsDistance,
  modalityShowsIncline,
  normalizeCardioPlan,
} from '../data/cardioPresets';
import { dbResolveClientIdByName, dbGetCardioPlan } from '../lib/db';
import { isAppOnline, loadClientOfflineSnapshot } from '../lib/offlineStore';
import { useClientLocale } from '../contexts/ClientLocaleContext';
import { ExerciseVideoEmbed } from './ExerciseVideoEmbed';

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
  const [plan, setPlan] = useState<CardioPlan>({ items: [], absExercises: [], notes: '' });
  const [loading, setLoading] = useState(true);
  const [playingAbsId, setPlayingAbsId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      let raw = client.cardioPlan;
      if (isAppOnline()) {
        const id = await dbResolveClientIdByName(client.name);
        if (id) {
          const { data } = await dbGetCardioPlan(id);
          if (data) raw = data;
        }
      } else {
        const snapshot = loadClientOfflineSnapshot(client.id);
        if (snapshot?.cardioPlan) raw = snapshot.cardioPlan;
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
      <div className="cardio-shell px-1">
        <div className="cardio-loading" aria-busy="true" aria-label="Loading">
          <div className="cardio-loading-pulse" />
          <div className="cardio-loading-pulse" style={{ height: 96 }} />
        </div>
      </div>
    );
  }

  const absList = plan.absExercises || [];
  const notes = (plan.notes || '').trim();
  const hasContent = plan.items.length > 0 || absList.length > 0 || !!notes;

  if (!hasContent) {
    return (
      <div className="cardio-shell px-1 py-6">
        <div className="workout-empty">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-red"
            style={{ background: 'linear-gradient(135deg, #ff8a5c, #e11d48)' }}
          >
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-saira text-xl font-semibold mb-2" style={{ color: 'var(--txt-hi)' }}>
            {t('cardio.emptyTitle')}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {t('cardio.emptyDesc')}
          </p>
        </div>
      </div>
    );
  }

  const weeklyMin = plan.items.reduce((sum, item) => sum + item.durationMin * item.timesPerWeek, 0);

  return (
    <div className="cardio-shell px-1 space-y-3">
      <div className="cardio-summary">
        <div className="cardio-summary-icon">
          <HeartPulse className="w-[22px] h-[22px]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-saira font-semibold text-[18px] truncate" style={{ color: 'var(--txt-hi)' }}>
            {t('nav.cardio')}
          </div>
          <div className="text-[12.5px] mt-0.5" style={{ color: 'var(--txt-mid)' }}>
            {t('home.cardioDesc')}
          </div>
        </div>
        {plan.items.length > 0 && (
          <div className="text-center shrink-0">
            <div className="font-saira font-bold text-[24px] leading-none tnum" style={{ color: 'var(--red)' }}>
              {weeklyMin}
            </div>
            <div className="text-[10px] uppercase tracking-[0.08em] mt-1" style={{ color: 'var(--txt-lo)' }}>
              {t('cardio.time')}
            </div>
          </div>
        )}
      </div>

      {notes && (
        <div className="cardio-note" style={{ margin: 0, borderRadius: 'var(--r-lg)' }}>
          <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--orange)' }} />
          <p className="text-[12.5px] leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--txt-mid)' }}>
            {notes}
          </p>
        </div>
      )}

      {plan.items.length > 0 && (
        <div>
          {plan.items.map((item) => (
            <CardioCard key={item.id} item={item} t={t} />
          ))}
        </div>
      )}

      {absList.length > 0 && (
        <div className="space-y-3 pt-1">
          <div className="workout-seclabel">
            <span>{t('cardio.absTitle')}</span>
            <span className="line" />
          </div>
          {absList.map((ex) => (
            <AbsCard
              key={ex.id}
              exercise={ex}
              t={t}
              isPlaying={playingAbsId === ex.id}
              onPlay={() => setPlayingAbsId(ex.id)}
              onClose={() => setPlayingAbsId(null)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Chip: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <span className="cardio-chip">
    <span className="cardio-chip-ic">{icon}</span>
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
    <div className="cardio-card">
      <div className="flex items-center gap-3.5 p-4">
        <div className={`w-12 h-12 rounded-[14px] flex items-center justify-center bg-gradient-to-br ${meta.gradient} shrink-0 shadow-soft`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-saira font-semibold text-[16px] truncate" style={{ color: 'var(--txt-hi)' }}>
            {item.name}
          </div>
          <div className="text-[11.5px] mt-0.5" style={{ color: 'var(--txt-lo)' }}>
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
        <div className="cardio-note">
          <StickyNote className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: 'var(--red)' }} />
          <p className="text-[12.5px] leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {item.whenNote}
          </p>
        </div>
      )}
    </div>
  );
};

const AbsCard: React.FC<{
  exercise: CardioAbsExercise;
  t: (key: string, params?: Record<string, unknown>) => string;
  isPlaying: boolean;
  onPlay: () => void;
  onClose: () => void;
}> = ({ exercise, t, isPlaying, onPlay, onClose }) => {
  return (
    <div className="cardio-card">
      <div className="flex items-center gap-3.5 p-4">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 shadow-soft"
          style={{ background: 'linear-gradient(135deg, var(--orange), #e11d48)' }}
        >
          <Dumbbell className="w-5 h-5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-saira font-semibold text-[16px] truncate" style={{ color: 'var(--txt-hi)' }}>
            {exercise.name}
          </div>
          <div className="text-[11.5px] mt-0.5 tnum" style={{ color: 'var(--txt-lo)' }}>
            {exercise.sets} {t('cardio.sets')} · {exercise.reps} {t('cardio.reps')}
            {exercise.weight > 0 ? ` · ${exercise.weight} ${t('cardio.kg')}` : ''}
            {exercise.restSec != null && exercise.restSec > 0
              ? ` · ${exercise.restSec}s ${t('cardio.rest')}`
              : ''}
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 flex flex-wrap gap-1.5">
        <Chip icon={<Activity className="w-3 h-3" />}>
          {exercise.sets} × {exercise.reps}
        </Chip>
        {exercise.weight > 0 && (
          <Chip icon={<Gauge className="w-3 h-3" />}>
            {exercise.weight} {t('cardio.kg')}
          </Chip>
        )}
        {exercise.restSec != null && exercise.restSec > 0 && (
          <Chip icon={<Clock className="w-3 h-3" />}>
            {exercise.restSec}s
          </Chip>
        )}
      </div>

      {exercise.videoUrl && (
        <ExerciseVideoEmbed
          videoUrl={exercise.videoUrl}
          title={exercise.name}
          formDemoLabel={t('cardio.formDemo')}
          watchDemoLabel={t('cardio.watchDemo')}
          offlineLabel={t('cardio.videoOffline')}
          isPlaying={isPlaying}
          onPlay={onPlay}
          onClose={onClose}
        />
      )}
    </div>
  );
};

export default ClientCardioView;
