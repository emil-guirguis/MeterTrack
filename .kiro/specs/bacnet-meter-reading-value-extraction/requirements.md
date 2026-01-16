# Requirements Document: BACnet Meter Reading Value Extraction Fix

## Introduction

The BACnet meter reading collection system is currently logging meter readings with `value=[object Object]` instead of numeric values. This occurs when reading meter registers via BACnet. The system should extract and store numeric values correctly from BACnet responses.

## Glossary

- **BACnet**: Building Automation and Control Networks protocol for device communication
- **Meter Reading**: A numeric measurement value from a meter register at a specific timestamp
- **Register**: A BACnet object instance that holds a specific data point (e.g., voltage, current)
- **Value Extraction**: The process of converting BACnet response objects into primitive numeric values
- **Collection Cycle**: A complete iteration through all meters reading all configured registers

## Requirements

### Requirement 1: Extract Numeric Values from BACnet Responses

**User Story:** As a system operator, I want meter readings to be stored as numeric values, so that I can analyze and process meter data correctly.

#### Acceptance Criteria

1. WHEN a BACnet register is read successfully, THE System SHALL extract the numeric value from the response
2. WHEN the BACnet response contains a value object with a `value` property, THE System SHALL extract the primitive numeric value
3. WHEN a meter reading is logged, THE System SHALL display the numeric value (not `[object Object]`)
4. WHEN a meter reading is persisted to the database, THE System SHALL store a numeric value in the `value` column
5. IF the extracted value is not a valid number, THEN THE System SHALL log a warning and skip the reading

### Requirement 2: Handle Various BACnet Value Structures

**User Story:** As a developer, I want the system to handle different BACnet value structures, so that it works with various BACnet device implementations.

#### Acceptance Criteria

1. WHEN a BACnet response contains a simple numeric value, THE System SHALL use it directly
2. WHEN a BACnet response contains a value wrapped in an object (e.g., `{value: 123.45}`), THE System SHALL extract the numeric value
3. WHEN a BACnet response contains a value wrapped in an array (e.g., `[{value: 123.45, type: 4}]`), THE System SHALL extract the numeric value from the first element
4. WHEN a BACnet response contains an unexpected structure, THE System SHALL log the structure for debugging and attempt extraction

### Requirement 3: Validate Extracted Values

**User Story:** As a system administrator, I want invalid meter readings to be rejected, so that the database contains only valid data.

#### Acceptance Criteria

1. WHEN a value is extracted from a BACnet response, THE System SHALL validate it is a number
2. WHEN a value is NaN or null, THE System SHALL reject the reading and log an error
3. WHEN a value is successfully validated, THE System SHALL add it to the batch for database insertion
4. WHEN validation fails, THE System SHALL increment the skipped count in batch metrics

