"""
Embedding Service
Generates and manages document embeddings using OpenAI
Stores in ChromaDB vector database
"""
import os
import logging
from typing import List, Dict, Any, Optional
import chromadb
from chromadb.config import Settings
from openai import OpenAI

logger = logging.getLogger(__name__)

class EmbeddingService:
    def __init__(self):
        # Use OpenRouter API
        api_key = os.getenv("OPENROUTER_API_KEY")
        if not api_key:
            raise ValueError("OPENROUTER_API_KEY environment variable is required")
        
        base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        self.openai_client = OpenAI(api_key=api_key, base_url=base_url)
        
        # Initialize ChromaDB with local path
        chroma_path = os.path.join(os.path.dirname(__file__), "../chroma_db")
        os.makedirs(chroma_path, exist_ok=True)
        self.chroma_client = chromadb.PersistentClient(
            path=chroma_path,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        self.collection_name = "documents"
        self.collection = None
        
        logger.info("Embedding service initialized")
    
    async def initialize(self):
        """Initialize or get existing collection"""
        try:
            self.collection = self.chroma_client.get_or_create_collection(
                name=self.collection_name,
                metadata={"description": "Document embeddings for Doc.X-Intelligent"}
            )
            logger.info(f"✅ Collection initialized: {self.collection_name}")
        except Exception as e:
            logger.error(f"❌ Collection initialization failed: {e}")
            raise
    
    async def generate_embedding(self, text: str, model: str = "text-embedding-3-small") -> List[float]:
        """
        Generate embedding for text using OpenAI
        """
        try:
            # Truncate text if too long (max 8191 tokens for text-embedding-3-small)
            if len(text) > 30000:  # Approximate token limit
                text = text[:30000]
            
            response = self.openai_client.embeddings.create(
                model=model,
                input=text
            )
            
            embedding = response.data[0].embedding
            logger.info(f"✅ Generated embedding (dim: {len(embedding)})")
            return embedding
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            raise
    
    async def store_embedding(
        self,
        embedding: List[float],
        metadata: Dict[str, Any],
        document_id: Optional[str] = None
    ) -> str:
        """
        Store embedding in ChromaDB
        Returns the vector ID
        """
        try:
            import uuid
            
            if not document_id:
                document_id = str(uuid.uuid4())
            
            # Store in ChromaDB
            self.collection.add(
                embeddings=[embedding],
                metadatas=[metadata],
                ids=[document_id]
            )
            
            logger.info(f"✅ Stored embedding: {document_id}")
            return document_id
            
        except Exception as e:
            logger.error(f"❌ Embedding storage failed: {e}")
            raise
    
    async def search_similar(
        self,
        query_embedding: List[float],
        department: Optional[str] = None,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Search for similar documents using vector similarity
        """
        try:
            # Build where filter if department is specified
            where = {"department": department} if department else None
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=limit,
                where=where
            )
            
            # Format results
            documents = []
            if results['ids'] and len(results['ids'][0]) > 0:
                for i in range(len(results['ids'][0])):
                    documents.append({
                        "id": results['ids'][0][i],
                        "metadata": results['metadatas'][0][i],
                        "distance": results['distances'][0][i] if 'distances' in results else None
                    })
            
            logger.info(f"✅ Found {len(documents)} similar documents")
            return documents
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            raise
    
    async def delete_embedding(self, document_id: str):
        """Delete embedding from ChromaDB"""
        try:
            self.collection.delete(ids=[document_id])
            logger.info(f"✅ Deleted embedding: {document_id}")
        except Exception as e:
            logger.error(f"❌ Delete failed: {e}")
            raise
    
    async def get_collection_stats(self) -> Dict[str, Any]:
        """Get collection statistics"""
        try:
            count = self.collection.count()
            return {
                "total_documents": count,
                "collection_name": self.collection_name
            }
        except Exception as e:
            logger.error(f"❌ Stats retrieval failed: {e}")
            return {"error": str(e)}
    
    def check_health(self) -> bool:
        """Check if service is healthy"""
        try:
            if self.collection:
                self.collection.count()
                return True
            return False
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return False
