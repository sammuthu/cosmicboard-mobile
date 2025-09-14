import axios from 'axios';
import * as Keychain from 'react-native-keychain';
import { Platform } from 'react-native';

// Use the same backend as your web app
// For Android emulator, use 10.0.2.2 to access host machine's localhost
const API_URL = __DEV__ 
  ? Platform.OS === 'android' 
    ? 'http://10.0.2.2:7779/api'  // Android emulator special IP for host localhost
    : 'http://localhost:7779/api'  // iOS simulator or web
  : 'https://cosmicspace.app/api';  // For production

class ApiService {
  private token: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // Set up axios interceptor to add auth token to all requests
    axios.interceptors.request.use(
      async (config) => {
        // For development, use a persistent dummy token
        if (__DEV__) {
          config.headers.Authorization = `Bearer dev-token-persistent-nmuthu`;
        } else {
          // In production, get token from storage
          const credentials = await Keychain.getInternetCredentials('cosmicboard');
          if (credentials) {
            config.headers.Authorization = `Bearer ${credentials.password}`;
          }
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Set up response interceptor to handle token refresh
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401 && !__DEV__) {
          // Token might be expired, clear credentials
          await Keychain.resetInternetCredentials('cosmicboard');
        }
        return Promise.reject(error);
      }
    );
  }

  async init() {
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
    await Keychain.resetInternetCredentials('cosmicboard');
    delete axios.defaults.headers.common['Authorization'];
  }

  async refreshAuthToken() {
    // In development, tokens never expire
    if (__DEV__) {
      return 'dev-token-persistent';
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
    // In development, return real nmuthu@gmail.com development data
    if (__DEV__) {
      return [
        {
          id: 'proj-cosmicboard',
          _id: 'proj-cosmicboard',
          name: 'CosmicBoard Development',
          description: 'Full-stack project management app with React Native mobile and Next.js web',
          tasksCount: 12,
          referencesCount: 8,
          createdAt: '2024-01-15T10:00:00Z',
        },
        {
          id: 'proj-ai-assistant',
          _id: 'proj-ai-assistant',
          name: 'AI Assistant Integration',
          description: 'Integrate OpenAI GPT-4 for intelligent task suggestions and code generation',
          tasksCount: 7,
          referencesCount: 5,
          createdAt: '2024-02-01T14:30:00Z',
        },
        {
          id: 'proj-data-viz',
          _id: 'proj-data-viz',
          name: 'Data Visualization Dashboard',
          description: 'Real-time analytics dashboard with D3.js and WebSocket updates',
          tasksCount: 15,
          referencesCount: 10,
          createdAt: '2024-02-15T09:15:00Z',
        },
        {
          id: 'proj-microservices',
          _id: 'proj-microservices',
          name: 'Microservices Architecture',
          description: 'Refactor monolith to microservices with Docker and Kubernetes',
          tasksCount: 20,
          referencesCount: 15,
          createdAt: '2024-03-01T11:00:00Z',
        },
        {
          id: 'proj-mobile-auth',
          _id: 'proj-mobile-auth',
          name: 'Mobile Authentication System',
          description: 'Implement biometric auth and magic link for mobile app',
          tasksCount: 6,
          referencesCount: 4,
          createdAt: '2024-03-10T16:45:00Z',
        },
      ];
    }

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
    // In development, return real nmuthu@gmail.com development data based on project
    if (__DEV__) {
      const tasksByProject: Record<string, any[]> = {
        'proj-cosmicboard': [
          {
            id: 'task-cb-1',
            title: 'Implement magic link authentication',
            content: 'Add passwordless authentication using magic links sent to email. Support both web and mobile platforms.',
            priority: 'SUPERNOVA',
            status: 'COMPLETED',
            projectId: 'proj-cosmicboard',
            tags: ['auth', 'security', 'mobile'],
            createdAt: '2024-03-15T10:00:00Z',
          },
          {
            id: 'task-cb-2',
            title: 'Add theme selector to homepage',
            content: 'Create a beautiful theme selector with 5 cosmic themes: Star, Cloud, Sunset, Ocean, and Lightning',
            priority: 'STELLAR',
            status: 'ACTIVE',
            projectId: 'proj-cosmicboard',
            tags: ['ui', 'design', 'frontend'],
            createdAt: '2024-03-16T14:30:00Z',
          },
          {
            id: 'task-cb-3',
            title: 'Implement media management',
            content: 'Support photo uploads, screenshots, and PDF files with thumbnail generation',
            priority: 'SUPERNOVA',
            status: 'ACTIVE',
            projectId: 'proj-cosmicboard',
            tags: ['media', 'storage', 'backend'],
            createdAt: '2024-03-17T09:15:00Z',
          },
          {
            id: 'task-cb-4',
            title: 'Optimize bundle size',
            content: 'Reduce React Native bundle size by 40% through code splitting and lazy loading',
            priority: 'NEBULA',
            status: 'ACTIVE',
            projectId: 'proj-cosmicboard',
            tags: ['performance', 'optimization'],
            createdAt: '2024-03-18T11:00:00Z',
          },
        ],
        'proj-ai-assistant': [
          {
            id: 'task-ai-1',
            title: 'Setup OpenAI API integration',
            content: 'Configure GPT-4 API with proper rate limiting and error handling',
            priority: 'SUPERNOVA',
            status: 'COMPLETED',
            projectId: 'proj-ai-assistant',
            tags: ['api', 'ai', 'backend'],
            createdAt: '2024-03-10T10:00:00Z',
          },
          {
            id: 'task-ai-2',
            title: 'Create prompt templates',
            content: 'Design effective prompts for task generation, code reviews, and bug fixes',
            priority: 'STELLAR',
            status: 'ACTIVE',
            projectId: 'proj-ai-assistant',
            tags: ['ai', 'prompts', 'design'],
            createdAt: '2024-03-11T14:30:00Z',
          },
        ],
        'proj-data-viz': [
          {
            id: 'task-dv-1',
            title: 'Implement real-time charts',
            content: 'Use D3.js to create interactive, real-time updating charts with smooth animations',
            priority: 'SUPERNOVA',
            status: 'ACTIVE',
            projectId: 'proj-data-viz',
            tags: ['visualization', 'd3js', 'frontend'],
            createdAt: '2024-03-05T10:00:00Z',
          },
          {
            id: 'task-dv-2',
            title: 'Setup WebSocket server',
            content: 'Configure Socket.io for real-time data streaming with reconnection logic',
            priority: 'STELLAR',
            status: 'COMPLETED',
            projectId: 'proj-data-viz',
            tags: ['websocket', 'realtime', 'backend'],
            createdAt: '2024-03-06T14:30:00Z',
          },
        ],
      };

      return tasksByProject[projectId] || [];
    }

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
    // In development, return real nmuthu@gmail.com development data
    if (__DEV__) {
      const refsByProject: Record<string, any[]> = {
        'proj-cosmicboard': [
          {
            id: 'ref-cb-1',
            title: 'React Native Navigation Setup',
            content: '```typescript\n// Navigation setup with typed routes\nimport { createStackNavigator } from "@react-navigation/stack";\n\ntype RootStackParamList = {\n  Home: undefined;\n  ProjectDetail: { projectId: string };\n};\n```',
            category: 'snippet',
            language: 'typescript',
            tags: ['navigation', 'react-native'],
            projectId: 'proj-cosmicboard',
            createdAt: '2024-03-15T10:00:00Z',
          },
          {
            id: 'ref-cb-2',
            title: 'Prisma Schema Documentation',
            content: 'Complete guide for Prisma schema with PostgreSQL including relations, indexes, and migrations',
            category: 'documentation',
            tags: ['database', 'prisma', 'postgresql'],
            projectId: 'proj-cosmicboard',
            createdAt: '2024-03-16T14:30:00Z',
          },
        ],
        'proj-ai-assistant': [
          {
            id: 'ref-ai-1',
            title: 'OpenAI Streaming Response Handler',
            content: '```javascript\n// Handle streaming responses from OpenAI\nconst stream = await openai.chat.completions.create({\n  model: "gpt-4",\n  messages,\n  stream: true,\n});\n\nfor await (const chunk of stream) {\n  process.stdout.write(chunk.choices[0]?.delta?.content || "");\n}\n```',
            category: 'snippet',
            language: 'javascript',
            tags: ['openai', 'streaming', 'api'],
            projectId: 'proj-ai-assistant',
            createdAt: '2024-03-10T10:00:00Z',
          },
        ],
      };

      return refsByProject[projectId] || [];
    }

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
    // In development, return real nmuthu@gmail.com development data
    if (__DEV__) {
      const mediaByProject: Record<string, any[]> = {
        'proj-cosmicboard': [
          {
            id: 'media-cb-1',
            name: 'Home Screen Design',
            type: 'screenshot',
            url: 'https://via.placeholder.com/400x800/6B46C1/FFFFFF?text=Home+Screen',
            thumbnailUrl: 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=Home',
            projectId: 'proj-cosmicboard',
            createdAt: '2024-03-15T10:00:00Z',
          },
          {
            id: 'media-cb-2',
            name: 'Theme Selector UI',
            type: 'photo',
            url: 'https://via.placeholder.com/600x400/0EA5E9/FFFFFF?text=Theme+Selector',
            thumbnailUrl: 'https://via.placeholder.com/150/0EA5E9/FFFFFF?text=Theme',
            projectId: 'proj-cosmicboard',
            createdAt: '2024-03-16T14:30:00Z',
          },
          {
            id: 'media-cb-3',
            name: 'Architecture Diagram',
            type: 'pdf',
            url: 'https://via.placeholder.com/600x800/F97316/FFFFFF?text=Architecture+PDF',
            thumbnailUrl: 'https://via.placeholder.com/150/F97316/FFFFFF?text=PDF',
            projectId: 'proj-cosmicboard',
            createdAt: '2024-03-17T09:15:00Z',
          },
        ],
        'proj-ai-assistant': [
          {
            id: 'media-ai-1',
            name: 'AI Flow Diagram',
            type: 'screenshot',
            url: 'https://via.placeholder.com/400x600/10B981/FFFFFF?text=AI+Flow',
            thumbnailUrl: 'https://via.placeholder.com/150/10B981/FFFFFF?text=AI',
            projectId: 'proj-ai-assistant',
            createdAt: '2024-03-10T10:00:00Z',
          },
        ],
      };

      const media = mediaByProject[projectId] || [];

      // Filter by type if specified
      if (type) {
        return media.filter(m => m.type === type);
      }

      return media;
    }

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
}

// Create singleton instance
const apiService = new ApiService();

// Note: Response interceptor is already set up in the constructor

export default apiService;