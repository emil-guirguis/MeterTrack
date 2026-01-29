# Requirements Document: Meter Reading Export Buttons

## Introduction

This feature adds two new action buttons to the meter readings dashboard card: an Export Excel button and an Email button. These buttons enable users to export meter reading data as CSV files, with the Export button allowing file downloads and the Email button automatically attaching the file to an email. Both buttons respect the existing filtering logic (meter ID and meter element ID) and use the same data displayed in the dashboard.

## Glossary

- **Meter_Reading**: A single data record containing meter reading information (ID, meter_id, meter_element_id, value, timestamp, etc.)
- **CSV_File**: A comma-separated values file format containing tabular meter reading data
- **Filter_Context**: The current selection state including tenant ID, meter ID, and meter element ID
- **Dashboard_Card**: The UI container displaying the MeterReadingList component with meter readings
- **File_Dialog**: The native operating system file save dialog for selecting download location
- **Email_Client**: The default email application configured on the user's system

## Requirements

### Requirement 1: Export Excel Button Functionality

**User Story:** As a user, I want to export meter readings to a CSV file, so that I can analyze the data in spreadsheet applications and share it with others.

#### Acceptance Criteria

1. WHEN a user clicks the Export Excel button THEN the system SHALL generate a CSV file containing all meter readings matching the current filter context
2. WHEN the CSV file is generated THEN the system SHALL include all relevant meter reading columns (meter_id, meter_element_id, reading_value, reading_date, created_at, and any other available fields)
3. WHEN the CSV file is generated THEN the system SHALL format the filename as "[currentDate]_Meter_Readings_[elementName].csv" (e.g., "2024-01-15_Meter_Readings_Main_Pump.csv")
4. WHEN the CSV file is generated THEN the system SHALL display a file save dialog allowing the user to choose the download location
5. WHEN the user cancels the file save dialog THEN the system SHALL abort the export operation without creating a file
6. WHEN no meter readings match the filter context THEN the system SHALL display an informative message instead of generating an empty file

### Requirement 2: Email Button Functionality

**User Story:** As a user, I want to email meter readings to colleagues, so that I can share data without manual file attachment steps.

#### Acceptance Criteria

1. WHEN a user clicks the Email button THEN the system SHALL generate a CSV file containing all meter readings matching the current filter context
2. WHEN the CSV file is generated THEN the system SHALL open the default email client with a new message
3. WHEN the email client opens THEN the system SHALL automatically attach the generated CSV file to the message
4. WHEN the email client opens THEN the system SHALL pre-populate the subject line with a descriptive title including the meter information
5. WHEN the user cancels the email client operation THEN the system SHALL clean up the temporary CSV file
6. WHEN no meter readings match the filter context THEN the system SHALL display an informative message instead of opening the email client

### Requirement 3: Filter Respect and Data Consistency

**User Story:** As a user, I want the export to respect my current filter selections, so that I only export the data I'm viewing.

#### Acceptance Criteria

1. WHEN the Export or Email button is clicked THEN the system SHALL use the same filter criteria as the displayed meter readings (tenant_id, meter_id, meter_element_id)
2. WHEN meter readings are filtered by meter ID THEN the exported CSV SHALL contain only readings for that meter
3. WHEN meter readings are filtered by meter element ID THEN the exported CSV SHALL contain only readings for that element
4. WHEN no filters are applied THEN the exported CSV SHALL contain all meter readings for the current tenant

### Requirement 4: CSV Format and Data Quality

**User Story:** As a user, I want properly formatted CSV files, so that they open correctly in spreadsheet applications.

#### Acceptance Criteria

1. WHEN a CSV file is generated THEN the system SHALL include a header row with column names
2. WHEN a CSV file is generated THEN the system SHALL properly escape special characters (commas, quotes, newlines) in data values
3. WHEN a CSV file is generated THEN the system SHALL use UTF-8 encoding
4. WHEN a CSV file is generated THEN the system SHALL sort data by created_at in descending order (newest first)

### Requirement 5: User Feedback and Error Handling

**User Story:** As a user, I want clear feedback about export operations, so that I know when actions succeed or fail.

#### Acceptance Criteria

1. WHEN an export operation begins THEN the system SHALL display a loading indicator on the button
2. WHEN an export operation completes successfully THEN the system SHALL display a success notification
3. WHEN an export operation fails THEN the system SHALL display an error message describing the failure reason
4. WHEN the user attempts to export with no data available THEN the system SHALL prevent the operation and display a message explaining why
5. WHEN the email client fails to open THEN the system SHALL display an error message and clean up temporary files

### Requirement 6: Button Integration and UI

**User Story:** As a user, I want the export buttons to be easily accessible in the dashboard, so that I can quickly export data without extra steps.

#### Acceptance Criteria

1. WHEN the MeterReadingList component renders THEN the system SHALL display both Export Excel and Email buttons in the dashboard card header
2. WHEN the buttons are displayed THEN the system SHALL position them consistently with other dashboard controls
3. WHEN a button is disabled THEN the system SHALL visually indicate the disabled state
4. WHEN the user hovers over a button THEN the system SHALL display a tooltip explaining the button's function
5. WHEN meter readings are loading THEN the system SHALL disable both buttons until data is available

### Requirement 7: Temporary File Management

**User Story:** As a system, I want to manage temporary files responsibly, so that the system doesn't accumulate orphaned files.

#### Acceptance Criteria

1. WHEN a CSV file is created for email attachment THEN the system SHALL store it in a temporary directory
2. WHEN the email client closes THEN the system SHALL delete the temporary CSV file
3. WHEN the browser session ends THEN the system SHALL clean up any remaining temporary files
4. WHEN an error occurs during email operations THEN the system SHALL ensure temporary files are deleted
