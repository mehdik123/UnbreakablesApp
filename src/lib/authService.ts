import { supabase } from './supabaseClient';

// Simple password hashing (in production, use bcrypt or similar)
const hashPassword = (password: string): string => {
  // Basic implementation - in production, use a proper hashing library
  return btoa(password + 'coaching_salt'); // Base64 encoding for demo
};

const verifyPassword = (password: string, hash: string): boolean => {
  return hashPassword(password) === hash;
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
  private readonly COACH_USERNAME = import.meta.env.VITE_COACH_USERNAME || 'coach';
  private readonly COACH_PASSWORD = import.meta.env.VITE_COACH_PASSWORD || 'coach123'; // Change this!
  private readonly AUTH_STORAGE_KEY = 'auth_user';
  private readonly AUTH_EXPIRY_KEY = 'auth_expiry';
  private readonly SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  constructor() {
    this.loadAuthFromStorage();
  }

  private loadAuthFromStorage() {
    try {
      const storedUser = localStorage.getItem(this.AUTH_STORAGE_KEY);
      const expiry = localStorage.getItem(this.AUTH_EXPIRY_KEY);
      
      if (storedUser && expiry) {
        const expiryTime = parseInt(expiry, 10);
        if (Date.now() < expiryTime) {
          this.currentUser = JSON.parse(storedUser);
        } else {
          this.logout(); // Session expired
        }
      }
    } catch (error) {
      console.error('Error loading auth from storage:', error);
    }
  }

  private saveAuthToStorage(user: AuthUser) {
    try {
      localStorage.setItem(this.AUTH_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem(this.AUTH_EXPIRY_KEY, (Date.now() + this.SESSION_DURATION).toString());
    } catch (error) {
      console.error('Error saving auth to storage:', error);
    }
  }

  async loginCoach(username: string, password: string): Promise<{ success: boolean; error?: string }> {
    // Simple coach authentication using environment variables
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
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
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

      // Update last login
      await supabase
        .from('client_credentials')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

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
      return { success: false, error: 'Login failed. Please try again.' };
    }
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem(this.AUTH_STORAGE_KEY);
    localStorage.removeItem(this.AUTH_EXPIRY_KEY);
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
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

    try {
      // Check if username already exists
      const { data: existing } = await supabase
        .from('client_credentials')
        .select('id')
        .eq('username', username)
        .single();

      if (existing) {
        return { success: false, error: 'Username already exists' };
      }

      // Create credentials
      const { error } = await supabase
        .from('client_credentials')
        .insert({
          client_id: clientId,
          username: username,
          password_hash: hashPassword(password),
          is_active: true
        });

      if (error) {
        console.error('Error creating credentials:', error);
        return { success: false, error: 'Failed to create credentials' };
      }

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
        .select('username')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .single();

      if (error || !data) return null;

      return { username: data.username, password: '••••••••' };
    } catch (error) {
      console.error('Error fetching credentials:', error);
      return null;
    }
  }

  async updateClientPassword(clientId: string, newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!supabase) {
      return { success: false, error: 'Database not configured' };
    }

    try {
      const { error } = await supabase
        .from('client_credentials')
        .update({ 
          password_hash: hashPassword(newPassword),
          updated_at: new Date().toISOString()
        })
        .eq('client_id', clientId);

      if (error) {
        return { success: false, error: 'Failed to update password' };
      }

      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'Failed to update password' };
    }
  }
}

export const authService = new AuthService();


