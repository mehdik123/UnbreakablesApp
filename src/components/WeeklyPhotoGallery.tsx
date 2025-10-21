import React, { useState } from 'react';
import { Eye, Download, Calendar, ArrowLeft, ArrowRight, Grid, List, X, ChevronLeft, ChevronRight, GitCompare, Camera } from 'lucide-react';
import { WeeklyPhoto } from '../lib/db';

interface WeeklyPhotoGalleryProps {
  photos: WeeklyPhoto[];
  onPhotosUpdate: (photos: WeeklyPhoto[]) => void;
  isCoachView?: boolean;
}

const WeeklyPhotoGallery: React.FC<WeeklyPhotoGalleryProps> = ({
  photos,
  onPhotosUpdate,
  isCoachView = false
}) => {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'compare'>('grid');
  const [previewPhoto, setPreviewPhoto] = useState<WeeklyPhoto | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [compareWeek1, setCompareWeek1] = useState<number | null>(null);
  const [compareWeek2, setCompareWeek2] = useState<number | null>(null);
  const [compareType, setCompareType] = useState<'front' | 'side' | 'back'>('front');

  // Helper function to get image URL (handles both database and component formats)
  const getImageUrl = (photo: WeeklyPhoto) => photo.imageUrl || photo.image_url;
  
  // Helper function to get uploaded date (handles both database and component formats)
  const getUploadedDate = (photo: WeeklyPhoto) => {
    if (photo.uploadedAt) return photo.uploadedAt;
    if (photo.uploaded_at) return new Date(photo.uploaded_at);
    return new Date();
  };

  // Group photos by week
  const photosByWeek = photos.reduce((acc, photo) => {
    if (!acc[photo.week]) {
      acc[photo.week] = [];
    }
    acc[photo.week].push(photo);
    return acc;
  }, {} as Record<number, WeeklyPhoto[]>);

  const weeks = Object.keys(photosByWeek).map(Number).sort((a, b) => b - a);
  const currentWeekPhotos = selectedWeek ? photosByWeek[selectedWeek] || [] : [];

  const getPhotoTypeIcon = (type: 'front' | 'side' | 'back') => {
    switch (type) {
      case 'front': return '👤';
      case 'side': return '↔️';
      case 'back': return '🔙';
      default: return '📸';
    }
  };

  const getPhotoTypeLabel = (type: 'front' | 'side' | 'back') => {
    switch (type) {
      case 'front': return 'Front View';
      case 'side': return 'Side View';
      case 'back': return 'Back View';
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

  // Get photo for specific week and type
  const getPhotoByWeekAndType = (week: number, type: 'front' | 'side' | 'back') => {
    return photos.find(p => p.week === week && p.type === type);
  };

  // Get weeks that have photos of the selected type
  const getWeeksWithPhotoType = (type: 'front' | 'side' | 'back') => {
    return weeks.filter(week => photosByWeek[week].some(p => p.type === type));
  };

  // Initialize comparison weeks when entering compare mode
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

  if (photos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-20">
            <div className="w-32 h-32 mx-auto mb-8 bg-slate-800 rounded-full flex items-center justify-center">
              <Calendar className="w-16 h-16 text-slate-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">No Photos Yet</h3>
            <p className="text-slate-400 text-lg">
              {isCoachView ? 'Client hasn\'t uploaded any progress photos yet.' : 'Start tracking your progress by uploading weekly photos!'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              📸 Progress Gallery
            </h1>
            <p className="text-slate-400 text-sm sm:text-base">
              {isCoachView ? 'Client\'s weekly progress photos' : 'Your transformation journey'}
            </p>
          </div>
          
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => enterCompareMode()}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'compare' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
                title="Compare Photos"
              >
                <GitCompare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Week Selector */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedWeek(null)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedWeek === null
                  ? 'bg-red-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              All Weeks ({photos.length})
            </button>
            {weeks.map((week) => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedWeek === week
                    ? 'bg-red-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                Week {week} ({photosByWeek[week].length})
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Mode - Mobile Optimized */}
        {viewMode === 'compare' ? (
          <div className="space-y-3 sm:space-y-4">
            {/* Photo Type Selector - Mobile Optimized */}
            <div className="flex justify-center space-x-1 sm:space-x-2">
              {(['front', 'side', 'back'] as const).map((type) => {
                const weeksWithType = getWeeksWithPhotoType(type);
                const hasEnoughPhotos = weeksWithType.length >= 1;
                return (
                  <button
                    key={type}
                    onClick={() => {
                      setCompareType(type);
                      const weeksWithThisType = getWeeksWithPhotoType(type);
                      if (weeksWithThisType.length >= 2) {
                        setCompareWeek1(weeksWithThisType[0]);
                        setCompareWeek2(weeksWithThisType[1]);
                      } else if (weeksWithThisType.length === 1) {
                        setCompareWeek1(weeksWithThisType[0]);
                        setCompareWeek2(null);
                      }
                    }}
                    disabled={!hasEnoughPhotos}
                    className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                      compareType === type
                        ? 'bg-red-500 text-white'
                        : hasEnoughPhotos
                        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                        : 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                    }`}
                  >
                    <span className="hidden sm:inline">{getPhotoTypeIcon(type)} {getPhotoTypeLabel(type)}</span>
                    <span className="sm:hidden">{getPhotoTypeIcon(type)}</span>
                    <span className="ml-1 text-xs">({weeksWithType.length})</span>
                  </button>
                );
              })}
            </div>

            {/* Week Selectors - Mobile Optimized */}
            <div className="grid grid-cols-2 gap-2 sm:gap-4">
              {/* Week 1 Selector */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-white font-medium text-center text-xs sm:text-sm">First Week</label>
                <select
                  value={compareWeek1 || ''}
                  onChange={(e) => setCompareWeek1(Number(e.target.value))}
                  className="w-full bg-slate-800 text-white rounded-lg px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select</option>
                  {getWeeksWithPhotoType(compareType).map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </select>
              </div>

              {/* Week 2 Selector */}
              <div className="space-y-1 sm:space-y-2">
                <label className="block text-white font-medium text-center text-xs sm:text-sm">Second Week</label>
                <select
                  value={compareWeek2 || ''}
                  onChange={(e) => setCompareWeek2(Number(e.target.value))}
                  className="w-full bg-slate-800 text-white rounded-lg px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm border border-slate-700 focus:border-red-500 focus:outline-none"
                >
                  <option value="">Select</option>
                  {getWeeksWithPhotoType(compareType)
                    .filter(w => w !== compareWeek1)
                    .map((week) => (
                      <option key={week} value={week}>
                        Week {week}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Comparison Display - Mobile Optimized */}
            {compareWeek1 && compareWeek2 ? (
              <div className="grid grid-cols-2 gap-2 sm:gap-4">
                {[compareWeek1, compareWeek2].map((week) => {
                  const photo = getPhotoByWeekAndType(week, compareType);
                  return (
                    <div key={week} className="space-y-2">
                      <div className="text-center">
                        <h3 className="text-base sm:text-xl font-bold text-white">Week {week}</h3>
                        {photo && (
                          <p className="text-slate-400 text-xs sm:text-sm">
                            {getUploadedDate(photo).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      {photo ? (
                        <div className="relative group">
                          <div className="aspect-[3/4] rounded-lg sm:rounded-xl overflow-hidden bg-slate-700 border-2 sm:border-4 border-slate-700">
                            <img
                              src={getImageUrl(photo)}
                              alt={`Week ${week} - ${compareType}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => downloadPhoto(photo)}
                              className="p-1.5 sm:p-2 bg-blue-500/80 backdrop-blur-sm rounded-md sm:rounded-lg text-white hover:bg-blue-600/80 transition-colors"
                            >
                              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-[3/4] rounded-lg sm:rounded-xl bg-slate-800 border-2 border-dashed border-slate-600 flex items-center justify-center">
                          <div className="text-center text-slate-400">
                            <Camera className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-1" />
                            <p className="text-xs sm:text-sm">No photo</p>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : compareWeek1 && !compareWeek2 ? (
              <div className="text-center py-8 sm:py-12">
                <Calendar className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-slate-400" />
                <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">Select Second Week</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Choose another week to compare with Week {compareWeek1}
                </p>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12">
                <Calendar className="w-10 h-10 sm:w-16 sm:h-16 mx-auto mb-2 sm:mb-4 text-slate-400" />
                <h3 className="text-base sm:text-xl font-bold text-white mb-1 sm:mb-2">No Photos Available</h3>
                <p className="text-xs sm:text-sm text-slate-400">
                  Upload photos for at least 2 weeks to use comparison
                </p>
              </div>
            )}
          </div>
        ) : selectedWeek ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">Week {selectedWeek}</h2>
              <div className="text-slate-400 text-sm">
                {currentWeekPhotos.length} photo{currentWeekPhotos.length !== 1 ? 's' : ''}
              </div>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentWeekPhotos.map((photo) => (
                  <div key={photo.id} className="group relative">
                    <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-slate-700">
                      <img
                        src={getImageUrl(photo)}
                        alt={`${photo.type} - Week ${photo.week}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      />
                    </div>
                    
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl flex items-center justify-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openPreview(photo)}
                          className="p-3 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                          title="Preview"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => downloadPhoto(photo)}
                          className="p-3 bg-blue-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-blue-600/80 transition-colors"
                          title="Download"
                        >
                          <Download className="w-5 h-5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 text-center">
                      <div className="flex items-center justify-center space-x-2 mb-1">
                        <span className="text-lg">{getPhotoTypeIcon(photo.type)}</span>
                        <span className="text-white font-medium text-sm">
                          {getPhotoTypeLabel(photo.type)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-xs">
                        {getUploadedDate(photo).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {currentWeekPhotos.map((photo) => (
                  <div key={photo.id} className="flex items-center space-x-4 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 hover:bg-slate-800/70 transition-colors">
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-700 flex-shrink-0">
                      <img
                        src={getImageUrl(photo)}
                        alt={`${photo.type} - Week ${photo.week}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-lg">{getPhotoTypeIcon(photo.type)}</span>
                        <span className="text-white font-medium">
                          {getPhotoTypeLabel(photo.type)}
                        </span>
                      </div>
                      <p className="text-slate-400 text-sm">
                        Week {photo.week} • {getUploadedDate(photo).toLocaleDateString()}
                      </p>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={() => openPreview(photo)}
                        className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-white transition-colors"
                        title="Preview"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => downloadPhoto(photo)}
                        className="p-2 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {weeks.map((week) => (
              <div key={week} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-white">Week {week}</h2>
                  <div className="text-slate-400 text-sm">
                    {photosByWeek[week].length} photo{photosByWeek[week].length !== 1 ? 's' : ''}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {photosByWeek[week].map((photo) => (
                    <div key={photo.id} className="group relative">
                      <div className="aspect-[3/4] rounded-xl overflow-hidden bg-slate-700">
                        <img
                          src={getImageUrl(photo)}
                          alt={`${photo.type} - Week ${photo.week}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                      
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openPreview(photo)}
                            className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => downloadPhoto(photo)}
                            className="p-2 bg-blue-500/80 backdrop-blur-sm rounded-lg text-white hover:bg-blue-600/80 transition-colors"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-center">
                        <div className="flex items-center justify-center space-x-1">
                          <span className="text-sm">{getPhotoTypeIcon(photo.type)}</span>
                          <span className="text-white text-xs font-medium">
                            {getPhotoTypeLabel(photo.type)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Preview Modal */}
        {previewPhoto && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="relative max-w-4xl w-full max-h-[90vh]">
              <button
                onClick={() => setPreviewPhoto(null)}
                className="absolute top-4 right-4 z-10 p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => navigatePreview('prev')}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                  onClick={() => navigatePreview('next')}
                  className="p-2 bg-black/50 backdrop-blur-sm rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-slate-800 rounded-2xl overflow-hidden">
                <div className="aspect-[3/4] sm:aspect-square">
                  <img
                    src={getImageUrl(previewPhoto)}
                    alt={`${previewPhoto.type} - Week ${previewPhoto.week}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-semibold text-lg mb-1">
                        {getPhotoTypeIcon(previewPhoto.type)} {getPhotoTypeLabel(previewPhoto.type)}
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Week {previewPhoto.week} • {getUploadedDate(previewPhoto).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => downloadPhoto(previewPhoto)}
                      className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
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

export default WeeklyPhotoGallery;
