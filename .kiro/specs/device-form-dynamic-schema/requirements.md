# Requirements Document: Device Form Dynamic Schema Loading

## Introduction

The Device Form component should dynamically load and render form fields from the device schema that is loaded into memory at login. Currently, the form is not properly displaying all schema-defined fields, preventing users from editing device information through a fully dynamic, schema-driven interface. This feature ensures that the device form adapts to schema changes without code modifications and provides a consistent user experience with other schema-driven forms in the application.

## Glossary

- **Device**: An entity representing a physical or logical device that can be monitored or controlled
- **Schema**: A formal definition of entity structure, including field types, validation rules, and UI metadata
- **BaseForm**: A reusable form component that renders fields dynamically based on schema definitions
- **Form Field**: An individual input element in a form, defined by schema metadata
- **Schema Cache**: In-memory storage of loaded schemas to avoid repeated API calls
- **Field Section**: A logical grouping of related form fields for better UI organization

## Requirements

### Requirement 1

**User Story:** As a user, I want the device form to display all editable fields defined in the device schema, so that I can view and modify all device properties without manual code changes.

#### Acceptance Criteria

1. WHEN the device form loads THEN the system SHALL fetch the device schema from the backend API
2. WHEN the schema is fetched THEN the system SHALL render all form fields defined in the schema's formFields section
3. WHEN a field has enumValues defined in the schema THEN the system SHALL render it as a dropdown with those values
4. WHEN a field is marked as required in the schema THEN the system SHALL display a required indicator and enforce validation
5. WHEN the form is submitted THEN the system SHALL validate all fields according to schema rules before sending to the backend

### Requirement 2

**User Story:** As a developer, I want the device form to use the same schema-loading mechanism as other entity forms, so that device form behavior is consistent with the rest of the application.

#### Acceptance Criteria

1. WHEN the device form mounts THEN the system SHALL use the useSchema hook to load the device schema
2. WHEN the schema is loading THEN the system SHALL display a loading indicator to the user
3. WHEN the schema fails to load THEN the system SHALL display an error message and allow the user to retry
4. WHEN the schema is successfully loaded THEN the system SHALL cache it to avoid redundant API calls
5. WHEN the form is unmounted THEN the system SHALL not clear the schema cache to allow reuse by other components

### Requirement 3

**User Story:** As a user, I want form fields to be organized logically by category, so that I can easily find and edit related device properties.

#### Acceptance Criteria

1. WHEN the device form renders THEN the system SHALL organize fields into logical sections (e.g., "Device Information", "Configuration")
2. WHEN a field section is defined THEN the system SHALL display a section header with the section name
3. WHEN multiple fields belong to a section THEN the system SHALL display them together under that section header
4. WHEN a field is not assigned to any section THEN the system SHALL display it in a default section

### Requirement 4

**User Story:** As a user, I want the device form to properly handle custom field types like JSON objects, so that I can manage complex device configurations.

#### Acceptance Criteria

1. WHEN a field has type 'object' or 'json' THEN the system SHALL render a custom field component (e.g., JsonGridEditor)
2. WHEN a custom field is rendered THEN the system SHALL allow the renderCustomField callback to handle its display
3. WHEN custom field rendering returns null THEN the system SHALL fall back to default field rendering
4. WHEN a custom field value changes THEN the system SHALL update the form data and mark the field as dirty

### Requirement 5

**User Story:** As a user, I want form validation to work correctly for all device fields, so that I can be confident the data I submit is valid.

#### Acceptance Criteria

1. WHEN a required field is empty THEN the system SHALL display a validation error message
2. WHEN a field has a maxLength constraint THEN the system SHALL prevent input beyond that length and display an error
3. WHEN a field has enumValues THEN the system SHALL only accept values from that list
4. WHEN validation fails THEN the system SHALL focus on the first field with an error and scroll it into view
5. WHEN all validations pass THEN the system SHALL submit the form data to the backend

