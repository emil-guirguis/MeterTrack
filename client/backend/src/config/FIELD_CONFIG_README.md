# Meter Field Configuration - Single Source of Truth

## Overview

All meter field definitions are now centralized in `meterFieldConfig.js`. This eliminates duplication across backend and frontend code.

## Files Using This Configuration

### Backend
- **`MeterWithSchema.js`** - Model definition
  - Imports: `getFormFields()`, `getEntityFields()`, `VALIDATION_RULES`
  - Uses these to build the schema dynamically

- **`meters.js`** - Route handlers
  - Imports: `SORT_KEY_MAP`
  - Uses for sorting and filtering queries

### Frontend
- **`meterConfig.ts`** - TypeScript types and UI configuration
  - Can import the schema via API endpoint
  - Or manually sync types from backend config

## Configuration Structure

### METER_FIELDS
Master object containing all field definitions with:
- `type` - FieldTypes enum value
- `dbField` - Database column name (null for computed fields)
- `readOnly` - Whether field is editable
- `label` - Display label
- `required` - Whether field is required
- `enumValues` - Valid enum values
- Other validation rules (min, max, pattern, etc.)

### Helper Functions
- `getFormFields()` - Returns only editable fields
- `getEntityFields()` - Returns only read-only system fields
- `getDbColumn(fieldName)` - Maps frontend field to DB column
- `getFieldConfig(fieldName)` - Gets config for a specific field

### SORT_KEY_MAP
Maps frontend sort keys to database column names for API queries.

### VALIDATION_RULES
Custom validation logic for the entity.

## Adding New Fields

1. Add entry to `METER_FIELDS` in `meterFieldConfig.js`
2. Specify `dbField` if it maps to a database column
3. Set `readOnly: true` for system-managed fields
4. The schema will automatically include it

Example:
```javascript
newField: {
  type: FieldTypes.STRING,
  dbField: 'new_field_column',
  required: false,
  label: 'New Field',
  maxLength: 100,
}
```

## Modifying Field Definitions

Changes to `meterFieldConfig.js` automatically propagate to:
- Backend model schema
- Backend route validation
- Frontend type definitions (via API)

No need to update multiple files!

## Benefits

✅ Single source of truth for all field definitions
✅ Eliminates duplication across backend/frontend
✅ Easier to maintain and update fields
✅ Consistent validation across the stack
✅ Type-safe field mappings
