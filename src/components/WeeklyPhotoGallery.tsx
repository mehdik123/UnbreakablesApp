import React, { useEffect, useState } from 'react';
import { Eye, Download, Calendar, Grid, List, X, ChevronLeft, ChevronRight, GitCompare, Camera } from 'lucide-react';
import { WeeklyPhoto } from '../lib/db';
import {
  downloadProgressPhotoRaw,
  downloadProgressPhotoTagged,
  progressPhotoTypeLabel,
  progressPhotoUrl,
} from '../utils/progressPhotoDownload';

interface WeeklyPhotoGalleryProps {
  photos: WeeklyPhoto[];
  onPhotosUpdate: (photos: WeeklyPhoto[]) => void;
  isCoachView?: boolean;
}

const SideLayoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M12 3v18" />
  </svg>
);
const StackLayoutIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <path d="M3 12h18" />
  </svg>
);

const WeeklyPhotoGallery: React.FC<WeeklyPhotoGalleryProps> = ({
  photos,
  isCoachView = false
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compare'>('grid');
  const [previewPhoto, setPreviewPhoto] = useState<WeeklyPhoto | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [compareWeek1, setCompareWeek1] = useState<number | null>(null);
  const [compareWeek2, setCompareWeek2] = useState<number | null>(null);
  const [compareType, setCompareType] = useState<'front' | 'side' | 'back'>('front');
  const [compareLayout, setCompareLayout] = useState<'side' | 'stack'>(() => {
    try {
      const saved = localStorage.getItem('ub_photo_compare_layout');
      return saved === 'stack' || saved === 'side' ? saved : 'stack';
    } catch {
      return 'stack';
    }
  });
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);
  const [downloadBusy, setDownloadBusy] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  const getImageUrl = (photo: WeeklyPhoto) => progressPhotoUrl(photo);

  const getUploadedDate = (photo: WeeklyPhoto) => {
    if (photo.uploadedAt) return photo.uploadedAt;
    if (photo.uploaded_at) return new Date(photo.uploaded_at);
    return new Date();
  };

  const photosByWeek = photos.reduce((acc, photo) => {
    if (!acc[photo.week]) acc[photo.week] = [];
    acc[photo.week].push(photo);
    return acc;
  }, {} as Record<number, WeeklyPhoto[]>);

  const weeks = Object.keys(photosByWeek).map(Number).sort((a, b) => b - a);
  const currentWeekPhotos = selectedWeek ? photosByWeek[selectedWeek] || [] : [];

  const getPhotoTypeLabel = (type: 'front' | 'side' | 'back') => progressPhotoTypeLabel(type);

  const openPreview = (photo: WeeklyPhoto) => {
    setPreviewPhoto(photo);
    setDownloadMenuOpen(false);
    setDownloadError('');
    const weekPhotos = photosByWeek[photo.week] || [];
    setCurrentPhotoIndex(weekPhotos.findIndex(p => p.id === photo.id));
  };

  const navigatePreview = (direction: 'prev' | 'next') => {
    if (!previewPhoto) return;
    const weekPhotos = photosByWeek[previewPhoto.week] || [];
    let newIndex = currentPhotoIndex;
    if (direction === 'prev') {
      newIndex = currentPhotoIndex > 0 ? currentPhotoIndex - 1 : weekPhotos.length - 1;
    } else {
      newIndex = currentPhotoIndex < weekPhotos.length - 1 ? currentPhotoIndex + 1 : 0;
    }
    setCurrentPhotoIndex(newIndex);
    setPreviewPhoto(weekPhotos[newIndex]);
    setDownloadMenuOpen(false);
    setDownloadError('');
  };

  const handleDownload = async (photo: WeeklyPhoto, mode: 'raw' | 'tagged') => {
    setDownloadBusy(true);
    setDownloadError('');
    try {
      if (mode === 'raw') await downloadProgressPhotoRaw(photo);
      else await downloadProgressPhotoTagged(photo);
      setDownloadMenuOpen(false);
    } catch {
      setDownloadError('Could not download. Try again.');
    } finally {
      setDownloadBusy(false);
    }
  };

  useEffect(() => {
    if (!previewPhoto) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewPhoto(null);
        setDownloadMenuOpen(false);
        return;
      }
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      const weekPhotos = photosByWeek[previewPhoto.week] || [];
      if (weekPhotos.length === 0) return;
      setCurrentPhotoIndex((idx) => {
        const next =
          e.key === 'ArrowLeft'
            ? idx > 0
              ? idx - 1
              : weekPhotos.length - 1
            : idx < weekPhotos.length - 1
              ? idx + 1
              : 0;
        setPreviewPhoto(weekPhotos[next]);
        setDownloadMenuOpen(false);
        setDownloadError('');
        return next;
      });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [previewPhoto, photosByWeek]);

  const getPhotoByWeekAndType = (week: number, type: 'front' | 'side' | 'back') =>
    photos.find(p => p.week === week && p.type === type);

  const getWeeksWithPhotoType = (type: 'front' | 'side' | 'back') =>
    weeks.filter(week => photosByWeek[week].some(p => p.type === type));

  const enterCompareMode = () => {
    setViewMode('compare');
    const weeksWithFront = getWeeksWithPhotoType('front');
    if (weeksWithFront.length >= 2) {
      setCompareWeek1(weeksWithFront[0]);
      setCompareWeek2(weeksWithFront[1]);
      setCompareType('front');
    } else if (weeksWithFront.length === 1) {
      setCompareWeek1(weeksWithFront[0]);
      setCompareWeek2(null);
      setCompareType('front');
    }
  };

  const PhotoTile: React.FC<{ photo: WeeklyPhoto; compact?: boolean }> = ({ photo, compact }) => (
    <div className="relative rounded-xl overflow-hidden" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
      <button
        type="button"
        onClick={() => openPreview(photo)}
        className={`block w-full ${compact ? 'aspect-square' : 'aspect-[3/4]'} overflow-hidden`}
      >
        <img
          src={getImageUrl(photo)}
          alt={`${photo.type} - Week ${photo.week}`}
          className="w-full h-full object-cover"
        />
      </button>
      <div className="absolute top-1.5 right-1.5 flex gap-1">
        <button
          type="button"
          onClick={() => openPreview(photo)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}
          aria-label="Preview"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => openPreview(photo)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}
          aria-label="Download options"
          title="Open to download"
        >
          <Download className="w-3.5 h-3.5" />
        </button>
      </div>
      <div className="px-2 py-1.5 flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold truncate" style={{ color: 'var(--txt-hi)' }}>
          {getPhotoTypeLabel(photo.type)}
        </span>
        <span className="text-[10px] shrink-0" style={{ color: 'var(--txt-lo)' }}>
          W{photo.week}
        </span>
      </div>
    </div>
  );

  if (photos.length === 0) {
    return (
      <div className="px-1 py-8">
        <div
          className="rounded-2xl p-5 text-center max-w-sm mx-auto"
          style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
        >
          <div
            className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(91,140,255,.12)' }}
          >
            <Calendar className="w-6 h-6" style={{ color: 'var(--blue)' }} />
          </div>
          <h3 className="font-display text-base font-semibold mb-1" style={{ color: 'var(--txt-hi)' }}>No photos yet</h3>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--txt-mid)' }}>
            {isCoachView
              ? "Your client hasn't uploaded any progress photos yet."
              : 'Snap your first progress photo to start tracking.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold font-display truncate" style={{ color: 'var(--txt-hi)' }}>
            Progress photos
          </h2>
          <p className="text-[11px] sm:text-xs" style={{ color: 'var(--txt-mid)' }}>
            {isCoachView ? 'Client weekly photos' : 'Your transformation'}
          </p>
        </div>
        <div
          className="flex rounded-lg p-0.5 shrink-0"
          style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
        >
          {([
            { id: 'grid' as const, Icon: Grid, fn: () => setViewMode('grid') },
            { id: 'list' as const, Icon: List, fn: () => setViewMode('list') },
            { id: 'compare' as const, Icon: GitCompare, fn: enterCompareMode },
          ]).map(({ id, Icon, fn }) => (
            <button
              key={id}
              type="button"
              onClick={fn}
              className="w-9 h-9 rounded-md flex items-center justify-center"
              style={{
                background: viewMode === id ? 'var(--red)' : 'transparent',
                color: viewMode === id ? '#fff' : 'var(--txt-mid)',
              }}
              aria-label={id}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-0.5 px-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
        <button
          type="button"
          onClick={() => setSelectedWeek(null)}
          className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
          style={{
            background: selectedWeek === null ? 'var(--red)' : 'var(--surface-2)',
            color: selectedWeek === null ? '#fff' : 'var(--txt-mid)',
            border: '1px solid var(--hair)',
            minHeight: 36,
          }}
        >
          All ({photos.length})
        </button>
        {weeks.map((week) => (
          <button
            key={week}
            type="button"
            onClick={() => setSelectedWeek(week)}
            className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold"
            style={{
              background: selectedWeek === week ? 'var(--red)' : 'var(--surface-2)',
              color: selectedWeek === week ? '#fff' : 'var(--txt-mid)',
              border: '1px solid var(--hair)',
              minHeight: 36,
            }}
          >
            W{week} ({photosByWeek[week].length})
          </button>
        ))}
      </div>

      {viewMode === 'compare' ? (
        <div className="space-y-2.5">
          <div className="flex gap-1 justify-center">
            {(['front', 'side', 'back'] as const).map((type) => {
              const weeksWithType = getWeeksWithPhotoType(type);
              return (
                <button
                  key={type}
                  type="button"
                  disabled={weeksWithType.length < 1}
                  onClick={() => {
                    setCompareType(type);
                    const list = getWeeksWithPhotoType(type);
                    setCompareWeek1(list[0] ?? null);
                    setCompareWeek2(list[1] ?? null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-[11px] font-semibold capitalize disabled:opacity-40"
                  style={{
                    background: compareType === type ? 'var(--red)' : 'var(--surface-2)',
                    color: compareType === type ? '#fff' : 'var(--txt-mid)',
                    border: '1px solid var(--hair)',
                    minHeight: 36,
                  }}
                >
                  {type} ({weeksWithType.length})
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'First', value: compareWeek1, set: setCompareWeek1 },
              { label: 'Second', value: compareWeek2, set: setCompareWeek2 },
            ].map((sel) => (
              <label key={sel.label} className="block">
                <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--txt-lo)' }}>
                  {sel.label}
                </span>
                <select
                  value={sel.value || ''}
                  onChange={(e) => sel.set(Number(e.target.value) || null)}
                  className="w-full mt-1 rounded-lg px-2 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', fontSize: 16 }}
                >
                  <option value="">Select</option>
                  {getWeeksWithPhotoType(compareType)
                    .filter((w) => sel.label === 'First' || w !== compareWeek1)
                    .map((week) => (
                      <option key={week} value={week}>Week {week}</option>
                    ))}
                </select>
              </label>
            ))}
          </div>

          <div className="flex items-center justify-end gap-1">
            <div
              className="flex rounded-lg p-0.5"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
            >
              <button
                type="button"
                onClick={() => setCompareLayout('side')}
                className="min-h-10 px-3 rounded-md flex items-center gap-1.5 text-[11px] font-semibold"
                style={{
                  background: compareLayout === 'side' ? 'var(--red)' : 'transparent',
                  color: compareLayout === 'side' ? '#fff' : 'var(--txt-mid)',
                }}
              >
                <SideLayoutIcon className="w-3.5 h-3.5" />
                Side
              </button>
              <button
                type="button"
                onClick={() => setCompareLayout('stack')}
                className="min-h-10 px-3 rounded-md flex items-center gap-1.5 text-[11px] font-semibold"
                style={{
                  background: compareLayout === 'stack' ? 'var(--red)' : 'transparent',
                  color: compareLayout === 'stack' ? '#fff' : 'var(--txt-mid)',
                }}
              >
                <StackLayoutIcon className="w-3.5 h-3.5" />
                Stack
              </button>
            </div>
          </div>

          {compareWeek1 && compareWeek2 ? (
            compareLayout === 'stack' ? (
              <div className="space-y-3">
                {[compareWeek1, compareWeek2].map((week, idx) => {
                  const photo = getPhotoByWeekAndType(week, compareType);
                  return (
                    <div key={week} className="space-y-1.5">
                      <div className="text-center text-xs font-semibold" style={{ color: 'var(--txt-hi)' }}>
                        Week {week}
                      </div>
                      {photo ? (
                        <div className="relative rounded-xl overflow-hidden aspect-[3/4] max-h-[72dvh]" style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}>
                          <button type="button" onClick={() => openPreview(photo)} className="block w-full h-full">
                            <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                          </button>
                        </div>
                      ) : (
                        <div
                          className="aspect-[3/4] max-h-[40dvh] rounded-xl flex flex-col items-center justify-center gap-1"
                          style={{ background: 'var(--surface-2)', border: '1px dashed var(--hair-strong)' }}
                        >
                          <Camera className="w-5 h-5" style={{ color: 'var(--txt-lo)' }} />
                          <span className="text-[10px]" style={{ color: 'var(--txt-lo)' }}>No photo</span>
                        </div>
                      )}
                      {idx === 0 && (
                        <div className="flex items-center justify-center gap-2 py-1">
                          <div className="h-px flex-1" style={{ background: 'var(--hair)' }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--txt-lo)' }}>VS</span>
                          <div className="h-px flex-1" style={{ background: 'var(--hair)' }} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
            <div className="grid grid-cols-2 gap-2">
              {[compareWeek1, compareWeek2].map((week) => {
                const photo = getPhotoByWeekAndType(week, compareType);
                return (
                  <div key={week} className="space-y-1">
                    <div className="text-center text-xs font-semibold" style={{ color: 'var(--txt-hi)' }}>Week {week}</div>
                    {photo ? (
                      <PhotoTile photo={photo} compact />
                    ) : (
                      <div
                        className="aspect-square rounded-xl flex flex-col items-center justify-center gap-1"
                        style={{ background: 'var(--surface-2)', border: '1px dashed var(--hair-strong)' }}
                      >
                        <Camera className="w-5 h-5" style={{ color: 'var(--txt-lo)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--txt-lo)' }}>No photo</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            )
          ) : (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--txt-lo)' }} />
              <p className="text-xs" style={{ color: 'var(--txt-mid)' }}>
                Pick two weeks to compare
              </p>
            </div>
          )}
        </div>
      ) : selectedWeek ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold" style={{ color: 'var(--txt-hi)' }}>Week {selectedWeek}</h3>
            <span className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{currentWeekPhotos.length} photos</span>
          </div>
          {viewMode === 'list' ? (
            <div className="space-y-2">
              {currentWeekPhotos.map((photo) => (
                <div
                  key={photo.id}
                  className="flex items-center gap-2.5 rounded-xl p-2"
                  style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
                >
                  <button type="button" onClick={() => openPreview(photo)} className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
                    <img src={getImageUrl(photo)} alt="" className="w-full h-full object-cover" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold" style={{ color: 'var(--txt-hi)' }}>{getPhotoTypeLabel(photo.type)}</div>
                    <div className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{getUploadedDate(photo).toLocaleDateString()}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => openPreview(photo)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ background: 'var(--surface-2)' }}
                    aria-label="Open photo"
                  >
                    <Download className="w-3.5 h-3.5" style={{ color: 'var(--txt-mid)' }} />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {currentWeekPhotos.map((photo) => (
                <PhotoTile key={photo.id} photo={photo} compact />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {weeks.map((week) => (
            <div key={week} className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--txt-hi)' }}>Week {week}</h3>
                <span className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{photosByWeek[week].length}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                {photosByWeek[week].map((photo) => (
                  <PhotoTile key={photo.id} photo={photo} compact />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {previewPhoto && (
        <div
          className="fixed inset-0 z-[80] flex flex-col bg-black"
          style={{ paddingTop: 'env(safe-area-inset-top)', paddingBottom: 'env(safe-area-inset-bottom)' }}
          role="dialog"
          aria-modal="true"
          aria-label="Full photo"
        >
          <div className="flex items-center justify-between gap-2 px-3 py-2 shrink-0">
            <button
              type="button"
              onClick={() => navigatePreview('prev')}
              className="coach-touch rounded-xl text-white/90"
              style={{ background: 'rgba(255,255,255,.08)', minHeight: 44, minWidth: 44 }}
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center min-w-0 flex-1">
              <div className="text-sm font-semibold truncate text-white">
                {getPhotoTypeLabel(previewPhoto.type)} · Week {previewPhoto.week}
              </div>
              <div className="text-[11px] text-white/55">
                {getUploadedDate(previewPhoto).toLocaleDateString()}
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setPreviewPhoto(null);
                setDownloadMenuOpen(false);
              }}
              className="coach-touch rounded-xl text-white/90"
              style={{ background: 'rgba(255,255,255,.08)', minHeight: 44, minWidth: 44 }}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-1 min-h-0 flex items-center justify-center px-2">
            <img
              src={getImageUrl(previewPhoto)}
              alt={`${getPhotoTypeLabel(previewPhoto.type)} week ${previewPhoto.week}`}
              className="max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
            <button
              type="button"
              onClick={() => navigatePreview('next')}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full flex items-center justify-center sm:hidden"
              style={{ background: 'rgba(0,0,0,.45)' }}
              aria-label="Next photo"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="shrink-0 px-3 pt-2 pb-3 relative">
            {downloadError && (
              <p className="text-center text-xs text-red-300 mb-2">{downloadError}</p>
            )}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setDownloadMenuOpen((open) => !open)}
                disabled={downloadBusy}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--grad-red)', minHeight: 48, touchAction: 'manipulation' }}
              >
                <Download className="w-4 h-4" />
                {downloadBusy ? 'Preparing…' : 'Download'}
              </button>
            </div>

            {downloadMenuOpen && (
              <div
                className="absolute left-1/2 -translate-x-1/2 bottom-[calc(100%-4px)] w-[min(320px,calc(100vw-24px))] rounded-2xl p-2 shadow-lg"
                style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={downloadBusy}
                  onClick={() => handleDownload(previewPhoto, 'raw')}
                  className="w-full text-left rounded-xl px-3 py-3 min-h-12"
                  style={{ color: 'var(--txt-hi)', touchAction: 'manipulation' }}
                >
                  <div className="text-sm font-semibold">Raw photo</div>
                  <div className="text-xs" style={{ color: 'var(--txt-mid)' }}>
                    Original file, no label
                  </div>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  disabled={downloadBusy}
                  onClick={() => handleDownload(previewPhoto, 'tagged')}
                  className="w-full text-left rounded-xl px-3 py-3 min-h-12"
                  style={{ color: 'var(--txt-hi)', touchAction: 'manipulation' }}
                >
                  <div className="text-sm font-semibold">With tag</div>
                  <div className="text-xs" style={{ color: 'var(--txt-mid)' }}>
                    Burns {getPhotoTypeLabel(previewPhoto.type)} + week on the image
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPhotoGallery;
