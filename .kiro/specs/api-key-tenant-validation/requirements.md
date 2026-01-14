# Requirements Document: API Key Tenant Validation

## Introduction

The system currently loads the API key from the `CLIENT_API_KEY` environment variable. This requirement specifies that the API key should be validated from the tenant table in the sync database instead, improving security and allowing per-tenant API key management.

## Glossary

- **API Key**: Authentication credential used to communicate with the Client System API
- **Tenant Table**: Local sync database table containing tenant configuration including API key
- **Sync Database**: Local PostgreSQL database that stores synchronized data from the remote Client System
- **Environment Variable**: Configuration value loaded from `.env` file (CLIENT_API_KEY)
- **Fallback**: Secondary source for API key if primary source is unavailable

## Requirements

### Requirement 1: Load API Key from Tenant Table

**User Story:** As a system administrator, I want the API key to be loaded from the tenant table in the sync database, so that API key management is centralized and can be updated without restarting the service.

#### Acceptance Criteria

1. WHEN the Sync MCP Server initializes, THE System SHALL attempt to load the API key from the tenant table in the sync database
2. WHEN the tenant table contains an api_key value, THE System SHALL use that value for Client System API authentication
3. WHEN the tenant table does not contain an api_key value, THE System SHALL fall back to the CLIENT_API_KEY environment variable
4. WHEN the CLIENT_API_KEY environment variable is provided, THE System SHALL store it in the tenant table for future use
5. WHEN the API key is loaded from the tenant table, THE System SHALL log a confirmation message showing the first 8 characters of the key

### Requirement 2: Validate API Key Availability

**User Story:** As a system operator, I want the system to validate that an API key is available before attempting to use it, so that I receive clear error messages if authentication is misconfigured.

#### Acceptance Criteria

1. WHEN the Sync MCP Server initializes, THE System SHALL verify that an API key is available from either the tenant table or environment variable
2. IF no API key is available from either source, THE System SHALL log a warning message indicating the missing configuration
3. WHEN the Client System API client is created, THE System SHALL be initialized with the loaded API key
4. IF the API key is empty or undefined, THE System SHALL log a warning but continue operation (allowing graceful degradation)

### Requirement 3: Update Tenant API Key

**User Story:** As a system administrator, I want to be able to update the API key stored in the tenant table, so that I can rotate credentials without restarting the service.

#### Acceptance Criteria

1. WHEN the updateTenantApiKey method is called with a new API key, THE System SHALL update the api_key column in the tenant table
2. WHEN the update is successful, THE System SHALL log a confirmation message
3. IF the api_key column does not exist in the tenant table, THE System SHALL log a warning and continue gracefully
4. WHEN the API key is updated, THE System SHALL also update the updated_at timestamp in the tenant table

### Requirement 4: Prioritize Tenant Table Over Environment Variable

**User Story:** As a system administrator, I want the tenant table to be the primary source for the API key, so that I can manage credentials centrally without relying on environment variables.

#### Acceptance Criteria

1. WHEN both the tenant table and environment variable contain an API key, THE System SHALL prioritize the tenant table value
2. WHEN the tenant table API key is used, THE System SHALL log that it was loaded from the database
3. WHEN the environment variable is used as a fallback, THE System SHALL log that it was loaded from the environment
4. WHEN the environment variable API key is stored to the tenant table, THE System SHALL update the database for future use
