# Email Service API Integration

This document describes the integration between the Simple Email Sender frontend and the backend API.

## Backend API Integration

The EmailService has been updated to integrate with your backend API located at:
- **Server**: `https://email-sender-orca.onrender.com`
- **API Documentation**: Based on the provided `api-usage-example.md`

## Changes Made

### 1. Updated EmailService Interface

**Previous Interface:**
```typescript
interface EmailData {
  senderEmail: string;
  senderPassword: string;  // Old field name
  recipients: string[];
  subject: string;
  htmlBody: string;        // Old field name
  textBody?: string;
}
```

**New Interface (Matching Backend API):**
```typescript
interface EmailData {
  senderEmail: string;
  appPassword: string;     // Changed from senderPassword
  recipients: string[];
  subject: string;
  template: string;        // Changed from htmlBody, matches backend API
}
```

### 2. Updated API Endpoints

- **Send Email**: `POST /api/send-email` (matches your backend)
- **Health Check**: `GET /api/health` (new endpoint added)
- **Server Information**: `GET /api/server-info` (new endpoint for backend server details)

### 3. Enhanced Response Handling

The service now handles the backend API response format:
```typescript
interface EmailResponse {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    recipientCount: number;
    timestamp: string;
  };
}
```

### 4. Added Features

1. **Health Check**: Test API connectivity with a "Test API" button in the header
2. **Graceful Fallback**: Falls back to mock responses if backend is unavailable
3. **Enhanced Error Handling**: Better error messages from backend
4. **Improved Validation**: Matches backend validation requirements
5. **Server Information**: New "Backend Server Information" button to view server details from `/api/server-info` endpoint

## Usage

### Frontend Integration

The MainPage.tsx has been updated to use the new field names:

```typescript
const emailData = {
  senderEmail: senderEmail.trim(),
  appPassword: senderPassword.trim(),    // Updated field name
  recipients: validRecipients,
  subject: subject.trim(),
  template: template.trim()              // Updated field name
};

const result = await EmailService.sendEmails(emailData);
```

### Testing the Integration

1. **Start your backend server** at `http://localhost:3000`
2. **Use the "Test API" button** in the frontend header to verify connectivity
3. **Send test emails** through the form

### Backend Requirements

Your backend should handle:
- `POST /api/send-email` with the request body format shown in the API documentation
- `GET /api/health` for connection testing
- `GET /api/server-info` for server information retrieval
- Proper CORS headers for cross-origin requests from your frontend domain

## Fallback Behavior

If the backend is not available, the service will:
1. Log a warning about backend unavailability
2. Use mock responses for development/testing
3. Display appropriate error messages to users

## Error Handling

The integration handles various error scenarios:
- **Network errors**: Connection issues to backend
- **Validation errors**: Invalid email data
- **Authentication errors**: Invalid Gmail credentials
- **Rate limiting**: Maximum 25 recipients per request

## Configuration

To change the backend URL, update the `API_BASE_URL` in `EmailService.ts`:

```typescript
private static readonly API_BASE_URL = 'https://email-sender-orca.onrender.com'; // Your backend URL
```

## Testing

A test file `test-integration.ts` has been created to verify the integration. It tests:
- Health check functionality
- Email sending API
- Validation logic
- Error handling

## Next Steps

1. Your backend server is now configured to use the Render deployment at `https://email-sender-orca.onrender.com`
2. Test the "Test API" button in the frontend to verify connectivity
3. Try sending a test email
4. Monitor both frontend console and backend logs for any issues

The integration is now complete and ready for use with your backend API!
