# Requirements Document: Meter Form Field Display

## Introduction

The Meter Form Field Display feature ensures that the frontend meter form only displays fields that exist in the backend meter entity model. Currently, the frontend form attempts to display `port` and `installation_date` fields that are not defined in the backend Meter model, causing validation warnings and preventing proper form population during edit operations. This feature resolves the field mismatch between frontend and backend by establishing a single source of truth for meter entity fields and ensuring the form configuration aligns with the backend schema.

## Glossary

- **Meter Entity**: The backend data model representing a meter device with properties like name, type, serial number, IP address, etc.
- **Form Fields**: Fields displayed in the frontend meter form for user input during create and edit operations
- **Entity Fields**: Fields that exist in the backend Meter model and database schema
- **Schema Definition**: The centralized definition of meter fields, types, and validation rules
- **Field Validation**: The process of checking that form fields correspond to actual backend entity fields
- **Backend Schema**: The authoritative definition of meter entity structure from the backend API

## Requirements

### Requirement 1

**User Story:** As a developer, I want the frontend meter form to only display fields that exist in the backend meter entity, so that form validation warnings are eliminated and edit operations work correctly.

#### Acceptance Criteria

1. WHEN the meter form is rendered THEN the system SHALL only display fields that are defined in the backend Meter entity schema
2. WHEN a meter is being edited THEN the system SHALL populate all form fields with values from the backend entity
3. WHEN the form is submitted THEN the system SHALL not attempt to save fields that don't exist in the backend entity
4. WHEN the backend schema is updated THEN the system SHALL automatically reflect those changes in the form without requiring frontend code changes

### Requirement 2

**User Story:** As a system administrator, I want to understand which fields are available for the meter entity, so that I can configure the form correctly and avoid field mismatches.

#### Acceptance Criteria

1. WHEN reviewing the meter field configuration THEN the system SHALL clearly document which fields are form fields and which are entity fields
2. WHEN the backend API returns the meter schema THEN the system SHALL include all field definitions with their types and validation rules
3. WHEN a field is removed from the backend entity THEN the system SHALL provide clear indication that the field is no longer available
4. WHEN the frontend loads the meter schema THEN the system SHALL validate that all form fields exist in the entity fields

### Requirement 3

**User Story:** As a developer, I want to have a single source of truth for meter field definitions, so that frontend and backend stay synchronized and reduce maintenance burden.

#### Acceptance Criteria

1. WHEN the backend Meter model is initialized THEN the system SHALL use the centralized field configuration from meterFieldConfig.js
2. WHEN the backend API exposes the meter schema THEN the system SHALL include all fields defined in the centralized configuration
3. WHEN the frontend loads the meter schema THEN the system SHALL use the backend schema as the authoritative source for available fields
4. WHEN a field is added to the backend configuration THEN the system SHALL automatically be available in the frontend form without code changes

### Requirement 4

**User Story:** As a developer, I want to identify and remove fields that don't exist in the backend entity, so that the form accurately reflects the actual meter data model.

#### Acceptance Criteria

1. WHEN analyzing the current meter form configuration THEN the system SHALL identify all fields that are not defined in the backend Meter entity
2. WHEN a field is identified as non-existent THEN the system SHALL remove it from the frontend form configuration
3. WHEN the form is updated THEN the system SHALL verify that no validation warnings are generated for missing fields
4. WHEN the form is tested with edit operations THEN the system SHALL successfully populate all fields without warnings

