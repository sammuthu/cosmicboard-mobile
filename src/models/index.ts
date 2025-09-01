export interface Project {
  _id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  _id: string;
  projectId: string;
  title: string;
  content: string;
  priority: 'SUPERNOVA' | 'STELLAR' | 'NEBULA';
  status: 'ACTIVE' | 'COMPLETED' | 'DELETED';
  tags: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Reference {
  _id: string;
  projectId: string;
  title: string;
  content: string;
  category: 'snippet' | 'documentation';
  tags: string[];
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectWithCounts extends Project {
  counts: {
    tasks: {
      active: number;
      completed: number;
      deleted: number;
    };
    references: {
      total: number;
      snippets: number;
      documentation: number;
    };
  };
}