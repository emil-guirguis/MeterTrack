# Requirements Document

## Introduction

The system currently has inconsistencies between the API device models and the database structure. There are MongoDB models using different field names than the PostgreSQL database, and the meters API references both `brands` and `devices` tables. This feature will synchronize the API layer with the actual database structure to ensure data consistency and proper device management.

## Requirements

### Requirement 1

**User Story:** As a system administrator, I want the device API to accurately reflect the database structure, so that device data is consistent across all system components.

#### Acceptance Criteria

1. WHEN the device API is called THEN the system SHALL use the PostgreSQL database as the single source of truth
2. WHEN device data is retrieved THEN the system SHALL return fields that match the database schema (name, description, id, createdat, updatedat)
3. WHEN device data is created or updated THEN the system SHALL validate against the PostgreSQL schema constraints

### Requirement 2

**User Story:** As a developer, I want the MongoDB device model to be replaced with PostgreSQL integration, so that there's no confusion between different data sources.

#### Acceptance Criteria

1. WHEN the system starts THEN the system SHALL NOT reference the MongoDB Devices model
2. WHEN device operations are performed THEN the system SHALL use the DeviceService class exclusively
3. WHEN the codebase is reviewed THEN there SHALL be no remaining MongoDB device model references

### Requirement 3

**User Story:** As an API consumer, I want consistent device endpoints that work with the current database structure, so that I can reliably manage device information.

#### Acceptance Criteria

1. WHEN I call GET /devices THEN the system SHALL return all devices from the PostgreSQL devices table
2. WHEN I call POST /devices THEN the system SHALL create a new device in the PostgreSQL devices table
3. WHEN I call PUT /devices/:id THEN the system SHALL update the device in the PostgreSQL devices table
4. WHEN I call DELETE /devices/:id THEN the system SHALL remove the device from the PostgreSQL devices table

### Requirement 4

**User Story:** As a system user, I want the meters API to properly reference the devices table, so that meter-device relationships are maintained correctly.

#### Acceptance Criteria

1. WHEN creating a meter with device information THEN the system SHALL reference the devices table instead of brands table
2. WHEN updating meter device associations THEN the system SHALL maintain referential integrity with the devices table
3. WHEN retrieving meter information THEN the system SHALL include proper device details from the devices table

### Requirement 5

**User Story:** As a data administrator, I want existing brand data to be migrated to the devices table, so that no device information is lost during the synchronization.

#### Acceptance Criteria

1. WHEN the migration runs THEN the system SHALL copy all brand records to the devices table with proper field mapping
2. WHEN brand data exists THEN the system SHALL map brand.name to device.name and brand.model to device.description
3. WHEN the migration completes THEN the system SHALL update all meter references from brands to devices