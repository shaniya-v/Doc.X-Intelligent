"""
Gmail Ingestion Service - Pure Python Implementation
Searches for KMRL keyword in unread emails, processes email body and attachments
"""

import os
import base64
import io
import time
import logging
from datetime import datetime
from typing import List, Dict, Optional

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError
import requests

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Gmail API Scopes
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
]

# Configuration
GMAIL_KEYWORD = 'KMRL'  # Search keyword
POLL_INTERVAL = 60  # seconds
BACKEND_URL = 'http://localhost:8000'
TOKEN_PATH = 'gmail_token.json'
CREDENTIALS_PATH = 'gmail_credentials.json'

# Document file extensions
DOCUMENT_EXTENSIONS = {
    '.pdf', '.doc', '.docx', '.xls', '.xlsx', 
    '.csv', '.txt', '.odt', '.ods'
}

DOCUMENT_MIMETYPES = {
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
    'application/vnd.oasis.opendocument.text',
    'application/vnd.oasis.opendocument.spreadsheet'
}


class GmailIngestionService:
    """Gmail ingestion service for document processing"""
    
    def __init__(self):
        self.service = None
        self.credentials = None
        
    def authenticate(self) -> bool:
        """Authenticate with Gmail API"""
        try:
            # Load existing token
            if os.path.exists(TOKEN_PATH):
                self.credentials = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
            
            # Refresh or get new credentials
            if not self.credentials or not self.credentials.valid:
                if self.credentials and self.credentials.expired and self.credentials.refresh_token:
                    logger.info("Refreshing expired credentials...")
                    self.credentials.refresh(Request())
                else:
                    if not os.path.exists(CREDENTIALS_PATH):
                        logger.error(f"Credentials file not found: {CREDENTIALS_PATH}")
                        logger.info("Please download OAuth 2.0 credentials from Google Cloud Console")
                        return False
                    
                    logger.info("Starting OAuth flow...")
                    flow = InstalledAppFlow.from_client_secrets_file(CREDENTIALS_PATH, SCOPES)
                    self.credentials = flow.run_local_server(port=8080)
                
                # Save credentials for next run
                with open(TOKEN_PATH, 'w') as token:
                    token.write(self.credentials.to_json())
                    
            self.service = build('gmail', 'v1', credentials=self.credentials)
            logger.info("✅ Gmail authentication successful")
            return True
            
        except Exception as e:
            logger.error(f"❌ Authentication failed: {e}")
            return False
    
    def get_unread_kmrl_emails(self) -> List[Dict]:
        """Fetch unread emails containing KMRL keyword"""
        try:
            # Search for KMRL keyword in subject or body, must be unread
            query = f'{GMAIL_KEYWORD} is:unread'
            
            results = self.service.users().messages().list(
                userId='me',
                q=query,
                maxResults=10
            ).execute()
            
            messages = results.get('messages', [])
            
            if not messages:
                logger.debug("No unread KMRL emails found")
                return []
            
            logger.info(f"📬 Found {len(messages)} unread emails with '{GMAIL_KEYWORD}' keyword")
            return messages
            
        except HttpError as e:
            logger.error(f"❌ Error fetching emails: {e}")
            return []
    
    def get_message_details(self, message_id: str) -> Optional[Dict]:
        """Get full message details including attachments"""
        try:
            message = self.service.users().messages().get(
                userId='me',
                id=message_id,
                format='full'
            ).execute()
            
            return message
            
        except HttpError as e:
            logger.error(f"❌ Error getting message {message_id}: {e}")
            return None
    
    def extract_email_metadata(self, message: Dict) -> Dict:
        """Extract sender, subject, date and body from message"""
        headers = message['payload']['headers']
        
        metadata = {
            'message_id': message['id'],
            'thread_id': message['threadId'],
            'from': None,
            'subject': None,
            'date': None,
            'body': None
        }
        
        for header in headers:
            name = header['name'].lower()
            if name == 'from':
                metadata['from'] = header['value']
            elif name == 'subject':
                metadata['subject'] = header['value']
            elif name == 'date':
                metadata['date'] = header['value']
        
        # Extract email body
        metadata['body'] = self.extract_email_body(message)
        
        return metadata
    
    def extract_email_body(self, message: Dict) -> str:
        """Extract text content from email body"""
        try:
            payload = message['payload']
            body_text = ''
            
            # Check if body is in the main payload
            if 'body' in payload and 'data' in payload['body']:
                body_text = base64.urlsafe_b64decode(payload['body']['data']).decode('utf-8', errors='ignore')
            
            # Check parts for body content
            elif 'parts' in payload:
                for part in payload['parts']:
                    if part['mimeType'] == 'text/plain':
                        if 'data' in part['body']:
                            body_text = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
                            break
                    elif part['mimeType'] == 'text/html' and not body_text:
                        if 'data' in part['body']:
                            # Fallback to HTML if no plain text
                            body_text = base64.urlsafe_b64decode(part['body']['data']).decode('utf-8', errors='ignore')
            
            # Clean up the text (remove excessive whitespace)
            body_text = ' '.join(body_text.split())
            return body_text[:5000]  # Limit to 5000 chars
            
        except Exception as e:
            logger.error(f"Error extracting email body: {e}")
            return ""
    
    def is_document_file(self, filename: str, mimetype: str) -> bool:
        """Check if attachment is a document file"""
        # Check by extension
        ext = os.path.splitext(filename.lower())[1]
        if ext in DOCUMENT_EXTENSIONS:
            return True
        
        # Check by mimetype
        if mimetype in DOCUMENT_MIMETYPES:
            return True
        
        return False
    
    def get_attachments(self, message: Dict) -> List[Dict]:
        """Extract all document attachments from message"""
        attachments = []
        
        def process_parts(parts, metadata):
            for part in parts:
                # Recursively process nested parts
                if 'parts' in part:
                    process_parts(part['parts'], metadata)
                    continue
                
                # Check if it's an attachment
                if part.get('filename'):
                    filename = part['filename']
                    mimetype = part.get('mimeType', '')
                    
                    # Only process document files
                    if not self.is_document_file(filename, mimetype):
                        logger.debug(f"⏭️  Skipping non-document: {filename} ({mimetype})")
                        continue
                    
                    attachment_id = part['body'].get('attachmentId')
                    size = part['body'].get('size', 0)
                    
                    if attachment_id:
                        attachments.append({
                            'filename': filename,
                            'mimetype': mimetype,
                            'attachment_id': attachment_id,
                            'size': size,
                            'message_id': metadata['message_id'],
                            'email_from': metadata['from'],
                            'email_subject': metadata['subject']
                        })
                        logger.info(f"📎 Found document: {filename} ({size/1024:.1f} KB)")
        
        # Get metadata
        metadata = self.extract_email_metadata(message)
        
        # Process message parts
        if 'parts' in message['payload']:
            process_parts(message['payload']['parts'], metadata)
        
        return attachments
    
    def download_attachment(self, message_id: str, attachment_id: str) -> Optional[bytes]:
        """Download attachment data"""
        try:
            attachment = self.service.users().messages().attachments().get(
                userId='me',
                messageId=message_id,
                id=attachment_id
            ).execute()
            
            data = attachment['data']
            file_data = base64.urlsafe_b64decode(data)
            
            return file_data
            
        except HttpError as e:
            logger.error(f"❌ Error downloading attachment: {e}")
            return None
    
    def process_email_content(self, email_metadata: Dict) -> Dict:
        """Process email body - create embeddings and get summary"""
        try:
            url = f"{BACKEND_URL}/api/emails/process"
            
            payload = {
                'email_body': email_metadata['body'],
                'email_from': email_metadata['from'],
                'email_subject': email_metadata['subject'],
                'message_id': email_metadata['message_id']
            }
            
            response = requests.post(url, json=payload, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Email content processed")
                logger.info(f"   Summary: {result.get('summary', 'N/A')[:100]}...")
                logger.info(f"   Department: {result.get('department', 'pending')}")
                return result
            else:
                logger.warning(f"⚠️  Email processing failed: {response.status_code}")
                return {}
                
        except Exception as e:
            logger.error(f"❌ Error processing email content: {e}")
            return {}
    
    def upload_to_backend(self, attachment_info: Dict, file_data: bytes, email_context: Dict = None) -> bool:
        """Upload document to FastAPI backend with email context"""
        try:
            url = f"{BACKEND_URL}/api/documents/upload"
            
            files = {
                'file': (attachment_info['filename'], io.BytesIO(file_data), attachment_info['mimetype'])
            }
            
            params = {
                'email_from': attachment_info['email_from'],
                'email_subject': attachment_info['email_subject'],
                'source': 'gmail_python'
            }
            
            # Add email body context if available
            if email_context and email_context.get('body'):
                params['email_body'] = email_context['body'][:1000]  # First 1000 chars
            
            response = requests.post(url, files=files, params=params, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                logger.info(f"✅ Uploaded: {attachment_info['filename']}")
                logger.info(f"   Document ID: {result.get('document_id', 'N/A')}")
                logger.info(f"   Department: {result.get('department', 'pending')}")
                return True
            else:
                logger.error(f"❌ Upload failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"❌ Error uploading to backend: {e}")
            return False
    
    def mark_as_read(self, message_id: str) -> bool:
        """Mark email as read by removing UNREAD label"""
        try:
            self.service.users().messages().modify(
                userId='me',
                id=message_id,
                body={'removeLabelIds': ['UNREAD']}
            ).execute()
            
            logger.info(f"✅ Marked email as read: {message_id}")
            return True
            
        except HttpError as e:
            logger.error(f"❌ Error marking as read: {e}")
            return False
    
    def process_email(self, message_id: str) -> bool:
        """Process a single email: extract body, create embeddings, process attachments"""
        logger.info(f"\n{'='*60}")
        logger.info(f"📧 Processing email: {message_id}")
        
        # Get full message
        message = self.get_message_details(message_id)
        if not message:
            return False
        
        # Extract metadata including body
        metadata = self.extract_email_metadata(message)
        logger.info(f"From: {metadata['from']}")
        logger.info(f"Subject: {metadata['subject']}")
        logger.info(f"Body length: {len(metadata.get('body', ''))} chars")
        
        # Step 1: Process email body content
        logger.info(f"\n📝 Processing email content...")
        email_result = self.process_email_content(metadata)
        
        # Step 2: Get attachments
        attachments = self.get_attachments(message)
        
        if not attachments:
            logger.info("📭 No attachments found")
            # Still processed email body, so mark as read
            self.mark_as_read(message_id)
            logger.info(f"\n✅ Email body processed and stored")
            return True
        
        logger.info(f"📎 Found {len(attachments)} document(s)")
        
        # Step 3: Process each attachment with email context
        success_count = 0
        for attachment_info in attachments:
            logger.info(f"\n  Processing: {attachment_info['filename']}")
            
            # Download attachment
            file_data = self.download_attachment(
                attachment_info['message_id'],
                attachment_info['attachment_id']
            )
            
            if not file_data:
                logger.error(f"  ❌ Failed to download")
                continue
            
            # Upload to backend with email context
            if self.upload_to_backend(attachment_info, file_data, email_context=metadata):
                success_count += 1
            else:
                logger.error(f"  ❌ Failed to upload")
        
        # Mark email as read
        self.mark_as_read(message_id)
        
        if success_count > 0:
            logger.info(f"\n✅ Completed: Email body + {success_count}/{len(attachments)} documents processed")
        else:
            logger.info(f"\n✅ Completed: Email body processed (no attachments uploaded)")
        
        return True
    
    def run_once(self) -> int:
        """Run one polling cycle"""
        messages = self.get_unread_kmrl_emails()
        
        if not messages:
            return 0
        
        processed = 0
        for message in messages:
            if self.process_email(message['id']):
                processed += 1
            time.sleep(1)  # Small delay between emails
        
        return processed
    
    def run_continuous(self):
        """Run continuous polling loop"""
        logger.info("🚀 Starting Gmail ingestion service")
        logger.info(f"Polling every {POLL_INTERVAL} seconds")
        logger.info(f"Keyword: {GMAIL_KEYWORD}")
        logger.info(f"Backend: {BACKEND_URL}")
        
        while True:
            try:
                logger.info(f"\n{'='*60}")
                logger.info(f"🔄 Polling at {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                processed = self.run_once()
                
                if processed > 0:
                    logger.info(f"✅ Processed {processed} email(s)")
                else:
                    logger.debug("No new emails to process")
                
                logger.info(f"💤 Sleeping for {POLL_INTERVAL} seconds...")
                time.sleep(POLL_INTERVAL)
                
            except KeyboardInterrupt:
                logger.info("\n🛑 Stopping service...")
                break
            except Exception as e:
                logger.error(f"❌ Error in polling cycle: {e}")
                logger.info(f"Retrying in {POLL_INTERVAL} seconds...")
                time.sleep(POLL_INTERVAL)


def main():
    """Main entry point"""
    service = GmailIngestionService()
    
    # Authenticate
    if not service.authenticate():
        logger.error("Failed to authenticate. Exiting.")
        return
    
    # Run continuous polling
    service.run_continuous()


if __name__ == "__main__":
    main()
