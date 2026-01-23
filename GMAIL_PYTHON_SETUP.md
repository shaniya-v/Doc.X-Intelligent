# Gmail Python Ingestion Service

Pure Python implementation for Gmail document ingestion, replacing n8n workflow.

## Features

✅ **Full Control**: Pure Python, no external workflow tools needed  
✅ **OAuth 2.0**: Secure Gmail authentication  
✅ **Automatic Polling**: Checks for new emails every 60 seconds  
✅ **Smart Filtering**: Only processes KMRL labeled, unread emails with attachments  
✅ **Document Detection**: Auto-detects PDF, Word, Excel, CSV, TXT files  
✅ **FastAPI Integration**: Uploads directly to backend API  
✅ **Auto Mark Read**: Marks processed emails as read  
✅ **Comprehensive Logging**: Detailed logs for monitoring  
✅ **Error Handling**: Robust error recovery  

## Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
```

### 2. Setup Gmail API

Run the setup helper:

```bash
python gmail_setup.py
```

Follow the instructions to:
- Create Google Cloud project
- Enable Gmail API
- Create OAuth 2.0 credentials
- Download credentials JSON

### 3. Configure Credentials

Save your OAuth credentials as `gmail_credentials.json` in the backend directory.

### 4. Run the Service

```bash
python gmail_ingestion.py
```

First run will open a browser for OAuth authorization. After that, the token is saved and reused.

## Configuration

Edit `gmail_ingestion.py` to customize:

```python
GMAIL_LABEL = 'KMRL'          # Gmail label to monitor
POLL_INTERVAL = 60            # Polling interval in seconds
BACKEND_URL = 'http://localhost:8000'  # FastAPI backend URL
```

## How It Works

```
┌─────────────────┐
│  Gmail Account  │
│   (KMRL Label)  │
└────────┬────────┘
         │
         │ Poll every 60s
         ▼
┌─────────────────────┐
│  Gmail Ingestion    │
│  Service (Python)   │
└─────────┬───────────┘
          │
          │ 1. Fetch unread emails
          │ 2. Download attachments
          │ 3. Filter documents
          │ 4. Upload to backend
          │ 5. Mark as read
          ▼
┌─────────────────────┐
│  FastAPI Backend    │
│  /api/documents/    │
│      upload         │
└─────────────────────┘
```

## Running as Service

### Using systemd (Linux)

Create `/etc/systemd/system/gmail-ingestion.service`:

```ini
[Unit]
Description=Gmail Document Ingestion Service
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/Doc.X-Intelligent/backend
ExecStart=/path/to/venv/bin/python gmail_ingestion.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable gmail-ingestion
sudo systemctl start gmail-ingestion
sudo systemctl status gmail-ingestion
```

View logs:

```bash
sudo journalctl -u gmail-ingestion -f
```

### Using Docker

Add to `docker-compose.yml`:

```yaml
gmail-ingestion:
  build: ./backend
  command: python gmail_ingestion.py
  volumes:
    - ./backend:/app
    - ./backend/gmail_credentials.json:/app/gmail_credentials.json
    - ./backend/gmail_token.json:/app/gmail_token.json
  environment:
    - BACKEND_URL=http://backend:8000
  depends_on:
    - backend
  restart: unless-stopped
```

### Using Screen (Simple)

```bash
screen -S gmail-ingestion
cd backend
python gmail_ingestion.py
# Ctrl+A, D to detach
```

Reattach:

```bash
screen -r gmail-ingestion
```

## Logging

The service logs all activities:

```
2026-01-23 14:30:00 - INFO - 🚀 Starting Gmail ingestion service
2026-01-23 14:30:00 - INFO - Polling every 60 seconds
2026-01-23 14:30:01 - INFO - ✅ Gmail authentication successful
2026-01-23 14:30:02 - INFO - 🔄 Polling at 2026-01-23 14:30:02
2026-01-23 14:30:03 - INFO - 📬 Found 2 unread KMRL emails
2026-01-23 14:30:04 - INFO - 📧 Processing email: 19be9f8db61a01f4
2026-01-23 14:30:04 - INFO - From: sender@example.com
2026-01-23 14:30:04 - INFO - Subject: KMRL Revenue Report
2026-01-23 14:30:05 - INFO - 📎 Found document: report.pdf (245.3 KB)
2026-01-23 14:30:06 - INFO - ✅ Uploaded: report.pdf
2026-01-23 14:30:06 - INFO -    Document ID: doc_123456
2026-01-23 14:30:06 - INFO -    Department: Finance
2026-01-23 14:30:07 - INFO - ✅ Marked email as read
2026-01-23 14:30:07 - INFO - ✅ Completed: 1/1 documents uploaded
```

## Advantages Over n8n

| Feature | n8n | Python Service |
|---------|-----|----------------|
| Dependencies | Node.js, Docker, n8n | Just Python packages |
| Control | Visual workflow | Full code control |
| Debugging | Limited console logs | Comprehensive logging |
| Customization | Node configuration | Direct code editing |
| Integration | HTTP requests | Native Python |
| Performance | Extra overhead | Direct execution |
| Maintenance | Workflow JSON | Python code |
| Error Handling | Basic | Advanced + retry logic |

## Troubleshooting

### Authentication Failed

- Verify `gmail_credentials.json` exists and is valid
- Check OAuth consent screen is configured
- Ensure test users are added in Google Cloud Console

### No Emails Found

- Verify KMRL label exists in Gmail
- Check emails have attachments
- Confirm emails are unread

### Upload Failed

- Verify FastAPI backend is running
- Check `BACKEND_URL` is correct
- Test backend endpoint: `curl http://localhost:8000/docs`

### Token Expired

Delete `gmail_token.json` and re-authenticate:

```bash
rm gmail_token.json
python gmail_ingestion.py
```

## API Compatibility

The service uploads documents to the same FastAPI endpoint as n8n:

```
POST /api/documents/upload
Content-Type: multipart/form-data

Parameters:
- file: Binary file data
- email_from: Sender email
- email_subject: Email subject
- source: "gmail_python"
```

No changes needed to your backend API!

## Security

- ✅ OAuth 2.0 authentication
- ✅ Credentials stored locally
- ✅ Token auto-refresh
- ✅ Never exposes passwords
- ⚠️ Keep `gmail_credentials.json` and `gmail_token.json` secure
- ⚠️ Add both to `.gitignore`

## Performance

- Processes ~10 emails per cycle
- ~1-2 seconds per email
- ~2-5 seconds per attachment download
- ~1-3 seconds per backend upload
- Total: ~5-10 seconds per document

## Next Steps

1. Run `python gmail_setup.py` to see detailed setup instructions
2. Configure Gmail API credentials
3. Test with: `python gmail_ingestion.py`
4. Deploy as systemd service for production
5. Monitor logs for any issues

## Support

For issues:
1. Check logs for error messages
2. Verify Gmail API is enabled
3. Confirm backend is accessible
4. Test OAuth credentials
5. Review Gmail label and filter settings
