# Design Document: Device Register Grid Loading Fix

## Overview

The device register grid fails to load because the backend API response contains an undefined `id` field. The SQL query selects `device_register_id`, `device_id`, and `register_id`, but the response mapping tries to access `row.id` which doesn't exist.

## Root Cause

In `client/backend/src/routes/deviceRegister.js` line 45:
```javascript
const data = registers.rows.map((row) => ({
  id: row.id,  // ❌ row.id is undefined - query doesn't select 'id'
  register_id: row.register_id,
  device_id: row.device_id,
  register: { ... }
}));
```

The SQL query (lines 33-37) selects:
- `dr.device_register_id`
- `dr.device_id`
- `dr.register_id`
- `r.register`, `r.name`, `r.unit`, `r.field_name`

But the response mapping references `row.id` which is never selected.

## Solution

Change the response mapping to use `device_register_id` as the unique identifier:

```javascript
const data = registers.rows.map((row) => ({
  id: row.device_register_id,  // ✅ Use device_register_id as the unique identifier
  register_id: row.register_id,
  device_id: row.device_id,
  register: {
    id: row.device_register_id,
    register: row.register,
    name: row.name,
    unit: row.unit,
    field_name: row.field_name,
  },
}));
```

## Impact

- **Frontend**: RegistersGrid will receive valid `id` values and render the datagrid correctly
- **Backend**: API response will have consistent structure with valid identifiers
- **User Experience**: Device register tab will load and display registers as expected

## Testing Strategy

1. Verify API returns valid `id` values (not undefined)
2. Verify datagrid renders with correct number of rows
3. Verify all register fields display correctly (register, name, unit, field_name)
4. Verify read-only mode works (no edit/delete operations)
