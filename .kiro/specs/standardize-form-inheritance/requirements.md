# Requirements Document: Standardize Form Inheritance Pattern

## Introduction

Currently, the application has inconsistent form implementations across different modules. Some forms (MeterForm, ContactForm) use the framework's BaseForm component with minimal code, while others (DeviceForm, LocationForm, UserForm) manually implement form logic with duplicated validation, error handling, and field rendering. This inconsistency creates maintenance burden, increases code duplication, and prevents forms from benefiting from framework improvements. The goal is to standardize all forms to use the BaseForm inheritance pattern, reducing code duplication and ensuring consistency across the application.

## Glossary

- **BaseForm**: Framework component that handles schema-based form rendering, validation, field management, and submission
- **Form Module**: A feature-specific form component (e.g., MeterForm, DeviceForm, LocationForm, UserForm, ContactForm)
- **Schema**: Field definitions and metadata loaded from backend API or defined locally
- **Field Sections**: Logical grouping of form fields for better UI organization
- **Custom Field Rendering**: Special rendering logic for specific field types (e.g., JsonGridEditor for object fields)
- **Validation**: Process of checking form data against field constraints before submission
- **Store**: State management layer for entity data (e.g., metersStore, devicesStore)

## Requirements

### Requirement 1

**User Story:** As a developer, I want all form modules to use a consistent implementation pattern, so that the codebase is maintainable and forms benefit from framework improvements.

#### Acceptance Criteria

1. WHEN a form module is created or updated THEN the form SHALL use the BaseForm component from the framework
2. WHEN BaseForm is used THEN the form module SHALL NOT duplicate validation logic, error handling, or field rendering
3. WHEN a form module uses BaseForm THEN the form SHALL pass schemaName, entity, store, and custom rendering functions as props
4. WHEN a form requires custom field rendering THEN the form SHALL use the renderCustomField prop instead of implementing field rendering logic
5. WHEN a form is refactored to use BaseForm THEN the form code SHALL be reduced by at least 60% compared to manual implementation

### Requirement 2

**User Story:** As a developer, I want to migrate all existing form modules to use BaseForm, so that the entire application follows the same pattern.

#### Acceptance Criteria

1. WHEN DeviceForm is refactored THEN it SHALL use BaseForm instead of useEntityFormWithStore and manual validation
2. WHEN LocationForm is refactored THEN it SHALL use BaseForm instead of useEntityFormWithStore and manual validation
3. WHEN UserForm is refactored THEN it SHALL use BaseForm instead of useEntityFormWithStore and manual validation
4. WHEN a form is refactored THEN all existing functionality (validation, field rendering, submission) SHALL be preserved
5. WHEN a form is refactored THEN the form SHALL maintain backward compatibility with existing onSubmit callbacks

### Requirement 3

**User Story:** As a developer, I want custom field rendering to be handled consistently, so that special field types work the same way across all forms.

#### Acceptance Criteria

1. WHEN a form has custom field rendering needs THEN the form SHALL define a renderCustomField function
2. WHEN renderCustomField is called THEN it SHALL return a React element for the custom field or null to use default rendering
3. WHEN a field requires special handling (e.g., JsonGridEditor, password fields) THEN renderCustomField SHALL provide that handling
4. WHEN renderCustomField is implemented THEN it SHALL receive fieldName, fieldDef, value, error, isDisabled, and onChange parameters
5. WHEN renderCustomField returns null THEN BaseForm SHALL render the field using default field type rendering

### Requirement 4

**User Story:** As a developer, I want field sections to be organized consistently, so that forms have predictable layouts.

#### Acceptance Criteria

1. WHEN a form defines field sections THEN the form SHALL pass fieldSections as a Record mapping section names to field names
2. WHEN fieldSections is provided THEN BaseForm SHALL render fields grouped by section with section headers
3. WHEN fieldSections is not provided THEN BaseForm SHALL render all fields in a single section
4. WHEN a form is refactored THEN field sections SHALL be preserved to maintain the same user experience
5. WHEN field sections are defined THEN the order of sections and fields within sections SHALL be respected

### Requirement 5

**User Story:** As a developer, I want validation to be handled by the framework, so that I don't need to implement validation logic in each form.

#### Acceptance Criteria

1. WHEN a form uses BaseForm THEN BaseForm SHALL handle all validation based on schema field definitions
2. WHEN validation fails THEN BaseForm SHALL display error messages for invalid fields
3. WHEN a field is invalid THEN the field SHALL be visually marked with error styling
4. WHEN validation passes THEN the form SHALL submit the data to the store
5. WHEN a form requires custom validation logic THEN the form SHALL pass a custom validator function to BaseForm

### Requirement 6

**User Story:** As a developer, I want form submission to be consistent, so that all forms handle success and error states the same way.

#### Acceptance Criteria

1. WHEN a form is submitted THEN BaseForm SHALL validate the form data before submission
2. WHEN validation passes THEN BaseForm SHALL call the store's create or update method
3. WHEN submission succeeds THEN BaseForm SHALL call the onCancel callback to close the form
4. WHEN submission fails THEN BaseForm SHALL display error messages and keep the form open
5. WHEN a form has a legacy onSubmit callback THEN BaseForm SHALL call it after successful submission for backward compatibility

### Requirement 7

**User Story:** As a developer, I want to ensure all forms are tested, so that refactoring doesn't introduce bugs.

#### Acceptance Criteria

1. WHEN a form is refactored THEN the form SHALL have unit tests that verify form rendering
2. WHEN a form is refactored THEN the form SHALL have tests that verify field validation
3. WHEN a form is refactored THEN the form SHALL have tests that verify form submission
4. WHEN a form is refactored THEN the form SHALL have tests that verify error handling
5. WHEN all forms are refactored THEN all existing tests SHALL pass without modification
