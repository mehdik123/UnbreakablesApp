import React from 'react';
import { WifiOff, CloudOff, RefreshCw } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

interface OfflineBannerProps {
  pendingSyncCount?: number;
  onSyncNow?: () => void;
  isSyncing?: boolean;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({
  pendingSyncCount = 0,
  onSyncNow,
  isSyncing = false,
}) => {
  const isOnline = useOnlineStatus();

  if (isOnline && pendingSyncCount === 0) return null;

  return (
    <div
      className="sticky top-0 z-50 px-3 py-2 text-sm flex items-center justify-center gap-2 border-b"
      style={{
        background: isOnline ? 'rgba(245, 158, 11, 0.15)' : 'rgba(239, 68, 68, 0.15)',
        borderColor: isOnline ? 'rgba(245, 158, 11, 0.35)' : 'rgba(239, 68, 68, 0.35)',
        color: isOnline ? '#fbbf24' : '#fca5a5',
      }}
      role="status"
    >
      {isOnline ? (
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
      ) : (
        <>
          <WifiOff className="w-4 h-4 shrink-0" />
          <span>Offline mode — your workout is saved on this device</span>
        </>
      )}
    </div>
  );
};
