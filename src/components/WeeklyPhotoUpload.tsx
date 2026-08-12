import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { dbSaveWeeklyPhoto, dbDeleteWeeklyPhoto, dbGetClientPhotos, uploadWeeklyPhoto, WeeklyPhoto } from '../lib/db';
import { useClientLocale } from '../contexts/ClientLocaleContext';

interface WeeklyPhotoUploadProps {
  clientId: string;
  currentWeek: number;
  maxWeeks: number;
  onPhotosUpdate: (photos: WeeklyPhoto[]) => void;
  existingPhotos?: WeeklyPhoto[];
}

type CompareLayout = 'side' | 'stack';

/** Inline icons — avoid extra lucide chunks (Columns2/Rows2) that can 404 under stale PWA caches. */
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

const WeeklyPhotoUpload: React.FC<WeeklyPhotoUploadProps> = ({
  clientId,
  currentWeek,
  maxWeeks: maxWeeksProp,
  onPhotosUpdate,
  existingPhotos = []
}) => {
  const { t } = useClientLocale();
  const maxWeeks = Math.max(1, Math.min(52, Number(maxWeeksProp) || 12));
  const fileInputFrontRef = useRef<HTMLInputElement>(null);
  const fileInputSideRef = useRef<HTMLInputElement>(null);
  const fileInputBackRef = useRef<HTMLInputElement>(null);
  const fileInputRefs = {
    front: fileInputFrontRef,
    side: fileInputSideRef,
    back: fileInputBackRef,
  };
  const dropdownRef = useRef<HTMLDivElement>(null);
  const onPhotosUpdateRef = useRef(onPhotosUpdate);
  onPhotosUpdateRef.current = onPhotosUpdate;

  const [photos, setPhotos] = useState<WeeklyPhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  
  // Comparison states
  const marketingCompare =
    import.meta.env.DEV &&
    clientId === 'marketing-demo' &&
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('focus') === 'compare';
  const [showComparison, setShowComparison] = useState(marketingCompare);
  const [compareWeek1, setCompareWeek1] = useState<number>(1);
  const [compareWeek2, setCompareWeek2] = useState<number>(marketingCompare ? 3 : currentWeek);
  const [compareLayout, setCompareLayout] = useState<CompareLayout>(() => {
    try {
      const saved = localStorage.getItem('ub_photo_compare_layout');
      return saved === 'stack' || saved === 'side' ? saved : 'stack';
    } catch {
      return 'stack';
    }
  });
  const [compareFocusType, setCompareFocusType] = useState<'front' | 'side' | 'back' | 'all'>('front');
  /** Week Front/Side/Back gallery — horizontal 3-up is default; stack = big vertical for screenshots */
  const [weekLayout, setWeekLayout] = useState<CompareLayout>(() => {
    try {
      const saved = localStorage.getItem('ub_photo_week_layout');
      return saved === 'stack' || saved === 'side' ? saved : 'side';
    } catch {
      return 'side';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('ub_photo_compare_layout', compareLayout);
    } catch {
      /* ignore */
    }
  }, [compareLayout]);

  useEffect(() => {
    try {
      localStorage.setItem('ub_photo_week_layout', weekLayout);
    } catch {
      /* ignore */
    }
  }, [weekLayout]);

  // Load photos
  useEffect(() => {
    const loadPhotos = async () => {
      if (!clientId) return;
      try {
        const { data: dbPhotos, error } = await dbGetClientPhotos(clientId);
        if (error || !dbPhotos || !Array.isArray(dbPhotos)) return;
        
        const convertedPhotos: WeeklyPhoto[] = dbPhotos
          .filter((photo) => photo && (photo.image_url || photo.imageUrl))
          .map(photo => ({
            id: photo.id,
            week: Number(photo.week) || 1,
            type: photo.type,
            imageUrl: photo.image_url || photo.imageUrl || '',
            uploadedAt: new Date(photo.uploaded_at || Date.now())
          }));
        
        setPhotos(convertedPhotos);
        onPhotosUpdateRef.current(convertedPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    };

    loadPhotos();
  }, [clientId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsWeekDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const photoTypes: Array<{ type: 'front' | 'side' | 'back'; label: string }> = [
    { type: 'front', label: t('photo.front') },
    { type: 'side', label: t('photo.side') },
    { type: 'back', label: t('photo.back') }
  ];

  const handleFileSelect = useCallback(async (files: FileList | null, photoType: 'front' | 'side' | 'back') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        alert(t('photo.invalidImage'));
        setUploading(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert(t('photo.tooLarge'));
        setUploading(false);
        return;
      }

      let savedPhoto, error;
      
      try {
        const result = await uploadWeeklyPhoto(file, clientId, selectedWeek, photoType);
        savedPhoto = result.data;
        error = result.error;
      } catch (storageError) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const imageUrl = await base64Promise;
        
        const dbResult = await dbSaveWeeklyPhoto({
          client_id: clientId,
          week: selectedWeek,
          type: photoType,
          image_url: imageUrl
        });
        savedPhoto = dbResult.data;
        error = dbResult.error;
      }

      if (error || !savedPhoto) {
        alert(t('photo.saveFailed'));
        setUploading(false);
        return;
      }

      const newPhoto: WeeklyPhoto = {
        id: savedPhoto.id,
        week: savedPhoto.week,
        type: savedPhoto.type,
        imageUrl: savedPhoto.image_url,
        uploadedAt: new Date(savedPhoto.uploaded_at)
      };

      const updatedPhotos = photos.filter(p => !(p.week === selectedWeek && p.type === photoType));
      updatedPhotos.push(newPhoto);

      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);
      setUploading(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert(t('photo.processFailed'));
      setUploading(false);
    }
  }, [clientId, selectedWeek, photos, onPhotosUpdate]);

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      const { error } = await dbDeleteWeeklyPhoto(photoId);
      
      if (error) {
        alert(t('photo.deleteFailed'));
        return;
      }

      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      alert(t('photo.deleteFailed'));
    }
  }, [photos, onPhotosUpdate]);

  const getPhotoForType = (type: 'front' | 'side' | 'back') => {
    return photos.find(p => p.week === selectedWeek && p.type === type);
  };

  const weekPhotos = photos.filter(p => p.week === selectedWeek);

  return (
    <div className="space-y-3">
      {/* Compact Week Selector */}
      <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4" style={{ color: 'var(--red)' }} />
            <span className="text-sm font-semibold font-saira" style={{ color: 'var(--txt-hi)' }}>{t('photo.progressPhotos')}</span>
          </div>
          {weekPhotos.length > 0 && (
            <span className="text-xs" style={{ color: 'var(--txt-mid)' }}>{weekPhotos.length}/3</span>
          )}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          {/* Ultra Modern Dropdown Trigger */}
          <button
            onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
            className="group w-full relative overflow-hidden rounded-xl px-4 py-2.5 flex items-center justify-between transition-all duration-300"
            style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
          >
            <div className="relative flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,45,85,.18)' }}>
                <span className="text-xs font-bold" style={{ color: 'var(--red)' }}>{selectedWeek}</span>
              </div>
              <span className="text-sm font-medium" style={{ color: 'var(--txt-hi)' }}>{t('photo.week', { n: selectedWeek })}</span>
              {weekPhotos.length === 3 && (
                <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: 'var(--emerald)' }}></div>
              )}
            </div>
            
            <ChevronDown className={`w-4 h-4 transition-all duration-300 ${isWeekDropdownOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--txt-mid)' }} />
          </button>

          {/* Ultra Modern Dropdown Menu */}
          {isWeekDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200 nut-modal-surface">
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {/* Current Week Badge */}
                <div className="sticky top-0 px-3 py-2 backdrop-blur-sm z-10" style={{ background: 'var(--surface-2)' }}>
                  <span className="text-xs font-medium" style={{ color: 'var(--txt-mid)' }}>{t('photo.selectWeek')}</span>
                </div>

                <div className="px-1 pb-1">
                  {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((week) => {
                    const weekPhotoCount = photos.filter(p => p.week === week).length;
                    const isSelected = week === selectedWeek;
                    const isCurrent = week === currentWeek;
                    const isComplete = weekPhotoCount === 3;
                    
                    return (
                      <button
                        key={week}
                        onClick={() => {
                          setSelectedWeek(week);
                          setIsWeekDropdownOpen(false);
                        }}
                        className="group w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-all duration-200 mb-1"
                        style={isSelected
                          ? { background: 'var(--grad-red)', color: '#fff', boxShadow: '0 8px 20px -8px rgba(255,45,85,.5)' }
                          : { color: 'var(--txt-mid)' }}
                      >
                        <div className="flex items-center gap-3">
                          {/* Week Badge */}
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all"
                            style={isSelected
                              ? { background: 'rgba(255,255,255,.2)', color: '#fff' }
                              : { background: 'var(--surface-3)', color: 'var(--txt-mid)' }}
                          >
                            {week}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className="text-sm font-medium" style={{ color: isSelected ? '#fff' : 'var(--txt-hi)' }}>
                              {t('photo.week', { n: week })}
                            </span>
                            {isCurrent && !isSelected && (
                              <span className="text-xs" style={{ color: 'var(--red)' }}>{t('photo.current')}</span>
                            )}
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-2">
                          {weekPhotoCount > 0 && (
                            <div
                              className="flex items-center gap-1.5 px-2 py-1 rounded-lg"
                              style={isComplete
                                ? { background: 'rgba(52,211,153,.18)', color: 'var(--emerald)' }
                                : { background: 'rgba(245,158,11,.18)', color: '#fbbf24' }}
                            >
                              <span className="text-xs font-bold">{weekPhotoCount}/3</span>
                            </div>
                          )}
                          
                          {isComplete && (
                            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--emerald)' }}></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {weekPhotos.length === 0 && (
        <p className="text-[12.5px] leading-relaxed mb-2" style={{ color: 'var(--txt-mid)' }}>
          {t('photo.emptyHint')}
        </p>
      )}

      {/* Week gallery layout: Side (default 3-up) | Stack (full-width vertical) */}
      <div className="photo-layout-toggle">
        <span className="photo-layout-toggle__label">{t('photo.weekLayout')}</span>
        <div className="photo-layout-seg" role="group" aria-label={t('photo.weekLayout')}>
          <button
            type="button"
            onClick={() => setWeekLayout('side')}
            className={`photo-layout-seg__btn${weekLayout === 'side' ? ' is-active' : ''}`}
            aria-pressed={weekLayout === 'side'}
          >
            <SideLayoutIcon className="w-3.5 h-3.5" />
            {t('photo.layoutSide')}
          </button>
          <button
            type="button"
            onClick={() => setWeekLayout('stack')}
            className={`photo-layout-seg__btn${weekLayout === 'stack' ? ' is-active' : ''}`}
            aria-pressed={weekLayout === 'stack'}
          >
            <StackLayoutIcon className="w-3.5 h-3.5" />
            {t('photo.layoutStack')}
          </button>
        </div>
      </div>

      {/* Upload / view grid — cinematic frames for screenshots */}
      <div className={weekLayout === 'stack' ? 'photo-week-stack' : 'photo-week-grid'}>
        {photoTypes.map(({ type, label }, index) => {
          const photo = getPhotoForType(type);
          const tall = weekLayout === 'stack';
          const frameMod = tall ? 'photo-frame--stack' : 'photo-frame--side';
          const emptyMod = tall ? 'photo-empty--stack' : 'photo-empty--side';
          const poseIndex = String(index + 1).padStart(2, '0');

          return (
            <div key={type} className="relative group">
              <input
                ref={fileInputRefs[type]}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileSelect(e.target.files, type)}
                className="hidden"
              />

              {photo ? (
                <div className={`photo-frame ${frameMod}`}>
                  <img
                    src={photo.imageUrl}
                    alt={`${label} view`}
                    className="photo-frame__img"
                  />
                  <div className="photo-frame__vignette" aria-hidden="true" />
                  <div className="photo-frame__accent" aria-hidden="true" />
                  <div className="photo-frame__top">
                    <span className="photo-frame__brand">Unbreakables</span>
                    <span className="photo-frame__week">{t('photo.week', { n: selectedWeek })}</span>
                  </div>
                  <div className="photo-frame__bottom">
                    <span className="photo-frame__pose">{label}</span>
                    <span className="photo-frame__index">{poseIndex} / 03</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removePhoto(photo.id)}
                    className="photo-frame__delete"
                    aria-label="Delete photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRefs[type].current?.click()}
                  disabled={uploading}
                  className={`photo-empty ${emptyMod} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="photo-empty__icon">
                    <Upload className={tall ? 'w-5 h-5' : 'w-4 h-4'} />
                  </div>
                  <span className="photo-empty__label">{label}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Compare Photos Section */}
      {photos.length > 0 && (
        <div className="rounded-xl p-3" style={{ background: 'var(--surface-1)', border: '1px solid var(--hair)' }}>
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between text-sm font-semibold transition-colors"
            style={{ color: 'var(--txt-hi)' }}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              <span>{t('photo.compareProgress')}</span>
            </div>
            <ChevronDown className={`w-4 h-4 transition-transform ${showComparison ? 'rotate-180' : ''}`} />
          </button>

          {showComparison && (
            <div className="mt-3 space-y-3">
              {/* Week Selectors */}
              <div className="flex items-center gap-2">
                <select
                  value={compareWeek1}
                  onChange={(e) => setCompareWeek1(Number(e.target.value))}
                  className="flex-1 rounded-lg px-2 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', fontSize: 16 }}
                >
                  {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>{t('photo.week', { n: week })}</option>
                  ))}
                </select>
                <span className="text-xs font-bold" style={{ color: 'var(--txt-mid)' }}>{t('photo.vs')}</span>
                <select
                  value={compareWeek2}
                  onChange={(e) => setCompareWeek2(Number(e.target.value))}
                  className="flex-1 rounded-lg px-2 py-2 text-xs outline-none"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)', color: 'var(--txt-hi)', fontSize: 16 }}
                >
                  {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>{t('photo.week', { n: week })}</option>
                  ))}
                </select>
              </div>

              {/* Layout: side-by-side (small) vs stacked vertical (screenshot-friendly) */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-lo)' }}>
                  {t('photo.compareLayout')}
                </span>
                <div
                  className="flex rounded-lg p-0.5"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--hair)' }}
                >
                  <button
                    type="button"
                    onClick={() => setCompareLayout('side')}
                    className="min-h-10 px-3 rounded-md flex items-center gap-1.5 text-[11px] font-semibold touch-manipulation"
                    style={{
                      background: compareLayout === 'side' ? 'var(--red)' : 'transparent',
                      color: compareLayout === 'side' ? '#fff' : 'var(--txt-mid)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <SideLayoutIcon className="w-3.5 h-3.5" />
                    {t('photo.layoutSide')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setCompareLayout('stack')}
                    className="min-h-10 px-3 rounded-md flex items-center gap-1.5 text-[11px] font-semibold touch-manipulation"
                    style={{
                      background: compareLayout === 'stack' ? 'var(--red)' : 'transparent',
                      color: compareLayout === 'stack' ? '#fff' : 'var(--txt-mid)',
                      WebkitTapHighlightColor: 'transparent',
                    }}
                  >
                    <StackLayoutIcon className="w-3.5 h-3.5" />
                    {t('photo.layoutStack')}
                  </button>
                </div>
              </div>

              {/* Angle focus — stacked mode works best one pose at a time for screenshots */}
              {compareLayout === 'stack' && (
                <div className="flex gap-1 overflow-x-auto pb-0.5" style={{ WebkitOverflowScrolling: 'touch' }}>
                  {([
                    { id: 'front' as const, label: t('photo.front') },
                    { id: 'side' as const, label: t('photo.side') },
                    { id: 'back' as const, label: t('photo.back') },
                    { id: 'all' as const, label: t('photo.layoutAll') },
                  ]).map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setCompareFocusType(opt.id)}
                      className="shrink-0 min-h-10 px-3 rounded-lg text-[11px] font-semibold touch-manipulation"
                      style={{
                        background: compareFocusType === opt.id ? 'var(--red)' : 'var(--surface-2)',
                        color: compareFocusType === opt.id ? '#fff' : 'var(--txt-mid)',
                        border: '1px solid var(--hair)',
                        WebkitTapHighlightColor: 'transparent',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Comparison Grid */}
              {(compareLayout === 'side'
                ? photoTypes
                : photoTypes.filter((p) => compareFocusType === 'all' || p.type === compareFocusType)
              ).map(({ type, label }) => {
                const photo1 = photos.find(p => p.week === compareWeek1 && p.type === type);
                const photo2 = photos.find(p => p.week === compareWeek2 && p.type === type);

                const renderCard = (photo: WeeklyPhoto | undefined, week: number, tall: boolean) => (
                  <div className={`photo-frame ${tall ? 'photo-frame--stack' : 'photo-frame--side'}`}>
                    {photo ? (
                      <>
                        <img
                          src={photo.imageUrl}
                          alt={`${label} week ${week}`}
                          className="photo-frame__img"
                        />
                        <div className="photo-frame__vignette" aria-hidden="true" />
                        <div className="photo-frame__accent" aria-hidden="true" />
                        <div className="photo-frame__top">
                          <span className="photo-frame__brand">Unbreakables</span>
                          <span className="photo-frame__week">{t('photo.week', { n: week })}</span>
                        </div>
                        <div className="photo-frame__bottom">
                          <span className="photo-frame__pose">{label}</span>
                        </div>
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center min-h-[8rem]">
                        <span className="text-[11px]" style={{ color: 'var(--txt-lo)' }}>{t('photo.noPhoto')}</span>
                      </div>
                    )}
                  </div>
                );

                return (
                  <div key={type} className="space-y-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--txt-mid)' }}>{label}</div>
                    {compareLayout === 'stack' ? (
                      <div className="space-y-3">
                        {renderCard(photo1, compareWeek1, true)}
                        <div className="flex items-center justify-center gap-2 py-0.5">
                          <div className="h-px flex-1" style={{ background: 'var(--hair)' }} />
                          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--txt-lo)' }}>
                            {t('photo.vs')}
                          </span>
                          <div className="h-px flex-1" style={{ background: 'var(--hair)' }} />
                        </div>
                        {renderCard(photo2, compareWeek2, true)}
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {renderCard(photo1, compareWeek1, false)}
                        {renderCard(photo2, compareWeek2, false)}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WeeklyPhotoUpload;

