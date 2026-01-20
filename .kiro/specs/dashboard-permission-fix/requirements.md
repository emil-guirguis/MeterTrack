# Requirements Document: Dashboard Permission Fix

## Introduction

The dashboard is currently protected by a `dashboard:read` permission check, but this permission is not defined in the system's permission model. The dashboard should be accessible to all authenticated users without requiring a specific permission.

## Glossary

- **Dashboard**: The main analytics and visualization page showing aggregated meter data
- **Permission**: A system-level authorization check that controls access to features
- **Authenticated User**: A user who has successfully logged in to the system
- **AuthGuard**: Frontend component that checks permissions before rendering content

## Requirements

### Requirement 1: Remove Dashboard Permission Requirement

**User Story:** As an authenticated user, I want to access the dashboard without needing a specific permission, so that all users can view their data.

#### Acceptance Criteria

1. WHEN an authenticated user navigates to the dashboard route, THE system SHALL render the dashboard without checking for `dashboard:read` permission
2. WHEN an unauthenticated user navigates to the dashboard route, THE system SHALL redirect to the login page
3. WHEN the dashboard route is accessed, THE system SHALL only require authentication, not specific permissions

### Requirement 2: Update Frontend Route Protection

**User Story:** As a developer, I want the dashboard route to use basic authentication checks instead of permission checks, so that the permission system is consistent.

#### Acceptance Criteria

1. WHEN the dashboard route is defined in AppRoutes, THE system SHALL use ProtectedRoute instead of AuthGuard with permission checks
2. WHEN the dashboard component renders, THE system SHALL not call checkPermission for `dashboard:read`
3. WHEN the dashboard page loads, THE system SHALL not log permission denied warnings for authenticated users

### Requirement 3: Verify Dashboard Accessibility

**User Story:** As a user, I want to confirm that the dashboard is accessible after the fix, so that I can view my data.

#### Acceptance Criteria

1. WHEN an authenticated user logs in, THE system SHALL allow navigation to the dashboard
2. WHEN the dashboard page loads, THE system SHALL not display "Access Denied" messages
3. WHEN the browser console is checked, THE system SHALL not show permission-related warnings for the dashboard

