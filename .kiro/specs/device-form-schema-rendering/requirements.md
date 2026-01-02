# Requirements Document: Device Form Schema Rendering Fix

## Introduction

The device form is not rendering correctly from the schema. The form uses a tab-based layout where fields are organized into tabs and sections based on `formGrouping` metadata. However, the current implementation has issues with how field sections are passed to the BaseForm component, causing fields to not render properly when switching between tabs or when the form initially loads.

## Glossary

- **BaseForm**: A reusable form component that renders fields dynamically from a schema
- **Schema**: A metadata definition that describes form fields, their types, validation rules, and organization (tabs/sections)
- **FormGrouping**: Metadata that defines how a field should be organized in the form (tab name, section name, ordering)
- **FieldSections**: An object mapping section names to arrays of field names to be rendered
- **Tab**: A logical grouping of form sections (e.g., "General", "Registers")
- **Section**: A logical grouping of fields within a tab (e.g., "Device Information", "Status")

## Requirements

### Requirement 1: Form Fields Render Correctly from Schema

**User Story:** As a user, I want the device form to render all fields correctly based on the schema definition, so that I can see and edit all available device properties.

#### Acceptance Criteria

1. WHEN the device form loads THEN the system SHALL render all fields defined in the schema with `showOn: ['form']`
2. WHEN the device form loads THEN the system SHALL organize fields into tabs based on `formGrouping.tabName`
3. WHEN the device form loads THEN the system SHALL organize fields into sections within each tab based on `formGrouping.sectionName`
4. WHEN the device form loads THEN the system SHALL display fields in the correct order based on `formGrouping.fieldOrder`
5. WHEN the device form loads THEN the system SHALL display all required fields with a visual indicator

### Requirement 2: Tab Navigation Works Correctly

**User Story:** As a user, I want to navigate between form tabs and see the correct fields for each tab, so that I can organize my work by logical sections.

#### Acceptance Criteria

1. WHEN a user clicks on a tab THEN the system SHALL switch to that tab and display its fields
2. WHEN a user switches tabs THEN the system SHALL preserve the form data entered in other tabs
3. WHEN a user switches tabs THEN the system SHALL display only the fields belonging to the active tab
4. WHEN a user switches tabs THEN the system SHALL maintain the form's validation state

### Requirement 3: Field Sections Are Properly Organized

**User Story:** As a developer, I want the form to properly organize fields into sections so that the form layout is clean and logical.

#### Acceptance Criteria

1. WHEN rendering a tab THEN the system SHALL group fields by section name
2. WHEN rendering a section THEN the system SHALL display a section title
3. WHEN rendering a section THEN the system SHALL display all fields in that section in the correct order
4. WHEN a section has no visible fields THEN the system SHALL not render the section header

### Requirement 4: Form Renders Correctly on Initial Load

**User Story:** As a user, I want the form to render correctly when it first loads, so that I can immediately see and interact with the form fields.

#### Acceptance Criteria

1. WHEN the form first loads THEN the system SHALL render the first tab by default
2. WHEN the form first loads THEN the system SHALL render all fields for the active tab
3. WHEN the form first loads THEN the system SHALL not show any rendering errors or missing fields
4. WHEN the form first loads with an existing device THEN the system SHALL populate all fields with the device's current values

