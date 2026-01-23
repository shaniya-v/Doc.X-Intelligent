"""
Debug Gmail - Check what emails exist
"""

import os
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build

TOKEN_PATH = 'gmail_token.json'
SCOPES = [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify'
]

def debug_gmail():
    """Debug Gmail to see what's available"""
    
    if not os.path.exists(TOKEN_PATH):
        print("❌ Token not found. Run gmail_ingestion.py first")
        return
    
    credentials = Credentials.from_authorized_user_file(TOKEN_PATH, SCOPES)
    service = build('gmail', 'v1', credentials=credentials)
    
    print("=" * 70)
    print("🔍 GMAIL DEBUG - Checking Email Status")
    print("=" * 70)
    print()
    
    # Test 1: Check if KMRL label exists
    print("1️⃣  CHECKING KMRL LABEL...")
    try:
        labels_result = service.users().labels().list(userId='me').execute()
        labels = labels_result.get('labels', [])
        
        kmrl_label = None
        print(f"   Found {len(labels)} labels total:")
        for label in labels:
            if 'KMRL' in label['name'].upper():
                print(f"   ✅ {label['name']} (ID: {label['id']})")
                kmrl_label = label
            
        if not kmrl_label:
            print("   ❌ No KMRL label found!")
            print("   Create it in Gmail and try again")
            return
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return
    
    # Test 2: Search for KMRL emails (any status)
    print("2️⃣  CHECKING ALL KMRL EMAILS...")
    try:
        query = 'label:KMRL'
        results = service.users().messages().list(userId='me', q=query, maxResults=10).execute()
        messages = results.get('messages', [])
        
        print(f"   Query: {query}")
        print(f"   Found: {len(messages)} emails")
        
        if messages:
            for i, msg in enumerate(messages, 1):
                full_msg = service.users().messages().get(userId='me', id=msg['id']).execute()
                
                # Get headers
                headers = {h['name']: h['value'] for h in full_msg['payload']['headers']}
                subject = headers.get('Subject', 'No Subject')
                
                # Check labels
                labels = full_msg.get('labelIds', [])
                is_unread = 'UNREAD' in labels
                
                # Check attachments
                has_attachments = False
                if 'parts' in full_msg['payload']:
                    for part in full_msg['payload']['parts']:
                        if part.get('filename'):
                            has_attachments = True
                            break
                
                print(f"\n   Email {i}:")
                print(f"      ID: {msg['id']}")
                print(f"      Subject: {subject[:50]}...")
                print(f"      Unread: {'✅ YES' if is_unread else '❌ NO (READ)'}")
                print(f"      Has Attachments: {'✅ YES' if has_attachments else '❌ NO'}")
                print(f"      Labels: {', '.join(labels)}")
        else:
            print("   ❌ No KMRL emails found at all!")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 3: Search with full query (what service uses)
    print("3️⃣  CHECKING WITH FULL QUERY (SERVICE USES THIS)...")
    try:
        query = 'label:KMRL is:unread has:attachment'
        results = service.users().messages().list(userId='me', q=query, maxResults=10).execute()
        messages = results.get('messages', [])
        
        print(f"   Query: {query}")
        print(f"   Found: {len(messages)} emails")
        
        if messages:
            print("   ✅ These emails WILL be processed:")
            for i, msg in enumerate(messages, 1):
                full_msg = service.users().messages().get(userId='me', id=msg['id']).execute()
                headers = {h['name']: h['value'] for h in full_msg['payload']['headers']}
                subject = headers.get('Subject', 'No Subject')
                print(f"      {i}. {subject[:50]}...")
        else:
            print("   ❌ No emails match the criteria!")
            print()
            print("   📋 TO FIX THIS:")
            print("      1. Make sure emails have KMRL label")
            print("      2. Make sure emails are UNREAD (press Shift+U in Gmail)")
            print("      3. Make sure emails have attachments")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    # Test 4: Search for unread emails with attachments (no label)
    print("4️⃣  CHECKING UNREAD EMAILS WITH ATTACHMENTS (NO LABEL)...")
    try:
        query = 'is:unread has:attachment'
        results = service.users().messages().list(userId='me', q=query, maxResults=5).execute()
        messages = results.get('messages', [])
        
        print(f"   Query: {query}")
        print(f"   Found: {len(messages)} emails")
        
        if messages:
            print("   💡 These emails are unread with attachments (add KMRL label):")
            for i, msg in enumerate(messages, 1):
                full_msg = service.users().messages().get(userId='me', id=msg['id']).execute()
                headers = {h['name']: h['value'] for h in full_msg['payload']['headers']}
                subject = headers.get('Subject', 'No Subject')
                labels = full_msg.get('labelIds', [])
                has_kmrl = 'KMRL' in labels or any('KMRL' in str(l) for l in labels)
                
                print(f"      {i}. {subject[:50]}...")
                print(f"         Has KMRL: {'✅ YES' if has_kmrl else '❌ NO - ADD THIS LABEL!'}")
        print()
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("=" * 70)
    print("🎯 SUMMARY")
    print("=" * 70)
    print()
    print("For emails to be processed, they MUST have:")
    print("   ✅ KMRL label")
    print("   ✅ UNREAD status (not read)")
    print("   ✅ At least one attachment")
    print()
    print("📝 How to mark as unread in Gmail:")
    print("   1. Open Gmail")
    print("   2. Select the email(s)")
    print("   3. Press Shift+U")
    print("   OR click the envelope icon in toolbar")
    print()

if __name__ == "__main__":
    debug_gmail()
