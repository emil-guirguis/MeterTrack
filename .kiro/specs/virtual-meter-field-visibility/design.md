# Design Document: Virtual Meter Field Visibility

## Overview

This design extends the existing conditional tab display feature to support field-level and section-level visibility filtering. Fields and sections can now be marked with a `visibleFor` property that specifies which meter types should display them.

## Architecture

### 1. Schema Definition Changes

Fields and sections in the schema now support an optional `visibleFor` property:

```typescript
interface FieldRef {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];  // NEW
}

interface Section {
  name: string;
  order?: number | null;
  visibleFor?: ('physical' | 'virtual')[];  // NEW
  fields: FieldRef[];
  minWidth?: string | null;
  maxWidth?: string | null;
}
```

### 2. useFormTabs Hook Enhancement

The `useFormTabs` hook now filters sections and fields based on the `visibleFor` property and the provided `meterType`:

**Filtering Logic:**
- If `visibleFor` is not specified, the element is visible for all meter types (backward compatible)
- If `visibleFor` is specified and `meterType` is provided, only include the element if `meterType` matches
- If `meterType` is null or undefined, include all elements (default behavior)

**Processing Flow:**
1. Filter tabs based on `visibleFor` and `meterType`
2. For each tab, filter sections based on `visibleFor` and `meterType`
3. For each section, filter fields based on `visibleFor` and `meterType`
4. Return organized tabs with filtered sections and fields

### 3. MeterWithSchema Updates

The meter schema is updated to mark device-related fields and sections as only visible for physical meters:

```javascript
// Serial Number field
field({
  name: 'serial_number',
  // ... other properties
  visibleFor: ['physical'],
})

// Device field
field({
  name: 'device_id',
  // ... other properties
  visibleFor: ['physical'],
})

// Network section
section({
  name: 'Network',
  order: 2,
  visibleFor: ['physical'],  // NEW
  fields: [
    // IP and Port fields
  ],
})
```

### 4. Form Rendering Flow

When rendering a meter form:

1. **MeterForm** determines the meter type from the meter object or meterType prop
2. **MeterForm** passes `meterType` to **BaseForm**
3. **BaseForm** passes `meterType` to **useFormTabs** hook
4. **useFormTabs** filters tabs, sections, and fields based on `visibleFor` and `meterType`
5. **BaseForm** renders only the visible fields and sections

## Data Flow

```
MeterForm (determines meterType)
    ↓
BaseForm (receives meterType prop)
    ↓
useFormTabs (filters based on meterType)
    ↓
Filtered tabs/sections/fields
    ↓
Form rendering (only visible elements)
```

## Implementation Details

### useFormTabs Hook Changes

The hook now includes filtering logic for sections and fields:

```typescript
// Filter sections based on visibleFor property and meterType
if (section.visibleFor && section.visibleFor.length > 0) {
  if (meterType !== null && meterType !== undefined) {
    if (!section.visibleFor.includes(meterType)) {
      return; // Skip this section
    }
  }
}

// Filter fields based on visibleFor property and meterType
if (fieldRef.visibleFor && fieldRef.visibleFor.length > 0) {
  if (meterType !== null && meterType !== undefined) {
    if (!fieldRef.visibleFor.includes(meterType)) {
      return; // Skip this field
    }
  }
}
```

### MeterWithSchema Changes

The meter schema is updated to include `visibleFor` properties:

- **Serial Number**: `visibleFor: ['physical']`
- **Device**: `visibleFor: ['physical']`
- **Network section**: `visibleFor: ['physical']`
- **Name, Location, Status**: No `visibleFor` (visible for all types)

## Backward Compatibility

- Fields and sections without `visibleFor` are visible for all meter types
- Existing schemas continue to work without modification
- When `meterType` is not provided, all fields and sections are displayed

## Testing Strategy

### Unit Tests
- Test field filtering with different `visibleFor` values
- Test section filtering with different `visibleFor` values
- Test backward compatibility (no `visibleFor` property)
- Test with `meterType` = null/undefined

### Integration Tests
- Test virtual meter form rendering (should hide device fields)
- Test physical meter form rendering (should show device fields)
- Test switching between meter types

### Property-Based Tests
- For any meter type and field configuration, the correct fields are visible
- For any meter type and section configuration, the correct sections are visible
- Backward compatibility is maintained for schemas without `visibleFor`

## Correctness Properties

**Property 1: Virtual Meter Field Visibility**
- **Validates: Requirement 1, 2, 3**
- For a virtual meter, the Network section, Serial Number field, and Device field SHALL NOT be visible
- For a virtual meter, the Name, Location, and Status fields SHALL be visible

**Property 2: Physical Meter Field Visibility**
- **Validates: Requirement 1, 2, 3**
- For a physical meter, the Network section, Serial Number field, and Device field SHALL be visible
- For a physical meter, all fields in the Information and Network sections SHALL be visible

**Property 3: Field Filtering Logic**
- **Validates: Requirement 6**
- For any field with `visibleFor: ['physical']` and `meterType='virtual'`, the field SHALL be filtered out
- For any field with `visibleFor: ['physical']` and `meterType='physical'`, the field SHALL be included
- For any field without `visibleFor`, the field SHALL be included regardless of `meterType`

**Property 4: Section Filtering Logic**
- **Validates: Requirement 6**
- For any section with `visibleFor: ['physical']` and `meterType='virtual'`, the section and all its fields SHALL be filtered out
- For any section with `visibleFor: ['physical']` and `meterType='physical'`, the section and all its fields SHALL be included
- For any section without `visibleFor`, the section SHALL be included regardless of `meterType`

**Property 5: Backward Compatibility**
- **Validates: Requirement 8**
- For any schema without `visibleFor` properties, the form behavior SHALL remain unchanged
- For any `meterType=null` or `meterType=undefined`, all fields and sections SHALL be displayed
