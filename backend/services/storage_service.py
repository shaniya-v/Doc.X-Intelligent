"""
Supabase Storage Service for Document Storage
Handles all object storage operations using Supabase Storage Buckets
"""
import os
import logging
from datetime import timedelta
from typing import Optional
from supabase import create_client, Client
import uuid
import re

logger = logging.getLogger(__name__)

class StorageService:
    def __init__(self):
        supabase_url = os.getenv("SUPABASE_URL")
        supabase_key = os.getenv("SUPABASE_KEY")
        self.bucket_name = os.getenv("STORAGE_BUCKET", "documents")
        
        if not supabase_url or not supabase_key:
            raise ValueError("SUPABASE_URL and SUPABASE_KEY must be set in environment variables")
        
        # Initialize Supabase client
        self.client: Client = create_client(supabase_url, supabase_key)
        self.storage = self.client.storage
        
        logger.info(f"✅ Supabase Storage initialized: {supabase_url}")
    
    async def initialize_buckets(self):
        """Create buckets if they don't exist"""
        try:
            # List all buckets
            buckets = self.storage.list_buckets()
            bucket_names = [b.name for b in buckets]
            
            # Check if bucket exists
            if self.bucket_name not in bucket_names:
                # Create public bucket for documents
                self.storage.create_bucket(self.bucket_name, options={"public": True})
                logger.info(f"✅ Created bucket: {self.bucket_name}")
            else:
                logger.info(f"✅ Bucket already exists: {self.bucket_name}")
                
        except Exception as e:
            logger.error(f"❌ Error initializing buckets: {e}")
            # Bucket might already exist, continue anyway
            pass
    
    async def upload_document(
        self,
        filename: str,
        content: bytes,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a document to Supabase Storage
        Returns the object path
        """
        try:
            # Generate unique folder with UUID
            file_id = str(uuid.uuid4())
            
            # Sanitize original filename (remove special characters, keep spaces as underscores)
            safe_filename = re.sub(r'[^\w\s.-]', '', filename)
            safe_filename = safe_filename.replace(' ', '_')
            
            # Store as: uuid/original-filename.ext
            # This preserves original name while ensuring uniqueness
            object_name = f"{file_id}/{safe_filename}"
            
            # Upload to Supabase Storage
            result = self.storage.from_(self.bucket_name).upload(
                path=object_name,
                file=content,
                file_options={"content-type": content_type}
            )
            
            logger.info(f"✅ Uploaded: {safe_filename} -> {object_name} ({len(content)} bytes)")
            return object_name
            
        except Exception as e:
            logger.error(f"❌ Upload failed: {e}")
            raise
    
    async def download_document(self, object_name: str) -> bytes:
        """Download a document from Supabase Storage"""
        try:
            response = self.storage.from_(self.bucket_name).download(object_name)
            return response
            
        except Exception as e:
            logger.error(f"❌ Download failed: {e}")
            raise
    
    async def generate_download_url(
        self,
        object_name: str,
        expires: int = 3600
    ) -> str:
        """Generate a signed URL for document download/viewing"""
        try:
            # Create signed URL with expiry (in seconds)
            result = self.storage.from_(self.bucket_name).create_signed_url(
                path=object_name,
                expires_in=expires
            )
            
            # result is a dict with 'signedURL' key
            url = result.get('signedURL') if isinstance(result, dict) else result
            
            return url
            
        except Exception as e:
            logger.error(f"❌ URL generation failed: {e}")
            raise
    
    async def delete_document(self, object_name: str):
        """Delete a document from Supabase Storage"""
        try:
            self.storage.from_(self.bucket_name).remove([object_name])
            logger.info(f"✅ Deleted: {object_name}")
            
        except Exception as e:
            logger.error(f"❌ Delete failed: {e}")
            raise
    
    def check_health(self) -> bool:
        """Check if Supabase Storage is accessible"""
        try:
            # Try to list buckets as health check
            self.storage.list_buckets()
            return True
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return False
