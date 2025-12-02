# Route Migration Guide: Implementing Tenant Isolation

## Overview

This guide provides step-by-step instructions for migrating existing routes to use BaseService/BaseController with automatic tenant isolation.

---

## Migration Pattern

### Step 1: Create Service Class

Create a new service file that extends BaseService:

```javascript
// client/backend/src/services/UserService.js
const BaseService = require('../../../framework/backend/api/base/BaseService');
const User = require('../models/UserWithSchema');

class UserService extends BaseService {
  constructor() {
    super({
      model: User,
      searchFields: ['name', 'email'],
      defaultIncludes: [],
      tenantIdField: 'tenant_id'
    });
  }

  // Add custom business logic here if needed
  async findByEmail(email, tenantId) {
    return this.findOne({ email }, {}, tenantId);
  }
}

module.exports = new UserService();
```

### Step 2: Create Controller Class

Create a new controller file that extends BaseController:

```javascript
// client/backend/src/controllers/UserController.js
const BaseController = require('../../../framework/backend/api/base/BaseController');
const userService = require('../services/UserService');

class UserController extends BaseController {
  constructor() {
    super({
      service: userService,
      searchFields: ['name', 'email']
    });
  }

  // Add custom route handlers here if needed
}

module.exports = new UserController();
```

### Step 3: Update Route File

Update the route file to use the controller:

```javascript
// client/backend/src/routes/users.js
const express = require('express');
const { authenticateToken, requirePermission } = require('../middleware/auth');
const userController = require('../controllers/UserController');

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// Get all users with pagination and filtering
router.get('/', requirePermission('user:read'), (req, res) => {
  const tenantId = req.context?.tenant?.id;
  return userController.list(req, res);
});

// Get user by ID
router.get('/:id', requirePermission('user:read'), (req, res) => {
  return userController.get(req, res);
});

// Create new user
router.post('/', requirePermission('user:create'), (req, res) => {
  return userController.create(req, res);
});

// Update user
router.put('/:id', requirePermission('user:update'), (req, res) => {
  return userController.update(req, res);
});

// Delete user
router.delete('/:id', requirePermission('user:delete'), (req, res) => {
  return userController.delete(req, res);
});

module.exports = router;
```

---

## Key Considerations

### 1. Tenant Context Extraction

The tenant_id is automatically extracted from `req.context.tenant.id` by the BaseService:

```javascript
// In BaseService.findAll()
const tenantId = req.context?.tenant?.id;
const result = await this.findAll(options, tenantId);
```

### 2. Custom Business Logic

If a route has custom business logic, add it to the service:

```javascript
// UserService.js
async findByEmail(email, tenantId) {
  return this.findOne({ email }, {}, tenantId);
}

// UserController.js
async findByEmail(req, res) {
  try {
    const { email } = req.query;
    const tenantId = req.context?.tenant?.id;
    const result = await this.service.findByEmail(email, tenantId);
    
    if (!result.success) {
      return this.sendError(res, result.error, 404);
    }
    
    this.sendSuccess(res, result.data);
  } catch (error) {
    this.logger.error('Error in findByEmail:', error);
    this.sendError(res, error.message, 500);
  }
}

// users.js
router.get('/by-email', requirePermission('user:read'), (req, res) => {
  return userController.findByEmail(req, res);
});
```

### 3. Response Mapping

If a route needs to map responses to a different format, do it in the controller:

```javascript
// LocationController.js
async list(req, res) {
  try {
    const options = this.extractListOptions(req);
    const tenantId = req.context?.tenant?.id;
    const result = await this.service.findAll(options, tenantId);

    if (!result.success) {
      return this.sendError(res, result.error, 500);
    }

    // Map response format
    const mappedData = result.data.map(item => mapLocationToResponse(item));
    this.sendPaginated(res, mappedData, result.pagination);
  } catch (error) {
    this.logger.error('Error in list:', error);
    this.sendError(res, error.message, 500);
  }
}
```

### 4. Validation

Use express-validator middleware before controller methods:

```javascript
// users.js
router.post('/', [
  body('name').notEmpty().trim().withMessage('Name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 4 }).withMessage('Password must be at least 4 characters')
], requirePermission('user:create'), (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  
  return userController.create(req, res);
});
```

---

## Migration Checklist

### Before Migration
- [ ] Review current route implementation
- [ ] Identify custom business logic
- [ ] Identify response mapping requirements
- [ ] Identify validation requirements

### During Migration
- [ ] Create service class extending BaseService
- [ ] Create controller class extending BaseController
- [ ] Update route file to use controller
- [ ] Preserve custom business logic in service
- [ ] Preserve response mapping in controller
- [ ] Preserve validation in route

### After Migration
- [ ] Test all endpoints with valid tenant context
- [ ] Test cross-tenant access prevention
- [ ] Test error responses
- [ ] Verify pagination and filtering work
- [ ] Verify response format matches original
- [ ] Run integration tests

---

## Common Patterns

### Pattern 1: Simple CRUD Route

```javascript
// Service
class UserService extends BaseService {
  constructor() {
    super({ model: User, searchFields: ['name', 'email'] });
  }
}

// Controller
class UserController extends BaseController {
  constructor() {
    super({ service: userService, searchFields: ['name', 'email'] });
  }
}

// Route
router.get('/', (req, res) => userController.list(req, res));
router.get('/:id', (req, res) => userController.get(req, res));
router.post('/', (req, res) => userController.create(req, res));
router.put('/:id', (req, res) => userController.update(req, res));
router.delete('/:id', (req, res) => userController.delete(req, res));
```

### Pattern 2: Route with Custom Business Logic

```javascript
// Service
class MeterService extends BaseService {
  constructor() {
    super({ model: Meter, searchFields: ['meterid', 'serial_number'] });
  }

  async resolveDevice(deviceName, deviceDescription) {
    // Custom device resolution logic
  }
}

// Controller
class MeterController extends BaseController {
  constructor() {
    super({ service: meterService });
  }

  async create(req, res) {
    try {
      // Custom validation
      const { device, model } = req.body;
      const deviceId = await this.service.resolveDevice(device, model);
      
      // Call parent create with modified data
      req.body.device_id = deviceId;
      return super.create(req, res);
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }
}

// Route
router.post('/', (req, res) => meterController.create(req, res));
```

### Pattern 3: Route with Response Mapping

```javascript
// Controller
class LocationController extends BaseController {
  constructor() {
    super({ service: locationService });
  }

  async list(req, res) {
    try {
      const options = this.extractListOptions(req);
      const tenantId = req.context?.tenant?.id;
      const result = await this.service.findAll(options, tenantId);

      if (!result.success) {
        return this.sendError(res, result.error, 500);
      }

      // Map response format
      const mappedData = result.data.map(item => ({
        id: item.id,
        name: item.name,
        address: {
          street: item.street,
          city: item.city,
          state: item.state,
          zipCode: item.zip
        }
      }));

      this.sendPaginated(res, mappedData, result.pagination);
    } catch (error) {
      this.sendError(res, error.message, 500);
    }
  }
}
```

---

## Tenant Isolation Verification

After migration, verify tenant isolation works:

### Test 1: Tenant Context Extraction
```bash
# Login as user from tenant-1
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@tenant1.com","password":"password"}'

# Response should include JWT with tenant_id
# {
#   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
#   "user": { "id": "user-1", "tenant_id": "tenant-1" }
# }
```

### Test 2: Query Filtering
```bash
# Request with valid tenant context
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <token>"

# Should only return users from tenant-1
# {
#   "success": true,
#   "data": [
#     { "id": "user-1", "name": "User 1", "tenant_id": "tenant-1" }
#   ]
# }
```

### Test 3: Cross-Tenant Access Prevention
```bash
# Try to access user from different tenant
curl -X GET http://localhost:3000/api/users/user-2 \
  -H "Authorization: Bearer <token>"

# Should return 403 Forbidden
# {
#   "success": false,
#   "error": "Access denied",
#   "statusCode": 403
# }
```

### Test 4: Missing Tenant Context
```bash
# Request without tenant context
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer <invalid-token>"

# Should return 401 Unauthorized
# {
#   "success": false,
#   "error": "Tenant context not found",
#   "statusCode": 401
# }
```

---

## Troubleshooting

### Issue: Tenant ID not being passed to service

**Solution:** Ensure tenant context middleware is applied before routes:

```javascript
// server.js
app.use(authenticateToken);
app.use(tenantContext); // Must be after auth middleware
app.use('/api/users', userRoutes);
```

### Issue: Cross-tenant access not being prevented

**Solution:** Verify BaseService is using tenant_id in WHERE clause:

```javascript
// BaseService.findAll()
const where = this._mergeTenantFilter(filters, tenantId);
// Should result in: { ...filters, tenant_id: tenantId }
```

### Issue: Response format changed after migration

**Solution:** Add response mapping in controller:

```javascript
// Controller
async list(req, res) {
  const result = await this.service.findAll(options, tenantId);
  const mappedData = result.data.map(item => mapToFrontendFormat(item));
  this.sendPaginated(res, mappedData, result.pagination);
}
```

---

## Next Steps

1. Choose first route to migrate (recommend: users.js)
2. Create UserService extending BaseService
3. Create UserController extending BaseController
4. Update users.js to use UserController
5. Test thoroughly
6. Move to next route

