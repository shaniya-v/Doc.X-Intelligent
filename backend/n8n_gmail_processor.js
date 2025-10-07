// Enhanced Gmail attachment processor for N8N Gmail node output
// This code processes Gmail node output and sends documents to DOC.X Intelligent

const items = $input.all();
const results = [];

// Helper function to safely extract string from Gmail API response
function safeString(value) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        // Handle Gmail node address objects
        if (Array.isArray(value) && value.length > 0) {
            return value.map(item => {
                if (typeof item === 'string') return item;
                if (item.name) return `${item.name} <${item.address}>`;
                return item.address || item.emailAddress || '';
            }).join(', ');
        }
        if (value.name && value.address) return `${value.name} <${value.address}>`;
        if (value.address) return value.address;
        if (value.emailAddress) return value.emailAddress;
    }
    return value ? value.toString() : '';
}

for (const item of items) {
    try {
        console.log('Processing Gmail item:', Object.keys(item.json));
        
        // Extract email content
        const emailData = {
            source: "n8n",
            content: item.json.body || item.json.textPlain || item.json.snippet || "",
            subject: item.json.subject || "No Subject",
            from: safeString(item.json.from),
            timestamp: item.json.internalDate || item.json.date || new Date().toISOString(),
            messageId: item.json.id || item.json.messageId || `gmail_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            threadId: item.json.threadId || "",
            labels: item.json.labelIds || [],
            hasAttachments: false,
            attachmentCount: 0,
            metadata: {
                to: safeString(item.json.to),
                cc: safeString(item.json.cc),
                bcc: safeString(item.json.bcc),
                deliveredTo: safeString(item.json.deliveredTo),
                receivedDate: item.json.internalDate
            }
        };

        // Process attachments if available
        if (item.binary && Object.keys(item.binary).length > 0) {
            console.log('Found binary attachments:', Object.keys(item.binary));
            emailData.hasAttachments = true;
            emailData.attachmentCount = Object.keys(item.binary).length;
            
            // Create binary section for our backend
            emailData.binary = {};
            emailData.hasBinary = true;
            
            for (const [key, attachment] of Object.entries(item.binary)) {
                if (attachment && attachment.data) {
                    emailData.binary[key] = {
                        data: attachment.data,
                        fileName: attachment.fileName || attachment.filename || `attachment_${key}`,
                        mimeType: attachment.mimeType || attachment.contentType || 'application/octet-stream',
                        fileSize: attachment.fileSize || 0
                    };
                    
                    console.log(`Processed attachment: ${emailData.binary[key].fileName} (${emailData.binary[key].mimeType})`);
                }
            }
        }

        // Send to DOC.X Intelligent backend
        const backendUrl = 'http://127.0.0.1:5000/webhook/document?source=n8n';
        
        console.log('Sending to backend:', backendUrl);
        console.log('Email data summary:', {
            subject: emailData.subject,
            from: emailData.from,
            hasAttachments: emailData.hasAttachments,
            attachmentCount: emailData.attachmentCount,
            contentLength: emailData.content.length
        });

        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-Source': 'gmail-workflow',
                'User-Agent': 'n8n-gmail-processor'
            },
            body: JSON.stringify(emailData)
        });

        const responseData = await response.json();
        
        if (response.ok) {
            console.log('✅ Document processed successfully:', responseData.document?.id);
            
            results.push({
                json: {
                    status: 'success',
                    messageId: emailData.messageId,
                    subject: emailData.subject,
                    from: emailData.from,
                    documentId: responseData.document?.id,
                    assignedDepartment: responseData.document?.assigned_department,
                    priority: responseData.document?.priority,
                    confidence: responseData.document?.confidence,
                    multiDepartment: responseData.document?.multi_department || false,
                    departments: responseData.document?.departments_detected || [],
                    processingTime: responseData.processing_time,
                    message: responseData.message,
                    hasAttachments: emailData.hasAttachments,
                    attachmentCount: emailData.attachmentCount,
                    analysisMethod: responseData.document?.analysis_method || 'Standard',
                    timestamp: new Date().toISOString(),
                    backendResponse: responseData
                }
            });
        } else {
            console.error('❌ Backend error:', response.status, responseData);
            
            results.push({
                json: {
                    status: 'error',
                    messageId: emailData.messageId,
                    subject: emailData.subject,
                    error: responseData.error || `HTTP ${response.status}`,
                    message: responseData.message || 'Failed to process document',
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error('❌ Processing error:', error);
        
        results.push({
            json: {
                status: 'error',
                error: error.message,
                message: 'Failed to process Gmail item',
                timestamp: new Date().toISOString(),
                originalItem: item.json
            }
        });
    }
}

console.log(`📊 Processed ${results.length} Gmail items`);
return results;