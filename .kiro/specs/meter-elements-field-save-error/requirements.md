# Requirements: Fix Meter Elements Field Save Error

## Introduction

When saving a meter form, the system attempts to save the "elements" field directly to the meter table, causing a database error: "Column 'elements' does not exist in table 'meter'". The "elements" field is a special non-database field used only for custom rendering of the ElementsGrid component and should not be included in the API request payload.

## Glossary

- **Form Field**: A field that appears in the form UI
- **Database Field**: A column that exists in the database table
- **Custom Field**: A form field that has custom rendering logic and is not directly stored in the database
- **dbField**: Schema property indicating the database column name (null means no database column)
- **formDataToEntity**: Function that transforms form data into API request payload
- **Payload**: The data sent to the backend API

## Requirements

### Requirement 1: Filter Non-Database Fields from API Payload

**User Story:** As a developer, I want the form submission to exclude fields with `dbField: null`, so that the API doesn't receive invalid column references.

#### Acceptance Criteria

1. WHEN a form is submitted, THE formDataToEntity function SHALL exclude all fields where `dbField` is null
2. WHEN the meter form is saved, THE "elements" field SHALL NOT be included in the API request payload
3. WHEN formDataToEntity processes form data, THE resulting payload SHALL only contain fields that have valid database columns
4. WHEN a field has `dbField: null`, THE field SHALL be treated as a custom-rendered field and excluded from the payload

### Requirement 2: Preserve Custom Field Rendering

**User Story:** As a user, I want the ElementsGrid to continue working after the form is saved, so that I can manage meter elements without errors.

#### Acceptance Criteria

1. WHEN the meter form is saved successfully, THE ElementsGrid component SHALL remain functional
2. WHEN the form submission completes, THE "elements" field rendering SHALL not be affected
3. WHEN a meter is edited, THE ElementsGrid SHALL display the existing elements correctly

### Requirement 3: Maintain Backward Compatibility

**User Story:** As a developer, I want existing forms to continue working, so that the fix doesn't break other features.

#### Acceptance Criteria

1. WHEN formDataToEntity processes form data, THE function SHALL handle both formTabs and formFields definitions
2. WHEN a field is defined in formTabs, THE dbField property SHALL be respected
3. WHEN a field is defined in formFields, THE dbField property SHALL be respected
4. WHEN formDataToEntity encounters fields without dbField property, THE function SHALL treat them as database fields (backward compatibility)

