import { useEffect, useState, useSyncExternalStore } from 'react';
import { isAppOnline } from '../lib/offlineStore';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getSnapshot() {
  return isAppOnline();
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => true);
}

/** Run a callback when the device comes back online. */
export function useOnBackOnline(callback: () => void, deps: unknown[] = []) {
  const isOnline = useOnlineStatus();
  const [wasOffline, setWasOffline] = useState(!isOnline);

  useEffect(() => {
    if (!isOnline) {
      setWasOffline(true);
      return;
    }
    if (wasOffline) {
      callback();
      setWasOffline(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, wasOffline, ...deps]);
}
