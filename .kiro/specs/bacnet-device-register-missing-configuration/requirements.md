# Requirements Document: BACnet Device Register Missing Configuration

## Introduction

The BACnet Meter Reading Agent is unable to read meters because devices lack register configurations in the device_register table. While devices exist in the device table and are referenced by meters, they have no associated registers in the device_register table, causing the meter reading process to skip those devices.

## Glossary

- **Device**: A BACnet device that can be read from (identified by device_id)
- **Register**: A specific data point on a device (e.g., power_a, power_b, voltage)
- **Device Register**: A mapping between a device and its readable registers
- **Meter**: A logical entity that reads from one or more devices
- **Meter Element**: A specific element/phase of a meter (e.g., phase A, phase B)
- **BACnet Agent**: The service that reads meter data from BACnet devices
- **Cache**: In-memory storage of device and register configurations for fast lookup

## Requirements

### Requirement 1: Detect Missing Device Register Configurations

**User Story:** As a system administrator, I want to detect when devices lack register configurations, so that I can identify and fix configuration gaps before meter reading attempts fail.

#### Acceptance Criteria

1. WHEN the BACnet Agent starts, THE System SHALL check if all devices referenced by active meters have at least one register configured
2. WHEN a device has no registers configured, THE System SHALL log a warning with the device ID and associated meter IDs
3. WHEN all devices have proper register configurations, THE System SHALL proceed with meter reading without warnings
4. IF a device is missing register configurations, THE System SHALL provide actionable information about which device and which meters are affected

### Requirement 2: Provide Configuration Guidance

**User Story:** As a developer, I want clear guidance on how to configure device registers, so that I can properly set up the device_register table.

#### Acceptance Criteria

1. WHEN a device lacks register configurations, THE System SHALL log the expected structure of device_register entries
2. THE System SHALL document which registers are available for the device type
3. THE System SHALL provide example SQL or API calls to add missing register configurations
4. THE System SHALL indicate the minimum number of registers required per device

### Requirement 3: Validate Device Register Configuration Integrity

**User Story:** As a system operator, I want to ensure device register configurations are complete and valid, so that meter reading operations can proceed reliably.

#### Acceptance Criteria

1. WHEN device_register entries are loaded into cache, THE System SHALL validate that each entry has valid device_id, register_id, and register values
2. IF a device_register entry references a non-existent device or register, THE System SHALL log an error and skip that entry
3. WHEN all device_register entries are valid, THE System SHALL confirm the cache is ready for use
4. THE System SHALL provide a summary of how many devices have valid register configurations

### Requirement 4: Handle Devices with No Registers Gracefully

**User Story:** As a system operator, I want the meter reading process to handle missing register configurations gracefully, so that the system doesn't crash and provides clear feedback.

#### Acceptance Criteria

1. WHEN a meter's device has no registers configured, THE System SHALL skip that meter and log the reason
2. WHEN a meter is skipped due to missing configuration, THE System SHALL record this as a collection error with actionable details
3. THE System SHALL continue processing other meters even if some devices lack register configurations
4. WHEN meter reading completes, THE System SHALL provide a summary of skipped meters and their reasons

