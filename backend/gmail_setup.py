"""
Gmail API Setup Helper
Run this script to set up Gmail API credentials
"""

import os
import json

CREDENTIALS_TEMPLATE = {
    "installed": {
        "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
        "project_id": "your-project-id",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_secret": "YOUR_CLIENT_SECRET",
        "redirect_uris": ["http://localhost"]
    }
}

def create_credentials_template():
    """Create credentials template file"""
    filename = 'gmail_credentials.json'
    
    if os.path.exists(filename):
        print(f"⚠️  {filename} already exists")
        response = input("Overwrite? (y/n): ")
        if response.lower() != 'y':
            print("Aborted")
            return
    
    with open(filename, 'w') as f:
        json.dump(CREDENTIALS_TEMPLATE, f, indent=2)
    
    print(f"✅ Created {filename}")
    print("\n📝 Next steps:")
    print("1. Go to: https://console.cloud.google.com/")
    print("2. Create a new project (or select existing)")
    print("3. Enable Gmail API")
    print("4. Create OAuth 2.0 credentials (Desktop app)")
    print("5. Download the JSON file")
    print("6. Replace the contents of gmail_credentials.json with downloaded file")
    print("\nOR manually edit gmail_credentials.json with your credentials")

def setup_instructions():
    """Display setup instructions"""
    print("""
╔════════════════════════════════════════════════════════════════╗
║         Gmail API Setup Instructions                           ║
╚════════════════════════════════════════════════════════════════╝

📋 Step 1: Google Cloud Console Setup
   1. Go to: https://console.cloud.google.com/
   2. Create a new project or select existing one
   3. Enable Gmail API:
      - Go to "APIs & Services" > "Library"
      - Search for "Gmail API"
      - Click "Enable"

📋 Step 2: Create OAuth 2.0 Credentials
   1. Go to "APIs & Services" > "Credentials"
   2. Click "Create Credentials" > "OAuth client ID"
   3. Select Application type: "Desktop app"
   4. Give it a name (e.g., "Doc.X Gmail Ingestion")
   5. Click "Create"
   6. Download the JSON file

📋 Step 3: Configure Credentials
   1. Save the downloaded file as: gmail_credentials.json
   2. Place it in the backend/ directory

📋 Step 4: Configure OAuth Consent Screen
   1. Go to "APIs & Services" > "OAuth consent screen"
   2. Select "External" user type
   3. Fill in app name and email
   4. Add scopes:
      - https://www.googleapis.com/auth/gmail.readonly
      - https://www.googleapis.com/auth/gmail.modify
   5. Add your email as test user

📋 Step 5: Run the Service
   1. Install dependencies:
      pip install google-auth-oauthlib google-auth-httplib2 google-api-python-client
   
   2. Run the ingestion service:
      python gmail_ingestion.py
   
   3. First run will open browser for OAuth authorization
   4. After authorization, token is saved for future runs

🔧 Configuration:
   - Edit GMAIL_LABEL in gmail_ingestion.py (default: KMRL)
   - Edit POLL_INTERVAL (default: 60 seconds)
   - Edit BACKEND_URL (default: http://localhost:8000)

📝 Files Created:
   - gmail_credentials.json (your OAuth client config)
   - gmail_token.json (auto-generated after first auth)

⚠️  Security:
   - Add both files to .gitignore
   - Never commit credentials to git
   - Keep credentials file secure
""")

if __name__ == "__main__":
    print("Gmail API Setup Helper\n")
    
    choice = input("1. Create credentials template\n2. Show setup instructions\n3. Both\n\nChoice (1/2/3): ")
    
    if choice == "1":
        create_credentials_template()
    elif choice == "2":
        setup_instructions()
    elif choice == "3":
        create_credentials_template()
        print()
        setup_instructions()
    else:
        print("Invalid choice")
