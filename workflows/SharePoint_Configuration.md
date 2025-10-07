# SharePoint Scanner Configuration Guide

## Required Information

Before configuring, gather this information:
- **Tenant ID**: Found in Azure AD → Properties
- **Site Collection URL**: e.g., `https://kmrlcoin.sharepoint.com`
- **Site Name**: e.g., `KMRL Documents`
- **Document Library**: e.g., `Documents` or `Shared Documents`

## Step-by-Step Configuration

### 1. Update Workflow Parameters

In the SharePoint Scanner node, update the URL parameter:

```json
{
  "url": "https://graph.microsoft.com/v1.0/sites/{site-id}/drive/items?$filter=lastModifiedDateTime ge {timestamp}&$expand=thumbnails"
}
```

### 2. Find Your Site ID

Use Microsoft Graph Explorer or this PowerShell command:
```powershell
# Get site ID
$siteUrl = "kmrlcoin.sharepoint.com:/sites/KMRL"
$graphUrl = "https://graph.microsoft.com/v1.0/sites/$siteUrl"
```

### 3. Common SharePoint URLs

For different operations:

**Get Documents from Library:**
```
https://graph.microsoft.com/v1.0/sites/{site-id}/drive/items
```

**Get Recently Modified:**
```
https://graph.microsoft.com/v1.0/sites/{site-id}/drive/items?$filter=lastModifiedDateTime ge 2025-10-02T00:00:00Z
```

**Get Specific Library:**
```
https://graph.microsoft.com/v1.0/sites/{site-id}/lists/{list-id}/items
```

## Authentication Headers

The SharePoint node should include these headers:
```json
{
  "Authorization": "Bearer {oauth_token}",
  "Accept": "application/json",
  "Content-Type": "application/json"
}
```

## Sample Response Structure

SharePoint Graph API returns:
```json
{
  "value": [
    {
      "id": "document_id",
      "name": "filename.pdf",
      "size": 1024,
      "lastModifiedDateTime": "2025-10-03T10:00:00Z",
      "downloadUrl": "https://...",
      "webUrl": "https://...",
      "createdBy": {
        "user": {
          "displayName": "User Name"
        }
      }
    }
  ]
}
```

## Testing SharePoint Connection

Test with this simple query:
```
GET https://graph.microsoft.com/v1.0/sites
Authorization: Bearer {your_token}
```

This should return available sites.

## Troubleshooting

### Common Issues:

1. **403 Forbidden**: Check API permissions in Azure
2. **404 Not Found**: Verify site URL and ID
3. **401 Unauthorized**: Token expired, re-authenticate
4. **Invalid scope**: Ensure proper Graph API scopes

### Debug Steps:

1. Test authentication in Graph Explorer
2. Verify site accessibility 
3. Check document library permissions
4. Validate API endpoints