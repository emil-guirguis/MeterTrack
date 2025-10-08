# Requirements Document

## Introduction

This feature addresses the gap between the meter data fields being collected from Modbus devices and the comprehensive field set expected by the database schema and dashboard interface. Currently, the Modbus agent only collects 6 basic fields (voltage, current, power, energy, frequency, powerFactor) while the API and dashboard expect over 50 fields including phase measurements, harmonics, demand values, and device information. This enhancement will expand the data collection to capture all available meter fields and ensure they are properly integrated into the database and dashboard.

## Requirements

### Requirement 1

**User Story:** As a facility manager, I want to see comprehensive meter data including phase measurements, harmonics, and demand values in the dashboard, so that I can monitor power quality and make informed decisions about electrical system performance.

#### Acceptance Criteria

1. WHEN the Modbus agent collects meter data THEN it SHALL attempt to read all available meter registers for comprehensive field coverage
2. WHEN meter data is stored in the database THEN it SHALL include all collected fields without data loss
3. WHEN the dashboard displays meter readings THEN it SHALL show all available fields with proper formatting and units
4. WHEN a meter field is not available from the device THEN the system SHALL store null values and display them as "—" in the dashboard

### Requirement 2

**User Story:** As a system administrator, I want the meter data collection to be configurable and extensible, so that I can adapt to different meter models and register mappings without code changes.

#### Acceptance Criteria

1. WHEN configuring meter data collection THEN the system SHALL support custom field mapping files for different meter models
2. WHEN a new meter field is added to the mapping THEN it SHALL be automatically collected and stored without requiring database schema changes
3. WHEN the system encounters an unknown field THEN it SHALL store the field data and make it available to the API and dashboard
4. IF a field mapping file is not provided THEN the system SHALL fall back to collecting standard meter fields

### Requirement 3

**User Story:** As a maintenance technician, I want to see device diagnostic information including communication status, firmware version, and alarm states, so that I can quickly identify and troubleshoot meter issues.

#### Acceptance Criteria

1. WHEN meter data is collected THEN the system SHALL attempt to read device information fields (model, firmware, serial number)
2. WHEN communication issues occur THEN the system SHALL record communication status and timestamps
3. WHEN alarm conditions exist THEN the system SHALL capture and display alarm status information
4. WHEN viewing meter readings in the dashboard THEN diagnostic fields SHALL be clearly visible and properly formatted

### Requirement 4

**User Story:** As a power quality analyst, I want access to detailed electrical measurements including phase voltages, currents, harmonics, and power factor per phase, so that I can analyze power quality issues and system balance.

#### Acceptance Criteria

1. WHEN three-phase meter data is available THEN the system SHALL collect individual phase measurements (voltage, current, power, power factor)
2. WHEN harmonic data is available THEN the system SHALL collect total harmonic distortion values for voltage and current
3. WHEN line-to-line measurements are available THEN the system SHALL collect all line-to-line voltage values
4. WHEN demand measurements are available THEN the system SHALL collect current, maximum, and predicted demand values

### Requirement 5

**User Story:** As a data analyst, I want consistent and reliable meter data with proper quality indicators, so that I can perform accurate energy analysis and reporting.

#### Acceptance Criteria

1. WHEN meter data is collected THEN each reading SHALL include a quality indicator (good, estimated, questionable)
2. WHEN communication errors occur THEN affected readings SHALL be marked with appropriate quality indicators
3. WHEN data validation fails THEN the system SHALL log errors and mark readings as questionable
4. WHEN displaying data in the dashboard THEN quality indicators SHALL be clearly visible with appropriate visual cues