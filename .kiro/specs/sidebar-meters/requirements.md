# Requirements Document: Sidebar Meters Section

## Introduction

This feature adds a new section to the top of the main menu sidebar that displays all meters and meter elements in an outline/tree structure. Users can click on meters or meter elements to view their readings in a data grid, with support for marking favorites that persist across sessions.

## Glossary

- **Meter**: A device or entity that measures and records readings over time
- **Meter_Element**: A sub-component or property of a Meter that can have independent readings
- **Meter_Reading**: A data point recorded by a Meter or Meter_Element at a specific point in time
- **Sidebar**: The left navigation panel of the application
- **Outline_Tree**: A hierarchical display structure where Meters are parent nodes and Meter_Elements are child nodes
- **Data_Grid**: An existing tabular component that displays Meter_Readings with sortable columns
- **Favorite**: A user-marked preference for a Meter or Meter_Element that appears at the top of the list
- **Tenant**: An isolated organizational unit in the multi-tenant system
- **User**: An authenticated individual within a Tenant

## Requirements

### Requirement 1: Display Meters and Meter Elements in Sidebar

**User Story:** As a user, I want to see all available meters and their elements in a tree structure in the sidebar, so that I can quickly navigate to the meter data I need.

#### Acceptance Criteria

1. WHEN the sidebar loads, THE Sidebar_Section SHALL display all Meters belonging to the current Tenant in a collapsible outline structure
2. WHEN a Meter is expanded, THE Sidebar_Section SHALL display all Meter_Elements associated with that Meter as child nodes
3. WHEN the sidebar is rendered, THE Sidebar_Section SHALL organize Meters and Meter_Elements with Favorites appearing at the top, followed by non-favorite items
4. WHILE the user navigates the application, THE Sidebar_Section SHALL maintain the expanded/collapsed state of Meter nodes during the session
5. WHEN a Meter or Meter_Element is clicked, THE Sidebar_Section SHALL highlight the selected item with visual feedback

### Requirement 2: Display Meter Readings in Data Grid

**User Story:** As a user, I want to click on a meter or meter element and see its readings displayed in a data grid, so that I can analyze the measurement data.

#### Acceptance Criteria

1. WHEN a Meter is clicked, THE Data_Grid SHALL display all Meter_Readings for that Meter, sorted by created_date in descending order
2. WHEN a Meter_Element is clicked, THE Data_Grid SHALL display all Meter_Readings for that Meter_Element, sorted by created_date in descending order
3. WHEN the Data_Grid displays readings, THE Data_Grid SHALL use the existing schema and columns for Meter_Readings
4. WHEN a different Meter or Meter_Element is selected, THE Data_Grid SHALL update to show the readings for the newly selected item
5. WHEN the Data_Grid loads readings, THE Data_Grid SHALL display a loading indicator until data is fully loaded

### Requirement 3: Support Favorites Functionality

**User Story:** As a user, I want to mark meters and meter elements as favorites, so that I can quickly access the ones I use most frequently.

#### Acceptance Criteria

1. WHEN a user hovers over a Meter or Meter_Element in the sidebar, THE Sidebar_Section SHALL display a favorite toggle button
2. WHEN a user clicks the favorite toggle button, THE Sidebar_Section SHALL mark the item as a favorite and move it to the top of the list
3. WHEN a user clicks the favorite toggle button on a favorited item, THE Sidebar_Section SHALL remove the favorite status and return the item to its original position in the list
4. WHEN the sidebar is refreshed or the user logs out and back in, THE Sidebar_Section SHALL display the same Favorites that were previously marked
5. WHEN a Meter is marked as favorite, THE Sidebar_Section SHALL persist the favorite status to the database with the Tenant_ID, Meter_ID, and User_ID

### Requirement 4: Persist Favorites to Database

**User Story:** As a system, I want to store user favorites in the database, so that favorites are maintained across sessions and devices.

#### Acceptance Criteria

1. WHEN a user marks a Meter or Meter_Element as favorite, THE Favorites_Service SHALL create a record in the database with Tenant_ID, Meter_ID, Meter_Element_ID (nullable for Meters), and User_ID
2. WHEN a user removes a favorite, THE Favorites_Service SHALL delete the corresponding record from the database
3. WHEN the sidebar loads, THE Favorites_Service SHALL query the database for all favorites belonging to the current User and Tenant
4. WHEN a favorite record is created or deleted, THE Favorites_Service SHALL ensure data integrity by validating that the Meter or Meter_Element belongs to the current Tenant
5. WHEN multiple users access the same Tenant, THE Favorites_Service SHALL isolate each user's favorites and not display other users' favorites

### Requirement 5: Organize Sidebar Display with Favorites Priority

**User Story:** As a user, I want favorites to be prominently displayed at the top of the sidebar, so that I can access my most-used meters quickly.

#### Acceptance Criteria

1. WHEN the sidebar renders the Meters list, THE Sidebar_Section SHALL display all favorited Meters at the top, followed by non-favorited Meters
2. WHEN a Meter is expanded, THE Sidebar_Section SHALL display favorited Meter_Elements for that Meter at the top, followed by non-favorited Meter_Elements
3. WHEN a Meter is marked or unmarked as favorite, THE Sidebar_Section SHALL immediately reorder the list to reflect the new favorite status
4. WHEN the sidebar is rendered, THE Sidebar_Section SHALL apply consistent visual styling to indicate favorite status (e.g., star icon, highlight color)
5. WHEN a user scrolls through the sidebar, THE Sidebar_Section SHALL keep favorite items visible and accessible

### Requirement 6: Multi-Tenant Data Isolation

**User Story:** As a system administrator, I want to ensure that users only see meters and favorites from their own tenant, so that data remains secure and isolated.

#### Acceptance Criteria

1. WHEN the sidebar loads, THE Sidebar_Section SHALL only display Meters that belong to the current Tenant
2. WHEN querying favorites, THE Favorites_Service SHALL filter results by both Tenant_ID and User_ID
3. WHEN a user switches tenants, THE Sidebar_Section SHALL refresh and display only Meters from the new Tenant
4. WHEN a favorite is created, THE Favorites_Service SHALL validate that the Meter belongs to the current Tenant before persisting
5. IF a user attempts to access a Meter from a different Tenant, THEN THE Sidebar_Section SHALL prevent access and display an error message
