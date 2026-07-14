import React from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineBannerProps {
  pendingSyncCount?: number;
  onSyncNow?: () => void;
  isSyncing?: boolean;
  /** DEV marketing: force offline banner for screenshots */
  forceOffline?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  pendingSyncCount = 0,
  onSyncNow,
  isSyncing = false,
  forceOffline = false,
}) => {
  const isOnline = useOnlineStatus();
  const showOffline = forceOffline || !isOnline;
  const showPending = !showOffline && isOnline && pendingSyncCount > 0;

  if (!showOffline && !showPending) return null;

  return (
    <div
      className="sticky top-0 z-50 px-3 py-2 text-sm flex items-center justify-center gap-2 border-b"
      style={{
        background: showOffline ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
        borderColor: showOffline ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)',
        color: showOffline ? '#fca5a5' : '#fbbf24',
      }}
      role="status"
    >
      {showOffline ? (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline mode — your workout is saved on this device</span>
        </>
      ) : (
        <>
          <CloudOff className="w-4 h-4 shrink-0" />
          <span>
            {pendingSyncCount > 0
              ? `${pendingSyncCount} workout change${pendingSyncCount > 1 ? 's' : ''} waiting to sync`
              : 'Back online'}
          </span>
          {pendingSyncCount > 0 && onSyncNow && (
            <button
              type="button"
              onClick={onSyncNow}
              disabled={isSyncing}
              className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold"
              style={{ background: 'rgba(245, 158, 11, 0.25)' }}
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              Sync now
            </button>
          )}
        </>
      )}
    </div>
  );
};
