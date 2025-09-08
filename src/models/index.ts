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

// Media types based on web project implementation
export interface MediaFile {
  _id: string;
  projectId: string;
  name: string;
  originalName: string;
  url: string;
  thumbnailUrl?: string;
  type: 'photo' | 'screenshot' | 'pdf';
  mimeType: string;
  size: number;
  metadata?: {
    width?: number;
    height?: number;
    pages?: number; // For PDFs
  };
  createdAt: string;
  updatedAt: string;
}

export interface Photo extends MediaFile {
  type: 'photo';
  metadata: {
    width: number;
    height: number;
  };
}

export interface Screenshot extends MediaFile {
  type: 'screenshot';
  metadata: {
    width: number;
    height: number;
  };
}

export interface PDFFile extends MediaFile {
  type: 'pdf';
  metadata?: {
    pages?: number;
    extension?: string;
    isViewable?: boolean;
    type?: string;
    width?: number;
    height?: number;
  };
}