# Gmail Ingestion - Updated to Keyword-Based Search

## 🎯 Changes Made

### 1. **Keyword Search Instead of Labels**
- **Old:** Required emails to have "KMRL" label
- **New:** Searches for "KMRL" keyword in subject or body
- No need to manually add labels anymore!

### 2. **Email Body Processing**
- Extracts full email body content
- Generates embeddings from email text
- Stores embeddings in vector database
- Classifies department based on email content

### 3. **Combined Document + Email Analysis**
- When attachments exist: combines email body + document content
- Creates unified embeddings for better classification
- Routes to appropriate department using combined context

### 4. **Email-Only Processing**
- Even emails without attachments are processed
- Email content is analyzed and stored
- Summary generated and routed to department

## 📊 New Flow

```
1. 📧 Search Gmail for "KMRL" keyword (unread only)
   ↓
2. 📝 Extract email body content
   ↓
3. 🧠 Generate embeddings from email body
   ↓
4. 💾 Store in vector database
   ↓
5. 🎯 Classify department using RAG
   ↓
6. 📎 If has attachments:
   ├─ Download attachment
   ├─ Parse document content
   ├─ Combine email + document context
   ├─ Generate unified embedding
   ├─ Store in MinIO
   └─ Route to department with full context
   ↓
7. ✅ Mark email as read
```

## 🚀 How to Test

### 1. Send Test Email

Send email to yourself with:
- **Subject:** "KMRL Budget Report January 2026"
- **Body:** 
  ```
  Dear Team,
  
  Please find attached the monthly budget report for KMRL operations.
  This includes revenue, expenses, and projections for Q1 2026.
  
  Regards,
  Finance Department
  ```
- **Attach:** Any PDF/Excel/CSV file

### 2. Keep Email Unread

- Don't read the email (keep it unread)
- No need to add any labels!

### 3. Wait for Service

Within 60 seconds, the service will:
- ✅ Detect email (searches for "KMRL" keyword)
- ✅ Extract email body
- ✅ Process email content → embeddings → classify department
- ✅ Download attachment
- ✅ Parse document
- ✅ Combine email + document context
- ✅ Route to correct department
- ✅ Mark as read

### 4. Verify Results

Check logs for:
```
📧 Processing email content...
✅ Email content processed
   Summary: Monthly budget report including revenue...
   Department: Finance

📎 Found 1 document(s)
  Processing: budget_report.pdf
✅ Uploaded: budget_report.pdf
   Document ID: doc_xyz123
   Department: Finance
```

## 🔍 Debug Command

```bash
cd /home/shaniya/Projects/Doc.X-Intelligent/backend
/home/shaniya/Projects/Doc.X-Intelligent/venv/bin/python3 debug_gmail.py
```

This will show:
- Emails containing "KMRL" keyword
- Which are unread
- Which have attachments

## ⚡ Advantages

| Feature | Old (Label-based) | New (Keyword-based) |
|---------|------------------|---------------------|
| Setup | Manual label creation | No setup needed |
| Email tagging | Must add KMRL label | Automatic detection |
| Email body | Ignored | Processed & analyzed |
| Department routing | Document only | Email + Document context |
| Email-only messages | Skipped | Processed |
| Vector search | Document only | Email + Document |

## 📝 Backend Endpoints

### New: Email Processing
```
POST /api/emails/process
{
  "email_body": "...",
  "email_from": "...",
  "email_subject": "...",
  "message_id": "..."
}
```

### Updated: Document Upload
```
POST /api/documents/upload
- file: binary
- email_from: optional
- email_subject: optional  
- email_body: optional (NEW!)
- source: gmail_python
```

## 🎯 Current Status

**Service is ready to run!**

```bash
cd /home/shaniya/Projects/Doc.X-Intelligent/backend
/home/shaniya/Projects/Doc.X-Intelligent/venv/bin/python gmail_ingestion.py
```

It will:
1. Search for unread emails with "KMRL" keyword
2. Process email bodies
3. Download attachments (if any)
4. Combine contexts for better classification
5. Route everything to appropriate departments

No labels needed! 🎉
