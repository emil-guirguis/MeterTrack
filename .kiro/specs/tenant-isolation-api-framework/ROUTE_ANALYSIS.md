# Route Analysis: Tenant Isolation Integration

## Overview

This document analyzes existing routes in `client/backend/src/routes/` to determine their current usage of BaseController/BaseService and identify what changes are needed for tenant isolation integration.

## Current Route Architecture

### Routes Reviewed

1. **users.js** - User management routes
2. **meters.js** - Meter management routes
3. **contacts.js** - Contact management routes
4. **location.js** - Location management routes

## Analysis Results

### 1. users.js

**Current Implementation:**
- Uses direct model methods (User.findAll, User.findById, User.create, etc.)
- Does NOT use BaseController or BaseService
- Implements custom pagination and filtering logic
- Uses express-validator for input validation

**Tenant Isolation Status:**
- ❌ NOT using BaseController/BaseService
- ❌ NO automatic tenant filtering
- ⚠️ REQUIRES MANUAL TENANT_ID HANDLING

**Required Changes:**
- Create UserService extending BaseService
- Create UserController extending BaseController
- Update routes to use controller methods
- Ensure tenant_id is passed through service calls
- Add tenant context validation

**Code Pattern:**
```javascript
// Current (direct model usage)
const users = await User.findAll({ where, order, limit, offset });

// Should be (via service with tenant isolation)
const result = await userService.findAll(options, tenantId);
```

---

### 2. meters.js

**Current Implementation:**
- Uses direct model methods (Meter.findAll, Meter.findById, Meter.create, etc.)
- Does NOT use BaseController or BaseService
- Implements custom pagination and filtering logic
- Uses express-validator for input validation
- Handles device resolution and relationship management

**Tenant Isolation Status:**
- ❌ NOT using BaseController/BaseService
- ❌ NO automatic tenant filtering
- ⚠️ REQUIRES MANUAL TENANT_ID HANDLING

**Required Changes:**
- Create MeterService extending BaseService
- Create MeterController extending BaseController
- Update routes to use controller methods
- Ensure tenant_id is passed through service calls
- Add tenant context validation
- Handle device resolution within service

**Code Pattern:**
```javascript
// Current (direct model usage)
const result = await Meter.findAll({ where, include, order, limit, offset });

// Should be (via service with tenant isolation)
const result = await meterService.findAll(options, tenantId);
```

---

### 3. contacts.js

**Current Implementation:**
- Uses direct model methods (Contact.findAll, Contact.findById, Contact.create, etc.)
- Does NOT use BaseController or BaseService
- Implements custom pagination and filtering logic
- Uses instance methods for update/delete

**Tenant Isolation Status:**
- ❌ NOT using BaseController/BaseService
- ❌ NO automatic tenant filtering
- ⚠️ REQUIRES MANUAL TENANT_ID HANDLING

**Required Changes:**
- Create ContactService extending BaseService
- Create ContactController extending BaseController
- Update routes to use controller methods
- Ensure tenant_id is passed through service calls
- Add tenant context validation

**Code Pattern:**
```javascript
// Current (direct model usage)
const result = await Contact.findAll(options);

// Should be (via service with tenant isolation)
const result = await contactService.findAll(options, tenantId);
```

---

### 4. location.js

**Current Implementation:**
- Uses direct model methods (Location.findAll, Location.findById, Location.create, etc.)
- Does NOT use BaseController or BaseService
- Implements custom pagination and filtering logic
- Uses express-validator for input validation
- Includes helper function for response mapping

**Tenant Isolation Status:**
- ❌ NOT using BaseController/BaseService
- ❌ NO automatic tenant filtering
- ⚠️ REQUIRES MANUAL TENANT_ID HANDLING

**Required Changes:**
- Create LocationService extending BaseService
- Create LocationController extending BaseController
- Update routes to use controller methods
- Ensure tenant_id is passed through service calls
- Add tenant context validation
- Maintain response mapping helper

**Code Pattern:**
```javascript
// Current (direct model usage)
const result = await Location.findAll({ where, order, limit, offset });

// Should be (via service with tenant isolation)
const result = await locationService.findAll(options, tenantId);
```

---

## Key Findings

### Current State
- **All reviewed routes use direct model methods**
- **None use BaseController or BaseService**
- **No automatic tenant filtering is applied**
- **Each route implements its own pagination and filtering logic**

### Tenant Isolation Impact
- **Without BaseService integration, tenant_id must be manually added to every query**
- **Risk of accidental cross-tenant data access if tenant_id is forgotten**
- **Inconsistent error handling across routes**

### Backward Compatibility
- **Existing routes will continue to work without modification**
- **However, they will NOT have automatic tenant isolation**
- **Manual tenant_id handling is required for each route**

---

## Implementation Strategy

### Phase 1: Service Layer Creation
1. Create UserService extending BaseService
2. Create MeterService extending BaseService
3. Create ContactService extending BaseService
4. Create LocationService extending BaseService

### Phase 2: Controller Layer Creation
1. Create UserController extending BaseController
2. Create MeterController extending BaseController
3. Create ContactController extending BaseController
4. Create LocationController extending BaseController

### Phase 3: Route Migration
1. Update users.js to use UserController
2. Update meters.js to use MeterController
3. Update contacts.js to use ContactController
4. Update location.js to use LocationController

### Phase 4: Tenant Context Integration
1. Extract tenant_id from request context in each route
2. Pass tenant_id to service methods
3. Verify tenant ownership for sensitive operations
4. Add comprehensive error handling

---

## Tenant Isolation Verification

### For Each Route, Verify:

✅ **Tenant Context Extraction**
- Tenant ID is extracted from req.context.tenant.id
- Tenant ID is validated before use

✅ **Query Filtering**
- All SELECT queries include tenant_id in WHERE clause
- All INSERT queries include tenant_id in data
- All UPDATE/DELETE queries include tenant_id in WHERE clause

✅ **Ownership Verification**
- Cross-tenant access attempts are rejected with 403
- Audit logs record all access attempts

✅ **Error Handling**
- Missing tenant context returns 401 Unauthorized
- Invalid tenant context returns 400 Bad Request
- Cross-tenant access returns 403 Forbidden

---

## Testing Recommendations

### Unit Tests
- Test that service methods include tenant_id in queries
- Test that controller methods validate tenant context
- Test that ownership verification works correctly

### Integration Tests
- Test complete flow: login → tenant context → query filtering
- Test cross-tenant access prevention
- Test error responses for missing/invalid tenant context

### Property-Based Tests
- Property 10: Backward Compatibility
  - For any existing route using BaseService, tenant isolation works automatically

---

## Documentation

### Routes Requiring Manual Tenant_ID Handling

The following routes currently do NOT use BaseController/BaseService and require manual tenant_id handling:

1. **users.js** - All endpoints
2. **meters.js** - All endpoints
3. **contacts.js** - All endpoints
4. **location.js** - All endpoints

### Routes Using BaseController/BaseService

Currently, NO routes in the codebase use BaseController/BaseService. All routes implement their own logic.

---

## Conclusion

**Current Status:** All reviewed routes use direct model methods and do NOT have automatic tenant isolation.

**Required Action:** Migrate routes to use BaseService/BaseController to enable automatic tenant isolation.

**Impact:** Once migrated, tenant_id will be automatically applied to all queries without requiring manual handling in each route.

**Timeline:** This is a significant refactoring that should be done incrementally, starting with one route at a time.

