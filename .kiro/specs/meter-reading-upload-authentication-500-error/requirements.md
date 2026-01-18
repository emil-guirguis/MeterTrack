# Requirements Document: Meter Reading Upload Authentication 500 Error

## Introduction

The meter reading upload manager is receiving a 500 Internal Server Error with "Authentication error" message when attempting to upload meter readings to the remote client API. The API key is being set from the tenant cache, but the authentication is failing on the remote API side. This prevents meter readings from being synchronized to the remote database.

## Glossary

- **API Key**: Authentication token used to identify the sync system to the remote client API
- **Tenant Cache**: In-memory cache containing tenant configuration including API key
- **Client System API**: Remote API endpoint that receives meter reading uploads
- **Authentication Error**: 500 response indicating the API key validation failed
- **Sync Database**: Local database storing meter readings before upload
- **Remote Database**: Client-side database that receives uploaded readings

## Requirements

### Requirement 1: API Key Validation on Remote API

**User Story:** As a sync system, I want the remote API to validate my API key correctly, so that I can authenticate and upload meter readings.

#### Acceptance Criteria

1. WHEN the sync system sends an API request with a valid API key in the X-API-Key header, THE Remote_API SHALL validate the key and allow the request
2. WHEN the API key is missing from the request, THE Remote_API SHALL return a 401 Unauthorized response
3. WHEN the API key is invalid or expired, THE Remote_API SHALL return a 401 Unauthorized response
4. WHEN the API key is valid, THE Remote_API SHALL NOT return a 500 error
5. WHEN the API key validation fails, THE Remote_API SHALL return a descriptive error message indicating the reason

_Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

### Requirement 2: API Key Loading from Tenant Cache

**User Story:** As the upload manager, I want to load the API key from the tenant cache correctly, so that I can authenticate with the remote API.

#### Acceptance Criteria

1. WHEN the upload manager starts, THE Upload_Manager SHALL load the API key from the tenant cache
2. WHEN the API key is loaded, THE Upload_Manager SHALL set it on the ClientSystemApiClient
3. WHEN the API key is set, THE Upload_Manager SHALL include it in all subsequent API requests
4. WHEN the API key is missing from the tenant cache, THE Upload_Manager SHALL log a warning and attempt to proceed
5. WHEN the API key is empty or null, THE Upload_Manager SHALL log a warning indicating authentication may fail

_Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

### Requirement 3: API Request Header Format

**User Story:** As the sync system, I want to send the API key in the correct header format, so that the remote API can validate it.

#### Acceptance Criteria

1. WHEN an API request is made, THE ClientSystemApiClient SHALL include the X-API-Key header
2. WHEN the X-API-Key header is set, THE value SHALL be the API key string without modification
3. WHEN the API request is made, THE Content-Type header SHALL be set to application/json
4. WHEN the API request is made, THE Authorization header SHALL NOT be used (only X-API-Key)
5. WHEN the API request is made, THE headers SHALL be included in all requests (GET, POST, etc.)

_Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

### Requirement 4: Error Response Handling

**User Story:** As the upload manager, I want to handle authentication errors correctly, so that I can diagnose and resolve authentication issues.

#### Acceptance Criteria

1. WHEN the remote API returns a 500 error with "Authentication error" message, THE Upload_Manager SHALL log the error with full context
2. WHEN an authentication error occurs, THE Upload_Manager SHALL NOT retry the request immediately
3. WHEN an authentication error occurs, THE Upload_Manager SHALL keep the readings in the sync database
4. WHEN an authentication error occurs, THE Upload_Manager SHALL increment the retry count for the readings
5. WHEN an authentication error occurs, THE Upload_Manager SHALL log the error message for debugging

_Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

### Requirement 5: API Key Verification

**User Story:** As a developer, I want to verify that the API key is being sent correctly, so that I can debug authentication issues.

#### Acceptance Criteria

1. WHEN the upload manager starts, THE Upload_Manager SHALL log the API key (first 8 characters only for security)
2. WHEN an API request is made, THE ClientSystemApiClient SHALL log the API key being used (first 8 characters only)
3. WHEN an API request fails with authentication error, THE logs SHALL include the API key that was used (first 8 characters only)
4. WHEN debugging, THE logs SHALL show the full request headers (excluding sensitive data)
5. WHEN debugging, THE logs SHALL show the full response from the remote API

_Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

### Requirement 6: Tenant Cache API Key Availability

**User Story:** As the sync system, I want to ensure the API key is available in the tenant cache, so that the upload manager can use it.

#### Acceptance Criteria

1. WHEN the sync system starts, THE Tenant_Cache SHALL contain the API key for the current tenant
2. WHEN the API key is retrieved from the tenant cache, THE value SHALL be a non-empty string
3. WHEN the API key is missing from the tenant cache, THE system SHALL log a warning
4. WHEN the API key is empty in the tenant cache, THE system SHALL log a warning
5. WHEN the API key is updated in the tenant cache, THE Upload_Manager SHALL use the new key on the next request

_Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

