# Data Sync Implementation Guide

## Overview
This guide explains how to implement data synchronization between local AsyncStorage (offline-first) and MongoDB (cloud backup) for CosmicBoard Mobile.

## Architecture

```
Mobile App (AsyncStorage) <--> Sync Service <--> MongoDB Backend
     |                              |                    |
  Offline Mode                 Sync Logic          Cloud Storage
```

## Step 1: Install Required Dependencies

```bash
npm install axios react-query @tanstack/react-query netinfo
npm install @react-native-community/netinfo
```

## Step 2: Create API Service

Create `src/services/api.ts`:

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://cosmic.board/api'; // Your backend API

class ApiService {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem('@auth:token');
  }

  private get headers() {
    return {
      'Content-Type': 'application/json',
      ...(this.token && { Authorization: `Bearer ${this.token}` }),
    };
  }

  // Projects
  async fetchProjects() {
    const response = await axios.get(`${API_BASE_URL}/projects`, {
      headers: this.headers,
    });
    return response.data;
  }

  async createProject(project: any) {
    const response = await axios.post(`${API_BASE_URL}/projects`, project, {
      headers: this.headers,
    });
    return response.data;
  }

  async updateProject(id: string, updates: any) {
    const response = await axios.put(`${API_BASE_URL}/projects/${id}`, updates, {
      headers: this.headers,
    });
    return response.data;
  }

  async deleteProject(id: string) {
    await axios.delete(`${API_BASE_URL}/projects/${id}`, {
      headers: this.headers,
    });
  }

  // Similar methods for Tasks and References...
}

export default new ApiService();
```

## Step 3: Create Sync Service

Create `src/services/sync.ts`:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import StorageService from './storage';
import ApiService from './api';

interface SyncQueueItem {
  id: string;
  type: 'project' | 'task' | 'reference';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: string;
}

class SyncService {
  private syncQueue: SyncQueueItem[] = [];
  private isSyncing = false;
  private lastSyncTime: Date | null = null;

  async init() {
    // Load sync queue from storage
    const queue = await AsyncStorage.getItem('@sync:queue');
    if (queue) {
      this.syncQueue = JSON.parse(queue);
    }

    // Load last sync time
    const lastSync = await AsyncStorage.getItem('@sync:lastTime');
    if (lastSync) {
      this.lastSyncTime = new Date(lastSync);
    }

    // Set up network listener
    NetInfo.addEventListener(this.handleConnectivityChange);
  }

  private handleConnectivityChange = (state: any) => {
    if (state.isConnected && !this.isSyncing) {
      this.performSync();
    }
  };

  // Add operation to sync queue
  async queueOperation(item: SyncQueueItem) {
    this.syncQueue.push(item);
    await AsyncStorage.setItem('@sync:queue', JSON.stringify(this.syncQueue));
    
    // Try to sync immediately if online
    const netInfo = await NetInfo.fetch();
    if (netInfo.isConnected) {
      this.performSync();
    }
  }

  // Main sync function
  async performSync() {
    if (this.isSyncing) return;
    
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    this.isSyncing = true;

    try {
      // 1. Pull changes from server
      await this.pullChanges();
      
      // 2. Push local changes
      await this.pushChanges();
      
      // 3. Update last sync time
      this.lastSyncTime = new Date();
      await AsyncStorage.setItem('@sync:lastTime', this.lastSyncTime.toISOString());
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async pullChanges() {
    try {
      // Fetch all data from server
      const [projects, tasks, references] = await Promise.all([
        ApiService.fetchProjects(),
        ApiService.fetchTasks(),
        ApiService.fetchReferences(),
      ]);

      // Merge with local data (server wins for conflicts)
      await this.mergeData('projects', projects);
      await this.mergeData('tasks', tasks);
      await this.mergeData('references', references);
    } catch (error) {
      console.error('Pull failed:', error);
    }
  }

  private async pushChanges() {
    const queue = [...this.syncQueue];
    const failedItems: SyncQueueItem[] = [];

    for (const item of queue) {
      try {
        await this.processSyncItem(item);
      } catch (error) {
        console.error(`Failed to sync ${item.type} ${item.id}:`, error);
        failedItems.push(item);
      }
    }

    // Update queue with failed items only
    this.syncQueue = failedItems;
    await AsyncStorage.setItem('@sync:queue', JSON.stringify(this.syncQueue));
  }

  private async processSyncItem(item: SyncQueueItem) {
    switch (item.type) {
      case 'project':
        if (item.action === 'create') {
          await ApiService.createProject(item.data);
        } else if (item.action === 'update') {
          await ApiService.updateProject(item.id, item.data);
        } else if (item.action === 'delete') {
          await ApiService.deleteProject(item.id);
        }
        break;
      // Similar for tasks and references
    }
  }

  private async mergeData(type: string, serverData: any[]) {
    // Simple merge strategy: server data wins
    // You can implement more sophisticated conflict resolution
    const storageKey = `@cosmicboard:${type}`;
    await AsyncStorage.setItem(storageKey, JSON.stringify(serverData));
  }

  // Manual sync trigger
  async syncNow() {
    return this.performSync();
  }

  // Get sync status
  getSyncStatus() {
    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      pendingItems: this.syncQueue.length,
    };
  }
}

export default new SyncService();
```

## Step 4: Update Storage Service for Sync

Update `src/services/storage.ts` to integrate with sync:

```typescript
import SyncService from './sync';

// Add to each create/update/delete method:
async createProject(name: string, description?: string): Promise<Project> {
  const projects = await this.getProjects();
  const newProject: Project = {
    _id: uuidv4(),
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  projects.push(newProject);
  await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
  
  // Queue for sync
  await SyncService.queueOperation({
    id: newProject._id,
    type: 'project',
    action: 'create',
    data: newProject,
    timestamp: new Date().toISOString(),
  });
  
  return newProject;
}
```

## Step 5: Create Sync UI Component

Create `src/components/SyncStatus.tsx`:

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Cloud, CloudOff, RefreshCw } from 'lucide-react-native';
import NetInfo from '@react-native-community/netinfo';
import SyncService from '../services/sync';
import { colors } from '../styles/colors';

export default function SyncStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState(SyncService.getSyncStatus());
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected || false);
    });

    const interval = setInterval(() => {
      setSyncStatus(SyncService.getSyncStatus());
    }, 1000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    await SyncService.syncNow();
    setIsSyncing(false);
  };

  return (
    <View style={styles.container}>
      {isOnline ? (
        <Cloud color={colors.status.active} size={20} />
      ) : (
        <CloudOff color={colors.status.deleted} size={20} />
      )}
      
      <Text style={styles.status}>
        {isOnline ? 'Online' : 'Offline'}
        {syncStatus.pendingItems > 0 && ` (${syncStatus.pendingItems} pending)`}
      </Text>
      
      <TouchableOpacity onPress={handleManualSync} disabled={!isOnline || isSyncing}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={colors.cosmic.purple} />
        ) : (
          <RefreshCw color={colors.cosmic.purple} size={20} />
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 10,
  },
  status: {
    color: colors.text.secondary,
    fontSize: 12,
  },
};
```

## Step 6: Initialize Sync on App Start

Update `App.tsx`:

```typescript
import SyncService from './src/services/sync';
import ApiService from './src/services/api';

export default function App() {
  useEffect(() => {
    // Initialize services
    const initServices = async () => {
      await ApiService.init();
      await SyncService.init();
      
      // Perform initial sync
      SyncService.performSync();
    };
    
    initServices();
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}
```

## Step 7: Backend API Requirements

Your MongoDB backend should provide these endpoints:

```
GET    /api/projects
POST   /api/projects
PUT    /api/projects/:id
DELETE /api/projects/:id

GET    /api/tasks
POST   /api/tasks
PUT    /api/tasks/:id
DELETE /api/tasks/:id

GET    /api/references
POST   /api/references
PUT    /api/references/:id
DELETE /api/references/:id

POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh
```

## Step 8: Conflict Resolution Strategies

### Last Write Wins (Simple)
```typescript
// Server timestamp determines winner
if (serverData.updatedAt > localData.updatedAt) {
  return serverData;
} else {
  return localData;
}
```

### Three-Way Merge (Advanced)
```typescript
// Track base version, local changes, and server changes
// Merge non-conflicting changes automatically
// Flag conflicts for user resolution
```

## Step 9: Testing Sync

1. **Test Offline Mode**
   - Turn off WiFi/cellular
   - Create/edit/delete items
   - Turn connection back on
   - Verify sync occurs

2. **Test Conflict Resolution**
   - Edit same item on two devices
   - Sync both
   - Verify resolution strategy works

3. **Test Queue Persistence**
   - Make changes offline
   - Kill app
   - Restart app online
   - Verify queued changes sync

## Next Steps

1. Implement authentication flow
2. Add real-time sync with WebSockets
3. Implement selective sync (sync only recent data)
4. Add sync progress indicators
5. Implement backup/restore functionality
6. Add encryption for sensitive data

## Security Considerations

- Use HTTPS for all API calls
- Implement token refresh mechanism
- Encrypt sensitive data in AsyncStorage
- Validate all data before syncing
- Implement rate limiting on API

This architecture provides:
- Offline-first functionality
- Automatic sync when online
- Queue persistence across app restarts
- Conflict resolution
- Manual sync option
- Visual sync status indicators