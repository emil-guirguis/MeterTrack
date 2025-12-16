# Implementation Plan: User Permissions Refactor

- [x] 1. Create PermissionsService with role-to-permission mappings



  - Create `client/backend/src/services/PermissionsService.js`
  - Define role-to-permission mappings for admin, manager, technician, viewer
  - Implement `getPermissionsByRole(role)` method returning nested object format
  - Implement `toFlatArray(permissionsObj)` method for API responses
  - Implement `toNestedObject(flatArray)` method for format conversion
  - Implement `validatePermissionsObject(permissionsObj)` method
  - Implement `getAvailableModules()` and `getAvailableActions(module)` helper methods
  - _Requirements: 1.1, 4.1, 4.2, 4.3_

- [x]* 1.1 Write property tests for PermissionsService

  - **Property 1: Service Defines All Role Mappings**
  - **Validates: Requirements 1.1**
  - **Property 8: Permissions Validation**
  - **Validates: Requirements 4.3**


- [x] 2. Update User model to support permissions as nested JSON



  - Add validation method to User model for permissions structure
  - Add helper method to convert stored permissions to nested object
  - Ensure permissions field properly handles JSON serialization/deserialization
  - _Requirements: 2.4_

- [ ]* 2.1 Write property test for permissions storage round trip
  - **Property 3: Permissions Storage Round Trip**
  - **Validates: Requirements 1.3, 2.4**


- [x] 3. Update auth.js to use PermissionsService




  - Import PermissionsService at top of file
  - Replace hardcoded role mappings in login endpoint with service call
  - Replace hardcoded role mappings in refresh endpoint with service call
  - Replace hardcoded role mappings in verify endpoint with service call
  - Update bootstrap endpoint to use service for admin permissions
  - Maintain backward compatibility by converting nested object to flat array for responses
  - _Requirements: 3.1, 3.2, 3.3, 3.4_

- [ ]* 3.1 Write property tests for auth endpoints using PermissionsService
  - **Property 4: Service is Source of Truth**
  - **Validates: Requirements 1.4, 3.1**
  - **Property 9: Endpoint Permission Consistency**
  - **Validates: Requirements 3.1, 3.2, 3.3, 4.4**
  - **Property 10: Bootstrap Uses Service**
  - **Validates: Requirements 3.4**


- [x] 4. Update users.js to auto-generate permissions on user creation




  - Import PermissionsService
  - Modify POST /users endpoint to auto-generate permissions based on role
  - Call `getPermissionsByRole(role)` when creating user without explicit permissions
  - Store permissions as nested JSON object in database
  - Validate permissions structure before saving
  - _Requirements: 2.1, 2.2, 2.3_

- [ ]* 4.1 Write property tests for user creation with auto-generated permissions
  - **Property 2: User Creation Auto-Generates Permissions**
  - **Validates: Requirements 1.2, 2.1**
  - **Property 5: Admin Role Has Full Permissions**
  - **Validates: Requirements 2.2**
  - **Property 6: Viewer Role Has Read-Only Permissions**
  - **Validates: Requirements 2.3**


- [x] 5. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 5.1 Write integration tests for end-to-end flows
  - Test user creation → login → verify flow with permissions
  - Test permission consistency across multiple authentication endpoints
  - Test role-based permission generation for all roles
  - _Requirements: 1.2, 3.1, 3.2, 3.3, 4.4_

- [x] 6. Final Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.

