# Requirements Document: Contact List Filters

## Introduction

The contact list filters are not working properly. Users can select filter values (like role, active status) but the filters are not being applied to the displayed data. The issue spans both frontend and backend components.

## Glossary

- **Filter**: A UI control that allows users to narrow down the list of contacts based on specific field values
- **Filter Definition**: Schema-based configuration that determines which fields are filterable
- **Filter State**: The current values selected in the filter controls
- **Backend Filter**: Query parameters sent to the API to filter results
- **Contact**: A business contact entity (customer, vendor, contractor, etc.)
- **Schema**: The data structure definition that includes field types and metadata

## Requirements

### Requirement 1: Filter Generation from Schema

**User Story:** As a developer, I want filters to be automatically generated from the contact schema, so that I don't have to manually define which fields are filterable.

#### Acceptance Criteria

1. WHEN the contact schema is loaded, THE System SHALL identify all fields with `enumValues` or `boolean` type
2. WHEN a field has `enumValues` defined, THE System SHALL generate a select filter with those values as options
3. WHEN a field is of type `boolean`, THE System SHALL generate a select filter with "Yes" and "No" options
4. WHEN filters are generated, THE System SHALL include only fields marked with `showOn: ['list']`
5. WHEN the schema changes, THE System SHALL regenerate filters automatically

### Requirement 2: Filter State Management

**User Story:** As a user, I want to select filter values and have them persist in the UI, so that I can see what filters are currently applied.

#### Acceptance Criteria

1. WHEN a user selects a filter value, THE System SHALL store that value in the filter state
2. WHEN a user changes a filter value, THE System SHALL update the filter state immediately
3. WHEN a user clears filters, THE System SHALL reset all filter values to empty
4. WHEN filters are applied, THE System SHALL display a "Clear Filters" button
5. WHEN the page is refreshed, THE System SHALL preserve the current filter state (optional: via URL params)

### Requirement 3: Backend Filter Processing

**User Story:** As a backend developer, I want the API to properly handle filter parameters, so that filtered results are returned to the frontend.

#### Acceptance Criteria

1. WHEN the frontend sends filter parameters in the query string, THE API SHALL parse them correctly
2. WHEN a filter parameter is provided, THE API SHALL apply it to the database query
3. WHEN multiple filters are provided, THE API SHALL apply all of them (AND logic)
4. WHEN a filter value is empty or null, THE API SHALL ignore that filter
5. WHEN filters are applied, THE API SHALL return only matching contacts

### Requirement 4: Frontend Filter Application

**User Story:** As a frontend developer, I want filters to be sent to the API when fetching data, so that the list displays filtered results.

#### Acceptance Criteria

1. WHEN filters are changed, THE System SHALL trigger a new API request with the filter parameters
2. WHEN the API request is made, THE System SHALL include all active filters in the query string
3. WHEN the API returns filtered results, THE System SHALL display them in the contact list
4. WHEN filters are cleared, THE System SHALL fetch all contacts again
5. WHEN pagination is used with filters, THE System SHALL maintain filters across pages

### Requirement 5: Filter UI Rendering

**User Story:** As a user, I want to see filter controls in the contact list, so that I can easily filter the data.

#### Acceptance Criteria

1. WHEN the contact list loads, THE System SHALL display all available filters
2. WHEN a filter is a select type, THE System SHALL render it as a dropdown with options
3. WHEN a filter has a placeholder, THE System SHALL display it as the default option
4. WHEN a user selects a filter value, THE System SHALL show the selection in the dropdown
5. WHEN multiple filters are active, THE System SHALL display them all in the filter bar

