# Design Document

## Overview

This design outlines the migration of frontend entity forms from static schema definitions to dynamic schema loading. The migration will eliminate duplicate schema definitions between frontend and backend, establishing the backend as the single source of truth for all entity schemas.

The system already has the infrastructure in place:
- Backend schema API at `/api/schema/:entity`
- `useSchema()` hook for loading schemas
- `UserFormDynamic.tsx` as a working reference implementation (will be renamed to `UserForm.tsx`)

This design focuses on replicating the User entity pattern for Location, Meter, Contact, and Device entities. All forms will use standard naming (e.g., `LocationForm.tsx`, `MeterForm.tsx`) without a "Dynamic" suffix since dynamic schema loading will be the standard approach.

## Architecture

### Current Architecture (Static Schemas)
```
Frontend Config Files (locationConfig.ts, meterConfig.ts, etc.)
  ├── Schema Definitions (DUPLICATE)
  ├── List Configuration (columns, filters, stats)
  └── Form Components (use static schemas)

Backend Models (LocationWithSchema.js, MeterWithSchema.js, etc.)
  └── Schema Definitions (SOURCE OF TRUTH)
```

### Target Architecture (Dynamic Schemas)
```
Backend Models (LocationWithSchema.js, MeterWithSchema.js, etc.)
  └── Schema Definitions (SINGLE SOURCE OF TRUTH)
       ↓
Backend Schema API (/api/schema/:entity)
       ↓
Frontend useSchema() Hook (with caching)
       ↓
Form Components (LocationForm.tsx, MeterForm.tsx, etc.)

Frontend Config Files (locationConfig.ts, meterConfig.ts, etc.)
  └── List Configuration ONLY (columns, filters, stats)
```

## Components and Interfaces

### 1. Form Components

Each entity will have a form component following the `UserFormDynamic.tsx` pattern (which will be renamed to `UserForm.tsx`):

**LocationForm.tsx**
```typescript
interface LocationFormProps {
  location?: Location;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
```

**MeterForm.tsx**
```typescript
interface MeterFormProps {
  meter?: Meter;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
```

**ContactForm.tsx**
```typescript
interface ContactFormProps {
  contact?: Contact;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
```

**DeviceForm.tsx**
```typescript
interface DeviceFormProps {
  device?: Device;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}
```

### 2. Schema Loading Flow

```
1. Component mounts
   ↓
2. useSchema('entityName') hook called
   ↓
3. Check cache (5 minute TTL)
   ├─ Cache hit → Return cached schema
   └─ Cache miss → Fetch from API
       ↓
4. GET /api/schema/:entity
   ↓
5. Backend returns schema JSON
   ↓
6. Schema cached and returned
   ↓
7. Form renders fields dynamically
```

### 3. Config File Refactoring

Remove schema definitions from config files, keep only list configuration:

**Before (locationConfig.ts):**
```typescript
export const locationSchema = defineEntitySchema({
  formFields: { ... },  // REMOVE THIS
  entityFields: { ... }, // REMOVE THIS
});

export const locationColumns = [ ... ]; // KEEP THIS
export const locationFilters = [ ... ]; // KEEP THIS
export const locationStats = [ ... ];   // KEEP THIS
```

**After (locationConfig.ts):**
```typescript
// Schema removed - loaded dynamically from backend

export const locationColumns = [ ... ]; // KEPT
export const locationFilters = [ ... ]; // KEPT
export const locationStats = [ ... ];   // KEPT
```

## Data Models

### Backend Schema Structure (Already Exists)
```javascript
{
  entityName: "Location",
  tableName: "location",
  description: "Location entity description",
  formFields: {
    name: {
      type: "string",
      default: "",
      required: true,
      label: "Location Name",
      // ... validation rules
    },
    // ... more fields
  },
  entityFields: {
    id: { type: "string", readOnly: true },
    createdAt: { type: "date", readOnly: true },
    // ... more fields
  },
  relationships: { ... },
  validation: { ... }
}
```

### Frontend Schema Format (Converted by useSchema)
```typescript
{
  formFields: Record<string, FieldDefinition>,
  entityFields: Record<string, FieldDefinition>,
  entityName: string,
  description: string,
  relationships: Record<string, any>
}
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Schema Loading Consistency
*For any* entity with a backend schema definition, loading the schema via `useSchema(entityName)` should return the same field definitions as defined in the backend model
**Validates: Requirements 1.1, 1.2, 1.3, 1.4**

### Property 2: Cache Effectiveness
*For any* schema loaded within the 5-minute TTL window, subsequent calls to `useSchema(entityName)` should return the cached schema without making additional API calls
**Validates: Requirements 1.5**

### Property 3: Schema Elimination
*For any* migrated entity config file, the file should not contain `defineEntitySchema` or `field()` calls for form/entity field definitions
**Validates: Requirements 2.1, 2.2, 2.3, 2.4**

### Property 4: List Configuration Preservation
*For any* migrated entity config file, the file should still export columns, filters, stats, bulkActions, and exportConfig
**Validates: Requirements 2.5**

### Property 5: Component Interface Compatibility
*For any* dynamic form component, the props interface should be compatible with the previous static form component's interface
**Validates: Requirements 5.1**

### Property 6: Form Rendering Completeness
*For any* entity schema with N form fields, the dynamic form should render N input fields (excluding read-only fields)
**Validates: Requirements 3.4**

### Property 7: Loading State Display
*For any* dynamic form during schema loading, the component should display a loading indicator until the schema is successfully loaded or an error occurs
**Validates: Requirements 4.1, 4.3**

### Property 8: Error State Display
*For any* dynamic form where schema loading fails, the component should display an error message containing the failure reason
**Validates: Requirements 4.2**

## Error Handling

### Schema Loading Errors

**Error Scenarios:**
1. Network failure during schema fetch
2. Backend returns 404 (schema not found)
3. Backend returns 500 (server error)
4. Invalid schema format returned
5. Schema validation fails

**Handling Strategy:**
```typescript
try {
  const schema = await useSchema('entity');
} catch (error) {
  // Display user-friendly error message
  // Log error for debugging
  // Provide retry option
  // Fall back to cached schema if available
}
```

### Form Validation Errors

**Error Scenarios:**
1. Required field missing
2. Field value doesn't match type
3. Field value violates validation rules (min/max, pattern, etc.)
4. Backend rejects data

**Handling Strategy:**
- Display inline field errors
- Prevent form submission until valid
- Show backend validation errors
- Maintain form state on error

## Testing Strategy

### Unit Tests

**Schema Loading Tests:**
- Test `useSchema()` hook with valid entity names
- Test cache hit/miss scenarios
- Test error handling for invalid entities
- Test schema conversion from backend format

**Form Rendering Tests:**
- Test dynamic field rendering for each entity
- Test form submission with valid data
- Test form validation
- Test loading and error states

**Config File Tests:**
- Verify schema definitions are removed
- Verify list configuration is preserved
- Verify exports are correct

### Integration Tests

**End-to-End Form Tests:**
- Test creating a new entity via dynamic form
- Test editing an existing entity via dynamic form
- Test form cancellation
- Test form with backend validation errors

**Schema API Tests:**
- Test `/api/schema/:entity` endpoint for each entity
- Test schema caching behavior
- Test schema format consistency

### Property-Based Tests

**Property 1 Test: Schema Loading Consistency**
```typescript
// For any entity with a backend schema
property('schema loading returns consistent fields', 
  forAll(entityName, async (name) => {
    const schema = await loadSchema(name);
    const backendSchema = await fetchBackendSchema(name);
    return schemasMatch(schema, backendSchema);
  })
);
```

**Property 2 Test: Cache Effectiveness**
```typescript
// For any schema loaded within TTL
property('cached schemas avoid API calls',
  forAll(entityName, async (name) => {
    const apiCallsBefore = getApiCallCount();
    await loadSchema(name); // First call
    await loadSchema(name); // Second call (should use cache)
    const apiCallsAfter = getApiCallCount();
    return apiCallsAfter === apiCallsBefore + 1; // Only one API call
  })
);
```

**Property 3 Test: Schema Elimination**
```typescript
// For any migrated config file
property('config files have no schema definitions',
  forAll(configFile, (file) => {
    const content = readFile(file);
    return !content.includes('defineEntitySchema') &&
           !content.includes('field({');
  })
);
```

## Implementation Plan

### Phase 1: Rename User Form
1. Rename `UserFormDynamic.tsx` to `UserForm.tsx`
2. Update all imports to use new name
3. Test User CRUD operations still work

### Phase 2: Location Entity Migration
1. Create `LocationForm.tsx` based on `UserForm.tsx`
2. Update `locationConfig.ts` to remove schema definitions
3. Update Location pages/components to use new form
4. Test Location CRUD operations
5. Verify list functionality still works

### Phase 3: Meter Entity Migration
1. Create `MeterForm.tsx`
2. Update `meterConfig.ts` to remove schema definitions
3. Update Meter pages/components to use new form
4. Test Meter CRUD operations
5. Verify list functionality still works

### Phase 4: Contact Entity Migration
1. Create `ContactForm.tsx`
2. Update `contactConfig.ts` to remove schema definitions
3. Update Contact pages/components to use new form
4. Test Contact CRUD operations
5. Verify list functionality still works

### Phase 5: Device Entity Migration
1. Create `DeviceForm.tsx`
2. Update `deviceConfig.ts` to remove schema definitions
3. Update Device pages/components to use new form
4. Test Device CRUD operations
5. Verify list functionality still works

### Phase 6: Documentation and Cleanup
1. Create developer guide for dynamic schema loading
2. Document schema API endpoints
3. Add code examples and best practices
4. Move old static form components to backup folder
5. Update README with new architecture

## Migration Checklist

For each entity:
- [ ] Create `{Entity}Form.tsx` component (or rename if exists)
- [ ] Remove schema from `{entity}Config.ts`
- [ ] Update pages to use new form
- [ ] Test create operation
- [ ] Test edit operation
- [ ] Test validation
- [ ] Test error handling
- [ ] Verify list still works
- [ ] Verify filters still work
- [ ] Verify bulk actions still work
- [ ] Run all tests
- [ ] Update documentation

## Rollback Strategy

If issues arise during migration:

1. **Per-Entity Rollback:** Keep old static forms in backup folder, can revert individual entities
2. **Config Rollback:** Git history preserves old config files with schemas
3. **Gradual Migration:** Migrate one entity at a time, can pause if issues found
4. **Feature Flag:** Could add feature flag to toggle between static/dynamic forms

## Performance Considerations

### Schema Caching
- 5-minute TTL reduces API calls
- Cache stored in memory (Map)
- Cache cleared on page refresh
- Consider localStorage for persistence

### Bundle Size
- Dynamic forms reduce bundle size (no duplicate schemas)
- Schema loaded on-demand
- Smaller initial page load

### Rendering Performance
- Dynamic field rendering has minimal overhead
- React memoization prevents unnecessary re-renders
- Form state managed efficiently by hooks

## Security Considerations

### Schema API Access
- Schema endpoint should be authenticated
- Only expose necessary schema information
- Don't expose sensitive backend implementation details

### Data Validation
- Frontend validation is convenience only
- Backend must validate all data
- Don't trust client-side schema modifications

## Future Enhancements

1. **Schema Versioning:** Track schema versions for compatibility
2. **Schema Diff:** Show what changed between schema versions
3. **Schema Preloading:** Prefetch schemas on app startup
4. **Offline Support:** Cache schemas in localStorage
5. **Schema Editor:** Admin UI for modifying schemas
6. **Type Generation:** Auto-generate TypeScript types from schemas
