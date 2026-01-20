# Requirements Document: Database-Driven Dashboard

## Introduction

This feature adds a comprehensive, database-driven dashboard to display energy metrics from meter readings with customizable column selection, time frames, and visualization options. Users can create multiple dashboard cards, each displaying selected power columns from the meter_reading table with flexible aggregation and chart types. The dashboard supports full CRUD operations and manual refresh capabilities.

## Glossary

- **Dashboard**: A user-facing page displaying energy metric cards
- **Dashboard_Card**: A single card on the dashboard displaying aggregated data for selected columns
- **Meter_Element**: A specific measurement point within a meter (e.g., a circuit or phase)
- **Power_Column**: A numeric column from the meter_reading table representing power or energy data (e.g., kWh, kW, voltage, current)
- **Time_Frame**: A date range for aggregating and displaying data
- **Preset_Range**: Pre-defined time frame options (last month, this month to date, since installation)
- **Visualization_Type**: Chart format for displaying data (pie, line, candlestick, etc.)
- **Tenant**: Organization or customer account
- **Meter_Reading**: Individual power measurement record with timestamp and power values

## Requirements

### Requirement 1: Dashboard Card Data Structure

**User Story:** As a system architect, I want a well-structured PostgreSQL schema for dashboard cards, so that users can store and retrieve their custom dashboard configurations.

#### Acceptance Criteria

1. THE Dashboard_Card table SHALL store card name, description, meter element reference, and tenant ID
2. THE Dashboard_Card table SHALL include columns for time_frame_type (custom, last_month, this_month_to_date, since_installation)
3. THE Dashboard_Card table SHALL include custom_start_date and custom_end_date columns for custom date ranges
4. THE Dashboard_Card table SHALL include a visualization_type column (pie, line, candlestick, etc.)
5. THE Dashboard_Card table SHALL store a list of selected power columns from the meter_reading table
6. THE Dashboard_Card table SHALL include created_by_user_id, created_at, updated_at timestamps
7. WHEN a dashboard card is created, THE system SHALL validate that the referenced meter element exists
8. WHEN a dashboard card is created, THE system SHALL validate that the tenant_id matches the authenticated user's tenant
9. WHEN a dashboard card is created, THE system SHALL validate that all selected power columns exist in the meter_reading table

### Requirement 2: Power Column Discovery

**User Story:** As a dashboard user, I want to see all available power columns from the meter_reading table, so that I can select which metrics to display.

#### Acceptance Criteria

1. WHEN a user opens the dashboard card creation form, THE system SHALL retrieve all numeric power columns from the meter_reading table
2. THE system SHALL auto-populate a multi-select dropdown with available power column names
3. WHEN retrieving power columns, THE system SHALL filter out non-numeric columns and system columns (id, created_at, updated_at)
4. WHEN retrieving power columns, THE system SHALL include column metadata (name, data type)
5. THE system SHALL cache the list of available power columns to avoid repeated schema queries
6. WHEN the meter_reading table schema changes, THE system SHALL invalidate the cache

### Requirement 3: Dashboard Card CRUD Operations

**User Story:** As a dashboard user, I want to create, edit, and delete dashboard cards, so that I can customize my dashboard layout.

#### Acceptance Criteria

1. WHEN a user creates a new dashboard card, THE system SHALL store the card configuration in the Dashboard_Card table
2. WHEN a user edits a dashboard card, THE system SHALL update all configuration values (name, columns, time frame, visualization)
3. WHEN a user deletes a dashboard card, THE system SHALL remove it from the Dashboard_Card table
4. WHEN a user creates or updates a card, THE system SHALL validate all input fields before saving
5. WHEN a user creates a card, THE system SHALL set the created_by_user_id to the authenticated user
6. WHEN a user updates a card, THE system SHALL update the updated_at timestamp
7. THE system SHALL filter all dashboard card operations by tenant_id to ensure data isolation

### Requirement 4: Dashboard Card Display

**User Story:** As a dashboard user, I want to see my dashboard cards displayed on the dashboard page, so that I can view my configured metrics at a glance.

#### Acceptance Criteria

1. WHEN the dashboard page loads, THE system SHALL retrieve all dashboard cards for the authenticated user's tenant
2. WHEN displaying dashboard cards, THE system SHALL render each card with the configured visualization type
3. WHEN displaying a card, THE system SHALL show the card name, meter element, and time frame information
4. WHEN displaying a card, THE system SHALL show aggregated values for each selected power column
5. WHEN a card is configured with multiple power columns, THE system SHALL display all selected columns in the card
6. WHEN displaying card data, THE system SHALL include a drill-down link to view detailed meter readings
7. THE system SHALL display cards in a responsive grid layout

### Requirement 5: Data Aggregation for Selected Columns

**User Story:** As a dashboard user, I want to see aggregated values for my selected power columns, so that I can understand consumption patterns.

#### Acceptance Criteria

1. WHEN a dashboard card is displayed, THE system SHALL aggregate the selected power columns from meter readings within the configured time frame
2. WHEN aggregating power columns, THE system SHALL use SUM for energy columns (kWh) and MAX for instantaneous power columns (kW)
3. WHEN a user selects 'last_month' preset, THE system SHALL calculate the previous calendar month
4. WHEN a user selects 'this_month_to_date' preset, THE system SHALL calculate from the first day of current month to today
5. WHEN a user selects 'since_installation' preset, THE system SHALL calculate from the earliest meter reading date to today
6. WHEN a custom date range is provided, THE system SHALL validate that start_date is before end_date
7. WHEN card data is requested, THE system SHALL return aggregated values grouped by selected power column

### Requirement 6: Visualization Support

**User Story:** As a dashboard user, I want to display metrics in different chart formats, so that I can choose the visualization that best represents the data.

#### Acceptance Criteria

1. THE Dashboard_Card table SHALL support visualization_type values: 'pie', 'line', 'candlestick', and other extensible types
2. WHEN a dashboard card is configured with a visualization type, THE system SHALL store this preference
3. WHEN dashboard data is retrieved, THE system SHALL include the visualization_type for each card
4. WHEN a user changes the visualization type, THE system SHALL update the dashboard card configuration
5. THE system SHALL validate that the selected visualization_type is supported before saving

### Requirement 7: Meter Element Filtering

**User Story:** As a dashboard user, I want to select specific meter elements for my dashboard cards, so that I can focus on relevant measurement points.

#### Acceptance Criteria

1. WHEN creating a dashboard card, THE system SHALL allow selection from available meter elements for the user's tenant
2. WHEN retrieving available meter elements, THE system SHALL filter by tenant_id
3. WHEN a dashboard card references a meter element, THE system SHALL validate the element exists and belongs to the tenant
4. WHEN a meter element is deleted, THE system SHALL handle dashboard cards referencing it appropriately
5. THE system SHALL return meter element metadata (name, type, location) for dashboard card configuration UI

### Requirement 8: Dashboard Refresh Functionality

**User Story:** As a dashboard user, I want to refresh dashboard card data, so that I can see the latest meter readings and updated aggregations.

#### Acceptance Criteria

1. WHEN a user clicks the refresh button on a dashboard card, THE system SHALL re-query the meter readings for that card's time frame
2. WHEN a user clicks a global refresh button, THE system SHALL refresh all dashboard cards on the page
3. WHEN refreshing a card, THE system SHALL recalculate aggregations for all selected power columns
4. WHEN refreshing a card, THE system SHALL update the display with new values
5. WHEN a refresh is in progress, THE system SHALL show a loading indicator on the card
6. WHEN a refresh completes, THE system SHALL update the last_refreshed timestamp on the card

### Requirement 9: Data Aggregation Performance

**User Story:** As a system administrator, I want dashboard queries to perform efficiently, so that the dashboard remains responsive even with large datasets.

#### Acceptance Criteria

1. THE Dashboard_Card table SHALL have indexes on (tenant_id, meter_element_id, created_by_user_id)
2. WHEN querying dashboard data, THE system SHALL use indexed columns for filtering
3. WHEN aggregating meter readings, THE system SHALL use efficient SQL aggregation functions (SUM, MAX)
4. THE system SHALL support pagination or limiting of dashboard cards if needed

### Requirement 10: Drill-Down to Detailed Meter Readings

**User Story:** As an energy analyst, I want to drill down from aggregated dashboard metrics to view individual meter readings in a data grid, so that I can investigate specific consumption patterns and anomalies.

#### Acceptance Criteria

1. WHEN a user clicks on a dashboard card, THE system SHALL display detailed meter readings for the selected meter element within the configured time frame
2. WHEN displaying detailed readings, THE system SHALL show a data grid with columns for timestamp and all selected power columns
3. WHEN a user drills down from a card, THE system SHALL filter meter readings to the same time frame as the aggregated metric
4. WHEN displaying meter readings in the grid, THE system SHALL sort by timestamp in descending order (newest first) by default
5. WHEN displaying meter readings, THE system SHALL support pagination to handle large datasets efficiently
6. WHEN displaying meter readings, THE system SHALL include row count and pagination controls
7. WHEN a user applies filters or sorting in the data grid, THE system SHALL update the display without reloading the entire dashboard
8. THE system SHALL filter all meter readings by tenant_id to ensure data isolation
9. WHEN retrieving detailed meter readings, THE system SHALL include the meter element name and time frame information in the view header

### Requirement 11: Data Export to CSV

**User Story:** As a dashboard user, I want to export meter reading data to CSV format, so that I can analyze the data in external tools or share it with others.

#### Acceptance Criteria

1. WHEN viewing detailed meter readings in the data grid, THE system SHALL provide an export to CSV button
2. WHEN a user clicks the export button, THE system SHALL generate a CSV file containing all displayed meter readings
3. WHEN exporting to CSV, THE system SHALL include all columns shown in the data grid (timestamp and selected power columns)
4. WHEN exporting to CSV, THE system SHALL include a header row with column names
5. WHEN exporting to CSV, THE system SHALL respect the current filters and sorting applied to the data grid
6. WHEN exporting to CSV, THE system SHALL include metadata in the file (meter element name, time frame, export timestamp)
7. THE system SHALL format the CSV file with proper escaping for special characters
8. THE system SHALL name the exported file with the meter element name and date range for easy identification
