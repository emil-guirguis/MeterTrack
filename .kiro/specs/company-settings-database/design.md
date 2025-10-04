# Design Document

## Overview

This design implements a database-backed company settings system that replaces the existing mock data implementation. The solution will create a MongoDB collection for company settings and connect it to the existing frontend interface through RESTful API endpoints.

The design leverages the existing frontend store architecture and authentication middleware while adding a new Mongoose model and enhanced API routes for company settings management.

## Architecture

### Database Layer
- **Collection**: `companySettings` in the `facility-management` database
- **Model**: Mongoose schema with validation and transformation methods
- **Connection**: Uses existing MongoDB connection from the application

### API Layer
- **Routes**: Enhanced `/api/settings` endpoints with company-specific routes
- **Authentication**: Leverages existing JWT authentication and permission middleware
- **Validation**: Server-side validation using Mongoose schema and custom validators

### Frontend Integration
- **Store**: Existing Zustand store with updated service layer
- **Service**: Replace mock service with actual HTTP API calls
- **Types**: Existing TypeScript interfaces remain unchanged

## Components and Interfaces

### Database Schema

```javascript
// CompanySettings Mongoose Schema
{
  name: String (required, trimmed, max 200 chars),
  logo: String (optional, URL validation),
  address: {
    street: String (required),
    city: String (required),
    state: String (required),
    zipCode: String (required),
    country: String (required, default: 'USA')
  },
  contactInfo: {
    phone: String (required, phone format validation),
    email: String (required, email validation),
    website: String (optional, URL validation)
  },
  branding: {
    primaryColor: String (required, hex color validation),
    secondaryColor: String (required, hex color validation),
    accentColor: String (required, hex color validation),
    logoUrl: String (optional),
    faviconUrl: String (optional),
    customCSS: String (optional),
    emailSignature: String (optional)
  },
  systemConfig: {
    timezone: String (required, default: 'America/New_York'),
    dateFormat: String (required, default: 'MM/DD/YYYY'),
    timeFormat: String (required, enum: ['12h', '24h']),
    currency: String (required, default: 'USD'),
    language: String (required, default: 'en'),
    defaultPageSize: Number (required, min: 10, max: 100),
    sessionTimeout: Number (required, min: 5, max: 480),
    enableNotifications: Boolean (default: true),
    enableEmailAlerts: Boolean (default: true),
    enableSMSAlerts: Boolean (default: false),
    maintenanceMode: Boolean (default: false),
    allowUserRegistration: Boolean (default: false),
    requireEmailVerification: Boolean (default: true),
    passwordPolicy: {
      minLength: Number (min: 6, max: 50),
      requireUppercase: Boolean,
      requireLowercase: Boolean,
      requireNumbers: Boolean,
      requireSpecialChars: Boolean,
      maxAge: Number (min: 30, max: 365)
    },
    backupSettings: {
      enabled: Boolean,
      frequency: String (enum: ['daily', 'weekly', 'monthly']),
      retentionDays: Number (min: 7, max: 365),
      includeFiles: Boolean
    }
  },
  features: {
    userManagement: Boolean (default: true),
    buildingManagement: Boolean (default: true),
    equipmentManagement: Boolean (default: true),
    meterManagement: Boolean (default: true),
    contactManagement: Boolean (default: true),
    emailTemplates: Boolean (default: true),
    reporting: Boolean (default: true),
    analytics: Boolean (default: true),
    mobileApp: Boolean (default: false),
    apiAccess: Boolean (default: true)
  },
  integrations: {
    emailProvider: String (optional),
    smsProvider: String (optional),
    paymentProcessor: String (optional),
    calendarSync: Boolean (default: false),
    weatherAPI: Boolean (default: false),
    mapProvider: String (default: 'google')
  }
}
```

### API Endpoints

#### GET /api/settings/company
- **Purpose**: Retrieve current company settings
- **Authentication**: Required (JWT token)
- **Authorization**: `settings:read` permission
- **Response**: CompanySettings object or default settings if none exist
- **Status Codes**: 200 (success), 401 (unauthorized), 403 (forbidden), 500 (server error)

#### PUT /api/settings/company
- **Purpose**: Update company settings (full or partial update)
- **Authentication**: Required (JWT token)
- **Authorization**: `settings:update` permission
- **Request Body**: Partial CompanySettings object
- **Response**: Updated CompanySettings object
- **Validation**: Server-side validation of all fields
- **Status Codes**: 200 (success), 400 (validation error), 401 (unauthorized), 403 (forbidden), 500 (server error)

### Service Layer Updates

The existing `settingsService` in the frontend store will be updated to make actual HTTP requests instead of returning mock data:

```typescript
const settingsService = {
  async getSettings(): Promise<CompanySettings> {
    const response = await fetch('/api/settings/company', {
      headers: { Authorization: `Bearer ${getToken()}` }
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  },

  async updateSettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    const response = await fetch('/api/settings/company', {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`
      },
      body: JSON.stringify(updates)
    });
    const result = await response.json();
    if (!result.success) throw new Error(result.message);
    return result.data;
  }
};
```

## Data Models

### Default Company Settings
When no company settings exist in the database, the system will create default settings with:
- Company name: "Facility Management Company"
- Default branding colors matching the current application theme
- Standard system configuration values
- All core features enabled
- Basic contact information placeholders

### Data Transformation
- MongoDB `_id` field will be transformed to `id` for frontend compatibility
- Date fields will be properly serialized/deserialized
- Nested objects will maintain their structure
- Optional fields will be handled gracefully

## Error Handling

### Database Errors
- **Connection Issues**: Return 500 status with generic error message
- **Validation Errors**: Return 400 status with specific field validation messages
- **Document Not Found**: Create default settings and return them
- **Duplicate Key Errors**: Handle gracefully (shouldn't occur with single document)

### API Error Responses
```javascript
// Success Response
{
  success: true,
  data: CompanySettings
}

// Error Response
{
  success: false,
  message: "Error description",
  errors?: [{ field: "fieldName", message: "Specific error" }]
}
```

### Frontend Error Handling
- Network errors will be caught and displayed to users
- Validation errors will be shown for specific fields
- Optimistic updates will be rolled back on failure
- Loading states will be managed during API calls

## Testing Strategy

### Backend Testing
- **Unit Tests**: Test CompanySettings model validation and methods
- **Integration Tests**: Test API endpoints with authentication and authorization
- **Database Tests**: Test CRUD operations and default settings creation
- **Validation Tests**: Test all schema validation rules

### Frontend Testing
- **Service Tests**: Test API service methods with mocked responses
- **Store Tests**: Test Zustand store actions and state management
- **Component Tests**: Test settings components with various data states
- **Integration Tests**: Test end-to-end settings update flow

### Database Migration Testing
- Test creation of company settings collection
- Test default settings initialization
- Test data integrity during updates
- Test performance with indexes

## Security Considerations

### Authentication & Authorization
- All endpoints require valid JWT tokens
- Proper permission checks for read/update operations
- Rate limiting on update operations to prevent abuse

### Data Validation
- Server-side validation for all input fields
- Sanitization of HTML content in custom CSS and email signatures
- URL validation for logo and website fields
- Phone number format validation

### Data Protection
- Sensitive configuration data is properly validated
- No sensitive information in error messages
- Audit logging for settings changes (future enhancement)

## Performance Considerations

### Database Optimization
- Single document per application (no complex queries needed)
- Indexes on frequently accessed fields
- Efficient document structure for MongoDB

### Caching Strategy
- Frontend store caches settings for 5 minutes
- Optimistic updates for better user experience
- Minimal API calls through smart caching

### API Performance
- Lightweight JSON responses
- Efficient MongoDB queries
- Proper error handling to avoid unnecessary processing