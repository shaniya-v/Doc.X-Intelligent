// Document types
export interface Document {
  id: string;
  title: string;
  filename?: string;
  content: string | null;
  summary?: string;
  source: string;
  department?: string;
  assigned_department: string;
  confidence: number;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  language: string;
  status: string;
  created_at: string;
  upload_date?: string;
  updated_at?: string;
  binary_data?: any;
  content_extracted?: boolean;
  file_size?: number;
  processing_status?: string;
  processing_started_at?: string;
  processing_completed_at?: string;
  processing_error?: string;
  retry_count?: number;
  metadata: {
    ai_analysis?: {
      confidence: number;
      department: string;
      key_topics: string[];
      priority: string;
      rag_analysis: boolean;
      summary: string;
      multi_department_analysis?: any;
    };
    attachments_count: number;
    document_type: string;
    matched_keywords: string[];
    message_id: string;
    original_subject: string;
    rag_enhanced: boolean;
    recommended_actions: string[];
    routing_reasoning: string;
    sender: string;
    timestamp: string;
    word_count: number;
    departments_detected?: string[];
    department_tasks?: Record<string, string[]>;
    multi_department?: boolean;
    routing_strategy?: string;
  };
  department_details: {
    code: string;
    malayalam_name: string;
    head: string;
    contact_info: {
      email: string;
      phone: string;
    };
    due_date: string;
    expected_response: string;
  };
  advanced_analysis: {
    ai_insights: {
      summary: string;
      key_topics: string[];
      recommended_actions: string[];
      action_required: boolean;
      confidence_score: number;
    };
  };
}

// Department types
export interface Department {
  id: string;
  name: string;
  displayName?: string;
  malayalamName?: string;
  color: string;
  icon: string;
  description?: string;
}

// Stats types
export interface DepartmentStats {
  status: string;
  department_stats: Record<string, {
    total: number;
    pending: number;
    in_progress: number;
    completed: number;
    urgent: number;
    high: number;
    normal: number;
  }>;
}

// API Response types
export interface ApiResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  count?: number;
}

export interface DocumentsResponse {
  status: 'success';
  count: number;
  documents: Document[];
  filters_applied: {
    department: string | null;
    source: string | null;
    language: string | null;
    priority: string | null;
  };
}

// User types
export interface User {
  id: string;
  email: string;
  user_metadata?: any;
  app_metadata?: any;
}

// Task types
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  department: string;
  created_at: string;
  summary?: string;
  metadata?: any;
}