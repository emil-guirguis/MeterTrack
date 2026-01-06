# Requirements Document: Device Form Issues

## Introduction

When creating a new device, there are two issues:
1. The active toggle is not defaulted to true
2. The save button is not working

## Glossary

- **Active Toggle**: Boolean field that indicates if a device is active
- **Default Value**: The initial value assigned to a field when creating a new entity
- **Save Button**: UI control that submits the form to create/update a device

## Requirements

### Requirement 1: Active Toggle Default Value

**User Story:** As a user, I want the active toggle to be defaulted to true when creating a new device, so that new devices are active by default.

#### Acceptance Criteria

1. WHEN creating a new device, THE System SHALL set the active field to true by default
2. WHEN the form loads for a new device, THE active toggle SHALL display as enabled/checked
3. WHEN a user saves a new device without changing the active field, THE device SHALL be created with active=true

### Requirement 2: Save Button Functionality

**User Story:** As a user, I want the save button to work when creating a new device, so that I can save my device data.

#### Acceptance Criteria

1. WHEN a user fills in the required device fields and clicks save, THE System SHALL submit the form
2. WHEN the form is submitted, THE System SHALL send the device data to the API
3. WHEN the API returns success, THE System SHALL close the form and refresh the device list
4. WHEN the API returns an error, THE System SHALL display the error message to the user
