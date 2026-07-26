import { supabase } from './supabaseClient';
import {
  saveCachedClientLogin,
  loadCachedClientLogin,
  isAppOnline,
} from './offlineStore';

// Simple reversible encoding used by this app's client credentials.
// (Not production-grade hashing — kept for compatibility with existing rows.)
const PASSWORD_SALT = 'coaching_salt';

const hashPassword = (password: string): string => {
  return btoa(password + PASSWORD_SALT);
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
};

/** Reveal plaintext from existing password_hash rows (btoa(password + salt)). */
const revealPasswordFromHash = (hash: string): string | null => {
  if (!hash) return null;
  try {
    const decoded = atob(hash);
    if (!decoded.endsWith(PASSWORD_SALT)) return null;
    return decoded.slice(0, -PASSWORD_SALT.length);
  } catch {
    return null;
  }
};

export interface AuthUser {
  id: string;
  type: 'coach' | 'client';
  username?: string;
  clientId?: string;
}

export interface ClientCredentials {
  username: string;
  password: string;
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private readonly COACH_USERNAME = String(import.meta.env.VITE_COACH_USERNAME || '').trim();
  private readonly COACH_PASSWORD = String(import.meta.env.VITE_COACH_PASSWORD || '');
  private readonly AUTH_STORAGE_KEY = 'auth_user';
  private readonly AUTH_EXPIRY_KEY = 'auth_expiry';
  private readonly SESSION_DURATION = 365 * 24 * 60 * 60 * 1000; // 1 year – coach reloads often

  constructor() {
    this.loadAuthFromStorage();
  }

  private coachAuthConfigured(): boolean {
    return this.COACH_USERNAME.length > 0 && this.COACH_PASSWORD.length > 0;
  }

  private loadAuthFromStorage() {
    try {
      const storedUser = localStorage.getItem(this.AUTH_STORAGE_KEY);
      if (!storedUser) {
        this.currentUser = null;
        return;
      }

      const parsed = JSON.parse(storedUser) as AuthUser;
      if (!parsed?.type || (parsed.type !== 'coach' && parsed.type !== 'client')) {
        this.currentUser = null;
        return;
      }

      const expiry = localStorage.getItem(this.AUTH_EXPIRY_KEY);
      const expiryTime = expiry ? parseInt(expiry, 10) : null;
      const now = Date.now();

      // Coach sessions: never force-logout on reload when storage still has a valid user.
      // Only clear when expiry is clearly in the past (and finite).
      const clearlyExpired =
        expiryTime !== null && Number.isFinite(expiryTime) && now >= expiryTime;

      if (clearlyExpired && parsed.type !== 'coach') {
        this.logout();
        return;
      }

      // Expired coach session: extend instead of kicking out (reload shouldn't cost a login)
      this.currentUser = parsed;
      if (clearlyExpired || expiryTime === null || !Number.isFinite(expiryTime)) {
        localStorage.setItem(this.AUTH_EXPIRY_KEY, (now + this.SESSION_DURATION).toString());
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
      // Do not wipe storage on parse glitches — leave currentUser null for this tick only
      this.currentUser = null;
    }
  }

  private saveAuthToStorage(user: AuthUser) {
    try {
      localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(user));
      this.touchSession();
    } catch (error) {
      console.error('Error saving auth to storage:', error);
    }
  }

  /** Extend session expiry (call on login and each page load while logged in). */
  touchSession() {
    try {
      localStorage.setItem(this.AUTH_EXPIRY_KEY, (Date.now() + this.SESSION_DURATION).toString());
    } catch (error) {
      console.error('Error extending session:', error);
    }
  }

  async loginCoach(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!this.coachAuthConfigured()) {
      return {
        success: false,
        error: 'Coach login is not configured. Set VITE_COACH_USERNAME and VITE_COACH_PASSWORD.',
      };
    }

    if (username === this.COACH_USERNAME && password === this.COACH_PASSWORD) {
      const user: AuthUser = {
        id: 'coach',
        type: 'coach',
        username: username
      };
      this.currentUser = user;
      this.saveAuthToStorage(user);
      return { success: true };
    }

    return { success: false, error: 'Invalid username or password' };
  }

  async loginClient(username: string, password: string, clientId?: string): Promise<{ success: boolean; error?: string; clientId?: string }> {
    if (!isAppOnline() || !supabase) {
      return this.loginClientFromCache(username, password, clientId);
    }

    try {
      // Query client credentials
      const { data, error } = await supabase
        .from('client_credentials')
        .select('id, client_id, username, password_hash, is_active')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        if (!isAppOnline()) {
          return this.loginClientFromCache(username, password, clientId);
        }
        return { success: false, error: 'Invalid username or password' };
      }

      // Verify password
      if (!verifyPassword(password, data.password_hash)) {
        return { success: false, error: 'Invalid username or password' };
      }

      // If clientId is provided, verify it matches
      if (clientId && data.client_id !== clientId) {
        return { success: false, error: 'Access denied' };
      }

      // Update last login (best-effort)
      await supabase
        .from('client_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      saveCachedClientLogin(data.client_id, username, data.password_hash);

      // Create user session
      const user: AuthUser = {
        id: data.id,
        type: 'client',
        username: username,
        clientId: data.client_id
      };

      this.currentUser = user;
      this.saveAuthToStorage(user);

      return { success: true, clientId: data.client_id };
    } catch (error) {
      console.error('Client login error:', error);
      return this.loginClientFromCache(username, password, clientId);
    }
  }

  private loginClientFromCache(
    username: string,
    password: string,
    clientId?: string
  ): { success: boolean; error?: string; clientId?: string } {
    if (!clientId) {
      return {
        success: false,
        error: 'Connect once while online on this device, then you can log in offline.',
      };
    }

    const cached = loadCachedClientLogin(clientId);
    if (!cached || cached.username !== username) {
      return {
        success: false,
        error: isAppOnline()
          ? 'Invalid username or password'
          : 'No offline login saved for this account. Connect once while online.',
      };
    }

    if (!verifyPassword(password, cached.passwordHash)) {
      return { success: false, error: 'Invalid username or password' };
    }

    const user: AuthUser = {
      id: `offline-${clientId}`,
      type: 'client',
      username,
      clientId,
    };
    this.currentUser = user;
    this.saveAuthToStorage(user);
    return { success: true, clientId };
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.AUTH_STORAGE_KEY);
    localStorage.removeItem(this.AUTH_EXPIRY_KEY);
  }

  getCurrentUser(): AuthUser | null {
    // Always re-read from storage so a full page reload restores the session
    this.loadAuthFromStorage();
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.getCurrentUser() !== null;
  }

  isCoach(): boolean {
    return this.currentUser?.type === 'coach';
  }

  isClient(): boolean {
    return this.currentUser?.type === 'client';
  }

  async createClientCredentials(clientId: string, username: string, password: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();
    if (!cleanUsername || !cleanPassword) {
      return { success: false, error: 'Username and password are required' };
    }

    try {
      // Check if username already exists
      const { data: existing } = await supabase
        .from('client_credentials')
        .select('id')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (existing) {
        return { success: false, error: 'Username already exists' };
      }

      const passwordHash = hashPassword(cleanPassword);
      const { error } = await supabase
        .from('client_credentials')
        .insert({
          client_id: clientId,
          username: cleanUsername,
          password_hash: passwordHash,
          is_active: true
        });

      if (error) {
        console.error('Error creating credentials:', error);
        return { success: false, error: 'Failed to create credentials' };
      }

      saveCachedClientLogin(clientId, cleanUsername, passwordHash);
      return { success: true };
    } catch (error) {
      console.error('Create credentials error:', error);
      return { success: false, error: 'Failed to create credentials' };
    }
  }

  async getClientCredentials(clientId: string): Promise<ClientCredentials | null> {
    if (!supabase) return null;

    try {
      const { data, error } = await supabase
        .from('client_credentials')
        .select('username, password_hash')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (error || !data) return null;

      const revealed = revealPasswordFromHash(data.password_hash);
      return {
        username: data.username,
        // Return the real password so the coach can review / share it.
        // Falls back to empty if an unexpected hash format is stored.
        password: revealed ?? '',
      };
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return null;
    }
  }

  /**
   * Update username and/or password for an existing client login.
   * Username must stay unique across all clients.
   */
  async updateClientCredentials(
    clientId: string,
    updates: { username?: string; password?: string }
  ): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    const nextUsername = updates.username?.trim();
    const nextPassword = updates.password?.trim();

    if (!nextUsername && !nextPassword) {
      return { success: false, error: 'Nothing to update' };
    }

    try {
      const { data: current, error: currentError } = await supabase
        .from('client_credentials')
        .select('id, username, password_hash')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .maybeSingle();

      if (currentError || !current) {
        return { success: false, error: 'Credentials not found for this client' };
      }

      const payload: { username?: string; password_hash?: string; updated_at: string } = {
        updated_at: new Date().toISOString(),
      };

      if (nextUsername && nextUsername !== current.username) {
        const { data: taken } = await supabase
          .from('client_credentials')
          .select('id')
          .eq('username', nextUsername)
          .neq('id', current.id)
          .maybeSingle();

        if (taken) {
          return { success: false, error: 'Username already exists' };
        }
        payload.username = nextUsername;
      }

      if (nextPassword) {
        payload.password_hash = hashPassword(nextPassword);
      }

      const { error } = await supabase
        .from('client_credentials')
        .update(payload)
        .eq('id', current.id);

      if (error) {
        console.error('Update credentials error:', error);
        return { success: false, error: 'Failed to update credentials' };
      }

      const savedUsername = payload.username || current.username;
      const savedHash = payload.password_hash || current.password_hash;
      saveCachedClientLogin(clientId, savedUsername, savedHash);

      return { success: true };
    } catch (error) {
      console.error('Update credentials error:', error);
      return { success: false, error: 'Failed to update credentials' };
    }
  }

  /** @deprecated Prefer updateClientCredentials — kept for compatibility */
  async updateClientPassword(clientId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    return this.updateClientCredentials(clientId, { password: newPassword });
  }
}

export const authService = new AuthService();


