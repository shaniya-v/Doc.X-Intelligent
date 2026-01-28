# Doc.X Intelligent Document Management System

**AI-Powered Document Processing & Classification for KMRL**

A sophisticated document management system that automatically classifies documents into departments using AI, provides semantic search capabilities, and enables seamless workflow automation.

---

## 🌟 Key Features

### Core Capabilities
- **🤖 AI-Powered Classification** - Automatically routes documents to correct departments using GPT-4
- **📧 Gmail Integration** - Auto-processes emails and attachments from KMRL inbox
- **🔍 Semantic Search** - Find documents using natural language queries
- **💬 AI Assistant** - Chat with your documents and get instant answers
- **🔒 Private Documents** - Personal document storage with privacy controls
- **📊 Department Dashboards** - Real-time insights and document tracking
- **🎯 Smart Routing** - Low-confidence documents automatically go to General department

### Document Processing
- Supports PDF, Word, Excel, Images, and Text files
- Automatic content extraction and summarization
- Vector embeddings for semantic similarity
- Department confidence scoring
- Priority assignment (Urgent, High, Normal, Low)

### Workflow Features
- Multi-department task assignment
- Document status tracking
- Email-based document ingestion
- Manual upload with classification override
- Download and view documents inline

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│               Frontend (React - Netlify/Vercel)             │
│  • Department Dashboards  • Document Search  • AI Chat      │
│  • Upload Interface  • Private Docs  • Document Viewer      │
└─────────────────────┬───────────────────────────────────────┘
                      │ REST API (HTTPS)
┌─────────────────────▼───────────────────────────────────────┐
│                Backend (FastAPI - Render)                    │
│  • Document Parser  • Department Classifier                 │
│  • Embedding Service  • Gmail Processor                     │
└──┬──────┬──────┬──────┬──────────────────────────────────┘
   │      │      │      │
   ▼      ▼      ▼      ▼
┌──────┐ ┌──────┐ ┌──────────┐ ┌──────────┐
│Supabase ChromaDB│Supabase  │OpenRouter│
│  DB   │Vector │ Storage  │  GPT-4   │
│(Cloud)│(Render)│(Buckets) │   API    │
└───────┘└──────┘└──────────┘└──────────┘
```

### Technology Stack

**Frontend**
- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Lucide React for icons

**Backend**
- FastAPI (Python 3.9+)
- Supabase (PostgreSQL + Storage)
- ChromaDB for vector storage
- OpenRouter API (GPT-4)

**Hosting (Production)**
- Frontend: Netlify or Vercel
- Backend: Render
- Database: Supabase Cloud
- Storage: Supabase Storage Buckets

**Integrations**
- Gmail API for email processing
- Google OAuth 2.0

---

## 📋 System Workflow

### 1. Document Upload Flow

```
User Uploads Document
        ↓
Parse Content (PDF/Word/Excel/Image)
        ↓
Generate AI Summary
        ↓
Create Vector Embeddings
        ↓
Classify Department (GPT-4)
        ↓
Confidence < 60%? → Route to General Dept
Confidence ≥ 60%? → Route to Specific Dept
        ↓
Store in Database + Supabase Storage + ChromaDB
        ↓
Display in Department Dashboard
```

### 2. Gmail Integration Flow

```
Gmail API Fetches New Emails
        ↓
Filter by KMRL Keywords
        ↓
Extract Attachments
        ↓
Process Each Document
        ↓
Auto-Route to Departments
        ↓
Notify Department Users
```

### 3. Search Flow

```
User Enters Search Query
        ↓
Generate Query Embedding
        ↓
Search ChromaDB (Vector Similarity)
        ↓
Fetch Full Metadata from Supabase
        ↓
Exclude Private Documents (unless owner)
        ↓
Rank by Similarity Score
        ↓
Display Results with Highlights
```

---

## 🎯 Department Classification

The system uses AI to classify documents into these departments:

| Department | Icon | Auto-Classification Examples |
|------------|------|------------------------------|
| **Engineering** | 🔧 | Maintenance reports, infrastructure docs, technical specs |
| **Finance** | 💰 | Invoices, budget reports, payment requests |
| **Human Resources** | 👥 | Employee records, hiring docs, training materials |
| **Operations** | 🚇 | Train schedules, station reports, service updates |
| **Safety & Security** | 🛡️ | Incident reports, safety protocols, security logs |
| **Admin** | 📋 | General administration, facility management |
| **Security** | 🔒 | Access control, surveillance, security operations |
| **General** | 📦 | Unclassified or low-confidence documents |

**Auto-Routing Logic:**
- Confidence ≥ 60% → Specific Department
- Confidence < 60% → General Department

---

## 🚀 Quick Start

See [QUICKSTART.md](./QUICKSTART.md) for detailed setup instructions.

### Local Development Setup

```bash
# 1. Install dependencies
cd backend && pip install -r requirements.txt
cd ../frontend && npm install

# 2. Configure environment
cp backend/.env.example backend/.env
# Edit .env with your Supabase credentials

# 3. Start services
cd backend && uvicorn main:app --reload  # Backend on :8000
cd frontend && npm run dev              # Frontend on :3000

# 4. Access at http://localhost:3000
# Login: department123 / 456
```

### Production Deployment

**Frontend (Netlify/Vercel)**
```bash
# Build command
npm run build

# Output directory
dist/
```

**Backend (Render)**
```bash
# Build command
pip install -r requirements.txt

# Start command
gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker
```

**Environment Variables**
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_KEY` - Supabase anon/service key
- `OPENROUTER_API_KEY` - OpenRouter API key
- `OPENAI_API_KEY` - OpenAI embeddings key

---

## 📁 Project Structure

```
Doc.X-Intelligent/
├── backend/                 # FastAPI Backend
│   ├── main.py             # API Server
│   ├── services/           # Core Services
│   │   ├── department_classifier.py  # AI Classification
│   │   ├── embedding_service.py      # Vector Embeddings
│   │   ├── document_parser.py        # File Processing
│   │   ├── database_service.py       # Supabase Client
│   │   └── storage_service.py        # Supabase Storage
│   ├── gmail_setup.py      # Gmail OAuth Setup
│   └── gmail_ingestion.py  # Email Processor
│
├── frontend/               # React Frontend
│   └── src/
│       ├── components/     # UI Components
│       │   ├── Dashboard.tsx
│       │   ├── DepartmentDashboard.tsx
│       │   ├── DocumentSearch.tsx
│       │   ├── DocumentUpload.tsx
│       │   ├── PrivateDocuments.tsx
│       │   └── AIAssistant.tsx
│       ├── contexts/       # React Contexts
│       └── utils/          # Utilities
│
├── docker-compose.yml      # MinIO Setup
├── database_metadata_schema.sql  # DB Schema
└── QUICKSTART.md          # Setup Guide
```

---

## 🔐 Security Features

- **Private Documents**: User-specific document isolation
- **Department Access Control**: Documents visible only to assigned departments
- **Search Privacy**: Private documents excluded from global search
- **OAuth 2.0**: Secure Gmail integration
- **Environment Variables**: Sensitive credentials in `.env`

---

## 📊 Database Schema

**documents** table:
- `id` - Unique document identifier
- `filename` - Original file name
- `object_path` - MinIO storage path
- `department` - Assigned department
- `summary` - AI-generated summary
- `confidence` - Classification confidence (0.0-1.0)
- `vector_id` - ChromaDB embedding reference
- `source` - Origin (manual, gmail, etc.)
- `is_private` - Privacy flag
- `owner_email` - Private document owner
- `priority` - Document priority level
- `created_at` - Upload timestamp

---

## 🔌 API Endpoints

### Document Management
- `POST /api/documents/upload` - Upload document
- `GET /api/documents/all` - List all documents
- `GET /api/documents/{id}` - Get document details
- `GET /api/documents/{id}/download` - Download document
- `DELETE /api/documents/{id}` - Delete document

### Department Operations
- `GET /api/departments/{dept}/documents` - Get department docs
- `GET /api/departments/{dept}/summary` - Department statistics

### Search & AI
- `POST /api/documents/search` - Semantic search
- `POST /api/ai/chat` - AI assistant chat

### Privacy
- `GET /api/private-documents` - Get user's private docs
- `POST /api/documents/{id}/mark-private` - Mark as private
- `POST /api/documents/{id}/mark-public` - Make public

### Email Processing
- `POST /api/emails/process` - Process email attachment

---

## 🎨 User Interface

### Dashboard
- Real-time document statistics
- Department distribution chart
- Recent documents table
- Quick actions (Upload, AI Assistant)

### Department Pages
- Filtered document view
- Priority indicators
- Expandable document summaries
- Save to private collection

### Search
- Natural language queries
- Similarity scoring
- Department filtering
- Result highlighting

### Private Documents
- Personal document library
- Upload private files
- No global visibility
- Full-text content preview

---

## 🔄 Gmail Integration Setup

1. Create Google Cloud Project
2. Enable Gmail API
3. Download OAuth credentials
4. Save as `backend/gmail_credentials.json`
5. Run `python gmail_setup.py`
6. Authenticate browser window
7. Run `python gmail_ingestion.py`

Emails are automatically:
- Fetched from KMRL inbox
- Filtered by keywords
- Attachments extracted
- Documents classified
- Routed to departments

---

## 📈 Performance

- **Vector Search**: Sub-second semantic search across thousands of documents
- **AI Classification**: ~2-3 seconds per document
- **File Processing**: Supports files up to 100MB
- **Concurrent Users**: Optimized for 50+ simultaneous users
- **Storage**: Auto-scaling Supabase Storage with CDN
- **Frontend**: Edge-cached via Netlify/Vercel CDN
- **Backend**: Auto-scales on Render based on load

---

## 🛠️ Development

### Running Tests
```bash
cd backend
pytest tests/
```

### Code Style
- Python: PEP 8
- TypeScript: ESLint + Prettier
- Imports: Organized by type

### Environment Variables
See `.env.example` for all configuration options.

---

## 📝 License

MIT License - See [LICENSE](./LICENSE) for details.

---

## 🤝 Contributing

This is a private KMRL project. For support or questions, contact the development team.

---

## 🎯 Roadmap

- [ ] Mobile responsive design
- [ ] Document versioning
- [ ] Advanced analytics dashboard
- [ ] Multi-language support (Malayalam)
- [ ] OCR for scanned documents
- [ ] Workflow automation builder
- [ ] Email notifications
- [ ] Audit trail logging

---
