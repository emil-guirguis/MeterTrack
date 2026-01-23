# Design Document: System Notifications Agent

## Overview

The System Notifications Agent is a comprehensive monitoring and notification system that tracks meter health, stores notifications in a database, displays them through a frontend UI, and sends daily email summaries. The system consists of:

- **Backend Services**: NotificationAgent (cron-based health checks), EmailNotificationService (daily email delivery), NotificationService (CRUD operations)
- **Frontend Components**: NotificationBell (displays count and list), NotificationList (individual notification display)
- **Database Layer**: Notifications table with meter_id, element_id, notification_type, created_at, cleared status
- **Client MCP Server**: check_meter_health tool for querying meter status
- **Configuration**: Centralized cron constants and system settings interface

The system monitors meters for two types of issues: failing readings (error status) and stale readings (no update in past 1 hour). When issues are detected, notifications are created and persisted. Users can view notifications through the UI and clear them individually or in bulk. Daily email summaries are sent to configured recipients.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend Layer                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NotificationBell Component                              │   │
│  │  - Displays count badge                                  │   │
│  │  - Shows/hides notification list on click                │   │
│  │  - Handles clear individual and clear all actions        │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NotificationList Component                              │   │
│  │  - Renders list of non-cleared notifications             │   │
│  │  - Shows meter_id, element_id, type, timestamp           │   │
│  │  - Provides clear button for each notification           │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  System Settings - Notifications Tab                     │   │
│  │  - Configure health check interval (cron)                │   │
│  │  - Configure daily email time (cron)                     │   │
│  │  - Select email template                                 │   │
│  │  - Toggle notifications on/off                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (API calls)
┌─────────────────────────────────────────────────────────────────┐
│                      Backend Services Layer                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NotificationAgent (Cron-based)                          │   │
│  │  - Runs on configurable schedule (default: every 2h)     │   │
│  │  - Calls check_meter_health tool                         │   │
│  │  - Creates notifications for failing/stale readings      │   │
│  │  - Prevents duplicate notifications                      │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  EmailNotificationService (Cron-based)                   │   │
│  │  - Runs on configurable schedule (default: daily)        │   │
│  │  - Retrieves non-cleared notifications                   │   │
│  │  - Populates email template with notification data       │   │
│  │  - Sends email if notifications exist                    │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NotificationService (REST API)                          │   │
│  │  - GET /notifications (list non-cleared)                 │   │
│  │  - POST /notifications (create)                          │   │
│  │  - DELETE /notifications/:id (clear individual)          │   │
│  │  - DELETE /notifications (clear all)                     │   │
│  │  - GET /notifications/count (get badge count)            │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SettingsService (REST API)                              │   │
│  │  - GET /settings/notifications                           │   │
│  │  - PUT /settings/notifications                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (Database queries)
┌─────────────────────────────────────────────────────────────────┐
│                      Data Layer                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Notifications Table                                     │   │
│  │  - id (primary key)                                      │   │
│  │  - meter_id (foreign key)                                │   │
│  │  - element_id (string)                                   │   │
│  │  - notification_type (enum: failing, stale)              │   │
│  │  - created_at (timestamp)                                │   │
│  │  - cleared (boolean, default: false)                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  NotificationSettings Table                              │   │
│  │  - id (primary key)                                      │   │
│  │  - health_check_cron (string)                            │   │
│  │  - daily_email_cron (string)                             │   │
│  │  - email_template_id (foreign key)                       │   │
│  │  - enabled (boolean)                                     │   │
│  │  - updated_at (timestamp)                                │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              ↕ (Tool calls)
┌─────────────────────────────────────────────────────────────────┐
│                    Client MCP Server                             │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  check_meter_health Tool                                 │   │
│  │  - Returns list of all meters and elements               │   │
│  │  - Identifies failing readings (error status)            │   │
│  │  - Identifies stale readings (>1 hour old)               │   │
│  │  - Returns meter_id, element_id, status, last_update     │   │
│  │  - Returns empty list if no issues                       │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Notifications Table

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meter_id UUID NOT NULL,
  element_id VARCHAR(255) NOT NULL,
  notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('failing', 'stale')),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cleared BOOLEAN NOT NULL DEFAULT FALSE,
  UNIQUE(meter_id, element_id, notification_type, cleared) -- Prevent duplicates for same meter/element/type
);

CREATE INDEX idx_notifications_cleared ON notifications(cleared);
CREATE INDEX idx_notifications_meter_id ON notifications(meter_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);
```

### NotificationSettings Table

```sql
CREATE TABLE notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  health_check_cron VARCHAR(255) NOT NULL DEFAULT '0 */2 * * *',
  daily_email_cron VARCHAR(255) NOT NULL DEFAULT '0 9 * * *',
  email_template_id UUID,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (email_template_id) REFERENCES email_templates(id)
);
```

## Components and Interfaces

### Frontend Components

#### NotificationBell Component

**Purpose**: Displays notification count badge and provides access to notification list

**Props**:
- `onClearNotification`: Callback when user clears a notification
- `onClearAll`: Callback when user clears all notifications
- `refreshInterval`: Polling interval in milliseconds (default: 30000)

**State**:
- `notifications`: Array of notification objects
- `isOpen`: Boolean indicating if dropdown is open
- `count`: Number of non-cleared notifications

**Methods**:
- `fetchNotifications()`: Calls GET /api/notifications to retrieve current list
- `handleClear(notificationId)`: Calls DELETE /api/notifications/:id
- `handleClearAll()`: Calls DELETE /api/notifications
- `updateCount()`: Calls GET /api/notifications/count

**Behavior**:
- Displays badge with count of non-cleared notifications
- On click, toggles dropdown showing NotificationList component
- Polls backend every 30 seconds for updates
- Updates count and list when notifications change

#### NotificationList Component

**Purpose**: Renders individual notifications with details and clear actions

**Props**:
- `notifications`: Array of notification objects
- `onClear`: Callback when user clears a notification
- `onClearAll`: Callback when user clears all notifications

**Notification Object Structure**:
```typescript
interface Notification {
  id: string;
  meter_id: string;
  element_id: string;
  notification_type: 'failing' | 'stale';
  created_at: string; // ISO timestamp
}
```

**Rendering**:
- List of notifications with:
  - Meter ID
  - Element ID
  - Notification type (with visual indicator: red for failing, yellow for stale)
  - Creation timestamp (formatted as relative time: "2 hours ago")
  - Clear button for individual notification
- "Clear All" button at bottom if notifications exist

### System Settings - Notifications Tab

**Purpose**: Allows administrators to configure notification system behavior

**Configuration Fields**:
- **Health Check Interval**: Cron expression input (default: "0 */2 * * *" = every 2 hours)
- **Daily Email Time**: Cron expression input (default: "0 9 * * *" = 9 AM daily)
- **Email Template**: Dropdown to select email template (filters to "meter_reading_notification" type)
- **Enable Notifications**: Toggle switch (default: true)

**Behavior**:
- Loads current settings from GET /api/settings/notifications
- Validates cron expressions on input
- Saves settings to PUT /api/settings/notifications
- Shows success/error message after save
- Updates active cron schedules immediately after save

## Data Models

### Notification Model

```typescript
interface Notification {
  id: string;
  meter_id: string;
  element_id: string;
  notification_type: 'failing' | 'stale';
  created_at: string;
  cleared: boolean;
}

interface CreateNotificationRequest {
  meter_id: string;
  element_id: string;
  notification_type: 'failing' | 'stale';
}
```

### MeterHealthIssue Model (from check_meter_health tool)

```typescript
interface MeterHealthIssue {
  meter_id: string;
  element_id: string;
  issue_type: 'failing' | 'stale';
  last_update: string; // ISO timestamp
  status: string; // error status or "stale"
}
```

### NotificationSettings Model

```typescript
interface NotificationSettings {
  id: string;
  health_check_cron: string;
  daily_email_cron: string;
  email_template_id: string;
  enabled: boolean;
  updated_at: string;
}

interface UpdateNotificationSettingsRequest {
  health_check_cron?: string;
  daily_email_cron?: string;
  email_template_id?: string;
  enabled?: boolean;
}
```

## Client MCP Server Changes

### check_meter_health Tool

**Purpose**: Provides the NotificationAgent with meter health status for all meters and elements

**Input**: None (checks all meters)

**Output**:
```typescript
interface CheckMeterHealthResponse {
  issues: MeterHealthIssue[];
}

interface MeterHealthIssue {
  meter_id: string;
  element_id: string;
  issue_type: 'failing' | 'stale';
  last_update: string; // ISO timestamp
  status: string; // error message or "stale"
}
```

**Implementation Details**:
- Query all meters from database
- For each meter, retrieve latest readings for all elements
- Check for failing readings: status === 'error'
- Check for stale readings: current_time - last_update > 1 hour
- Return array of issues found
- Return empty array if no issues detected

**Example Response**:
```json
{
  "issues": [
    {
      "meter_id": "550e8400-e29b-41d4-a716-446655440000",
      "element_id": "temperature",
      "issue_type": "failing",
      "last_update": "2024-01-15T10:30:00Z",
      "status": "Connection timeout"
    },
    {
      "meter_id": "550e8400-e29b-41d4-a716-446655440001",
      "element_id": "humidity",
      "issue_type": "stale",
      "last_update": "2024-01-15T08:45:00Z",
      "status": "stale"
    }
  ]
}
```

## Backend Services

### NotificationAgent Service

**Purpose**: Monitors meter health and creates notifications for issues

**Execution**: Cron-based, configurable schedule (default: every 2 hours)

**Process**:
1. Load notification settings from database
2. If notifications are disabled, exit
3. Call check_meter_health tool to get list of issues
4. For each issue:
   - Check if notification already exists for (meter_id, element_id, notification_type)
   - If not exists, create new notification record
   - If exists and cleared=false, skip (duplicate prevention)
   - If exists and cleared=true, create new notification (issue recurred)
5. Log results

**Duplicate Prevention Logic**:
- Query: `SELECT * FROM notifications WHERE meter_id = ? AND element_id = ? AND notification_type = ? AND cleared = FALSE`
- If result exists, skip creation
- If no result, create notification

**Error Handling**:
- Log errors but don't fail the entire run
- Continue processing remaining issues if one fails
- Alert administrators if check_meter_health tool fails

### EmailNotificationService

**Purpose**: Sends daily email summaries of outstanding notifications

**Execution**: Cron-based, configurable schedule (default: 9 AM daily)

**Process**:
1. Load notification settings from database
2. If notifications are disabled, exit
3. Query all non-cleared notifications: `SELECT * FROM notifications WHERE cleared = FALSE`
4. If no notifications exist, exit (don't send email)
5. Load email template with type "meter_reading_notification"
6. Populate template variables:
   - `sendTo`: From template configuration
   - `sendFrom`: From template configuration
   - `notifications`: Array of notification objects
   - `login_url`: System login URL
   - `notification_count`: Count of notifications
7. Send email
8. Log email sent

**Email Template Integration**:
- Extend EmailTemplate type to include:
  - `sendTo`: Email address or list of addresses
  - `sendFrom`: Email address
- Template variables available:
  - `{{notification_count}}`: Number of notifications
  - `{{notifications}}`: Array of notification objects (meter_id, element_id, type, created_at)
  - `{{login_url}}`: Link to system login
  - `{{current_date}}`: Current date

**Error Handling**:
- Log errors but don't fail
- Retry failed emails up to 3 times
- Alert administrators if email service fails

### NotificationService (REST API)

**Purpose**: Provides CRUD operations for notifications

**Endpoints**:

#### GET /api/notifications
- Returns all non-cleared notifications
- Query params: `limit` (default: 100), `offset` (default: 0)
- Response: `{ notifications: Notification[], total: number }`

#### GET /api/notifications/count
- Returns count of non-cleared notifications
- Response: `{ count: number }`

#### POST /api/notifications
- Creates a new notification (for manual creation if needed)
- Body: `{ meter_id, element_id, notification_type }`
- Response: `{ notification: Notification }`
- Returns 409 if duplicate exists

#### DELETE /api/notifications/:id
- Clears (deletes) a specific notification
- Response: `{ success: true }`
- Returns 404 if not found

#### DELETE /api/notifications
- Clears (deletes) all notifications
- Response: `{ deleted_count: number }`

### SettingsService (REST API)

**Purpose**: Manages notification system configuration

**Endpoints**:

#### GET /api/settings/notifications
- Returns current notification settings
- Response: `{ settings: NotificationSettings }`

#### PUT /api/settings/notifications
- Updates notification settings
- Body: `{ health_check_cron?, daily_email_cron?, email_template_id?, enabled? }`
- Response: `{ settings: NotificationSettings }`
- Validates cron expressions
- Restarts cron jobs if schedules changed

## Email Template Integration

### EmailTemplate Type Extension

Extend the existing EmailTemplate type to include:

```typescript
interface EmailTemplate {
  id: string;
  type: string; // e.g., "meter_reading_notification"
  name: string;
  subject: string;
  body: string;
  sendTo: string | string[]; // Email address(es) to send to
  sendFrom: string; // Email address to send from
  variables: string[]; // List of template variables
  created_at: string;
  updated_at: string;
}
```

### Template Variables

For "meter_reading_notification" template:
- `{{notification_count}}`: Number of outstanding notifications
- `{{notifications}}`: Formatted list of notifications
- `{{login_url}}`: Link to system login
- `{{current_date}}`: Current date formatted

### Example Template

```
Subject: {{notification_count}} Meter Issues Detected

Body:
Hello,

You have {{notification_count}} outstanding meter health issues:

{{notifications}}

Please log in to the system to review and clear these notifications:
{{login_url}}

Best regards,
System Notifications Agent
```

## Cron Constants

### CronConstants File Structure

```typescript
// src/constants/cron.ts

export const CRON_CONSTANTS = {
  NOTIFICATION_HEALTH_CHECK: {
    DEFAULT: '0 */2 * * *', // Every 2 hours
    DESCRIPTION: 'Meter health check schedule'
  },
  NOTIFICATION_DAILY_EMAIL: {
    DEFAULT: '0 9 * * *', // 9 AM daily
    DESCRIPTION: 'Daily email notification schedule'
  }
};

export const getCronSchedule = (key: string, override?: string): string => {
  if (override) return override;
  
  const constant = Object.values(CRON_CONSTANTS).find(c => c.DEFAULT === key);
  return constant?.DEFAULT || key;
};
```

### Usage in Services

```typescript
// In NotificationAgent initialization
const schedule = settings.health_check_cron || CRON_CONSTANTS.NOTIFICATION_HEALTH_CHECK.DEFAULT;
cron.schedule(schedule, () => runHealthCheck());

// In EmailNotificationService initialization
const schedule = settings.daily_email_cron || CRON_CONSTANTS.NOTIFICATION_DAILY_EMAIL.DEFAULT;
cron.schedule(schedule, () => sendDailyEmail());
```

## System Settings

### Notifications Configuration Tab

**Location**: System Settings → Notifications

**Configuration Options**:

1. **Enable Notifications**
   - Type: Toggle switch
   - Default: true
   - Effect: Disables all notification creation and email sending when off

2. **Health Check Interval**
   - Type: Cron expression input
   - Default: "0 */2 * * *" (every 2 hours)
   - Validation: Must be valid cron expression
   - Effect: Changes frequency of meter health checks

3. **Daily Email Time**
   - Type: Cron expression input
   - Default: "0 9 * * *" (9 AM daily)
   - Validation: Must be valid cron expression
   - Effect: Changes time of daily email delivery

4. **Email Template**
   - Type: Dropdown select
   - Options: All templates with type "meter_reading_notification"
   - Default: First available template
   - Effect: Changes template used for daily emails

**Persistence**:
- Settings stored in `notification_settings` table
- Loaded on system startup
- Updated immediately when saved
- Cron jobs restarted if schedules changed

## API Endpoints

### Notification Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /api/notifications | List non-cleared notifications | Required |
| GET | /api/notifications/count | Get notification count | Required |
| POST | /api/notifications | Create notification | Required |
| DELETE | /api/notifications/:id | Clear individual notification | Required |
| DELETE | /api/notifications | Clear all notifications | Required |

### Settings Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /api/settings/notifications | Get notification settings | Admin |
| PUT | /api/settings/notifications | Update notification settings | Admin |

### Response Formats

**Success Response**:
```json
{
  "success": true,
  "data": { /* response data */ }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: No Duplicate Notifications for Same Meter Element

*For any* meter and element with a detected health issue, running the notification agent multiple times should result in only one non-cleared notification for that meter-element-type combination.

**Validates: Requirements 1.4**

**Rationale**: The system must prevent duplicate notifications for the same issue. If the agent runs twice and detects the same failing meter, only one notification should exist in the database.

**Test Approach**: Create a meter with a failing reading, run the agent twice, verify only one notification exists for that meter-element-type.

### Property 2: Cleared Notifications Are Deleted from Database

*For any* notification that exists in the database, clearing it should result in the notification being completely removed from the database (not just marked as cleared).

**Validates: Requirements 2.6, 3.6, 3.7**

**Rationale**: The system must delete cleared notifications, not just mark them. This ensures the database doesn't accumulate cleared records and the notification count is accurate.

**Test Approach**: Create a notification, clear it, query the database, verify the notification no longer exists.

### Property 3: Daily Email Only Sends if Notifications Exist

*For any* execution of the daily email service, if no non-cleared notifications exist in the database, no email should be sent.

**Validates: Requirements 4.8**

**Rationale**: The system should not send empty emails. If there are no notifications to report, the email service should exit without sending.

**Test Approach**: Clear all notifications, run the email service, verify no email is sent. Then create a notification, run the service, verify email is sent.

### Property 4: Notification Count Badge Matches Database

*For any* state of the notification system, the count badge displayed in the UI should exactly match the number of non-cleared notifications in the database.

**Validates: Requirements 3.1, 3.2, 3.3**

**Rationale**: The UI must accurately reflect the database state. Users rely on the count badge to know how many issues exist.

**Test Approach**: Create/clear notifications, fetch the count from the API, verify it matches the UI display.

### Property 5: All Required Notification Fields Are Persisted

*For any* notification created in the system, the database record should contain all required fields: meter_id, element_id, notification_type, created_at, and cleared status initialized to false.

**Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**

**Rationale**: The system must persist complete notification data. Missing fields would break downstream processes like email generation and UI display.

**Test Approach**: Create a notification, query the database, verify all required fields are present and have correct values.

## Error Handling

### Notification Agent Errors

- **check_meter_health tool fails**: Log error, alert administrators, retry on next scheduled run
- **Database connection fails**: Log error, alert administrators, retry on next scheduled run
- **Duplicate notification creation fails**: Log warning, continue processing other issues

### Email Service Errors

- **Email template not found**: Log error, alert administrators, skip email send
- **Email send fails**: Log error, retry up to 3 times with exponential backoff
- **Database query fails**: Log error, alert administrators, skip email send

### API Errors

- **Invalid notification ID**: Return 404 Not Found
- **Duplicate notification creation**: Return 409 Conflict
- **Invalid cron expression**: Return 400 Bad Request with validation error
- **Unauthorized access**: Return 401 Unauthorized
- **Insufficient permissions**: Return 403 Forbidden

## Testing Strategy

### Unit Testing

Unit tests verify specific examples, edge cases, and error conditions:

- **Notification Creation**: Test creating notifications with valid/invalid data
- **Duplicate Prevention**: Test that duplicate notifications are not created
- **Notification Deletion**: Test clearing individual and all notifications
- **Email Template Population**: Test that template variables are correctly populated
- **Cron Expression Validation**: Test valid and invalid cron expressions
- **Settings Persistence**: Test saving and loading settings
- **API Responses**: Test correct response formats and status codes

### Property-Based Testing

Property-based tests verify universal properties across all inputs:

- **Property 1 (No Duplicates)**: Generate random meters/elements, run agent multiple times, verify single notification
- **Property 2 (Cleared Deletion)**: Generate random notifications, clear them, verify deletion
- **Property 3 (Email Conditional)**: Generate random notification states, verify email only sends when needed
- **Property 4 (Count Accuracy)**: Generate random notification operations, verify count matches database
- **Property 5 (Field Persistence)**: Generate random notification data, verify all fields persisted

### Test Configuration

- Minimum 100 iterations per property test
- Each property test tagged with: `Feature: system-notifications-agent, Property N: [property_text]`
- Unit tests focus on specific examples and edge cases
- Property tests focus on universal correctness across all inputs
- Both test types required for comprehensive coverage

### Integration Testing

- Test notification creation → UI update → email generation flow
- Test settings changes → cron job restart flow
- Test API endpoints with various authentication states
- Test database transactions and consistency

