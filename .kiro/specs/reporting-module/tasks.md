# Implementation Plan: Reporting Module

## Overview

This implementation plan breaks down the reporting module into discrete, incremental tasks that build upon each other. The approach starts with database schema and core backend infrastructure, then implements the scheduler and email delivery, followed by frontend components, and finally comprehensive testing. Each task is designed to be completed independently while maintaining integration with previous steps.

## Tasks

- [x] 1. Set up database schema and migrations
  - Create Reports table with all required fields and constraints
  - Create Report_History table with foreign key to Reports
  - Create Email_Logs table with foreign keys to Reports and Report_History
  - Add appropriate indexes for query performance
  - _Requirements: 10.1, 10.2, 10.3_

- [ ] 2. Implement backend report management API
  - [x] 2.1 Create report validation utilities
    - Validate report name uniqueness
    - Validate email format for recipients
    - Validate cron expression format
    - _Requirements: 1.2, 1.5, 7.2, 9.3, 9.4_
  
  - [ ]* 2.2 Write property tests for report validation
    - **Property 2: Duplicate Name Prevention**
    - **Property 23: Email Format Validation**
    - **Property 29: Cron Expression Validation**
    - _Requirements: 1.5, 7.2, 9.3, 9.4_
  
  - [x] 2.3 Create POST /api/reports endpoint
    - Accept report configuration (name, type, schedule, recipients, config)
    - Validate all required fields
    - Store report in database with enabled=true
    - Return created report with ID
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 2.4 Create GET /api/reports endpoint
    - Return list of all reports
    - Include pagination support
    - _Requirements: 1.1_
  
  - [x] 2.5 Create GET /api/reports/:id endpoint
    - Return specific report details
    - _Requirements: 2.1_
  
  - [x] 2.6 Create PUT /api/reports/:id endpoint
    - Update report configuration
    - Validate all fields
    - Persist changes to database
    - _Requirements: 2.2_
  
  - [x] 2.7 Create DELETE /api/reports/:id endpoint
    - Delete report and cascade delete history and email logs
    - _Requirements: 2.3_
  
  - [x] 2.8 Create PATCH /api/reports/:id/toggle endpoint
    - Toggle report enabled status
    - _Requirements: 2.4, 2.5_
  
  - [ ]* 2.9 Write property tests for report CRUD operations
    - **Property 1: Report Creation Persistence**
    - **Property 3: Report Update Persistence**
    - **Property 4: Cascading Deletion**
    - **Property 24: Recipient Removal Persistence**
    - _Requirements: 1.4, 2.2, 2.3, 7.4_

- [ ] 3. Implement report history and email log API endpoints
  - [x] 3.1 Create GET /api/reports/:id/history endpoint
    - Return report execution history with pagination
    - Support date range filtering
    - _Requirements: 5.1, 5.5_
  
  - [x] 3.2 Create GET /api/reports/:id/history/:historyId/emails endpoint
    - Return email logs for specific report execution
    - _Requirements: 6.1_
  
  - [x] 3.3 Create GET /api/email-logs/search endpoint
    - Search email logs by recipient
    - Return matching records
    - _Requirements: 6.4_
  
  - [x] 3.4 Create GET /api/email-logs/export endpoint
    - Export email logs as CSV or JSON
    - Include all required fields
    - _Requirements: 6.5_
  
  - [ ]* 3.5 Write property tests for history and log queries
    - **Property 17: History Date Range Filtering**
    - **Property 18: Email Logs Association**
    - **Property 21: Email Log Recipient Search**
    - **Property 22: Email Log Export Completeness**
    - _Requirements: 5.5, 6.1, 6.4, 6.5_

- [x] 4. Checkpoint - Ensure all backend API tests pass
  - Ensure all unit and property tests pass
  - Verify API endpoints respond correctly
  - Ask the user if questions arise

- [ ] 5. Implement MCP server scheduler
  - [x] 5.1 Create SchedulerService class
    - Load all enabled reports from database at startup
    - Create cron jobs for each report
    - Handle job lifecycle (create, update, delete)
    - _Requirements: 3.1, 3.2_
  
  - [x] 5.2 Create ReportExecutor class
    - Execute report based on type and configuration
    - Generate report data (meter_readings, usage_summary, etc.)
    - Create Report_History entry with execution details
    - Handle execution errors and log them
    - _Requirements: 3.3, 3.4, 3.5, 8.3, 8.4_
  
  - [x] 5.3 Create EmailSender class
    - Send emails to all configured recipients
    - Create Email_Logs entries for each email
    - Handle email delivery failures
    - Update Email_Logs with delivery status
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [x] 5.4 Integrate scheduler with database
    - Connect to PostgreSQL database
    - Query enabled reports on startup
    - Update report status and history
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 5.5 Write property tests for scheduler
    - **Property 5: Disabled Reports Don't Schedule**
    - **Property 6: Re-enable Restores Scheduling**
    - **Property 7: Scheduled Execution Triggers**
    - **Property 30: Saved Cron Used for Scheduling**
    - _Requirements: 2.4, 2.5, 3.2, 9.5_
  
  - [ ]* 5.6 Write property tests for report execution
    - **Property 8: Execution History Creation**
    - **Property 9: Execution Details Recording**
    - **Property 10: Failed Execution Logging**
    - **Property 26: Report Type Data Generation**
    - **Property 27: Report Type Output Formatting**
    - _Requirements: 3.3, 3.4, 3.5, 8.3, 8.4_
  
  - [ ]* 5.7 Write property tests for email delivery
    - **Property 11: Email Sending for All Recipients**
    - **Property 12: Email Log Creation**
    - **Property 13: Failed Email Logging**
    - **Property 14: Successful Delivery Status Update**
    - **Property 25: Current Recipients Receive Emails**
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 7.5_

- [x] 6. Checkpoint - Ensure all scheduler tests pass
  - Ensure all unit and property tests pass
  - Verify scheduler loads reports correctly
  - Verify cron jobs execute on schedule
  - Ask the user if questions arise

- [ ] 7. Implement frontend report management UI
  - [x] 7.1 Create ReportsManager component
    - Display list of all reports
    - Show report status (enabled/disabled)
    - Provide create/edit/delete buttons
    - _Requirements: 1.1, 2.1_
  
  - [x] 7.2 Create ReportForm component
    - Form for creating/editing reports
    - Fields: name, type, recipients, schedule, enabled status
    - Validate required fields and email format
    - Support predefined schedules and custom cron
    - _Requirements: 1.1, 1.2, 1.3, 2.1, 7.1, 9.1, 9.2_
  
  - [x] 7.3 Create recipient management in ReportForm
    - Allow adding multiple email recipients
    - Validate email format on input
    - Allow removing recipients
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 7.4 Create schedule selector in ReportForm
    - Provide predefined schedule options (daily, weekly, monthly)
    - Allow custom cron expression input
    - Validate cron expression format
    - _Requirements: 1.3, 9.1, 9.2, 9.3, 9.4_
  
  - [ ]* 7.5 Write unit tests for ReportForm validation
    - Test required field validation
    - Test email format validation
    - Test cron expression validation
    - _Requirements: 1.2, 7.2, 9.3, 9.4_

- [ ] 8. Implement frontend history and email logs UI
  - [x] 8.1 Create HistoryTab component
    - Display report execution history with pagination
    - Show execution timestamp, status, error messages
    - Allow filtering by date range
    - Clicking entry shows detailed email logs
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [x] 8.2 Create EmailLogsView component
    - Show email delivery logs for a report execution
    - Display recipient, timestamp, delivery status, error details
    - Allow searching by recipient
    - Provide export to CSV/JSON
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 8.3 Write unit tests for history and email logs display
    - Test history filtering and pagination
    - Test email log display
    - Test export functionality
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 9. Checkpoint - Ensure all frontend tests pass
  - Ensure all unit tests pass
  - Verify UI components render correctly
  - Verify form validation works
  - Ask the user if questions arise

- [ ] 10. Integration and wiring
  - [x] 10.1 Wire frontend to backend API
    - Connect ReportsManager to GET /api/reports
    - Connect ReportForm to POST/PUT /api/reports
    - Connect delete button to DELETE /api/reports/:id
    - Connect toggle button to PATCH /api/reports/:id/toggle
    - _Requirements: 1.1, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [x] 10.2 Wire history tab to backend API
    - Connect HistoryTab to GET /api/reports/:id/history
    - Connect date filter to query parameters
    - Connect email logs view to GET /api/reports/:id/history/:historyId/emails
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 6.1_
  
  - [x] 10.3 Wire email logs search and export
    - Connect search to GET /api/email-logs/search
    - Connect export button to GET /api/email-logs/export
    - _Requirements: 6.4, 6.5_
  
  - [x] 10.4 Integrate MCP server with backend
    - MCP server queries database for enabled reports
    - MCP server creates Report_History entries via database
    - MCP server creates Email_Logs entries via database
    - Backend API retrieves history and logs from database
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.2, 10.3, 10.4_
  
  - [ ]* 10.5 Write integration tests
    - Test end-to-end report creation and execution flow
    - Test scheduler startup and report loading
    - Test email delivery with actual EmailService
    - Test database persistence across restarts
    - Test concurrent report executions
    - Test history and email log retrieval with large datasets
    - _Requirements: All_

- [x] 11. Final checkpoint - Ensure all tests pass
  - Ensure all unit, property, and integration tests pass
  - Verify end-to-end workflows work correctly
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Integration tests validate end-to-end workflows
