import { authService } from './authService';

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
