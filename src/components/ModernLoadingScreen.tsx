import React from 'react';
import { Sparkles, Zap, Activity, Target } from 'lucide-react';

interface ModernLoadingScreenProps {
  message?: string;
}

export const ModernLoadingScreen: React.FC<ModernLoadingScreenProps> = ({ 
  message = "Loading..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-red-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      <div className="relative z-10 text-center">
        {/* Main Loading Animation */}
        <div className="relative mb-8">
          <div className="w-24 h-24 border-4 border-red-500/20 border-t-red-500 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-24 h-24 border-4 border-transparent border-t-red-500/40 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
          <div className="absolute inset-2 w-20 h-20 border-4 border-transparent border-t-red-500/60 rounded-full animate-spin" style={{animationDuration: '2s'}}></div>
        </div>

        {/* App Logo */}
        <div className="flex items-center justify-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center shadow-2xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            UnbreakableSteam
          </h1>
        </div>

        {/* Loading Message */}
        <h2 className="text-2xl font-bold text-white mb-4 animate-pulse">
          {message}
        </h2>

        {/* Feature Icons */}
        <div className="flex items-center justify-center space-x-6 mt-8">
          <div className="flex items-center space-x-2 text-gray-400">
            <Activity className="w-5 h-5" />
            <span className="text-sm">Fitness Tracking</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Target className="w-5 h-5" />
            <span className="text-sm">Goal Setting</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-400">
            <Zap className="w-5 h-5" />
            <span className="text-sm">AI Coaching</span>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-red-500/60 rounded-full animate-pulse" style={{animationDelay: '0.2s'}}></div>
          <div className="w-2 h-2 bg-red-500/40 rounded-full animate-pulse" style={{animationDelay: '0.4s'}}></div>
        </div>
      </div>
    </div>
  );
};











