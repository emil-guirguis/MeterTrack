# Requirements Document: Sidebar Meter Element Display and Favorites Integration

## Introduction

The sidebar meter elements display has two critical issues that need to be fixed:

1. **Element name display format** is incorrect - The backend query in `/api/favorites` endpoint (line 51 of `client/backend/src/routes/favorites.js`) constructs `favorite_name` as `CONCAT(m.name, '    ', trim(me.element), '-', me.name)`, which produces display strings like "meter-name    element-element b". The frontend then adds another "element-" prefix, resulting in incorrect display. The fix should show only the element name (me.element field).

2. **Favorites integration** is incomplete - The star icon doesn't check if an element is in the user's favorites list before rendering, so it always shows as unfilled even for favorited elements.

This spec addresses fixing the display format to show only the element name and properly integrating the favorites system to show filled stars for favorited elements.

## Glossary

- **Meter**: A device or measurement entity that contains multiple elements
- **Meter_Element**: An individual element within a meter, identified by meter_id and element_id
- **Element**: The field-element name (e.g., "office", "element b") stored in meter_element.element field
- **Favorites**: User-specific list of favorited meters and meter elements stored in the favorite table
- **Star Icon**: Visual indicator showing whether an element is favorited (filled) or not (outlined)
- **MeterElementItem**: React component that renders a single meter element in the sidebar
- **Favorites Service**: Frontend service that manages API calls to fetch, add, and remove favorites
- **is_favorited**: Boolean flag indicating whether an element is in the user's favorites list

## Requirements

### Requirement 1: Display Element Name Correctly

**User Story:** As a user, I want to see only the element name in the sidebar, so that the display is clean and readable.

#### Acceptance Criteria

1. WHEN a meter element is displayed in the sidebar, THE MeterElementItem SHALL display only the element name (from meter_element.element field)
2. WHEN a meter element is rendered, THE displayed text SHALL NOT include the "element-" prefix
3. WHEN multiple meter elements are listed, THE element names SHALL be displayed consistently without formatting prefixes
4. WHEN the element name contains special characters or spaces, THE MeterElementItem SHALL display them as-is without modification

### Requirement 2: Load Favorites on Sidebar Initialization

**User Story:** As a user, I want the sidebar to know which elements I've favorited, so that the star icons display correctly when the sidebar loads.

#### Acceptance Criteria

1. WHEN the sidebar meter list loads, THE system SHALL fetch the user's favorites list from the backend
2. WHEN favorites are fetched, THE system SHALL retrieve all favorites for the current tenant and user
3. WHEN the favorites list is retrieved, THE system SHALL store it in a way that MeterElementItem components can access it
4. WHEN the sidebar is loading favorites, THE star icons SHALL display in a neutral state (not filled)
5. WHEN favorites fail to load, THE system SHALL log the error and continue displaying the sidebar with unfilled stars

### Requirement 3: Display Filled Star for Favorited Elements

**User Story:** As a user, I want to see filled stars for elements I've already favorited, so that I can quickly identify my favorite elements.

#### Acceptance Criteria

1. WHEN a meter element is displayed and it exists in the user's favorites list, THE star icon SHALL be filled (is_favorited=true)
2. WHEN a meter element is displayed and it does NOT exist in the user's favorites list, THE star icon SHALL be outlined (is_favorited=false)
3. WHEN checking if an element is favorited, THE system SHALL match both the meter_id (id1) and element_id (id2) from the favorites list
4. WHEN the user toggles a favorite, THE star icon state SHALL update immediately to reflect the change
5. WHEN the user adds an element to favorites, THE star icon SHALL become filled
6. WHEN the user removes an element from favorites, THE star icon SHALL become outlined

### Requirement 4: Integrate Favorites Service with MeterElementItem

**User Story:** As a developer, I want the MeterElementItem component to properly use the favorites service, so that the favorite toggle functionality works correctly.

#### Acceptance Criteria

1. WHEN MeterElementItem receives the favorites list as a prop, THE component SHALL use it to determine the initial is_favorited state
2. WHEN the star icon is clicked, THE component SHALL call the appropriate favorites service method (add or remove)
3. WHEN a favorite is added or removed, THE component SHALL update its local state to reflect the change
4. WHEN the favorites service call succeeds, THE star icon state SHALL update to match the new favorite status
5. WHEN the favorites service call fails, THE component SHALL display an error message and keep the star in its previous state

### Requirement 5: Ensure Backward Compatibility

**User Story:** As a developer, I want existing code that uses MeterElementItem to continue working, so that I don't break other parts of the application.

#### Acceptance Criteria

1. WHEN MeterElementItem is used without the new favorites props, THE component SHALL fall back to the old callback-based approach
2. WHEN the old isFavorite prop is provided, THE component SHALL use it if the new is_favorited prop is not provided
3. WHEN the old onFavoriteToggle callback is provided, THE component SHALL use it if the new on_star_click callback is not provided
4. WHEN both old and new props are provided, THE new props SHALL take precedence

