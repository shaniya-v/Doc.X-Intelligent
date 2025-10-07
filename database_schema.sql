-- Supabase Database Schema for DOC.X Intelligent

-- Documents table for storing processed documents
CREATE TABLE documents (
    id VARCHAR(255) PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    source VARCHAR(100) NOT NULL,
    language VARCHAR(50),
    assigned_department VARCHAR(100) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    confidence FLOAT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB
);

-- Department workflows table
CREATE TABLE department_workflows (
    id SERIAL PRIMARY KEY,
    department VARCHAR(100) NOT NULL,
    workflow_name VARCHAR(255) NOT NULL,
    steps JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document assignments table
CREATE TABLE document_assignments (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) REFERENCES documents(id),
    assigned_to VARCHAR(255),
    assigned_by VARCHAR(255),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'assigned',
    notes TEXT
);

-- Document processing logs
CREATE TABLE processing_logs (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) REFERENCES documents(id),
    processing_step VARCHAR(255),
    status VARCHAR(50),
    details JSONB,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Chat interactions for RAG system
CREATE TABLE chat_interactions (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255),
    query TEXT NOT NULL,
    response TEXT,
    relevant_documents JSONB,
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for better performance
CREATE INDEX idx_documents_department ON documents(assigned_department);
CREATE INDEX idx_documents_status ON documents(status);
CREATE INDEX idx_documents_created_at ON documents(created_at);
CREATE INDEX idx_documents_language ON documents(language);
CREATE INDEX idx_documents_priority ON documents(priority);

-- Insert default department workflows
INSERT INTO department_workflows (department, workflow_name, steps, is_active) VALUES
('engineering', 'Maintenance Request Process', 
 '{"steps": [
   {"step": 1, "name": "Initial Review", "assignee": "team_lead"},
   {"step": 2, "name": "Technical Assessment", "assignee": "engineer"},
   {"step": 3, "name": "Resource Planning", "assignee": "supervisor"},
   {"step": 4, "name": "Execution", "assignee": "technician"},
   {"step": 5, "name": "Quality Check", "assignee": "qa_engineer"}
 ]}', true),

('finance', 'Financial Document Review', 
 '{"steps": [
   {"step": 1, "name": "Document Verification", "assignee": "accountant"},
   {"step": 2, "name": "Budget Check", "assignee": "budget_analyst"},
   {"step": 3, "name": "Approval", "assignee": "finance_manager"},
   {"step": 4, "name": "Processing", "assignee": "finance_clerk"}
 ]}', true),

('hr', 'HR Document Processing', 
 '{"steps": [
   {"step": 1, "name": "Document Review", "assignee": "hr_assistant"},
   {"step": 2, "name": "Policy Check", "assignee": "hr_specialist"},
   {"step": 3, "name": "Manager Approval", "assignee": "hr_manager"},
   {"step": 4, "name": "Implementation", "assignee": "hr_coordinator"}
 ]}', true),

('admin', 'General Administration', 
 '{"steps": [
   {"step": 1, "name": "Initial Processing", "assignee": "admin_clerk"},
   {"step": 2, "name": "Review", "assignee": "admin_supervisor"},
   {"step": 3, "name": "Action", "assignee": "admin_officer"}
 ]}', true),

('safety', 'Safety Incident Processing', 
 '{"steps": [
   {"step": 1, "name": "Immediate Assessment", "assignee": "safety_officer"},
   {"step": 2, "name": "Investigation", "assignee": "safety_inspector"},
   {"step": 3, "name": "Report Generation", "assignee": "safety_analyst"},
   {"step": 4, "name": "Follow-up Actions", "assignee": "safety_manager"}
 ]}', true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();