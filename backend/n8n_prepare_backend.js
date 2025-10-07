// CORRECTED N8N Workflow JavaScript - for "Prepare for Backend" node
// This handles both downloaded attachments and direct Gmail processing

const items = $input.all();
const results = [];

console.log(`🔄 Prepare for Backend: Processing ${items.length} items`);

function safeString(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
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

for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    console.log(`📧 Processing item ${i + 1}`);
    console.log(`📋 Item keys:`, Object.keys(item.json));
    console.log(`📎 Binary keys:`, Object.keys(item.binary || {}));
    
    try {
        // Get email metadata (might be in json directly or in a parent message)
        let emailData = item.json;
        
        // Check if this item came from Download Documents node
        if (item.json.parentMessage || item.json.originalMessage) {
            emailData = item.json.parentMessage || item.json.originalMessage;
            console.log(`📨 Found parent message data`);
        }
        
        // Prepare document for DOC.X backend
        const documentData = {
            source: "n8n",
            content: emailData.body || emailData.textPlain || emailData.snippet || emailData.text || "",
            subject: emailData.subject || item.json.subject || "Gmail Document",
            from: safeString(emailData.from || item.json.from),
            timestamp: emailData.internalDate || emailData.date || new Date().toISOString(),
            messageId: emailData.id || item.json.messageId || `n8n_${Date.now()}_${i}`,
            threadId: emailData.threadId || "",
            hasBinary: false,
            metadata: {
                to: safeString(emailData.to),
                cc: safeString(emailData.cc),
                receivedDate: emailData.internalDate || emailData.date,
                itemIndex: i,
                nodeType: "gmail-processor"
            }
        };

        // Handle downloaded attachments (binary data from Download Documents node)
        if (item.binary && Object.keys(item.binary).length > 0) {
            console.log(`📎 Found ${Object.keys(item.binary).length} binary attachments`);
            
            documentData.hasBinary = true;
            documentData.binary = {};
            
            for (const [key, attachment] of Object.entries(item.binary)) {
                if (attachment && attachment.data) {
                    documentData.binary[key] = {
                        data: attachment.data,
                        fileName: attachment.fileName || attachment.filename || item.json.fileName || `attachment_${key}`,
                        mimeType: attachment.mimeType || item.json.mimeType || 'application/octet-stream',
                        fileSize: attachment.fileSize || item.json.fileSize || 0
                    };
                    
                    console.log(`  ✓ Processed: ${documentData.binary[key].fileName} (${documentData.binary[key].mimeType})`);
                }
            }
        }
        
        // Handle case where no binary data but we have file info
        else if (item.json.fileName || item.json.filename) {
            console.log(`📄 File info found but no binary data: ${item.json.fileName || item.json.filename}`);
            
            // Try to use any available content as text
            if (item.json.content || item.json.data) {
                documentData.content = item.json.content || item.json.data || "";
                documentData.subject = `File: ${item.json.fileName || item.json.filename}`;
            }
        }

        // Send to DOC.X Intelligent backend
        console.log(`🚀 Sending to backend: ${documentData.subject}`);
        console.log(`📊 Data summary:`, {
            subject: documentData.subject,
            contentLength: documentData.content.length,
            hasBinary: documentData.hasBinary,
            binaryCount: documentData.hasBinary ? Object.keys(documentData.binary).length : 0
        });

        const response = await fetch('http://127.0.0.1:5000/webhook/document?source=n8n', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-Source': 'gmail-workflow',
                'User-Agent': 'n8n-gmail-processor/2.0'
            },
            body: JSON.stringify(documentData)
        });

        const responseData = await response.json();
        
        if (response.ok) {
            console.log(`✅ Document processed successfully: ${responseData.document?.id}`);
            
            results.push({
                json: {
                    status: 'success',
                    messageId: documentData.messageId,
                    subject: documentData.subject,
                    from: documentData.from,
                    documentId: responseData.document?.id,
                    assignedDepartment: responseData.document?.assigned_department,
                    priority: responseData.document?.priority,
                    confidence: responseData.document?.confidence,
                    multiDepartment: responseData.document?.multi_department || false,
                    departments: responseData.document?.departments_detected || [],
                    hasAttachments: documentData.hasBinary,
                    attachmentCount: documentData.hasBinary ? Object.keys(documentData.binary).length : 0,
                    processingTime: responseData.processing_time,
                    message: responseData.message,
                    analysisMethod: responseData.document?.analysis_method || 'RAG',
                    timestamp: new Date().toISOString(),
                    documentUrl: `http://localhost:3001/document/${responseData.document?.id}`,
                    backendResponse: responseData
                }
            });
            
        } else {
            console.error(`❌ Backend error ${response.status}:`, responseData);
            
            results.push({
                json: {
                    status: 'error',
                    messageId: documentData.messageId,
                    subject: documentData.subject,
                    error: responseData.error || `HTTP ${response.status}`,
                    message: responseData.message || 'Failed to process document',
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error(`❌ Processing error for item ${i + 1}:`, error.message);
        
        results.push({
            json: {
                status: 'error',
                itemIndex: i,
                error: error.message,
                message: 'Failed to process item',
                timestamp: new Date().toISOString(),
                originalData: item.json
            }
        });
    }
}

console.log(`📊 Completed processing ${items.length} items. Results: ${results.length}`);
console.log(`✅ Successful: ${results.filter(r => r.json.status === 'success').length}`);
console.log(`❌ Errors: ${results.filter(r => r.json.status === 'error').length}`);

return results;