# Google OAuth2 Configuration for n8n

## Credentials Setup

**Client ID:** `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`  
**Client Secret:** `YOUR_GOOGLE_CLIENT_SECRET`  
**Redirect URI:** `http://localhost:5678/rest/oauth2-credential/callback`

> ⚠️ **Important:** Replace the placeholder values with your actual Google OAuth credentials from Google Cloud Console.

---

## Setup Instructions

### Method 1: Configure via n8n UI (Recommended)

1. **Access n8n**
   - Open http://localhost:5678
   - Login with username: `admin` and password: `admin123`

2. **Add Google OAuth2 Credential**
   - Click on **"Credentials"** in the left sidebar
   - Click **"+ Add Credential"** button
   - Search for and select **"Google OAuth2 API"**

3. **Enter Credentials**
   ```
   Name: Google Gmail OAuth
   Client ID: YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   Client Secret: YOUR_GOOGLE_CLIENT_SECRET
   ```

4. **Configure Scopes**
   Add the following scopes (click "Add Scope" for each):
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/drive.readonly
   ```

5. **Authenticate**
   - Click **"Connect my account"** or **"Sign in with Google"**
   - A popup window will open
   - Select your Google account
   - Grant the requested permissions
   - You'll be redirected back to n8n

6. **Save the Credential**
   - Click **"Save"** button
   - The credential is now ready to use!

---

### Method 2: Gmail Trigger/Node Specific Setup

When adding a Gmail node to your workflow:

1. **Add Gmail Node**
   - In your workflow, click **"+"** to add a node
   - Search for **"Gmail"**
   - Select the Gmail trigger or action you need

2. **Select/Create Credential**
   - In the node settings, under "Credential to connect with"
   - Click **"Create New"**
   - Select **"OAuth2"** (recommended) or **"Service Account"**

3. **For OAuth2:**
   ```
   Credential Name: Gmail OAuth
   Authentication: OAuth2
   Client ID: YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
   Client Secret: YOUR_GOOGLE_CLIENT_SECRET
   ```

4. **Authorize Access**
   - Click **"Sign in with Google"**
   - Complete the OAuth flow
   - Grant permissions

---

## Scopes Needed for Different Operations

### For Gmail Email Reading (Your use case)
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/gmail.modify
```

### For Gmail Sending
```
https://www.googleapis.com/auth/gmail.send
```

### For Gmail Attachments/Drive
```
https://www.googleapis.com/auth/gmail.readonly
https://www.googleapis.com/auth/drive.readonly
```

### Full Gmail Access (All operations)
```
https://mail.google.com/
```

---

## Verifying Your Setup

After configuring the credential:

1. **Test the Connection**
   - In your workflow, add a Gmail node
   - Select your newly created credential
   - Configure a simple operation (e.g., "Get All Messages")
   - Click **"Execute Node"** to test

2. **Check Credential Status**
   - Go to **Credentials** page
   - Find your Google credential
   - It should show as **"Connected"** or **"Authenticated"**

---

## Troubleshooting

### Issue: "Redirect URI mismatch" error

**Solution:** Verify in Google Cloud Console that the redirect URI is set to:
```
http://localhost:5678/rest/oauth2-credential/callback
```

### Issue: "Access denied" or "insufficient permissions"

**Solution:** 
1. Check that you've added all required scopes
2. Re-authenticate the credential
3. Make sure the Google Cloud Project has Gmail API enabled

### Issue: "Invalid client" error

**Solution:** Double-check that Client ID and Client Secret are copied correctly without extra spaces.

---

## Google Cloud Console Verification

Make sure in your Google Cloud Console (https://console.cloud.google.com/):

1. **Project:** n8n-email-tracker-473306
2. **APIs & Services > Credentials**
   - OAuth 2.0 Client ID is created
   - Redirect URI includes: `http://localhost:5678/rest/oauth2-credential/callback`

3. **APIs & Services > Enabled APIs**
   - Gmail API is enabled
   - Google Drive API is enabled (if accessing attachments)

4. **OAuth Consent Screen**
   - App is configured (can be in Testing mode for personal use)
   - Required scopes are added
   - Test users are added (your email address)

---

## Using in Your Workflows

Once configured, select this credential in:

1. **Gmail Trigger Node** - to monitor incoming emails
2. **Gmail Node** - to read, send, or modify emails
3. **Google Drive Node** - to access attachment files

### Example: Gmail Trigger Setup
```
Trigger: Gmail
Event: Message Received
Credential: Google Gmail OAuth (your credential name)
Label: INBOX or specific label
```

---

## Security Notes

⚠️ **Important:**
- These credentials are sensitive - don't commit them to public repositories
- The credentials are stored securely in n8n's database
- You can revoke access anytime from your Google Account settings
- For production, consider using a Service Account for server-to-server authentication

---

## Quick Reference

**n8n URL:** http://localhost:5678  
**OAuth Callback:** http://localhost:5678/rest/oauth2-credential/callback  
**Project ID:** n8n-email-tracker-473306

**Credential File:** `google-oauth-credential.json` (for reference only)
