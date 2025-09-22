import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiService from '../services/api';
import axios from 'axios';
import { Platform } from 'react-native';

interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = __DEV__
  ? 'http://localhost:7779/api'  // Both Android (with adb reverse) and iOS use localhost
  : 'https://cosmicspace.app/api';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setupAxiosInterceptors();
    initializeAuth();
  }, []);

  const setupAxiosInterceptors = () => {
    // Request interceptor to add auth token to all requests
    axios.interceptors.request.use(
      async (config) => {
        // Get token from AsyncStorage directly to always have the latest
        let authToken = await AsyncStorage.getItem('authToken');

        // If not in storage, check axios defaults
        if (!authToken && axios.defaults.headers.common['Authorization']) {
          authToken = axios.defaults.headers.common['Authorization'].replace('Bearer ', '');
        }

        if (authToken) {
          config.headers.Authorization = `Bearer ${authToken}`;
        }

        // Log all API requests for debugging
        console.log(`📤 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        if (config.headers.Authorization) {
          console.log('Auth header present:', config.headers.Authorization.substring(0, 20) + '...');
        }

        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for debugging
    axios.interceptors.response.use(
      (response) => {
        console.log(`📥 API Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error(`❌ API Error: ${error.response?.status || 'Network Error'} ${error.config?.url}`);
        console.error('Error details:', error.message);
        if (error.response) {
          console.error('Response data:', error.response.data);
        }
        return Promise.reject(error);
      }
    );
  };

  const initializeAuth = async () => {
    try {
      setLoading(true);

      // Check if we have a stored token
      const storedToken = await AsyncStorage.getItem('authToken');
      const storedUser = await AsyncStorage.getItem('authUser');

      if (storedToken && storedUser) {
        // We have stored credentials, use them
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
      } else if (__DEV__) {
        // Development mode: automatically login as nmuthu@gmail.com
        await loginDevelopmentUser();
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
    } finally {
      setLoading(false);
    }
  };

  const loginDevelopmentUser = async () => {
    console.log('🔧 Setting up development auth for nmuthu@gmail.com...');

    // In development mode, use the seeded token directly
    const devToken = 'acf42bf1db704dd18e3c64e20f1e73da2f19f8c23cf3bdb7e23c9c2a3c5f1e2d';
    const devUser = {
      id: 'dev-user-nmuthu',
      email: 'nmuthu@gmail.com',
      name: 'Development User',
    };

    await handleAuthSuccess(devToken, devToken, devUser);
    console.log('✅ Development auth configured successfully');
  };

  const handleAuthSuccess = async (
    authToken: string,
    refreshToken: string | null,
    userData: User
  ) => {
    // Store credentials
    await AsyncStorage.setItem('authToken', authToken);
    await AsyncStorage.setItem('authUser', JSON.stringify(userData));
    if (refreshToken) {
      await AsyncStorage.setItem('refreshToken', refreshToken);
    }

    // Update state
    setToken(authToken);
    setUser(userData);

    // Set axios default header
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    console.log('Auth successful for:', userData.email);
  };

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });

      await handleAuthSuccess(
        response.data.token,
        response.data.refreshToken,
        response.data.user
      );
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint if available
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      // Continue with local logout even if API call fails
    }

    // Clear stored credentials
    await AsyncStorage.removeItem('authToken');
    await AsyncStorage.removeItem('authUser');
    await AsyncStorage.removeItem('refreshToken');

    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];

    // Clear state
    setToken(null);
    setUser(null);
  };

  const refreshToken = async () => {
    try {
      // In development mode, use the proper backend endpoint for consistent behavior
      if (__DEV__) {
        console.log('🔄 Development mode: refreshing auth via backend endpoint...');
        await loginDevelopmentUser();
        return;
      }

      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');

      if (!storedRefreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: storedRefreshToken,
      });

      const newToken = response.data.token;

      // Update stored token
      await AsyncStorage.setItem('authToken', newToken);

      // Update state
      setToken(newToken);

      // Update axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

      console.log('✅ Token refreshed successfully');
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);

      if (__DEV__) {
        // In development, try to re-login with proper backend endpoint
        console.log('🔄 Development fallback: re-authenticating...');
        await loginDevelopmentUser();
      } else {
        // In production, logout the user
        await logout();
        throw new Error('Session expired. Please login again.');
      }
    }
  };

  // Set up axios interceptor for token refresh
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          // In development mode, skip refresh token logic for hardcoded token
          if (__DEV__) {
            console.log('401 error in dev mode, re-initializing auth...');
            await loginDevelopmentUser();
            // Retry the original request with new token
            originalRequest.headers.Authorization = axios.defaults.headers.common['Authorization'];
            return axios(originalRequest);
          }

          try {
            await refreshToken();
            // Retry the original request with new token
            originalRequest.headers.Authorization = axios.defaults.headers.common['Authorization'];
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed, user needs to login again
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axios.interceptors.response.eject(interceptor);
    };
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      refreshToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};