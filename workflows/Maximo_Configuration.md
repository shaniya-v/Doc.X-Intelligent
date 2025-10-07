# Maximo Scanner Configuration Guide

## Authentication Methods

### Option 1: Basic Authentication (Most Common)
```
Credential Type: HTTP Basic Auth
Username: [Your Maximo Username]
Password: [Your Maximo Password]
```

### Option 2: API Key Authentication
```
Credential Type: HTTP Header Auth
Header Name: apikey
Header Value: [Your Maximo API Key]
```

### Option 3: Custom Headers
```
Credential Type: HTTP Header Auth
Header Name: maxauth
Header Value: [Base64 encoded username:password]
```

## Maximo REST API Endpoints

### Common Maximo REST URLs:
```
Base URL: https://your-maximo-server.com/maximo/oslc
Assets: /os/mxasset
Work Orders: /os/mxwo
Locations: /os/mxlocation
Service Requests: /os/mxsr
```

### Sample API Calls:

**Get Recent Assets:**
```
GET /maximo/oslc/os/mxasset?oslc.where=changedate>="2025-10-02T00:00:00+00:00"&oslc.select=assetnum,description,location,status,changedate
```

**Get Work Orders:**
```
GET /maximo/oslc/os/mxwo?oslc.where=statusdate>="2025-10-02T00:00:00+00:00"&oslc.select=wonum,description,location,status,statusdate
```

## Response Format

Maximo typically returns JSON in this format:
```json
{
  "rdfs:member": [
    {
      "rdf:about": "http://server/maximo/oslc/os/mxasset/_QkVERk9SRC8xMDAx",
      "spi:assetnum": "RAIL001",
      "spi:description": "Main Track Section A",
      "spi:location": "Ernakulam Junction", 
      "spi:status": "OPERATING",
      "spi:changedate": "2025-10-03T10:30:00+00:00"
    }
  ]
}
```