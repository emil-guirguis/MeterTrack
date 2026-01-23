# Requirements Document: Fix Dashboard Form Element Select Being Disabled

## Introduction

The DashboardCardModal component has a usability issue where the meter element select dropdown appears disabled when the modal first opens. This occurs because the meterElements array is empty until data is fetched after a meter is selected. The current disable condition treats an empty array the same as a loading state, preventing users from interacting with the select even though it's ready to accept input once a meter is chosen.

## Glossary

- **DashboardCardModal**: The React component that provides a form for creating and editing dashboard cards
- **Meter**: A device that measures energy consumption, selected by the user in the form
- **Meter Element**: A specific measurement point or channel within a meter (e.g., phase A, phase B, total)
- **Disabled State**: When a form control is not interactive and appears grayed out
- **Loading State**: When data is being fetched from the server
- **Submitting State**: When the form is being submitted to the server

## Requirements

### Requirement 1: Meter Element Select Should Be Disabled Only When Appropriate

**User Story:** As a user, I want the meter element select to be interactive when the modal opens, so that I can proceed with selecting a meter and then its element without unnecessary waiting.

#### Acceptance Criteria

1. WHEN the DashboardCardModal opens in create mode THEN the meter element select SHALL be enabled (not disabled)
2. WHEN the DashboardCardModal opens in create mode THEN the meter element select SHALL display the placeholder text "-- Select a meter element --"
3. WHEN a user has not selected a meter THEN the meter element select SHALL be disabled with a clear reason
4. WHEN a user selects a meter THEN the system SHALL fetch the meter elements for that meter
5. WHEN the system is fetching meter elements THEN the meter element select SHALL be disabled to prevent selection during the fetch
6. WHEN the meter elements have been successfully fetched THEN the meter element select SHALL be enabled and display the available options
7. WHEN the form is being submitted THEN the meter element select SHALL be disabled to prevent changes during submission
8. WHEN the form is in a loading state THEN the meter element select SHALL be disabled to prevent changes during loading

### Requirement 2: Disable Logic Should Distinguish Between Empty Array and No Meter Selected

**User Story:** As a developer, I want the disable condition to be clear and maintainable, so that the select is only disabled when it should be.

#### Acceptance Criteria

1. THE disable condition for meter element select SHALL check if a meter is selected (not if meterElements array is empty)
2. THE disable condition for meter element select SHALL check if data is currently loading
3. THE disable condition for meter element select SHALL check if the form is being submitted
4. THE disable condition for meter element select SHALL NOT disable based on meterElements array length alone
5. WHEN meterElements array is empty but a meter is selected THEN the meter element select SHALL remain enabled (showing empty options)

### Requirement 3: User Feedback Should Clarify Why Select Is Disabled

**User Story:** As a user, I want to understand why the meter element select is disabled, so that I know what action to take next.

#### Acceptance Criteria

1. WHEN the meter element select is disabled because no meter is selected THEN a helper text SHALL indicate "Select a meter first"
2. WHEN the meter element select is disabled because data is loading THEN the select SHALL show a loading indicator or disabled state
3. WHEN the meter element select is disabled because the form is submitting THEN the select SHALL show a disabled state
4. WHEN the meter element select is enabled THEN no misleading helper text SHALL be shown

### Requirement 4: Meter Element Fetching Should Be Triggered Correctly

**User Story:** As a user, I want meter elements to be fetched automatically when I select a meter, so that I can immediately see available options.

#### Acceptance Criteria

1. WHEN a user selects a meter from the meter select dropdown THEN the system SHALL immediately call fetchMeterElements with that meter's ID
2. WHEN a user changes the selected meter THEN the system SHALL clear the previously selected meter element
3. WHEN a user changes the selected meter THEN the system SHALL fetch the new meter's elements
4. WHEN the modal is opened in edit mode with an existing meter_id THEN the system SHALL fetch the meter elements for that meter
