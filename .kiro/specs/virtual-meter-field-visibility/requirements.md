# Requirements Document: Virtual Meter Field Visibility

## Introduction

When adding a virtual meter, certain fields that are only relevant to physical meters should be hidden from the form. Virtual meters are calculated combinations of other physical meters and do not require device connection information. This feature hides the Network section, Serial Number field, and Device field when editing virtual meters.

## Glossary

- **Physical Meter**: A meter that represents an actual physical device measuring utility consumption
- **Virtual Meter**: A meter that is a calculated combination of other physical meters
- **Meter Type**: The classification of a meter as either physical or virtual (stored in `meter_type` field)
- **Field Visibility**: The ability to show or hide individual form fields based on runtime conditions
- **Section Visibility**: The ability to show or hide entire form sections based on runtime conditions
- **Schema**: The metadata definition that describes form structure, fields, tabs, and sections

## Requirements

### Requirement 1: Hide Network Section for Virtual Meters

**User Story:** As a user managing a virtual meter, I want the Network section to be hidden, so that I don't see irrelevant device connection fields.

#### Acceptance Criteria

1. WHEN a virtual meter is being edited, THE Network section (containing IP Address and Port fields) SHALL not be displayed
2. WHEN a physical meter is being edited, THE Network section SHALL be displayed
3. WHEN the Network section is hidden, THE Form layout SHALL adjust gracefully without empty space
4. WHEN switching from physical to virtual meter, THE Network section SHALL disappear

### Requirement 2: Hide Serial Number Field for Virtual Meters

**User Story:** As a user managing a virtual meter, I want the Serial Number field to be hidden, so that I only see fields relevant to virtual meters.

#### Acceptance Criteria

1. WHEN a virtual meter is being edited, THE Serial Number field SHALL not be displayed
2. WHEN a physical meter is being edited, THE Serial Number field SHALL be displayed
3. WHEN the Serial Number field is hidden, THE Form validation SHALL not require this field
4. WHEN switching from physical to virtual meter, THE Serial Number field SHALL disappear

### Requirement 3: Hide Device Field for Virtual Meters

**User Story:** As a user managing a virtual meter, I want the Device field to be hidden, so that I don't see device selection options.

#### Acceptance Criteria

1. WHEN a virtual meter is being edited, THE Device field SHALL not be displayed
2. WHEN a physical meter is being edited, THE Device field SHALL be displayed
3. WHEN the Device field is hidden, THE Form validation SHALL not require this field
4. WHEN switching from physical to virtual meter, THE Device field SHALL disappear

### Requirement 4: Support Field-Level Visibility in Schema

**User Story:** As a schema maintainer, I want to define field visibility at the schema level, so that the form automatically hides fields based on meter type.

#### Acceptance Criteria

1. WHEN a field is defined in the schema, THE Field definition SHALL support an optional `visibleFor` property
2. WHEN the `visibleFor` property is set to `['physical']`, THE Field SHALL only be displayed for physical meters
3. WHEN the `visibleFor` property is set to `['virtual']`, THE Field SHALL only be displayed for virtual meters
4. WHEN the `visibleFor` property is not specified, THE Field SHALL be displayed for all meter types (backward compatible)

### Requirement 5: Support Section-Level Visibility in Schema

**User Story:** As a schema maintainer, I want to define section visibility at the schema level, so that entire sections can be hidden based on meter type.

#### Acceptance Criteria

1. WHEN a section is defined in the schema, THE Section definition SHALL support an optional `visibleFor` property
2. WHEN the `visibleFor` property is set to `['physical']`, THE Section and all its fields SHALL only be displayed for physical meters
3. WHEN the `visibleFor` property is set to `['virtual']`, THE Section and all its fields SHALL only be displayed for virtual meters
4. WHEN the `visibleFor` property is not specified, THE Section SHALL be displayed for all meter types (backward compatible)

### Requirement 6: Filter Fields and Sections Based on Meter Type

**User Story:** As a developer, I want the form rendering logic to automatically filter fields and sections based on meter type, so that visibility rules are enforced consistently.

#### Acceptance Criteria

1. WHEN useFormTabs processes formTabs with meterType='virtual', THE Hook SHALL filter out fields with `visibleFor: ['physical']`
2. WHEN useFormTabs processes formTabs with meterType='virtual', THE Hook SHALL filter out sections with `visibleFor: ['physical']`
3. WHEN useFormTabs processes formTabs with meterType='physical', THE Hook SHALL include all fields and sections with `visibleFor: ['physical']`
4. WHEN meterType is null or undefined, THE Hook SHALL include all fields and sections (default behavior)

### Requirement 7: Update MeterWithSchema to Define Field Visibility

**User Story:** As a schema maintainer, I want to update the meter schema to hide device-related fields for virtual meters.

#### Acceptance Criteria

1. WHEN MeterWithSchema is defined, THE Serial Number field SHALL have `visibleFor: ['physical']`
2. WHEN MeterWithSchema is defined, THE Device field SHALL have `visibleFor: ['physical']`
3. WHEN MeterWithSchema is defined, THE Network section SHALL have `visibleFor: ['physical']`
4. WHEN MeterWithSchema is defined, THE Name, Location, and Status fields SHALL not have `visibleFor` (visible for all types)

### Requirement 8: Maintain Backward Compatibility

**User Story:** As a developer, I want existing schemas to continue working without modification, so that I don't need to update all existing code.

#### Acceptance Criteria

1. WHEN a field does not have a `visibleFor` property, THE Field SHALL be displayed for all meter types
2. WHEN a section does not have a `visibleFor` property, THE Section SHALL be displayed for all meter types
3. WHEN the meter type is not provided to BaseForm, THE All fields and sections SHALL be displayed (default behavior)
4. WHEN existing code does not specify `visibleFor`, THE Form behavior SHALL remain unchanged
