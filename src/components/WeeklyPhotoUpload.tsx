import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, ChevronDown, ArrowLeftRight } from 'lucide-react';
import { dbSaveWeeklyPhoto, dbDeleteWeeklyPhoto, dbGetClientPhotos, uploadWeeklyPhoto, WeeklyPhoto } from '../lib/db';

interface WeeklyPhotoUploadProps {
  clientId: string;
  currentWeek: number;
  maxWeeks: number;
  onPhotosUpdate: (photos: WeeklyPhoto[]) => void;
  existingPhotos?: WeeklyPhoto[];
}

const WeeklyPhotoUpload: React.FC<WeeklyPhotoUploadProps> = ({
  clientId,
  currentWeek,
  maxWeeks,
  onPhotosUpdate,
  existingPhotos = []
}) => {
  const [photos, setPhotos] = useState<WeeklyPhoto[]>(existingPhotos);
  const [uploading, setUploading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  
  // Comparison states
  const [showComparison, setShowComparison] = useState(false);
  const [compareWeek1, setCompareWeek1] = useState<number>(1);
  const [compareWeek2, setCompareWeek2] = useState<number>(currentWeek);
  
  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    side: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null)
  };
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load photos
  useEffect(() => {
    const loadPhotos = async () => {
      if (!clientId) return;
      try {
        const { data: dbPhotos, error } = await dbGetClientPhotos(clientId);
        if (error || !dbPhotos) return;
        
        const convertedPhotos: WeeklyPhoto[] = dbPhotos.map(photo => ({
          id: photo.id,
          week: photo.week,
          type: photo.type,
          imageUrl: photo.image_url,
          uploadedAt: new Date(photo.uploaded_at)
        }));
        
        setPhotos(convertedPhotos);
        onPhotosUpdate(convertedPhotos);
      } catch (error) {
        console.error('Error loading photos:', error);
      }
    };

    loadPhotos();
  }, [clientId, onPhotosUpdate]);

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
    { type: 'front', label: 'Front' },
    { type: 'side', label: 'Side' },
    { type: 'back', label: 'Back' }
  ];

  const handleFileSelect = useCallback(async (files: FileList | null, photoType: 'front' | 'side' | 'back') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const file = files[0];
      
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        setUploading(false);
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
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
        alert('Failed to save photo. Please try again.');
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
      alert('Failed to process file. Please try again.');
      setUploading(false);
    }
  }, [clientId, selectedWeek, photos, onPhotosUpdate]);

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      const { error } = await dbDeleteWeeklyPhoto(photoId);
      
      if (error) {
        alert('Failed to delete photo. Please try again.');
        return;
      }

      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      alert('Failed to delete photo. Please try again.');
    }
  }, [photos, onPhotosUpdate]);

  const getPhotoForType = (type: 'front' | 'side' | 'back') => {
    return photos.find(p => p.week === selectedWeek && p.type === type);
  };

  const weekPhotos = photos.filter(p => p.week === selectedWeek);

  return (
    <div className="space-y-3">
      {/* Compact Week Selector */}
      <div className="bg-gray-900 border border-gray-700 rounded-xl p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[#dc1e3a]" />
            <span className="text-white text-sm font-medium">Progress Photos</span>
          </div>
          {weekPhotos.length > 0 && (
            <span className="text-xs text-gray-400">{weekPhotos.length}/3</span>
          )}
        </div>
        
        <div className="relative" ref={dropdownRef}>
          {/* Ultra Modern Dropdown Trigger */}
          <button
            onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
            className="group w-full relative overflow-hidden bg-gradient-to-r from-gray-800 to-gray-800 hover:from-gray-750 hover:to-gray-800 border border-gray-700 hover:border-[#dc1e3a]/50 rounded-xl px-4 py-2.5 flex items-center justify-between transition-all duration-300"
          >
            {/* Animated gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#dc1e3a]/0 via-[#dc1e3a]/5 to-[#dc1e3a]/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-[#dc1e3a]/20 flex items-center justify-center">
                <span className="text-[#dc1e3a] text-xs font-bold">{selectedWeek}</span>
              </div>
              <span className="text-white text-sm font-medium">Week {selectedWeek}</span>
              {weekPhotos.length === 3 && (
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              )}
            </div>
            
            <ChevronDown className={`w-4 h-4 text-gray-400 group-hover:text-[#dc1e3a] transition-all duration-300 ${isWeekDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Ultra Modern Dropdown Menu */}
          {isWeekDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800/95 backdrop-blur-xl border border-gray-700/50 rounded-xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="max-h-64 overflow-y-auto custom-scrollbar">
                {/* Current Week Badge */}
                <div className="sticky top-0 bg-gradient-to-b from-gray-800 to-gray-800/0 px-3 py-2 backdrop-blur-sm z-10">
                  <span className="text-xs text-gray-400 font-medium">Select Week</span>
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
                        className={`group w-full px-3 py-2.5 rounded-lg text-left flex items-center justify-between transition-all duration-200 mb-1 ${
                          isSelected
                            ? 'bg-gradient-to-r from-[#dc1e3a] to-[#dc1e3a]/80 text-white shadow-lg scale-[1.02]'
                            : 'text-gray-300 hover:bg-gray-750 hover:scale-[1.01]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {/* Week Badge */}
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all ${
                            isSelected
                              ? 'bg-white/20 text-white'
                              : 'bg-gray-700 text-gray-400 group-hover:bg-gray-600'
                          }`}>
                            {week}
                          </div>
                          
                          <div className="flex flex-col">
                            <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>
                              Week {week}
                            </span>
                            {isCurrent && !isSelected && (
                              <span className="text-xs text-[#dc1e3a]">Current</span>
                            )}
                          </div>
                        </div>

                        {/* Status Indicators */}
                        <div className="flex items-center gap-2">
                          {weekPhotoCount > 0 && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg ${
                              isComplete
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              <span className="text-xs font-bold">{weekPhotoCount}/3</span>
                            </div>
                          )}
                          
                          {isComplete && (
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
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

      {/* Compact Upload Grid */}
      <div className="grid grid-cols-3 gap-2">
        {photoTypes.map(({ type, label }) => {
          const photo = getPhotoForType(type);
          
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
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  <img
                    src={photo.imageUrl}
                    alt={`${label} view`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="bg-red-600 hover:bg-red-700 text-white rounded-lg p-2 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
                    <span className="text-white text-xs font-medium">{label}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => fileInputRefs[type].current?.click()}
                  disabled={uploading}
                  className="aspect-[3/4] w-full bg-gray-800 hover:bg-gray-750 border border-gray-700 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="w-5 h-5 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-400">{label}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Compare Photos Section */}
      {photos.length > 0 && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-3">
          <button
            onClick={() => setShowComparison(!showComparison)}
            className="w-full flex items-center justify-between text-white text-sm font-medium hover:text-[#dc1e3a] transition-colors"
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-4 h-4" />
              <span>Compare Progress</span>
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
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs"
                >
                  {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
                <span className="text-gray-400 text-xs font-bold">VS</span>
                <select
                  value={compareWeek2}
                  onChange={(e) => setCompareWeek2(Number(e.target.value))}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-2 py-1.5 text-white text-xs"
                >
                  {Array.from({ length: maxWeeks }, (_, i) => i + 1).map(week => (
                    <option key={week} value={week}>Week {week}</option>
                  ))}
                </select>
              </div>

              {/* Comparison Grid */}
              {photoTypes.map(({ type, label }) => {
                const photo1 = photos.find(p => p.week === compareWeek1 && p.type === type);
                const photo2 = photos.find(p => p.week === compareWeek2 && p.type === type);

                return (
                  <div key={type} className="space-y-2">
                    <div className="text-xs text-gray-400 font-medium">{label}</div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Week 1 Photo */}
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                        {photo1 ? (
                          <>
                            <img src={photo1.imageUrl} alt={`${label} week ${compareWeek1}`} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                              Week {compareWeek1}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No photo</span>
                          </div>
                        )}
                      </div>

                      {/* Week 2 Photo */}
                      <div className="relative aspect-[3/4] rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                        {photo2 ? (
                          <>
                            <img src={photo2.imageUrl} alt={`${label} week ${compareWeek2}`} className="w-full h-full object-cover" />
                            <div className="absolute top-2 left-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                              Week {compareWeek2}
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <span className="text-gray-500 text-xs">No photo</span>
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
      )}
    </div>
  );
};

export default WeeklyPhotoUpload;

