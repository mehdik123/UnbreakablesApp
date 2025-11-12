import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, message: string, duration?: number) => void;
  success: (message: string, duration?: number) => void;
  error: (message: string, duration?: number) => void;
  warning: (message: string, duration?: number) => void;
  info: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, message: string, duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { id, type, message, duration };
    
    setToasts((prev) => [...prev, newToast]);
    
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, [removeToast]);

  const success = useCallback((message: string, duration?: number) => {
    showToast('success', message, duration);
  }, [showToast]);

  const error = useCallback((message: string, duration?: number) => {
    showToast('error', message, duration);
  }, [showToast]);

  const warning = useCallback((message: string, duration?: number) => {
    showToast('warning', message, duration);
  }, [showToast]);

  const info = useCallback((message: string, duration?: number) => {
    showToast('info', message, duration);
  }, [showToast]);

  const getToastStyles = (type: ToastType) => {
    switch (type) {
      case 'success':
        return {
          bg: 'from-green-500 to-emerald-600',
          icon: CheckCircle,
          border: 'border-green-400/50'
        };
      case 'error':
        return {
          bg: 'from-red-500 to-rose-600',
          icon: XCircle,
          border: 'border-red-400/50'
        };
      case 'warning':
        return {
          bg: 'from-yellow-500 to-orange-600',
          icon: AlertTriangle,
          border: 'border-yellow-400/50'
        };
      case 'info':
        return {
          bg: 'from-blue-500 to-cyan-600',
          icon: Info,
          border: 'border-blue-400/50'
        };
    }
  };

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}
      
      {/* Toast Container - Desktop (Top Right) */}
      <div className="hidden sm:flex fixed top-4 right-4 z-[10000] flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          const Icon = styles.icon;
          
          return (
            <div
              key={toast.id}
              className="pointer-events-auto animate-in slide-in-from-right-full duration-300 fade-in"
              style={{ animationFillMode: 'forwards' }}
            >
              <div className={`relative overflow-hidden bg-gradient-to-r ${styles.bg} rounded-xl border ${styles.border} shadow-2xl backdrop-blur-xl`}>
                {/* Animated progress bar */}
                {toast.duration && toast.duration > 0 && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                    style={{
                      animation: `shrink ${toast.duration}ms linear forwards`
                    }}
                  />
                )}
                
                <div className="flex items-start p-4 space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  
                  {/* Message */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {toast.message}
                    </p>
                  </div>
                  
                  {/* Close button */}
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 p-1 hover:bg-white/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile Toast Container - Bottom (below nav bar) */}
      <div className="flex sm:hidden fixed bottom-20 left-4 right-4 z-[10000] flex-col gap-2 pointer-events-none">
        {toasts.map((toast) => {
          const styles = getToastStyles(toast.type);
          const Icon = styles.icon;
          
          return (
            <div
              key={`mobile-${toast.id}`}
              className="pointer-events-auto animate-in slide-in-from-bottom-full duration-300 fade-in"
            >
              <div className={`relative overflow-hidden bg-gradient-to-r ${styles.bg} rounded-xl border ${styles.border} shadow-2xl backdrop-blur-xl`}>
                {toast.duration && toast.duration > 0 && (
                  <div 
                    className="absolute bottom-0 left-0 h-1 bg-white/30"
                    style={{
                      animation: `shrink ${toast.duration}ms linear forwards`
                    }}
                  />
                )}
                
                <div className="flex items-start p-3 space-x-3">
                  <div className="flex-shrink-0">
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white">
                      {toast.message}
                    </p>
                  </div>
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="flex-shrink-0 p-1"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </ToastContext.Provider>
  );
};

