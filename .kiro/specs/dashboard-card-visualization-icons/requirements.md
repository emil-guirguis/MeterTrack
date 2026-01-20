# Requirements Document: Dashboard Card Visualization Icons

## Introduction

Users need the ability to change the visualization type (icon) displayed on dashboard cards and have those changes persist. Currently, the dashboard card header displays visualization icons (pie chart, line chart, bar chart, etc.) but they are not interactive. This feature adds the ability to click on icons to change the visualization type and automatically save the preference.

## Glossary

- **Dashboard_Card**: A card displayed on the dashboard that shows aggregated meter reading data
- **Visualization_Type**: The type of chart used to display data (pie, line, bar, area, candlestick)
- **Icon**: A visual representation of the visualization type displayed in the card header
- **User**: An authenticated user with dashboard:update permission
- **Tenant**: The organization/account that owns the dashboard card

## Requirements

### Requirement 1: Display Visualization Type Icons

**User Story:** As a user, I want to see the current visualization type displayed as an interactive icon on the dashboard card, so that I can quickly identify and change the chart type.

#### Acceptance Criteria

1. WHEN a dashboard card is displayed THEN the card header SHALL show the current visualization type as a clickable icon
2. WHEN the user hovers over the visualization icon THEN the icon SHALL display a tooltip indicating the current visualization type
3. WHEN the user hovers over the visualization icon THEN the cursor SHALL change to indicate the element is clickable
4. THE icon SHALL be visually distinct from other card action buttons

### Requirement 2: Change Visualization Type

**User Story:** As a user, I want to click on the visualization icon to change the chart type, so that I can switch between different ways of viewing the data.

#### Acceptance Criteria

1. WHEN the user clicks on the visualization icon THEN the system SHALL display a menu or selector with available visualization types
2. WHEN a visualization type is selected from the menu THEN the system SHALL update the card's visualization type
3. WHEN a visualization type is selected THEN the system SHALL close the menu/selector
4. WHEN a visualization type is selected THEN the system SHALL display a loading indicator while saving
5. IF the user clicks outside the menu THEN the system SHALL close the menu without making changes

### Requirement 3: Persist Visualization Type Changes

**User Story:** As a user, I want my visualization type changes to be automatically saved, so that my preferences are retained when I return to the dashboard.

#### Acceptance Criteria

1. WHEN a visualization type is selected THEN the system SHALL send an update request to the backend API
2. WHEN the backend successfully updates the card THEN the system SHALL update the card's visualization type in the UI
3. WHEN the backend successfully updates the card THEN the system SHALL display a success indicator (optional toast/notification)
4. IF the update request fails THEN the system SHALL revert the visualization type to the previous value
5. IF the update request fails THEN the system SHALL display an error message to the user
6. WHEN the card data is refreshed THEN the system SHALL use the updated visualization type to render the chart

### Requirement 4: Handle Edge Cases

**User Story:** As a system, I want to handle edge cases gracefully, so that the feature is robust and reliable.

#### Acceptance Criteria

1. IF the user lacks dashboard:update permission THEN the visualization icon SHALL not be clickable
2. IF the user lacks dashboard:update permission THEN the system SHALL not display the visualization selector menu
3. WHEN the visualization type is changed THEN the system SHALL maintain all other card settings (time frame, grouping, columns)
4. WHEN multiple users view the same card THEN each user's visualization preference changes SHALL be independent
5. IF the network connection is lost during update THEN the system SHALL display an error and allow retry

