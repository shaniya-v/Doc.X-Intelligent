# 🚀 DOC.X Intelligent - Multi-Platform N8N Setup Guide

## 📋 Overview
This guide helps you set up the comprehensive N8N workflow that processes documents from multiple platforms:
- **📧 Gmail** - Email processing with attachments
- **📁 SharePoint** - Document library integration  
- **🔧 Maximo** - Asset management exports
- **📱 WhatsApp** - Document messages and PDFs
- **☁️ Cloud Links** - Ad-hoc file sharing links
- **📄 Scanned Documents** - Hard-copy processing

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Multi-Source  │    │   N8N Workflow  │    │ DOC.X Backend   │
│   Documents     │───▶│   Processing    │───▶│ Smart Routing   │
│                 │    │                 │    │                 │
│ • Gmail         │    │ • Download      │    │ • Language      │
│ • SharePoint    │    │ • Extract       │    │   Detection     │
│ • Maximo        │    │ • Transform     │    │ • Department    │
│ • WhatsApp      │    │ • Route         │    │   Routing       │
│ • Cloud Links   │    │                 │    │ • Priority      │
│ • Scans         │    │                 │    │   Assessment    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### 1. Enhanced Backend
Start the enhanced backend that handles all platforms:
```powershell
cd "C:\Doc.X Intelligent\backend"
py app_enhanced.py
```
✅ Backend should show "Multi-Platform Backend Starting..."

### 2. Platform Credentials
You'll need access credentials for:
- **Gmail**: OAuth2 (client_secret.json already configured)
- **SharePoint**: Microsoft 365 OAuth
- **Maximo**: API credentials (username/password or API key)
- **WhatsApp**: Business API access token
- **Cloud Services**: API keys for Google Drive, OneDrive, etc.

### 3. N8N Installation
```powershell
npm install -g n8n
```

## 📥 Workflow Setup

### Step 1: Test Backend Integration
Run the platform test to ensure all systems work:
```powershell
cd "C:\Doc.X Intelligent\workflows"
py platform_test.py
```
Expected output: ✅ All 6 platforms should pass

### Step 2: Import N8N Workflow
1. Start N8N: `n8n start`
2. Open N8N interface: http://localhost:5678
3. Create new workflow
4. Import file: `multi-platform-document-processor.json`

### Step 3: Configure Platform Credentials

#### 📧 Gmail Configuration
1. Click "📧 Gmail Scanner" node
2. Select "Create new credential"
3. Upload your `client_secret.json`
4. Complete OAuth flow
5. Test connection

#### 📁 SharePoint Configuration  
1. Click "📁 SharePoint Scanner" node
2. Create Microsoft OAuth2 credential
3. Configure:
   - **Client ID**: Your Azure app registration
   - **Client Secret**: From Azure app
   - **Scope**: `https://graph.microsoft.com/.default`
4. Authorize access to SharePoint

#### 🔧 Maximo Configuration
1. Click "🔧 Maximo Scanner" node  
2. Create HTTP Basic Auth credential
3. Configure:
   - **Username**: Your Maximo username
   - **Password**: Your Maximo password
   - **Base URL**: Your Maximo server URL

#### 📱 WhatsApp Configuration
1. Click "📱 WhatsApp Scanner" node
2. Create HTTP Header Auth credential  
3. Configure:
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer YOUR_WHATSAPP_TOKEN`
   - **API URL**: Your WhatsApp Business API endpoint

### Step 4: Customize Platform URLs
Update these parameters in the workflow nodes:

```json
{
  "sharePointSiteUrl": "https://your-org.sharepoint.com/sites/kmrl",
  "maximoApiUrl": "https://your-maximo-server.com/maximo",
  "whatsappApiUrl": "https://your-whatsapp-api.com"
}
```

### Step 5: Activate Workflow
1. Save the workflow
2. Toggle "Active" switch to ON
3. The workflow will scan all platforms every 3 minutes

## 🎯 Document Flow

### Processing Pipeline
```
📥 Platform Scan (every 3 minutes)
    ↓
🔍 Document Detection
    ↓
📥 Download Binary Files
    ↓
🔄 Extract Content & Metadata
    ↓
🚀 Send to DOC.X Backend
    ↓
🧠 Language Detection (English/Malayalam/Mixed)
    ↓
🎯 Smart Department Routing
    ↓
📝 Log Results & Store
```

### Department Routing Logic
- **🔧 Engineering**: track, maintenance, signal, infrastructure, അറ്റകുറ്റപ്പണി
- **💰 Finance**: budget, payment, procurement, ബജറ്റ്, പണം
- **👥 HR**: staff, training, personnel, ജീവനക്കാർ, പരിശീലനം  
- **📋 Admin**: office, policy, circular, ഓഫീസ്, സർക്കുലർ
- **🛡️ Safety**: safety, accident, emergency, സുരക്ഷ, അപകടം
- **⚙️ Operations**: schedule, service, timetable, ഷെഡ്യൂൾ, സേവനം

## 📊 Monitoring & Testing

### Real-time Monitoring
1. **N8N Executions**: Monitor workflow runs in N8N interface
2. **Backend Logs**: Watch console output for processing details
3. **API Endpoints**: Check stats via REST API

### Test Commands
```powershell
# Test all platforms
py platform_test.py

# Check backend health
curl http://localhost:5000/health

# Get processing statistics  
curl http://localhost:5000/api/departments/stats

# View all processed documents
curl http://localhost:5000/api/documents
```

### Success Indicators
✅ N8N workflow shows "Active" status  
✅ All platform nodes authenticate successfully  
✅ Documents download without errors  
✅ Backend returns 200 status codes  
✅ Smart routing assigns correct departments  
✅ Bilingual content processed properly

## 🔧 Troubleshooting

### Common Issues

#### 1. Gmail Authentication Failed
```
❌ Error: Gmail OAuth token expired
🔧 Solution: Re-authenticate Gmail node in N8N
```

#### 2. SharePoint Access Denied  
```
❌ Error: Insufficient permissions for SharePoint
🔧 Solution: Check Azure app permissions for SharePoint sites
```

#### 3. Maximo Connection Timeout
```
❌ Error: Maximo API not responding
🔧 Solution: Verify Maximo server URL and credentials
```

#### 4. WhatsApp API Rate Limit
```
❌ Error: WhatsApp API rate limit exceeded
🔧 Solution: Increase workflow interval or upgrade API plan
```

#### 5. Backend Processing Errors
```
❌ Error: Document processing failed
🔧 Solution: Check backend logs and restart app_enhanced.py
```

### Debug Commands
```powershell
# Check N8N logs
n8n start --log-level debug

# Test specific platform
curl -X POST http://localhost:5000/webhook/document \
  -H "Content-Type: application/json" \
  -d @test_document.json

# Monitor backend in real-time
py app_enhanced.py
```

## 📈 Performance Optimization

### Workflow Tuning
- **Scan Interval**: Adjust from 3 minutes based on volume
- **Batch Size**: Limit documents per scan (default: 10)
- **Timeout Settings**: Increase for large file downloads
- **Error Handling**: Add retry logic for failed downloads

### Backend Scaling
- **Memory**: Monitor document storage (currently in-memory)
- **Processing**: Consider async processing for large files
- **Database**: Upgrade to persistent storage (Supabase/PostgreSQL)

## 🚀 Advanced Features

### Custom Platform Integration
Add new platforms by:
1. Creating new scanner node in N8N
2. Adding processor code for data extraction
3. Updating backend routing logic
4. Adding platform-specific keywords

### Enhanced Document Processing
Future improvements:
- **OCR Integration**: For scanned documents
- **File Format Support**: PDF, Word, Excel parsing
- **Image Analysis**: Photo and signature detection
- **Attachment Extraction**: ZIP, email attachments
- **Real-time Alerts**: Urgent document notifications

## 📁 File Structure
```
C:\Doc.X Intelligent\workflows\
├── multi-platform-document-processor.json  # Main N8N workflow
├── app_enhanced.py                          # Enhanced backend
├── platform_test.py                        # Comprehensive test suite
├── README_MultiPlatform.md                  # This guide
└── test_results\                            # Test output logs
```

## 🎉 Success Checklist

Before going live:
- [ ] ✅ All 6 platforms authenticate successfully
- [ ] ✅ Test documents process correctly
- [ ] ✅ Department routing works for all languages
- [ ] ✅ File downloads complete without errors
- [ ] ✅ Backend stores documents properly
- [ ] ✅ Monitoring and logging active
- [ ] ✅ Error handling tested
- [ ] ✅ Performance acceptable for expected volume

## 📞 Support

For issues or questions:
1. Check this README for troubleshooting steps
2. Review N8N execution logs
3. Examine backend console output
4. Test individual platforms with platform_test.py
5. Verify all credentials and API endpoints

---

🎯 **Ready to process KMRL documents from all platforms!** 🎯