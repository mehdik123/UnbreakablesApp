import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Download, ImageIcon } from 'lucide-react';
import type { Client } from '../types';
import { dbGetClientPhotos, type WeeklyPhoto } from '../lib/db';
import { getClientWeightLogs } from '../lib/progressTracking';
import {
  loadStoryImage,
  renderCheckInStory,
  renderReceiptStory,
  renderTrendStory,
  type StoryKind,
  type StoryPose,
} from '../utils/instagramStory';

type Props = {
  clients: Client[];
  onBack: () => void;
};

const POSES: StoryPose[] = ['front', 'side', 'back'];
const KINDS: { id: StoryKind; label: string }[] = [
  { id: 'checkin', label: 'Check-in' },
  { id: 'trend', label: 'Trend' },
  { id: 'receipt', label: 'Receipt' },
];

function countSessions(client: Client): number {
  const weeks = client.workoutAssignment?.weeks || [];
  let days = 0;
  for (const week of weeks) {
    for (const day of week.days || []) {
      const logged = (day.exercises || []).some((exercise) =>
        (exercise.sets || []).some((set) => set.completed)
      );
      if (logged) days += 1;
    }
  }
  return days;
}

function countPhotoCheckins(photos: WeeklyPhoto[]): number {
  return new Set(photos.filter((photo) => photoUrl(photo)).map((photo) => photo.week)).size;
}

function photoUrl(photo: WeeklyPhoto): string {
  return photo.imageUrl || photo.image_url || '';
}

function firstName(name: string): string {
  return String(name || '').trim().split(/\s+/)[0] || '';
}

function weightNearWeek(
  logs: { weight: number; weekNumber?: number; date: Date }[],
  week: number,
  fallback: number | undefined,
  which: 'earliest' | 'latest'
): number | null {
  const withWeek = logs.filter((row) => row.weekNumber === week && Number.isFinite(row.weight));
  if (withWeek.length) return withWeek[withWeek.length - 1].weight;
  const sorted = [...logs].filter((row) => Number.isFinite(row.weight)).sort((a, b) => a.date.getTime() - b.date.getTime());
  if (which === 'earliest') return sorted[0]?.weight ?? fallback ?? null;
  return sorted[sorted.length - 1]?.weight ?? fallback ?? null;
}

export const CoachStoryStudio: React.FC<Props> = ({ clients, onBack }) => {
  const activeClients = useMemo(
    () => clients.filter((c) => !c.isArchived).sort((a, b) => a.name.localeCompare(b.name)),
    [clients]
  );
  const [kind, setKind] = useState<StoryKind>('checkin');
  const [clientId, setClientId] = useState(activeClients[0]?.id || '');
  const [pose, setPose] = useState<StoryPose>('front');
  const [startWeek, setStartWeek] = useState<number | null>(null);
  const [endWeek, setEndWeek] = useState<number | null>(null);
  const [showName, setShowName] = useState(true);
  const [photos, setPhotos] = useState<WeeklyPhoto[]>([]);
  const [weights, setWeights] = useState<{ weight: number; weekNumber?: number; date: Date }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [rendering, setRendering] = useState(false);
  const [saving, setSaving] = useState(false);

  const client = activeClients.find((c) => c.id === clientId) || null;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setPhotos([]);
    setWeights([]);
    (async () => {
      try {
        const [photoRes, logs] = await Promise.all([
          dbGetClientPhotos(clientId),
          getClientWeightLogs(clientId).catch(() => [] as { weight: number; date: Date }[]),
        ]);
        if (cancelled) return;
        setPhotos(photoRes.data || []);
        const fromClient = client?.weightLog || [];
        const merged = (logs.length ? logs : fromClient).map((row) => ({
          weight: Number(row.weight),
          weekNumber: 'weekNumber' in row ? row.weekNumber : undefined,
          date: row.date instanceof Date ? row.date : new Date(row.date),
        }));
        setWeights(merged);
      } catch {
        if (!cancelled) setError('Could not load this client. Try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [clientId]);

  const posePhotos = useMemo(
    () => photos.filter((p) => p.type === pose && photoUrl(p)),
    [photos, pose]
  );
  const weeks = useMemo(
    () => [...new Set(posePhotos.map((p) => p.week))].sort((a, b) => a - b),
    [posePhotos]
  );

  useEffect(() => {
    if (!weeks.length) {
      setStartWeek(null);
      setEndWeek(null);
      return;
    }
    setStartWeek(weeks[0]);
    setEndWeek(weeks[weeks.length - 1]);
  }, [clientId, pose, weeks.join(',')]);

  const startPhoto = posePhotos.find((p) => p.week === startWeek) || null;
  const endPhoto = posePhotos.find((p) => p.week === endWeek) || null;

  const sortedWeights = useMemo(
    () => [...weights].filter((row) => Number.isFinite(row.weight)).sort((a, b) => a.date.getTime() - b.date.getTime()),
    [weights]
  );

  useEffect(() => {
    let cancelled = false;
    if (!client) {
      setPreviewUrl('');
      return;
    }
    if (kind === 'checkin' && (startWeek == null || endWeek == null)) {
      setPreviewUrl('');
      return;
    }
    setRendering(true);
    (async () => {
      try {
        const name = showName ? firstName(client.name) : null;
        let canvas: HTMLCanvasElement;
        if (kind === 'trend') {
          const points = sortedWeights.map((row) => row.weight);
          if (client.startingWeight && points.length && points[0] !== client.startingWeight) {
            points.unshift(client.startingWeight);
          }
          canvas = await renderTrendStory({
            firstName: name,
            goal: client.goal,
            points,
          });
        } else if (kind === 'receipt') {
          canvas = await renderReceiptStory({
            firstName: name,
            goal: client.goal,
            weeksOpen: client.workoutAssignment?.weeks?.length || client.workoutAssignment?.currentWeek || 0,
            sessionsLogged: countSessions(client),
            photoCheckins: countPhotoCheckins(photos),
            weightLogs: sortedWeights.length,
          });
        } else {
          const [startImage, endImage] = await Promise.all([
            startPhoto ? loadStoryImage(photoUrl(startPhoto)).catch(() => null) : Promise.resolve(null),
            endPhoto ? loadStoryImage(photoUrl(endPhoto)).catch(() => null) : Promise.resolve(null),
          ]);
          if (cancelled || startWeek == null || endWeek == null) return;
          canvas = await renderCheckInStory({
            firstName: name,
            goal: client.goal,
            pose,
            startWeek,
            endWeek,
            startWeightKg: weightNearWeek(weights, startWeek, client.startingWeight, 'earliest'),
            endWeightKg: weightNearWeek(weights, endWeek, undefined, 'latest'),
            startImage,
            endImage,
          });
        }
        if (!cancelled) setPreviewUrl(canvas.toDataURL('image/png'));
      } catch {
        if (!cancelled) setError('Could not build the story preview.');
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, client, pose, startWeek, endWeek, showName, startPhoto, endPhoto, weights, sortedWeights, photos]);

  const saveStory = async () => {
    if (!previewUrl || !client) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch(previewUrl);
      const blob = await res.blob();
      const file = new File([blob], `unbreakables-${kind}-${firstName(client.name) || 'client'}.png`, {
        type: 'image/png',
      });
      const canShare = typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare({ files: [file] }));
      if (canShare) {
        await navigator.share({ files: [file], title: 'Unbreakables check-in' });
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      if ((err as { name?: string })?.name !== 'AbortError') {
        setError('Could not save the story. Try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="coach-plan">
      <div className="coach-plan-header">
        <div className="max-w-6xl mx-auto px-3 sm:px-6">
          <div className="coach-plan-headrow">
            <div className="flex items-center gap-2 min-w-0">
              <button type="button" onClick={onBack} className="coach-touch rounded-xl text-[color:var(--txt-lo)]" title="Back">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold font-display text-[color:var(--txt-hi)] truncate">Stories</h1>
                <p className="text-[11px] sm:text-sm text-[color:var(--txt-lo)]">Coach only · Instagram story</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6 pb-28 grid gap-4 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)]">
        <div className="rounded-2xl p-4 space-y-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--txt-lo)]">Story</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {KINDS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setKind(item.id)}
                  className="min-h-11 rounded-xl text-sm font-semibold"
                  style={{
                    background: kind === item.id ? 'var(--grad-red)' : 'var(--surface-2)',
                    color: kind === item.id ? '#fff' : 'var(--txt-hi)',
                    border: '1px solid var(--hair)',
                    touchAction: 'manipulation',
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--txt-lo)]">Client</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className="mt-1 w-full min-h-12 rounded-xl px-3 text-[color:var(--txt-hi)]"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
            >
              {activeClients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>

          {kind === 'checkin' && (
          <>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--txt-lo)]">Pose</span>
            <div className="mt-1 grid grid-cols-3 gap-2">
              {POSES.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setPose(item)}
                  className="min-h-11 rounded-xl text-sm font-semibold capitalize"
                  style={{
                    background: pose === item ? 'var(--grad-red)' : 'var(--surface-2)',
                    color: pose === item ? '#fff' : 'var(--txt-hi)',
                    border: '1px solid var(--hair)',
                    touchAction: 'manipulation',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--txt-lo)]">Start week</span>
              <select
                value={startWeek ?? ''}
                onChange={(e) => setStartWeek(Number(e.target.value))}
                disabled={!weeks.length}
                className="mt-1 w-full min-h-12 rounded-xl px-3 text-[color:var(--txt-hi)]"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
              >
                {weeks.map((week) => <option key={week} value={week}>Week {week}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--txt-lo)]">Latest week</span>
              <select
                value={endWeek ?? ''}
                onChange={(e) => setEndWeek(Number(e.target.value))}
                disabled={!weeks.length}
                className="mt-1 w-full min-h-12 rounded-xl px-3 text-[color:var(--txt-hi)]"
                style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', fontSize: 16 }}
              >
                {weeks.map((week) => <option key={week} value={week}>Week {week}</option>)}
              </select>
            </label>
          </div>
          </>
          )}

          <button
            type="button"
            onClick={() => setShowName((v) => !v)}
            className="min-h-12 w-full rounded-xl px-3 text-sm font-semibold text-left"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', touchAction: 'manipulation' }}
          >
            {showName ? 'First name is shown' : 'Name is hidden'}
          </button>

          {kind === 'checkin' && !loading && !weeks.length && (
            <p className="text-sm text-[color:var(--txt-mid)]">No {pose} photos yet for this client.</p>
          )}
          {kind === 'trend' && !loading && sortedWeights.length < 2 && (
            <p className="text-sm text-[color:var(--txt-mid)]">This client needs a few weigh-ins for a trend line.</p>
          )}
          {error && <p className="text-sm" style={{ color: 'var(--red)' }}>{error}</p>}
        </div>

        <div className="flex justify-center">
          <div className="w-full max-w-[360px]">
            <div
              className="overflow-hidden rounded-[28px]"
              style={{ aspectRatio: '9 / 16', background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
            >
              {previewUrl ? (
                <img src={previewUrl} alt="Story preview" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-[color:var(--txt-mid)] px-6 text-center">
                  <ImageIcon className="w-8 h-8" />
                  <p className="text-sm">{loading || rendering ? 'Building preview…' : 'Pick a client to preview the story'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div
        className="fixed inset-x-0 bottom-0 z-40 px-3 sm:px-6 pt-3"
        style={{
          paddingBottom: 'calc(12px + env(safe-area-inset-bottom))',
          background: 'linear-gradient(to top, var(--bg) 70%, transparent)',
        }}
      >
        <div className="max-w-6xl mx-auto">
          <button
            type="button"
            onClick={saveStory}
            disabled={!previewUrl || saving || rendering}
            className="min-h-12 w-full rounded-2xl font-semibold text-white inline-flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: 'var(--grad-red)', touchAction: 'manipulation' }}
          >
            <Download className="w-4 h-4" />
            {saving ? 'Saving…' : 'Save story'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CoachStoryStudio;
