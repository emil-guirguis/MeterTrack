# Requirements Document: Meter List Filters

## Introduction

The meter list is missing the filter section that allows users to filter meters by various criteria. Users should be able to filter by fields like active status, location, device, and other relevant meter attributes to quickly find specific meters.

## Glossary

- **Filter**: A UI control that allows users to narrow down the list of meters based on specific field values
- **Filter Definition**: Schema-based configuration that determines which fields are filterable
- **Filter State**: The current values selected in the filter controls
- **Backend Filter**: Query parameters sent to the API to filter results
- **Meter**: A device that measures and records consumption data (electricity, water, gas, etc.)
- **Schema**: The data structure definition that includes field types and metadata

## Requirements

### Requirement 1: Filter Generation from Schema

**User Story:** As a developer, I want filters to be automatically generated from the meter schema, so that I don't have to manually define which fields are filterable.

#### Acceptance Criteria

1. WHEN the meter schema is loaded, THE System SHALL identify all fields with `enumValues` or `boolean` type
2. WHEN a field has `enumValues` defined, THE System SHALL generate a select filter with those values as options
3. WHEN a field is of type `boolean`, THE System SHALL generate a select filter with "Yes" and "No" options
4. WHEN filters are generated, THE System SHALL include only fields marked with `showOn: ['list']`
5. WHEN the schema changes, THE System SHALL regenerate filters automatically

### Requirement 2: Filter Section Display

**User Story:** As a user, I want to see filter controls in the meter list, so that I can easily filter the data.

#### Acceptance Criteria

1. WHEN the meter list loads, THE System SHALL display all available filters in a dedicated filter section
2. WHEN a filter is a select type, THE System SHALL render it as a dropdown with options
3. WHEN a filter has a placeholder, THE System SHALL display it as the default option
4. WHEN a user selects a filter value, THE System SHALL show the selection in the dropdown
5. WHEN multiple filters are active, THE System SHALL display them all in the filter bar

### Requirement 3: Filter State Management

**User Story:** As a user, I want to select filter values and have them persist in the UI, so that I can see what filters are currently applied.

#### Acceptance Criteria

1. WHEN a user selects a filter value, THE System SHALL store that value in the filter state
2. WHEN a user changes a filter value, THE System SHALL update the filter state immediately
3. WHEN a user clears filters, THE System SHALL reset all filter values to empty
4. WHEN filters are applied, THE System SHALL display a "Clear Filters" button
5. WHEN the page is refreshed, THE System SHALL preserve the current filter state (optional: via URL params)

### Requirement 4: Filter Application to Data

**User Story:** As a user, I want filters to be applied to the meter list, so that I see only the meters matching my criteria.

#### Acceptance Criteria

1. WHEN filters are changed, THE System SHALL trigger a new API request with the filter parameters
2. WHEN the API request is made, THE System SHALL include all active filters in the query string
3. WHEN the API returns filtered results, THE System SHALL display them in the meter list
4. WHEN filters are cleared, THE System SHALL fetch all meters again
5. WHEN pagination is used with filters, THE System SHALL maintain filters across pages

### Requirement 5: Filter UI Styling

**User Story:** As a user, I want the filter section to be visually distinct and easy to use, so that I can quickly identify and interact with filters.

#### Acceptance Criteria

1. WHEN the filter section is displayed, THE System SHALL render it above the meter data table
2. WHEN filters are rendered, THE System SHALL apply consistent styling with proper spacing and alignment
3. WHEN a filter control is focused, THE System SHALL provide visual feedback (border highlight, shadow)
4. WHEN the viewport is small, THE System SHALL stack filters vertically for better readability
5. WHEN no filters are active, THE System SHALL still display the filter section for user access
