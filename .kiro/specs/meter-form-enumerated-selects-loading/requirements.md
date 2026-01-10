# Requirements Document: Meter Form Enumerated Selects Loading

## Introduction

The meter form's enumerated select fields (specifically `device_id`) are not loading properly. When editing a meter, the select shows undefined values instead of actual device options. The error message indicates: "You have provided an out-of-range value `2` for the select (name="device_id") component. The available values are ``, `undefined`, `undefined`, `undefined`, `undefined`, `undefined`."

This prevents users from viewing or editing meter device assignments. The issue is specific to meter form validation and does not require changes to the device screen.

## Glossary

- **Enumerated Select**: A form field that displays a dropdown list of options fetched from the backend
- **Validation Data Provider**: A hook that fetches and formats data for enumerated select fields
- **Device**: An entity representing a meter device with properties like manufacturer and model_number
- **FormField**: The framework component that renders form inputs including selects
- **ValidationFieldSelect**: The component that wraps FormField for enumerated select rendering
- **Meter**: An entity that has a device_id field linking to a Device

## Requirements

### Requirement 1: Meter Form Device Select Loads Options

**User Story:** As a user, I want to see a list of available devices when editing a meter, so that I can select the correct device for the meter.

#### Acceptance Criteria

1. WHEN the meter form loads with a device_id value, THE System SHALL fetch available devices from the API
2. WHEN devices are fetched, THE System SHALL extract manufacturer and model_number fields from each device
3. WHEN devices are fetched, THE System SHALL format device options as {id, label} pairs where label combines manufacturer and model_number
4. WHEN device options are formatted, THE System SHALL pass them to the FormField component as valid MenuItem values
5. WHEN the select renders, THE System SHALL display device options with non-undefined values

### Requirement 2: Meter Device Select Value Matches Available Options

**User Story:** As a user, I want the meter's current device selection to be valid and displayed in the select, so that I can see what device is currently assigned.

#### Acceptance Criteria

1. WHEN a meter with device_id=2 is loaded, THE System SHALL ensure device_id=2 exists in the available options
2. WHEN the select renders with a value, THE System SHALL ensure the value matches one of the available option values
3. IF the device_id value doesn't match any available option, THE System SHALL either show an empty selection or display an error message

### Requirement 3: Validation Data Provider Returns Correct Device Format

**User Story:** As a developer, I want the validation data provider to return properly formatted device options for meter forms, so that the form can render them correctly.

#### Acceptance Criteria

1. WHEN validationDataProvider is called with entityName='device' for a meter form, THE System SHALL fetch devices from /device endpoint
2. WHEN devices are fetched, THE System SHALL filter to only active devices (active=true)
3. WHEN devices are filtered, THE System SHALL map each device to {id: device_id, label: "manufacturer - model_number"}
4. WHEN mapping devices, THE System SHALL handle missing manufacturer or model_number fields gracefully
5. WHEN all devices are mapped, THE System SHALL return an array of {id, label} objects with non-undefined values

### Requirement 4: FormField Renders Meter Device Options Without Undefined Values

**User Story:** As a user, I want the meter device select dropdown to show readable device names, not undefined values, so that I can make an informed selection.

#### Acceptance Criteria

1. WHEN FormField receives options array for device_id, THE System SHALL convert each option to a MenuItem component
2. WHEN MenuItem components are created, THE System SHALL use option.value as the MenuItem value prop
3. WHEN MenuItem components are created, THE System SHALL use option.label as the MenuItem display text
4. WHEN options are rendered, THE System SHALL ensure no MenuItem has an undefined value
5. WHEN the meter form renders, THE System SHALL display all device options with valid, readable labels

