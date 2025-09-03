# Cloud-First Architecture for CosmicBoard Mobile

## Why Cloud-First Makes Sense

✅ **Single source of truth** - MongoDB backend  
✅ **No sync conflicts** - Always latest data  
✅ **Simpler codebase** - No offline logic needed  
✅ **Instant updates** - Changes reflect everywhere  
✅ **One subscription** - Works on web, iOS, Android  
✅ **Tech audience** - Always connected anyway  

## Architecture Overview

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────┐
│   Mobile App    │────▶│   REST API   │────▶│   MongoDB   │
│  (iOS/Android)  │     │   (Next.js)  │     │   Database  │
└─────────────────┘     └──────────────┘     └─────────────┘
         │                      ▲                     ▲
         │                      │                     │
         └──────────────────────┴─────────────────────┘
                    Same Backend as Web App
```

## Implementation Plan

### 1. Install Required Packages

```bash
npm install axios react-query @tanstack/react-query
npm install react-native-keychain  # Secure token storage
npm install react-native-mmkv      # Fast key-value storage for settings
```

### 2. Environment Configuration

Create `.env`:
```env
API_URL=https://api.cosmic.board
# Or for local development:
# API_URL=http://localhost:7777/api
```

### 3. Create API Service

Create `src/services/api.ts`:

```typescript
import axios from 'axios';
import * as Keychain from 'react-native-keychain';

const API_URL = process.env.API_URL || 'https://api.cosmic.board';

class ApiService {
  private token: string | null = null;

  async init() {
    try {
      const credentials = await Keychain.getInternetCredentials('cosmicboard');
      if (credentials) {
        this.token = credentials.password;
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
      }
    } catch (error) {
      console.error('Failed to load token:', error);
    }
  }

  async login(email: string, password: string) {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    
    this.token = response.data.token;
    await Keychain.setInternetCredentials(
      'cosmicboard',
      email,
      response.data.token
    );
    
    axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    return response.data;
  }

  async logout() {
    this.token = null;
    await Keychain.resetInternetCredentials('cosmicboard');
    delete axios.defaults.headers.common['Authorization'];
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

  async createProject(data: any) {
    const response = await axios.post(`${API_URL}/projects`, data);
    return response.data;
  }

  async updateProject(id: string, data: any) {
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

  async createTask(projectId: string, data: any) {
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

  async createReference(projectId: string, data: any) {
    const response = await axios.post(`${API_URL}/projects/${projectId}/references`, data);
    return response.data;
  }

  // User Profile
  async getProfile() {
    const response = await axios.get(`${API_URL}/user/profile`);
    return response.data;
  }

  async getSubscriptionStatus() {
    const response = await axios.get(`${API_URL}/user/subscription`);
    return response.data;
  }
}

export default new ApiService();
```

### 4. Setup React Query

Update `App.tsx`:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ApiService from './src/services/api';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
    },
  },
});

export default function App() {
  useEffect(() => {
    ApiService.init();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </SafeAreaProvider>
    </QueryClientProvider>
  );
}
```

### 5. Create Custom Hooks

Create `src/hooks/useProjects.ts`:

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import ApiService from '../services/api';

export const useProjects = () => {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => ApiService.getProjects(),
  });
};

export const useProject = (id: string) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => ApiService.getProject(id),
  });
};

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: any) => ApiService.createProject(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: any) => ApiService.updateProject(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};
```

### 6. Update Screens to Use Cloud Data

Update `src/screens/ProjectsScreen.tsx`:

```typescript
import { useProjects, useCreateProject } from '../hooks/useProjects';

export default function ProjectsScreen() {
  const { data: projects, isLoading, error, refetch } = useProjects();
  const createProject = useCreateProject();

  const handleCreateProject = () => {
    Alert.prompt(
      'New Project',
      'Enter project name:',
      async (name) => {
        if (name && name.trim()) {
          await createProject.mutateAsync({ name: name.trim() });
        }
      },
      'plain-text'
    );
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.cosmic.purple} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Failed to load projects</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text style={styles.retryText}>Tap to retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item._id}
        renderItem={renderProject}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={refetch}
            tintColor={colors.cosmic.purple}
          />
        }
      />
      {/* FAB for creating projects */}
    </View>
  );
}
```

### 7. Authentication Screen

Create `src/screens/AuthScreen.tsx`:

```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import ApiService from '../services/api';

export default function AuthScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await ApiService.login(email, password);
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Login Failed', error.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>CosmicBoard</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity 
        style={styles.button} 
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.buttonText}>
          {isLoading ? 'Logging in...' : 'Login'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

## Benefits of This Approach

### 1. **Simpler Mental Model**
- No sync logic
- No conflict resolution
- No offline queue management
- Just fetch and display

### 2. **Better UX for Tech Users**
- Real-time updates
- No sync delays
- Consistent data across devices
- No "sync conflicts" to resolve

### 3. **Easier Maintenance**
- One API to maintain
- One data model
- One authentication system
- One subscription model

### 4. **Cost Effective**
- No need for complex offline storage
- Smaller app bundle size
- Less testing required
- Faster development

## Subscription Model

### Single Subscription, All Platforms:
```typescript
// Check subscription on app launch
const checkSubscription = async () => {
  const status = await ApiService.getSubscriptionStatus();
  
  if (!status.isActive) {
    navigation.navigate('SubscriptionScreen');
  }
};

// Features available based on subscription
const features = {
  free: {
    maxProjects: 3,
    maxTasksPerProject: 10,
  },
  pro: {
    maxProjects: Infinity,
    maxTasksPerProject: Infinity,
    cloudSync: true,
    mobileApp: true,
  },
};
```

## Error Handling

```typescript
// Global error interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired, redirect to login
      navigation.navigate('Auth');
    } else if (error.response?.status === 403) {
      // Subscription expired
      navigation.navigate('Subscription');
    } else if (!error.response) {
      // Network error
      Alert.alert('Network Error', 'Please check your connection');
    }
    return Promise.reject(error);
  }
);
```

## WebSocket for Real-time Updates (Optional)

```typescript
import io from 'socket.io-client';

const socket = io(API_URL, {
  auth: { token: ApiService.token }
});

socket.on('project:updated', (data) => {
  queryClient.setQueryData(['project', data.id], data);
});

socket.on('task:created', (data) => {
  queryClient.invalidateQueries(['tasks', data.projectId]);
});
```

## Migration Path

1. **Phase 1**: Remove AsyncStorage logic
2. **Phase 2**: Implement authentication
3. **Phase 3**: Connect to MongoDB API
4. **Phase 4**: Add subscription checks
5. **Phase 5**: Deploy to TestFlight/Play Store

This cloud-first approach is much cleaner and perfect for your tech-savvy audience!