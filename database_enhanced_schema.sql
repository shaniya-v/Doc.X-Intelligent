-- Enhanced database schema for two-stage document processing
-- This supports: Storage first → RAG processing → Department routing

-- Add processing status to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS processing_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS processing_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_completed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS processing_error TEXT,
ADD COLUMN IF NOT EXISTS retry_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS binary_data BYTEA,
ADD COLUMN IF NOT EXISTS content_extracted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS file_size INTEGER DEFAULT 0;

-- Create index for efficient processing queue queries
CREATE INDEX IF NOT EXISTS idx_documents_processing_status ON documents(processing_status, created_at);
CREATE INDEX IF NOT EXISTS idx_documents_pending ON documents(processing_status) WHERE processing_status = 'pending';

-- Create document processing log table
CREATE TABLE IF NOT EXISTS document_processing_log (
    id SERIAL PRIMARY KEY,
    document_id VARCHAR REFERENCES documents(id) ON DELETE CASCADE,
    stage VARCHAR(50) NOT NULL, -- 'storage', 'content_extraction', 'rag_analysis', 'department_assignment'
    status VARCHAR(20) NOT NULL, -- 'started', 'completed', 'failed'
    details JSONB,
    error_message TEXT,
    processing_time_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for processing log queries
CREATE INDEX IF NOT EXISTS idx_processing_log_document ON document_processing_log(document_id, created_at);
CREATE INDEX IF NOT EXISTS idx_processing_log_stage ON document_processing_log(stage, status, created_at);

-- Create processing queue view for easy monitoring
CREATE OR REPLACE VIEW processing_queue AS
SELECT 
    d.id,
    COALESCE(d.title, 'Untitled Document') as filename,
    d.source,
    d.processing_status,
    d.created_at,
    d.processing_started_at,
    d.retry_count,
    CASE 
        WHEN d.processing_status = 'pending' THEN 'Ready for processing'
        WHEN d.processing_status = 'processing' THEN 'Currently processing'
        WHEN d.processing_status = 'completed' THEN 'Successfully processed'
        WHEN d.processing_status = 'failed' THEN 'Failed - needs retry'
        ELSE 'Unknown status'
    END as status_description,
    EXTRACT(EPOCH FROM (NOW() - d.created_at))::INTEGER as age_seconds
FROM documents d
WHERE d.processing_status IN ('pending', 'processing', 'failed')
ORDER BY d.created_at ASC;

-- Function to mark document for processing
CREATE OR REPLACE FUNCTION start_document_processing(doc_id VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    success BOOLEAN := FALSE;
BEGIN
    -- Atomically mark document as processing
    UPDATE documents 
    SET 
        processing_status = 'processing',
        processing_started_at = NOW()
    WHERE 
        id = doc_id 
        AND processing_status = 'pending'
        AND (retry_count < 3 OR retry_count IS NULL);
    
    success := FOUND;
    
    -- Log the start of processing
    IF success THEN
        INSERT INTO document_processing_log (document_id, stage, status, details)
        VALUES (doc_id, 'rag_analysis', 'started', '{"processing_worker": "rag_service"}');
    END IF;
    
    RETURN success;
END;
$$ LANGUAGE plpgsql;

-- Function to complete document processing
CREATE OR REPLACE FUNCTION complete_document_processing(
    doc_id VARCHAR,
    dept_name VARCHAR(100),
    confidence_score FLOAT,
    reasoning TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update document with results
    UPDATE documents 
    SET 
        processing_status = 'completed',
        processing_completed_at = NOW(),
        processing_error = NULL,
        assigned_department = dept_name,
        confidence = confidence_score,
        reasoning = reasoning
    WHERE id = doc_id;
    
    -- Log completion
    INSERT INTO document_processing_log (document_id, stage, status, details, processing_time_ms)
    VALUES (
        doc_id, 
        'rag_analysis', 
        'completed', 
        jsonb_build_object(
            'department', dept_name,
            'confidence', confidence_score,
            'reasoning_length', length(reasoning)
        ),
        EXTRACT(EPOCH FROM (NOW() - (SELECT processing_started_at FROM documents WHERE id = doc_id))) * 1000
    );
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark processing as failed
CREATE OR REPLACE FUNCTION fail_document_processing(
    doc_id VARCHAR,
    error_msg TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Update document status
    UPDATE documents 
    SET 
        processing_status = 'failed',
        processing_error = error_msg,
        retry_count = COALESCE(retry_count, 0) + 1
    WHERE id = doc_id;
    
    -- Log failure
    INSERT INTO document_processing_log (document_id, stage, status, error_message)
    VALUES (doc_id, 'rag_analysis', 'failed', error_msg);
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- View for RAG processing dashboard
CREATE OR REPLACE VIEW rag_processing_stats AS
SELECT 
    COUNT(*) FILTER (WHERE processing_status = 'pending') as pending_count,
    COUNT(*) FILTER (WHERE processing_status = 'processing') as processing_count,
    COUNT(*) FILTER (WHERE processing_status = 'completed') as completed_count,
    COUNT(*) FILTER (WHERE processing_status = 'failed') as failed_count,
    AVG(EXTRACT(EPOCH FROM (processing_completed_at - processing_started_at))) FILTER (WHERE processing_status = 'completed') as avg_processing_time_seconds,
    COUNT(*) FILTER (WHERE processing_status = 'completed' AND DATE(processing_completed_at) = CURRENT_DATE) as completed_today
FROM documents;

-- Trigger to automatically update document_analytics when document is completed
CREATE OR REPLACE FUNCTION update_analytics_on_completion()
RETURNS TRIGGER AS $$
BEGIN
    -- Only update analytics when document processing is completed
    IF NEW.processing_status = 'completed' AND (OLD.processing_status IS NULL OR OLD.processing_status != 'completed') THEN
        INSERT INTO document_analytics (
            document_id,
            assigned_department,
            confidence_score,
            processing_method,
            ai_reasoning,
            processing_time_ms,
            created_at
        ) VALUES (
            NEW.id,
            NEW.assigned_department,
            NEW.confidence,
            'rag_enhanced',
            NEW.reasoning,
            EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at)) * 1000,
            NOW()
        )
        ON CONFLICT (document_id) DO UPDATE SET
            assigned_department = NEW.assigned_department,
            confidence_score = NEW.confidence,
            ai_reasoning = NEW.reasoning,
            processing_time_ms = EXTRACT(EPOCH FROM (NEW.processing_completed_at - NEW.processing_started_at)) * 1000,
            updated_at = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_update_analytics_on_completion ON documents;

CREATE TRIGGER trigger_update_analytics_on_completion
    AFTER UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_analytics_on_completion();

-- Sample data status validation
SELECT 'Enhanced schema applied successfully!' as status;