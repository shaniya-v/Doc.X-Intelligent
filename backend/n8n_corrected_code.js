// CORRECTED N8N JavaScript Code for Gmail Document Processor
// Copy and paste this into your N8N JavaScript node

const items = $input.all();
const results = [];

console.log(`🔄 Processing ${items.length} items from Gmail`);

// Helper function to safely extract string values
function safeString(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        if (Array.isArray(value) && value.length > 0) {
            return value.map(item => {
                if (typeof item === 'string') return item;
                if (item.name && item.address) return `${item.name} <${item.address}>`;
                return item.address || item.emailAddress || '';
            }).join(', ');
        }
        if (value.name && value.address) return `${value.name} <${value.address}>`;
        if (value.address) return value.address;
        if (value.emailAddress) return value.emailAddress;
    }
    return value ? value.toString() : '';
}

// Process each Gmail item
for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
        console.log(`📧 Processing item ${i + 1}: ${item.json.subject || 'No Subject'}`);
        
        // Build document data for DOC.X Intelligent
        const documentData = {
            source: "n8n",
            content: item.json.body || item.json.textPlain || item.json.snippet || "",
            subject: item.json.subject || "No Subject",
            from: safeString(item.json.from),
            timestamp: item.json.internalDate || item.json.date || new Date().toISOString(),
            messageId: item.json.id || `n8n_${Date.now()}_${i}`,
            threadId: item.json.threadId || "",
            hasBinary: false,
            metadata: {
                to: safeString(item.json.to),
                cc: safeString(item.json.cc),
                receivedDate: item.json.internalDate,
                itemIndex: i
            }
        };

        // Handle attachments/binary data
        if (item.binary && Object.keys(item.binary).length > 0) {
            console.log(`📎 Found ${Object.keys(item.binary).length} attachments`);
            
            documentData.hasBinary = true;
            documentData.binary = {};
            
            for (const [key, attachment] of Object.entries(item.binary)) {
                if (attachment && attachment.data) {
                    documentData.binary[key] = {
                        data: attachment.data,
                        fileName: attachment.fileName || attachment.filename || `attachment_${key}`,
                        mimeType: attachment.mimeType || 'application/octet-stream',
                        fileSize: attachment.fileSize || 0
                    };
                    console.log(`  ✓ ${documentData.binary[key].fileName} (${documentData.binary[key].mimeType})`);
                }
            }
        }

        // Send to DOC.X Intelligent backend
        const backendUrl = 'http://127.0.0.1:5000/webhook/document?source=n8n';
        
        console.log(`🚀 Sending to DOC.X Intelligent: ${documentData.subject}`);
        
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-Source': 'gmail-workflow',
                'User-Agent': 'n8n-gmail-processor/1.0'
            },
            body: JSON.stringify(documentData)
        });

        const responseData = await response.json();
        
        if (response.ok) {
            console.log(`✅ Document processed successfully: ${responseData.document?.id}`);
            
            // Create successful result
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
                    documentUrl: `http://localhost:3001/document/${responseData.document?.id}`
                }
            });
            
        } else {
            console.error(`❌ Backend error ${response.status}: ${responseData.error || 'Unknown error'}`);
            
            // Create error result
            results.push({
                json: {
                    status: 'error',
                    messageId: documentData.messageId,
                    subject: documentData.subject,
                    from: documentData.from,
                    error: responseData.error || `HTTP ${response.status}`,
                    message: responseData.message || 'Failed to process document',
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error(`❌ Processing error for item ${i + 1}:`, error.message);
        
        // Create error result
        results.push({
            json: {
                status: 'error',
                itemIndex: i,
                error: error.message,
                message: 'Failed to process Gmail item',
                timestamp: new Date().toISOString(),
                originalSubject: item.json?.subject || 'Unknown'
            }
        });
    }
}

console.log(`📊 Completed processing ${items.length} items. Results: ${results.length}`);
console.log(`✅ Successful: ${results.filter(r => r.json.status === 'success').length}`);
console.log(`❌ Errors: ${results.filter(r => r.json.status === 'error').length}`);

// IMPORTANT: Return the results array for N8N to use
return results;