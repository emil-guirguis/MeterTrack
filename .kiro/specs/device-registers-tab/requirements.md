# Requirements Document - Device Registers Tab

## Introduction

The Device Registers Tab is a new feature that adds a "Registers" tab to the Device Form. This tab displays an editable datalist grid showing all registers associated with a device. The grid allows users to view, add, edit, and delete device registers inline. Registers are linked to devices through the existing `device_register` table, which joins the device, tenant, and register tables.

## Glossary

- **Device Register**: A junction record linking a device to a register, stored in the `device_register` table
- **Register**: A data point definition with fields: id, number, name, unit, field_name, tenant_id
- **Editable Grid**: An interactive table component that allows inline editing of cell values
- **Inline Editing**: The ability to edit cell values directly in the grid without opening a modal
- **Device**: The parent entity that owns the registers shown in the grid

## Requirements

### Requirement 1

**User Story:** As a device manager, I want to view all registers associated with a device in a dedicated tab, so that I can see what data points are being collected from the device.

#### Acceptance Criteria

1. WHEN a user opens the Device Form THEN the system SHALL display a "Registers" tab alongside other tabs
2. WHEN a user clicks the "Registers" tab THEN the system SHALL load and display all registers for the device
3. WHEN registers are loading THEN the system SHALL display a loading indicator
4. WHEN registers fail to load THEN the system SHALL display an error message with retry option
5. WHEN no registers exist for a device THEN the system SHALL display an empty state message

### Requirement 2

**User Story:** As a device manager, I want to see register details in a grid format, so that I can quickly review all register information.

#### Acceptance Criteria

1. WHEN the Registers tab is displayed THEN the system SHALL show a grid with columns: number, name, unit, field_name
2. WHEN the grid is displayed THEN each row SHALL represent one register associated with the device
3. WHEN a register row is displayed THEN the system SHALL show the register's number, name, unit, and field_name values
4. WHEN the grid has many registers THEN the system SHALL support pagination or scrolling
5. WHEN a user hovers over a cell THEN the system SHALL provide visual feedback indicating the cell is editable

### Requirement 3

**User Story:** As a device manager, I want to edit register details inline, so that I can quickly update register information without leaving the form.

#### Acceptance Criteria

1. WHEN a user clicks on a grid cell THEN the system SHALL enter edit mode for that cell
2. WHEN a cell is in edit mode THEN the system SHALL display an input field with the current value
3. WHEN a cell has focus THEN the system SHALL apply the same focus color as form field focus states
4. WHEN a user modifies a cell value and presses Enter THEN the system SHALL save the change to the backend
5. WHEN a user presses Escape while editing THEN the system SHALL cancel the edit and restore the original value
6. WHEN a cell value is saved THEN the system SHALL display a success indicator and update the grid

### Requirement 4

**User Story:** As a device manager, I want to add new registers to a device, so that I can expand the data points being collected.

#### Acceptance Criteria

1. WHEN the Registers tab is displayed THEN the system SHALL show an "Add Register" button in the grid header
2. WHEN a user clicks the "Add Register" button THEN the system SHALL display a modal or form to select a register
3. WHEN a user selects a register from the available registers THEN the system SHALL add it to the device
4. WHEN a register is successfully added THEN the system SHALL display it in the grid immediately
5. WHEN a register is already associated with the device THEN the system SHALL prevent adding it again

### Requirement 5

**User Story:** As a device manager, I want to remove registers from a device, so that I can stop collecting data points that are no longer needed.

#### Acceptance Criteria

1. WHEN a register row is displayed THEN the system SHALL show a delete button for that row
2. WHEN a user clicks the delete button THEN the system SHALL display a confirmation dialog
3. WHEN a user confirms the deletion THEN the system SHALL remove the register from the device
4. WHEN a register is successfully deleted THEN the system SHALL remove it from the grid immediately
5. WHEN a deletion fails THEN the system SHALL display an error message and keep the row in the grid

### Requirement 6

**User Story:** As a system administrator, I want the registers tab to be part of the device form schema, so that it integrates seamlessly with the existing form structure.

#### Acceptance Criteria

1. WHEN the Device Form loads THEN the system SHALL include the Registers tab in the tab navigation
2. WHEN the Registers tab is added THEN the system SHALL use the existing formGrouping metadata pattern
3. WHEN the form is submitted THEN the system SHALL NOT include register changes in the device form submission
4. WHEN the device is saved THEN the system SHALL preserve all register associations
5. WHEN the form is cancelled THEN the system SHALL discard any unsaved register changes

### Requirement 7

**User Story:** As a developer, I want API endpoints for managing device registers, so that the frontend can perform CRUD operations.

#### Acceptance Criteria

1. WHEN a GET request is made to `/api/devices/:deviceId/registers` THEN the system SHALL return all registers for the device
2. WHEN a POST request is made to `/api/devices/:deviceId/registers` THEN the system SHALL create a new device_register record
3. WHEN a PUT request is made to `/api/devices/:deviceId/registers/:registerId` THEN the system SHALL update the register association
4. WHEN a DELETE request is made to `/api/devices/:deviceId/registers/:registerId` THEN the system SHALL remove the register association
5. WHEN an API request is made THEN the system SHALL validate tenant ownership and permissions

