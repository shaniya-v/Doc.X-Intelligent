# Testing Doc.X Intelligent - Complete Guide

## 🎯 End-to-End Testing

Test the complete flow: Gmail → Python Service → Backend API → MinIO Storage → Database

---

## ✅ Pre-requisites Check

### 1. Check Backend is Running

```bash
curl http://localhost:8000/docs
# Should return Swagger UI
```

Or check terminal with FastAPI:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Check Gmail Service is Running

```bash
# Check if process is running
ps aux | grep gmail_ingestion.py
```

Or check the terminal logs for:
```
✅ Gmail authentication successful
🔄 Polling at...
```

### 3. Check MinIO is Accessible

```bash
curl http://localhost:9000
# Should return MinIO response
```

Or visit: http://localhost:9001 (MinIO Console)
- Username: `minioadmin`
- Password: `minioadmin`

---

## 🧪 Test Scenario 1: Send Test Email

### Step 1: Prepare Test Document

Use the existing test file:
```bash
ls -lh "test documents/KMRL_Finance_Report_Sep2025.csv"
```

### Step 2: Send Email to Yourself

**Using Gmail Web:**

1. Go to: https://mail.google.com
2. Compose new email
3. **To:** shaniya10052006@gmail.com
4. **Subject:** Test KMRL Revenue Report - January 2026
5. **Body:** 
   ```
   Dear Sir/Madam,
   
   Please find attached the revenue report for testing purposes.
   
   Regards,
   KMRL Finance Team
   ```
6. **Attach:** KMRL_Finance_Report_Sep2025.csv
7. Click **Send**

### Step 3: Add KMRL Label

1. Open the email you just sent (in your inbox)
2. Click the label icon (tag icon at top)
3. Create new label: **KMRL** (if doesn't exist)
4. Apply the label
5. **Important:** Mark the email as **UNREAD** (click on email, press Shift+U)

---

## 👀 Watch the Service Work

### Terminal Output

In the terminal running `gmail_ingestion.py`, you should see:

```
🔄 Polling at 2026-01-23 19:15:00
📬 Found 1 unread KMRL emails
============================================================
📧 Processing email: 19c1a2b3c4d5e6f7
From: shaniya10052006@gmail.com
Subject: Test KMRL Revenue Report - January 2026

📎 Found document: KMRL_Finance_Report_Sep2025.csv (1.2 KB)
📥 Downloading attachment...
✅ Downloaded: 1.2 KB

📤 Uploading to backend...
✅ Uploaded: KMRL_Finance_Report_Sep2025.csv
   Document ID: doc_abc123xyz
   Department: Finance

✉️  Marking email as read...
✅ Email marked as read

✅ Completed: 1/1 documents uploaded
```

---

## 🔍 Verify Storage in MinIO

### Option 1: MinIO Web Console

1. Open: http://localhost:9001
2. Login with: `minioadmin` / `minioadmin`
3. Click on **Buckets** → **documents**
4. Navigate through folders: `2026/01/`
5. You should see: `doc_abc123xyz.csv`
6. Click on the file to view details
7. Click **Download** to verify it's the correct file

### Option 2: MinIO CLI (mc)

```bash
# Install mc (if not installed)
docker run --rm -it --entrypoint=/bin/sh minio/mc

# Configure
mc alias set local http://localhost:9000 minioadmin minioadmin

# List buckets
mc ls local

# List documents
mc ls local/documents/

# List by date
mc ls local/documents/2026/01/

# Download a file
mc cp local/documents/2026/01/doc_abc123xyz.csv ./downloaded_test.csv

# Verify
cat downloaded_test.csv
```

### Option 3: Python Script

```python
# test_minio.py
from minio import Minio

client = Minio(
    "localhost:9000",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)

# List all objects
objects = client.list_objects("documents", recursive=True)
print("📦 Files in MinIO:")
for obj in objects:
    print(f"  - {obj.object_name} ({obj.size} bytes)")
```

Run:
```bash
python test_minio.py
```

---

## 💾 Verify Database Entry

### Option 1: Check via Backend API

```bash
# Get all documents
curl http://localhost:8000/api/documents/ | jq

# Get specific document
curl http://localhost:8000/api/documents/doc_abc123xyz | jq

# Search documents
curl "http://localhost:8000/api/documents/search?query=revenue" | jq
```

### Option 2: Check Supabase

1. Go to your Supabase project: https://supabase.com
2. Navigate to **Table Editor**
3. Select **documents** table
4. Look for your document entry

You should see:
- `id`: doc_abc123xyz
- `filename`: KMRL_Finance_Report_Sep2025.csv
- `department`: Finance
- `minio_path`: documents/2026/01/doc_abc123xyz.csv
- `source`: gmail_python
- `status`: classified
- `email_from`: shaniya10052006@gmail.com
- `email_subject`: Test KMRL Revenue Report...

### Option 3: SQL Query

In Supabase SQL Editor:

```sql
-- Get recent documents
SELECT 
  id,
  filename,
  department,
  source,
  email_from,
  email_subject,
  created_at,
  minio_path
FROM documents 
WHERE source = 'gmail_python'
ORDER BY created_at DESC 
LIMIT 10;

-- Check document metadata
SELECT * FROM document_metadata 
WHERE document_id = 'doc_abc123xyz';
```

---

## 🎬 Complete Test Flow

### Test 1: Single Document Email

```bash
# 1. Send email with 1 CSV attachment
# 2. Add KMRL label
# 3. Mark as unread
# 4. Wait 60 seconds (or check logs immediately)
# 5. Verify in MinIO
# 6. Verify in database
```

### Test 2: Multiple Documents Email

```bash
# Send email with multiple attachments:
# - Report.pdf
# - Data.xlsx
# - Notes.txt
# - logo.png (should be skipped)
```

Expected result:
- 3 documents uploaded (PDF, Excel, TXT)
- 1 skipped (PNG image)

### Test 3: Different Departments

Send emails with different subjects:
- **Finance:** "Budget Report 2026"
- **HR:** "Employee Attendance Sheet"
- **Operations:** "Daily Operations Log"
- **Engineering:** "Technical Specifications"

Check if classifier assigns correct departments.

---

## 📊 Monitor Service Health

### Check Gmail Service Logs

```bash
# If running in terminal, watch the output
# If running as background service:
tail -f gmail_service.log

# Check for errors
grep "ERROR" gmail_service.log
grep "❌" gmail_service.log
```

### Check Backend Logs

```bash
# FastAPI logs show in the terminal
# Look for:
# - POST /api/documents/upload
# - Status codes (200 = success)
```

### Check Resource Usage

```bash
# Memory usage
ps aux | grep python | grep gmail_ingestion

# Network activity
netstat -an | grep 8000  # Backend
netstat -an | grep 9000  # MinIO
```

---

## 🐛 Troubleshooting Tests

### Email Not Being Processed

**Check:**
1. Email has KMRL label? ✓
2. Email is unread? ✓
3. Email has attachment? ✓
4. Gmail service is running? ✓

```bash
# Re-mark email as unread
# In Gmail, select email and press Shift+U

# Force immediate poll
# Restart the gmail service
```

### Document Not in MinIO

**Check:**
1. Backend logs for upload errors
2. MinIO is running: `docker ps | grep minio`
3. Bucket exists: Check MinIO console

```bash
# Create bucket if missing
mc mb local/documents
```

### Document Not in Database

**Check:**
1. Supabase credentials in .env
2. Database connection: `curl http://localhost:8000/health`
3. Table exists in Supabase

---

## ✨ Expected Results Summary

| Step | Expected Result |
|------|----------------|
| Send email with KMRL label | Email appears in Gmail |
| Mark as unread | Email shows as unread |
| Wait 60 seconds | Service detects email |
| Service processes | Logs show download + upload |
| MinIO check | File exists in bucket |
| Database check | Record exists in table |
| Email status | Marked as read automatically |
| Classifier | Department assigned correctly |

---

## 🎯 Quick Verification Commands

```bash
# 1. Check service is running
ps aux | grep gmail_ingestion

# 2. Check latest documents in MinIO
mc ls local/documents/2026/01/ --recursive

# 3. Check database via API
curl http://localhost:8000/api/documents/ | jq '.[] | {id, filename, department}'

# 4. Check email was marked as read
# (Go to Gmail - email should not be in unread anymore)
```

---

## 📸 Test Screenshots

Take screenshots of:
1. ✅ Gmail email with KMRL label (unread)
2. ✅ Terminal showing service processing
3. ✅ MinIO console showing uploaded file
4. ✅ Supabase table showing document entry
5. ✅ Gmail email now marked as read

---

## 🔄 Continuous Testing

Set up a cron job or scheduled task to:
1. Send test email every hour
2. Verify it gets processed
3. Alert if processing fails

This ensures the service is always working!

---

## 💡 Pro Tips

1. **Keep service logs**: Redirect to file for history
   ```bash
   python gmail_ingestion.py > gmail_service.log 2>&1 &
   ```

2. **Monitor MinIO storage**: Check disk space regularly
   ```bash
   du -sh /path/to/minio/data
   ```

3. **Test different file types**: PDF, DOCX, XLSX, CSV, TXT

4. **Test large files**: Upload 10MB+ documents

5. **Test concurrent emails**: Send multiple at once

6. **Test error recovery**: Simulate backend downtime

---

## ✅ Success Criteria

Your system is working correctly when:

- ✅ Service polls every 60 seconds
- ✅ Detects KMRL unread emails immediately
- ✅ Downloads all document attachments
- ✅ Uploads to MinIO successfully
- ✅ Saves metadata to database
- ✅ Classifies department correctly
- ✅ Marks email as read
- ✅ Handles errors gracefully
- ✅ Logs all activities clearly

---

## 🚀 Next Steps After Testing

Once tests pass:
1. Deploy as systemd service
2. Set up monitoring/alerting
3. Configure backup for MinIO
4. Set up log rotation
5. Document any customizations

---

Need help? Check logs first, they're very detailed! 🔍
