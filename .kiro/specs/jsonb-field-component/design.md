# Design Document: JSONB Field Component

## Overview

The JSONB Field Component is a reusable framework component that handles rendering and editing of JSONB (PostgreSQL binary JSON) data types in forms. It supports multiple data structures (nested objects, flat arrays, key-value pairs) and provides specialized rendering for common use cases like permissions. The component integrates with BaseForm and the schema system to provide consistent JSONB handling across the application.

## Architecture

```
BaseForm
  ↓
FormField (detects FieldTypes.JSON)
  ↓
JSONBField Component
  ├── JSONBNestedObjectRenderer (for nested objects)
  ├── JSONBArrayRenderer (for flat arrays)
  ├── JSONBKeyValueRenderer (for key-value pairs)
  └── JSONBPermissionsRenderer (specialized for permissions)
```

The component follows the existing FormField pattern and integrates with the schema validation system.

## Components and Interfaces

### JSONBField Component (Main)

**Location:** `framework/frontend/components/jsonbfield/JSONBField.tsx`

**Props:**
```typescript
interface JSONBFieldProps {
  name: string;
  label: string;
  value: any;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  description?: string;
  onChange: (value: any) => void;
  onBlur?: () => void;
  jsonbConfig?: JSONBConfig;
}

interface JSONBConfig {
  type: 'nested-object' | 'flat-array' | 'key-value' | 'permissions';
  groupBy?: string;
  itemLabel?: string;
  itemDescription?: string;
  allowAdd?: boolean;
  allowRemove?: boolean;
  allowEdit?: boolean;
  customValidator?: (value: any) => string | null;
  moduleOrder?: string[];
  moduleNames?: Record<string, string>;
  actionNames?: Record<string, string>;
}
```

**Responsibilities:**
- Deserialize JSONB data from backend format
- Route to appropriate renderer based on `jsonbConfig.type`
- Handle value changes and propagate to form
- Validate data before submission
- Serialize data for backend submission

### JSONBNestedObjectRenderer

**Location:** `framework/frontend/components/jsonbfield/renderers/JSONBNestedObjectRenderer.tsx`

Renders nested object structures with expandable sections.

**Features:**
- Display nested objects with collapsible sections
- Edit values inline
- Add/remove nested properties
- Validate nested structure

### JSONBArrayRenderer

**Location:** `framework/frontend/components/jsonbfield/renderers/JSONBArrayRenderer.tsx`

Renders flat array structures with add/remove controls.

**Features:**
- Display array items in a list
- Add new items
- Remove items
- Edit items inline
- Reorder items (optional)

### JSONBKeyValueRenderer

**Location:** `framework/frontend/components/jsonbfield/renderers/JSONBKeyValueRenderer.tsx`

Renders key-value pair structures.

**Features:**
- Display key-value pairs in a table
- Add new pairs
- Remove pairs
- Edit keys and values
- Validate key uniqueness

### JSONBPermissionsRenderer

**Location:** `framework/frontend/components/jsonbfield/renderers/JSONBPermissionsRenderer.tsx`

Specialized renderer for permissions with module grouping.

**Features:**
- Group permissions by module
- Display checkboxes for each permission
- Module section headers
- Consistent with existing permissions UI
- Convert between flat array and nested object formats

## Data Models

### JSONB Data Formats

**Nested Object Format:**
```typescript
{
  module: {
    action: boolean
  }
}
// Example:
{
  user: { create: true, read: true, update: false },
  meter: { read: true, create: false }
}
```

**Flat Array Format:**
```typescript
string[]
// Example:
['user:create', 'user:read', 'meter:read']
```

**Key-Value Format:**
```typescript
Record<string, any>
// Example:
{ theme: 'dark', language: 'en', timezone: 'UTC' }
```

### Serialization/Deserialization

**From Backend:**
- JSON string → Parse to object
- Object → Use directly
- Array → Use directly

**To Backend:**
- Object → JSON.stringify()
- Array → JSON.stringify()
- Maintain data integrity during conversion

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Deserialization Round Trip
*For any* JSONB data received from the backend (as string or object), deserializing and then serializing SHALL produce equivalent data.
**Validates: Requirements 6.1, 6.2, 6.3**

### Property 2: Format Conversion Consistency
*For any* JSONB data in one format, converting to another format and back SHALL preserve all data.
**Validates: Requirements 2.1, 2.2, 2.3**

### Property 3: Validation Enforcement
*For any* invalid JSONB data, the component SHALL reject it and display an error message.
**Validates: Requirements 5.1, 5.2, 5.3**

### Property 4: Permissions Grouping Correctness
*For any* flat array of permissions, grouping by module SHALL produce groups where all permissions in a group share the same module prefix.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 5: State Synchronization
*For any* change to JSONB data in the component, the form's state SHALL be updated to reflect that change.
**Validates: Requirements 1.4, 4.4**

## Error Handling

1. **Invalid JSON Format**: Display error message and prevent submission
2. **Deserialization Failure**: Log error, display user-friendly message
3. **Validation Failure**: Display validation error with specific details
4. **Missing Required Data**: Display error indicating required fields
5. **Type Mismatch**: Display error indicating expected vs. actual type

## Testing Strategy

### Unit Tests
- Test deserialization of various JSONB formats
- Test serialization back to backend format
- Test format conversion between types
- Test validation logic
- Test each renderer component independently
- Test error handling for invalid data

### Property-Based Tests
- **Property 1**: Generate random JSONB data, verify round-trip consistency
- **Property 2**: Generate random data in one format, verify conversion consistency
- **Property 3**: Generate invalid data, verify rejection and error display
- **Property 4**: Generate random permission arrays, verify correct grouping
- **Property 5**: Generate random state changes, verify form state updates

### Integration Tests
- Test JSONBField integration with BaseForm
- Test form submission with JSONB data
- Test form reload with saved JSONB data
- Test permissions renderer with real permission data
- Test validation with schema constraints

</content>
</invoke>