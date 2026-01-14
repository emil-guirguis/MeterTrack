# Requirements Document: Meter Reading Batch Insertion

## Introduction

After meter readings are collected from BACnet devices and cached per element, the system must create and execute INSERT statements to persist these readings into the meter_reading table. This feature ensures that all collected meter readings are properly stored with their associated register field names and values in the appropriate database columns.

## Glossary

- **Meter Reading**: A single data point collected from a meter at a specific timestamp
- **Register**: A configuration entity that defines how meter data should be stored (includes field_name mapping)
- **Device Register**: A mapping between a device and its configured registers
- **Field Name**: The column name in the meter_reading table where a specific register's value should be stored
- **Meter Reading Cache**: In-memory cache of collected readings organized by meter and element
- **Batch Insert**: Multiple INSERT statements executed together for performance
- **Meter Element**: A specific element/component of a meter (e.g., phase A, phase B)

## Requirements

### Requirement 1: Build Meter Reading Cache from Collected Data

**User Story:** As a sync system, I want to accumulate meter readings in memory during collection, so that I can batch insert them efficiently into the database.

#### Acceptance Criteria

1. WHEN meter readings are collected from BACnet devices, THE System SHALL store them in an in-memory cache organized by meter_id and meter_element_id
2. WHEN a reading is collected, THE System SHALL include the meter_id, timestamp, register_id, field_name, value, and unit in the cache
3. WHEN readings are cached, THE System SHALL maintain the association between each reading and its corresponding register field_name
4. WHILE readings are being collected, THE System SHALL allow the cache to grow without executing database operations
5. WHEN the collection cycle completes, THE System SHALL have all readings ready for batch insertion

### Requirement 2: Map Register Field Names to Meter Readings

**User Story:** As a sync system, I want to map each meter reading to its register's field_name, so that values are stored in the correct database columns.

#### Acceptance Criteria

1. WHEN a meter reading is collected, THE System SHALL look up the corresponding register using the register_id
2. WHEN a register is found, THE System SHALL extract the field_name from the register configuration
3. WHEN a field_name is extracted, THE System SHALL associate it with the meter reading for later insertion
4. IF a register is not found for a reading, THEN THE System SHALL log a warning and skip that reading
5. WHEN all readings are processed, THE System SHALL have a complete mapping of readings to their target columns

### Requirement 3: Generate Batch INSERT Statements

**User Story:** As a sync system, I want to generate efficient batch INSERT statements, so that I can persist all meter readings in a single database operation.

#### Acceptance Criteria

1. WHEN readings are ready for insertion, THE System SHALL generate a single INSERT statement with multiple value rows
2. WHEN generating the INSERT statement, THE System SHALL include all required columns: meter_id, timestamp, data_point (field_name), value, unit, is_synchronized, retry_count
3. WHEN generating the INSERT statement, THE System SHALL default is_synchronized to false for all readings
4. WHEN generating the INSERT statement, THE System SHALL default retry_count to 0 for all readings
5. WHEN the INSERT statement is generated, THE System SHALL batch readings into groups of 100 or fewer for optimal performance
6. WHEN multiple batches are needed, THE System SHALL generate separate INSERT statements for each batch

### Requirement 4: Execute Batch INSERT Statements

**User Story:** As a sync system, I want to execute the generated INSERT statements, so that meter readings are persisted to the database.

#### Acceptance Criteria

1. WHEN a batch INSERT statement is ready, THE System SHALL execute it against the sync database
2. WHEN the INSERT statement executes successfully, THE System SHALL log the number of rows inserted
3. WHEN the INSERT statement executes successfully, THE System SHALL mark the readings as synchronized in the cache
4. IF the INSERT statement fails, THEN THE System SHALL log the error with details about which readings failed
5. IF the INSERT statement fails, THEN THE System SHALL retry the batch up to 3 times before giving up
6. WHEN all batches have been processed, THE System SHALL return a summary of total readings inserted

### Requirement 5: Handle Default Values for All Meters and Registers

**User Story:** As a sync system, I want to ensure all meter readings have proper default values, so that the database maintains data integrity.

#### Acceptance Criteria

1. WHEN a meter reading is inserted, THE System SHALL default meter_id to the collected meter's ID
2. WHEN a meter reading is inserted, THE System SHALL default register_id to the register associated with the field_name
3. WHEN a meter reading is inserted, THE System SHALL default is_synchronized to false
4. WHEN a meter reading is inserted, THE System SHALL default retry_count to 0
5. WHEN a meter reading is inserted, THE System SHALL use the field_name from the register as the data_point column value
6. WHEN a meter reading is inserted, THE System SHALL include the unit from the register if available

### Requirement 6: Validate Meter Reading Data Before Insertion

**User Story:** As a sync system, I want to validate meter readings before insertion, so that invalid data doesn't corrupt the database.

#### Acceptance Criteria

1. WHEN a meter reading is prepared for insertion, THE System SHALL validate that meter_id is not null
2. WHEN a meter reading is prepared for insertion, THE System SHALL validate that timestamp is a valid date
3. WHEN a meter reading is prepared for insertion, THE System SHALL validate that value is a valid number
4. WHEN a meter reading is prepared for insertion, THE System SHALL validate that field_name is not empty
5. IF validation fails for a reading, THEN THE System SHALL log the validation error and exclude that reading from insertion
6. WHEN all readings are validated, THE System SHALL report the count of valid and invalid readings

### Requirement 7: Provide Insertion Status and Metrics

**User Story:** As a sync system, I want to track insertion metrics, so that I can monitor the health of the meter reading persistence process.

#### Acceptance Criteria

1. WHEN batch insertion completes, THE System SHALL return the total number of readings inserted
2. WHEN batch insertion completes, THE System SHALL return the total number of readings that failed
3. WHEN batch insertion completes, THE System SHALL return the total number of readings that were skipped due to validation errors
4. WHEN batch insertion completes, THE System SHALL return the timestamp of the insertion operation
5. WHEN batch insertion completes, THE System SHALL return any error messages from failed batches
6. WHEN batch insertion completes, THE System SHALL log all metrics for audit purposes
