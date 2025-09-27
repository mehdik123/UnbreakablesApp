// Performance optimization utilities
import { useMemo, useCallback } from 'react';

// Debounce function for search and input handling
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Throttle function for scroll and resize events
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

// Memoized data processing
export const useProcessedData = <T>(
  data: T[],
  processor: (data: T[]) => any,
  deps: any[] = []
) => {
  return useMemo(() => {
    if (!data || data.length === 0) return [];
    return processor(data);
  }, [data, ...deps]);
};

// Optimized event handler creator
export const useOptimizedHandler = <T extends (...args: any[]) => any>(
  handler: T,
  deps: any[] = []
) => {
  return useCallback(handler, deps);
};

// Image lazy loading utility
export const createLazyImage = (src: string, alt: string) => {
  const img = new Image();
  img.src = src;
  img.alt = alt;
  return img;
};

// Data caching utility
export class DataCache {
  private cache = new Map<string, { data: any; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 5 * 60 * 1000) { // 5 minutes default
    this.ttl = ttl;
  }

  set(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

// Global cache instance
export const globalCache = new DataCache();

// Component performance monitoring
export const withPerformanceMonitoring = <P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) => {
  return React.memo((props: P) => {
    const startTime = performance.now();
    
    React.useEffect(() => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      
      if (renderTime > 16) { // More than one frame (16ms)
        console.warn(`${componentName} took ${renderTime.toFixed(2)}ms to render`);
      }
    });
    
    return <Component {...props} />;
  });
};
