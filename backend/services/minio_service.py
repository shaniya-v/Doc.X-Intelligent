"""
MinIO Service for Document Storage
Handles all object storage operations
"""
import os
import logging
from datetime import timedelta
from typing import Optional
from minio import Minio
from minio.error import S3Error
import uuid

logger = logging.getLogger(__name__)

class MinIOService:
    def __init__(self):
        self.endpoint = os.getenv("MINIO_ENDPOINT", "minio:9000")
        self.access_key = os.getenv("MINIO_ACCESS_KEY", "minioadmin")
        self.secret_key = os.getenv("MINIO_SECRET_KEY", "minioadmin123")
        self.bucket_name = os.getenv("MINIO_BUCKET", "documents")
        self.secure = os.getenv("MINIO_SECURE", "false").lower() == "true"
        
        # Initialize MinIO client
        self.client = Minio(
            self.endpoint,
            access_key=self.access_key,
            secret_key=self.secret_key,
            secure=self.secure
        )
        
        logger.info(f"MinIO client initialized: {self.endpoint}")
    
    async def initialize_buckets(self):
        """Create buckets if they don't exist"""
        try:
            # Check if bucket exists
            if not self.client.bucket_exists(self.bucket_name):
                self.client.make_bucket(self.bucket_name)
                logger.info(f"✅ Created bucket: {self.bucket_name}")
            else:
                logger.info(f"✅ Bucket already exists: {self.bucket_name}")
                
        except S3Error as e:
            logger.error(f"❌ Error initializing buckets: {e}")
            raise
    
    async def upload_document(
        self,
        filename: str,
        content: bytes,
        content_type: str = "application/octet-stream"
    ) -> str:
        """
        Upload a document to MinIO
        Returns the object path
        """
        try:
            # Generate unique object name
            file_extension = filename.split('.')[-1] if '.' in filename else 'bin'
            object_name = f"{uuid.uuid4()}.{file_extension}"
            
            # Upload to MinIO
            from io import BytesIO
            
            self.client.put_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                data=BytesIO(content),
                length=len(content),
                content_type=content_type,
                metadata={
                    "original_filename": filename
                }
            )
            
            logger.info(f"✅ Uploaded: {object_name} ({len(content)} bytes)")
            return object_name
            
        except S3Error as e:
            logger.error(f"❌ Upload failed: {e}")
            raise
    
    async def download_document(self, object_name: str) -> bytes:
        """Download a document from MinIO"""
        try:
            response = self.client.get_object(self.bucket_name, object_name)
            content = response.read()
            response.close()
            response.release_conn()
            return content
            
        except S3Error as e:
            logger.error(f"❌ Download failed: {e}")
            raise
    
    async def generate_download_url(
        self,
        object_name: str,
        expires: int = 3600
    ) -> str:
        """Generate a presigned URL for document download"""
        try:
            url = self.client.presigned_get_object(
                bucket_name=self.bucket_name,
                object_name=object_name,
                expires=timedelta(seconds=expires)
            )
            return url
            
        except S3Error as e:
            logger.error(f"❌ URL generation failed: {e}")
            raise
    
    async def delete_document(self, object_name: str):
        """Delete a document from MinIO"""
        try:
            self.client.remove_object(self.bucket_name, object_name)
            logger.info(f"✅ Deleted: {object_name}")
            
        except S3Error as e:
            logger.error(f"❌ Delete failed: {e}")
            raise
    
    def check_health(self) -> bool:
        """Check if MinIO is accessible"""
        try:
            self.client.bucket_exists(self.bucket_name)
            return True
        except Exception as e:
            logger.error(f"❌ Health check failed: {e}")
            return False
