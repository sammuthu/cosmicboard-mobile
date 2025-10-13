import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

// Use the same backend as your web app
// With adb reverse port forwarding, both Android and iOS can use localhost
export const API_URL = __DEV__
  ? 'http://localhost:7779/api'  // Both Android (with adb reverse) and iOS use localhost
  : 'https://cosmicspace.app/api';  // For production

class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Use platform-specific dev tokens in development
    if (__DEV__) {
      // iOS: nmuthu@gmail.com
      // Android: sammuthu@me.com
      this.token = Platform.OS === 'ios'
        ? 'acf42bf1db704dd18e3c64e20f1e73da2f19f8c23cf3bdb7e23c9c2a3c5f1e2d'  // nmuthu@gmail.com
        : '0bfe06952e506cd153cd8e4307e6caa1a4341fd1fe24ab428f5f9cc2fd6de2a2'; // sammuthu@me.com

      axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      console.log(`🔑 Dev mode: Using ${Platform.OS === 'ios' ? 'nmuthu@gmail.com (iOS)' : 'sammuthu@me.com (Android)'} token`);
    }
  }

  async init() {
    // In dev mode, token is already set in constructor
    if (__DEV__) {
      return;
    }

    try {
      const credentials = await Keychain.getInternetCredentials('cosmicboard');
      if (credentials) {
        this.token = credentials.password;
        const userData = JSON.parse(credentials.username); // Store user data as username
        this.refreshToken = userData.refreshToken;
        
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    } catch (error) {
      console.error('Failed to load credentials:', error);
    }
  }

  async login(email: string, password: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      
      const { token, refreshToken, user } = response.data;
      
      this.token = token;
      this.refreshToken = refreshToken;
      
      // Store credentials securely
      await Keychain.setInternetCredentials(
        'cosmicboard',
        JSON.stringify({ email, refreshToken }),
        token
      );
      
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      return { user, token };
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(email: string, password: string, name: string) {
    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name,
      });
      
      // Auto-login after registration
      return this.login(email, password);
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async logout() {
    try {
      // Call logout endpoint if your backend has one
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      // Continue with local logout even if API call fails
    }
    
    this.token = null;
    this.refreshToken = null;
    await Keychain.resetInternetCredentials({ server: 'cosmicboard' } as any);
    delete axios.defaults.headers.common['Authorization'];
  }

  async refreshAuthToken() {
    // In dev mode, tokens don't expire - skip refresh
    if (__DEV__) {
      console.log('🔑 Dev mode: Skipping token refresh (using hardcoded token)');
      return this.token;
    }

    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await axios.post(`${API_URL}/auth/refresh`, {
        refreshToken: this.refreshToken,
      });

      const { token } = response.data;
      this.token = token;

      // Update stored token
      const credentials = await Keychain.getInternetCredentials('cosmicboard');
      if (credentials) {
        await Keychain.setInternetCredentials(
          'cosmicboard',
          credentials.username,
          token
        );
      }

      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      return token;
    } catch (error) {
      // Refresh failed, need to re-login
      await this.logout();
      throw new Error('Session expired. Please login again.');
    }
  }

  // Projects
  async getProjects() {
    const response = await axios.get(`${API_URL}/projects`);
    return response.data;
  }

  async getDeletedProjects() {
    const response = await axios.get(`${API_URL}/projects?deleted=true`);
    return response.data;
  }

  async getProject(id: string) {
    const response = await axios.get(`${API_URL}/projects/${id}`);
    return response.data;
  }

  async createProject(data: {
    name: string;
    description?: string;
  }) {
    const response = await axios.post(`${API_URL}/projects`, data);
    return response.data;
  }

  async updateProject(id: string, data: Partial<{
    name: string;
    description: string;
    visibility: 'PUBLIC' | 'CONTACTS' | 'PRIVATE';
  }>) {
    const response = await axios.put(`${API_URL}/projects/${id}`, data);
    return response.data;
  }

  async updateProjectPriority(id: string, priority: string) {
    const response = await axios.patch(`${API_URL}/projects/${id}/priority`, { priority });
    return response.data;
  }

  async deleteProject(id: string, permanent: boolean = false) {
    await axios.delete(`${API_URL}/projects/${id}${permanent ? '?permanent=true' : ''}`);
  }

  async restoreProject(id: string) {
    const response = await axios.post(`${API_URL}/projects/${id}/restore`);
    return response.data;
  }

  // Tasks
  async getTasks(projectId: string) {
    const response = await axios.get(`${API_URL}/projects/${projectId}/tasks`);
    return response.data;
  }

  async getTask(projectId: string, taskId: string) {
    const response = await axios.get(`${API_URL}/projects/${projectId}/tasks/${taskId}`);
    return response.data;
  }

  async createTask(projectId: string, data: {
    title: string;
    content: string;
    priority: 'SUPERNOVA' | 'STELLAR' | 'NEBULA';
    status?: 'ACTIVE' | 'COMPLETED' | 'DELETED';
    tags?: string[];
    dueDate?: string;
  }) {
    const response = await axios.post(`${API_URL}/projects/${projectId}/tasks`, data);
    return response.data;
  }

  async updateTask(projectId: string, taskId: string, data: any) {
    const response = await axios.put(`${API_URL}/projects/${projectId}/tasks/${taskId}`, data);
    return response.data;
  }

  async deleteTask(projectId: string, taskId: string) {
    await axios.delete(`${API_URL}/projects/${projectId}/tasks/${taskId}`);
  }

  // References
  async getReferences(projectId: string) {
    const response = await axios.get(`${API_URL}/projects/${projectId}/references`);
    return response.data;
  }

  async getReference(projectId: string, referenceId: string) {
    const response = await axios.get(`${API_URL}/projects/${projectId}/references/${referenceId}`);
    return response.data;
  }

  async createReference(projectId: string, data: {
    title: string;
    content: string;
    category: 'snippet' | 'documentation';
    tags?: string[];
    language?: string;
  }) {
    const response = await axios.post(`${API_URL}/projects/${projectId}/references`, data);
    return response.data;
  }

  async updateReference(projectId: string, referenceId: string, data: any) {
    const response = await axios.put(`${API_URL}/projects/${projectId}/references/${referenceId}`, data);
    return response.data;
  }

  async deleteReference(projectId: string, referenceId: string) {
    await axios.delete(`${API_URL}/projects/${projectId}/references/${referenceId}`);
  }

  // User Profile & Subscription
  async getProfile() {
    const response = await axios.get(`${API_URL}/user/profile`);
    return response.data;
  }

  async getCurrentUser() {
    const response = await axios.get(`${API_URL}/auth/me`);
    return response.data;
  }

  async updateProfile(data: {
    name?: string;
    email?: string;
    username?: string;
    bio?: string;
  }) {
    const response = await axios.patch(`${API_URL}/auth/me`, data);
    return response.data;
  }

  // Avatar Management
  async uploadProfilePicture(file: {
    uri: string;
    type: string;
    name: string;
  }) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);

    const response = await axios.post(`${API_URL}/auth/profile-picture`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async getAvatarHistory() {
    const response = await axios.get(`${API_URL}/auth/avatar-history`);
    return response.data;
  }

  async setActiveAvatar(avatarId: string) {
    const response = await axios.patch(`${API_URL}/auth/avatar/${avatarId}/activate`, {});
    return response.data;
  }

  async deleteAvatar(avatarId: string) {
    const response = await axios.delete(`${API_URL}/auth/avatar/${avatarId}`);
    return response.data;
  }

  async getSubscriptionStatus() {
    const response = await axios.get(`${API_URL}/user/subscription`);
    return response.data;
  }

  async createCheckoutSession(planId: string) {
    const response = await axios.post(`${API_URL}/payments/create-checkout-session`, {
      planId,
    });
    return response.data;
  }

  async cancelSubscription() {
    const response = await axios.post(`${API_URL}/payments/cancel-subscription`);
    return response.data;
  }

  // Search
  async searchAll(query: string) {
    const response = await axios.get(`${API_URL}/search`, {
      params: { q: query }
    });
    return response.data;
  }

  async searchTasks(projectId: string, query: string) {
    const response = await axios.get(`${API_URL}/projects/${projectId}/tasks/search`, {
      params: { q: query }
    });
    return response.data;
  }

  // Media
  async getMedia(projectId?: string, type?: 'photo' | 'screenshot' | 'pdf') {
    let url = `${API_URL}/media`;
    const params: any = {};
    
    if (projectId) {
      params.projectId = projectId;
    }
    if (type) {
      params.type = type;
    }
    
    const response = await axios.get(url, { params });
    return response.data;
  }

  async getMediaItem(id: string) {
    const response = await axios.get(`${API_URL}/media/${id}`);
    return response.data;
  }

  async uploadMedia(projectId: string, file: {
    uri: string;
    type: string;
    name: string;
  }) {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      type: file.type,
      name: file.name,
    } as any);
    formData.append('projectId', projectId);

    const response = await axios.post(`${API_URL}/media/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadScreenshot(projectId: string, base64: string, name: string) {
    const response = await axios.post(`${API_URL}/media/screenshot`, {
      projectId,
      image: base64,
      name,
    });
    return response.data;
  }

  async updateMedia(id: string, data: { name?: string }) {
    const response = await axios.put(`${API_URL}/media/${id}`, data);
    return response.data;
  }

  async deleteMedia(id: string) {
    await axios.delete(`${API_URL}/media/${id}`);
  }

  // Themes
  async getThemeTemplates() {
    const response = await axios.get(`${API_URL}/themes/templates`);
    return response.data;
  }

  async getThemeTemplate(id: string) {
    const response = await axios.get(`${API_URL}/themes/templates/${id}`);
    return response.data;
  }

  async getUserActiveTheme() {
    const response = await axios.get(`${API_URL}/themes/user/active`);
    return response.data;
  }

  async getUserThemeCustomizations() {
    const response = await axios.get(`${API_URL}/themes/user/customizations`);
    return response.data;
  }

  async saveThemeCustomization(themeId: string, customColors: any) {
    const response = await axios.post(`${API_URL}/themes/user/customize`, {
      themeId,
      customColors,
    });
    return response.data;
  }

  async setActiveTheme(themeId: string, isGlobal: boolean = true) {
    const response = await axios.post(`${API_URL}/themes/user/set-active`, {
      themeId,
      isGlobal
    });
    return response.data;
  }

  async deleteThemeCustomization(id: string) {
    await axios.delete(`${API_URL}/themes/user/customizations/${id}`);
  }

  // Discover Feed
  async getDiscoverFeed(params?: { limit?: number; cursor?: string }) {
    const response = await axios.get(`${API_URL}/discover`, { params });
    return response.data;
  }

  // Project Visibility
  async updateProjectVisibility(projectId: string, visibility: 'PUBLIC' | 'CONTACTS' | 'PRIVATE') {
    const response = await axios.put(`${API_URL}/projects/${projectId}`, { visibility });
    return response.data;
  }
}

// Create singleton instance
const apiService = new ApiService();

// Setup interceptors for token refresh
axios.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        await apiService.refreshAuthToken();
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect to login
        // This will be handled by the navigation in the app
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiService;