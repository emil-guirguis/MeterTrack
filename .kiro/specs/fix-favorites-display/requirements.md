# Requirements Document: Fix Favorites and Meter Elements Display Issue

## Introduction

The favorites section and meter elements list in the sidebar are displaying "undefined" values instead of actual meter and element names. This occurs because SQL queries use CONCAT with NULL values, which returns NULL instead of meaningful fallback data. The frontend then displays these NULL values as "undefined". This spec addresses fixing the SQL queries to handle NULL values gracefully and ensuring the frontend displays proper fallback values.

## Glossary

- **Meter**: A device that measures consumption or usage (e.g., "Dent PS48H #01")
- **Meter_Element**: A specific measurement point within a meter (e.g., "A-office" where "A" is the element letter and "office" is the element name)
- **Favorite**: A user-marked preference for a specific meter element for quick access
- **Favorite_Name**: The display string for a favorite, formatted as "Meter Name - element-element_name"
- **Element_Letter**: The single letter identifier for a measurement point (A, B, C, etc.)
- **Element_Name**: The descriptive name for a measurement point (e.g., "office", "hallway")
- **NULL_Handling**: Gracefully providing fallback values when database fields are missing or NULL
- **Undefined_Display**: When the frontend receives NULL/undefined values and displays them as the string "undefined"

## Requirements

### Requirement 1: Fix SQL Query for Favorites Endpoint

**User Story:** As a system administrator, I want the `/api/favorites` endpoint to return properly formatted favorite names, so that users see meaningful data instead of "undefined" values.

#### Acceptance Criteria

1. WHEN the `/api/favorites` endpoint is called, THE Favorites_Endpoint SHALL return favorite_name values that are never NULL
2. WHEN a favorite references a meter that exists, THE Favorites_Endpoint SHALL include the meter name in the favorite_name
3. WHEN a favorite references a meter_element that exists, THE Favorites_Endpoint SHALL include the element letter and element name in the favorite_name formatted as "element-element_name"
4. WHEN a favorite references a meter that does not exist, THE Favorites_Endpoint SHALL provide a fallback value instead of NULL
5. WHEN a favorite references a meter_element that does not exist, THE Favorites_Endpoint SHALL provide a fallback value instead of NULL
6. WHEN CONCAT receives NULL values from LEFT JOIN, THE Favorites_Endpoint SHALL use COALESCE to provide fallback values

### Requirement 2: Fix SQL Query for Meters with Elements Endpoint

**User Story:** As a system administrator, I want the `/api/favorites/meters` endpoint to return properly formatted element names, so that users see meaningful data instead of "undefined" values.

#### Acceptance Criteria

1. WHEN the `/api/favorites/meters` endpoint is called, THE Meters_Endpoint SHALL return favorite_name values that are never NULL
2. WHEN a meter element exists, THE Meters_Endpoint SHALL include the element letter and element name in the favorite_name formatted as "element-element_name"
3. WHEN a meter element does not exist, THE Meters_Endpoint SHALL provide a fallback value instead of NULL
4. WHEN CONCAT receives NULL values from LEFT JOIN, THE Meters_Endpoint SHALL use COALESCE to provide fallback values
5. WHEN a meter has no elements, THE Meters_Endpoint SHALL still return the meter with an empty elements array

### Requirement 3: Ensure Frontend Displays Proper Fallback Values

**User Story:** As a user, I want to see meaningful element names in the sidebar, so that I can identify and select the correct meter elements.

#### Acceptance Criteria

1. WHEN a meter element is displayed, THE MeterElementItem SHALL format the element name as "element-element_name" (e.g., "A-office")
2. WHEN element data is missing or NULL, THE MeterElementItem SHALL display a fallback value instead of "undefined"
3. WHEN a favorite is displayed in the FavoritesSection, THE FavoritesSection SHALL display the favorite_name from the API response
4. WHEN favorite_name is NULL or empty, THE FavoritesSection SHALL provide a fallback value instead of "undefined"
5. WHEN the frontend receives data from the API, THE Frontend SHALL never display the string "undefined" to the user

### Requirement 4: Validate Data Integrity

**User Story:** As a system administrator, I want to ensure that all favorites and meter elements are properly linked to their source data, so that the system maintains data consistency.

#### Acceptance Criteria

1. WHEN a favorite is created, THE System SHALL verify that both the meter and meter_element exist before storing the favorite
2. WHEN a favorite is retrieved, THE System SHALL ensure that the favorite_name is always populated with meaningful data
3. WHEN meter elements are retrieved, THE System SHALL ensure that element names are always populated with meaningful data
4. IF a favorite references a deleted meter or meter_element, THE System SHALL handle the missing data gracefully with fallback values

### Requirement 5: Handle Edge Cases

**User Story:** As a developer, I want the system to handle edge cases gracefully, so that the application remains stable and user-friendly.

#### Acceptance Criteria

1. WHEN a meter name is empty or whitespace-only, THE System SHALL provide a fallback value (e.g., "Unknown Meter")
2. WHEN an element letter is missing, THE System SHALL provide a fallback value (e.g., "Unknown Element")
3. WHEN an element name is missing, THE System SHALL provide a fallback value (e.g., "Unknown")
4. WHEN multiple NULL values occur in CONCAT, THE System SHALL use COALESCE to handle all of them
5. WHEN the database returns unexpected data types, THE System SHALL convert them to strings safely

