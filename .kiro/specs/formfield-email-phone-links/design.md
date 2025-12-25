# Design Document: Schema Field Type Mapping

## Overview

This design document outlines the implementation of automatic type mapping between backend schema field types and frontend FormField component types. When BaseForm auto-generates form fields from schema definitions, it must convert schema types (like `'phone'`, `'email'`, `'url'`) to corresponding FormField types that render with proper HTML5 input semantics and MUI styling.

## Architecture

The type mapping occurs in the BaseForm component's `renderField` function, which is responsible for converting schema field definitions into FormField components. The mapping is a simple lookup that translates schema types to FormField types before passing them to the FormField component.

```
Schema Definition (backend)
    ↓
    ├─ type: 'phone'
    ├─ type: 'email'
    ├─ type: 'url'
    ├─ type: 'country'
    ├─ type: 'date'
    ├─ type: 'boolean'
    └─ type: 'string' (default)
    ↓
Type Mapping Layer (BaseForm.renderField)
    ↓
    ├─ 'phone' → 'tel'
    ├─ 'email' → 'email'
    ├─ 'url' → 'url'
    ├─ 'country' → 'country'
    ├─ 'date' → 'date'
    ├─ 'boolean' → 'checkbox'
    └─ 'string' → 'text' (default)
    ↓
FormField Component (frontend)
    ↓
    Renders with proper HTML5 input type and MUI styling
```

## Components and Interfaces

### BaseForm Component

**Location:** `framework/frontend/components/form/BaseForm.tsx`

**Responsibility:** Manage form state and render fields based on schema definitions

**Key Function:** `renderField(fieldName: string, fieldDef: any)`

Currently, this function:
1. Extracts the field definition from schema
2. Determines the field type from `fieldDef.type`
3. Handles special cases (boolean → checkbox, enumValues → select)
4. Passes the field type to FormField

**Change Required:** Add a type mapping layer that converts schema types to FormField types before rendering.

### FormField Component

**Location:** `framework/frontend/components/formfield/FormField.tsx`

**Responsibility:** Render individual form fields with proper input types

**Supported Types:** 'text', 'email', 'password', 'number', 'textarea', 'select', 'checkbox', 'radio', 'date', 'time', 'url', 'tel', 'search', 'file', 'country'

**No changes required** - FormField already supports all necessary types. It just needs to receive the correct type from BaseForm.

## Data Models

### Schema Field Definition

```typescript
interface FieldDefinition {
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'country' | 'url' | 'object' | 'array' | 'json';
  label: string;
  required?: boolean;
  default?: any;
  placeholder?: string;
  description?: string;
  enumValues?: string[];
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  showOn?: string[];
  // ... other properties
}
```

### Type Mapping

```typescript
const schemaTypeToFormFieldType: Record<string, string> = {
  'phone': 'tel',
  'email': 'email',
  'url': 'url',
  'country': 'country',
  'date': 'date',
  'boolean': 'checkbox',
  'string': 'text',
  'number': 'number',
  'textarea': 'textarea',
  'text': 'text',
};
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: Schema type phone maps to tel

*For any* schema field definition with type 'phone', when rendered by BaseForm, the FormField component SHALL receive type='tel'.

**Validates: Requirements 1.1**

### Property 2: Schema type email maps to email

*For any* schema field definition with type 'email', when rendered by BaseForm, the FormField component SHALL receive type='email'.

**Validates: Requirements 1.2**

### Property 3: Schema type url maps to url

*For any* schema field definition with type 'url', when rendered by BaseForm, the FormField component SHALL receive type='url'.

**Validates: Requirements 1.3**

### Property 4: Schema type country maps to country

*For any* schema field definition with type 'country', when rendered by BaseForm, the FormField component SHALL receive type='country'.

**Validates: Requirements 1.4**

### Property 5: Schema type date maps to date

*For any* schema field definition with type 'date', when rendered by BaseForm, the FormField component SHALL receive type='date'.

**Validates: Requirements 1.5**

### Property 6: Schema type boolean maps to checkbox

*For any* schema field definition with type 'boolean', when rendered by BaseForm, the FormField component SHALL receive type='checkbox'.

**Validates: Requirements 1.6**

## Error Handling

- **Unknown schema type:** If a schema field has a type that is not in the mapping, default to 'text' type
- **Missing field definition:** If a field definition is missing required properties, skip rendering that field and log a warning
- **Invalid FormField type:** If FormField receives an unsupported type, it will render as 'text' (default case in FormField)

## Testing Strategy

### Unit Testing

Unit tests will verify:
- Type mapping function correctly converts each schema type to FormField type
- BaseForm passes correct type to FormField for each schema type
- Default behavior when schema type is unknown
- Special case handling (boolean → checkbox, etc.)

### Property-Based Testing

Property-based tests will verify:
- For all schema field definitions with type 'phone', FormField receives type='tel'
- For all schema field definitions with type 'email', FormField receives type='email'
- For all schema field definitions with type 'url', FormField receives type='url'
- For all schema field definitions with type 'country', FormField receives type='country'
- For all schema field definitions with type 'date', FormField receives type='date'
- For all schema field definitions with type 'boolean', FormField receives type='checkbox'

**Testing Framework:** Jest with fast-check for property-based testing

**Minimum iterations:** 100 per property test

**Test location:** `framework/frontend/components/form/__tests__/BaseForm.typeMapping.test.ts`
