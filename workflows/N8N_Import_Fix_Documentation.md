"""
DOC.X Intelligent - N8N Workflow Import Test & Fixes
=================================================

ISSUE FIXED: "Cannot read properties of undefined (reading 'startsWith')" in Download Document node

PROBLEM ANALYSIS:
- The error occurred because some document processors were not setting downloadUrl property
- The "Has Download URL?" node was trying to access undefined downloadUrl values
- The "Download Document" node was attempting to use undefined URLs

FIXES APPLIED:
1. ✅ Updated Gmail Document Processor to explicitly set downloadUrl: null for email body content
2. ✅ Updated Maximo Document Processor to set downloadUrl: null for generated content
3. ✅ Enhanced "Has Download URL?" node to handle undefined/null values safely
4. ✅ Updated Download Document node to handle empty URLs gracefully
5. ✅ Added robust null checking and validation

SPECIFIC CHANGES:
================

1. Gmail Document Processor:
   - Added: downloadUrl: null for email body documents
   - Reason: Email body content doesn't need to be downloaded, it's already extracted

2. Maximo Document Processor:
   - Added: downloadUrl: null for Maximo exports
   - Reason: Maximo data is generated JSON content, no external download needed

3. Has Download URL? Node:
   - Enhanced condition checking with AND logic:
     * downloadUrl is not empty
     * downloadUrl is not equal to "null"
   - Prevents undefined property access errors

4. Download Document Node:
   - Added fallback: {{ $json.downloadUrl || '' }}
   - Prevents crashes when downloadUrl is undefined

WORKFLOW LOGIC FLOW:
===================

Document Source → Document Processor → Has Download URL? → Download (if needed) → Backend Processing

For different document types:
- Gmail Attachments: downloadUrl = Google API URL → Download required
- Gmail Body: downloadUrl = null → Skip download, use content directly
- SharePoint: downloadUrl = SharePoint URL → Download required  
- Maximo: downloadUrl = null → Skip download, use generated content
- WhatsApp: downloadUrl = WhatsApp API URL → Download required

TESTING RECOMMENDATIONS:
========================

1. Import the updated workflow into N8N
2. Test with mock data for each platform:
   - Gmail with attachments (should download)
   - Gmail body only (should skip download)
   - SharePoint documents (should download)
   - Maximo exports (should skip download)
   - WhatsApp media (should download)

3. Verify error handling:
   - Documents with missing downloadUrl property
   - Documents with null downloadUrl
   - Documents with empty string downloadUrl

KMRL-SPECIFIC FILTERING:
=======================

Enhanced Gmail filtering to only process KMRL-related emails:
- From domain: kmrl.co.in, maximo@kmrl
- Subject keywords: KMRL, കെഎംആർഎൽ, Kochi Metro, കൊച്ചി മെട്രോ
- Combined operational + location terms:
  * Operational: maintenance, safety, incident, repair
  * Location: Ernakulam, Aluva, Kochi, platform, station, track
  * Malayalam locations: എറണാകുളം, കൊച്ചി

This ensures only genuine KMRL documents are processed, not all maintenance emails.

IMPORT STATUS: ✅ READY FOR IMPORT
The workflow should now import without the "startsWith" error.
"""