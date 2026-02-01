# Requirements Document: Combined Meters Selector

## Introduction

The Combined Meters Selector is a new feature for the meter management system that allows users to select and manage combined meters through a modern dual-list selector interface. When users navigate to a meter's details page and access the "Combined Meters" tab, they can view all available physical meters and select which ones should be combined into the current virtual meter. The component provides intuitive interactions including search, double-click selection, and drag-and-drop support.

## Glossary

- **Virtual Meter**: A logical meter that combines data from multiple physical meters
- **Physical Meter**: An actual meter device that collects data
- **Element**: A physical meter or meter component available for selection
- **Combined Meters**: The set of physical meters selected to be combined into a virtual meter
- **Dual-List Selector**: A UI component with two lists (available and selected items) that allows moving items between them
- **Material Design**: Google's design system emphasizing clean, modern interfaces with consistent interactions
- **meter_virtual Table**: Database table storing the relationship between virtual meters and their selected physical meters/elements
- **getMeterElements API**: Endpoint that returns available physical meters and elements for selection (used in favorites, meter readings, and combined meters selector)

## Requirements

### Requirement 1: Display Combined Meters Tab

**User Story:** As a meter manager, I want to see a "Combined Meters" tab on the meter details page, so that I can manage which physical meters are combined into a virtual meter.

#### Acceptance Criteria

1. WHEN a user navigates to a virtual meter's details page, THE System SHALL display a "Combined Meters" tab alongside other tabs
2. WHEN the user clicks the "Combined Meters" tab, THE System SHALL display the dual-list selector component
3. THE Combined_Meters_Tab SHALL follow Material Design principles consistent with the rest of the application
4. WHEN the page loads, THE System SHALL load the list of available physical meters from the API

### Requirement 2: Search Functionality

**User Story:** As a meter manager, I want to search for physical meters by name or identifier, so that I can quickly find specific meters to add to the combined meter.

#### Acceptance Criteria

1. WHEN the Combined Meters tab is displayed, THE System SHALL show a search box at the top of the component
2. WHEN a user types in the search box, THE System SHALL filter both the available meters list and the selected meters list in real-time
3. WHEN the search box is empty, THE System SHALL display all available meters
4. WHEN a user clears the search box, THE System SHALL restore the full list of meters

### Requirement 3: Display Available Meters

**User Story:** As a meter manager, I want to see all available physical meters in a list, so that I can select which ones to combine.

#### Acceptance Criteria

1. WHEN the Combined Meters tab is displayed, THE System SHALL display all available physical meters in the left list box
2. WHEN meters are loaded from the API, THE System SHALL format them consistently with the favorites display (showing meter name and identifier)
3. WHEN the list is displayed, THE System SHALL show meters in a scrollable list box
4. WHEN a meter is already selected, THE System SHALL not display it in the available meters list

### Requirement 4: Display Selected Meters

**User Story:** As a meter manager, I want to see which meters I have selected for combination, so that I can verify my selections.

#### Acceptance Criteria

1. WHEN the Combined Meters tab is displayed, THE System SHALL display selected meters in the right list box
2. WHEN the page loads, THE System SHALL populate the right list with meters that are currently combined into the virtual meter
3. WHEN a meter is moved to the right list, THE System SHALL remove it from the left list
4. WHEN the right list is displayed, THE System SHALL show meters in a scrollable list box

### Requirement 5: Double-Click Selection

**User Story:** As a meter manager, I want to double-click items to move them between lists, so that I can quickly select or deselect meters.

#### Acceptance Criteria

1. WHEN a user double-clicks a meter in the left list, THE System SHALL move it to the right list
2. WHEN a user double-clicks a meter in the right list, THE System SHALL move it back to the left list
3. WHEN a meter is moved, THE System SHALL update both lists immediately
4. WHEN a meter is moved, THE System SHALL maintain the search filter state

### Requirement 6: Drag and Drop Support

**User Story:** As a meter manager, I want to drag and drop meters between lists, so that I can use an intuitive interaction pattern.

#### Acceptance Criteria

1. WHEN a user drags a meter from the left list, THE System SHALL allow dropping it into the right list
2. WHEN a user drags a meter from the right list, THE System SHALL allow dropping it into the left list
3. WHEN a meter is dropped into the target list, THE System SHALL move it and update both lists immediately
4. WHEN a drag operation is in progress, THE System SHALL provide visual feedback (e.g., highlighting the drop zone)

### Requirement 7: Remove Items from Selection

**User Story:** As a meter manager, I want to remove meters from the selected list, so that I can deselect meters I no longer want to combine.

#### Acceptance Criteria

1. WHEN a user selects a meter in the right list and presses Delete or clicks a remove button, THE System SHALL remove it from the right list
2. WHEN a meter is removed from the right list, THE System SHALL return it to the left list
3. WHEN a meter is removed, THE System SHALL update both lists immediately
4. WHEN the right list is empty, THE System SHALL display an empty state message

### Requirement 8: Persist Combined Meters Selection

**User Story:** As a meter manager, I want my combined meters selection to be saved, so that the configuration persists when I navigate away and return.

#### Acceptance Criteria

1. WHEN a user modifies the selected meters list, THE System SHALL save the changes to the backend API
2. WHEN the save operation completes, THE System SHALL provide visual feedback to the user
3. IF a save operation fails, THE System SHALL display an error message and allow the user to retry
4. WHEN the page is reloaded, THE System SHALL display the previously saved combined meters selection

### Requirement 9: Material Design Compliance

**User Story:** As a designer, I want the Combined Meters Selector to follow Material Design principles, so that it integrates seamlessly with the rest of the application.

#### Acceptance Criteria

1. THE Combined_Meters_Selector SHALL use Material Design color palette and typography
2. THE Component SHALL use Material Design spacing and layout guidelines
3. THE Component SHALL include appropriate hover and focus states for accessibility
4. THE Component SHALL support keyboard navigation (Tab, Enter, Delete keys)

### Requirement 10: Empty State Handling

**User Story:** As a meter manager, I want to see appropriate messages when lists are empty, so that I understand the current state.

#### Acceptance Criteria

1. WHEN the available meters list is empty, THE System SHALL display an empty state message
2. WHEN the selected meters list is empty, THE System SHALL display an empty state message
3. WHEN a search returns no results, THE System SHALL display a "no results" message
4. THE Empty_State_Messages SHALL be clear and actionable

### Requirement 11: Database Schema for Virtual Meters

**User Story:** As a system architect, I want a proper database schema to store virtual meter configurations, so that combined meter selections persist correctly.

#### Acceptance Criteria

1. THE System SHALL create a meter_virtual table with columns: meter_virtual_id, meter_id, selected_meter_id, and select_meter_element_id
2. WHEN a virtual meter is created, THE System SHALL store the relationship between the virtual meter and its selected physical meters in the meter_virtual table
3. WHEN a virtual meter is loaded, THE System SHALL retrieve all selected meters from the meter_virtual table
4. WHEN a virtual meter's selection is updated, THE System SHALL update the corresponding records in the meter_virtual table
5. THE meter_virtual table SHALL have appropriate primary key constraints and foreign key relationships

### Requirement 12: API Integration with getMeterElements

**User Story:** As a developer, I want to use a unified API endpoint to load available meters, so that the combined meters selector is consistent with other parts of the application.

#### Acceptance Criteria

1. THE System SHALL use the getMeterElements API endpoint to load available physical meters and elements
2. THE getMeterElements endpoint SHALL be reusable across favorites, meter readings sidebar, and combined meters selector
3. WHEN the Combined Meters tab loads, THE System SHALL call getMeterElements to populate the available meters list
4. THE API response SHALL include meter name, identifier, and other necessary display information

