# Requirements Document: Meter Readings Fetch Fix

## Introduction

The meter readings fetch endpoint currently returns a 500 error when the frontend attempts to retrieve meter readings. The root cause is a schema mismatch: the backend model defines 100+ fields that don't exist in the actual database schema, causing field mapping failures. This spec addresses fixing the schema alignment, mapper function, error handling, and ensuring the frontend receives valid data.

## Glossary

- **MeterReadingsWithSchema**: The backend model that defines the database schema and field mappings
- **toFrontendReading**: The mapper function that transforms database records to frontend-compatible format
- **Database Schema**: The actual columns in the meter_reading table (meter_reading_id, tenant_id, meter_id, reading_timestamp, data_point, value, unit, created_at, updated_at)
- **Tenant Filtering**: Ensuring meter readings are isolated per tenant for data security
- **Frontend Store**: The client-side state management that consumes meter reading responses

## Requirements

### Requirement 1: Align Database Schema with Model Definition

**User Story:** As a backend developer, I want the MeterReadingsWithSchema model to accurately reflect the actual database schema, so that field mapping doesn't fail and cause 500 errors.

#### Acceptance Criteria

1. WHEN the MeterReadingsWithSchema model is loaded, THE model SHALL only define fields that exist in the meter_reading table
2. WHEN the model schema is compared to the database, THE defined fields SHALL match the actual columns (meter_reading_id, tenant_id, meter_id, reading_timestamp, data_point, value, unit, created_at, updated_at)
3. WHEN a field is accessed that doesn't exist in the database, THE system SHALL not attempt to map it
4. WHEN the model is initialized with database data, THE initialization SHALL succeed without errors

### Requirement 2: Fix the toFrontendReading Mapper Function

**User Story:** As a frontend developer, I want the meter readings endpoint to return properly formatted data, so that the UI can display readings without errors.

#### Acceptance Criteria

1. WHEN a database record is passed to toFrontendReading, THE function SHALL only map fields that exist in the database
2. WHEN a field doesn't exist in the database record, THE function SHALL return null for that field instead of attempting to access it
3. WHEN the function processes a valid meter reading, THE returned object SHALL contain all expected frontend fields
4. WHEN the function processes a meter reading, THE returned object SHALL be serializable to JSON without errors

### Requirement 3: Add Proper Error Handling and Logging

**User Story:** As a system operator, I want clear error messages and logging when meter readings fail to fetch, so that I can diagnose issues quickly.

#### Acceptance Criteria

1. WHEN the meter readings endpoint encounters an error, THE endpoint SHALL log the error with context (tenant ID, query parameters, error message)
2. WHEN a database query fails, THE endpoint SHALL return a 500 error with a descriptive message
3. WHEN field mapping fails, THE error message SHALL indicate which field caused the failure
4. WHEN the endpoint succeeds, THE response SHALL include success status and data in a consistent format

### Requirement 4: Ensure Tenant Filtering Works Correctly

**User Story:** As a security officer, I want meter readings to be properly isolated by tenant, so that users cannot access readings from other tenants.

#### Acceptance Criteria

1. WHEN a user requests meter readings, THE query SHALL filter by the user's tenant ID
2. WHEN a meter reading is retrieved, THE reading's tenant_id SHALL match the requesting user's tenant ID
3. WHEN a user attempts to access a reading from another tenant, THE system SHALL return a 403 Forbidden error
4. WHEN the tenant context is missing, THE endpoint SHALL return a 401 Unauthorized error

### Requirement 5: Frontend Can Handle the Response Format

**User Story:** As a frontend developer, I want the meter readings response to match the expected format, so that the UI store can process it correctly.

#### Acceptance Criteria

1. WHEN the frontend receives a meter readings response, THE response SHALL have a success flag and data array
2. WHEN the response contains meter readings, EACH reading SHALL have id, meterId, timestamp, and value fields
3. WHEN the response contains pagination info, THE pagination SHALL include total, page, pageSize, totalPages, and hasMore
4. WHEN the frontend processes the response, THE store SHALL be able to update without errors

## Notes

- The actual database schema is minimal and correct; the model definition is the problem
- The toFrontendReading mapper already exists but tries to map non-existent fields
- Tenant filtering is partially implemented but needs verification
- Error handling should provide enough context for debugging without exposing sensitive data in production
