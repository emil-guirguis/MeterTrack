# Requirements Document: Meter Element Dropdown Selection Fix

## Introduction

When adding a new row to the Meter Elements grid and selecting a value from the element dropdown, the selected value is not being displayed in the cell after the dropdown closes. The dropdown opens and closes correctly, but the selected text fails to populate the cell.

## Glossary

- **EditableDataGrid**: A reusable data grid component that supports inline editing with text and select fields
- **MeterElement**: A data model representing an element associated with a meter
- **Element Field**: A dropdown select field that allows users to choose from predefined element options (A-Z)
- **Unsaved Row**: A temporary row created when the user clicks "Add" before the data is persisted to the backend

## Requirements

### Requirement 1: Dropdown Selection Persists to Cell

**User Story:** As a user, I want to select a value from the element dropdown in a new meter element row, so that the selected value is displayed in the cell after I close the dropdown.

#### Acceptance Criteria

1. WHEN a user clicks on the element cell in a new row THEN the system SHALL display a dropdown with available element options
2. WHEN a user selects a value from the dropdown THEN the system SHALL close the dropdown and display the selected value in the cell
3. WHEN a user selects a value from the dropdown THEN the system SHALL update the internal state to reflect the selected value
4. WHEN a user selects a value from the dropdown THEN the system SHALL trigger the onCellChange callback with the selected value
5. WHEN a user selects a value from the dropdown THEN the system SHALL trigger the onCellBlur callback to enable auto-save functionality

### Requirement 2: Dropdown Selection Works for Both New and Existing Rows

**User Story:** As a user, I want dropdown selection to work consistently whether I'm adding a new element or editing an existing one.

#### Acceptance Criteria

1. WHEN a user selects a value from the dropdown in a new unsaved row THEN the system SHALL display the selected value in the cell
2. WHEN a user selects a value from the dropdown in an existing saved row THEN the system SHALL display the selected value in the cell
3. WHEN a user selects a value from the dropdown THEN the system SHALL maintain the same behavior regardless of row type

### Requirement 3: Dropdown Selection Enables Auto-Save

**User Story:** As a user, I want the selected dropdown value to trigger auto-save so that my changes are persisted without additional clicks.

#### Acceptance Criteria

1. WHEN a user selects a value from the dropdown in a new row THEN the system SHALL auto-save the row if all required fields are populated
2. WHEN a user selects a value from the dropdown in an existing row THEN the system SHALL auto-save the change to the backend
3. WHEN auto-save is triggered THEN the system SHALL show a success message to the user
