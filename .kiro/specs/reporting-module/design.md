# Design Document: Reporting Module

## Overview

The Reporting Module is a comprehensive system for creating, scheduling, and managing automated reports with email delivery. It consists of three main components: a React/TypeScript frontend for report management and history viewing, a Node.js/Express backend for configuration and history storage, and a TypeScript MCP server for scheduling and email delivery. The system uses PostgreSQL for persistence and integrates with an existing EmailService for email delivery.

The architecture separates concerns into:
- **Frontend**: Report CRUD operations, recipient management, history viewing, and email log inspection
- **Backend**: API endpoints for report management, history retrieval, and data persistence
- **MCP Server**: Scheduling engine that loads enabled reports at startup and executes them on schedule
- **Database**: Three main tables (Reports, Report_History, Email_Logs) with proper relationships and indexing

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React/TS)                       │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Reports Manager  │  │ History Tab      │  │ Email Logs   │  │
│  │ (CRUD)           │  │ (View/Filter)    │  │ (View/Export)│  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ HTTP/REST
┌────────────────────────────▼────────────────────────────────────┐
│                   Backend (Node.js/Express)                      │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Report Routes    │  │ History Routes   │  │ Email Routes │  │
│  │ (CRUD)           │  │ (Query/Filter)   │  │ (Query/Export)  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Database Queries
┌────────────────────────────▼────────────────────────────────────┐
│                    PostgreSQL Database                           │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │ Reports      │  │ Report_History   │  │ Email_Logs       │  │
│  │ (Config)     │  │ (Execution Log)  │  │ (Delivery Log)   │  │
│  └──────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              MCP Server (TypeScript Scheduler)                   │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │ Scheduler        │  │ Report Executor  │  │ Email Sender │  │
│  │ (Cron-based)     │  │ (Data Gen)       │  │ (via Service)│  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                             │ Database Queries & EmailService
                             │
                    ┌────────▼────────┐
                    │ EmailService    │
                    │ (Existing)      │
                    └─────────────────┘
```

### Data Flow

1. **Report Creation**: User creates report via frontend → Backend validates and stores in Reports table
2. **Scheduling**: MCP server loads enabled reports at startup → Sets up cron jobs
3. **Execution**: Cron job triggers → MCP server executes report → Creates Report_History entry
4. **Email Delivery**: Report execution completes → MCP server sends emails to recipients → Creates Email_Logs entries
5. **History Viewing**: User queries history via frontend → Backend retrieves from Report_History and Email_Logs tables

## Components and Interfaces

### Frontend Components

#### ReportsManager
- Displays list of all reports
- Provides create/edit/delete functionality
- Shows report status (enabled/disabled)
- Allows toggling report enabled status

#### ReportForm
- Form for creating/editing reports
- Fields: name, type, recipients, schedule, enabled status
- Validates required fields and email format
- Supports predefined schedules and custom cron

#### HistoryTab
- Displays report execution history with pagination
- Shows execution timestamp, status, error messages
- Allows filtering by date range
- Clicking entry shows detailed email logs

#### EmailLogsView
- Shows email delivery logs for a report execution
- Displays recipient, timestamp, delivery status, error details
- Allows searching by recipient
- Provides export to CSV/JSON

### Backend API Endpoints

#### Report Management
- `POST /api/reports` - Create new report
- `GET /api/reports` - List all reports
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report
- `PATCH /api/reports/:id/toggle` - Toggle enabled status

#### History and Logs
- `GET /api/reports/:id/history` - Get report execution history
- `GET /api/reports/:id/history/:historyId/emails` - Get email logs for execution
- `GET /api/email-logs/search` - Search email logs by recipient
- `GET /api/email-logs/export` - Export email logs as CSV/JSON

### MCP Server Components

#### SchedulerService
- Loads all enabled reports from database at startup
- Creates cron jobs for each report
- Handles cron job execution triggers
- Manages job lifecycle (create, update, delete)

#### ReportExecutor
- Executes report based on type and configuration
- Generates report data (meter readings, usage summaries, etc.)
- Creates Report_History entry with execution details
- Handles execution errors and logs them

#### EmailSender
- Sends emails to all configured recipients
- Creates Email_Logs entries for each email
- Handles email delivery failures
- Updates Email_Logs with delivery status

## Data Models

### Reports Table
```sql
CREATE TABLE reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  type VARCHAR(50) NOT NULL,
  schedule VARCHAR(255) NOT NULL,
  recipients TEXT[] NOT NULL,
  config JSONB NOT NULL,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields**:
- `id`: Unique identifier
- `name`: Report name (must be unique)
- `type`: Report type (meter_readings, usage_summary, etc.)
- `schedule`: Cron expression or predefined schedule
- `recipients`: Array of email addresses
- `config`: JSON object with type-specific configuration
- `enabled`: Whether report is active for scheduling
- `created_at`: Creation timestamp
- `updated_at`: Last modification timestamp

### Report_History Table
```sql
CREATE TABLE report_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  executed_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_report_history_report_id ON report_history(report_id);
CREATE INDEX idx_report_history_executed_at ON report_history(executed_at);
```

**Fields**:
- `id`: Unique identifier
- `report_id`: Foreign key to reports table
- `executed_at`: When the report was executed
- `status`: Execution status (success, failed)
- `error_message`: Error details if failed
- `created_at`: When record was created

### Email_Logs Table
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  history_id UUID NOT NULL REFERENCES report_history(id) ON DELETE CASCADE,
  recipient VARCHAR(255) NOT NULL,
  sent_at TIMESTAMP NOT NULL,
  status VARCHAR(20) NOT NULL,
  error_details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_email_logs_report_id ON email_logs(report_id);
CREATE INDEX idx_email_logs_history_id ON email_logs(history_id);
CREATE INDEX idx_email_logs_recipient ON email_logs(recipient);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
```

**Fields**:
- `id`: Unique identifier
- `report_id`: Foreign key to reports table
- `history_id`: Foreign key to report_history table
- `recipient`: Email address that received the email
- `sent_at`: When email was sent
- `status`: Delivery status (sent, failed, delivered)
- `error_details`: Error information if failed
- `created_at`: When record was created

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Report Creation Persistence
*For any* valid report configuration, creating and saving a report should result in the report being retrievable from the database with all configuration details intact.
**Validates: Requirements 1.4, 10.1**

### Property 2: Duplicate Name Prevention
*For any* existing report name, attempting to create a new report with the same name should be rejected and the database should remain unchanged.
**Validates: Requirements 1.5**

### Property 3: Report Update Persistence
*For any* existing report, modifying its configuration and saving should result in the database containing the updated values.
**Validates: Requirements 2.2**

### Property 4: Cascading Deletion
*For any* report with associated history and email logs, deleting the report should remove the report and all associated history and email log records.
**Validates: Requirements 2.3**

### Property 5: Disabled Reports Don't Schedule
*For any* disabled report, the scheduler should not create or execute cron jobs for that report.
**Validates: Requirements 2.4**

### Property 6: Re-enable Restores Scheduling
*For any* report that is disabled then re-enabled, the scheduler should resume creating cron jobs according to the configured schedule.
**Validates: Requirements 2.5**

### Property 7: Scheduled Execution Triggers
*For any* enabled report with a valid cron schedule, when the scheduled time arrives, the report should be executed.
**Validates: Requirements 3.2**

### Property 8: Execution History Creation
*For any* executed report, a corresponding entry should be created in the Report_History table with the execution timestamp and status.
**Validates: Requirements 3.3, 10.2**

### Property 9: Execution Details Recording
*For any* report execution, the Report_History entry should contain the execution timestamp, status, and error message (if failed).
**Validates: Requirements 3.4**

### Property 10: Failed Execution Logging
*For any* failed report execution, the Report_History entry should have status marked as failed and contain the error message.
**Validates: Requirements 3.5**

### Property 11: Email Sending for All Recipients
*For any* successful report execution with multiple configured recipients, emails should be sent to all recipients.
**Validates: Requirements 4.1, 4.4**

### Property 12: Email Log Creation
*For any* email sent, a corresponding entry should be created in the Email_Logs table with recipient, timestamp, and delivery status.
**Validates: Requirements 4.2, 10.3**

### Property 13: Failed Email Logging
*For any* failed email delivery, the Email_Logs entry should have status marked as failed and contain the error reason.
**Validates: Requirements 4.3**

### Property 14: Successful Delivery Status Update
*For any* successfully delivered email, the Email_Logs entry should have status marked as delivered.
**Validates: Requirements 4.5**

### Property 15: History Status Display
*For any* report execution in the history view, the status field should accurately reflect whether the execution succeeded or failed.
**Validates: Requirements 5.2**

### Property 16: Failed Execution Error Display
*For any* failed report execution in the history view, the error message should be displayed.
**Validates: Requirements 5.3**

### Property 17: History Date Range Filtering
*For any* date range filter applied to report history, only executions within the specified date range should be returned.
**Validates: Requirements 5.5**

### Property 18: Email Logs Association
*For any* report history entry, all associated email logs should be retrievable and linked to that execution.
**Validates: Requirements 6.1**

### Property 19: Email Log Field Completeness
*For any* email log entry, it should contain recipient, sent timestamp, and delivery status fields.
**Validates: Requirements 6.2**

### Property 20: Failed Email Error Display
*For any* failed email delivery in the email logs view, the failure reason should be displayed.
**Validates: Requirements 6.3**

### Property 21: Email Log Recipient Search
*For any* recipient email address, searching email logs by that recipient should return all email logs for that recipient.
**Validates: Requirements 6.4**

### Property 22: Email Log Export Completeness
*For any* exported email logs, the exported file should contain all required fields (recipient, timestamp, status, error details).
**Validates: Requirements 6.5**

### Property 23: Email Format Validation
*For any* email address added as a recipient, the email format should be validated and invalid formats should be rejected.
**Validates: Requirements 7.2**

### Property 24: Recipient Removal Persistence
*For any* recipient removed from a report, the updated recipient list should be persisted to the database.
**Validates: Requirements 7.3, 7.4**

### Property 25: Current Recipients Receive Emails
*For any* report execution, emails should be sent to all currently configured recipients at the time of execution.
**Validates: Requirements 7.5**

### Property 26: Report Type Data Generation
*For any* report type, executing a report should generate data appropriate to that type.
**Validates: Requirements 8.3**

### Property 27: Report Type Output Formatting
*For any* report type, the output should be formatted appropriately for that type.
**Validates: Requirements 8.4**

### Property 28: Predefined Schedule Mapping
*For any* predefined schedule (daily, weekly, monthly), selecting it should apply the corresponding cron expression.
**Validates: Requirements 9.1**

### Property 29: Cron Expression Validation
*For any* cron expression entered, the system should validate the format and reject invalid expressions.
**Validates: Requirements 9.3, 9.4**

### Property 30: Saved Cron Used for Scheduling
*For any* valid cron expression saved for a report, the scheduler should use that expression for scheduling report execution.
**Validates: Requirements 9.5**

### Property 31: Historical Data Accuracy
*For any* queried historical data, the records should have accurate timestamps and correct status information.
**Validates: Requirements 10.5**

## Error Handling

### Report Creation Errors
- **Duplicate Name**: Return 409 Conflict with message "Report name already exists"
- **Invalid Email Format**: Return 400 Bad Request with message "Invalid email format in recipients"
- **Missing Required Fields**: Return 400 Bad Request with message "Missing required fields: [field names]"
- **Invalid Cron Expression**: Return 400 Bad Request with message "Invalid cron expression format"

### Report Execution Errors
- **Data Generation Failure**: Log error, mark history as failed, send notification email to admin
- **Email Delivery Failure**: Log error in Email_Logs, mark status as failed, continue with other recipients
- **Database Write Failure**: Log error, retry with exponential backoff

### Scheduler Errors
- **Database Connection Loss**: Attempt reconnection, log error, keep existing jobs running
- **Invalid Report Configuration**: Log error, skip report, continue with others
- **Cron Job Creation Failure**: Log error, mark report as failed to schedule

## Testing Strategy

### Unit Testing
- Test report validation logic (name uniqueness, email format, cron validation)
- Test report CRUD operations with various inputs
- Test history filtering and search logic
- Test email log export formatting
- Test error handling for invalid inputs
- Test edge cases (empty recipients, special characters in names, etc.)

### Property-Based Testing
- **Property 1**: For any valid report config, create → retrieve should match
- **Property 2**: For any existing report name, duplicate creation should fail
- **Property 3**: For any report modification, update → retrieve should reflect changes
- **Property 4**: For any report with history, deletion should cascade
- **Property 5**: For any disabled report, scheduler should not execute
- **Property 6**: For any re-enabled report, scheduler should resume
- **Property 7**: For any enabled report, scheduled time should trigger execution
- **Property 8**: For any execution, history entry should exist
- **Property 9**: For any execution, history should contain timestamp and status
- **Property 10**: For any failed execution, history should mark as failed with error
- **Property 11**: For any execution with recipients, all should receive emails
- **Property 12**: For any email sent, log entry should exist
- **Property 13**: For any failed email, log should mark as failed with error
- **Property 14**: For any successful email, log should mark as delivered
- **Property 15**: For any history entry, status should match execution result
- **Property 16**: For any failed execution, error message should be displayed
- **Property 17**: For any date range filter, only matching entries should return
- **Property 18**: For any history entry, associated email logs should be retrievable
- **Property 19**: For any email log, required fields should be present
- **Property 20**: For any failed email, error should be displayed
- **Property 21**: For any recipient search, matching logs should return
- **Property 22**: For any export, all fields should be included
- **Property 23**: For any email recipient, format should be validated
- **Property 24**: For any recipient change, persistence should occur
- **Property 25**: For any execution, current recipients should receive emails
- **Property 26**: For any report type, appropriate data should generate
- **Property 27**: For any report type, output should format correctly
- **Property 28**: For any predefined schedule, cron should map correctly
- **Property 29**: For any cron expression, validation should work
- **Property 30**: For any saved cron, scheduler should use it
- **Property 31**: For any historical query, data should be accurate

### Integration Testing
- Test end-to-end report creation and execution flow
- Test scheduler startup and report loading
- Test email delivery with actual EmailService
- Test database persistence across restarts
- Test concurrent report executions
- Test history and email log retrieval with large datasets

### Configuration
- Minimum 100 iterations per property test
- Tag format: **Feature: reporting-module, Property {number}: {property_text}**
- Run tests in CI/CD pipeline before deployment
