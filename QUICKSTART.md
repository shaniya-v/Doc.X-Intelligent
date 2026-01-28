# Quick Start Guide

## Prerequisites
- Python 3.9+
- Node.js 18+
- Supabase account
- MinIO (for document storage)
- OpenRouter API key

## Setup Steps

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
Create `backend/.env`:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
OPENROUTER_API_KEY=your_openrouter_key
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123
```

### 3. Database Setup
Run this SQL in Supabase SQL Editor:
```sql
-- Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    filename VARCHAR(500) NOT NULL,
    object_path VARCHAR(1000) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    department VARCHAR(100) NOT NULL,
    summary TEXT,
    confidence FLOAT,
    vector_id VARCHAR(100),
    source VARCHAR(50) DEFAULT 'manual',
    user_id UUID,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_private BOOLEAN DEFAULT FALSE,
    owner_email VARCHAR(255),
    owner_user_id VARCHAR(255)
);

CREATE INDEX idx_documents_department ON documents(department);
CREATE INDEX idx_documents_upload_date ON documents(upload_date DESC);
CREATE INDEX idx_documents_private ON documents(is_private, owner_email);
```

### 4. Start MinIO (Docker)
```bash
docker-compose up -d
```

### 5. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 6. Start Backend
```bash
cd backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 7. Access Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- MinIO Console: http://localhost:9001

### Default Login
- Username: `department123`
- Password: `456`
- Select any department to access

## Gmail Integration (Optional)
1. Set up OAuth credentials in Google Cloud Console
2. Copy credentials to `backend/gmail_credentials.json`
3. Run: `python gmail_setup.py` to authenticate
4. Run: `python gmail_ingestion.py` to fetch emails

## Features
- 🤖 AI-powered document classification
- 📧 Gmail integration with auto-routing
- 🔍 Semantic search across documents
- 🔒 Private document management
- 📊 Department-wise dashboards
- 💬 AI assistant for document queries
- 📁 Multi-department workflow support
