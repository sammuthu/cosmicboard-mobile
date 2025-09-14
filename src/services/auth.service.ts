import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './api';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
}

class AuthService {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor() {
    this.loadTokens();
  }

  private async loadTokens() {
    try {
      // In development, always use mock tokens
      if (__DEV__) {
        this.accessToken = 'dev-access-token-persistent';
        this.refreshToken = 'dev-refresh-token-persistent';
        this.tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now

        // Store mock user if not exists
        const storedUser = await AsyncStorage.getItem('user');
        if (!storedUser) {
          const mockUser = {
            id: 'dev-user-001',
            email: 'nmuthu@gmail.com',
            name: 'Dev User',
          };
          await AsyncStorage.setItem('user', JSON.stringify(mockUser));
        }
        return;
      }

      const stored = await AsyncStorage.getItem('auth_tokens');
      if (stored) {
        const tokens = JSON.parse(stored);
        this.accessToken = tokens.accessToken;
        this.refreshToken = tokens.refreshToken;
        this.tokenExpiry = new Date(tokens.expiry);
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    }
  }

  private async saveTokens(tokens: AuthTokens) {
    this.accessToken = tokens.accessToken;
    this.refreshToken = tokens.refreshToken;
    this.tokenExpiry = new Date(Date.now() + tokens.expiresIn * 1000);
    
    try {
      await AsyncStorage.setItem('auth_tokens', JSON.stringify({
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiry: this.tokenExpiry.toISOString()
      }));
    } catch (error) {
      console.error('Error saving tokens:', error);
    }
  }

  private async clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    
    try {
      await AsyncStorage.removeItem('auth_tokens');
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  async sendMagicLink(email: string, isSignup: boolean = false): Promise<{ success: boolean; message: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/magic-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, isSignup }),
      });

      const data = await response.json();
      
      if (response.ok) {
        return {
          success: true,
          message: data.message || 'Magic link sent to your email',
        };
      } else {
        return {
          success: false,
          message: data.error || 'Failed to send magic link',
        };
      }
    } catch (error) {
      console.error('Error sending magic link:', error);
      return {
        success: false,
        message: 'Failed to send magic link',
      };
    }
  }

  async verifyMagicLink(token: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/verify-link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();
      
      if (response.ok && data.tokens) {
        await this.saveTokens(data.tokens);
        
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return {
          success: true,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.error || 'Invalid or expired magic link',
        };
      }
    } catch (error) {
      console.error('Error verifying magic link:', error);
      return {
        success: false,
        message: 'Failed to verify magic link',
      };
    }
  }

  async verifyMagicCode(email: string, code: string): Promise<{ success: boolean; user?: User; message?: string }> {
    try {
      const response = await fetch(`${API_URL}/auth/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code }),
      });

      const data = await response.json();
      
      if (response.ok && data.tokens) {
        await this.saveTokens(data.tokens);
        
        if (data.user) {
          await AsyncStorage.setItem('user', JSON.stringify(data.user));
        }
        
        return {
          success: true,
          user: data.user,
        };
      } else {
        return {
          success: false,
          message: data.error || 'Invalid or expired code',
        };
      }
    } catch (error) {
      console.error('Error verifying magic code:', error);
      return {
        success: false,
        message: 'Failed to verify code',
      };
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      // Check if we have a valid token
      if (!this.accessToken || !this.tokenExpiry || this.tokenExpiry < new Date()) {
        return null;
      }

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
        },
      });

      if (response.ok) {
        const user = await response.json();
        await AsyncStorage.setItem('user', JSON.stringify(user));
        return user;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    try {
      if (this.accessToken) {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
          },
        });
      }
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      await this.clearTokens();
    }
  }

  isAuthenticated(): boolean {
    return !!this.accessToken && !!this.tokenExpiry && this.tokenExpiry > new Date();
  }

  async getStoredUser(): Promise<User | null> {
    try {
      const stored = await AsyncStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

export default new AuthService();