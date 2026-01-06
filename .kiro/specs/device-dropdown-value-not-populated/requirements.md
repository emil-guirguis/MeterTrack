# Requirements: Device Dropdown Value Not Populated in Meter Form

## Introduction

When creating a new meter and selecting a device from the device dropdown in the "Device" field, the popup closes but the selected device value is not populated into the form field. The form field remains empty after selection.

## Glossary

- **Device Field**: The `device_id` field in the Meter form that displays a dropdown of available devices
- **ValidationFieldSelect**: The framework component that renders validation fields (foreign key relationships) as dropdowns
- **useValidationDataProvider**: The hook that fetches and formats device options for the dropdown
- **Meter Schema**: The backend schema definition that configures the device_id field with `validate: true`
- **Form State**: The internal state managed by BaseForm that tracks form field values

## Requirements

### Requirement 1: Device Dropdown Selection Populates Form Field

**User Story:** As a user creating a new meter, I want to select a device from the dropdown and have that selection automatically populate the Device field, so that I can complete the meter creation form.

#### Acceptance Criteria

1. WHEN a user clicks the Device dropdown field THEN the system SHALL display a list of available active devices
2. WHEN a user selects a device from the dropdown THEN the system SHALL close the dropdown popup
3. WHEN a user selects a device from the dropdown THEN the system SHALL populate the selected device ID into the Device form field
4. WHEN a user selects a device from the dropdown THEN the system SHALL display the device label (manufacturer - model_number) in the form field
5. WHEN the form field is populated with a device selection THEN the system SHALL retain that value when the user navigates to other form fields
6. WHEN the form field is populated with a device selection THEN the system SHALL include that value when the user submits the form

### Requirement 2: Device Dropdown Uses Correct Display Fields

**User Story:** As a user, I want the device dropdown to display meaningful device information, so that I can easily identify and select the correct device.

#### Acceptance Criteria

1. WHEN the device dropdown is displayed THEN the system SHALL show each device with a label combining manufacturer and model_number fields
2. WHEN a device has no manufacturer or model_number THEN the system SHALL display a fallback label with the device ID
3. WHEN the device dropdown is populated THEN the system SHALL only show active devices (active = true)
4. WHEN the device dropdown is displayed THEN the system SHALL order devices by their description field in ascending order

### Requirement 3: Form State Synchronization

**User Story:** As a developer, I want the form state to be properly synchronized when a device is selected, so that the form behaves predictably and data is not lost.

#### Acceptance Criteria

1. WHEN a device is selected from the dropdown THEN the system SHALL call the onChange handler with the selected device ID
2. WHEN the onChange handler is called THEN the system SHALL update the form state with the new device_id value
3. WHEN the form state is updated THEN the system SHALL trigger a re-render of the form field to display the new value
4. WHEN the form state is updated THEN the system SHALL clear any validation errors for the device field
