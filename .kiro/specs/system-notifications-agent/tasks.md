# Implementation Plan: System Notifications Agent

## Overview

This implementation plan breaks down the System Notifications Agent feature into discrete, incremental coding tasks. Each task builds on previous work and includes integrated testing. The system will be implemented in TypeScript with Node.js backend services, React frontend components, and PostgreSQL database.

## Tasks

- [x] 1. Set up project structure and database schema
  - Create directory structure for backend services, frontend components, and utilities
  - Define TypeScript interfaces for Notification, NotificationSettings, and MeterHealthIssue
  - Create database migrations for notifications and notification_settings tables
  - Set up database connection and query utilities
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 2. Implement NotificationService (CRUD API)
  - [x] 2.1 Create REST API endpoints for notification operations
    - Implement GET /api/notifications (list non-cleared)
    - Implement GET /api/notifications/count (get badge count)
    - Implement POST /api/notifications (create)
    - Implement DELETE /api/notifications/:id (clear individual)
    - Implement DELETE /api/notifications (clear all)
    - _Requirements: 3.1, 3.4, 3.5, 3.6, 3.7_

  - [ ]* 2.2 Write property test for notification CRUD operations
    - **Property 2: Cleared Notifications Are Deleted from Database**
    - **Validates: Requirements 2.6, 3.6, 3.7**

  - [x] 2.3 Implement notification count badge logic
    - Create query to count non-cleared notifications
    - Ensure count accuracy for UI display
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 2.4 Write property test for notification count accuracy
    - **Property 4: Notification Count Badge Matches Database**
    - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 3. Implement Client MCP Server check_meter_health tool
  - [x] 3.1 Create check_meter_health tool implementation
    - Query all meters and their elements from database
    - Identify failing readings (error status)
    - Identify stale readings (>1 hour old)
    - Return structured response with meter_id, element_id, issue_type, last_update, status
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6_

  - [ ]* 3.2 Write unit tests for check_meter_health tool
    - Test with failing readings
    - Test with stale readings
    - Test with healthy meters (empty response)
    - Test with mixed scenarios

- [ ] 4. Implement NotificationAgent service (cron-based health checks)
  - [x] 4.1 Create NotificationAgent service with cron scheduling
    - Load notification settings from database
    - Call check_meter_health tool to get issues
    - Implement duplicate prevention logic
    - Create notifications for new issues
    - Log results and errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [ ]* 4.2 Write property test for duplicate prevention
    - **Property 1: No Duplicate Notifications for Same Meter Element**
    - **Validates: Requirements 1.4**

  - [x] 4.3 Implement cron job initialization and scheduling
    - Load health_check_cron from notification settings
    - Use default from CRON_CONSTANTS if not configured
    - Start cron job on service initialization
    - _Requirements: 6.1, 6.3_

- [ ] 5. Implement Cron Constants and configuration
  - [x] 5.1 Create centralized cron constants file
    - Define NOTIFICATION_HEALTH_CHECK default (every 2 hours)
    - Define NOTIFICATION_DAILY_EMAIL default (9 AM daily)
    - Create getCronSchedule utility function
    - _Requirements: 6.1, 6.2, 6.5_

  - [x] 5.2 Create NotificationSettings service
    - Implement GET /api/settings/notifications endpoint
    - Implement PUT /api/settings/notifications endpoint
    - Validate cron expressions on update
    - Restart cron jobs when schedules change
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 5.3 Write unit tests for settings persistence
    - Test saving and loading settings
    - Test cron expression validation
    - Test cron job restart on settings change

- [ ] 6. Extend EmailTemplate type and implement EmailNotificationService
  - [x] 6.1 Extend EmailTemplate type with sendTo and sendFrom fields
    - Update EmailTemplate interface to include sendTo and sendFrom
    - Create database migration to add fields to email_templates table
    - _Requirements: 4.3, 4.4_

  - [x] 6.2 Create EmailNotificationService with cron scheduling
    - Load notification settings from database
    - Query all non-cleared notifications
    - Load email template with type "meter_reading_notification"
    - Populate template variables (sendTo, sendFrom, notifications, login_url, current_date)
    - Send email if notifications exist
    - Log results and errors
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8_

  - [ ]* 6.3 Write property test for email conditional sending
    - **Property 3: Daily Email Only Sends if Notifications Exist**
    - **Validates: Requirements 4.8**

  - [x] 6.4 Implement email template initialization and scheduling
    - Load daily_email_cron from notification settings
    - Use default from CRON_CONSTANTS if not configured
    - Start cron job on service initialization
    - _Requirements: 6.2, 6.4_

- [x] 7. Checkpoint - Ensure all backend tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Verify database schema is correct
  - Ask the user if questions arise

- [ ] 8. Implement frontend NotificationBell component
  - [x] 8.1 Create NotificationBell component structure
    - Create React component with notification state management
    - Implement badge display with count
    - Implement dropdown toggle on click
    - Add polling logic for notification updates (30-second interval)
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 8.1, 8.4_

  - [x] 8.2 Implement notification fetching and updates
    - Create fetchNotifications() method calling GET /api/notifications
    - Create updateCount() method calling GET /api/notifications/count
    - Implement polling with configurable interval
    - Handle API errors gracefully
    - _Requirements: 3.1, 3.4, 8.1, 8.4_

  - [x] 8.3 Implement clear notification actions
    - Implement handleClear() for individual notifications
    - Implement handleClearAll() for bulk clear
    - Call DELETE endpoints
    - Update UI after successful deletion
    - _Requirements: 3.6, 3.7, 8.1_

  - [ ]* 8.4 Write unit tests for NotificationBell component
    - Test badge count display
    - Test dropdown toggle
    - Test clear individual notification
    - Test clear all notifications
    - Test polling updates

- [ ] 9. Implement frontend NotificationList component
  - [x] 9.1 Create NotificationList component
    - Render list of notifications with meter_id, element_id, type, timestamp
    - Format timestamps as relative time (e.g., "2 hours ago")
    - Add visual indicators for notification type (red for failing, yellow for stale)
    - Implement clear button for each notification
    - Implement "Clear All" button
    - _Requirements: 3.4, 3.5, 3.6, 3.7_

  - [ ]* 9.2 Write unit tests for NotificationList component
    - Test notification rendering
    - Test timestamp formatting
    - Test clear button functionality
    - Test empty state

- [ ] 10. Implement System Settings - Notifications Tab
  - [x] 10.1 Create Notifications settings tab UI
    - Create form with configuration fields
    - Add Health Check Interval cron input
    - Add Daily Email Time cron input
    - Add Email Template dropdown (filtered to "meter_reading_notification")
    - Add Enable Notifications toggle
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [x] 10.2 Implement settings form logic
    - Load current settings from GET /api/settings/notifications
    - Validate cron expressions on input
    - Save settings to PUT /api/settings/notifications
    - Show success/error messages
    - Update active cron schedules after save
    - _Requirements: 5.7, 5.8_

  - [ ]* 10.3 Write unit tests for settings form
    - Test loading settings
    - Test cron validation
    - Test saving settings
    - Test error handling

- [ ] 11. Implement frontend notification updates and real-time sync
  - [x] 11.1 Add real-time notification updates
    - Implement notification creation listener
    - Implement notification deletion listener
    - Update NotificationBell when notifications change
    - Update NotificationList when viewing
    - _Requirements: 8.1, 8.2_

  - [x] 11.2 Integrate NotificationBell into main layout
    - Add NotificationBell component to header/navbar
    - Ensure it's visible on all pages
    - Connect to notification update events
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 11.3 Write integration tests for notification flow
    - Test notification creation → UI update → email generation
    - Test settings change → cron restart
    - Test API endpoints with various states

- [x] 12. Checkpoint - Ensure all frontend tests pass
  - Ensure all React component tests pass
  - Ensure all integration tests pass
  - Verify UI displays correctly
  - Ask the user if questions arise

- [ ] 13. Implement property test for field persistence
  - [x] 13.1 Write property test for notification field persistence
    - **Property 5: All Required Notification Fields Are Persisted**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 2.5**
    - Generate random notification data
    - Create notification via API
    - Query database
    - Verify all required fields present and correct

- [ ] 14. Final integration and system testing
  - [x] 14.1 Test end-to-end notification flow
    - Create meter with failing reading
    - Run NotificationAgent
    - Verify notification created
    - Verify UI updates
    - Clear notification
    - Verify deletion
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 3.1, 3.6_

  - [x] 14.2 Test email notification flow
    - Create notifications
    - Run EmailNotificationService
    - Verify email sent with correct template
    - Verify email contains all required fields
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

  - [x] 14.3 Test settings configuration flow
    - Update notification settings
    - Verify cron jobs restart
    - Verify new schedules take effect
    - _Requirements: 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 6.3, 6.4_

  - [ ]* 14.4 Write system-level property tests
    - Test all properties together
    - Test with various notification states
    - Test with concurrent operations

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all unit tests pass
  - Ensure all property tests pass
  - Ensure all integration tests pass
  - Verify no console errors or warnings
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Frontend components use React with TypeScript
- Backend services use Node.js with Express
- Database uses PostgreSQL with migrations
- Cron jobs use node-cron or similar library
- Email sending uses nodemailer or similar library

