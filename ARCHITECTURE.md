# System Architecture

## Overview

Doc.X is an intelligent document management system that leverages AI to automatically classify, process, and route documents to appropriate departments within KMRL (Kerala Metro Rail Limited).

---

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    USERS (Department Staff)                   │
└────────────────────────┬─────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                  FRONTEND (React + TypeScript)               │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  Dashboard   │  │  Department  │  │   Document   │    │
│  │              │  │   Dashboards │  │    Search    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Upload     │  │   Private    │  │      AI      │    │
│  │  Documents   │  │   Documents  │  │   Assistant  │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────────────────────┬────────────────────────────────────┘
                         │ REST API (JSON)
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND (FastAPI Python)                  │
│                                                             │
│  ┌────────────────────────────────────────────────────┐     │
│  │           Document Processing Pipeline             │     │
│  │                                                    │     │
│  │  Upload → Parse → Embed → Classify → Store         │     │
│  └────────────────────────────────────────────────────┘     │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Document   │  │  Department  │  │   Embedding  │    │
│  │    Parser    │  │  Classifier  │  │   Service    │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Database   │  │   Supabase   │  │    Gmail     │    │
│  │   Service    │  │   Storage    │  │  Processor   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
└────────┬────────┬────────┬────────┬──────────────┬─────────┘
         │        │        │        │              │
         ▼        ▼        ▼        ▼              ▼
┌─────────┐ ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│Supabase │ │ChromaDB │ │Supabase  │ │OpenRouter│ │  Gmail   │
│PostgreSQL│ │ Vector  │ │ Storage  │ │  GPT-4   │ │   API    │
│  (DB)   │ │  Store  │ │ (Buckets)│ │   API    │ │          │
└─────────┘ └─────────┘ └──────────┘ └──────────┘ └──────────┘
```

---

## Component Details

### 1. Frontend Layer

**Technology**: React 18 + TypeScript + Vite + Tailwind CSS

**Components**:
- **Dashboard**: System overview, statistics, recent documents
- **DepartmentDashboard**: Department-specific document view
- **DocumentSearch**: Semantic search interface
- **DocumentUpload**: File upload with classification
- **PrivateDocuments**: Personal document management
- **AIAssistant**: Conversational document queries

**State Management**: React Context API for authentication

**Routing**: React Router for navigation

---

### 2. Backend Layer

**Technology**: FastAPI (Python 3.9+)

**Core Services**:

#### Document Parser Service
- Extracts text from PDF, DOCX, XLSX, images
- Handles multiple file formats
- Returns clean text content
- **Libraries**: PyPDF2, python-docx, pandas, PIL

#### Department Classifier Service
- Uses GPT-4 via OpenRouter API
- Analyzes document content
- Generates department assignment
- Produces confidence score (0.0-1.0)
- Creates document summary
- **Logic**: Confidence < 0.6 → Route to General

#### Embedding Service
- Generates vector embeddings using OpenAI
- Stores in ChromaDB for similarity search
- Enables semantic document retrieval
- **Model**: text-embedding-ada-002

#### Database Service
- Supabase client wrapper
- CRUD operations on documents
- Department filtering
- Privacy controls (is_private, owner_email)

#### Supabase Storage Service
- Object storage for documents (Buckets)
- Generates signed URLs for secure access
- Built-in file management
- Row-level security (RLS) integration
- Auto-scaling and CDN distribution

#### Gmail Processor
- OAuth 2.0 authentication
- Fetches KMRL emails
- Filters by keywords
- Extracts attachments
- Auto-processes documents

---

### 3. Data Layer

#### Supabase (PostgreSQL)
**Purpose**: Metadata storage

**Schema**:
```sql
documents
  ├─ id (UUID)
  ├─ filename (VARCHAR)
  ├─ object_path (VARCHAR) -- Supabase Storage path
  ├─ department (VARCHAR)
  ├─ summary (TEXT)
  ├─ confidence (FLOAT)
  ├─ vector_id (VARCHAR) -- ChromaDB reference
  ├─ source (VARCHAR) -- manual, gmail
  ├─ priority (VARCHAR) -- urgent, high, normal, low
  ├─ is_private (BOOLEAN)
  ├─ owner_email (VARCHAR)
  ├─ created_at (TIMESTAMP)
  └─ updated_at (TIMESTAMP)
```

**Indexes**:
- `idx_documents_department` - Fast department lookups
- `idx_documents_upload_date` - Chronological ordering
- `idx_documents_private` - Privacy filtering

#### ChromaDB
**Purpose**: Vector storage for semantic search

**Data**:
- Document embeddings (1536 dimensions)
- Metadata (filename, department)
- Enables similarity search

#### Supabase Storage
**Purpose**: File storage (S3-compatible buckets)

**Structure**:
```
documents/ (bucket)
  ├─ {uuid}/
  │   └─ {filename}
```

**Features**:
- Signed URLs for secure access (configurable expiry)
- Content-Disposition for inline viewing
- Automatic CDN distribution via Supabase Edge
- Row-level security policies
- Built-in image transformations
- Unlimited scalability

---

## Data Flow Diagrams

### Document Upload Flow

```
┌──────────┐
│   User   │
│  Uploads │
│   File   │
└────┬─────┘
     │
     ▼
┌────────────────┐
│  Parse Content │  ← Extract text from PDF/Word/Excel
└────┬───────────┘
     │
     ▼
┌──────────────────────┐
│ Store in Supabase    │  ← Save original file to Storage bucket
│      Storage         │
└────┬─────────────────┘
     │
     ▼
┌────────────────────┐
│ Generate Embeddings│  ← Create vector representation
│  (OpenAI API)      │
└────┬───────────────┘
     │
     ▼
┌─────────────────────┐
│ Store in ChromaDB   │  ← Save vector for search
└────┬────────────────┘
     │
     ▼
┌──────────────────────┐
│  Classify Department │  ← AI classification (GPT-4)
│  + Generate Summary  │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│ Check Confidence     │
│  < 0.6? → General    │
│  ≥ 0.6? → Specific   │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│ Store in Supabase    │  ← Save metadata
│  (documents table)   │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Show in Dashboard   │
└──────────────────────┘
```

### Search Flow

```
┌──────────┐
│   User   │
│  Enters  │
│  Query   │
└────┬─────┘
     │
     ▼
┌────────────────────┐
│ Generate Query     │  ← Convert to embedding
│  Embedding         │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Search ChromaDB    │  ← Find similar vectors
│  (Vector Search)   │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Get Document IDs   │  ← Retrieve matches
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Fetch Full Data    │  ← Get from Supabase
│  from Supabase     │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Filter Private     │  ← Exclude if not owner
│  Documents         │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Rank by Similarity │  ← Sort by score
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Return Results     │
└────────────────────┘
```

### Gmail Integration Flow

```
┌──────────────────┐
│  Gmail API       │
│  (Cron/Manual)   │
└────┬─────────────┘
     │
     ▼
┌────────────────────┐
│ Fetch New Emails   │  ← Last 7 days
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Filter by Keywords │  ← KMRL, Metro, etc.
│  (Subject/Body)    │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Extract Attachments│  ← PDF, DOC, XLS, images
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ For Each Document: │
│  - Parse           │
│  - Classify        │
│  - Store           │
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Route to Dept      │  ← Auto-assignment
└────────────────────┘
```

---

## Security Architecture

### Authentication
- Simple credential-based login
- Department-based access control
- Email-based user identification

### Authorization
- **Public Documents**: Visible to all department users
- **Private Documents**: Only visible to owner
- **Department Filtering**: Users see their department + assigned docs

### Data Privacy
- Private documents have `is_private=true` flag
- `owner_email` tracks document ownership
- Search queries exclude private docs (unless owned)
- Department pages filter by `is_private=false OR owner_email=user`

### API Security
- Environment variables for sensitive keys
- Presigned URLs for MinIO (time-limited)
- OAuth 2.0 for Gmail access

---

## Scalability Design

### Horizontal Scaling
- **Frontend**: Deployed on Netlify/Vercel with global CDN
- **Backend**: Deployed on Render with auto-scaling
- **Database**: Supabase managed PostgreSQL (cloud-hosted)
- **Storage**: Supabase Storage with edge caching

### Performance Optimizations
- **Caching**: Browser caching for static assets
- **Indexing**: Database indexes on frequent queries
- **Vector Search**: ChromaDB optimized for similarity
- **Lazy Loading**: Frontend components load on demand

### Load Handling
- **Concurrent Uploads**: Async file processing
- **Background Jobs**: Email ingestion runs separately
- **Rate Limiting**: OpenAI API rate management

---

## Technology Decisions

### Why React?
- Component reusability
- Strong TypeScript support
- Large ecosystem
- Fast development

### Why FastAPI?
- Async support for high concurrency
- Automatic API documentation
- Pydantic validation
- Python ML/AI libraries

### Why Supabase?
- PostgreSQL with REST API
- Real-time capabilities
- Built-in authentication (future)
- Managed infrastructure

### Why ChromaDB?
- Open-source vector database
- Simple Python API
- Local development support
- Fast similarity search

### Why Supabase Storage?
- Native integration with Supabase DB
- S3-compatible API
- Built-in CDN and edge caching
- Row-level security policies
- No infrastructure management
- Auto-scaling
- Cost-effective with generous free tier

### Why GPT-4 (OpenRouter)?
- State-of-the-art classification
- Excellent summarization
- Reliable API
- Pay-per-use pricing

---

## Production Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION ENVIRONMENT                     │
└─────────────────────────────────────────────────────────────┘

┌──────────────────────┐         ┌──────────────────────┐
│   Netlify/Vercel     │         │       Render         │
│                      │         │                      │
│  ┌────────────────┐  │         │  ┌────────────────┐  │
│  │    Frontend    │  │  HTTPS  │  │    Backend     │  │
│  │  React + Vite  │◄─┼─────────┼─►│    FastAPI     │  │
│  │                │  │         │  │   (Gunicorn)   │  │
│  └────────────────┘  │         │  └────────────────┘  │
│  • Global CDN        │         │  • Auto-scaling      │
│  • HTTPS + SSL       │         │  • Health checks     │
│  • Auto-deploy       │         │  • Zero downtime     │
└──────────────────────┘         └─────────┬────────────┘
                                           │
                    ┌──────────────────────┼──────────────┐
                    │                      │              │
                    ▼                      ▼              ▼
         ┌────────────────┐     ┌────────────────┐   ┌─────────┐
         │   Supabase     │     │   Supabase     │   │ChromaDB │
         │   PostgreSQL   │     │    Storage     │   │(Render) │
         │                │     │                │   │         │
         │ • Managed DB   │     │ • File Buckets │   │• Vector │
         │ • Auto-backup  │     │ • CDN Edge     │   │  Store  │
         │ • Connection   │     │ • Signed URLs  │   │• Persist│
         │   pooling      │     │ • RLS policies │   │         │
         └────────────────┘     └────────────────┘   └─────────┘

                    ┌──────────────────────┐
                    │   External Services   │
                    ├──────────────────────┤
                    │ • OpenRouter GPT-4   │
                    │ • Gmail API          │
                    │ • OpenAI Embeddings  │
                    └──────────────────────┘
```

### Deployment Details

**Frontend (Netlify/Vercel)**
- Build: `npm run build` (Vite)
- Deploy: Automatic on git push
- Domain: Custom domain with SSL
- CDN: Global edge caching
- Environment variables via dashboard

**Backend (Render)**
- Service: Web Service
- Runtime: Python 3.9+
- Start command: `gunicorn main:app -w 4 -k uvicorn.workers.UvicornWorker`
- Auto-deploy: On git push to main branch
- Health check: `/health` endpoint
- Environment variables via dashboard

**Database (Supabase Cloud)**
- Managed PostgreSQL instance
- Automatic backups
- Connection pooling
- Built-in monitoring

**Storage (Supabase Storage)**
- S3-compatible buckets
- CDN-backed file delivery
- RLS policies for security
- Automatic scaling

**Vector Database (ChromaDB on Render)**
- Background Worker service
- Persistent disk storage
- HTTP server mode

---

## Monitoring & Logging

### Backend Logging
- Request/response logging
- Error tracking with stack traces
- Classification results
- Performance metrics

### Frontend Logging
- Console errors
- User actions
- API failures

### Health Checks
- `/health` endpoint
- Database connectivity (Supabase)
- Storage availability (Supabase buckets)
- ChromaDB connection
- OpenAI API status
- External service monitoring (Render dashboard)

---

## Future Architecture Enhancements

1. ✅ **CDN**: Already implemented via Netlify/Vercel
2. ✅ **Auto-scaling**: Already implemented via Render
3. ✅ **Managed Database**: Already using Supabase
4. **Message Queue**: Redis/RabbitMQ for async tasks
5. **Caching Layer**: Redis for frequent queries
6. **Microservices**: Separate services for classification, search
7. **Monitoring**: Prometheus + Grafana or Datadog
8. **Logging**: Better Call Saul (BCS) or ELK Stack
9. **CI/CD**: GitHub Actions for automated testing
10. **Webhooks**: Real-time document processing notifications

---

**Architecture designed for scalability, maintainability, and performance.**
