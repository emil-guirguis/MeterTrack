# Requirements Document: User Permissions Checkboxes Display

## Introduction

The User form is missing the permissions JSONB checkboxes. The permissions field is defined in the schema and has a custom renderer in the UserForm component, but it's being excluded from the form rendering. Users cannot currently manage permissions through the UI, which prevents proper access control configuration.

## Glossary

- **Permissions**: Access control rules stored as a JSONB field in the database
- **Checkboxes**: UI controls for selecting/deselecting individual permissions
- **Flat Array Format**: Permissions as a simple array of permission strings (e.g., `['user:create', 'meter:read']`)
- **Nested Object Format**: Permissions as a hierarchical object with modules and actions
- **Module**: A functional area (user, location, contact, meter, device, settings, template)
- **Action**: An operation within a module (create, read, update, delete)
- **BaseForm**: The framework component that renders forms based on schema definitions
- **Custom Field Renderer**: A function that provides custom UI rendering for specific form fields

## Requirements

### Requirement 1: Display Permissions Checkboxes in User Form

**User Story:** As an administrator, I want to see and manage user permissions through checkboxes in the user form, so that I can control what actions each user can perform.

#### Acceptance Criteria

1. WHEN a user form is opened for editing, THE permissions field SHALL be displayed with checkboxes for all available permissions
2. WHEN the form loads, THE checkboxes SHALL be pre-populated with the user's current permissions
3. WHEN a user has no permissions, THE form SHALL display all checkboxes in an unchecked state
4. WHEN permissions are grouped by module, THE form SHALL display them organized by module (User, Location, Contact, Meter, Device, Settings, Email Templates)
5. WHEN a checkbox is toggled, THE form's internal state SHALL update to reflect the permission change

### Requirement 2: Persist Permissions Changes

**User Story:** As an administrator, I want permission changes to be saved when I submit the form, so that the user's access is updated.

#### Acceptance Criteria

1. WHEN the form is submitted with permission changes, THE permissions SHALL be sent to the backend as a flat array format
2. WHEN permissions are saved, THE backend SHALL validate the permissions structure before storing
3. WHEN the form is reloaded after saving, THE previously selected permissions SHALL be displayed as checked
4. IF permission validation fails, THE form SHALL display an error message and prevent submission

### Requirement 3: Handle Permissions for New Users

**User Story:** As an administrator, I want to assign permissions when creating a new user, so that the user has appropriate access from the start.

#### Acceptance Criteria

1. WHEN creating a new user, THE permissions field SHALL be displayed with all checkboxes unchecked
2. WHEN no permissions are selected for a new user, THE form SHALL allow submission with empty permissions
3. WHEN permissions are selected for a new user, THE form SHALL include them in the creation request
4. WHEN a new user is created with permissions, THE permissions SHALL be stored correctly in the database

### Requirement 4: Display Permissions in Organized Groups

**User Story:** As an administrator, I want permissions organized by module, so that I can easily find and manage related permissions.

#### Acceptance Criteria

1. WHEN the permissions section is displayed, THE permissions SHALL be grouped by module name
2. WHEN modules are displayed, THE order SHALL be consistent (User, Location, Contact, Meter, Device, Template, Settings)
3. WHEN a module section is displayed, THE module name SHALL be clearly labeled with a visual separator
4. WHEN permissions within a module are displayed, THE action names SHALL be formatted for readability (e.g., "Create" instead of "create")

</content>
</invoke>