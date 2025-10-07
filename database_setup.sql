-- DOC.X Intelligent Database Setup for Supabase
-- Copy and paste these queries into your Supabase SQL Editor

-- 1. Create documents table for storing processed documents
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    source VARCHAR(100) DEFAULT 'email',
    language VARCHAR(50) DEFAULT 'english',
    assigned_department VARCHAR(100) NOT NULL,
    priority VARCHAR(50) DEFAULT 'normal',
    confidence INTEGER DEFAULT 70,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 2. Create departments table for department management
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    malayalam_name VARCHAR(200),
    description TEXT,
    head_email VARCHAR(255),
    keywords TEXT[],
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Insert KMRL departments
INSERT INTO departments (name, malayalam_name, description, keywords) VALUES
('Engineering', 'എഞ്ചിനീയറിംഗ്', 'Technical maintenance, infrastructure, signal systems', ARRAY['maintenance', 'repair', 'technical', 'brake', 'signal', 'track', 'infrastructure', 'engineering']),
('Finance', 'ധനകാര്യം', 'Budget, payments, procurement, financial planning', ARRAY['budget', 'payment', 'financial', 'procurement', 'invoice', 'cost', 'expense', 'accounting']),
('Human Resources', 'മനുഷ്യവിഭവശേഷി', 'Employee management, training, recruitment', ARRAY['employee', 'staff', 'training', 'recruitment', 'hr', 'policy', 'attendance', 'leave']),
('Operations', 'പ്രവർത്തനങ്ങൾ', 'Train scheduling, passenger services, station management', ARRAY['schedule', 'train', 'passenger', 'station', 'operation', 'service', 'route', 'timing']),
('Safety & Security', 'സുരക്ഷ', 'Safety protocols, emergency response, security', ARRAY['safety', 'security', 'emergency', 'incident', 'accident', 'protocol', 'സുരക്ഷ', 'അപകടം']),
('Administration', 'ഭരണം', 'General administration, documentation, office management', ARRAY['admin', 'office', 'document', 'circular', 'general', 'supplies', 'stationery'])
ON CONFLICT (name) DO NOTHING;

-- 4. Create document_analytics table for tracking
CREATE TABLE IF NOT EXISTS document_analytics (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR(255) REFERENCES documents(id),
    department VARCHAR(100),
    confidence_score INTEGER,
    processing_time_ms INTEGER,
    rag_enhanced BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(assigned_department);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);
CREATE INDEX IF NOT EXISTS idx_documents_priority ON documents(priority);
CREATE INDEX IF NOT EXISTS idx_documents_metadata_gin ON documents USING gin(metadata);

-- 6. Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 7. Create trigger for auto-updating timestamps
DROP TRIGGER IF EXISTS update_documents_updated_at ON documents;
CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW 
    EXECUTE PROCEDURE update_updated_at_column();

-- 8. Enable Row Level Security (RLS) for security
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analytics ENABLE ROW LEVEL SECURITY;

-- 9. Create policies for public access (adjust as needed for production)
CREATE POLICY "Allow all operations on documents" ON documents FOR ALL USING (true);
CREATE POLICY "Allow all operations on departments" ON departments FOR ALL USING (true);
CREATE POLICY "Allow all operations on analytics" ON document_analytics FOR ALL USING (true);

-- 10. Create view for document summary with department info
CREATE OR REPLACE VIEW document_summary AS
SELECT 
    d.id,
    d.title,
    d.assigned_department,
    d.priority,
    d.confidence,
    d.status,
    d.created_at,
    d.metadata->>'sender' as sender,
    d.metadata->>'rag_enhanced' as rag_enhanced,
    d.metadata->>'document_type' as document_type,
    dept.malayalam_name as department_malayalam,
    LENGTH(d.content) as content_length
FROM documents d
LEFT JOIN departments dept ON d.assigned_department = dept.name
ORDER BY d.created_at DESC;

-- Verification queries (run these to check setup)
-- Check if tables were created
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('documents', 'departments', 'document_analytics');

-- Check documents table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'documents' ORDER BY ordinal_position;

-- Check departments data
SELECT name, malayalam_name FROM departments ORDER BY name;

-- Check if documents table is ready for data
SELECT 'Documents table' as table_name, COUNT(*) as row_count FROM documents
UNION ALL
SELECT 'Departments table' as table_name, COUNT(*) as row_count FROM departments;