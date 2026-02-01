# Meter Reading Form - Requirements

## Introduction

The Meter Reading Form feature enables users to view and interact with the most recent meter reading for a specific meter element. The form displays comprehensive meter information including consumption data, generation data, and consumption trends through graphs. Users can filter graph data by time period and graph type, and navigate to view all historical readings for the meter element.

## Glossary

- **Meter**: A physical device that measures energy consumption and/or generation
- **Meter Element**: A logical grouping within a meter that represents a specific measurement point (e.g., Total Consumption, Total Generation)
- **Meter Reading**: A snapshot of values recorded from a meter element at a specific point in time
- **Last Reading**: The most recent meter reading available for a meter element
- **Phase**: In three-phase electrical systems, one of three alternating current circuits (Phase 1, Phase 2, Phase 3)
- **Overall**: The combined/total value across all phases
- **Consumption**: Energy used by the system
- **Generation**: Energy produced by the system
- **Frequency**: The rate at which alternating current cycles (typically measured in Hz)
- **Time Period**: A duration for filtering graph data (Today, Weekly, Monthly, Yearly)
- **Graph Type**: The category of data displayed in consumption graphs (Consumption, Demand, GHG Emissions)
- **Driver**: The entity responsible for the meter (e.g., a person or system)
- **Serial Number**: The unique identifier for the physical meter device

## Requirements

### Requirement 1: Display Last Meter Reading

**User Story:** As a meter operator, I want to view the most recent meter reading for a specific meter element, so that I can see the current state of the meter.

#### Acceptance Criteria

1. WHEN a user navigates to the meter reading form for a specific meter element, THE System SHALL fetch and display the last meter reading for that meter element
2. WHEN the last meter reading is displayed, THE System SHALL show the reading timestamp indicating when the reading was taken
3. WHEN no meter readings exist for the meter element, THE System SHALL display a message indicating no readings are available
4. WHEN the meter reading data is loaded, THE System SHALL display it without requiring a page refresh

### Requirement 2: Display Meter Information

**User Story:** As a meter operator, I want to see detailed meter information on the reading form, so that I can verify I'm viewing the correct meter.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed, THE System SHALL show the driver name associated with the meter
2. WHEN the meter reading form is displayed, THE System SHALL show the meter description
3. WHEN the meter reading form is displayed, THE System SHALL show the meter serial number
4. WHEN meter information is not available, THE System SHALL display placeholder text or indicate missing data

### Requirement 3: Display Reading Values in Sections

**User Story:** As a meter operator, I want to see meter reading values organized by category, so that I can quickly find the data I need.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed, THE System SHALL organize reading values into logical sections (Total Consumption, Total Generation, etc.)
2. WHEN a section is displayed, THE System SHALL show values for Overall, Phase 1, Phase 2, and Phase 3 in a data table format
3. WHEN reading values are displayed, THE System SHALL show numeric values with appropriate units
4. WHEN a section has no data for a phase, THE System SHALL display a null indicator or empty state

### Requirement 4: Display Frequency Information

**User Story:** As a meter operator, I want to see the frequency measurement from the meter reading, so that I can verify the electrical system parameters.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed, THE System SHALL show the frequency value from the last reading
2. WHEN frequency is displayed, THE System SHALL include the unit of measurement (Hz)
3. WHEN frequency data is not available, THE System SHALL display a null indicator

### Requirement 5: Display Consumption Graphs

**User Story:** As a meter operator, I want to view consumption trends over different time periods, so that I can analyze energy usage patterns.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed, THE System SHALL display consumption graphs with time period filter options (Today, Weekly, Monthly, Yearly)
2. WHEN a user selects a time period filter, THE System SHALL update the graph to show data for that period
3. WHEN a graph is displayed, THE System SHALL show consumption data points for the selected time period
4. WHEN no data exists for a selected time period, THE System SHALL display an empty graph with a message indicating no data available

### Requirement 6: Display Graph Type Toggle

**User Story:** As a meter operator, I want to switch between different types of consumption data, so that I can analyze different metrics.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed, THE System SHALL provide toggle options for graph types (Consumption, Demand, GHG Emissions)
2. WHEN a user selects a graph type, THE System SHALL update the graph to display data for that type
3. WHEN a graph type is selected, THE System SHALL persist the selection while the user views different time periods
4. WHEN a graph type has no data available, THE System SHALL display the graph with no data points and indicate data is unavailable

### Requirement 7: Navigate to Meter Reading List

**User Story:** As a meter operator, I want to navigate to a list of all readings for the meter element, so that I can view historical data.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed, THE System SHALL provide a button to navigate to the meter reading list
2. WHEN the user clicks the navigation button, THE System SHALL navigate to the meter reading list filtered for the current meter element
3. WHEN the meter reading list is displayed, THE System SHALL show all readings for the meter element in chronological order
4. WHEN the user navigates back from the reading list, THE System SHALL return to the meter reading form

### Requirement 8: Form Layout and Responsiveness

**User Story:** As a meter operator, I want the meter reading form to be well-organized and accessible on different screen sizes, so that I can use it on various devices.

#### Acceptance Criteria

1. WHEN the meter reading form is displayed on a desktop screen, THE System SHALL arrange components in a logical layout with meter info at the top, reading values in the middle, and graphs below
2. WHEN the meter reading form is displayed on a mobile screen, THE System SHALL stack components vertically and adjust graph sizes appropriately
3. WHEN the form is displayed, THE System SHALL ensure all text is readable and interactive elements are appropriately sized
4. WHEN the form is displayed, THE System SHALL load all components without horizontal scrolling on standard screen sizes

### Requirement 9: Data Loading and Error Handling

**User Story:** As a meter operator, I want clear feedback when data is loading or when errors occur, so that I understand the system state.

#### Acceptance Criteria

1. WHEN the meter reading form is loading data, THE System SHALL display a loading indicator
2. WHEN an error occurs while fetching meter reading data, THE System SHALL display an error message describing the issue
3. WHEN an error occurs, THE System SHALL provide an option to retry loading the data
4. WHEN data fails to load, THE System SHALL not display partial or stale data

### Requirement 10: Integration with Existing Meter Services

**User Story:** As a developer, I want the meter reading form to integrate seamlessly with existing meter services, so that the feature works with the current system architecture.

#### Acceptance Criteria

1. WHEN the meter reading form is initialized, THE System SHALL use existing meter reading service APIs to fetch data
2. WHEN meter data is fetched, THE System SHALL use the existing meter store for state management
3. WHEN the form displays data, THE System SHALL follow existing component patterns and styling conventions
4. WHEN the form navigates to other views, THE System SHALL use existing routing mechanisms
