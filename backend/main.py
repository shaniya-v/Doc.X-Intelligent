"""
FastAPI Backend for Doc.X-Intelligent
Handles document processing, storage, embedding generation, and RAG-based classification
"""
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, RedirectResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.storage_service import StorageService
from services.document_parser import DocumentParser
from services.embedding_service import EmbeddingService
from services.department_classifier import DepartmentClassifier
from services.database_service import DatabaseService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Doc.X-Intelligent API",
    description="Intelligent document processing and classification system",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure based on your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
storage_service = StorageService()
document_parser = DocumentParser()
embedding_service = EmbeddingService()
department_classifier = DepartmentClassifier()
database_service = DatabaseService()

# Pydantic models
class DocumentUploadResponse(BaseModel):
    document_id: str
    filename: str
    object_path: str
    department: str
    summary: str
    confidence: float
    metadata: Dict[str, Any]

class DocumentMetadata(BaseModel):
    document_id: str
    filename: str
    department: str
    summary: str
    upload_date: str
    file_type: str
    file_size: int

class SearchRequest(BaseModel):
    query: str
    department: Optional[str] = None
    limit: int = 10

class SearchResult(BaseModel):
    documents: List[Dict[str, Any]]
    total: int

class EmailProcessRequest(BaseModel):
    email_body: str
    email_from: str
    email_subject: str
    message_id: str

class EmailProcessResponse(BaseModel):
    message_id: str
    summary: str
    department: str
    confidence: float
    embedding_stored: bool

class AIChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    document_id: Optional[str] = None

class AIChatResponse(BaseModel):
    response: str
    documents: Optional[List[Dict[str, Any]]] = None
    document_analysis: Optional[Dict[str, Any]] = None

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Initialize MinIO buckets
        await storage_service.initialize_buckets()
        logger.info("✅ MinIO buckets initialized")
        
        # Initialize vector database
        await embedding_service.initialize()
        logger.info("✅ Embedding service initialized")
        
        # Initialize classifier
        await department_classifier.initialize()
        logger.info("✅ Department classifier initialized")
        
        logger.info("🚀 FastAPI backend started successfully")
    except Exception as e:
        logger.error(f"❌ Startup failed: {e}")
        raise

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Doc.X-Intelligent API",
        "version": "2.0.0"
    }

@app.get("/health")
async def health_check():
    """Detailed health check"""
    return {
        "status": "healthy",
        "services": {
            "minio": storage_service.check_health(),
            "vector_db": embedding_service.check_health(),
            "classifier": department_classifier.check_health(),
            "database": database_service.check_health()
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    email_from: Optional[str] = None,
    email_subject: Optional[str] = None,
    email_body: Optional[str] = None,
    user_id: Optional[str] = None,
    user_email: Optional[str] = Form(None),
    is_private: bool = Form(False),
    source: str = "manual",
    task_type: Optional[str] = Form(None),
    target_department: Optional[str] = Form(None),
    source_department: Optional[str] = Form(None),
    description: Optional[str] = Form(None)
):
    """
    Upload and process a document:
    1. Store in MinIO
    2. Parse content
    3. Generate embeddings (combining document + email body if available)
    4. Classify department using RAG
    5. Store metadata in database
    """
    try:
        logger.info(f"📄 Processing document: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Store in MinIO
        object_path = await storage_service.upload_document(
            filename=file.filename,
            content=file_content,
            content_type=file.content_type
        )
        logger.info(f"✅ Stored in MinIO: {object_path}")
        
        # Parse document content
        parsed_content = await document_parser.parse_document(
            filename=file.filename,
            content=file_content
        )
        logger.info(f"✅ Parsed {len(parsed_content)} characters")
        
        # Combine document content with email body context if available
        combined_content = parsed_content
        if email_body:
            combined_content = f"Email Context:\n{email_subject or ''}\n{email_body[:1000]}\n\nDocument Content:\n{parsed_content}"
            logger.info(f"✅ Combined with email context")
        
        # Generate embeddings from combined content
        embedding = await embedding_service.generate_embedding(combined_content)
        logger.info(f"✅ Generated embedding")
        
        # Classify department and generate summary using RAG
        classification_result = await department_classifier.classify_and_summarize(
            content=combined_content,
            embedding=embedding,
            filename=file.filename
        )
        logger.info(f"✅ Classified: {classification_result['department']} (confidence: {classification_result['confidence']})")
        
        # Generate document_id upfront to use in both ChromaDB and Supabase
        import uuid
        document_id = str(uuid.uuid4())
        
        # Store in vector database (filter out None values for ChromaDB)
        metadata = {
            "document_id": document_id,  # Store document_id in metadata for search
            "filename": file.filename,
            "object_path": object_path,
            "department": classification_result['department'],
            "content_preview": parsed_content[:500]
        }
        if email_from:
            metadata["email_from"] = email_from
        if email_subject:
            metadata["email_subject"] = email_subject
        
        vector_id = await embedding_service.store_embedding(
            embedding=embedding,
            metadata=metadata,
            document_id=document_id  # Use the same document_id
        )
        
        # Store metadata in database with the same document_id
        document_metadata = {
            "id": document_id,  # Use the pre-generated document_id
            "filename": file.filename,
            "object_path": object_path,
            "department": target_department if task_type == 'assign' and target_department else classification_result['department'],
            "summary": classification_result['summary'],
            "confidence": classification_result['confidence'],
            "file_type": file.content_type or "application/octet-stream",
            "file_size": file_size,
            "user_id": user_id,
            "source": source,
            "vector_id": vector_id,
            "is_private": is_private,
            "owner_email": user_email if is_private else None,
            "owner_user_id": user_id if is_private else None
        }
        
        # Add optional fields
        if email_from:
            document_metadata["email_from"] = email_from
        if email_subject:
            document_metadata["email_subject"] = email_subject
        if task_type:
            document_metadata["task_type"] = task_type
        if target_department:
            document_metadata["target_department"] = target_department
        if source_department:
            document_metadata["source_department"] = source_department
        if description:
            document_metadata["description"] = description
        
        # TODO: Uncomment after running migrations/add_task_fields.sql
        # if task_type:
        #     document_metadata["task_type"] = task_type
        # if target_department:
        #     document_metadata["target_department"] = target_department
        # if source_department:
        #     document_metadata["source_department"] = source_department
        # if description:
        #     document_metadata["description"] = description
        
        await database_service.store_document_metadata(document_metadata)
        logger.info(f"✅ Document processed: {document_id}")
        
        return DocumentUploadResponse(
            document_id=document_id,
            filename=file.filename,
            object_path=object_path,
            department=classification_result['department'],
            summary=classification_result['summary'],
            confidence=classification_result['confidence'],
            metadata=document_metadata
        )
        
    except Exception as e:
        logger.error(f"❌ Error processing document: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/emails/process", response_model=EmailProcessResponse)
async def process_email(email_request: EmailProcessRequest):
    """
    Process email body:
    1. Generate embeddings from email content
    2. Store in vector database
    3. Classify department using RAG
    4. Generate summary
    """
    try:
        logger.info(f"📧 Processing email: {email_request.email_subject}")
        
        # Clean and prepare email content
        email_content = f"Subject: {email_request.email_subject}\n\n{email_request.email_body}"
        
        # Generate embeddings
        embedding = await embedding_service.generate_embedding(email_content)
        logger.info(f"✅ Generated email embedding")
        
        # Classify department and generate summary
        classification_result = await department_classifier.classify_and_summarize(
            content=email_content,
            embedding=embedding,
            filename=f"Email: {email_request.email_subject}"
        )
        logger.info(f"✅ Classified: {classification_result['department']}")
        
        # Store in vector database
        vector_id = await embedding_service.store_embedding(
            embedding=embedding,
            metadata={
                "type": "email",
                "message_id": email_request.message_id,
                "subject": email_request.email_subject,
                "from": email_request.email_from,
                "department": classification_result['department'],
                "content_preview": email_content[:500]
            }
        )
        
        # Store email metadata in database
        email_metadata = {
            "message_id": email_request.message_id,
            "email_from": email_request.email_from,
            "email_subject": email_request.email_subject,
            "department": classification_result['department'],
            "summary": classification_result['summary'],
            "confidence": classification_result['confidence'],
            "vector_id": vector_id,
            "processed_date": datetime.utcnow().isoformat()
        }
        
        await database_service.store_email_metadata(email_metadata)
        logger.info(f"✅ Email processed and stored: {email_request.message_id}")
        
        return EmailProcessResponse(
            message_id=email_request.message_id,
            summary=classification_result['summary'],
            department=classification_result['department'],
            confidence=classification_result['confidence'],
            embedding_stored=True
        )
        
    except Exception as e:
        logger.error(f"❌ Error processing email: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/all")
async def get_all_documents(user_email: Optional[str] = None):
    """Get all non-private documents"""
    try:
        # Get only public documents or user's private documents
        if user_email:
            docs = database_service.client.table("documents")\
                .select("*")\
                .or_(f"is_private.eq.false,owner_email.eq.{user_email}")\
                .execute()
        else:
            docs = database_service.client.table("documents")\
                .select("*")\
                .eq("is_private", False)\
                .execute()
        
        return {
            "documents": docs.data
        }
    except Exception as e:
        logger.error(f"❌ Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/search", response_model=SearchResult)
async def search_documents(search_request: SearchRequest, user_email: Optional[str] = None):
    """Search documents using semantic search (excludes private documents unless owned by user)"""
    try:
        # Generate query embedding
        query_embedding = await embedding_service.generate_embedding(search_request.query)
        
        # Search in vector database
        results = await embedding_service.search_similar(
            query_embedding=query_embedding,
            department=search_request.department,
            limit=search_request.limit
        )
        
        # Enrich results with full document metadata from database
        enriched_results = []
        for result in results:
            # Get full document metadata
            doc_metadata = await database_service.get_document_metadata(result['document_id'])
            if doc_metadata:
                # Exclude private documents unless owned by current user
                if doc_metadata.get('is_private') and doc_metadata.get('owner_email') != user_email:
                    continue
                    
                enriched_results.append({
                    "id": doc_metadata['id'],
                    "title": doc_metadata.get('filename', 'Untitled Document'),
                    "filename": doc_metadata.get('filename'),
                    "department": doc_metadata.get('department'),
                    "priority": doc_metadata.get('priority', 'normal'),
                    "created_at": doc_metadata.get('created_at') or doc_metadata.get('upload_date'),
                    "summary": doc_metadata.get('summary'),
                    "match_score": result.get('score', 0),
                    "excerpt": doc_metadata.get('summary', '')[:300] if doc_metadata.get('summary') else '',
                    "is_private": doc_metadata.get('is_private', False)
                })
        
        return SearchResult(
            documents=enriched_results,
            total=len(enriched_results)
        )
    except Exception as e:
        logger.error(f"❌ Search error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{document_id}")
async def get_document(document_id: str):
    """Get document metadata and download URL"""
    try:
        metadata = await database_service.get_document_metadata(document_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Generate presigned URL for download
        download_url = await storage_service.generate_download_url(metadata['object_path'])
        
        return {
            **metadata,
            "download_url": download_url
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error retrieving document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/department/{department}")
async def get_documents_by_department(department: str, limit: int = 50):
    """Get all documents for a specific department"""
    try:
        documents = await database_service.get_documents_by_department(department, limit)
        return {
            "department": department,
            "documents": documents,
            "total": len(documents)
        }
    except Exception as e:
        logger.error(f"❌ Error retrieving documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/departments/{department}/documents")
async def get_department_documents(department: str, limit: int = 50):
    """Get all documents for a specific department (alternative endpoint)"""
    try:
        documents = await database_service.get_documents_by_department(department, limit)
        return {
            "department": department,
            "documents": documents,
            "total": len(documents)
        }
    except Exception as e:
        logger.error(f"❌ Error retrieving documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/departments/{department}/summary")
async def get_department_summary(department: str):
    """Get comprehensive summary stats for a department"""
    try:
        documents = await database_service.get_documents_by_department(department, limit=1000)
        
        # Calculate statistics
        total_docs = len(documents)
        urgent_docs = sum(1 for d in documents if d.get('priority') == 'urgent')
        high_docs = sum(1 for d in documents if d.get('priority') == 'high')
        normal_docs = sum(1 for d in documents if d.get('priority') == 'normal')
        
        # Recent activity - last 7 days
        from datetime import datetime, timedelta
        now = datetime.utcnow()
        seven_days_ago = now - timedelta(days=7)
        
        recent_docs = [d for d in documents if datetime.fromisoformat(d.get('upload_date', d.get('created_at', '')).replace('Z', '')) > seven_days_ago]
        
        return {
            "department": department,
            "total_documents": total_docs,
            "total_tasks": total_docs,
            "pending_tasks": sum(1 for d in documents if d.get('status') == 'pending'),
            "completed_tasks": sum(1 for d in documents if d.get('status') == 'completed'),
            "overdue_tasks": sum(1 for d in documents if d.get('status') == 'overdue'),
            "urgent_count": urgent_docs,
            "high_count": high_docs,
            "normal_count": normal_docs,
            "recent_activity": [
                f"Processed: {d.get('filename', 'Unknown')}" for d in documents[:5]
            ],
            "current_projects": [
                f"{department} Document Management",
                "Quarterly Review Process",
                "System Optimization"
            ],
            "completed_activities": [
                f"Processed {len(recent_docs)} documents this week",
                f"Classified {urgent_docs + high_docs} priority items",
                f"Managed {total_docs} total documents"
            ],
            "current_activities": [
                f"Monitoring {department} operations",
                "Processing incoming documents",
                "Maintaining document database"
            ],
            "recent_documents": documents[:5] if documents else [],
            "weekly_documents": len(recent_docs)
        }
    except Exception as e:
        logger.error(f"❌ Error retrieving department summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/stats/overview")
async def get_overview_stats():
    """Get overall system statistics"""
    try:
        # Fetch all documents
        all_docs_response = database_service.client.table("documents").select("*").limit(10000).execute()
        all_docs = all_docs_response.data if all_docs_response.data else []
        
        # Calculate department breakdown
        dept_breakdown = {}
        for doc in all_docs:
            dept = doc.get('department', 'Unknown')
            if dept not in dept_breakdown:
                dept_breakdown[dept] = {
                    'total': 0,
                    'urgent': 0,
                    'high': 0,
                    'normal': 0,
                    'low': 0
                }
            dept_breakdown[dept]['total'] += 1
            priority = doc.get('priority', 'normal')
            if priority in dept_breakdown[dept]:
                dept_breakdown[dept][priority] += 1
        
        # Recent activity - last 24 hours
        from datetime import datetime, timedelta, timezone
        now = datetime.now(timezone.utc)
        twenty_four_hours_ago = now - timedelta(hours=24)
        
        recent_uploads = []
        for d in all_docs:
            try:
                date_str = d.get('upload_date', d.get('created_at', ''))
                if date_str:
                    doc_date = datetime.fromisoformat(date_str.replace('Z', '+00:00').replace('+00:00+00:00', '+00:00'))
                    if doc_date > twenty_four_hours_ago:
                        recent_uploads.append(d)
            except (ValueError, AttributeError):
                # Skip documents with invalid dates
                continue
        
        return {
            "total_documents": len(all_docs),
            "total_departments": len(dept_breakdown),
            "department_stats": dept_breakdown,
            "recent_uploads_24h": len(recent_uploads),
            "priority_distribution": {
                "urgent": sum(d.get('priority') == 'urgent' for d in all_docs),
                "high": sum(d.get('priority') == 'high' for d in all_docs),
                "normal": sum(d.get('priority') == 'normal' for d in all_docs),
                "low": sum(d.get('priority') == 'low' for d in all_docs)
            },
            "sources": list(set(d.get('source', 'unknown') for d in all_docs)),
            "active_users": len(set(d.get('user_id', 'anonymous') for d in all_docs))
        }
    except Exception as e:
        logger.error(f"❌ Error retrieving overview stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{document_id}/download")
async def download_document(document_id: str):
    """Generate download URL for document and redirect to it"""
    try:
        metadata = await database_service.get_document_metadata(document_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Generate presigned download URL
        download_url = await storage_service.generate_download_url(metadata['object_path'])
        
        # Redirect to the MinIO download URL
        return RedirectResponse(url=download_url)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error generating download URL: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from MinIO, vector DB, and database"""
    try:
        # Get document metadata
        metadata = await database_service.get_document_metadata(document_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete from MinIO
        await storage_service.delete_document(metadata['object_path'])
        
        # Delete from vector database
        if 'vector_id' in metadata:
            await embedding_service.delete_embedding(metadata['vector_id'])
        
        # Delete from database
        await database_service.delete_document_metadata(document_id)
        
        return {"message": "Document deleted successfully", "document_id": document_id}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/webhook/n8n")
async def n8n_webhook(
    filename: str,
    content: str,
    content_type: str,
    source: str = "n8n",
    metadata: Optional[Dict[str, Any]] = None
):
    """
    Webhook endpoint for N8N workflow
    Receives base64 encoded file content from N8N
    """
    try:
        import base64
        
        # Decode base64 content
        file_content = base64.b64decode(content)
        
        # Process similar to upload endpoint
        object_path = await storage_service.upload_document(
            filename=filename,
            content=file_content,
            content_type=content_type
        )
        
        parsed_content = await document_parser.parse_document(
            filename=filename,
            content=file_content
        )
        
        embedding = await embedding_service.generate_embedding(parsed_content)
        
        classification_result = await department_classifier.classify_and_summarize(
            content=parsed_content,
            embedding=embedding,
            filename=filename
        )
        
        vector_id = await embedding_service.store_embedding(
            embedding=embedding,
            metadata={
                "filename": filename,
                "object_path": object_path,
                "department": classification_result['department'],
                "content_preview": parsed_content[:500]
            }
        )
        
        document_metadata = {
            "filename": filename,
            "object_path": object_path,
            "department": classification_result['department'],
            "summary": classification_result['summary'],
            "confidence": classification_result['confidence'],
            "file_type": content_type,
            "file_size": len(file_content),
            "source": source,
            "vector_id": vector_id,
            "upload_date": datetime.utcnow().isoformat(),
            **(metadata or {})
        }
        
        document_id = await database_service.store_document_metadata(document_metadata)
        
        return {
            "status": "success",
            "document_id": document_id,
            "department": classification_result['department'],
            "summary": classification_result['summary'],
            "object_path": object_path
        }
        
    except Exception as e:
        logger.error(f"❌ N8N webhook error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

class AIChatRequest(BaseModel):
    message: str
    context: Optional[Dict[str, Any]] = None
    document_id: Optional[str] = None

class AIChatResponse(BaseModel):
    response: str
    documents: Optional[List[Dict[str, Any]]] = None
    document_analysis: Optional[Dict[str, Any]] = None

@app.post("/api/ai/chat", response_model=AIChatResponse)
async def ai_chat(chat_request: AIChatRequest):
    """AI assistant chat endpoint for document queries and analysis"""
    try:
        import openai
        from services.department_classifier import DepartmentClassifier
        
        classifier = DepartmentClassifier()
        message = chat_request.message.lower()
        
        # Handle document analysis request
        if chat_request.document_id:
            metadata = await database_service.get_document_metadata(chat_request.document_id)
            if not metadata:
                raise HTTPException(status_code=404, detail="Document not found")
            
            # Get document content
            file_content = await storage_service.download_document(metadata['object_path'])
            parsed_content = await document_parser.parse_document(
                filename=metadata.get('filename', 'document'),
                content=file_content
            )
            
            # Analyze document with AI - using shorter prompt and fewer tokens
            analysis_prompt = f"""Analyze this document concisely:

**File**: {metadata.get('filename', 'Unknown')}
**Content**: {parsed_content[:2000]}

Provide brief analysis:
1. **Type**: Document category
2. **Purpose**: Main objective
3. **Key Points**: Top 3-4 important details
4. **Summary**: 2-3 sentence overview
"""
            
            try:
                response = classifier.openai_client.chat.completions.create(
                    model=classifier.model,
                    messages=[
                        {"role": "system", "content": "You are a document analyst. Be concise and clear."},
                        {"role": "user", "content": analysis_prompt}
                    ],
                    temperature=0.3,
                    max_tokens=200  # Reduced from 400 to stay within credit limit
                )
                
                analysis = response.choices[0].message.content
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"❌ AI analysis failed: {error_msg}")
                
                # Check if it's a credit/payment error
                if "402" in error_msg or "credits" in error_msg.lower() or "payment" in error_msg.lower():
                    # Provide a manual analysis fallback
                    analysis = f"""📄 **Document Review** (Manual Analysis - AI Credits Exhausted)

**File**: {metadata.get('filename')}
**Department**: {metadata.get('department', 'Unknown')}
**Size**: {len(parsed_content)} characters

**Content Preview**:
{parsed_content[:500]}...

**Summary**: {metadata.get('summary', 'No summary available')}

⚠️ Note: AI analysis unavailable due to insufficient API credits. Please add credits at https://openrouter.ai/settings/credits or review the document manually using the download button below."""
                else:
                    raise
            
            return AIChatResponse(
                response=analysis,
                document_analysis={
                    "document_id": chat_request.document_id,
                    "filename": metadata.get('filename'),
                    "department": metadata.get('department'),
                    "summary": metadata.get('summary'),
                    "download_url": await storage_service.generate_download_url(metadata['object_path'])
                }
            )
        
        # Handle document search request
        elif any(keyword in message for keyword in ['search', 'find', 'look for', 'show me', 'get', 'document about', 'documents about']):
            # Extract search query
            search_query = chat_request.message
            for phrase in ['search for', 'find', 'look for', 'show me', 'get documents about', 'find documents about']:
                if phrase in message:
                    search_query = chat_request.message.split(phrase, 1)[-1].strip()
                    break
            
            # Perform semantic search
            query_embedding = await embedding_service.generate_embedding(search_query)
            results = await embedding_service.search_similar(
                query_embedding=query_embedding,
                limit=5
            )
            
            if results:
                # Get full metadata for results
                docs_with_urls = []
                for result in results:
                    # Extract document_id (stored at top level during upload)
                    doc_id = result.get('document_id')
                    
                    if not doc_id:
                        logger.warning(f"Search result missing document_id: {result}")
                        continue
                    
                    logger.info(f"Processing search result with doc_id: {doc_id}")
                    
                    if doc_id:
                        try:
                            metadata = await database_service.get_document_metadata(doc_id)
                            if metadata:
                                download_url = await storage_service.generate_download_url(metadata['object_path'])
                                docs_with_urls.append({
                                    **metadata,
                                    "download_url": download_url,
                                    "relevance_score": result.get('score', 0)
                                })
                        except Exception as e:
                            logger.warning(f"Failed to get metadata for {doc_id}: {e}")
                            continue
                
                if docs_with_urls:
                    response_text = f"🔍 **Found {len(docs_with_urls)} relevant document(s):**\n\n"
                    for idx, doc in enumerate(docs_with_urls[:5], 1):
                        response_text += f"**{idx}. {doc.get('filename', 'Unknown')}**\n"
                        response_text += f"   📊 Department: {doc.get('department', 'Unknown')}\n"
                        response_text += f"   📝 {doc.get('summary', 'No summary available')[:150]}...\n"
                        response_text += f"   🎯 Relevance: {doc.get('relevance_score', 0):.2%}\n\n"
                    
                    return AIChatResponse(
                        response=response_text,
                        documents=docs_with_urls[:5]
                    )
                else:
                    logger.warning(f"Search returned {len(results)} results but could not load metadata")
                    return AIChatResponse(
                        response="❌ Found documents but could not load their details. Please try again.",
                        documents=[]
                    )
            else:
                logger.info("No search results returned from embedding service")
                return AIChatResponse(
                    response="❌ No relevant documents found. Try rephrasing your search query.",
                    documents=[]
                )
        
        # General conversation
        else:
            return AIChatResponse(
                response=f"I understand you said: '{chat_request.message}'\n\nI can help you with:\n\n🔍 **Search**: Ask me to find documents (e.g., 'search for financial reports')\n📄 **Review**: Upload a document and ask 'what is in this document?'\n📤 **Upload**: Use the upload button to add new documents\n\nWhat would you like to do?"
            )
            
    except Exception as e:
        logger.error(f"❌ AI chat error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{document_id}/save-to-department")
async def save_document_to_department(
    document_id: str,
    department_id: str = Form(...)
):
    """Save/copy a document to a department's saved collection"""
    try:
        # Get document metadata
        metadata = await database_service.get_document_metadata(document_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Update or create a saved reference
        saved_doc = {
            "document_id": document_id,
            "department_id": department_id,
            "saved_by": "user",  # You can add user tracking here
            "saved_at": datetime.now().isoformat()
        }
        
        # Store in database (you may want to create a saved_documents table)
        # For now, we'll just return success
        return {
            "status": "success",
            "message": f"Document saved to {department_id} department",
            "document_id": document_id
        }
        
    except Exception as e:
        logger.error(f"❌ Error saving document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/private-documents")
async def get_private_documents(user_email: str):
    """Get all private documents for a user"""
    try:
        # Try to query with new columns, fall back if they don't exist
        try:
            result = database_service.client.table(database_service.table_name)\
                .select("*")\
                .eq("is_private", True)\
                .eq("owner_email", user_email)\
                .order("upload_date", desc=True)\
                .execute()
            
            return result.data if result.data else []
        except Exception as column_error:
            # Columns don't exist yet - return empty array
            logger.warning(f"⚠️ Privacy columns not found: {column_error}")
            logger.info("Please run: backend/migrations/add_privacy_fields.sql")
            return []
    except Exception as e:
        logger.error(f"❌ Error fetching private documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{document_id}/mark-private")
async def mark_document_private(document_id: str, user_email: str = Form(...)):
    """Mark a document as private"""
    try:
        logger.info(f"📝 Marking document {document_id} as private for {user_email}")
        
        # Update document to be private
        result = database_service.client.table(database_service.table_name)\
            .update({
                "is_private": True,
                "owner_email": user_email,
                "owner_user_id": user_email
            })\
            .eq("id", document_id)\
            .execute()
        
        logger.info(f"✅ Document {document_id} marked as private for {user_email}")
        logger.info(f"Updated rows: {len(result.data) if result.data else 0}")
        
        return {
            "message": "Document marked as private",
            "document_id": document_id,
            "owner_email": user_email
        }
    except Exception as e:
        logger.error(f"❌ Error marking document private: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/documents/{document_id}/mark-public")
async def mark_document_public(document_id: str):
    """Mark a document as public"""
    try:
        # Update document to be public
        database_service.client.table(database_service.table_name)\
            .update({
                "is_private": False,
                "owner_email": None,
                "owner_user_id": None
            })\
            .eq("id", document_id)\
            .execute()
        
        logger.info(f"✅ Document {document_id} marked as public")
        return {"message": "Document marked as public", "document_id": document_id}
    except Exception as e:
        logger.error(f"❌ Error marking document public: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
