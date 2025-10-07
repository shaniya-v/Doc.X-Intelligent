// Simple CSV/File processor for N8N
// Processes files and sends them to DOC.X Intelligent backend

const items = $input.all();
const results = [];

console.log(`Processing ${items.length} items from N8N`);

for (let i = 0; i < items.length; i++) {
    const item = items[i];
    
    try {
        console.log(`Item ${i + 1}:`, Object.keys(item));
        
        // Prepare document data
        const documentData = {
            source: "n8n",
            content: "",
            subject: "Document Processing",
            from: "n8n-workflow@system",
            timestamp: new Date().toISOString(),
            messageId: `n8n_${Date.now()}_${i}`,
            hasBinary: false,
            metadata: {
                itemIndex: i,
                nodeType: "file-processor"
            }
        };

        // Check for binary data (files)
        if (item.binary && Object.keys(item.binary).length > 0) {
            console.log('Found binary data:', Object.keys(item.binary));
            
            documentData.hasBinary = true;
            documentData.binary = {};
            
            // Process each binary attachment
            for (const [key, binaryData] of Object.entries(item.binary)) {
                if (binaryData && binaryData.data) {
                    documentData.binary[key] = {
                        data: binaryData.data,
                        fileName: binaryData.fileName || binaryData.filename || `file_${key}`,
                        mimeType: binaryData.mimeType || 'application/octet-stream',
                        fileSize: binaryData.fileSize || 0
                    };
                    
                    console.log(`Added file: ${documentData.binary[key].fileName}`);
                }
            }
        }

        // If no binary data, check JSON content
        if (!documentData.hasBinary && item.json) {
            // Convert JSON to text content
            if (typeof item.json === 'string') {
                documentData.content = item.json;
            } else {
                documentData.content = JSON.stringify(item.json, null, 2);
            }
            
            // Extract filename if available
            if (item.json.fileName || item.json.filename) {
                documentData.subject = `File: ${item.json.fileName || item.json.filename}`;
            }
        }

        // Send to backend
        const backendUrl = 'http://127.0.0.1:5000/webhook/document?source=n8n';
        
        console.log(`Sending to backend: ${documentData.subject}`);
        
        const response = await fetch(backendUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-N8N-Source': 'file-workflow',
                'User-Agent': 'n8n-file-processor'
            },
            body: JSON.stringify(documentData)
        });

        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Success:', result.document?.id);
            
            results.push({
                json: {
                    status: 'success',
                    documentId: result.document?.id,
                    department: result.document?.assigned_department,
                    confidence: result.document?.confidence,
                    message: result.message,
                    timestamp: new Date().toISOString()
                }
            });
        } else {
            console.error('❌ Error:', result.error);
            
            results.push({
                json: {
                    status: 'error',
                    error: result.error,
                    timestamp: new Date().toISOString()
                }
            });
        }

    } catch (error) {
        console.error('❌ Processing failed:', error.message);
        
        results.push({
            json: {
                status: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            }
        });
    }
}

console.log(`📊 Completed processing. Results: ${results.length}`);
return results;