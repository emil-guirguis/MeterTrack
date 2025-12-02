# Implementation Plan: Tenant Isolation in API Framework

## Overview

This implementation plan converts the tenant isolation design into a series of incremental coding tasks. Each task builds on previous tasks, starting with core middleware and utilities, then integrating with existing base classes, and finally validating the complete system.

---

- [-] 1. Create tenant context middleware






  - Create `framework/backend/api/middleware/tenantContext.js` that extracts tenant_id from JWT token
  - Implement middleware to store tenant_id in `req.context.tenant`
  - Add validation to ensure tenant_id exists for authenticated requests
  - Add error handling for missing or invalid tenant context
  - _Requirements: 1.1, 1.3_

- [ ]* 1.1 Write property test for tenant ID extraction on login
  - **Property 1: Tenant ID Extraction on Login**
  - **Validates: Requirements 1.1, 1.2**


- [x] 2. Create tenant utilities module


  - Create `framework/backend/api/utils/tenantUtils.js` with helper functions
  - Implement `getTenantId(req)` function to retrieve current tenant ID
  - Implement `getTenantContext(req)` function to retrieve full tenant context
  - Implement `verifyTenantOwnership(req, resourceId, model)` function
  - Implement `injectTenantFilter(query, tenantId)` function for raw SQL queries
  - _Requirements: 3.1, 3.2, 3.3, 5.2_

- [x]* 2.1 Write property test for tenant context availability


  - **Property 6: Tenant Context Availability**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [x] 3. Enhance authentication middleware to include tenant_id in JWT



  - Modify `framework/backend/api/middleware/auth.js` to extract tenant_id from user record
  - Update JWT token generation to include tenant_id in payload
  - Ensure tenant_id is available in `req.auth.user.tenant_id`
  - _Requirements: 1.1, 1.2_

- [ ]* 3.1 Write property test for tenant context restoration
  - **Property 2: Tenant Context Restoration**
  - **Validates: Requirements 1.3**

- [x] 4. Create query filter middleware





  - Create `framework/backend/api/middleware/queryFilter.js` that intercepts database queries
  - Implement query type detection (SELECT, INSERT, UPDATE, DELETE)
  - For SELECT queries: append `WHERE tenant_id = ?` or `AND tenant_id = ?`
  - For INSERT queries: add `tenant_id` to INSERT clause
  - For UPDATE/DELETE queries: append `WHERE tenant_id = ?` or `AND tenant_id = ?`
  - Add logging for all query modifications
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ]* 4.1 Write property test for query filtering consistency
  - **Property 3: Query Filtering Consistency**
  - **Validates: Requirements 2.1, 2.2, 2.3**

- [ ]* 4.2 Write property test for insert tenant ID injection
  - **Property 4: Insert Tenant ID Injection**
  - **Validates: Requirements 2.4**

- [ ]* 4.3 Write property test for update and delete tenant filtering
  - **Property 5: Update and Delete Tenant Filtering**
  - **Validates: Requirements 2.5**

- [x] 5. Enhance BaseService to support tenant isolation




  - Modify `framework/backend/api/base/BaseService.js` to accept tenant context
  - Update `findAll()` method to automatically include tenant_id in WHERE clause
  - Update `findOne()` method to automatically include tenant_id in WHERE clause
  - Update `create()` method to automatically include tenant_id in INSERT
  - Update `update()` method to automatically include tenant_id in WHERE clause
  - Update `delete()` method to automatically include tenant_id in WHERE clause
  - Ensure all methods accept optional `tenantId` parameter from request context
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 5.1_

- [x] 6. Enhance BaseController to provide tenant utilities




  - Modify `framework/backend/api/base/BaseController.js` to add tenant helper methods
  - Add `getTenantId()` method that calls tenantUtils.getTenantId()
  - Add `verifyTenantOwnership()` method that calls tenantUtils.verifyTenantOwnership()
  - Ensure tenant context is passed to service methods automatically
  - Add validation to reject requests without valid tenant context
  - _Requirements: 3.1, 3.2, 3.3, 5.1_

- [ ]* 6.1 Write property test for unauthenticated request rejection
  - **Property 7: Unauthenticated Request Rejection**
  - **Validates: Requirements 1.4, 3.4**

- [x] 7. Integrate tenant context middleware into server setup




  - Modify `client/backend/src/server.js` to use tenant context middleware
  - Add tenant context middleware after authentication middleware
  - Ensure middleware is applied to all protected routes
  - Add error handling for tenant context failures
  - _Requirements: 1.1, 1.3_

- [ ]* 7.1 Write property test for query execution prevention without tenant context
  - **Property 8: Query Execution Prevention Without Tenant Context**
  - **Validates: Requirements 4.1**
-

- [x] 8. Add security logging for tenant isolation violations




  - Create logging utilities for tenant isolation events
  - Log all cross-tenant access attempts with user ID, resource ID, and timestamp
  - Log all query execution failures due to missing tenant context
  - Implement audit trail for tenant isolation violations
  - _Requirements: 4.1, 4.2, 4.3, 4.4_

- [ ]* 8.1 Write property test for cross-tenant access prevention
  - **Property 9: Cross-Tenant Access Prevention**
  - **Validates: Requirements 4.2, 4.4**

- [x] 9. Update existing routes to use tenant context



  - Review existing routes in `client/backend/src/routes/` to ensure they use BaseController/BaseService
  - Verify that tenant isolation is automatically applied without code changes
  - Test that existing routes work correctly with tenant filtering
  - Document any routes that need manual tenant_id handling
  - _Requirements: 5.1, 5.3_

- [ ]* 9.1 Write property test for backward compatibility
  - **Property 10: Backward Compatibility**
  - **Validates: Requirements 5.1**

- [x] 10. Create tenant isolation integration tests



  - Create comprehensive integration tests covering the complete flow
  - Test login flow: user logs in → tenant_id extracted → JWT created
  - Test query flow: request arrives → tenant context restored → query filtered
  - Test error flow: invalid tenant context → appropriate error response
  - Test cross-tenant prevention: attempt to access another tenant's data → 403 response
  - _Requirements: 1.1, 1.2, 1.3, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 4.4_

- [x] 11. Checkpoint - Ensure all tests pass




  - Ensure all tests pass, ask the user if questions arise.
-

- [x] 12. Export tenant isolation utilities from API framework



  - Update `framework/backend/api/middleware/index.ts` to export tenant context middleware
  - Update `framework/backend/api/utils/index.ts` to export tenant utilities
  - Update `framework/backend/api/index.ts` to export all tenant isolation components
  - Ensure utilities are available for use in other projects
  - _Requirements: 3.1, 3.2, 3.3, 5.2_


- [x] 13. Final Checkpoint - Ensure all tests pass



  - Ensure all tests pass, ask the user if questions arise.

