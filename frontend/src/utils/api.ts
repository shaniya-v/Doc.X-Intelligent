import axios from 'axios';
import { Document, DepartmentStats, DocumentsResponse } from '../types';

// FastAPI backend URL - use environment variable or fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_ENDPOINT = `${API_BASE_URL}/api`;

// Create API instance
const api = axios.create({
  baseURL: API_ENDPOINT,
  timeout: 30000, // Increased for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// API endpoints
export const documentApi = {
  // Upload document
  uploadDocument: async (file: File, userId?: string): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    if (userId) formData.append('user_id', userId);
    formData.append('source', 'manual');

    const response = await api.post('/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Search documents
  searchDocuments: async (query: string, department?: string, limit: number = 10): Promise<any> => {
    const response = await api.post('/documents/search', {
      query,
      department,
      limit
    });
    return response.data;
  },

  // Get single document with download URL
  getDocument: async (documentId: string): Promise<any> => {
    const response = await api.get(`/documents/${documentId}`);
    return response.data;
  },

  // Get all documents
  getDocuments: async (limit: number = 100): Promise<DocumentsResponse> => {
    const response = await api.get(`/documents/all?limit=${limit}`);
    return response.data;
  },

  // Delete document
  deleteDocument: async (documentId: string): Promise<any> => {
    const response = await api.delete(`/documents/${documentId}`);
    return response.data;
  },

  // Download document (get presigned URL)
  getDownloadUrl: async (documentId: string): Promise<string> => {
    const doc = await documentApi.getDocument(documentId);
    return doc.download_url;
  },

  // Get documents by department
  getDocumentsByDepartment: async (department: string): Promise<any> => {
    const response = await api.get(`/documents/department/${department}`);
    return response.data;
  },

  // Get department tasks
  getDepartmentTasks: async (department: string): Promise<any> => {
    const response = await api.get(`/departments/${department}/tasks`);
    return response.data;
  }
};

// Health check
export const healthCheck = async (): Promise<any> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return { status: 'unhealthy', error: String(error) };
  }
};

export default api;