# Requirements Document

## Introduction

Currently, the meter form accepts a free-text location field, which leads to inconsistent data and makes it difficult to track meters by location. The system should validate the meter's location field against the existing location module to ensure data integrity and enable proper location-based meter tracking.

## Glossary

- **Meter**: A device that measures utility consumption (electric, gas, water, etc.)
- **Location**: A physical place/building managed in the location module with structured address and contact information
- **Location Validation**: The process of ensuring a meter's location references a valid location ID from the location module
- **Location Dropdown**: A UI component that displays available locations for selection

## Requirements

### Requirement 1

**User Story:** As a user creating or editing a meter, I want to select from existing locations, so that meter location data is consistent and accurate.

#### Acceptance Criteria

1. THE System SHALL display a dropdown of available locations in the meter form
2. THE System SHALL show location name and city in the dropdown options
3. THE System SHALL require location selection before meter creation or update
4. THE System SHALL store the location ID reference in the meter record
5. THE System SHALL display the full location name when showing meter details

### Requirement 2

**User Story:** As a user, I want to see only active locations in the meter form, so that I don't accidentally assign meters to inactive locations.

#### Acceptance Criteria

1. THE System SHALL filter the location dropdown to show only active locations
2. WHEN no active locations exist, THE System SHALL display a message prompting the user to create a location first
3. THE System SHALL provide a link to the location management page from the meter form
4. WHEN a meter references an inactive location, THE System SHALL display a warning in edit mode
5. THE System SHALL allow updating the meter to reference a different active location

### Requirement 3

**User Story:** As a developer, I want the backend to validate location IDs, so that invalid location references cannot be saved.

#### Acceptance Criteria

1. THE System SHALL validate that the provided location ID exists in the location table
2. THE System SHALL validate that the location is active before allowing meter creation
3. WHEN an invalid location ID is provided, THE System SHALL return a validation error
4. THE System SHALL return the full location details when retrieving meter information
5. THE System SHALL maintain referential integrity between meters and locations
