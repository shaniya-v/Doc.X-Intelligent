import axios from 'axios';
import { Document, DepartmentStats, DocumentsResponse } from '../types';

// Use direct backend connection for now
const API_BASE_URL = 'http://127.0.0.1:5000/api';

// Create API instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const documentApi = {
  // Get all documents with optional filters
  getDocuments: async (filters?: {
    department?: string;
    source?: string;
    language?: string;
    priority?: string;
  }): Promise<DocumentsResponse> => {
    const params = new URLSearchParams();
    if (filters?.department) params.append('department', filters.department);
    if (filters?.source) params.append('source', filters.source);
    if (filters?.language) params.append('language', filters.language);
    if (filters?.priority) params.append('priority', filters.priority);
    
    const response = await api.get<DocumentsResponse>(`/documents?${params}`);
    return response.data;
  },

  // Get documents by department
  getDocumentsByDepartment: async (department: string): Promise<Document[]> => {
    const response = await documentApi.getDocuments({ department });
    return response.documents;
  },

  // Get department-specific tasks (including from multi-department documents)
  getDepartmentTasks: async (department: string): Promise<{
    documents: Document[];
    multiDepartmentTasks: Array<{
      document: Document;
      tasks: string[];
      otherDepartments: string[];
    }>;
  }> => {
    const response = await api.get(`/departments/${department}/tasks`);
    return response.data;
  },

  // Get single document
  getDocument: async (documentId: string): Promise<Document> => {
    const response = await api.get<{ document: Document }>(`/documents/${documentId}`);
    return response.data.document;
  },

  // Get department statistics
  getDepartmentStats: async (): Promise<DepartmentStats> => {
    const response = await api.get<DepartmentStats>('/departments/stats');
    return response.data;
  },

  // Get analysis insights
  getAnalysisInsights: async () => {
    const response = await api.get('/analysis/insights');
    return response.data;
  },

  // Download document file
  downloadDocument: async (documentId: string): Promise<Blob> => {
    const response = await api.get(`/documents/download/${documentId}/file`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Store document file
  storeDocument: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents/storage', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // RAG system management
  ragStats: async (): Promise<any> => {
    const response = await api.get('/rag/stats');
    return response.data;
  },

  retrainRAG: async (): Promise<any> => {
    const response = await api.post('/rag/retrain');
    return response.data;
  }
};

// Health check
export const healthCheck = async (): Promise<boolean> => {
  try {
    const response = await api.get('/health');
    return response.status === 200;
  } catch (error) {
    console.error('Health check failed:', error);
    return false;
  }
};

export default api;