# Requirements Document

## Introduction

This feature enhances the meter form by replacing the hardcoded brand dropdown and free-text model field with dynamic validation against the device list. This ensures data consistency between meters and devices, prevents data entry errors, and establishes a proper relationship between meters and their corresponding device records.

## Glossary

- **Meter Form**: The user interface component used to create or edit meter records in the system
- **Device List**: The collection of device records stored in the database, each containing brand and model_number information
- **Device Record**: A database entity representing a specific device type with brand, model_number, and description fields
- **Brand Field**: The input field in the meter form that captures the device manufacturer name
- **Model Field**: The input field in the meter form that captures the device model number
- **Device Dropdown**: A user interface component that displays available devices from the device list for selection
- **Device Store**: The frontend state management store that handles device data retrieval and caching
- **Form Validation**: The process of verifying that user input meets required criteria before submission

## Requirements

### Requirement 1

**User Story:** As a meter administrator, I want to select a device from the existing device list when creating or editing a meter, so that I ensure consistency between meter and device records.

#### Acceptance Criteria

1. WHEN the Meter Form loads, THE Meter Form SHALL fetch all available Device Records from the Device Store
2. THE Meter Form SHALL display a Device Dropdown containing all Device Records formatted as "brand - model_number"
3. WHEN a user selects a Device Record from the Device Dropdown, THE Meter Form SHALL populate both the brand and model fields with the selected device's brand and model_number values
4. THE Meter Form SHALL store the device_id reference to maintain the relationship between the meter and the Device Record
5. WHEN a user submits the Meter Form, THE Meter Form SHALL include the device_id in the submission payload

### Requirement 2

**User Story:** As a meter administrator, I want to see clear error messages when device data is unavailable, so that I understand why I cannot complete the meter form.

#### Acceptance Criteria

1. IF the Device Store fails to load Device Records, THEN THE Meter Form SHALL display an error message indicating that devices could not be loaded
2. WHILE Device Records are being fetched, THE Meter Form SHALL display a loading indicator in the Device Dropdown
3. IF no Device Records exist in the system, THEN THE Meter Form SHALL display a message prompting the user to create devices first
4. THE Meter Form SHALL disable the submit button WHILE Device Records are loading

### Requirement 3

**User Story:** As a meter administrator, I want the form to validate that a device is selected before submission, so that all meters have valid device associations.

#### Acceptance Criteria

1. WHEN a user attempts to submit the Meter Form without selecting a device, THE Meter Form SHALL display a validation error message stating "Device selection is required"
2. THE Meter Form SHALL prevent form submission IF no Device Record is selected
3. WHEN a user selects a Device Record, THE Meter Form SHALL clear any existing validation errors for the device field
4. THE Meter Form SHALL mark the Device Dropdown as a required field with a visual indicator

### Requirement 4

**User Story:** As a meter administrator editing an existing meter, I want to see the currently associated device pre-selected in the form, so that I can verify or change the device association.

#### Acceptance Criteria

1. WHEN the Meter Form loads in edit mode with an existing meter, THE Meter Form SHALL pre-select the Device Record that matches the meter's device_id
2. IF the meter has device_id but the corresponding Device Record no longer exists, THEN THE Meter Form SHALL display a warning message indicating the device is no longer available
3. WHEN editing a meter, THE Meter Form SHALL allow the user to change the selected Device Record
4. THE Meter Form SHALL preserve backward compatibility by handling meters that have brand and model values but no device_id

### Requirement 5

**User Story:** As a system administrator, I want the device selection to integrate seamlessly with the existing meter form, so that the user experience remains consistent and intuitive.

#### Acceptance Criteria

1. THE Meter Form SHALL replace the existing Brand Field dropdown and Model Field text input with a single Device Dropdown
2. THE Meter Form SHALL maintain the same visual styling and layout as the existing form fields
3. THE Meter Form SHALL position the Device Dropdown in the "Basic Information" section where the brand and model fields currently exist
4. THE Meter Form SHALL include a link or button to navigate to the device management page for users who need to add new devices
5. THE Meter Form SHALL maintain all other existing form functionality including connection settings, location, description, and register map editor
