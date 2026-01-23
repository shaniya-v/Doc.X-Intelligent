-- Doc.X-Intelligent Database Schema
-- Stores ONLY metadata (documents stored in MinIO)

-- Documents table (metadata only)
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- File information
    filename VARCHAR(500) NOT NULL,
    object_path VARCHAR(1000) NOT NULL, -- Path in MinIO
    file_type VARCHAR(100),
    file_size INTEGER,
    
    -- Classification
    department VARCHAR(100) NOT NULL,
    summary TEXT,
    confidence FLOAT,
    
    -- Embedding reference
    vector_id VARCHAR(100), -- ChromaDB document ID
    
    -- Source tracking
    source VARCHAR(50) DEFAULT 'manual', -- manual, gmail, sharepoint, etc.
    user_id UUID,
    
    -- Metadata
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Email metadata (if from email)
    email_subject VARCHAR(500),
    email_from VARCHAR(255),
    email_date TIMESTAMP WITH TIME ZONE,
    message_id VARCHAR(255),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(filename, '') || ' ' || 
            COALESCE(summary, '') || ' ' ||
            COALESCE(department, '')
        )
    ) STORED
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_documents_department ON documents(department);
CREATE INDEX IF NOT EXISTS idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX IF NOT EXISTS idx_documents_source ON documents(source);
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_vector_id ON documents(vector_id);
CREATE INDEX IF NOT EXISTS idx_documents_search ON documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_documents_object_path ON documents(object_path);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Department statistics view
CREATE OR REPLACE VIEW department_stats AS
SELECT 
    department,
    COUNT(*) as document_count,
    AVG(confidence) as avg_confidence,
    SUM(file_size) as total_size,
    MAX(upload_date) as last_upload
FROM documents
GROUP BY department
ORDER BY document_count DESC;

-- Recent documents view
CREATE OR REPLACE VIEW recent_documents AS
SELECT 
    id,
    filename,
    department,
    summary,
    confidence,
    source,
    upload_date,
    file_size
FROM documents
ORDER BY upload_date DESC
LIMIT 100;

-- Search function
CREATE OR REPLACE FUNCTION search_documents(
    search_query TEXT,
    filter_department VARCHAR DEFAULT NULL,
    result_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    filename VARCHAR,
    department VARCHAR,
    summary TEXT,
    confidence FLOAT,
    upload_date TIMESTAMP WITH TIME ZONE,
    rank REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        d.id,
        d.filename,
        d.department,
        d.summary,
        d.confidence,
        d.upload_date,
        ts_rank(d.search_vector, plainto_tsquery('english', search_query)) as rank
    FROM documents d
    WHERE 
        d.search_vector @@ plainto_tsquery('english', search_query)
        AND (filter_department IS NULL OR d.department = filter_department)
    ORDER BY rank DESC, d.upload_date DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) - Optional
-- Enable RLS if you want user-based access control
-- ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own documents
-- CREATE POLICY "Users can view own documents"
--     ON documents FOR SELECT
--     USING (auth.uid() = user_id OR user_id IS NULL);

-- Policy for users to insert documents
-- CREATE POLICY "Users can insert documents"
--     ON documents FOR INSERT
--     WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Comments
COMMENT ON TABLE documents IS 'Document metadata storage - actual files stored in MinIO';
COMMENT ON COLUMN documents.object_path IS 'MinIO object path/key';
COMMENT ON COLUMN documents.vector_id IS 'Reference to embedding in ChromaDB';
COMMENT ON COLUMN documents.confidence IS 'LLM classification confidence (0.0-1.0)';
COMMENT ON COLUMN documents.search_vector IS 'Full-text search vector for filename, summary, department';
