import AsyncStorage from '@react-native-async-storage/async-storage';
import { Project, Task, Reference } from '../models';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEYS = {
  PROJECTS: '@cosmicboard:projects',
  TASKS: '@cosmicboard:tasks',
  REFERENCES: '@cosmicboard:references',
};

class StorageService {
  // Projects
  async getProjects(): Promise<Project[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.PROJECTS);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error fetching projects:', error);
      return [];
    }
  }

  async getProject(id: string): Promise<Project | null> {
    const projects = await this.getProjects();
    return projects.find(p => p._id === id) || null;
  }

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
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    const projects = await this.getProjects();
    const index = projects.findIndex(p => p._id === id);
    
    if (index === -1) return null;
    
    projects[index] = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects));
    return projects[index];
  }

  async deleteProject(id: string): Promise<boolean> {
    const projects = await this.getProjects();
    const filtered = projects.filter(p => p._id !== id);
    
    if (filtered.length === projects.length) return false;
    
    // Also delete related tasks and references
    const tasks = await this.getTasks();
    const references = await this.getReferences();
    
    const filteredTasks = tasks.filter(t => t.projectId !== id);
    const filteredReferences = references.filter(r => r.projectId !== id);
    
    await Promise.all([
      AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered)),
      AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filteredTasks)),
      AsyncStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(filteredReferences)),
    ]);
    
    return true;
  }

  // Tasks
  async getTasks(projectId?: string): Promise<Task[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TASKS);
      const tasks = data ? JSON.parse(data) : [];
      return projectId ? tasks.filter((t: Task) => t.projectId === projectId) : tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async getTask(id: string): Promise<Task | null> {
    const tasks = await this.getTasks();
    return tasks.find(t => t._id === id) || null;
  }

  async createTask(task: Omit<Task, '_id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = {
      ...task,
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    tasks.push(newTask);
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const tasks = await this.getTasks();
    const index = tasks.findIndex(t => t._id === id);
    
    if (index === -1) return null;
    
    tasks[index] = {
      ...tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    return tasks[index];
  }

  async deleteTask(id: string): Promise<boolean> {
    const tasks = await this.getTasks();
    const filtered = tasks.filter(t => t._id !== id);
    
    if (filtered.length === tasks.length) return false;
    
    await AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(filtered));
    return true;
  }

  // Neural Notes (internally still uses 'references' for backward compatibility)
  async getReferences(projectId?: string): Promise<Reference[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.REFERENCES);
      const references = data ? JSON.parse(data) : [];
      return projectId ? references.filter((r: Reference) => r.projectId === projectId) : references;
    } catch (error) {
      console.error('Error fetching references:', error);
      return [];
    }
  }

  async getReference(id: string): Promise<Reference | null> {
    const references = await this.getReferences();
    return references.find(r => r._id === id) || null;
  }

  async createReference(reference: Omit<Reference, '_id' | 'createdAt' | 'updatedAt'>): Promise<Reference> {
    const references = await this.getReferences();
    const newReference: Reference = {
      ...reference,
      _id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    references.push(newReference);
    await AsyncStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(references));
    return newReference;
  }

  async updateReference(id: string, updates: Partial<Reference>): Promise<Reference | null> {
    const references = await this.getReferences();
    const index = references.findIndex(r => r._id === id);
    
    if (index === -1) return null;
    
    references[index] = {
      ...references[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    
    await AsyncStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(references));
    return references[index];
  }

  async deleteReference(id: string): Promise<boolean> {
    const references = await this.getReferences();
    const filtered = references.filter(r => r._id !== id);
    
    if (filtered.length === references.length) return false;
    
    await AsyncStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(filtered));
    return true;
  }

  // Export/Import
  async exportData(): Promise<string> {
    const [projects, tasks, references] = await Promise.all([
      this.getProjects(),
      this.getTasks(),
      this.getReferences(),
    ]);

    return JSON.stringify({
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: { projects, tasks, references },
    }, null, 2);
  }

  async importData(jsonString: string): Promise<boolean> {
    try {
      const parsed = JSON.parse(jsonString);
      
      if (!parsed.data) {
        throw new Error('Invalid backup format');
      }

      const { projects = [], tasks = [], references = [] } = parsed.data;

      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects)),
        AsyncStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks)),
        AsyncStorage.setItem(STORAGE_KEYS.REFERENCES, JSON.stringify(references)),
      ]);

      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  async clearAll(): Promise<void> {
    await Promise.all([
      AsyncStorage.removeItem(STORAGE_KEYS.PROJECTS),
      AsyncStorage.removeItem(STORAGE_KEYS.TASKS),
      AsyncStorage.removeItem(STORAGE_KEYS.REFERENCES),
    ]);
  }
}

export default new StorageService();