# Debugging: Tenant ID Flow Through Authentication

## Overview
Added comprehensive debugging to trace the exact flow of `tenant_id` from database to token generation.

## Debugging Points Added

### 1. **Auth Route** (`client/backend/src/routes/auth.js`)
- **Step 1**: Log when finding user by email
- **Step 2**: Log user object after retrieval with all properties
- **Step 3**: Log password validation result
- **Step 4**: Log user active status check
- **Step 5**: Log tenant_id value before token generation
- **Step 6**: Log token generation with tenant_id

**What to look for:**
```
[AUTH LOGIN] User tenant_id: <value>
[AUTH LOGIN] User tenant_id type: <type>
[AUTH LOGIN] User tenant_id is null? <boolean>
[AUTH LOGIN] User tenant_id is undefined? <boolean>
[AUTH LOGIN] Token payload will contain: userId: <id>, tenant_id: <tenant_id>
```

### 2. **User Model** (`client/backend/src/models/UserWithSchema.js`)
- **findByEmail()**: Logs user object keys and data after retrieval

**What to look for:**
```
[USER MODEL] findByEmail called with email: <email>
[USER MODEL] ✓ User found by email
[USER MODEL] User object keys: [...]
[USER MODEL] User data: { id, email, name, role, tenant_id, active }
```

### 3. **BaseModel.findOne()** (`framework/backend/api/base/BaseModel.js`)
- **Before query**: Logs the SELECT SQL statement and parameters
- **After query**: Logs the database result rows and their keys
- **Before deserialization**: Logs the raw row data
- **After deserialization**: Logs the instance data

**What to look for:**
```
█ [BASEMODEL] findOne - SQL STATEMENT
SQL: SELECT users.* FROM users WHERE users.email = $1 LIMIT 1
Values: ["admin@example.com"]

█ [BASEMODEL] findOne - QUERY RESULT
Rows returned: 1
First row keys: [id, email, name, role, tenant_id, active, ...]
First row data: { id: 1, email: "...", tenant_id: 1, ... }

█ [BASEMODEL] findOne - BEFORE _mapResultToInstance
Row to map: { id: 1, email: "...", tenant_id: 1, ... }

█ [BASEMODEL] findOne - AFTER _mapResultToInstance
Instance data: { id: 1, email: "...", tenant_id: 1, ... }
```

### 4. **BaseModel._mapResultToInstance()** (`framework/backend/api/base/BaseModel.js`)
- Logs row keys and data before deserialization
- Logs fields metadata
- Logs deserialized row data

**What to look for:**
```
█ [BASEMODEL] _mapResultToInstance - START
Row keys: [id, email, name, role, tenant_id, active, ...]
Row data: { id: 1, email: "...", tenant_id: 1, ... }
Fields available: [
  { name: 'id', dbField: 'id', type: 'number' },
  { name: 'tenant_id', dbField: 'tenant_id', type: 'number' },
  ...
]
After deserializeRow:
Deserialized keys: [id, email, name, role, tenant_id, active, ...]
Deserialized data: { id: 1, email: "...", tenant_id: 1, ... }
```

### 5. **deserializeRow()** (`framework/backend/shared/utils/typeHandlers.js`)
- Logs row keys and data
- Logs field metadata and maps
- Logs each field lookup (by name, then by dbField)
- Logs final deserialized object

**What to look for:**
```
█ [TYPEHANDLERS] deserializeRow - START
Row keys: [id, email, name, role, tenant_id, active, ...]
Row data: { id: 1, email: "...", tenant_id: 1, ... }

Field maps created:
fieldMapByName keys: [id, email, name, role, tenant_id, active, ...]
fieldMapByDbField keys: [id, email, name, role, tenant_id, active, ...]

Processing row key: "tenant_id" with value: 1
  - Lookup by name ("tenant_id"): FOUND
  - ✓ Mapped to property: "tenant_id" with deserialized value: 1

Final deserialized object:
Keys: [id, email, name, role, tenant_id, active, ...]
Data: { id: 1, email: "...", tenant_id: 1, ... }
```

### 6. **initializeFromData()** (`framework/backend/api/base/SchemaDefinition.js`)
- Logs form fields and entity fields to initialize
- Logs each field initialization with data lookup
- Logs final instance state

**What to look for:**
```
█ [SCHEMA] initializeFromData - START
Data keys: [id, email, name, role, tenant_id, active, ...]

Entity fields to initialize:
  - id (dbField: id)
  - tenant_id (dbField: tenant_id)
  - ...

--- Initializing ENTITY FIELDS ---

Entity field: tenant_id (dbField: tenant_id)
  data[dbField] = data["tenant_id"] = 1
  data[fieldName] = data["tenant_id"] = 1
  fieldDef.default = null
  ✓ Set instance.tenant_id = 1 (from dbField)

--- FINAL INSTANCE STATE ---
Instance data: { id: 1, email: "...", tenant_id: 1, active: true }
```

## How to Use This Debugging

1. **Run the bootstrap endpoint** to create a user:
   ```bash
   POST /api/auth/bootstrap
   {
     "email": "admin@example.com",
     "password": "password123",
     "name": "Admin User"
   }
   ```

2. **Run the login endpoint** to authenticate:
   ```bash
   POST /api/auth/login
   {
     "email": "admin@example.com",
     "password": "password123"
   }
   ```

3. **Check the console output** for the debug logs in this order:
   - Auth route logs
   - User model logs
   - BaseModel.findOne logs
   - deserializeRow logs
   - initializeFromData logs

4. **Trace the tenant_id value** through each step:
   - Does it come from the database?
   - Is it properly deserialized?
   - Is it set on the instance?
   - Is it included in the token?

## Expected Flow

```
Database Row: { id: 1, tenant_id: 1, email: "admin@example.com", ... }
    ↓
deserializeRow: Maps tenant_id column to tenant_id property
    ↓
initializeFromData: Sets instance.tenant_id = 1
    ↓
Auth route: Reads user.tenant_id = 1
    ↓
generateToken: Creates JWT with { userId: 1, tenant_id: 1 }
    ↓
Response: { token: "...", user: { id: 1, client: 1, ... } }
```

## Troubleshooting

If `tenant_id` is null at any point:

1. **Check database**: Is `tenant_id` actually stored in the database?
   - Look for: `First row data: { ..., tenant_id: 1, ... }`

2. **Check deserialization**: Is the field metadata correct?
   - Look for: `Fields available: [..., { name: 'tenant_id', dbField: 'tenant_id', ... }, ...]`

3. **Check initialization**: Is the default value overriding the data?
   - Look for: `fieldDef.default = null` being used instead of the actual value

4. **Check schema**: Is `tenant_id` defined in entityFields?
   - Look for: `Entity fields to initialize: ... - tenant_id (dbField: tenant_id)`
