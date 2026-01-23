# Requirements Document: Dashboard Settings Modal Double Flash Fix

## Introduction

When users click the edit button on a dashboard card to open the dashboard settings modal, the modal loads but then reloads/flashes again. This creates a poor user experience with a visible double flash. The root cause is that meter elements are fetched after the modal is already open, causing a visible state update and re-render. This spec addresses fixing the double flash by ensuring meter elements are loaded before or simultaneously with the modal opening.

## Glossary

- **DashboardPage**: The main client component that manages dashboard state and card operations
- **DashboardCardModal**: The framework modal component that displays the dashboard card settings form
- **Meter**: A device that measures energy consumption
- **Meter_Element**: A specific measurement point or phase within a meter (e.g., Phase A, Phase B, Total)
- **Modal_Flash**: A visible re-render or reload of the modal content after it has already been displayed to the user
- **Pre-fetch**: Loading data before it is needed, in advance of user interaction
- **Parallel_Loading**: Loading multiple data sources simultaneously rather than sequentially

## Requirements

### Requirement 1: Eliminate Modal Flash on Edit

**User Story:** As a user, I want to open the dashboard settings modal without seeing a flash or reload, so that the experience feels smooth and responsive.

#### Acceptance Criteria

1. WHEN a user clicks the edit button on a dashboard card THEN the modal SHALL open with all required data (meter elements) already loaded
2. WHEN the modal is displayed THEN there SHALL be no visible re-render or flash after the modal appears
3. WHEN a user clicks the edit button THEN the meter elements for the selected meter SHALL be fetched before the modal is displayed
4. WHEN the modal is open THEN the meter element dropdown SHALL be populated with data on first render, not after

### Requirement 2: Maintain Existing Functionality

**User Story:** As a developer, I want to ensure that fixing the double flash does not break existing modal functionality, so that all features continue to work correctly.

#### Acceptance Criteria

1. WHEN a user selects a different meter from the dropdown THEN the meter elements SHALL update to show elements for the new meter
2. WHEN a user creates a new card (not editing) THEN the modal SHALL open without pre-fetched meter elements
3. WHEN a user edits an existing card THEN the modal form SHALL be pre-populated with the card's current values
4. WHEN a user submits the modal form THEN the card SHALL be created or updated correctly with all selected data

### Requirement 3: Optimize Data Loading

**User Story:** As a system architect, I want the modal to load data efficiently, so that the application remains responsive and performant.

#### Acceptance Criteria

1. WHEN a user clicks the edit button THEN meter elements SHALL be fetched in parallel with opening the modal, not sequentially
2. WHEN meter elements are being fetched THEN the modal MAY display a loading state for the meter element dropdown
3. WHEN meter elements have been fetched THEN the dropdown SHALL be immediately populated without additional re-renders
4. WHEN a user cancels the modal THEN any pending meter element fetch requests MAY be cancelled to avoid unnecessary network traffic

### Requirement 4: Handle Edge Cases

**User Story:** As a developer, I want the modal to handle edge cases gracefully, so that the application remains stable under all conditions.

#### Acceptance Criteria

1. IF a meter element fetch fails THEN the modal SHALL display an error message in the meter element dropdown
2. IF a user clicks edit multiple times rapidly THEN only the most recent fetch request SHALL be processed
3. IF a user selects a meter with no elements THEN the meter element dropdown SHALL display an appropriate message
4. IF the modal is closed before meter elements finish loading THEN the fetch request SHALL be cancelled and no state updates SHALL occur
