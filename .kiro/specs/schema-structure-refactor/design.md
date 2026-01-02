# Design: Schema Structure Refactoring

## Overview

This design refactors the schema definition structure to use a hierarchical tab/section/field organization where fields are embedded directly within sections. This eliminates the need for separate field definitions and formGrouping metadata.

## Architecture

### Current Structure (formGrouping)
```
Field Definition
├── type
├── label
├── dbField
├── formGrouping (embedded metadata)
│   ├── tabName
│   ├── sectionName
│   ├── tabOrder
│   ├── sectionOrder
│   └── fieldOrder
```

### New Structure (formTabs with embedded fields)
```
Schema Definition
├── formTabs (hierarchical organization)
│   └── Tab
│       ├── name
│       ├── order
│       └── sections
│           └── Section
│               ├── name
│               ├── order
│               └── fields
│                   └── Field
│                       ├── name
│                       ├── order
│                       ├── type
│                       ├── label
│                       ├── dbField
│                       └── validation
```

## Components

### 1. SchemaDefinition Helper Functions

**File**: `framework/backend/api/base/SchemaDefinition.js`

Add new helper functions:

```typescript
// Create a tab definition
function tab(config: {
  name: string;
  order: number;
  sections: Section[];
}): Tab

// Create a section definition
function section(config: {
  name: string;
  order: number;
  fields: Field[];
}): Section

// Create a field definition (same as field() but with order and name)
function formField(config: {
  name: string;
  order: number;
  type: string;
  label: string;
  dbField: string;
  required?: boolean;
  default?: any;
  validation?: any;
  // ... other field properties
}): Field
```

### 2. Schema Structure Types

```typescript
interface Tab {
  name: string;
  order: number;
  sections: Section[];
}

interface Section {
  name: string;
  order: number;
  minWidth?: string;  // NEW: CSS min-width for section container
  maxWidth?: string;  // NEW: CSS max-width for section container
  fields: Field[];
}

interface Field {
  name: string;
  order: number;
  type: string;
  label: string;
  dbField: string;
  required?: boolean;
  default?: any;
  validation?: any;
  minWidth?: string;  // NEW: CSS min-width for field container
  maxWidth?: string;  // NEW: CSS max-width for field container
  // ... other field properties
}

interface SchemaDefinitionConfig {
  entityName: string;
  tableName: string;
  formTabs: Tab[];  // NEW: Hierarchical structure with embedded fields
  entityFields?: Record<string, FieldDefinition>;
  relationships?: Record<string, Relationship>;
  validation?: ValidationConfig;
}
```

### 3. useFormTabs Hook Update

**File**: `framework/frontend/components/form/hooks/useFormTabs.ts`

Update the hook to support both structures:

```typescript
export const useFormTabs = (
  formFields: Record<string, FieldDefinition> | undefined,
  formTabs: Tab[] | undefined,  // NEW parameter
  activeTab: string
): UseFormTabsResult => {
  // If formTabs is provided, use it
  if (formTabs) {
    return processFormTabs(formTabs, activeTab);
  }
  
  // Fall back to formGrouping metadata
  return processFormGrouping(formFields, activeTab);
}
```

### 4. Processing Logic

**processFormTabs()**:
1. Iterate through formTabs array
2. For each tab, iterate through sections
3. For each section, iterate through fields
4. Extract field definitions from the hierarchical structure
5. Build the same output structure as formGrouping processing
6. Return organized tabs and field sections

**processFormGrouping()**:
1. Existing logic (unchanged)
2. Processes formGrouping metadata from fields
3. Returns organized tabs and field sections

### 5. BaseForm Component Update

**File**: `framework/frontend/components/form/BaseForm.tsx`

Update to pass formTabs to useFormTabs:

```typescript
const { schema } = useSchema(isDynamicForm ? schemaName! : '');

// Pass both formFields and formTabs
const { tabs: allTabs, tabList } = useFormTabs(
  schema?.formFields,
  schema?.formTabs,  // NEW
  activeTab || 'dummy'
);
```

## Data Flow

```
Schema Definition (formTabs with embedded fields)
    ↓
useFormTabs Hook
    ├─ processFormTabs() if formTabs exists
    │   └─ Extracts fields from hierarchical structure
    │   └─ Converts to flat organization
    └─ processFormGrouping() if formTabs doesn't exist
        └─ Processes formGrouping metadata
    ↓
Output: { tabs, tabList, fieldSections }
    ↓
FormTabs Component (renders tabs)
BaseForm Component (renders fields in sections)
```

## Backward Compatibility

1. **formGrouping still works**: Existing schemas continue to function
2. **formTabs takes precedence**: If both exist, formTabs is used
3. **Gradual migration**: Schemas can be migrated one at a time
4. **No breaking changes**: Form rendering code remains unchanged

## Migration Strategy

### Phase 1: Add Support (No Breaking Changes)
- Add formTabs support to SchemaDefinition
- Update useFormTabs to handle both structures
- Update BaseForm to pass formTabs
- All existing schemas continue working

### Phase 2: Migrate Contact Schema
- Convert Contact schema to use formTabs with embedded fields
- Test thoroughly
- Verify all tabs and sections display correctly

### Phase 3: Migrate Remaining Schemas
- Device, User, Location, Meter schemas
- One at a time with testing

### Phase 4: Deprecation
- Mark formGrouping as deprecated
- Add migration guide in documentation
- Plan removal for next major version

## Benefits

1. **Clarity**: Form structure is immediately visible and hierarchical
2. **Maintainability**: No need to edit every field for organization changes
3. **Single Source**: Fields defined once in their tab/section location
4. **Scalability**: Easier to manage complex forms with many fields
5. **Documentation**: Schema structure serves as form documentation

## Implementation Order

1. Update SchemaDefinition with helper functions
2. Update useFormTabs hook to support formTabs
3. Update BaseForm to pass formTabs
4. Migrate Contact schema as proof of concept
5. Migrate remaining schemas
6. Update documentation

## Testing Strategy

### Unit Tests
- Test tab() helper function
- Test section() helper function
- Test formField() helper function
- Test processFormTabs() logic
- Test processFormGrouping() logic (unchanged)

### Integration Tests
- Test useFormTabs with formTabs structure
- Test useFormTabs with formGrouping structure
- Test useFormTabs with both structures (formTabs takes precedence)
- Test form rendering with new structure

### Property-Based Tests
- For any valid formTabs structure, output should match formGrouping equivalent
- For any schema, tabs should be sorted by order
- For any tab, sections should be sorted by order
- For any section, fields should be sorted by order

## Error Handling

1. **Invalid field definitions**: Log warning if field is missing required properties
2. **Duplicate field names**: Log warning if field appears in multiple sections
3. **Missing field order**: Use default order if not specified
4. **Missing section order**: Use default order if not specified

## Performance Considerations

1. **Processing overhead**: Minimal (one-time during schema load)
2. **Memory usage**: Similar to current structure (fields embedded instead of referenced)
3. **Rendering**: No change (same output structure)
4. **Caching**: Schema is cached, so processing happens once per schema

## Future Enhancements

1. **Conditional sections**: Show/hide sections based on field values
2. **Dynamic field ordering**: Reorder fields based on user preferences
3. **Custom section rendering**: Allow custom components for sections
4. **Collapsible sections**: Allow sections to be collapsed/expanded
5. **Field grouping**: Group related fields within sections
