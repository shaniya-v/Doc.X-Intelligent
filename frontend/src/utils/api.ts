import axios from 'axios';
import { Document, DepartmentStats, DocumentsResponse } from '../types';

// FastAPI backend URL
const API_BASE_URL = 'http://localhost:8000/api';

// Create API instance
const api = axios.create({
  baseURL: API_BASE_URL,
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

  // Get documents by department
  getDocumentsByDepartment: async (department: string, limit: number = 50): Promise<any> => {
    const response = await api.get(`/documents/department/${department}?limit=${limit}`);
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