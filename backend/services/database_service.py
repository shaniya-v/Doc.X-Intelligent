"""
Database Service
Handles document metadata storage in Supabase
Stores only metadata, not actual file content
"""
import os
import logging
from typing import Dict, Any, List, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

class DatabaseService:
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY environment variables are required")
        
        self.client: Client = create_client(supabase_url, supabase_key)
        self.table_name = "documents"
        
        logger.info("Database service initialized")
    
    async def store_document_metadata(self, metadata: Dict[str, Any]) -> str:
        """Store document metadata in Supabase"""
        try:
            result = self.client.table(self.table_name).insert(metadata).execute()
            
            if result.data and len(result.data) > 0:
                document_id = result.data[0].get('id')
                logger.info(f"✅ Stored metadata: {document_id}")
                return str(document_id)
            else:
                raise Exception("No data returned from insert")
                
        except Exception as e:
            logger.error(f"❌ Metadata storage failed: {e}")
            raise
    
    async def get_document_metadata(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Get document metadata by ID"""
        try:
            result = self.client.table(self.table_name).select("*").eq("id", document_id).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"❌ Metadata retrieval failed: {e}")
            raise
    
    async def get_documents_by_department(
        self,
        department: str,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Get all documents for a department"""
        try:
            result = self.client.table(self.table_name)\
                .select("*")\
                .eq("department", department)\
                .order("upload_date", desc=True)\
                .limit(limit)\
                .execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"❌ Department query failed: {e}")
            raise
    
    async def search_documents(
        self,
        query: str,
        department: Optional[str] = None,
        limit: int = 50
    ) -> List[Dict[str, Any]]:
        """Search documents by filename or summary"""
        try:
            query_builder = self.client.table(self.table_name).select("*")
            
            if department:
                query_builder = query_builder.eq("department", department)
            
            # Search in filename and summary
            query_builder = query_builder.or_(
                f"filename.ilike.%{query}%,summary.ilike.%{query}%"
            )
            
            result = query_builder.order("upload_date", desc=True).limit(limit).execute()
            
            return result.data if result.data else []
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            raise
    
    async def delete_document_metadata(self, document_id: str):
        """Delete document metadata"""
        try:
            self.client.table(self.table_name).delete().eq("id", document_id).execute()
            logger.info(f"✅ Deleted metadata: {document_id}")
            
        except Exception as e:
            logger.error(f"❌ Metadata deletion failed: {e}")
            raise
    
    async def update_document_metadata(
        self,
        document_id: str,
        updates: Dict[str, Any]
    ):
        """Update document metadata"""
        try:
            result = self.client.table(self.table_name)\
                .update(updates)\
                .eq("id", document_id)\
                .execute()
            
            logger.info(f"✅ Updated metadata: {document_id}")
            return result.data[0] if result.data else None
            
        except Exception as e:
            logger.error(f"❌ Metadata update failed: {e}")
            raise
    
    def check_health(self) -> bool:
        """Check if database is accessible"""
        try:
            # Try a simple query
            self.client.table(self.table_name).select("id").limit(1).execute()
            return True
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return False
