import React, { useState } from 'react';
import { Eye, Download, Calendar, ArrowLeft, ArrowRight, Grid, List, X, ChevronLeft, ChevronRight } from 'lucide-react';

interface WeeklyPhoto {
  id: string;
  week: number;
  type: 'front' | 'side' | 'back';
  imageUrl: string;
  uploadedAt: Date;
}

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [previewPhoto, setPreviewPhoto] = useState<WeeklyPhoto | null>(null);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

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
    link.href = photo.imageUrl;
    link.download = `week-${photo.week}-${photo.type}-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-red-500 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <List className="w-4 h-4" />
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

        {/* Photos Display */}
        {selectedWeek ? (
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
                        src={photo.imageUrl}
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
                        {photo.uploadedAt.toLocaleDateString()}
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
                        src={photo.imageUrl}
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
                        Week {photo.week} • {photo.uploadedAt.toLocaleDateString()}
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
                          src={photo.imageUrl}
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
                    src={previewPhoto.imageUrl}
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
                        Week {previewPhoto.week} • {previewPhoto.uploadedAt.toLocaleDateString()}
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
