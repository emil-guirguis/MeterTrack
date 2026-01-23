# Requirements Document: System Notifications Agent

## Introduction

The System Notifications Agent is a monitoring and notification system that tracks meter health and communicates issues to users through multiple channels. The system monitors meter readings for failures and staleness, stores notifications in a database, displays them through a frontend UI, and sends daily email summaries to users. The agent runs on a configurable cron schedule and integrates with the existing email template system.

## Glossary

- **Meter**: A device or data source that produces readings
- **Element**: A component or measurement within a meter
- **Meter Reading**: A data point captured from a meter or element at a specific time
- **Failing Reading**: A meter reading with an error status indicating the meter is not functioning properly
- **Stale Reading**: A meter reading that has not been updated within the specified time threshold (1 hour)
- **Notification**: A record of a detected meter health issue (failing or stale reading)
- **Notification Agent**: The system component that monitors meters and creates notifications
- **Notification Bell**: The frontend UI component that displays notification count and allows users to view/manage notifications
- **Email Template**: A reusable email format with configurable variables for sending notifications
- **Cron Schedule**: A time-based trigger that executes tasks at specified intervals
- **System Settings**: The administrative interface for configuring system-wide parameters
- **Client MCP Server**: The backend service that provides tools and integrations for client operations
- **Cleared Notification**: A notification that has been dismissed by the user and marked as inactive

## Requirements

### Requirement 1: Meter Health Monitoring

**User Story:** As a system administrator, I want the system to continuously monitor meter health, so that I can be alerted to failing or stale meter readings before they impact operations.

#### Acceptance Criteria

1. WHEN the notification agent runs, THE Notification_Agent SHALL check all meters and their elements for failing readings
2. WHEN the notification agent runs, THE Notification_Agent SHALL check all meters and their elements for readings that have not been updated in the past 1 hour
3. WHEN a failing or stale reading is detected, THE Notification_Agent SHALL create a notification record in the database
4. WHEN a notification already exists for a meter element, THE Notification_Agent SHALL not create a duplicate notification
5. THE Notification_Agent SHALL execute on a cron schedule every 2 hours

### Requirement 2: Notification Storage

**User Story:** As a system operator, I want notifications to be persisted in the database, so that I can track and manage meter health issues over time.

#### Acceptance Criteria

1. WHEN a notification is created, THE Database SHALL store the notification with the associated meter identifier
2. WHEN a notification is created, THE Database SHALL store the notification with the associated element identifier
3. WHEN a notification is created, THE Database SHALL store the notification type (failing or stale)
4. WHEN a notification is created, THE Database SHALL store the creation timestamp
5. WHEN a notification is created, THE Database SHALL initialize the cleared status to false
6. WHEN a user clears a notification, THE Database SHALL delete the notification record

### Requirement 3: Notification Bell UI

**User Story:** As a user, I want to see a notification bell icon with a count badge, so that I can quickly see how many unresolved meter issues exist.

#### Acceptance Criteria

1. WHEN the frontend loads, THE Notification_Bell SHALL display a count badge showing the number of non-cleared notifications
2. WHEN a new notification is created, THE Notification_Bell SHALL update the count badge
3. WHEN a user clears a notification, THE Notification_Bell SHALL decrement the count badge
4. WHEN a user clicks the notification bell icon, THE Notification_Bell SHALL display a list of all non-cleared notifications
5. WHEN displaying notifications, THE Notification_Bell SHALL show the meter identifier, element identifier, notification type, and creation timestamp for each notification
6. WHEN a user clicks "Clear" on an individual notification, THE Notification_Bell SHALL remove that notification from the list and delete it from the database
7. WHEN a user clicks "Clear All", THE Notification_Bell SHALL remove all notifications from the list and delete all records from the database

### Requirement 4: Daily Email Notifications

**User Story:** As a user, I want to receive a daily email summary of outstanding notifications, so that I can stay informed about meter health issues even when not actively using the system.

#### Acceptance Criteria

1. WHEN the daily email cron job executes, THE Email_Agent SHALL retrieve all non-cleared notifications from the database
2. WHEN the daily email cron job executes, THE Email_Agent SHALL use the email template with type "meter_reading_notification"
3. WHEN sending an email, THE Email_Agent SHALL populate the email template with the sendTo field from the template configuration
4. WHEN sending an email, THE Email_Agent SHALL populate the email template with the sendFrom field from the template configuration
5. WHEN sending an email, THE Email_Agent SHALL populate the email template with notification details (meter, element, type, timestamp)
6. WHEN sending an email, THE Email_Agent SHALL include a link to the system login in the email content
7. WHEN the daily email cron job executes, THE Email_Agent SHALL send the email once per day at the configured time
8. IF no non-cleared notifications exist, THEN THE Email_Agent SHALL not send an email

### Requirement 5: System Settings Configuration

**User Story:** As a system administrator, I want to configure notification settings in the system settings interface, so that I can customize how the notification system operates.

#### Acceptance Criteria

1. WHEN a user navigates to system settings, THE System_Settings SHALL display a "Notifications" tab
2. WHEN the Notifications tab is selected, THE System_Settings SHALL display a configuration form
3. WHERE notification check interval is configurable, THE System_Settings SHALL allow the administrator to set the cron schedule for meter health checks
4. WHERE daily email time is configurable, THE System_Settings SHALL allow the administrator to set the cron schedule for daily email delivery
5. WHERE email template selection is configurable, THE System_Settings SHALL allow the administrator to select which email template to use
6. WHERE notifications can be enabled or disabled, THE System_Settings SHALL allow the administrator to toggle notifications on or off
7. WHEN settings are saved, THE System_Settings SHALL persist the configuration to the database
8. WHEN the notification system starts, THE System_Settings SHALL load the persisted configuration

### Requirement 6: Centralized Cron Schedule Configuration

**User Story:** As a developer, I want all cron schedules to be defined in a centralized constants file, so that the system is maintainable and schedules can be easily modified.

#### Acceptance Criteria

1. THE Cron_Constants SHALL define the default meter health check schedule (every 2 hours)
2. THE Cron_Constants SHALL define the default daily email send time
3. WHEN the notification system initializes, THE Notification_System SHALL load cron schedules from the Cron_Constants file
4. WHEN system settings are updated, THE Notification_System SHALL update the active cron schedules
5. THE Cron_Constants file SHALL be the single source of truth for all notification-related cron schedules

### Requirement 7: Client MCP Server Integration

**User Story:** As a system integrator, I want the client MCP server to provide a tool for checking meter health, so that the notification agent can query meter status programmatically.

#### Acceptance Criteria

1. WHEN the notification agent needs to check meter health, THE Client_MCP_Server SHALL provide a tool named "check_meter_health"
2. WHEN the check_meter_health tool is called, THE Client_MCP_Server SHALL return a list of all meters and their elements
3. WHEN the check_meter_health tool is called, THE Client_MCP_Server SHALL identify meters with failing readings (error status)
4. WHEN the check_meter_health tool is called, THE Client_MCP_Server SHALL identify meters with stale readings (no update in past 1 hour)
5. WHEN the check_meter_health tool is called, THE Client_MCP_Server SHALL return the meter identifier, element identifier, reading status, and last update timestamp for each issue
6. WHEN the check_meter_health tool is called, THE Client_MCP_Server SHALL return an empty list if no issues are detected

### Requirement 8: Frontend Notification Updates

**User Story:** As a user, I want the notification bell to reflect real-time updates, so that I always see the current state of notifications.

#### Acceptance Criteria

1. WHEN a notification is created or cleared, THE Frontend SHALL update the notification bell display
2. WHEN the user is viewing the notification list, THE Frontend SHALL refresh the list when notifications change
3. THE Frontend MAY use polling or WebSocket subscriptions to receive notification updates
4. WHEN the frontend loads, THE Frontend SHALL fetch the current list of non-cleared notifications from the backend

