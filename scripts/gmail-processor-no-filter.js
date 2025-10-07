// Enhanced Gmail attachment processor for N8N Gmail node output
const items = $input.all();
const results = [];

// Helper function to safely extract string from Gmail API response
function safeString(value) {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object') {
    // Handle N8N Gmail node address objects
    if (value.value && Array.isArray(value.value) && value.value[0]) {
      const addr = value.value[0];
      return addr.name ? `${addr.name} <${addr.address}>` : addr.address;
    }
    if (value.text) return value.text;
    if (value.emailAddress) return value.emailAddress;
    if (value.name) return value.name;
    return String(value);
  }
  return String(value || '');
}

// Check if email has multipart content indicating potential attachments
function hasMultipartContent(headers) {
  if (!headers || typeof headers !== 'object') return false;
  
  const contentType = headers['content-type'] || '';
  return contentType.includes('multipart/mixed') || 
         contentType.includes('multipart/related') || 
         contentType.includes('multipart/alternative');
}

// Extract boundary from content-type header
function extractBoundary(headers) {
  if (!headers || typeof headers !== 'object') return null;
  
  const contentType = headers['content-type'] || '';
  const boundaryMatch = contentType.match(/boundary="?([^"\s;]+)"?/);
  return boundaryMatch ? boundaryMatch[1] : null;
}

for (const item of items) {
  const data = item.json;
  const binary = item.binary || {};
  
  console.log(`\n=== Processing Gmail Message ===`);
  console.log(`📧 Subject: ${safeString(data.subject)}`);
  console.log(`👤 From: ${safeString(data.from)}`);
  console.log(`🆔 Message ID: ${data.id}`);
  console.log(`📏 Size: ${data.sizeEstimate} bytes`);
  console.log(`🔗 Has binary data: ${Object.keys(binary).length > 0}`);
  console.log(`📎 Binary keys: ${Object.keys(binary)}`);
  
  console.log(`🎯 Processing email (no filter applied)`);
  
  let hasProcessedAttachments = false;
  
  // Method 1: Check if N8N extracted binary attachments (PRIORITY METHOD)
  if (binary && Object.keys(binary).length > 0) {
    console.log(`📎 Method 1: Found ${Object.keys(binary).length} binary attachments from N8N`);
    
    for (const [key, attachment] of Object.entries(binary)) {
      if (attachment && (attachment.fileName || attachment.filename)) {
        const fileName = attachment.fileName || attachment.filename;
        console.log(`📄 Processing binary attachment: ${fileName} (${attachment.fileSize || 0} bytes)`);
        
        results.push({
          json: {
            documentId: `gmail_${data.id}_${fileName}`,
            filename: fileName,
            mimeType: attachment.mimeType || 'application/octet-stream',
            size: attachment.fileSize || 0,
            downloadUrl: null, // Binary data, no URL needed
            source: 'gmail',
            parentMessage: {
              id: data.id,
              subject: safeString(data.subject),
              from: safeString(data.from),
              date: data.date
            },
            metadata: {
              hasAttachment: true,
              hasBinaryData: true,
              binaryKey: key,
              language: 'unknown',
              priority: 'normal'
            }
          },
          binary: {
            [key]: attachment
          }
        });
        hasProcessedAttachments = true;
      }
    }
  }
  
  // Method 2: Check if N8N processed attachments are available
  if (!hasProcessedAttachments && data.attachments && Array.isArray(data.attachments) && data.attachments.length > 0) {
    console.log(`📎 Method 2: Found ${data.attachments.length} N8N processed attachments`);
    
    for (const attachment of data.attachments) {
      if (attachment.size && attachment.size > 0) {
        const downloadUrl = attachment.downloadUrl || attachment.url || 
          (attachment.attachmentId ? `https://www.googleapis.com/gmail/v1/users/me/messages/${data.id}/attachments/${attachment.attachmentId}` : null);
        
        if (downloadUrl) {
          console.log(`📄 Processing attachment: ${attachment.filename} (${attachment.size} bytes)`);
          
          results.push({
            json: {
              documentId: `gmail_${data.id}_${attachment.filename}`,
              filename: attachment.filename || 'attachment',
              mimeType: attachment.mimeType || 'application/octet-stream',
              size: attachment.size,
              downloadUrl: downloadUrl,
              source: 'gmail',
              parentMessage: {
                id: data.id,
                subject: safeString(data.subject),
                from: safeString(data.from),
                date: data.date
              },
              metadata: {
                hasAttachment: true,
                attachmentId: attachment.attachmentId,
                language: 'unknown',
                priority: 'normal'
              }
            }
          });
          hasProcessedAttachments = true;
        }
      }
    }
  }
  
  // Method 3: Check for multipart content indicating attachments
  if (!hasProcessedAttachments && hasMultipartContent(data.headers)) {
    console.log(`📎 Method 3: Multipart content detected - may contain attachments`);
    const boundary = extractBoundary(data.headers);
    console.log(`🔗 Content boundary: ${boundary}`);
    
    // Since N8N Gmail node doesn't expose raw multipart content,
    // we'll create a placeholder for multipart content processing
    console.log(`⚠️ Multipart content detected but N8N Gmail node doesn't expose raw parts`);
    console.log(`🔄 Processing as email with potential attachments`);
    
    // Process as email content that likely has attachments
    results.push({
      json: {
        documentId: `gmail_${data.id}_multipart`,
        filename: `${safeString(data.subject) || 'Email'}.eml`,
        content: data.html || data.text || '',
        mimeType: 'message/rfc822',
        downloadUrl: null,
        source: 'gmail',
        parentMessage: {
          id: data.id,
          subject: safeString(data.subject),
          from: safeString(data.from),
          date: data.date
        },
        metadata: {
          hasAttachment: true, // Mark as having attachments based on multipart content
          multipartBoundary: boundary,
          language: 'unknown',
          priority: safeString(data.subject).toLowerCase().includes('urgent') ? 'urgent' : 'normal',
          note: 'Multipart email - may contain attachments not processed by N8N Gmail node'
        }
      }
    });
    hasProcessedAttachments = true;
  }
  
  // Method 4: Process as text email if no attachments detected
  if (!hasProcessedAttachments) {
    console.log(`💬 No attachments detected - processing as text email`);
    
    results.push({
      json: {
        documentId: `gmail_${data.id}_content`,
        filename: `${safeString(data.subject) || 'Email'}.txt`,
        content: data.text || data.html || '',
        mimeType: data.html ? 'text/html' : 'text/plain',
        downloadUrl: null,
        source: 'gmail',
        parentMessage: {
          id: data.id,
          subject: safeString(data.subject),
          from: safeString(data.from),
          date: data.date
        },
        metadata: {
          hasAttachment: false,
          language: 'unknown',
          priority: safeString(data.subject).toLowerCase().includes('urgent') || safeString(data.subject).toLowerCase().includes('अत्यावश्यक') ? 'urgent' : 'normal'
        }
      }
    });
  }
}

console.log(`\n🎯 Gmail Processing Summary:`);
console.log(`📧 Total emails processed: ${items.length}`);
console.log(`📄 Documents created: ${results.length}`);
console.log(`✅ All emails processed (no filter applied)`);

return results;