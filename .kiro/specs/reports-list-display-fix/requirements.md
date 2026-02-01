# Requirements Document: Reports List Display and Selection Features

## Introduction

The Reports module has several critical issues preventing proper functionality:

1. **Reports list not displaying columns** - The list appears empty with no columns shown despite columns being defined
2. **Missing meter/element selection** - Users cannot select which meters and elements to include in reports
3. **Missing register selection** - Users cannot select specific registers for reports
4. **Missing HTML formatting support** - Reports don't support HTML formatting in output

This spec addresses these issues by fixing the column display bug, adding meter/element/register selection components, and implementing HTML formatting support.

## Glossary

- **DualListSelector**: Framework component for selecting multiple items from available options
- **Meter**: A device that measures energy consumption
- **Element**: A specific measurement point within a meter
- **Register**: A specific data field within an element (e.g., kWh, kVAR)
- **HTML Formatting**: Option to format report output as HTML instead of plain text
- **Schema**: Metadata definition that describes form structure and fields
- **Custom Field Renderer**: Function that renders complex form fields beyond standard input types

## Requirements

### Requirement 1: Fix Reports List Column Display

**User Story:** As a user, I want to see the reports list with all columns displayed, so that I can view report information.

#### Acceptance Criteria

1. WHEN the Reports page loads, THE ReportList SHALL display all defined columns (name, type, schedule, recipients, status, created date)
2. WHEN the ReportList renders, THE columns SHALL be properly aligned and visible
3. WHEN the ReportList renders, THE column headers SHALL be sortable where applicable
4. WHEN the ReportList renders, THE data SHALL be properly populated from the reports store

### Requirement 2: Add Meter and Element Selection

**User Story:** As a user, I want to select which meters and elements to include in my report, so that I can customize report scope.

#### Acceptance Criteria

1. WHEN creating or editing a report, THE form SHALL display a meter/element selector field
2. WHEN the selector is displayed, THE user SHALL be able to select multiple meters
3. WHEN a meter is selected, THE user SHALL be able to select specific elements from that meter
4. WHEN elements are selected, THE form SHALL store the selected meter IDs and element IDs
5. WHEN the form is submitted, THE selected meter and element IDs SHALL be saved with the report

### Requirement 3: Add Register Selection

**User Story:** As a user, I want to select specific registers to include in my report, so that I can focus on relevant data.

#### Acceptance Criteria

1. WHEN creating or editing a report, THE form SHALL display a register selector field
2. WHEN the selector is displayed, THE user SHALL be able to select multiple registers
3. WHEN registers are selected, THE form SHALL store the selected register IDs
4. WHEN the form is submitted, THE selected register IDs SHALL be saved with the report
5. WHEN a report is loaded, THE previously selected registers SHALL be displayed

### Requirement 4: Add HTML Formatting Support

**User Story:** As a user, I want to enable HTML formatting for my reports, so that reports can include formatted content.

#### Acceptance Criteria

1. WHEN creating or editing a report, THE form SHALL display an HTML formatting option
2. WHEN the option is enabled, THE report output SHALL be formatted as HTML
3. WHEN the option is disabled, THE report output SHALL be plain text
4. WHEN the form is submitted, THE HTML formatting preference SHALL be saved with the report
5. WHEN a report is loaded, THE HTML formatting preference SHALL be displayed

### Requirement 5: Update Report Schema

**User Story:** As a developer, I want the Report schema to include new fields for meter/element/register selection and HTML formatting, so that the form can render these fields.

#### Acceptance Criteria

1. WHEN the Report schema is loaded, THE schema SHALL include `meter_ids` field (array type)
2. WHEN the Report schema is loaded, THE schema SHALL include `element_ids` field (array type)
3. WHEN the Report schema is loaded, THE schema SHALL include `register_ids` field (array type)
4. WHEN the Report schema is loaded, THE schema SHALL include `html_format` field (boolean type)
5. WHEN the schema is used in forms, THE new fields SHALL be properly validated and stored

### Requirement 6: Create Meter/Element Selector Component

**User Story:** As a developer, I want a reusable MeterElementSelector component, so that users can easily select meters and elements.

#### Acceptance Criteria

1. WHEN the MeterElementSelector is rendered, THE component SHALL display available meters
2. WHEN a meter is selected, THE component SHALL display available elements for that meter
3. WHEN elements are selected, THE component SHALL update the form data
4. WHEN the component is used in forms, THE selected values SHALL be properly stored and retrieved
5. WHEN the component is disabled, THE user SHALL not be able to make selections

### Requirement 7: Create Register Selector Component

**User Story:** As a developer, I want a reusable RegisterSelector component, so that users can easily select registers.

#### Acceptance Criteria

1. WHEN the RegisterSelector is rendered, THE component SHALL display available registers
2. WHEN registers are selected, THE component SHALL update the form data
3. WHEN the component is used in forms, THE selected values SHALL be properly stored and retrieved
4. WHEN the component is disabled, THE user SHALL not be able to make selections
5. WHEN registers are loaded, THE component SHALL display register names and descriptions

### Requirement 8: Integrate New Components into ReportForm

**User Story:** As a developer, I want ReportForm to use the new selector components, so that users can select meters, elements, and registers.

#### Acceptance Criteria

1. WHEN ReportForm is rendered, THE custom field renderers SHALL render MeterElementSelector for meter/element fields
2. WHEN ReportForm is rendered, THE custom field renderers SHALL render RegisterSelector for register field
3. WHEN ReportForm is rendered, THE HTML formatting checkbox SHALL be displayed
4. WHEN the form is submitted, THE selected values SHALL be included in the submission data
5. WHEN a report is loaded, THE previously selected values SHALL be displayed in the form

### Requirement 9: Maintain Backward Compatibility

**User Story:** As a developer, I want existing reports to continue working, so that no data is lost during the update.

#### Acceptance Criteria

1. WHEN existing reports are loaded, THE form SHALL handle missing meter/element/register fields gracefully
2. WHEN existing reports are loaded, THE HTML formatting field SHALL default to false
3. WHEN existing reports are edited, THE new fields SHALL be optional
4. WHEN the API returns reports without new fields, THE form SHALL not display errors
