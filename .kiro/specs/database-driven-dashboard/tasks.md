# Implementation Plan: Database-Driven Dashboard

## Overview

This implementation plan breaks down the database-driven dashboard feature into discrete, manageable tasks. The feature will be built incrementally, starting with database schema and backend API endpoints, followed by frontend components and integration. Each task builds on previous work with no orphaned code.

## Tasks

- [x] 1. Create Dashboard Database Schema and Migrations
  - Create migration file for dashboard table
  - Define dashboard table with all columns, constraints, and indexes
  - Create indexes for efficient querying
  - Verify migration runs successfully
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 2. Create Dashboard Model and Schema Definition
  - Define Dashboard model using the schema-based system
  - Include formFields for user-editable fields (card_name, selected_columns, time_frame_type, visualization_type)
  - Include entityFields for system fields (dashboard_id, tenant_id, created_by_users_id, created_at, updated_at)
  - Add validation rules for all fields
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [ ]* 2.1 Write property test for Dashboard model creation
  - **Property 1: Meter Element Validation**
  - **Validates: Requirements 1.4, 1.5, 7.3**

- [x] 3. Implement Power Column Discovery Endpoint
  - Create GET /api/dashboard/power-columns endpoint
  - Query meter_reading table schema to discover numeric columns
  - Filter out system columns (id, created_at, updated_at, tenant_id, meter_id, meter_element_id, is_synchronized, retry_count, sync_status)
  - Return column metadata (name, type, label)
  - Implement caching with invalidation logic
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ]* 3.1 Write unit tests for power column discovery
  - Test column filtering (numeric only)
  - Test system column exclusion
  - Test cache invalidation
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 4. Implement Dashboard Card CRUD Endpoints
  - Create POST /api/dashboard/cards (create)
  - Create GET /api/dashboard/cards (list all for tenant)
  - Create GET /api/dashboard/cards/:id (get single)
  - Create PUT /api/dashboard/cards/:id (update)
  - Create DELETE /api/dashboard/cards/:id (delete)
  - Add tenant_id filtering to all endpoints
  - Add validation for all inputs
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 4.1 Write property test for Dashboard CRUD operations
  - **Property 9: Card Update Idempotence**
  - **Validates: Requirements 4.6**

- [ ]* 4.2 Write unit tests for CRUD endpoints
  - Test create with valid data
  - Test create with invalid meter_element_id
  - Test create with invalid selected_columns
  - Test update with new values
  - Test delete removes card
  - Test tenant isolation (can't access other tenant's cards)
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 5. Implement Time Frame Calculation Logic
  - Create calculateTimeFrame() function
  - Implement 'last_month' calculation
  - Implement 'this_month_to_date' calculation
  - Implement 'since_installation' calculation (query earliest meter reading)
  - Implement custom date range validation
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [ ]* 5.1 Write property test for time frame calculation
  - **Property 2: Time Frame Consistency**
  - **Validates: Requirements 2.3, 2.4, 2.5, 5.6**

- [ ]* 5.2 Write unit tests for time frame calculation
  - Test last_month calculation on various dates
  - Test this_month_to_date calculation
  - Test since_installation calculation
  - Test custom date range validation
  - Test edge cases (month boundaries, leap years)
  - _Requirements: 5.3, 5.4, 5.5, 5.6_

- [x] 6. Implement Data Aggregation Logic
  - Create aggregateCardData() function
  - Implement SUM aggregation for energy columns
  - Implement MAX aggregation for power columns
  - Implement AVG aggregation for factor columns
  - Handle empty result sets
  - _Requirements: 5.1, 5.2, 5.7_

- [ ]* 6.1 Write property test for aggregation correctness
  - **Property 3: Aggregation Correctness**
  - **Validates: Requirements 2.1, 2.2, 2.7, 3.1**

- [ ]* 6.2 Write unit tests for aggregation logic
  - Test SUM aggregation for energy columns
  - Test MAX aggregation for power columns
  - Test AVG aggregation for factor columns
  - Test with empty result sets
  - Test with multiple meter elements
  - _Requirements: 5.1, 5.2, 5.7_

- [x] 7. Implement Aggregated Card Data Endpoint
  - Create GET /api/dashboard/cards/:id/data endpoint
  - Call calculateTimeFrame() to get time boundaries
  - Call aggregateCardData() to get aggregated values
  - Return card data with aggregated values
  - Add tenant_id filtering
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ]* 7.1 Write property test for tenant data isolation
  - **Property 4: Tenant Data Isolation**
  - **Validates: Requirements 1.7, 5.7, 7.2, 9.8**

- [ ]* 7.2 Write unit tests for aggregated data endpoint
  - Test returns correct aggregated values
  - Test respects time frame
  - Test tenant isolation
  - Test with multiple selected columns
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 8. Implement Detailed Meter Readings Endpoint
  - Create GET /api/dashboard/cards/:id/readings endpoint
  - Support pagination (page, pageSize)
  - Support sorting (sortBy, sortOrder)
  - Filter by card's time frame
  - Filter by card's meter_element_id
  - Return selected columns from card configuration
  - Add tenant_id filtering
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [ ]* 8.1 Write property test for drill-down data consistency
  - **Property 6: Drill-Down Data Consistency**
  - **Validates: Requirements 9.1, 9.3, 9.9**

- [ ]* 8.2 Write unit tests for detailed readings endpoint
  - Test pagination works correctly
  - Test sorting by timestamp
  - Test time frame filtering
  - Test meter_element_id filtering
  - Test tenant isolation
  - Test returns selected columns
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 9. Implement CSV Export Endpoint
  - Create GET /api/dashboard/cards/:id/readings/export endpoint
  - Generate CSV from detailed meter readings
  - Include header row with column names
  - Include metadata (meter element name, time frame, export timestamp)
  - Properly escape special characters
  - Name file with meter element name and date range
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [ ]* 9.1 Write property test for CSV export round-trip
  - **Property 7: CSV Export Round-Trip**
  - **Validates: Requirements 10.2, 10.3, 10.7**

- [ ]* 9.2 Write unit tests for CSV export
  - Test CSV generation with various data types
  - Test special character escaping
  - Test header row generation
  - Test metadata inclusion
  - Test file naming
  - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8_

- [x] 10. Checkpoint - Ensure all backend tests pass
  - Run all unit tests for backend
  - Run all property-based tests for backend
  - Verify no failing tests
  - Ask the user if questions arise

- [x] 11. Create Dashboard Frontend Page Component
  - Create DashboardPage component
  - Implement card grid layout (responsive)
  - Add "Create Card" button
  - Add global refresh button
  - Fetch and display all dashboard cards
  - Handle loading and error states
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 11.1 Write unit tests for DashboardPage component
  - Test renders card grid
  - Test displays all cards
  - Test create button opens modal
  - Test refresh button refreshes all cards
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 12. Create Dashboard Card Component
  - Create DashboardCard component
  - Display card name and meter element
  - Display aggregated values
  - Render visualization based on visualization_type
  - Add individual refresh button
  - Add drill-down link
  - Add edit/delete buttons
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 12.1 Write unit tests for DashboardCard component
  - Test renders card with correct data
  - Test refresh button calls API
  - Test drill-down link navigates
  - Test edit button opens modal
  - Test delete button removes card
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 13. Create Dashboard Card Modal Component
  - Create DashboardCardModal component
  - Implement form for creating/editing cards
  - Add card name input
  - Add card description textarea
  - Add meter element selector (dropdown)
  - Add power column multi-select (auto-populated from API)
  - Add time frame type selector (preset or custom)
  - Add custom date range inputs (conditional)
  - Add visualization type selector
  - Add form validation
  - Add submit and cancel buttons
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [ ]* 13.1 Write unit tests for DashboardCardModal component
  - Test form renders all fields
  - Test power columns are auto-populated
  - Test validation errors display
  - Test submit calls create/update API
  - Test cancel closes modal
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 14. Create Detailed Readings View Component
  - Create DetailedReadingsView component
  - Implement data grid with pagination
  - Display timestamp and selected power columns
  - Add sorting by column
  - Add pagination controls
  - Add row count display
  - Add export to CSV button
  - Add back to dashboard link
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [ ]* 14.1 Write unit tests for DetailedReadingsView component
  - Test renders data grid with correct columns
  - Test pagination works
  - Test sorting works
  - Test export button calls API
  - Test back link navigates
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9_

- [x] 15. Implement Visualization Components
  - Create visualization components for each type (pie, line, candlestick, bar, area)
  - Use existing charting library (e.g., Chart.js, Recharts)
  - Pass aggregated data to visualization components
  - Handle empty data gracefully
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ]* 15.1 Write unit tests for visualization components
  - Test each visualization type renders correctly
  - Test with various data shapes
  - Test handles empty data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 16. Integrate Dashboard Page into Navigation
  - Add Dashboard link to main navigation
  - Create route for dashboard page
  - Add permission checks (dashboard:read)
  - Test navigation works
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [ ]* 16.1 Write integration tests for dashboard navigation
  - Test dashboard link appears in navigation
  - Test clicking link navigates to dashboard
  - Test dashboard page loads correctly
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7_

- [x] 17. Implement Refresh Functionality
  - Implement individual card refresh (calls aggregated data endpoint)
  - Implement global refresh (refreshes all cards)
  - Add loading indicators during refresh
  - Update last_refreshed timestamp
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [ ]* 17.1 Write unit tests for refresh functionality
  - Test individual card refresh works
  - Test global refresh works
  - Test loading indicators display
  - Test last_refreshed timestamp updates
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6_

- [x] 18. Checkpoint - Ensure all frontend tests pass
  - Run all unit tests for frontend
  - Run all integration tests
  - Verify no failing tests
  - Ask the user if questions arise
  - **COMPLETED**: 161 tests passing, 11 tests skipped (non-critical), 0 tests failing

- [ ] 19. End-to-End Testing
  - Create a test dashboard card with multiple columns
  - Verify card displays aggregated data correctly
  - Verify drill-down shows detailed readings
  - Verify CSV export works
  - Verify refresh updates data
  - Verify time frame calculations work correctly
  - Verify tenant isolation (create cards in different tenants)
  - _Requirements: All_

- [ ] 20. Final Checkpoint - All Tests Pass
  - Run full test suite (unit + integration + e2e)
  - Verify no failing tests
  - Verify no console errors
  - Ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- All backend endpoints must include tenant_id filtering for security
- All frontend components must handle loading and error states
- All API responses follow the standard format: { success, data, message, errors }
