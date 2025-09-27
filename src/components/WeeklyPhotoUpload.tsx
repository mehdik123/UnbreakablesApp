import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, Upload, X, RotateCcw, Download, Eye, Trash2, Plus, CheckCircle, AlertCircle } from 'lucide-react';
import { dbSaveWeeklyPhoto, dbDeleteWeeklyPhoto, dbGetClientPhotos, WeeklyPhoto } from '../lib/db';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load photos from database on component mount
  useEffect(() => {
    const loadPhotos = async () => {
      try {
        const { data: dbPhotos, error } = await dbGetClientPhotos(clientId);
        if (error) {
          console.error('Error loading photos:', error);
          return;
        }
        
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
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size must be less than 10MB');
        return;
      }

      // Create object URL for preview
      const imageUrl = URL.createObjectURL(file);
      
      // Save to database
      const { data: savedPhoto, error } = await dbSaveWeeklyPhoto({
        client_id: clientId,
        week: selectedWeek,
        type: photoType,
        image_url: imageUrl
      });

      if (error) {
        console.error('Error saving photo:', error);
        alert('Failed to save photo. Please try again.');
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
      
    } catch (error) {
      console.error('Error uploading photo:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setUploading(false);
    }
  }, [currentWeek, photos, onPhotosUpdate]);

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

        {/* Week Selector */}
        <div className="mb-8">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-slate-700/50 p-6">
            <h2 className="text-xl font-bold text-white mb-4 text-center">Select Week</h2>
            <div className="flex flex-wrap justify-center gap-3">
              {Array.from({ length: maxWeeks }, (_, i) => i + 1).map((week) => {
                const weekPhotos = photos.filter(p => p.week === week);
                const hasPhotos = weekPhotos.length > 0;
                const isCurrentWeek = week === currentWeek;
                
                return (
                  <button
                    key={week}
                    onClick={() => setSelectedWeek(week)}
                    className={`relative group px-6 py-3 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 ${
                      selectedWeek === week
                        ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg shadow-indigo-500/25'
                        : 'bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>Week {week}</span>
                      {hasPhotos && (
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      )}
                      {isCurrentWeek && (
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      )}
                    </div>
                    
                    {/* Photo count indicator */}
                    {hasPhotos && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                        {weekPhotos.length}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Compact Week Progress Status - Mobile Optimized */}
        <div className="mb-4 sm:mb-6">
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-3 sm:p-4">
            <div className="text-center mb-4">
              <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Week {selectedWeek} Progress</h3>
              <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Upload your front, side, and back photos</p>
            </div>
            
            {/* Compact Progress Steps - Horizontal on mobile */}
            <div className="flex items-center justify-center space-x-2 sm:space-x-4 mb-4">
              {photoTypes.map((type, index) => {
                const hasPhoto = getPhotoForType(type.type);
                return (
                  <div key={type.type} className="flex flex-col items-center space-y-1 sm:space-y-2">
                    <div className={`relative w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base transition-all duration-300 ${
                      hasPhoto 
                        ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/25' 
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {hasPhoto ? <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" /> : type.icon}
                    </div>
                    <div className="text-center">
                      <div className="text-white font-medium text-xs sm:text-sm">{type.label}</div>
                      <div className="text-slate-400 text-xs hidden sm:block">{type.description}</div>
                    </div>
                    {index < photoTypes.length - 1 && (
                      <div className="hidden sm:block w-4 h-px bg-slate-600 mx-1"></div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {hasAllPhotos && (
              <div className="text-center">
                <div className="inline-flex items-center bg-gradient-to-r from-green-500/20 to-emerald-500/20 text-green-400 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium border border-green-500/30">
                  <CheckCircle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Complete! All photos uploaded for Week {selectedWeek}</span>
                  <span className="sm:hidden">Complete!</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Compact Photo Upload Grid - Mobile Optimized */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
          {photoTypes.map((type) => {
            const existingPhoto = getPhotoForType(type.type);
            
            return (
              <div key={type.type} className="group relative">
                <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl border border-slate-700/50 p-3 sm:p-4 lg:p-6 transition-all duration-300 group-hover:border-slate-600/50 group-hover:shadow-xl">
                  {/* Compact Photo Type Header */}
                  <div className="text-center mb-3 sm:mb-4">
                    <div className="relative inline-block">
                      <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center mb-2 sm:mb-3 mx-auto">
                        <span className="text-lg sm:text-xl lg:text-3xl">{type.icon}</span>
                      </div>
                      {existingPhoto && (
                        <div className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-2 h-2 sm:w-3 sm:h-3 lg:w-4 lg:h-4 text-white" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-sm sm:text-base lg:text-lg mb-1">{type.label}</h3>
                    <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">{type.description}</p>
                  </div>

                  {/* Compact Upload Area */}
                  {!existingPhoto ? (
                    <div
                      className={`relative border-2 border-dashed rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-300 group/upload ${
                        dragOver
                          ? 'border-indigo-500 bg-indigo-500/10 scale-105'
                          : 'border-slate-600 hover:border-indigo-500/50 hover:bg-slate-700/30 hover:scale-105'
                      }`}
                      onDrop={(e) => handleDrop(e, type.type)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => handleFileSelect(e.target.files, type.type)}
                      />
                      
                      <div className="space-y-2 sm:space-y-3 lg:space-y-4">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-16 lg:h-16 mx-auto bg-gradient-to-br from-indigo-500/20 to-cyan-500/20 rounded-xl sm:rounded-2xl flex items-center justify-center group-hover/upload:scale-110 transition-transform duration-300">
                          <Camera className="w-5 h-5 sm:w-6 sm:h-6 lg:w-8 lg:h-8 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white text-sm sm:text-base lg:text-lg font-semibold mb-1 sm:mb-2">Upload Photo</p>
                          <p className="text-slate-400 text-xs sm:text-sm mb-2 sm:mb-3 hidden sm:block">
                            Drag & drop or click to select
                          </p>
                          <p className="text-slate-400 text-xs mb-2 sm:hidden">
                            Tap to select
                          </p>
                          <div className="inline-flex items-center bg-slate-700/50 text-slate-300 px-2 sm:px-3 lg:px-4 py-1 sm:py-2 rounded-full text-xs">
                            <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">PNG, JPG up to 10MB</span>
                            <span className="sm:hidden">PNG, JPG</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="relative group/photo">
                      <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-700 shadow-lg">
                        <img
                          src={existingPhoto.imageUrl}
                          alt={`${type.label} - Week ${selectedWeek}`}
                          className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform duration-300"
                        />
                      </div>
                      
                      {/* Photo Actions Overlay - Compact for mobile */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/photo:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center">
                        <div className="flex space-x-2 sm:space-x-3">
                          <button
                            onClick={() => setPreviewPhoto(existingPhoto)}
                            className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl text-white hover:bg-white/30 transition-colors"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                          <button
                            onClick={() => removePhoto(existingPhoto.id)}
                            className="p-2 sm:p-3 bg-red-500/80 backdrop-blur-sm rounded-lg sm:rounded-xl text-white hover:bg-red-600/80 transition-colors"
                            title="Remove"
                          >
                            <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Compact Replace Button */}
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full mt-2 sm:mt-3 lg:mt-4 py-2 sm:py-3 px-3 sm:px-4 bg-gradient-to-r from-indigo-500 to-cyan-500 hover:from-indigo-600 hover:to-cyan-600 text-white text-xs sm:text-sm font-semibold rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="w-3 h-3 sm:w-4 sm:h-4 inline mr-1 sm:mr-2" />
                        <span className="hidden sm:inline">Replace Photo</span>
                        <span className="sm:hidden">Replace</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Compact Week Summary */}
        {weekPhotos.length > 0 && (
          <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-sm rounded-xl sm:rounded-2xl lg:rounded-3xl border border-slate-700/50 p-4 sm:p-6 lg:p-8">
            <div className="text-center mb-4 sm:mb-6">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white mb-1 sm:mb-2">Week {selectedWeek} Summary</h3>
              <p className="text-slate-400 text-xs sm:text-sm hidden sm:block">Your progress photos for this week</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
              {weekPhotos.map((photo) => (
                <div key={photo.id} className="relative group">
                  <div className="aspect-[3/4] rounded-xl sm:rounded-2xl overflow-hidden bg-slate-700 shadow-lg">
                    <img
                      src={photo.imageUrl}
                      alt={`${photo.type} - Week ${photo.week}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl sm:rounded-2xl flex items-center justify-center">
                    <div className="flex space-x-2 sm:space-x-3">
                      <button
                        onClick={() => setPreviewPhoto(photo)}
                        className="p-2 sm:p-3 bg-white/20 backdrop-blur-sm rounded-lg sm:rounded-xl text-white hover:bg-white/30 transition-colors"
                      >
                        <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="p-2 sm:p-3 bg-red-500/80 backdrop-blur-sm rounded-lg sm:rounded-xl text-white hover:bg-red-600/80 transition-colors"
                      >
                        <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-2 sm:mt-3 lg:mt-4 text-center">
                    <p className="text-white text-sm sm:text-base lg:text-lg font-semibold capitalize">{photo.type} View</p>
                    <p className="text-slate-400 text-xs sm:text-sm">
                      {photo.uploadedAt.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
