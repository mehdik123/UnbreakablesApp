import React, { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { PWA_NEED_REFRESH, applyPwaUpdate } from '../lib/pwaUpdate';

export const PwaUpdatePrompt: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [isReloading, setIsReloading] = useState(false);

  useEffect(() => {
    const onNeedRefresh = () => setVisible(true);
    window.addEventListener(PWA_NEED_REFRESH, onNeedRefresh);
    return () => window.removeEventListener(PWA_NEED_REFRESH, onNeedRefresh);
  }, []);

  if (!visible) return null;

  const handleReload = async () => {
    setIsReloading(true);
    await applyPwaUpdate();
  };

  return (
    <div className="pwa-update-toast" role="status" aria-live="polite">
      <div className="pwa-update-copy">
        <p className="pwa-update-title">New version available</p>
        <p className="pwa-update-sub">Reload to get the latest fixes.</p>
      </div>
      <button
        type="button"
        onClick={handleReload}
        disabled={isReloading}
        className="pwa-update-btn"
      >
        <RefreshCw className={`w-4 h-4 ${isReloading ? 'animate-spin' : ''}`} />
        <span>{isReloading ? 'Updating…' : 'Reload'}</span>
      </button>
      <button
        type="button"
        onClick={() => setVisible(false)}
        className="pwa-update-dismiss"
        aria-label="Dismiss update notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

export default PwaUpdatePrompt;
