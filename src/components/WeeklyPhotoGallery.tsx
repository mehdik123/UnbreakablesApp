import React, { useState } from 'react';
import { Eye, Download, Calendar, Grid, List, X, ChevronLeft, ChevronRight, GitCompare, Camera } from 'lucide-react';
import { WeeklyPhoto } from '../lib/db';

interface WeeklyPhotoGalleryProps {
  photos: WeeklyPhoto[];
  onPhotosUpdate: (photos: WeeklyPhoto[]) => void;
  isCoachView?: boolean;
}

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

  const getImageUrl = (photo: WeeklyPhoto) => photo.imageUrl || photo.image_url;

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

  const getPhotoTypeLabel = (type: 'front' | 'side' | 'back') => {
    switch (type) {
      case 'front': return 'Front';
      case 'side': return 'Side';
      case 'back': return 'Back';
      default: return 'Photo';
    }
  };

  const openPreview = (photo: WeeklyPhoto) => {
    setPreviewPhoto(photo);
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
  };

  const downloadPhoto = (photo: WeeklyPhoto) => {
    const link = document.createElement('a');
    link.href = getImageUrl(photo);
    link.download = `week-${photo.week}-${photo.type}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
          onClick={() => downloadPhoto(photo)}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: 'rgba(0,0,0,.55)', color: '#fff' }}
          aria-label="Download"
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

          {compareWeek1 && compareWeek2 ? (
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
                  <button type="button" onClick={() => downloadPhoto(photo)} className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 p-0 sm:p-4">
          <div
            className="relative w-full sm:max-w-lg rounded-t-2xl sm:rounded-2xl overflow-hidden"
            style={{ background: 'var(--surface-1)', maxHeight: '92dvh' }}
          >
            <div className="flex items-center justify-between p-3" style={{ borderBottom: '1px solid var(--hair)' }}>
              <button type="button" onClick={() => navigatePreview('prev')} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }}>
                <ChevronLeft className="w-5 h-5" style={{ color: 'var(--txt-hi)' }} />
              </button>
              <div className="text-center min-w-0">
                <div className="text-sm font-semibold truncate" style={{ color: 'var(--txt-hi)' }}>
                  {getPhotoTypeLabel(previewPhoto.type)} · W{previewPhoto.week}
                </div>
                <div className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>
                  {getUploadedDate(previewPhoto).toLocaleDateString()}
                </div>
              </div>
              <button type="button" onClick={() => setPreviewPhoto(null)} className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'var(--surface-2)' }} aria-label="Close">
                <X className="w-5 h-5" style={{ color: 'var(--txt-hi)' }} />
              </button>
            </div>
            <div className="aspect-[3/4] max-h-[70dvh] bg-black">
              <img src={getImageUrl(previewPhoto)} alt="" className="w-full h-full object-contain" />
            </div>
            <div className="p-3 flex justify-center" style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}>
              <button
                type="button"
                onClick={() => downloadPhoto(previewPhoto)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--grad-red)', minHeight: 44 }}
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
            <button type="button" onClick={() => navigatePreview('next')} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center sm:hidden" style={{ background: 'rgba(0,0,0,.45)' }}>
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyPhotoGallery;
