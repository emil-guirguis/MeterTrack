# Requirements Document: Meter Reading Values Display Fix

## Introduction

After the dashboard framework migration, meter readings are displaying as `[object Object]` or `0` instead of properly formatted numeric values. This issue affects the aggregated values display in dashboard cards and potentially the visualization components.

## Glossary

- **Aggregated_Values**: An object containing summed/aggregated meter reading values keyed by column name (e.g., `{ power_a: 1234.56, power_b: 5678.90 }`)
- **Grouped_Data**: An array of objects containing time-series meter readings, each with date/time fields and column values
- **Selected_Columns**: Array of column names that should be displayed in the card (e.g., `['power_a', 'power_b']`)
- **Dashboard_Card**: A UI component that displays meter data with visualization and aggregated values
- **Visualization_Component**: A reusable component that renders charts (pie, line, bar, area, candlestick)

## Requirements

### Requirement 1: Aggregated Values Display

**User Story:** As a dashboard user, I want to see properly formatted numeric values for aggregated meter readings, so that I can quickly understand the total consumption or production.

#### Acceptance Criteria

1. WHEN a dashboard card displays aggregated values, THE Dashboard_Card SHALL format each value as a number with two decimal places
2. WHEN an aggregated value is null or undefined, THE Dashboard_Card SHALL display "--" instead of the raw value
3. WHEN an aggregated value is an object or non-numeric type, THE Dashboard_Card SHALL display "--" instead of attempting to render it
4. WHEN selected columns are provided, THE Dashboard_Card SHALL display one aggregated value per selected column in a grid layout

### Requirement 2: Data Structure Handling

**User Story:** As a framework developer, I want the Visualization component to correctly handle both aggregated and time-series data, so that charts render correctly regardless of data format.

#### Acceptance Criteria

1. WHEN grouped_data is an empty array or null, THE Visualization SHALL use aggregated_values as fallback data
2. WHEN aggregated_values is provided as an object, THE Visualization SHALL correctly map column names to values
3. WHEN data contains non-numeric values, THE Visualization SHALL convert them to numbers or display zero
4. WHEN columns array is provided, THE Visualization SHALL only display data for those specific columns

### Requirement 3: Value Formatting Consistency

**User Story:** As a dashboard user, I want all numeric values to be formatted consistently across the dashboard, so that the display is professional and easy to read.

#### Acceptance Criteria

1. WHEN formatting numeric values, THE formatNumber function SHALL handle null, undefined, string, and numeric inputs
2. WHEN a string value is provided, THE formatNumber function SHALL parse it to a number
3. WHEN a value cannot be parsed as a number, THE formatNumber function SHALL return "--"
4. WHEN a valid number is provided, THE formatNumber function SHALL format it with exactly two decimal places and thousands separators

### Requirement 4: Visualization Data Validation

**User Story:** As a framework developer, I want the Visualization component to validate data before rendering, so that invalid data doesn't cause rendering errors.

#### Acceptance Criteria

1. WHEN data is provided to the Visualization component, THE component SHALL validate that columns is a non-empty array
2. WHEN data is an object, THE component SHALL ensure all column values are numeric or can be converted to numeric
3. WHEN data is an array, THE component SHALL ensure each element contains the specified columns
4. WHEN data validation fails, THE component SHALL display an appropriate error message instead of crashing
