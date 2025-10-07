# WhatsApp Scanner Node Configuration

## Option 1: Official WhatsApp Business API

{
  "parameters": {
    "url": "https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpHeaderAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "fields",
          "value": "messages{id,timestamp,type,text,document,from}"
        },
        {
          "name": "since",
          "value": "{{ $now.minus({hours: 6}).toUnix() }}"
        }
      ]
    },
    "sendHeaders": true,
    "headerParameters": {
      "parameters": [
        {
          "name": "Accept",
          "value": "application/json"
        }
      ]
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  }
}

## Option 2: Twilio WhatsApp API

{
  "parameters": {
    "url": "https://api.twilio.com/2010-04-01/Accounts/YOUR_ACCOUNT_SID/Messages.json",
    "authentication": "predefinedCredentialType",
    "nodeCredentialType": "httpBasicAuth",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "From",
          "value": "whatsapp:+YOUR_TWILIO_WHATSAPP_NUMBER"
        },
        {
          "name": "DateSent>",
          "value": "{{ $now.minus({hours: 6}).toISO() }}"
        }
      ]
    },
    "options": {
      "response": {
        "response": {
          "responseFormat": "json"
        }
      }
    }
  }
}

## Option 3: Mock WhatsApp for Testing

{
  "parameters": {
    "url": "http://localhost:5000/api/mock/whatsapp",
    "authentication": "none",
    "sendQuery": true,
    "queryParameters": {
      "parameters": [
        {
          "name": "since",
          "value": "{{ $now.minus({hours: 6}).toISO() }}"
        }
      ]
    }
  }
}