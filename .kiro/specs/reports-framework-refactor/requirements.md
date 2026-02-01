# Requirements Document: Reports Module Framework Integration

## Introduction

The Reports module currently uses custom form implementation in ReportForm.tsx with manual state management, while ReportList.tsx uses BaseList from the framework. This creates inconsistency with other modules like Meters and Contacts that are fully integrated with the framework. This feature refactors ReportForm to use framework form components (BaseForm, FormContainer) and aligns both ReportForm and ReportList with the framework architecture, ensuring consistency and maintainability across the application.

## Glossary

- **BaseForm**: Framework component that provides schema-driven form rendering with automatic field management, validation, and tab organization
- **FormContainer**: Framework component that wraps forms with consistent styling and layout
- **BaseList**: Framework component that provides list rendering with filtering, sorting, pagination, and bulk actions
- **Schema**: Metadata definition that describes form structure, fields, tabs, sections, and validation rules
- **ReportForm**: Component for creating and editing reports with manual state management (current implementation)
- **ReportList**: Component for displaying reports using BaseList (current implementation)
- **Framework Components**: Reusable UI components from the framework library that follow consistent patterns
- **Manual State Management**: Direct useState hooks for form field management (current ReportForm approach)
- **Schema-Driven**: Form rendering controlled by metadata schema rather than hardcoded JSX (BaseForm approach)
- **Recipient Management**: Feature for adding/removing email recipients to reports
- **Cron Presets**: Predefined schedule options for report execution
- **Validation**: Process of checking form data for correctness before submission

## Requirements

### Requirement 1: Create Report Schema Definition

**User Story:** As a developer, I want to define a schema for the Report entity, so that ReportForm can use BaseForm for schema-driven rendering.

#### Acceptance Criteria

1. WHEN a Report schema is created, THE Schema SHALL define all report fields (name, type, schedule, recipients, enabled, config)
2. WHEN the schema is defined, THE Fields SHALL include proper validation rules (required, length, format)
3. WHEN the schema is defined, THE Fields SHALL be organized into logical tabs and sections
4. WHEN the schema is defined, THE Recipients field SHALL support dynamic list management
5. WHEN the schema is defined, THE Schedule field SHALL support cron expression validation

### Requirement 2: Refactor ReportForm to Use BaseForm

**User Story:** As a developer, I want ReportForm to use BaseForm component, so that it follows the same pattern as other modules and reduces custom code.

#### Acceptance Criteria

1. WHEN ReportForm is refactored, THE Component SHALL use BaseForm instead of manual form rendering
2. WHEN ReportForm uses BaseForm, THE Component SHALL pass the report entity and schema name to BaseForm
3. WHEN ReportForm uses BaseForm, THE Component SHALL remove all manual state management (useState for form fields)
4. WHEN ReportForm uses BaseForm, THE Component SHALL remove all manual validation logic (validation is handled by BaseForm)
5. WHEN ReportForm uses BaseForm, THE Component SHALL maintain all current functionality (recipient management, cron presets, validation)
6. WHEN ReportForm uses BaseForm, THE Component SHALL use FormContainer for consistent styling and layout

### Requirement 3: Implement Custom Field Rendering for Recipients

**User Story:** As a developer, I want to render the recipients field with custom UI (add/remove buttons), so that the user experience remains consistent with the current implementation.

#### Acceptance Criteria

1. WHEN the recipients field is rendered, THE Custom renderer SHALL display a list of email recipients
2. WHEN the recipients field is rendered, THE Custom renderer SHALL provide an input field and "Add" button for adding recipients
3. WHEN the recipients field is rendered, THE Custom renderer SHALL provide a remove button for each recipient
4. WHEN a recipient is added, THE Custom renderer SHALL validate the email format before adding
5. WHEN a recipient is added, THE Custom renderer SHALL prevent duplicate recipients
6. WHEN a recipient is removed, THE Custom renderer SHALL update the form data immediately

### Requirement 4: Implement Custom Field Rendering for Schedule

**User Story:** As a developer, I want to render the schedule field with cron presets, so that users can easily select common schedules.

#### Acceptance Criteria

1. WHEN the schedule field is rendered, THE Custom renderer SHALL display a dropdown with cron presets
2. WHEN the schedule field is rendered, THE Custom renderer SHALL display a text input for custom cron expressions
3. WHEN a preset is selected, THE Custom renderer SHALL update the text input with the preset value
4. WHEN a custom expression is entered, THE Custom renderer SHALL validate the cron format
5. WHEN the schedule field is rendered, THE Custom renderer SHALL display helpful text about cron format

### Requirement 5: Align ReportList with Framework Patterns

**User Story:** As a developer, I want ReportList to fully utilize BaseList features, so that it provides consistent list functionality with other modules.

#### Acceptance Criteria

1. WHEN ReportList is rendered, THE Component SHALL use BaseList for all list rendering
2. WHEN ReportList is rendered, THE Component SHALL display all report columns (name, type, schedule, recipients, status, created date)
3. WHEN ReportList is rendered, THE Component SHALL support filtering by name, type, and status
4. WHEN ReportList is rendered, THE Component SHALL support sorting by name, type, schedule, status, and created date
5. WHEN ReportList is rendered, THE Component SHALL support pagination
6. WHEN ReportList is rendered, THE Component SHALL support bulk actions (delete, toggle status)
7. WHEN ReportList is rendered, THE Component SHALL support export functionality

### Requirement 6: Maintain All Current Functionality

**User Story:** As a user, I want all current report features to work after refactoring, so that my workflow is not disrupted.

#### Acceptance Criteria

1. WHEN creating a report, THE System SHALL validate all required fields (name, type, recipients, schedule)
2. WHEN creating a report, THE System SHALL prevent empty or whitespace-only names
3. WHEN creating a report, THE System SHALL prevent duplicate recipients
4. WHEN creating a report, THE System SHALL validate email format for recipients
5. WHEN creating a report, THE System SHALL validate cron expression format for schedule
6. WHEN editing a report, THE System SHALL load all existing data into the form
7. WHEN editing a report, THE System SHALL allow modification of all fields
8. WHEN deleting a report, THE System SHALL remove it from the list
9. WHEN toggling report status, THE System SHALL enable/disable the report

### Requirement 7: Use Framework Styling and Components Consistently

**User Story:** As a developer, I want the Reports module to use framework styling, so that it looks consistent with other modules.

#### Acceptance Criteria

1. WHEN ReportForm is rendered, THE Component SHALL use FormContainer for layout
2. WHEN ReportForm is rendered, THE Component SHALL use BaseForm for form rendering
3. WHEN ReportList is rendered, THE Component SHALL use BaseList for list rendering
4. WHEN form fields are rendered, THE Component SHALL use framework form components (input, select, checkbox)
5. WHEN buttons are rendered, THE Component SHALL use framework button styles
6. WHEN errors are displayed, THE Component SHALL use framework error styling
7. WHEN the form is submitted, THE Component SHALL use framework loading and success states

### Requirement 8: Support Report Type Specific Configuration

**User Story:** As a developer, I want the schema to support different configurations for different report types, so that each report type can have specific fields.

#### Acceptance Criteria

1. WHEN a report type is selected, THE Schema SHALL support type-specific fields in the config section
2. WHEN a report type is changed, THE Form SHALL update to show type-specific fields
3. WHEN the form is submitted, THE System SHALL save type-specific configuration data
4. WHEN a report is loaded, THE Form SHALL display the saved type-specific configuration

### Requirement 9: Integrate ReportForm with ReportsPage

**User Story:** As a developer, I want ReportForm to integrate seamlessly with ReportsPage, so that the page layout and modal handling work correctly.

#### Acceptance Criteria

1. WHEN ReportForm is rendered in a modal, THE Component SHALL fit within the modal container
2. WHEN ReportForm is submitted, THE Component SHALL call the onSubmit callback with form data
3. WHEN ReportForm is cancelled, THE Component SHALL call the onCancel callback
4. WHEN ReportForm is loading, THE Component SHALL disable all form fields and show loading state
5. WHEN ReportForm encounters an error, THE Component SHALL display the error message to the user

</content>
</invoke>