# Requirements Document: Meter Element Duplicate Validation

## Introduction

The meter form's elements grid allows users to add and manage individual elements associated with a meter. Currently, the system has partial duplicate validation logic, but it needs to be comprehensive and consistent across all operations (add, edit, delete). This feature ensures that each element value (A-Z) can only be assigned once per meter, preventing data inconsistency and confusion.

## Glossary

- **MeterElement**: A data model representing an individual element (identified by a letter A-Z) associated with a meter
- **Element Field**: The field containing the element identifier (A-Z) that must be unique per meter
- **ElementsGrid**: The frontend component that displays and manages meter elements in a tabular format
- **Duplicate Element**: When two or more meter elements have the same element value within the same meter
- **Unsaved Row**: A temporary row created when the user clicks "Add" before the data is persisted to the backend
- **Saved Row**: A meter element that has been persisted to the backend database

## Requirements

### Requirement 1: Prevent Duplicate Elements on Add

**User Story:** As a user, I want the system to prevent me from adding a meter element with a duplicate element value, so that each element is unique within a meter.

#### Acceptance Criteria

1. WHEN a user attempts to add a new element with an element value that already exists in the meter THEN the system SHALL reject the addition and display an error message
2. WHEN a user attempts to add a new element with a duplicate element value THEN the system SHALL prevent the row from being saved to the backend
3. WHEN a user attempts to add a new element with a duplicate element value THEN the system SHALL display the error message "Element '[value]' is already assigned to this meter"
4. WHEN a user adds a new element with a unique element value THEN the system SHALL allow the addition and save it to the backend

### Requirement 2: Prevent Duplicate Elements on Edit

**User Story:** As a user, I want the system to prevent me from changing an element's value to one that already exists in the meter, so that element uniqueness is maintained.

#### Acceptance Criteria

1. WHEN a user attempts to change an existing element's value to one that already exists in the meter THEN the system SHALL reject the change and display an error message
2. WHEN a user attempts to change an existing element's value to a duplicate THEN the system SHALL prevent the change from being saved to the backend
3. WHEN a user attempts to change an existing element's value to a duplicate THEN the system SHALL display the error message "Element '[value]' is already assigned to this meter"
4. WHEN a user changes an existing element's value to a unique value THEN the system SHALL allow the change and save it to the backend
5. WHEN a user changes an existing element's value to its current value THEN the system SHALL allow the change without validation errors

### Requirement 3: Validate Duplicates Across Frontend and Backend

**User Story:** As a system, I want to validate duplicate elements both on the frontend and backend, so that data integrity is maintained regardless of how the API is accessed.

#### Acceptance Criteria

1. WHEN a user attempts to add or edit an element in the frontend grid THEN the system SHALL validate for duplicates before sending the request to the backend
2. WHEN a request to add or edit an element reaches the backend THEN the system SHALL validate for duplicates and reject invalid requests
3. WHEN the backend rejects a duplicate element request THEN the frontend SHALL display the error message to the user
4. WHEN the backend validation fails THEN the system SHALL not persist the invalid data to the database

### Requirement 4: Handle Unsaved Row Duplicate Validation

**User Story:** As a user, I want duplicate validation to work correctly when I'm adding a new element before it's saved, so that I get immediate feedback.

#### Acceptance Criteria

1. WHEN a user is editing an unsaved row and changes the element value to match an existing saved element THEN the system SHALL display a duplicate error
2. WHEN a user is editing an unsaved row and changes the element value to a unique value THEN the system SHALL clear any previous duplicate errors
3. WHEN a user has an unsaved row with a duplicate element value THEN the system SHALL prevent auto-save from occurring
4. WHEN a user clears the duplicate error by changing to a unique value THEN the system SHALL allow auto-save to proceed

### Requirement 5: Maintain Data Consistency After Delete

**User Story:** As a user, I want the system to update validation state after deleting an element, so that previously blocked values become available again.

#### Acceptance Criteria

1. WHEN a user deletes an element with value 'X' THEN the system SHALL remove 'X' from the list of assigned elements
2. WHEN a user deletes an element THEN the system SHALL allow other elements to be changed to the deleted value without triggering a duplicate error
3. WHEN a user deletes an element THEN the system SHALL update the frontend grid to reflect the change immediately
