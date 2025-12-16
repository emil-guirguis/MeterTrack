# Requirements Document: BACnet Meter Reading Agent

## Introduction

The BACnet Meter Reading Agent is a scheduled service that runs every minute to collect meter readings from BACnet-enabled meters. The agent queries all active meters from the sync database, loads their register maps into memory, connects to each meter via BACnet using the meter's IP address and port, reads the configured registers, and stores the collected values in the meter_reading table. This agent enables real-time data collection from distributed BACnet meters with minimal latency.

## Glossary

- **BACnet**: Building Automation and Control Networks protocol for communication with building automation devices
- **Register Map**: A JSON configuration that defines which BACnet object properties to read from a meter (e.g., Present_Value, Units, etc.)
- **Meter**: A physical or virtual device that measures energy consumption or other metrics, identified by IP address and port
- **Meter Reading**: A single data point collected from a meter at a specific timestamp, including the value and unit
- **Data Point**: A named register or property within a meter's register map (e.g., "total_energy", "voltage")
- **Sync Database**: The local PostgreSQL database that stores meter configurations and readings
- **Active Meter**: A meter with active=true in the database that should be included in collection cycles
- **Register Map Cache**: In-memory storage of register maps loaded from the database to avoid repeated database queries

## Requirements

### Requirement 1

**User Story:** As a system operator, I want the BACnet meter reading agent to automatically collect meter data every minute, so that I have near real-time visibility into meter readings without manual intervention.

#### Acceptance Criteria

1. WHEN the agent starts THEN the system SHALL schedule a recurring task to execute every 60 seconds
2. WHEN the scheduled interval elapses THEN the system SHALL execute a complete collection cycle without blocking subsequent cycles
3. WHEN a collection cycle is in progress THEN the system SHALL prevent overlapping execution of concurrent collection cycles
4. WHEN the agent receives a shutdown signal THEN the system SHALL gracefully stop the scheduled task and close all active BACnet connections

### Requirement 2

**User Story:** As a system administrator, I want the agent to load and cache register maps from the meter table, so that collection cycles are efficient and do not require repeated database queries for configuration.

#### Acceptance Criteria

1. WHEN the agent starts THEN the system SHALL load all active meters from the sync database including their register_map field into memory
2. WHEN a collection cycle begins THEN the system SHALL use the cached register maps to determine which BACnet properties to read from each meter
3. WHEN a meter's register_map is updated in the database THEN the system SHALL reload the updated register_map into the cache on the next collection cycle
4. WHEN a register_map is invalid or missing THEN the system SHALL log the error and skip that meter during the collection cycle

### Requirement 3

**User Story:** As a meter technician, I want the agent to connect to each meter using its configured IP address and port via BACnet, so that readings can be collected from geographically distributed meters.

#### Acceptance Criteria

1. WHEN a collection cycle begins THEN the system SHALL iterate through all active meters in the register map cache
2. WHEN connecting to a meter THEN the system SHALL use the meter's IP address and port to establish a BACnet connection
3. WHEN a BACnet connection fails THEN the system SHALL log the connection error with the meter ID, IP, and port, and continue to the next meter
4. WHEN a BACnet connection succeeds THEN the system SHALL proceed to read the configured registers for that meter

### Requirement 4

**User Story:** As a data analyst, I want the agent to read all configured registers from each meter and store the values with timestamps, so that I have complete meter data for analysis and reporting.

#### Acceptance Criteria

1. WHEN a BACnet connection is established THEN the system SHALL read all data points defined in the meter's register map
2. WHEN reading a register THEN the system SHALL capture the value, unit, and timestamp of the read operation
3. WHEN a register read fails THEN the system SHALL log the read error with the meter ID, data point name, and error details, and continue reading other registers
4. WHEN all registers for a meter are successfully read THEN the system SHALL store each reading in the meter_reading table with meter_id, timestamp, data_point, value, and unit

### Requirement 5

**User Story:** As a database administrator, I want the agent to persist meter readings efficiently, so that the database remains performant even with high-frequency collection cycles.

#### Acceptance Criteria

1. WHEN readings are collected from a meter THEN the system SHALL batch insert all readings for that meter in a single database transaction
2. WHEN a batch insert succeeds THEN the system SHALL mark the readings as not synchronized (is_synchronized=false) for later upload to the client system
3. WHEN a batch insert fails THEN the system SHALL log the database error and skip storing those readings
4. WHEN a collection cycle completes THEN the system SHALL log the total number of readings collected, meters processed, and any errors encountered

### Requirement 6

**User Story:** As a system operator, I want the agent to handle errors gracefully and continue operating, so that temporary issues with individual meters do not prevent collection from other meters.

#### Acceptance Criteria

1. WHEN any error occurs during a collection cycle THEN the system SHALL log the error with sufficient context (meter ID, operation, error message)
2. WHEN a meter connection fails THEN the system SHALL continue to the next meter without stopping the collection cycle
3. WHEN a register read fails THEN the system SHALL continue reading other registers for that meter
4. WHEN a database write fails THEN the system SHALL log the error and continue processing other meters

### Requirement 7

**User Story:** As a system monitor, I want the agent to provide status information about collection cycles, so that I can verify the agent is operating correctly and diagnose issues.

#### Acceptance Criteria

1. WHEN a collection cycle completes THEN the system SHALL record the cycle status including start time, end time, meters processed, readings collected, and errors
2. WHEN the agent is queried for status THEN the system SHALL return the current cycle status, last cycle results, and any active errors
3. WHEN a collection cycle fails THEN the system SHALL record the failure reason and make it available in the status response
4. WHEN the agent is running THEN the system SHALL maintain a running count of total cycles executed, total readings collected, and total errors encountered

### Requirement 8

**User Story:** As a system operator, I want to manually trigger a meter reading collection cycle from the sync status page, so that I can collect readings on-demand without waiting for the scheduled interval.

#### Acceptance Criteria

1. WHEN the sync status page is displayed THEN the system SHALL show a card with the BACnet meter reading agent status and a button to manually trigger collection
2. WHEN the manual trigger button is clicked THEN the system SHALL initiate an immediate collection cycle
3. WHEN a manual collection cycle is in progress THEN the system SHALL prevent overlapping execution with the scheduled cycle
4. WHEN a manual collection cycle completes THEN the system SHALL update the status card with the results including readings collected and any errors

