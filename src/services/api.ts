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
    // Note: Authentication is now handled by AuthContext
    // The interceptors in AuthContext will add the token to requests
    // and handle token refresh automatically
  }

  async init() {
    // Authentication initialization is now handled by AuthContext
    // This method is kept for backward compatibility but doesn't do anything
  }

  async login(email: string, password: string) {
    // Login is now handled by AuthContext
    // This method is kept for backward compatibility
    try {
      const response = await axios.post(`${API_URL}/auth/login`, {
        email,
        password,
      });
      return response.data;
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
    // Logout is now handled by AuthContext
    // This method is kept for backward compatibility
    try {
      await axios.post(`${API_URL}/auth/logout`);
    } catch (error) {
      // Continue even if API call fails
    }
  }

  async refreshAuthToken() {
    // Token refresh is now handled by AuthContext
    // This method is kept for backward compatibility
    throw new Error('Token refresh should be handled by AuthContext');
  }

  // Projects
  async getProjects() {
    const response = await axios.get(`${API_URL}/projects`);
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
  }>) {
    const response = await axios.put(`${API_URL}/projects/${id}`, data);
    return response.data;
  }

  async deleteProject(id: string) {
    await axios.delete(`${API_URL}/projects/${id}`);
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

  async updateProfile(data: {
    name?: string;
    email?: string;
  }) {
    const response = await axios.put(`${API_URL}/user/profile`, data);
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

  // Media endpoints
  async getMedia(projectId: string, type?: 'photo' | 'screenshot' | 'pdf') {
    const response = await axios.get(`${API_URL}/projects/${projectId}/media`, {
      params: type ? { type } : {}
    });
    return response.data;
  }

  async uploadMedia(projectId: string, file: FormData) {
    const response = await axios.post(`${API_URL}/projects/${projectId}/media`, file, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }

  async uploadScreenshotFromClipboard(projectId: string, imageData: string, name: string) {
    const response = await axios.post(`${API_URL}/projects/${projectId}/media/screenshot`, {
      imageData,
      name,
    });
    return response.data;
  }

  async deleteMedia(projectId: string, mediaId: string) {
    await axios.delete(`${API_URL}/projects/${projectId}/media/${mediaId}`);
  }

  async renameMedia(projectId: string, mediaId: string, name: string) {
    const response = await axios.put(`${API_URL}/projects/${projectId}/media/${mediaId}`, {
      name,
    });
    return response.data;
  }

  // Theme endpoints
  async getThemeTemplates() {
    const response = await axios.get(`${API_URL}/themes/templates`);
    return response.data.data;
  }

  async getThemeTemplate(id: string) {
    const response = await axios.get(`${API_URL}/themes/templates/${id}`);
    return response.data.data;
  }

  async getUserActiveTheme(deviceType?: 'mobile' | 'tablet') {
    const params = deviceType ? { deviceType } : {};
    const response = await axios.get(`${API_URL}/themes/user/active`, { params });
    return response.data.data;
  }

  async getUserThemeCustomizations() {
    const response = await axios.get(`${API_URL}/themes/user/customizations`);
    return response.data.data;
  }

  async saveThemeCustomization(themeId: string, customColors: any, isGlobal: boolean = true, deviceType?: 'mobile' | 'tablet') {
    const response = await axios.post(`${API_URL}/themes/user/customize`, {
      themeId,
      customColors,
      isGlobal,
      deviceType: isGlobal ? null : deviceType,
    });
    return response.data.data;
  }

  async setActiveTheme(themeId: string, isGlobal: boolean = true, deviceType?: 'mobile' | 'tablet') {
    const response = await axios.post(`${API_URL}/themes/user/set-active`, {
      themeId,
      isGlobal,
      deviceType: isGlobal ? null : deviceType,
    });
    return response.data.data;
  }

  async deleteThemeCustomization(id: string) {
    await axios.delete(`${API_URL}/themes/user/customizations/${id}`);
  }
}

// Create singleton instance
const apiService = new ApiService();

// Note: Response interceptor is already set up in the constructor

export default apiService;