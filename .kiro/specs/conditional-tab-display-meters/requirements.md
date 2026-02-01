# Requirements Document: Conditional Tab Display for Virtual vs Physical Meters

## Introduction

The meter form currently renders all tabs uniformly regardless of meter type. This feature enables conditional tab rendering based on whether a meter is physical or virtual, allowing different tabs to be displayed for each meter type. Physical meters will show the "Elements" tab for managing meter elements, while virtual meters will show a "Combined Meters" tab for managing the meters that compose the virtual meter.

## Glossary

- **Physical Meter**: A meter that represents an actual physical device measuring utility consumption
- **Virtual Meter**: A meter that is a calculated combination of other physical meters
- **Meter Type**: The classification of a meter as either physical or virtual (stored in `meter_type` field)
- **Tab**: A section in the form UI that groups related fields and components
- **Elements Tab**: The tab containing the ElementsGrid component for managing physical meter elements
- **Combined Meters Tab**: The tab containing the CombinedMetersTab component for managing virtual meter composition
- **Schema**: The metadata definition that describes form structure, fields, tabs, and sections
- **Conditional Rendering**: The process of showing or hiding UI elements based on runtime conditions

## Requirements

### Requirement 1: Support Meter Type Detection in Schema

**User Story:** As a form developer, I want to define which tabs should be shown for each meter type in the schema, so that the form can conditionally render tabs based on the meter's type.

#### Acceptance Criteria

1. WHEN a tab is defined in the schema, THE Schema Definition SHALL support an optional `visibleFor` property that specifies which meter types should display that tab
2. WHEN the `visibleFor` property is not specified, THE Tab SHALL be displayed for all meter types (backward compatible)
3. WHEN the `visibleFor` property is set to `['physical']`, THE Tab SHALL only be displayed when the meter is physical
4. WHEN the `visibleFor` property is set to `['virtual']`, THE Tab SHALL only be displayed when the meter is virtual
5. WHEN the `visibleFor` property is set to `['physical', 'virtual']`, THE Tab SHALL be displayed for both meter types

### Requirement 2: Filter Tabs Based on Meter Type at Runtime

**User Story:** As a user, I want the form to automatically show only the relevant tabs for my meter type, so that I see a clean interface without unnecessary tabs.

#### Acceptance Criteria

1. WHEN the MeterForm component renders, THE BaseForm SHALL receive the current meter type (physical or virtual)
2. WHEN BaseForm processes formTabs, THE useFormTabs hook SHALL filter tabs based on the meter type and the tab's `visibleFor` property
3. WHEN a tab is filtered out, THE Tab SHALL not appear in the tab list or be renderable
4. WHEN all tabs are filtered out for a meter type, THE Form SHALL still render without errors (graceful degradation)
5. WHEN the meter type changes, THE Tab list SHALL update to reflect the new meter type's visible tabs

### Requirement 3: Hide Elements Tab for Virtual Meters

**User Story:** As a user managing a virtual meter, I want the "Elements" tab to be hidden, so that I only see the "Combined Meters" tab for managing virtual meter composition.

#### Acceptance Criteria

1. WHEN a virtual meter is being edited, THE Elements Tab SHALL not be displayed
2. WHEN a virtual meter is being edited, THE Combined Meters Tab SHALL be displayed
3. WHEN switching from a physical meter to a virtual meter, THE Elements Tab SHALL disappear and Combined Meters Tab SHALL appear
4. WHEN the Elements Tab is hidden, THE Form SHALL not attempt to render ElementsGrid component

### Requirement 4: Show Elements Tab Only for Physical Meters

**User Story:** As a user managing a physical meter, I want the "Elements" tab to be visible, so that I can manage the meter's elements.

#### Acceptance Criteria

1. WHEN a physical meter is being edited, THE Elements Tab SHALL be displayed
2. WHEN a physical meter is being edited, THE Combined Meters Tab SHALL not be displayed
3. WHEN switching from a virtual meter to a physical meter, THE Combined Meters Tab SHALL disappear and Elements Tab SHALL appear
4. WHEN the Elements Tab is visible, THE Form SHALL render the ElementsGrid component

### Requirement 5: Maintain Backward Compatibility

**User Story:** As a developer, I want existing meter schemas to continue working without modification, so that I don't need to update all existing code.

#### Acceptance Criteria

1. WHEN a tab does not have a `visibleFor` property, THE Tab SHALL be displayed for all meter types
2. WHEN the meter type is not provided to BaseForm, THE All tabs SHALL be displayed (default behavior)
3. WHEN the meter type is null or undefined, THE All tabs SHALL be displayed
4. WHEN existing code does not specify `visibleFor`, THE Form behavior SHALL remain unchanged

### Requirement 6: Pass Meter Type to BaseForm

**User Story:** As a form developer, I want to pass the meter type to BaseForm, so that it can filter tabs appropriately.

#### Acceptance Criteria

1. WHEN MeterForm renders, THE MeterForm SHALL determine the meter type from the meter object or meterType prop
2. WHEN the meter type is determined, THE MeterForm SHALL pass it to BaseForm via a new `meterType` prop
3. WHEN BaseForm receives the meterType prop, THE BaseForm SHALL use it to filter tabs
4. WHEN the meter type changes, THE BaseForm SHALL re-filter tabs and update the display

### Requirement 7: Update useFormTabs Hook to Support Filtering

**User Story:** As a developer, I want the useFormTabs hook to filter tabs based on meter type, so that the tab filtering logic is centralized and reusable.

#### Acceptance Criteria

1. WHEN useFormTabs is called with formTabs and meterType, THE Hook SHALL filter tabs based on the `visibleFor` property
2. WHEN a tab's `visibleFor` includes the current meterType, THE Tab SHALL be included in the output
3. WHEN a tab's `visibleFor` does not include the current meterType, THE Tab SHALL be excluded from the output
4. WHEN a tab does not have `visibleFor` property, THE Tab SHALL be included in the output (backward compatible)
5. WHEN meterType is null or undefined, THE All tabs SHALL be included in the output

### Requirement 8: Update MeterWithSchema to Define Tab Visibility

**User Story:** As a schema maintainer, I want to define which tabs are visible for physical vs virtual meters, so that the form displays the correct tabs for each meter type.

#### Acceptance Criteria

1. WHEN MeterWithSchema is defined, THE Elements Tab SHALL have `visibleFor: ['physical']`
2. WHEN MeterWithSchema is defined, THE Combined Meters Tab SHALL have `visibleFor: ['virtual']`
3. WHEN MeterWithSchema is defined, THE Meter Tab SHALL not have `visibleFor` (visible for all types)
4. WHEN MeterWithSchema is defined, THE Additional Info Tab SHALL not have `visibleFor` (visible for all types)
