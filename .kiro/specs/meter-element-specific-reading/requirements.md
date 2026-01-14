# Requirements Document: Meter Element-Specific Reading

## Introduction

When reading meter data via BACnet, the system needs to read data from specific meter elements. A single meter device can have multiple elements (A, B, C, D, E, F, etc.), each representing a different measurement point. For each element, the system reads all registers configured for that device, calculating element-specific register numbers based on the element: element A uses the base register number, element B adds a "1" prefix (11000 for base 1000), element C adds "2" (21000), etc. The system must cache registers at startup, query device-configured registers, calculate correct register numbers per element, and store readings using the field_name from the register table.

## Glossary

- **Meter**: A physical device that measures consumption (e.g., electricity, water)
- **Element**: A specific component within a meter (A, B, C, D, etc.) that determines register number calculation
- **Register**: A BACnet object identifier (e.g., 1100) that maps to a specific measurement
- **Register Number**: The calculated BACnet register value based on element (e.g., 1100 for element A, 11100 for element B)
- **Field Name**: The column name in meter_reading table where the value is stored (from register.field_name)
- **CachedMeter**: In-memory representation of a meter with device_id and element
- **BACnet**: Building Automation and Control Networks protocol used for meter communication
- **Device Register**: Mapping between a device and its configured registers (device_register table)

## Requirements

### Requirement 1: Cache Register Table at MCP Server Startup

**User Story:** As a system architect, I want the register table cached when the MCP server starts, so that register lookups are fast during meter collection.

#### Acceptance Criteria

1. WHEN the MCP server initializes, THE system SHALL load all registers from the register table into memory
2. WHEN a register is loaded, THE system SHALL store register_id, name, register (number), unit, and field_name
3. WHEN the register cache is loaded, THE system SHALL log the count of registers loaded
4. WHEN a register lookup is needed, THE system SHALL retrieve it from the in-memory cache (not database)

### Requirement 2: Calculate Element-Specific Register Numbers

**User Story:** As a meter technician, I want the system to automatically calculate the correct register number based on the meter element, so that readings are taken from the correct BACnet object.

#### Acceptance Criteria

1. WHEN a meter with element A is read, THE system SHALL use the base register number from the register table
2. WHEN a meter with element B is read, THE system SHALL prepend "1" to the register number (e.g., 1100 becomes 11100)
3. WHEN a meter with element C is read, THE system SHALL prepend "2" to the register number (e.g., 1100 becomes 21100)
4. WHEN a meter with element D is read, THE system SHALL prepend "3" to the register number (e.g., 1100 becomes 31100)
5. WHEN calculating register numbers, THE system SHALL handle any element letter (A-Z) by using its position (A=0, B=1, C=2, etc.)

### Requirement 3: Read Device-Specific Registers

**User Story:** As a system operator, I want the meter collection system to read all registers configured for each device, so that collection is efficient and accurate.

#### Acceptance Criteria

1. WHEN collecting data from a meter element, THE system SHALL retrieve the device_id from the cached meter
2. WHEN a device_id is known, THE system SHALL query device_register table to find all registers configured for that device
3. WHEN device registers are found, THE system SHALL join with the register table to get register details (register number, field_name, unit)
4. WHEN BACnet reading is performed, THE system SHALL read ALL configured registers for that device (not just one hardcoded register)
5. WHEN a register cannot be read, THE system SHALL log the error and continue with other registers
6. WHEN multiple registers are configured for a device, THE system SHALL read them all in a single collection cycle

### Requirement 4: Store Readings with Correct Field Names

**User Story:** As a data analyst, I want meter readings stored with the correct field names from the register table, so that data is properly organized in the meter_reading table.

#### Acceptance Criteria

1. WHEN a BACnet reading is obtained, THE system SHALL map it to the corresponding register using the register number
2. WHEN a register is identified, THE system SHALL retrieve the field_name from the cached register
3. WHEN storing a reading, THE system SHALL use the field_name as the column name in the meter_reading table
4. WHEN a reading is stored, THE system SHALL include the value, unit, timestamp, and meter_id
5. WHEN a field_name is not available, THE system SHALL log an error and skip that reading

### Requirement 6: Handle Multiple Meter Elements

**User Story:** As a meter technician, I want the system to handle meters with multiple elements (A through F), so that I can measure different aspects of the same device.

#### Acceptance Criteria

1. WHEN a meter has multiple elements in the meter_element table, THE system SHALL load all elements into the meter cache
2. WHEN collecting data, THE system SHALL process each meter element separately
3. WHEN processing a meter element, THE system SHALL use the element letter to calculate register numbers
4. WHEN storing readings from different elements, THE system SHALL include the element identifier in the reading
5. WHEN a meter has 6 elements (A, B, C, D, E, F), THE system SHALL collect readings from all 6 elements in a single collection cycle
6. WHEN multiple elements are configured, THE system SHALL read all configured registers for each element

**User Story:** As a system administrator, I want the register and meter caches to be refreshed after a remote-to-local sync completes, so that any configuration changes are immediately reflected in the collection system.

#### Acceptance Criteria

1. WHEN a remote-to-local sync completes successfully, THE system SHALL check which tables were modified
2. WHEN the register table is modified during sync, THE system SHALL reload the RegisterCache
3. WHEN the meter table is modified during sync, THE system SHALL reload the MeterCache
4. WHEN a cache reload is triggered, THE system SHALL log the cache reload event
5. WHEN a cache reload fails, THE system SHALL log the error and continue (do not stop collection)
6. WHEN multiple tables are modified, THE system SHALL reload all affected caches

