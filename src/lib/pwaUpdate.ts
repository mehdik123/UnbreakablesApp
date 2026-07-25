import { registerSW } from 'virtual:pwa-register';

export const PWA_NEED_REFRESH = 'pwa-need-refresh';
export const PWA_OFFLINE_READY = 'pwa-offline-ready';

/**
 * Activates the waiting service worker. Without calling this, a `prompt`
 * registration leaves every new deploy parked in "waiting" forever and the
 * user keeps the previously cached build.
 */
let activateWaitingWorker: ((reloadPage?: boolean) => Promise<void>) | null = null;

export function registerPwaUpdates(): void {
  activateWaitingWorker = registerSW({
    onNeedRefresh() {
      window.dispatchEvent(new CustomEvent(PWA_NEED_REFRESH));
    },
    onOfflineReady() {
      window.dispatchEvent(new CustomEvent(PWA_OFFLINE_READY));
    },
  });
}

export async function applyPwaUpdate(): Promise<void> {
  if (!activateWaitingWorker) {
    window.location.reload();
    return;
  }
  await activateWaitingWorker(true);
}
