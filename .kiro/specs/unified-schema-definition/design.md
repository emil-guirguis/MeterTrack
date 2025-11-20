# Design Document

## Overview

The unified schema definition system provides a single source of truth for entity definitions in the frontend application. It eliminates duplication between form schemas and TypeScript interfaces by using an enhanced schema definition that automatically generates both TypeScript types and form utilities. The system builds upon the existing `createFormSchema` utility but extends it to support full entity definitions including database-only fields, computed properties, and legacy field mappings.

The design follows these principles:
- **Single Source of Truth**: Define entity structure once
- **Type Safety**: Automatic TypeScript type inference
- **Backward Compatibility**: Works with existing code patterns
- **Gradual Migration**: Can be adopted incrementally
- **Flexibility**: Supports form fields, database fields, and computed properties

## Architecture

### Current State

Currently, entities are defined in two places:

1. **Form Schema** (`contactFormSchema`): Defines form fields with validation and API mapping
2. **TypeScript Interface** (`Contact`): Defines the complete entity type including database fields

This creates duplication and maintenance overhead. Changes to entity structure require updates in multiple places.

### Proposed Architecture

The unified system introduces a three-layer approach:

```
┌─────────────────────────────────────┐
│   Entity Schema Definition          │
│   (Single Source of Truth)          │
└──────────────┬──────────────────────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌─────────────┐  ┌─────────────┐
│ Form Schema │  │  TypeScript │
│  (Runtime)  │  │    Types    │
└─────────────┘  └─────────────┘
```

### Schema Definition Structure

```typescript
const entitySchema = defineEntitySchema({
  // Form fields (editable by users)
  formFields: {
    name: field({ type: 'string', required: true, label: 'Name' }),
    email: field({ type: 'email', required: true, label: 'Email' }),
    // ... more form fields
  },
  
  // Entity-only fields (database, computed, read-only)
  entityFields: {
    id: { type: 'string' },
    status: { type: 'enum', values: ['active', 'inactive'] },
    createdAt: { type: 'date' },
    updatedAt: { type: 'date' },
  },
  
  // Legacy field mappings for backward compatibility
  legacyFields: {
    active: { maps: 'status', transform: (status) => status === 'active' },
  }
});
```

## Components and Interfaces

### 1. Enhanced Field Definition

Extends the existing `FieldDefinition` to support additional metadata:

```typescript
interface EnhancedFieldDefinition<TValue = any> extends FieldDefinition<TValue> {
  // Existing properties from FieldDefinition
  type: 'string' | 'number' | 'boolean' | 'date' | 'email' | 'phone' | 'url' | 'enum';
  default: TValue;
  required?: boolean;
  label?: string;
  apiField?: string;
  toApi?: (value: TValue) => any;
  fromApi?: (value: any) => TValue;
  
  // New properties for enhanced schema
  description?: string;
  placeholder?: string;
  group?: string;
  order?: number;
  enumValues?: readonly string[];
  readOnly?: boolean;
  computed?: boolean;
}
```

### 2. Entity Schema Definition

```typescript
interface EntitySchemaDefinition<TForm, TEntity> {
  // Fields that appear in forms (user-editable)
  formFields: FormSchema<TForm>;
  
  // Additional fields that exist in the entity but not in forms
  entityFields?: Record<string, EnhancedFieldDefinition>;
  
  // Legacy field mappings for backward compatibility
  legacyFields?: Record<string, LegacyFieldMapping>;
  
  // Metadata
  entityName?: string;
  description?: string;
}

interface LegacyFieldMapping {
  // Which field this legacy field maps to
  maps: string;
  // Optional transformation function
  transform?: (value: any) => any;
}
```

### 3. Schema Definition Function

```typescript
function defineEntitySchema<TForm extends Record<string, any>>(
  definition: EntitySchemaDefinition<TForm, any>
) {
  // Generate form utilities (existing functionality)
  const formSchema = createFormSchema(definition.formFields);
  
  // Generate TypeScript type for full entity
  type EntityType = InferEntityType<typeof definition>;
  
  // Return utilities
  return {
    // Form utilities (existing)
    form: formSchema,
    
    // Type helpers
    _formType: {} as TForm,
    _entityType: {} as EntityType,
    
    // Schema metadata
    definition,
    
    // Utility functions
    isFormField: (key: string) => key in definition.formFields,
    isEntityField: (key: string) => key in (definition.entityFields || {}),
    isLegacyField: (key: string) => key in (definition.legacyFields || {}),
  };
}
```

### 4. Type Inference Utility

```typescript
type InferEntityType<T extends EntitySchemaDefinition<any, any>> = 
  InferFormType<T['formFields']> & 
  InferEntityFields<T['entityFields']> &
  InferLegacyFields<T['legacyFields']>;

type InferFormType<TSchema> = {
  [K in keyof TSchema]: InferFieldType<TSchema[K]>
};

type InferEntityFields<TFields> = TFields extends Record<string, any>
  ? { [K in keyof TFields]: InferFieldType<TFields[K]> }
  : {};

type InferLegacyFields<TFields> = TFields extends Record<string, any>
  ? { [K in keyof TFields]?: any }
  : {};

type InferFieldType<TField> = 
  TField extends { type: 'string' } ? string :
  TField extends { type: 'number' } ? number :
  TField extends { type: 'boolean' } ? boolean :
  TField extends { type: 'date' } ? Date :
  TField extends { type: 'email' } ? string :
  TField extends { type: 'phone' } ? string :
  TField extends { type: 'url' } ? string :
  TField extends { type: 'enum', enumValues: readonly (infer U)[] } ? U :
  any;
```

## Data Models

### Contact Entity Example (Migrated)

```typescript
// Define the unified schema
export const contactSchema = defineEntitySchema({
  formFields: {
    name: field({ type: 'string', default: '', required: true, label: 'Name' }),
    company: field({ type: 'string', default: '', label: 'Company' }),
    role: field({ type: 'string', default: '', label: 'Role' }),
    email: field({ type: 'email', default: '', required: true, label: 'Email' }),
    phone: field({ type: 'phone', default: '', required: true, label: 'Phone' }),
    street: field({ type: 'string', default: '', label: 'Street Address' }),
    street2: field({ type: 'string', default: '', label: 'Street Address 2' }),
    city: field({ type: 'string', default: '', label: 'City' }),
    state: field({ type: 'string', default: '', label: 'State' }),
    zip: field({ type: 'string', default: '', label: 'ZIP Code', apiField: 'zip' }),
    country: field({ type: 'string', default: 'US', label: 'Country' }),
    notes: field({ type: 'string', default: '', label: 'Notes' }),
  },
  
  entityFields: {
    id: { type: 'string', default: '', readOnly: true },
    category: { 
      type: 'enum', 
      enumValues: ['customer', 'vendor', 'contractor', 'technician', 'client'] as const,
      default: 'customer'
    },
    status: { 
      type: 'enum', 
      enumValues: ['active', 'inactive'] as const,
      default: 'active'
    },
    createdat: { type: 'date', default: new Date(), readOnly: true },
    updatedat: { type: 'date', default: new Date(), readOnly: true },
    tags: { type: 'array', default: [] },
  },
  
  legacyFields: {
    active: { 
      maps: 'status', 
      transform: (status: string) => status === 'active' 
    },
    createdAt: { maps: 'createdat' },
    updatedAt: { maps: 'updatedat' },
  },
  
  entityName: 'Contact',
  description: 'Contact entity for customers, vendors, and other business contacts',
});

// Export form schema for use in forms (backward compatible)
export const contactFormSchema = contactSchema.form;

// Export TypeScript type (replaces manual interface)
export type Contact = typeof contactSchema._entityType;

// Usage in components remains the same
const defaults = contactFormSchema.getDefaults();
const apiData = contactFormSchema.toApi(formData);
const formData = contactFormSchema.fromApi(apiData);
```

## Error Handling

### Schema Validation

The system validates schema definitions at runtime to catch common errors:

```typescript
function validateSchema(definition: EntitySchemaDefinition<any, any>): ValidationResult {
  const errors: string[] = [];
  
  // Check for duplicate field names across form and entity fields
  const formFieldNames = Object.keys(definition.formFields);
  const entityFieldNames = Object.keys(definition.entityFields || {});
  const duplicates = formFieldNames.filter(name => entityFieldNames.includes(name));
  
  if (duplicates.length > 0) {
    errors.push(`Duplicate field names: ${duplicates.join(', ')}`);
  }
  
  // Check legacy field mappings reference valid fields
  Object.entries(definition.legacyFields || {}).forEach(([legacyName, mapping]) => {
    const targetExists = formFieldNames.includes(mapping.maps) || 
                        entityFieldNames.includes(mapping.maps);
    if (!targetExists) {
      errors.push(`Legacy field '${legacyName}' maps to non-existent field '${mapping.maps}'`);
    }
  });
  
  // Check required fields have defaults
  Object.entries(definition.formFields).forEach(([name, fieldDef]) => {
    if (fieldDef.required && fieldDef.default === undefined) {
      errors.push(`Required field '${name}' must have a default value`);
    }
  });
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### Type Safety

TypeScript will catch type mismatches at compile time:

```typescript
// Type error: 'invalidField' doesn't exist on Contact
const value = contact.invalidField;

// Type error: status must be 'active' or 'inactive'
contact.status = 'pending';

// Type error: email must be a string
contact.email = 123;
```

## Testing Strategy

### Unit Tests

1. **Schema Definition Tests**
   - Test `defineEntitySchema` creates correct structure
   - Test type inference works correctly
   - Test validation catches errors

2. **Form Utilities Tests**
   - Test `getDefaults()` returns correct defaults
   - Test `toApi()` transforms data correctly
   - Test `fromApi()` transforms data correctly
   - Test API field mapping works

3. **Type Inference Tests**
   - Test form types are inferred correctly
   - Test entity types include all fields
   - Test enum types are properly constrained
   - Test optional vs required fields

### Integration Tests

1. **Migration Tests**
   - Test migrated Contact entity works with existing ContactForm
   - Test migrated Contact entity works with existing ContactList
   - Test API integration still works
   - Test backward compatibility with legacy fields

2. **Multi-Entity Tests**
   - Test pattern works for Location entity
   - Test pattern works for Meter entity
   - Test pattern works for User entity

### Type Tests

Use TypeScript's type testing utilities to verify type inference:

```typescript
import { expectType } from 'tsd';

// Test Contact type has all expected fields
expectType<Contact>({
  id: '123',
  name: 'John Doe',
  email: 'john@example.com',
  phone: '555-1234',
  status: 'active',
  category: 'customer',
  createdat: new Date(),
  updatedat: new Date(),
  // ... all other fields
});

// Test status is constrained to enum values
const contact: Contact = {} as Contact;
expectType<'active' | 'inactive'>(contact.status);

// Test legacy fields work
expectType<boolean | undefined>(contact.active);
```

## Migration Strategy

### Phase 1: Create Enhanced Schema Utilities

1. Create `defineEntitySchema` function in `framework/frontend/forms/utils/entitySchema.ts`
2. Add type inference utilities
3. Add validation utilities
4. Write comprehensive tests

### Phase 2: Migrate Contact Entity

1. Update `contactConfig.ts` to use `defineEntitySchema`
2. Remove manual `Contact` interface
3. Export types from schema
4. Verify ContactForm and ContactList still work
5. Run integration tests

### Phase 3: Document and Migrate Other Entities

1. Create migration guide with examples
2. Migrate Location entity
3. Migrate Meter entity
4. Migrate User entity
5. Update documentation

### Phase 4: Deprecate Old Pattern

1. Add deprecation warnings to manual interface definitions
2. Update coding standards
3. Create linting rules to enforce new pattern

## Design Decisions and Rationales

### Decision 1: Extend Existing System vs. Replace

**Decision**: Extend the existing `createFormSchema` system rather than replace it

**Rationale**: 
- Maintains backward compatibility
- Leverages existing, working code
- Reduces migration effort
- Allows gradual adoption

### Decision 2: Separate Form Fields and Entity Fields

**Decision**: Use separate `formFields` and `entityFields` sections

**Rationale**:
- Clear separation of concerns
- Makes it obvious which fields are user-editable
- Supports database-only fields (id, timestamps)
- Allows computed properties

### Decision 3: Support Legacy Field Mappings

**Decision**: Include `legacyFields` for backward compatibility

**Rationale**:
- Existing code may reference old field names
- Allows gradual migration of dependent code
- Prevents breaking changes
- Can be removed in future major version

### Decision 4: Runtime Schema Definition

**Decision**: Define schemas at runtime rather than compile-time only

**Rationale**:
- Enables runtime validation
- Supports dynamic schema generation if needed
- Allows introspection for tooling
- TypeScript still provides compile-time type safety

### Decision 5: Type Inference Over Code Generation

**Decision**: Use TypeScript's type inference rather than code generation

**Rationale**:
- No build step required
- Simpler developer experience
- Types stay in sync automatically
- Leverages TypeScript's powerful type system

## Alternative Approaches Considered

### Alternative 1: Zod or Yup Schema Library

**Pros**: Battle-tested, rich validation, wide adoption
**Cons**: Additional dependency, learning curve, migration effort
**Decision**: Not chosen because existing system works well and adding a dependency isn't justified

### Alternative 2: Code Generation from Schema Files

**Pros**: Clear separation, could support multiple languages
**Cons**: Build complexity, harder to debug, less flexible
**Decision**: Not chosen because TypeScript's type inference is sufficient

### Alternative 3: Decorators/Annotations

**Pros**: Clean syntax, popular in other frameworks
**Cons**: Requires experimental TypeScript features, less explicit
**Decision**: Not chosen because we want stable TypeScript features only
