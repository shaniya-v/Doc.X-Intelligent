# Gmail OAuth Setup - Step by Step

## ⚠️ Error: "OAuth client was not found - 401: invalid_client"

This error means you need to create **real OAuth credentials** from Google Cloud Console.

## 📋 Complete Setup Guide

### Step 1: Go to Google Cloud Console

Open: https://console.cloud.google.com/

### Step 2: Create/Select Project

1. Click on the project dropdown (top left, next to "Google Cloud")
2. Click "NEW PROJECT"
3. Enter project name: `Doc-X-Intelligent` or similar
4. Click "CREATE"
5. Wait for project creation (takes ~30 seconds)
6. Select your new project from the dropdown

### Step 3: Enable Gmail API

1. In the search bar at top, type: `Gmail API`
2. Click on "Gmail API" from results
3. Click the blue "ENABLE" button
4. Wait for it to enable (~10 seconds)

### Step 4: Configure OAuth Consent Screen

1. Go to: **APIs & Services** > **OAuth consent screen** (left sidebar)
2. Select **External** user type
3. Click "CREATE"

**Fill in the form:**

```
App name: Doc.X Intelligent
User support email: shaniya10052006@gmail.com
Developer contact: shaniya10052006@gmail.com
```

4. Click "SAVE AND CONTINUE"

**Scopes page:**
- Click "ADD OR REMOVE SCOPES"
- Search for: `gmail.readonly`
- Check: `https://www.googleapis.com/auth/gmail.readonly`
- Search for: `gmail.modify`  
- Check: `https://www.googleapis.com/auth/gmail.modify`
- Click "UPDATE"
- Click "SAVE AND CONTINUE"

**Test users page:**
- Click "ADD USERS"
- Enter: `shaniya10052006@gmail.com`
- Click "ADD"
- Click "SAVE AND CONTINUE"

**Summary page:**
- Click "BACK TO DASHBOARD"

### Step 5: Create OAuth 2.0 Credentials

1. Go to: **APIs & Services** > **Credentials** (left sidebar)
2. Click "➕ CREATE CREDENTIALS" at top
3. Select "OAuth client ID"

**Configure:**
```
Application type: Desktop app
Name: Gmail Ingestion Service
```

4. Click "CREATE"

### Step 6: Download Credentials

1. A popup appears with your credentials
2. Click "DOWNLOAD JSON" button
3. Save the file

### Step 7: Replace Template

```bash
cd /home/shaniya/Projects/Doc.X-Intelligent/backend

# Backup template
mv gmail_credentials.json gmail_credentials.json.template

# Copy your downloaded file
cp ~/Downloads/client_secret_*.json gmail_credentials.json
```

**OR** manually copy the contents of your downloaded JSON file into `gmail_credentials.json`

### Step 8: Run the Service

```bash
python gmail_ingestion.py
```

**What happens:**
1. Browser opens automatically
2. Select your Google account: `shaniya10052006@gmail.com`
3. Click "Continue" on warning screen (it's your own app)
4. Review permissions
5. Click "Allow"
6. Browser shows: "The authentication flow has completed"
7. Close browser
8. Service starts polling Gmail!

### Step 9: Verify It's Working

Check the terminal output:
```
✅ Gmail authentication successful
🔄 Polling at 2026-01-23 14:30:00
📬 Found X unread KMRL emails
```

---

## 🎯 Quick Reference - Direct Links

1. **Enable Gmail API**: https://console.cloud.google.com/apis/library/gmail.googleapis.com
2. **OAuth Consent**: https://console.cloud.google.com/apis/credentials/consent
3. **Create Credentials**: https://console.cloud.google.com/apis/credentials

---

## 🔍 Troubleshooting

### "OAuth client not found"
- You're using template credentials
- Follow steps 1-7 above to get real credentials

### "Access blocked: This app isn't verified"
- Click "Advanced" (bottom left)
- Click "Go to Doc.X Intelligent (unsafe)"
- This is normal for development apps

### "Error 403: access_denied"
- Add yourself as test user in OAuth consent screen
- Make sure email matches: `shaniya10052006@gmail.com`

### Browser doesn't open
- Check firewall/port 8080
- Try manual auth: copy the URL from terminal and paste in browser

### Token expired
```bash
rm gmail_token.json
python gmail_ingestion.py
```

---

## 📸 Screenshots Reference

Your OAuth consent screen should look like:

```
App Information
├── App name: Doc.X Intelligent  
├── User support email: shaniya10052006@gmail.com
└── Developer contact: shaniya10052006@gmail.com

Scopes
├── .../auth/gmail.readonly
└── .../auth/gmail.modify

Test users
└── shaniya10052006@gmail.com
```

Your downloaded credentials JSON looks like:

```json
{
  "installed": {
    "client_id": "123456789-xxxxx.apps.googleusercontent.com",
    "project_id": "doc-x-intelligent-xxxxx",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_secret": "GOCSPX-xxxxxxxxxxxxxxxxxxxx",
    "redirect_uris": ["http://localhost"]
  }
}
```

The important parts:
- ✅ `client_id` ends with `.apps.googleusercontent.com`
- ✅ `client_secret` starts with `GOCSPX-`
- ✅ `project_id` is your actual project name

---

## ⏱️ Estimated Time

- First-time setup: **10-15 minutes**
- Already have project: **5 minutes**
- Just OAuth flow: **30 seconds**

---

## 🎬 Video Tutorial

If you prefer video instructions, search YouTube for:
- "Gmail API Python OAuth setup"
- "Google Cloud Console create OAuth credentials"

---

## ✅ Success Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Gmail API
- [ ] Configured OAuth consent screen
- [ ] Added test user (shaniya10052006@gmail.com)
- [ ] Created OAuth 2.0 Desktop credentials
- [ ] Downloaded credentials JSON
- [ ] Replaced gmail_credentials.json
- [ ] Ran gmail_ingestion.py
- [ ] Completed OAuth in browser
- [ ] See "Gmail authentication successful"

---

Need help? The error messages in the terminal are very descriptive and will guide you!
