import React from 'react';
import { Target, TrendingUp, Activity, Zap } from 'lucide-react';
import { CurrentWeekVolume } from '../types';

interface CurrentWeekVolumeDisplayProps {
  volume: CurrentWeekVolume | null;
  isLoading: boolean;
}

export const CurrentWeekVolumeDisplay: React.FC<CurrentWeekVolumeDisplayProps> = ({
  volume,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-gray-600/30 animate-pulse">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <div className="flex-1">
            <div className="h-6 bg-gray-700 rounded-lg w-48 mb-2 animate-pulse"></div>
            <div className="h-4 bg-gray-700 rounded w-32 animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!volume) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-gray-600/20 to-gray-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-gray-600/30">
            <Activity className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">No Volume Data</h3>
            <p className="text-gray-400 text-sm">No volume data available for this week</p>
          </div>
        </div>
      </div>
    );
  }

  const muscleGroups = Object.keys(volume.muscleGroupVolumes);
  const totalVolume = volume.totalVolume;

  return (
    <div className="space-y-6">
      {/* Main Volume Display */}
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 bg-gradient-to-br from-[#dc1e3a]/20 to-red-500/10 rounded-2xl flex items-center justify-center shadow-lg border border-[#dc1e3a]/30">
            <Target className="w-6 h-6 text-[#dc1e3a]" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Week {volume.weekNumber} Volume</h3>
            <p className="text-gray-400 text-sm">Total volume for this week</p>
          </div>
        </div>
        
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-3xl font-bold text-white">
              {totalVolume.toLocaleString()} kg
            </span>
            <div className="flex items-center space-x-2 text-green-400">
              <TrendingUp className="w-5 h-5" />
              <span className="text-sm font-medium">Active</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="w-full bg-gray-700 rounded-full h-3 mb-4">
            <div 
              className="bg-gradient-to-r from-[#dc1e3a] to-red-500 h-3 rounded-full transition-all duration-500"
              style={{ width: `${Math.min((totalVolume / 10000) * 100, 100)}%` }}
            ></div>
          </div>
          
          <p className="text-gray-400 text-sm">
            {muscleGroups.length} muscle groups trained this week
          </p>
        </div>
      </div>

      {/* Muscle Group Breakdown */}
      {muscleGroups.length > 0 && (
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-700 shadow-xl">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500/20 to-purple-500/10 rounded-xl flex items-center justify-center">
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-lg font-bold text-white">Muscle Group Breakdown</h4>
          </div>
          
          <div className="space-y-4">
            {muscleGroups.map((muscleGroup, index) => {
              const muscleVolume = volume.muscleGroupVolumes[muscleGroup];
              const percentage = totalVolume > 0 ? (muscleVolume / totalVolume) * 100 : 0;
              const colors = [
                'from-red-500 to-pink-500',
                'from-blue-500 to-cyan-500', 
                'from-green-500 to-emerald-500',
                'from-yellow-500 to-orange-500',
                'from-purple-500 to-violet-500',
                'from-indigo-500 to-blue-500'
              ];
              const colorClass = colors[index % colors.length];
              
              return (
                <div key={muscleGroup} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-medium capitalize">
                      {muscleGroup.toLowerCase()}
                    </span>
                    <span className="text-gray-300 font-bold">
                      {muscleVolume.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`bg-gradient-to-r ${colorClass} h-2 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 text-sm">
                      {percentage.toFixed(1)}% of total volume
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Updated */}
      <div className="text-center">
        <p className="text-gray-500 text-sm">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default CurrentWeekVolumeDisplay;