# Requirements Document: Auto Meter Collection

## Introduction

The Auto Meter Collection feature provides automated, periodic collection of meter data from Modbus-enabled devices. The system collects electrical measurements (voltage, current, power, energy, frequency, power factor, and phase data) at configurable intervals, persists readings to the database, and provides monitoring and statistics tracking. This feature enables continuous data acquisition without manual intervention, supporting batch processing for efficiency and automatic retry logic for reliability.

## Glossary

- **Meter**: A physical device that measures electrical parameters via Modbus protocol
- **Modbus**: A serial communication protocol used to read data from meters
- **Meter Reading**: A single collection of electrical measurements from a meter at a specific timestamp
- **Collection Cycle**: One complete iteration of collecting data from all active meters
- **Collection Interval**: The time period between successive collection cycles (minimum 5 seconds)
- **Batch Processing**: Grouping multiple meters together for concurrent data collection
- **Threading Service**: An asynchronous message-based service for handling Modbus communication
- **Register**: A specific electrical parameter address on a meter (e.g., voltage at address 5)
- **Slave ID**: The Modbus device identifier for a specific meter
- **Data Quality**: A measure of the reliability and validity of collected meter readings
- **Statistics**: Aggregated metrics tracking collection success rates, failures, and errors

## Requirements

### Requirement 1: Collection Lifecycle Management

**User Story:** As a system administrator, I want to start and stop automatic meter collection, so that I can control when data collection occurs.

#### Acceptance Criteria

1. WHEN the start collection command is issued, THE AutoMeterCollectionService SHALL begin collecting meter data at the configured interval
2. WHEN the stop collection command is issued, THE AutoMeterCollectionService SHALL cease all meter data collection and clear any pending collection timers
3. WHEN collection is already running and a start command is issued, THE AutoMeterCollectionService SHALL return an error indicating collection is already active
4. WHEN collection is not running and a stop command is issued, THE AutoMeterCollectionService SHALL return success without error
5. WHEN the service is initialized, THE AutoMeterCollectionService SHALL be in a stopped state by default

### Requirement 2: Periodic Data Collection

**User Story:** As a system operator, I want meter data to be collected automatically at regular intervals, so that I have continuous monitoring of electrical parameters.

#### Acceptance Criteria

1. WHEN a collection cycle begins, THE AutoMeterCollectionService SHALL retrieve all active meters from the database
2. WHEN active meters are retrieved, THE AutoMeterCollectionService SHALL process them in batches according to the configured batch size
3. WHEN a collection cycle completes, THE AutoMeterCollectionService SHALL record the collection timestamp and update statistics
4. WHEN the configured collection interval elapses, THE AutoMeterCollectionService SHALL automatically trigger the next collection cycle
5. WHEN no active meters exist, THE AutoMeterCollectionService SHALL log this condition and continue normal operation

### Requirement 3: Modbus Data Acquisition

**User Story:** As a data collection system, I want to retrieve electrical measurements from meters via Modbus protocol, so that I can capture accurate meter readings.

#### Acceptance Criteria

1. WHEN collecting data from a meter, THE AutoMeterCollectionService SHALL use the Threading Service to communicate via Modbus protocol
2. WHEN Modbus communication succeeds, THE AutoMeterCollectionService SHALL extract voltage, current, power, energy, frequency, power factor, and phase data from the meter
3. WHEN Modbus communication fails, THE AutoMeterCollectionService SHALL record the failure and continue with the next meter
4. WHEN a meter timeout occurs, THE AutoMeterCollectionService SHALL apply retry logic up to the configured retry attempt limit
5. WHEN all retry attempts are exhausted, THE AutoMeterCollectionService SHALL mark the meter as failed and log the error

### Requirement 4: Meter Reading Data Model

**User Story:** As a data persistence system, I want to store complete meter readings with all electrical parameters, so that historical data is available for analysis.

#### Acceptance Criteria

1. WHEN a meter reading is created, THE AutoMeterCollectionService SHALL include meter ID, timestamp, and all electrical parameters (voltage, current, power, energy, frequency, power factor)
2. WHEN a meter reading is created, THE AutoMeterCollectionService SHALL include phase-specific data (phase A/B/C voltage and current) when available
3. WHEN a meter reading is created, THE AutoMeterCollectionService SHALL include energy totals (active, reactive, apparent) when available
4. WHEN a meter reading is created, THE AutoMeterCollectionService SHALL set data quality to 'good' for successful reads and 'failed' for unsuccessful reads
5. WHEN a meter reading is created, THE AutoMeterCollectionService SHALL record the source as 'modbus_auto_collection' and the device IP and port

### Requirement 5: Database Persistence

**User Story:** As a data storage system, I want to persist meter readings to the database efficiently, so that data is retained for historical analysis.

#### Acceptance Criteria

1. WHEN meter readings are collected, THE AutoMeterCollectionService SHALL save them to the meterreadings table
2. WHEN multiple readings are available, THE AutoMeterCollectionService SHALL use batch insert operations for improved performance
3. WHEN batch insert is enabled and readings exceed the batch size threshold, THE AutoMeterCollectionService SHALL split readings into multiple batch operations
4. WHEN a database insert fails, THE AutoMeterCollectionService SHALL log the error and continue with subsequent readings
5. WHEN a reading is successfully inserted, THE AutoMeterCollectionService SHALL log the insertion with the generated ID

### Requirement 6: Collection Statistics and Monitoring

**User Story:** As a system monitor, I want to track collection statistics and health metrics, so that I can identify issues and monitor system performance.

#### Acceptance Criteria

1. WHEN a collection cycle completes, THE AutoMeterCollectionService SHALL update total attempts, successful reads, and failed reads counters
2. WHEN a collection cycle fails, THE AutoMeterCollectionService SHALL record the error message in the last error field
3. WHEN statistics are requested, THE AutoMeterCollectionService SHALL return current counters, success rate percentage, and last collection timestamp
4. WHEN the configured logging interval elapses, THE AutoMeterCollectionService SHALL log collection statistics to the console
5. WHEN collection statistics are retrieved, THE AutoMeterCollectionService SHALL calculate success rate as (successful reads / total attempts) * 100

### Requirement 7: Configurable Collection Interval

**User Story:** As a system administrator, I want to adjust the collection interval at runtime, so that I can optimize data collection frequency without restarting the service.

#### Acceptance Criteria

1. WHEN an interval update is requested, THE AutoMeterCollectionService SHALL validate that the new interval is at least 5000 milliseconds (5 seconds)
2. WHEN an invalid interval is provided, THE AutoMeterCollectionService SHALL return an error and maintain the current interval
3. WHEN a valid interval is provided and collection is running, THE AutoMeterCollectionService SHALL stop the current collection, update the interval, and restart collection
4. WHEN a valid interval is provided and collection is not running, THE AutoMeterCollectionService SHALL update the interval without starting collection
5. WHEN the interval is successfully updated, THE AutoMeterCollectionService SHALL log the new interval value

### Requirement 8: Service Initialization and Configuration

**User Story:** As a system bootstrap process, I want to initialize the Auto Meter Collection service with configuration, so that the service is ready for operation.

#### Acceptance Criteria

1. WHEN the service is initialized, THE AutoMeterCollectionService SHALL accept a configuration object or use default configuration values
2. WHEN the service is initialized, THE AutoMeterCollectionService SHALL require a Threading Service instance for Modbus communication
3. WHEN the Threading Service is not provided, THE AutoMeterCollectionService SHALL return an error and fail initialization
4. WHEN the service is initialized successfully, THE AutoMeterCollectionService SHALL log initialization success with the configured collection interval
5. WHEN default configuration is used, THE AutoMeterCollectionService SHALL apply sensible defaults (30 second interval, 10 meter batch size, 10 second timeout, 2 retry attempts)

### Requirement 9: Batch Processing and Concurrency

**User Story:** As a performance optimization system, I want to process multiple meters concurrently in batches, so that collection cycles complete efficiently.

#### Acceptance Criteria

1. WHEN a collection cycle begins, THE AutoMeterCollectionService SHALL divide meters into batches of the configured batch size
2. WHEN processing a batch, THE AutoMeterCollectionService SHALL send concurrent Modbus requests to all meters in the batch
3. WHEN a batch completes, THE AutoMeterCollectionService SHALL wait for a configured delay before processing the next batch
4. WHEN batch processing completes, THE AutoMeterCollectionService SHALL aggregate results and update statistics
5. WHEN a meter in a batch fails, THE AutoMeterCollectionService SHALL continue processing other meters in the batch

### Requirement 10: Logging and Error Handling

**User Story:** As a system operator, I want detailed logging of collection activities and errors, so that I can troubleshoot issues and monitor system health.

#### Acceptance Criteria

1. WHEN a collection cycle starts, THE AutoMeterCollectionService SHALL log the start event with meter count
2. WHEN a meter read succeeds and logging is enabled, THE AutoMeterCollectionService SHALL log the success with meter ID and values
3. WHEN a meter read fails and logging is enabled, THE AutoMeterCollectionService SHALL log the failure with meter ID and error message
4. WHEN a collection cycle completes, THE AutoMeterCollectionService SHALL log completion statistics including success count and duration
5. WHEN an error occurs during collection, THE AutoMeterCollectionService SHALL log the error with context and continue operation

### Requirement 11: Health Status Reporting

**User Story:** As a monitoring system, I want to query the health status of the Auto Meter Collection service, so that I can verify service availability and configuration.

#### Acceptance Criteria

1. WHEN a health status request is made, THE AutoMeterCollectionService SHALL return the current collection state (running/stopped)
2. WHEN a health status request is made, THE AutoMeterCollectionService SHALL return the current configuration (enabled, interval, batch size)
3. WHEN a health status request is made, THE AutoMeterCollectionService SHALL return Threading Service availability status
4. WHEN a health status request is made, THE AutoMeterCollectionService SHALL return current statistics (attempts, successes, failures, success rate)
5. WHEN a health status request is made, THE AutoMeterCollectionService SHALL include the timestamp of the status check

### Requirement 12: Service Lifecycle and Cleanup

**User Story:** As a system shutdown process, I want to properly stop the Auto Meter Collection service, so that resources are cleaned up and no orphaned timers remain.

#### Acceptance Criteria

1. WHEN the service stop method is called, THE AutoMeterCollectionService SHALL stop all active collection timers
2. WHEN the service stop method is called, THE AutoMeterCollectionService SHALL stop all statistics logging timers
3. WHEN the service stop method is called, THE AutoMeterCollectionService SHALL set the collection state to stopped
4. WHEN the service stop method is called, THE AutoMeterCollectionService SHALL log the shutdown event
5. WHEN the service is stopped, THE AutoMeterCollectionService SHALL not accept new collection commands until restarted
