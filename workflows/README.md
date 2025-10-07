# 🚀 N8N Workflow Setup for DOC.X Intelligent

## 📋 Overview
This workflow automatically processes KMRL emails and routes them to appropriate departments using the DOC.X Intelligent backend.

## 🔧 Prerequisites

### 1. Backend Running
Make sure your DOC.X backend is running:
```powershell
cd "C:\Doc.X Intelligent\backend"
py app_simple.py
```
Backend should be accessible at `http://localhost:5000`

### 2. N8N Installation
If you don't have N8N installed:
```powershell
npm install -g n8n
```

### 3. Gmail OAuth Setup
You need the `client_secret.json` file (already configured) for Gmail access.

## 📥 Import Workflow

### Step 1: Start N8N
```powershell
n8n start
```
N8N will open at `http://localhost:5678`

### Step 2: Import Workflow
1. Go to N8N interface (localhost:5678)
2. Click **"+ New workflow"**
3. Click the **"..."** menu → **"Import from file"**
4. Select: `C:\Doc.X Intelligent\workflows\kmrl-email-processor.json`

### Step 3: Configure Gmail Node
1. Click on **"Search KMRL Emails"** node
2. Click **"Create new credential"** for Gmail
3. Upload your `client_secret.json` file
4. Complete OAuth flow

### Step 4: Activate Workflow
1. Click **"Save"** to save the workflow
2. Toggle **"Active"** switch to ON
3. The workflow will now check for emails every 2 minutes

## 🔄 Workflow Process

```
📧 Gmail Check (every 2 min)
    ↓
🔍 Search for "KMRL" emails 
    ↓
✅ Verify KMRL subject
    ↓
📖 Mark as read
    ↓
🚀 Send to DOC.X Backend
    ↓
🎯 Smart Department Routing
```

## 🎯 Department Routing

The workflow sends emails to the backend which routes them based on content:

- **🔧 Engineering**: track, maintenance, signal, infrastructure
- **💰 Finance**: budget, payment, cost, procurement, invoice
- **👥 HR**: staff, employee, training, recruitment, personnel
- **📋 Admin**: office, meeting, policy, procedure, admin
- **🛡️ Safety**: safety, accident, emergency, incident, hazard
- **⚙️ Operations**: schedule, service, passenger, operation, timetable

## 🧪 Testing

### Quick Test
Run the test script to verify backend integration:
```powershell
cd "C:\Doc.X Intelligent\workflows"
py comprehensive_test.py
```

### Manual Test
1. Send a test email to your Gmail with subject containing "KMRL"
2. Wait 2 minutes for the workflow to process
3. Check the N8N execution log
4. Verify the email was routed to the correct department

## 📊 Monitoring

### N8N Executions
- Check execution history in N8N interface
- Monitor for failed executions
- View processing logs

### Backend Logs
Monitor the Flask backend console for:
- Document processing logs
- Department routing decisions
- API call success/failure

## 🔧 Troubleshooting

### Common Issues

1. **Gmail Authentication Failed**
   - Re-upload `client_secret.json`
   - Complete OAuth flow again
   - Check Gmail API permissions

2. **Backend Connection Failed**
   - Ensure backend is running on localhost:5000
   - Check Windows Firewall settings
   - Verify Flask is binding to all interfaces

3. **No Emails Processed**
   - Check Gmail search query
   - Verify email subjects contain "KMRL"
   - Check N8N execution logs

### Debug Commands
```powershell
# Test backend health
curl http://localhost:5000/health

# Check department stats
curl http://localhost:5000/api/departments/stats

# Test document processing
py test_n8n_integration.py
```

## 🎉 Success Indicators

✅ N8N workflow shows "Active" status
✅ Gmail nodes authenticate successfully  
✅ Backend responds with 200 status codes
✅ Emails are marked as read after processing
✅ Documents appear in correct departments
✅ Bilingual content (English/Malayalam) is processed

## 📁 File Structure
```
C:\Doc.X Intelligent\workflows\
├── kmrl-email-processor.json      # Main N8N workflow
├── test_n8n_integration.py        # Single test script
├── comprehensive_test.py           # Multi-department tests
└── README.md                       # This guide
```

## 🔄 Next Steps
1. Monitor workflow for 24 hours
2. Adjust email search criteria if needed
3. Add more department keywords based on real KMRL emails
4. Consider adding attachment processing
5. Implement frontend dashboard for viewing processed documents