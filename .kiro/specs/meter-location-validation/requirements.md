# Requirements Document: Meter Location Validation

## Introduction

The Meter entity has a relationship to the Location entity through the `location_id` foreign key. Currently, the meter form does not display location names in the location dropdown. This feature populates the location dropdown with location names from the Location schema, allowing users to select locations by name instead of ID.

## Glossary

- **Meter**: An entity representing a utility meter (electric, gas, water, etc.) that measures consumption
- **Location**: An entity representing a physical location where meters are installed
- **location_id**: The foreign key field in the Meter entity that references a Location entity
- **Validation Field**: A field in the schema marked with `validate: true` that indicates which field should be displayed in dropdowns for that entity
- **Dropdown**: A form control that displays a list of selectable options

## Requirements

### Requirement 1

**User Story:** As a user, I want to select a location by name in the meter form, so that I can easily identify and assign the correct location to a meter.

#### Acceptance Criteria

1. WHEN the meter form loads THEN the system SHALL fetch all locations and populate the location_id dropdown with location names
2. WHEN the location dropdown is displayed THEN the system SHALL show location names as the selectable options
3. WHEN a user selects a location from the dropdown THEN the system SHALL set the location_id field to the selected location's ID
4. WHEN the meter form is in edit mode THEN the system SHALL pre-select the current location in the dropdown
5. WHEN no locations exist THEN the system SHALL display the location dropdown as empty or disabled
