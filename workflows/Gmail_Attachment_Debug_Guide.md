"""
DOC.X Intelligent - Gmail Attachment Debug Guide
===============================================

ISSUE: Email attachments are being routed to "no download URL" path instead of download path

DEBUGGING STEPS:
===============

1. CHECK GMAIL SCANNER OUTPUT:
   When you run the workflow, check the N8N execution log for the Gmail Scanner node.
   Look for:
   ✅ includeAttachments: true is set
   ✅ Attachments array is populated
   ✅ attachmentId is present for each attachment

2. CHECK GMAIL PROCESSOR CONSOLE LOGS:
   The updated processor now includes debug logging:
   - "Processing email: [subject]"
   - "Has attachments: true/false"  
   - "Attachment count: X"
   - "Processing X attachments"
   - "Attachment: [filename], downloadUrl: [URL]"

3. VERIFY DOWNLOAD URL FORMAT:
   Attachments should have downloadUrl like:
   https://www.googleapis.com/gmail/v1/users/me/messages/[messageId]/attachments/[attachmentId]

4. CHECK "HAS DOWNLOAD URL?" CONDITIONS:
   Updated conditions now check:
   ✅ downloadUrl is not empty
   ✅ downloadUrl is not "null"  
   ✅ downloadUrl is not "undefined"

EXPECTED FLOW FOR EMAIL WITH ATTACHMENT:
========================================

Email with attachment file:
┌─────────────────────────────────────┐
│ 📧 Gmail Scanner                    │ 
│ (includeAttachments: true)          │
└─────────────┬───────────────────────┘
              │ 
              ▼
┌─────────────────────────────────────┐
│ 📧 Gmail Document Processor         │
│ Creates items:                      │
│ 1. Attachment with downloadUrl      │
│ 2. NO email body (attachments exist)│
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 📥 Has Download URL?                │
│ downloadUrl != null/empty/undefined │
└─────────────┬───────────────────────┘
              │ TRUE (for attachment)
              ▼
┌─────────────────────────────────────┐
│ 📥 Download Document                │
│ Downloads the attachment file       │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 🔄 Prepare for Backend              │
│ Sends to DOC.X backend              │
└─────────────────────────────────────┘

TROUBLESHOOTING CHECKLIST:
=========================

❓ Is the attachment showing in Gmail Scanner output?
   - Check: data.attachments array exists
   - Check: attachment.attachmentId is present
   - Check: attachment.size > 0

❓ Is the Gmail processor creating the right downloadUrl?
   - Should be: https://www.googleapis.com/gmail/v1/users/me/messages/[ID]/attachments/[attachmentId]
   - Check console logs for "Attachment: [filename], downloadUrl: [URL]"

❓ Is the "Has Download URL?" condition working?
   - Check if downloadUrl is exactly the string "null" vs null value
   - Look for TRUE path vs FALSE path in execution

❓ Are permissions correct for Gmail API?
   - Gmail API scope should include: https://www.googleapis.com/auth/gmail.readonly
   - N8N Gmail credentials should have attachment access

TESTING APPROACH:
================

1. Send a test email to yourself with:
   - From: your-email@kmrl.co.in (or use KMRL subject)
   - Subject: "KMRL Test Document"
   - Attachment: Small PDF file

2. Run the N8N workflow manually

3. Check execution logs for each node:
   - Gmail Scanner: Look for attachments array
   - Gmail Processor: Look for console.log output
   - Has Download URL: Check which path it takes
   - Download Document: Verify it downloads the file

COMMON ISSUES & FIXES:
=====================

Issue: Attachment detected but no downloadUrl
Fix: Check Gmail API permissions and credential scopes

Issue: downloadUrl exists but condition fails
Fix: Verify downloadUrl is not string "null" but actual null

Issue: Goes to wrong path consistently  
Fix: Check the conditions logic - might need different comparison

Issue: Gmail Scanner not finding attachments
Fix: Verify Gmail query and includeAttachments setting

EXPECTED CONSOLE OUTPUT (Gmail Processor):
=========================================

Processing email: KMRL Test Document
Has attachments: true
Attachment count: 1
Processing 1 attachments
Attachment: test-document.pdf, downloadUrl: https://www.googleapis.com/gmail/v1/users/me/messages/12345/attachments/67890
Processed 1 KMRL-related documents from Gmail

If you see this output but it still goes to "no download URL" path, 
the issue is in the conditional logic, not the processor.
"""