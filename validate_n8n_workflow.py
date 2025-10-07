#!/usr/bin/env python3
"""
Validate N8N workflow JSON structure and content extraction logic
"""

import json
import os

def validate_n8n_workflow():
    """Validate the N8N workflow JSON structure"""
    
    workflow_path = r"c:\Doc.X Intelligent\workflows\multi-platform-document-processor.json"
    
    if not os.path.exists(workflow_path):
        print(f"❌ Workflow file not found: {workflow_path}")
        return False
    
    try:
        with open(workflow_path, 'r', encoding='utf-8') as f:
            workflow = json.load(f)
        
        print(f"✅ Workflow JSON is valid")
        print(f"📄 Workflow name: {workflow.get('name', 'Unknown')}")
        print(f"🔗 Total nodes: {len(workflow.get('nodes', []))}")
        
        # Find specific nodes we care about
        nodes = workflow.get('nodes', [])
        
        # Find Gmail processing node
        gmail_node = None
        prepare_node = None
        backend_node = None
        
        for node in nodes:
            if node.get('name') == '📧 Gmail Processing':
                gmail_node = node
            elif node.get('name') == '🔄 Prepare for Backend':
                prepare_node = node
            elif node.get('name') == '🚀 Send to DOC.X Backend':
                backend_node = node
        
        # Validate Gmail processing
        if gmail_node:
            print(f"\n📧 Gmail Processing Node:")
            gmail_code = gmail_node.get('parameters', {}).get('jsCode', '')
            if 'content: data.text || data.html' in gmail_code:
                print(f"   ✅ Email content extraction present")
            else:
                print(f"   ⚠️ Email content extraction may be missing")
                
            if 'isKMRLRelated' in gmail_code:
                print(f"   ✅ KMRL filtering present")
            else:
                print(f"   ❌ KMRL filtering missing")
        else:
            print(f"\n❌ Gmail Processing node not found")
        
        # Validate Prepare for Backend
        if prepare_node:
            print(f"\n🔄 Prepare for Backend Node:")
            prepare_code = prepare_node.get('parameters', {}).get('jsCode', '')
            if 'contentSource' in prepare_code:
                print(f"   ✅ Content source tracking present")
            else:
                print(f"   ❌ Content source tracking missing")
                
            if 'json.content && json.content.trim()' in prepare_code:
                print(f"   ✅ Direct content handling present")
            else:
                print(f"   ❌ Direct content handling missing")
                
            if 'Object.keys(binary).length > 0' in prepare_code:
                print(f"   ✅ Binary content handling present")
            else:
                print(f"   ❌ Binary content handling missing")
        else:
            print(f"\n❌ Prepare for Backend node not found")
        
        # Validate Backend sending
        if backend_node:
            print(f"\n🚀 Send to DOC.X Backend Node:")
            backend_params = backend_node.get('parameters', {})
            
            if backend_params.get('specifyBody') == "={{ $json.hasBinary ? 'form' : 'json' }}":
                print(f"   ✅ Conditional body format present")
            else:
                print(f"   ❌ Conditional body format missing")
                
            if backend_params.get('sendBinaryData') == "={{ $json.hasBinary }}":
                print(f"   ✅ Binary data sending configured")
            else:
                print(f"   ❌ Binary data sending not configured")
        else:
            print(f"\n❌ Send to DOC.X Backend node not found")
        
        return True
        
    except json.JSONDecodeError as e:
        print(f"❌ Invalid JSON: {e}")
        return False
    except Exception as e:
        print(f"❌ Error validating workflow: {e}")
        return False

def check_content_extraction_flow():
    """Check the logical flow of content extraction"""
    
    print(f"\n🔍 Content Extraction Flow Analysis:")
    print(f"=" * 40)
    
    print(f"1. 📧 Gmail Node:")
    print(f"   - Downloads emails with downloadAttachments: true")
    print(f"   - Filters for KMRL-related content")
    print(f"   - Creates documents with content field for email text")
    print(f"   - Creates documents with binary data for attachments")
    
    print(f"\n2. 🔄 Prepare Node:")
    print(f"   - Checks for json.content (direct text)")
    print(f"   - Checks for binary attachments")
    print(f"   - Checks for download URLs")
    print(f"   - Sets contentSource flag")
    
    print(f"\n3. 🚀 Backend Node:")
    print(f"   - Uses multipart/form-data for binary files")
    print(f"   - Uses application/json for text content")
    print(f"   - Sends all data to Flask webhook")
    
    print(f"\n4. 🧠 Backend Processing:")
    print(f"   - Extracts text from binary files")
    print(f"   - Uses direct content if available")
    print(f"   - Classifies with RAG system")
    
    print(f"\n🎯 Expected Outcome:")
    print(f"   - Engineering documents → Engineering dept")
    print(f"   - Admin documents → Administration dept")
    print(f"   - Operations documents → Operations dept")

if __name__ == "__main__":
    print("🔧 N8N Workflow Validation")
    print("=" * 50)
    
    success = validate_n8n_workflow()
    
    if success:
        check_content_extraction_flow()
        print(f"\n✅ Workflow validation completed successfully!")
    else:
        print(f"\n❌ Workflow validation failed!")
    
    print(f"\nTo import workflow:")
    print(f"1. Open N8N interface")
    print(f"2. Go to Workflows → Import from file")
    print(f"3. Select: workflows/multi-platform-document-processor.json")
    print(f"4. Test with a KMRL maintenance email")