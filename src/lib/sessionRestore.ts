import { authService } from './authService';

const CLIENT_PORTAL_PATH_KEY = 'client_portal_path';

export function saveClientPortalPath(): void {
  try {
    localStorage.setItem(CLIENT_PORTAL_PATH_KEY, window.location.pathname + window.location.search);
  } catch {
    /* ignore */
  }
}

export function getSavedClientPortalPath(): string | null {
  try {
    return localStorage.getItem(CLIENT_PORTAL_PATH_KEY);
  } catch {
    return null;
  }
}

export function extractClientIdFromShareParam(clientShareId: string): string {
  const uuidPattern = /([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i;
  const uuidMatch = clientShareId.match(uuidPattern);
  return uuidMatch ? uuidMatch[1] : clientShareId;
}

export function getInitialAuthState(): {
  isAuthenticated: boolean;
  authType: 'none' | 'coach' | 'client';
} {
  const user = authService.getCurrentUser();
  if (!user) {
    return { isAuthenticated: false, authType: 'none' };
  }
  authService.touchSession();
  return { isAuthenticated: true, authType: user.type };
}

/** If client is logged in but URL lost ?client=, restore the saved share path. */
export function ensureClientPortalUrl(clientId: string): void {
  const params = new URLSearchParams(window.location.search);
  if (params.get('client')) return;

  const saved = getSavedClientPortalPath();
  if (saved?.includes(clientId)) {
    window.history.replaceState({}, '', saved);
    return;
  }

  window.history.replaceState({}, '', `/?client=${clientId}`);
}
