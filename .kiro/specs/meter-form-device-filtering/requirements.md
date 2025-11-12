# Requirements Document

## Introduction

This feature enhances the MeterForm component to properly filter devices by type, ensuring only meter-compatible devices are displayed in the device selection dropdown. Additionally, it ensures the form properly saves all device-related data when the save button is pressed.

## Glossary

- **MeterForm**: The React component responsible for creating and editing meter records in the web application
- **Device**: A hardware device entity with properties including id, type, manufacturer, model_number, and description
- **Meter Device**: A device with type property set to "meter" that is compatible with meter installations
- **Device Dropdown**: The select input element in MeterForm that displays available devices for selection
- **Form Submission**: The process of validating and saving meter data when the user clicks the save button

## Requirements

### Requirement 1

**User Story:** As a user creating or editing a meter, I want to see only meter-compatible devices in the device dropdown, so that I cannot accidentally select incompatible device types.

#### Acceptance Criteria

1. WHEN the MeterForm component loads device data, THE Device Dropdown SHALL display only devices where the type property equals "meter"
2. WHEN a device has a type property that does not equal "meter", THE Device Dropdown SHALL exclude that device from the available options
3. WHEN the device list contains zero devices with type "meter", THE Device Dropdown SHALL display an empty list with appropriate messaging
4. WHEN devices are being fetched from the API, THE Device Dropdown SHALL display a loading state to the user
5. WHEN the user opens the device dropdown, THE Device Dropdown SHALL show devices in the format "{manufacturer} - {model_number}" for meter-type devices only

### Requirement 2

**User Story:** As a user submitting the meter form, I want the form to save all device-related fields correctly, so that the meter record contains complete and accurate device information.

#### Acceptance Criteria

1. WHEN the user selects a device from the dropdown and clicks save, THE MeterForm SHALL include the device_id field in the submission payload
2. WHEN the user selects a device from the dropdown and clicks save, THE MeterForm SHALL include the device manufacturer in the submission payload
3. WHEN the user selects a device from the dropdown and clicks save, THE MeterForm SHALL include the device model_number in the submission payload
4. WHEN the form validation runs before submission, THE MeterForm SHALL verify that device_id, device, and model fields are all populated
5. WHEN the save button is clicked without a device selected, THE MeterForm SHALL prevent submission and display a validation error message
