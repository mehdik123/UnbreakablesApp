import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Download, Eye, Trash2, Plus, CheckCircle, AlertCircle, ChevronDown, Calendar } from 'lucide-react';
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
  const [dragOver, setDragOver] = useState(false);
  const [selectedType, setSelectedType] = useState<'front' | 'side' | 'back' | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<WeeklyPhoto | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(currentWeek);
  const [isWeekDropdownOpen, setIsWeekDropdownOpen] = useState(false);
  
  // Comparison states
  const [showComparison, setShowComparison] = useState(false);
  const [compareWeek1, setCompareWeek1] = useState<number | null>(null);
  const [compareWeek2, setCompareWeek2] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load photos from database on component mount or when clientId changes
  useEffect(() => {
    const loadPhotos = async () => {
      if (!clientId) {
        console.log('WeeklyPhotoUpload: No clientId provided, skipping photo load');
        return;
      }

      try {
        console.log('WeeklyPhotoUpload: Loading photos for clientId:', clientId);
        const { data: dbPhotos, error } = await dbGetClientPhotos(clientId);
        if (error) {
          // If table doesn't exist, just return empty array instead of logging error
          if (error.code === 'PGRST205') {
            console.log('Weekly photos table not created yet. Please create the table in Supabase first.');
            setPhotos([]);
            onPhotosUpdate([]);
            return;
          }
          console.error('Error loading photos:', error);
          return;
        }
        
        console.log('WeeklyPhotoUpload: Loaded photos from database:', dbPhotos?.length || 0);
        if (dbPhotos) {
          // Convert database format to component format
          const convertedPhotos: WeeklyPhoto[] = dbPhotos.map(photo => ({
            id: photo.id,
            week: photo.week,
            type: photo.type,
            imageUrl: photo.image_url,
            uploadedAt: new Date(photo.uploaded_at)
          }));
          
          setPhotos(convertedPhotos);
          onPhotosUpdate(convertedPhotos);
        }
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

  const photoTypes = [
    { type: 'front' as const, label: 'Front View', icon: '👤', description: 'Standing straight, facing camera' },
    { type: 'side' as const, label: 'Side View', icon: '↔️', description: 'Profile view from the side' },
    { type: 'back' as const, label: 'Back View', icon: '🔙', description: 'Back facing the camera' }
  ];

  const handleFileSelect = useCallback(async (files: FileList | null, photoType: 'front' | 'side' | 'back') => {
    if (!files || files.length === 0) return;

    setUploading(true);
    
    try {
      const file = files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select a valid image file');
        setUploading(false);
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        setUploading(false);
        return;
      }

      // Try Supabase Storage first, fallback to base64 if storage not available
      let savedPhoto, error;
      
      console.log('Starting photo upload...', { clientId, selectedWeek, photoType, fileSize: file.size });
      
      try {
        console.log('Attempting Supabase Storage upload...');
        const result = await uploadWeeklyPhoto(file, clientId, selectedWeek, photoType);
        savedPhoto = result.data;
        error = result.error;
        console.log('Storage upload result:', { savedPhoto: !!savedPhoto, error });
      } catch (storageError) {
        console.log('Storage not available, using base64 fallback:', storageError);
        // Fallback to base64 if storage fails
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(file);
        const imageUrl = await base64Promise;
        console.log('Base64 conversion complete, saving to database...');
        
        const dbResult = await dbSaveWeeklyPhoto({
          client_id: clientId,
          week: selectedWeek,
          type: photoType,
          image_url: imageUrl
        });
        savedPhoto = dbResult.data;
        error = dbResult.error;
        console.log('Database save result:', { savedPhoto: !!savedPhoto, error });
      }

      if (error) {
        console.error('Error saving photo:', error);
        if (error.code === 'PGRST205') {
          alert('Weekly photos table not created yet. Please create the table in Supabase first.');
        } else if (error.code === '57014') {
          alert('Upload timed out. Please try with a smaller image or check your connection.');
        } else {
          alert('Failed to save photo. Please try again.');
        }
        setUploading(false);
        return;
      }

      if (savedPhoto) {
        // Convert database format to component format
        const newPhoto: WeeklyPhoto = {
          id: savedPhoto.id,
          week: savedPhoto.week,
          type: savedPhoto.type,
          imageUrl: savedPhoto.image_url,
          uploadedAt: new Date(savedPhoto.uploaded_at)
        };

        // Remove existing photo of same type for this week
        const updatedPhotos = photos.filter(p => !(p.week === selectedWeek && p.type === photoType));
        updatedPhotos.push(newPhoto);

        setPhotos(updatedPhotos);
        onPhotosUpdate(updatedPhotos);
        setSelectedType(null);
      }
      
      setUploading(false);
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Failed to process file. Please try again.');
      setUploading(false);
    }
  }, [clientId, selectedWeek, photos, onPhotosUpdate]);

  const handleDrop = useCallback((e: React.DragEvent, photoType: 'front' | 'side' | 'back') => {
    e.preventDefault();
    setDragOver(false);
    handleFileSelect(e.dataTransfer.files, photoType);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const removePhoto = useCallback(async (photoId: string) => {
    try {
      const { error } = await dbDeleteWeeklyPhoto(photoId);
      
      if (error) {
        console.error('Error deleting photo:', error);
        alert('Failed to delete photo. Please try again.');
        return;
      }

      const updatedPhotos = photos.filter(p => p.id !== photoId);
      setPhotos(updatedPhotos);
      onPhotosUpdate(updatedPhotos);
    } catch (error) {
      console.error('Error deleting photo:', error);
      alert('Failed to delete photo. Please try again.');
    }
  }, [photos, onPhotosUpdate]);

  const getPhotoForType = (type: 'front' | 'side' | 'back') => {
    return photos.find(p => p.week === selectedWeek && p.type === type);
  };

  const getWeekPhotos = () => {
    return photos.filter(p => p.week === selectedWeek);
  };

  const weekPhotos = getWeekPhotos();
  const hasAllPhotos = weekPhotos.length === 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Enhanced Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 to-cyan-500 rounded-full mb-4 shadow-2xl">
            <Camera className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-3 bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            Progress Photos
          </h1>
          <p className="text-slate-400 text-lg sm:text-xl max-w-2xl mx-auto">
            Capture your transformation journey with weekly progress photos
          </p>
        </div>

        {/* Ultra Modern Week Selector - Mobile Optimized */}
        <div className="mb-6 sm:mb-8 relative z-[100]">
          <div className="bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-slate-800/80 backdrop-blur-xl rounded-2xl sm:rounded-3xl border border-slate-700/50 p-4 sm:p-8 shadow-2xl overflow-visible">
            <h2 className="text-lg sm:text-2xl font-bold text-white mb-4 sm:mb-6 text-center bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
              Select Week
            </h2>
            
            <div className="max-w-lg mx-auto relative z-[100]" ref={dropdownRef}>
              {/* Ultra Modern Custom Dropdown */}
              <div className="relative z-[100]">
                {/* Dropdown Trigger - Compact for Mobile */}
                <button
                  onClick={() => setIsWeekDropdownOpen(!isWeekDropdownOpen)}
                  className="w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-cyan-600 hover:from-indigo-500 hover:via-purple-500 hover:to-cyan-500 rounded-xl sm:rounded-2xl p-4 sm:p-6 transition-all duration-300 active:scale-[0.98] sm:hover:scale-[1.02] shadow-xl"
                >
                  {/* Animated Background Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-pink-500/0 via-purple-500/30 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
                      {/* Week Icon - Compact */}
                      <div className="w-10 h-10 sm:w-14 sm:h-14 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                        <Calendar className="w-5 h-5 sm:w-7 sm:h-7 text-white" />
                      </div>
                      
                      {/* Week Info - Responsive */}
                      <div className="text-left min-w-0 flex-1">
                        <div className="text-white/70 text-xs sm:text-sm font-medium hidden sm:block">Selected Week</div>
                        <div className="flex items-center space-x-2 sm:space-x-3 flex-wrap">
                          <span className="text-white text-xl sm:text-2xl font-black whitespace-nowrap">Week {selectedWeek}</span>
                          {selectedWeek === currentWeek && (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-yellow-400/20 backdrop-blur-sm rounded-full text-yellow-300 text-[10px] sm:text-xs font-bold flex items-center space-x-1 animate-pulse">
                              <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full"></div>
                              <span className="hidden sm:inline">Current</span>
                              <span className="sm:hidden">🟡</span>
                            </span>
                          )}
                          {photos.filter(p => p.week === selectedWeek).length > 0 && (
                            <span className="px-2 py-0.5 sm:px-3 sm:py-1 bg-green-400/20 backdrop-blur-sm rounded-full text-green-300 text-[10px] sm:text-xs font-bold flex items-center space-x-1">
                              <CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                              <span>{photos.filter(p => p.week === selectedWeek).length}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Chevron */}
                    <ChevronDown 
                      className={`w-5 h-5 sm:w-6 sm:h-6 text-white transition-transform duration-300 flex-shrink-0 ml-2 ${
                        isWeekDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </button>

                {/* Ultra Modern Dropdown Menu - Mobile Optimized */}
                {isWeekDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 sm:mt-3 bg-slate-800/95 backdrop-blur-2xl rounded-xl sm:rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="max-h-[300px] sm:max-h-[400px] overflow-y-auto custom-scrollbar">
                      {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((week) => {
                        const weekPhotos = photos.filter(p => p.week === week);
                        const hasPhotos = weekPhotos.length > 0;
                        const isCurrentWeek = week === currentWeek;
                        const isSelected = week === selectedWeek;
                        const photoCount = weekPhotos.length;
                        
                        return (
                          <button
                            key={week}
                            onClick={() => {
                              setSelectedWeek(week);
                              setIsWeekDropdownOpen(false);
                            }}
                            className={`w-full group px-3 sm:px-6 py-3 sm:py-4 flex items-center justify-between transition-all duration-300 ${
                              isSelected
                                ? 'bg-gradient-to-r from-indigo-600/40 via-purple-600/40 to-cyan-600/40 border-l-4 border-indigo-400'
                                : 'hover:bg-slate-700/50 border-l-4 border-transparent hover:border-l-slate-600 active:bg-slate-700/50'
                            }`}
                          >
                            <div className="flex items-center space-x-3 sm:space-x-4 min-w-0 flex-1">
                              {/* Week Number Badge - Compact */}
                              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center font-black text-base sm:text-lg transition-all duration-300 flex-shrink-0 ${
                                isSelected
                                  ? 'bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg scale-105 sm:scale-110'
                                  : 'bg-slate-700/50 text-slate-300 group-hover:bg-slate-600/50 group-hover:scale-105'
                              }`}>
                                {week}
                              </div>
                              
                              {/* Week Label - Compact */}
                              <div className="text-left min-w-0 flex-1">
                                <div className={`font-bold text-sm sm:text-base truncate ${
                                  isSelected ? 'text-white' : 'text-slate-300 group-hover:text-white'
                                }`}>
                                  Week {week}
                                </div>
                                {hasPhotos && (
                                  <div className="text-[10px] sm:text-xs text-green-400 font-medium mt-0.5 truncate">
                                    {photoCount} photo{photoCount > 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Indicators - Compact */}
                            <div className="flex items-center space-x-1 sm:space-x-2 flex-shrink-0 ml-2">
                              {isCurrentWeek && (
                                <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-yellow-400/20 backdrop-blur-sm rounded text-yellow-300 text-[10px] sm:text-xs font-bold flex items-center space-x-1">
                                  <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-yellow-400 rounded-full animate-pulse"></div>
                                  <span className="hidden sm:inline">Current</span>
                                </div>
                              )}
                              {hasPhotos && (
                                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-500/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 text-green-400" />
                                </div>
                              )}
                              {isSelected && (
                                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-indigo-400 rounded-full animate-pulse"></div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Stats Bar - Mobile Optimized */}
              <div className="mt-3 sm:mt-4 flex items-center justify-center space-x-3 sm:space-x-6 text-xs sm:text-sm">
                <div className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-700/30 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-400 flex-shrink-0" />
                  <span className="text-slate-300 font-medium whitespace-nowrap">
                    {photos.filter(p => p.week === selectedWeek).length}/3
                  </span>
                </div>
                <div className="flex items-center space-x-1.5 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-700/30 backdrop-blur-sm rounded-lg sm:rounded-xl">
                  <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400 flex-shrink-0" />
                  <span className="text-slate-300 font-medium whitespace-nowrap">
                    <span className="hidden sm:inline">{maxWeeks} weeks</span>
                    <span className="sm:hidden">{maxWeeks}w</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ultra Modern Compact Photo Gallery */}
        <div className="mb-6">
          {/* Progress Header - Compact */}
          <div className="mb-3 px-1">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25">
                  <Camera className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Week {selectedWeek} Photos</h3>
                  <p className="text-xs text-slate-400">{weekPhotos.length}/3 uploaded</p>
                </div>
              </div>
              {hasAllPhotos && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full shadow-lg shadow-green-500/10">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold text-green-400 hidden sm:inline">Complete</span>
                  <span className="text-xs font-bold text-green-400 sm:hidden">✓</span>
                </div>
              )}
            </div>
            
            {/* Visual Progress Bar */}
            <div className="relative h-2 bg-slate-800/50 rounded-full overflow-hidden backdrop-blur-sm">
              <div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-full transition-all duration-700 ease-out shadow-lg shadow-indigo-500/30"
                style={{ width: `${(weekPhotos.length / 3) * 100}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 animate-pulse"></div>
              </div>
            </div>
          </div>

          {/* Ultra Compact Photo Grid - 3 columns always */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {photoTypes.map((type) => {
            const existingPhoto = getPhotoForType(type.type);
            
            return (
              <div key={type.type} className="relative group">
                {/* Photo Card */}
                {!existingPhoto ? (
                  // Upload State - Compact
                  <div
                    className={`relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden border-2 border-dashed transition-all duration-300 ${
                      dragOver
                        ? 'border-indigo-500 bg-indigo-500/20 scale-[1.02]'
                        : 'border-slate-600/50 bg-slate-800/40 active:scale-[0.98]'
                    }`}
                    onDrop={(e) => handleDrop(e, type.type)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleFileSelect(e.target.files, type.type)}
                    />
                    
                    {/* Upload Content - Super Compact */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-2 sm:p-3">
                      <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500/30 to-purple-500/30 rounded-lg sm:rounded-xl flex items-center justify-center mb-2">
                        <Upload className="w-4 h-4 sm:w-6 sm:h-6 text-indigo-400" />
                      </div>
                      <p className="text-white text-[10px] sm:text-xs font-bold mb-1 text-center">{type.label}</p>
                      <p className="text-slate-400 text-[8px] sm:text-[10px] text-center hidden sm:block">{type.description}</p>
                      <div className="mt-2 px-2 py-1 bg-indigo-500/20 rounded-md">
                        <Camera className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-300" />
                      </div>
                    </div>

                    {/* Hover Hint */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-white text-[8px] sm:text-[10px] text-center font-medium">Tap to upload</p>
                    </div>
                  </div>
                ) : (
                  // Photo Uploaded State - Compact
                  <div className="relative aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden bg-slate-900 shadow-xl">
                    {/* Photo Image */}
                    <img
                      src={existingPhoto.imageUrl}
                      alt={`${type.label} - Week ${selectedWeek}`}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Status Badge - Top */}
                    <div className="absolute top-1 sm:top-2 left-1 sm:left-2 right-1 sm:right-2 flex items-center justify-between">
                      <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-green-500/90 backdrop-blur-sm rounded text-white text-[8px] sm:text-[10px] font-bold flex items-center space-x-1">
                        <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3" />
                        <span className="hidden sm:inline">Uploaded</span>
                      </div>
                      <div className="px-1.5 sm:px-2 py-0.5 sm:py-1 bg-slate-900/80 backdrop-blur-sm rounded text-white text-[8px] sm:text-[10px] font-bold">
                        {type.label}
                      </div>
                    </div>

                    {/* Actions Overlay - On Hover/Tap */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col items-center justify-end pb-2 sm:pb-4 space-y-1 sm:space-y-2">
                      <div className="flex space-x-1 sm:space-x-2">
                        <button
                          onClick={() => setPreviewPhoto(existingPhoto)}
                          className="p-1.5 sm:p-2 bg-white/20 backdrop-blur-md rounded-lg text-white hover:bg-white/30 active:scale-95 transition-all"
                          title="Preview"
                        >
                          <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 sm:p-2 bg-indigo-500/80 backdrop-blur-md rounded-lg text-white hover:bg-indigo-600/80 active:scale-95 transition-all"
                          title="Replace"
                        >
                          <RotateCcw className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                        <button
                          onClick={() => removePhoto(existingPhoto.id)}
                          className="p-1.5 sm:p-2 bg-red-500/80 backdrop-blur-md rounded-lg text-white hover:bg-red-600/80 active:scale-95 transition-all"
                          title="Delete"
                        >
                          <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                        </button>
                      </div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files, type.type)}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
            })}
          </div>
        </div>

        {/* Ultra Modern Progress Comparison */}
        <div className="mt-6">
          {/* Comparison Toggle Button */}
          {!showComparison ? (
            <button
              onClick={() => {
                setShowComparison(true);
                // Auto-select current week and previous week if available
                const weeksWithPhotos = Array.from(new Set(photos.map(p => p.week))).sort((a, b) => b - a);
                if (weeksWithPhotos.length >= 2) {
                  setCompareWeek1(weeksWithPhotos[0]);
                  setCompareWeek2(weeksWithPhotos[1]);
                } else if (weeksWithPhotos.length === 1) {
                  setCompareWeek1(weeksWithPhotos[0]);
                }
              }}
              className="w-full group relative overflow-hidden bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-orange-600/20 hover:from-purple-600/30 hover:via-pink-600/30 hover:to-orange-600/30 border-2 border-dashed border-purple-500/30 hover:border-purple-500/50 rounded-xl p-4 transition-all duration-300"
            >
              <div className="flex items-center justify-center space-x-3">
                <div className="flex -space-x-2">
                  <div className="w-10 h-10 bg-purple-500/30 backdrop-blur-sm rounded-lg border-2 border-purple-400 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-purple-300" />
                  </div>
                  <div className="w-10 h-10 bg-pink-500/30 backdrop-blur-sm rounded-lg border-2 border-pink-400 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-pink-300" />
                  </div>
                </div>
                <div>
                  <p className="text-white font-bold text-base">Compare Progress</p>
                  <p className="text-slate-400 text-xs">View side-by-side transformation</p>
                </div>
              </div>
            </button>
          ) : (
            <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl border border-slate-700/50 p-4 sm:p-6">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/25">
                    <Camera className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white">Progress Comparison</h3>
                    <p className="text-xs text-slate-400">Compare your transformation</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowComparison(false);
                    setCompareWeek1(null);
                    setCompareWeek2(null);
                  }}
                  className="p-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-lg text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Week Selection */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Week 1 Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Week 1</label>
                  <select
                    value={compareWeek1 || ''}
                    onChange={(e) => setCompareWeek1(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all"
                  >
                    <option value="">Select week...</option>
                    {Array.from(new Set(photos.map(p => p.week)))
                      .sort((a, b) => a - b)
                      .map(week => (
                        <option key={week} value={week}>
                          Week {week}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Week 2 Selector */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Week 2</label>
                  <select
                    value={compareWeek2 || ''}
                    onChange={(e) => setCompareWeek2(e.target.value ? Number(e.target.value) : null)}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-600/50 rounded-lg text-white text-sm focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 transition-all"
                  >
                    <option value="">Select week...</option>
                    {Array.from(new Set(photos.map(p => p.week)))
                      .sort((a, b) => a - b)
                      .map(week => (
                        <option key={week} value={week}>
                          Week {week}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Comparison Display */}
              {compareWeek1 && compareWeek2 ? (
                <div className="space-y-6">
                  {['front', 'side', 'back'].map((type) => {
                    const photo1 = photos.find(p => p.week === compareWeek1 && p.type === type);
                    const photo2 = photos.find(p => p.week === compareWeek2 && p.type === type);

                    return (
                      <div key={type} className="bg-slate-800/30 backdrop-blur-sm rounded-lg p-3 sm:p-4 border border-slate-700/30">
                        {/* Type Header */}
                        <div className="flex items-center justify-center mb-3">
                          <div className="px-4 py-1.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-full">
                            <p className="text-sm font-bold text-white capitalize">{type} View</p>
                          </div>
                        </div>

                        {/* Side by Side Comparison */}
                        <div className="grid grid-cols-2 gap-2 sm:gap-3">
                          {/* Photo 1 */}
                          <div className="relative">
                            <div className="absolute top-2 left-2 right-2 z-10">
                              <div className="px-2 py-1 bg-purple-500/90 backdrop-blur-sm rounded text-white text-[10px] sm:text-xs font-bold text-center">
                                Week {compareWeek1}
                              </div>
                            </div>
                            {photo1 ? (
                              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-900">
                                <img
                                  src={photo1.imageUrl}
                                  alt={`${type} - Week ${compareWeek1}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-[3/4] rounded-lg bg-slate-900/50 border-2 border-dashed border-slate-600/50 flex items-center justify-center">
                                <div className="text-center p-4">
                                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 mx-auto mb-2" />
                                  <p className="text-slate-500 text-[10px] sm:text-xs font-medium">No photo</p>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Photo 2 */}
                          <div className="relative">
                            <div className="absolute top-2 left-2 right-2 z-10">
                              <div className="px-2 py-1 bg-pink-500/90 backdrop-blur-sm rounded text-white text-[10px] sm:text-xs font-bold text-center">
                                Week {compareWeek2}
                              </div>
                            </div>
                            {photo2 ? (
                              <div className="aspect-[3/4] rounded-lg overflow-hidden bg-slate-900">
                                <img
                                  src={photo2.imageUrl}
                                  alt={`${type} - Week ${compareWeek2}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-[3/4] rounded-lg bg-slate-900/50 border-2 border-dashed border-slate-600/50 flex items-center justify-center">
                                <div className="text-center p-4">
                                  <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-slate-500 mx-auto mb-2" />
                                  <p className="text-slate-500 text-[10px] sm:text-xs font-medium">No photo</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Camera className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium mb-2">Select two weeks to compare</p>
                  <p className="text-slate-500 text-xs">Choose weeks from the dropdowns above</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Enhanced Uploading Overlay */}
        {uploading && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-8 text-center border border-slate-700/50">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-full flex items-center justify-center">
                <Upload className="w-10 h-10 text-indigo-400 animate-pulse" />
              </div>
              <h3 className="text-white font-bold text-xl mb-3">Uploading Photo</h3>
              <p className="text-slate-400 text-base mb-4">Please wait while we process your image...</p>
              <div className="w-32 h-1 bg-slate-700 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Photo Preview Modal */}
        {previewPhoto && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 z-10 p-3 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl overflow-hidden border border-slate-700/50">
                <div className="aspect-[3/4] sm:aspect-square">
                  <img
                    src={previewPhoto.imageUrl}
                    alt={`${previewPhoto.type} - Week ${previewPhoto.week}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-2xl mb-2">
                        {previewPhoto.type.charAt(0).toUpperCase() + previewPhoto.type.slice(1)} View
                      </h3>
                      <p className="text-slate-400 text-lg">
                        Week {previewPhoto.week} • {previewPhoto.uploadedAt.toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => removePhoto(previewPhoto.id)}
                        className="p-3 bg-red-500 hover:bg-red-600 rounded-xl text-white transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyPhotoUpload;
