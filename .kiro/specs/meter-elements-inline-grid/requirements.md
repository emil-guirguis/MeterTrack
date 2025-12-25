# Requirements Document

## Introduction

Refactor the Meter Elements management to use a schema-based model and the new framework's inline grid component. This will provide a consistent, modern interface for managing meter elements with inline editing capabilities and optimistic UI updates.

## Glossary

- **MeterElementsWithSchema**: A schema-based model for meter elements following the same pattern as other WithSchema models
- **Inline Grid**: The new framework EditableDataGrid component that supports inline editing and row operations
- **Optimistic UI**: UI updates that appear immediately before server confirmation
- **Blank Row**: A new unsaved row that appears at the top of the grid until the user saves it

## Requirements

### Requirement 1

**User Story:** As a user, I want to manage meter elements using the framework's inline grid interface, so that I can add, edit, and delete elements efficiently without modal dialogs.

#### Acceptance Criteria

1. WHEN the meter elements tab is displayed THEN the system SHALL render the EditableDataGrid component with all existing meter elements
2. WHEN a user clicks the add button THEN the system SHALL insert a blank row at the top of the grid with empty fields
3. WHEN a user edits a cell in the grid THEN the system SHALL update the cell value immediately in the UI
4. WHEN a user saves changes to a meter element THEN the system SHALL persist the changes to the backend
5. WHEN a user deletes a meter element THEN the system SHALL remove it from the grid and the backend

### Requirement 2

**User Story:** As a developer, I want meter elements to follow the same schema-based model pattern as other entities, so that the codebase is consistent and maintainable.

#### Acceptance Criteria

1. WHEN the backend initializes THEN the system SHALL load meter element schema from MeterElementsWithSchema model
2. WHEN the frontend requests meter element schema THEN the system SHALL return the schema definition with all field metadata
3. WHEN a meter element is created or updated THEN the system SHALL validate against the schema definition
4. WHEN the schema is used for form rendering THEN the system SHALL apply all field constraints and validation rules

### Requirement 3

**User Story:** As a user, I want the grid to provide clear visual feedback during operations, so that I understand what's happening.

#### Acceptance Criteria

1. WHEN data is loading THEN the system SHALL display a loading indicator
2. WHEN an error occurs THEN the system SHALL display an error message with a retry option
3. WHEN a row is being saved THEN the system SHALL show a loading state on that row
4. WHEN a row is successfully saved THEN the system SHALL confirm the save with visual feedback
