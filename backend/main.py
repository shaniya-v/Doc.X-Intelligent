"""
FastAPI Backend for Doc.X-Intelligent
Handles document processing, storage, embedding generation, and RAG-based classification
"""
import os
import logging
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime

from services.minio_service import MinIOService
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
minio_service = MinIOService()
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

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    try:
        # Initialize MinIO buckets
        await minio_service.initialize_buckets()
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
            "minio": minio_service.check_health(),
            "vector_db": embedding_service.check_health(),
            "classifier": department_classifier.check_health(),
            "database": database_service.check_health()
        },
        "timestamp": datetime.utcnow().isoformat()
    }

@app.post("/api/documents/upload", response_model=DocumentUploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: Optional[str] = None,
    source: str = "manual"
):
    """
    Upload and process a document:
    1. Store in MinIO
    2. Parse content
    3. Generate embeddings
    4. Classify department using RAG
    5. Store metadata in database
    """
    try:
        logger.info(f"📄 Processing document: {file.filename}")
        
        # Read file content
        file_content = await file.read()
        file_size = len(file_content)
        
        # Store in MinIO
        object_path = await minio_service.upload_document(
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
        
        # Generate embeddings
        embedding = await embedding_service.generate_embedding(parsed_content)
        logger.info(f"✅ Generated embedding")
        
        # Classify department and generate summary using RAG
        classification_result = await department_classifier.classify_and_summarize(
            content=parsed_content,
            embedding=embedding,
            filename=file.filename
        )
        logger.info(f"✅ Classified: {classification_result['department']} (confidence: {classification_result['confidence']})")
        
        # Store in vector database
        vector_id = await embedding_service.store_embedding(
            embedding=embedding,
            metadata={
                "filename": file.filename,
                "object_path": object_path,
                "department": classification_result['department'],
                "content_preview": parsed_content[:500]
            }
        )
        
        # Store metadata in database
        document_metadata = {
            "filename": file.filename,
            "object_path": object_path,
            "department": classification_result['department'],
            "summary": classification_result['summary'],
            "confidence": classification_result['confidence'],
            "file_type": file.content_type or "application/octet-stream",
            "file_size": file_size,
            "user_id": user_id,
            "source": source,
            "vector_id": vector_id,
            "upload_date": datetime.utcnow().isoformat()
        }
        
        document_id = await database_service.store_document_metadata(document_metadata)
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

@app.post("/api/documents/search", response_model=SearchResult)
async def search_documents(search_request: SearchRequest):
    """Search documents using semantic search"""
    try:
        # Generate query embedding
        query_embedding = await embedding_service.generate_embedding(search_request.query)
        
        # Search in vector database
        results = await embedding_service.search_similar(
            query_embedding=query_embedding,
            department=search_request.department,
            limit=search_request.limit
        )
        
        return SearchResult(
            documents=results,
            total=len(results)
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
        download_url = await minio_service.generate_download_url(metadata['object_path'])
        
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

@app.delete("/api/documents/{document_id}")
async def delete_document(document_id: str):
    """Delete a document from MinIO, vector DB, and database"""
    try:
        # Get document metadata
        metadata = await database_service.get_document_metadata(document_id)
        if not metadata:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete from MinIO
        await minio_service.delete_document(metadata['object_path'])
        
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
        object_path = await minio_service.upload_document(
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
