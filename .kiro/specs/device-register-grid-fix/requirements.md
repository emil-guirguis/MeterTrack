# Requirements Document: Device Register Grid Loading Fix

## Introduction

The Device Register Grid is failing to load with a 500 error when attempting to fetch registers for a device. The issue occurs when the frontend calls the `/api/devices/{deviceId}/registers` endpoint. This spec addresses the root cause and implements a fix to ensure the register grid loads successfully.

## Glossary

- **Device**: A physical or logical device that can have multiple registers associated with it
- **Register**: A data point or measurement that can be associated with a device
- **Device Register**: The association between a device and a register
- **RegistersGrid**: The frontend component that displays and manages device registers

## Requirements

### Requirement 1: Fix Device Register Route Parameter Handling

**User Story:** As a user, I want the device register grid to load successfully, so that I can view and manage registers associated with a device.

#### Acceptance Criteria

1. WHEN a user navigates to a device form and views the Registers tab, THE System SHALL successfully fetch all registers associated with that device
2. WHEN the frontend calls GET `/api/devices/{deviceId}/registers`, THE System SHALL return a 200 status with the list of device registers
3. WHEN the backend receives a request to fetch device registers, THE System SHALL correctly parse the deviceId parameter from the URL
4. WHEN device registers are fetched, THE System SHALL return data in the format: `{ success: true, data: [...] }`
5. IF the device does not exist, THE System SHALL return a 404 status with an appropriate error message

### Requirement 2: Ensure Register Data Structure Consistency

**User Story:** As a developer, I want the register data returned from the API to have a consistent structure, so that the frontend can reliably display and manipulate the data.

#### Acceptance Criteria

1. WHEN device registers are fetched, THE System SHALL include the nested register object with all required fields (id, number, name, unit, field_name)
2. WHEN a register is added to a device, THE System SHALL return the created device_register with the complete register data structure
3. WHEN register data is returned, THE System SHALL ensure all timestamp fields (created_at, updated_at) are included

### Requirement 3: Validate Backend Route Configuration

**User Story:** As a developer, I want the backend routes to be properly configured, so that API requests are correctly routed to their handlers.

#### Acceptance Criteria

1. WHEN the server starts, THE System SHALL properly mount the device register routes with correct parameter handling
2. WHEN a request arrives at `/api/devices/{deviceId}/registers`, THE System SHALL correctly extract the deviceId parameter and pass it to the route handler
3. WHEN the route handler receives a request, THE System SHALL have access to the deviceId parameter via `req.params.deviceId`
