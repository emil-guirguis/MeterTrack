# Design Document: Standardize Form Inheritance Pattern

## Overview

This design standardizes all form and list modules across the application to use framework components (BaseForm and DataList). Currently, some forms (MeterForm, ContactForm) use BaseForm effectively, while others (DeviceForm, LocationForm, UserForm) duplicate form logic. All lists use DataList and useBaseList, but there is significant duplication in list configuration code across modules. This refactoring eliminates code duplication in both forms and lists, ensures consistency, and allows all modules to benefit from framework improvements.

## Architecture

### Current State - Forms
- **MeterForm & ContactForm**: Use BaseForm with minimal code (~50 lines)
- **DeviceForm, LocationForm, UserForm**: Manually implement form logic (~300+ lines each)
- **Duplication**: Validation, error handling, field rendering logic repeated across forms

### Current State - Lists
- **All Lists** (MeterList, DeviceList, LocationList, ContactList, UserList): Use DataList (UI component) and useBaseList (logic hook)
- **DataList**: Framework component that renders table UI (columns, rows, pagination, bulk actions)
- **useBaseList**: Framework hook that manages list logic (data fetching, permissions, search, filters, bulk actions, export)
- **Duplication**: Configuration code (columns, filters, stats, bulk actions, export) repeated in each list component file
- **Inconsistency**: Different patterns for delete handlers, permission checks, and custom rendering across modules

### Target State - Forms
- **All Forms**: Use BaseForm component
- **Consistency**: All forms follow the same pattern
- **Maintainability**: Single source of truth for form logic in BaseForm
- **Extensibility**: Custom field rendering via renderCustomField prop

### Target State - Lists
- **All Lists**: Use DataList (UI) and useBaseList (logic) with extracted, reusable configuration
- **Configuration Extraction**: Move columns, filters, stats, bulk actions, export config to config files (already partially done)
- **Consistency**: All lists follow the same pattern for delete handlers, permissions, and custom rendering
- **Maintainability**: Configuration centralized in config files, list components simplified to ~50 lines
- **Extensibility**: Custom rendering via column render functions in config files

### Key Components

```
Framework Components
├── BaseForm
│   ├── Schema Loading (useSchema hook)
│   ├── Form State Management (useEntityFormWithStore hook)
│   ├── Validation Logic
│   ├── Field Rendering
│   ├── Error Handling
│   └── Submission Logic
│
└── DataList + useBaseList
    ├── Data Loading & Pagination
    ├── Filtering & Search
    ├── Sorting
    ├── Bulk Actions
    ├── Export/Import
    ├── Stats Rendering
    └── Permission Checks

Form Modules (Client)
├── MeterForm (✓ Already using BaseForm)
├── ContactForm (✓ Already using BaseForm)
├── DeviceForm (→ Refactor to BaseForm)
├── LocationForm (→ Refactor to BaseForm)
├── UserForm (→ Refactor to BaseForm)
└── Custom Field Rendering (renderCustomField prop)

List Modules (Client)
├── MeterList (✓ Using DataList + useBaseList, extract config)
├── DeviceList (✓ Using DataList + useBaseList, extract config)
├── LocationList (✓ Using DataList + useBaseList, extract config)
├── ContactList (✓ Using DataList + useBaseList, extract config)
└── UserList (✓ Using DataList + useBaseList, extract config)

Configuration Files (Shared)
├── meterConfig.ts (columns, filters, stats, bulk actions, export)
├── deviceConfig.ts (columns, filters, stats, bulk actions, export)
├── locationConfig.ts (columns, filters, stats, bulk actions, export)
├── contactConfig.ts (columns, filters, stats, bulk actions, export)
└── userConfig.ts (columns, filters, stats, bulk actions, export)
```

## Components and Interfaces

### BaseForm Props (Framework)
```typescript
interface BaseFormProps {
  // Dynamic schema form props
  schemaName: string;           // Name of schema to load from backend
  entity?: any;                 // Entity being edited (undefined for create)
  store: any;                   // Store for entity management
  onCancel: () => void;         // Callback when form is cancelled
  onLegacySubmit?: (data: any) => Promise<void>;  // Legacy callback after submit
  
  // Field organization
  fieldSections?: Record<string, string[]>;  // Group fields by section
  excludeFields?: string[];     // Fields to exclude from rendering
  fieldsToClean?: string[];     // Fields to remove before submission
  
  // Custom rendering
  renderCustomField?: (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => React.ReactNode | null;
  
  // Validation
  validationDataProvider?: (entityName: string, fieldDef: any) => Promise<Array<{ id: any; label: string }>>;
  
  // UI
  className?: string;           // CSS class for styling
  loading?: boolean;            // Loading state
}
```

### Form Module Pattern
```typescript
interface FormProps {
  entity?: Entity;
  onSubmit?: (data: any) => Promise<void>;  // Legacy callback
  onCancel: () => void;
  loading?: boolean;
}

export const EntityForm: React.FC<FormProps> = ({
  entity,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const store = useEntityStoreEnhanced();
  
  const fieldSections: Record<string, string[]> = {
    'Section 1': ['field1', 'field2'],
    'Section 2': ['field3', 'field4'],
  };
  
  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => {
    if (fieldName === 'customField') {
      return <CustomFieldComponent {...props} />;
    }
    return null;  // Use default rendering
  };
  
  return (
    <BaseForm
      schemaName="entity"
      entity={entity}
      store={store}
      onCancel={onCancel}
      onLegacySubmit={onSubmit}
      className="entity-form"
      fieldSections={fieldSections}
      loading={loading}
      renderCustomField={renderCustomField}
      fieldsToClean={['id', 'active', 'createdat', 'updatedat', 'createdAt', 'updatedAt']}
      validationDataProvider={validationDataProvider}
    />
  );
};
```

## Data Models

### Schema Definition (Backend)
```typescript
interface BackendFieldDefinition {
  label: string;
  type: 'string' | 'number' | 'boolean' | 'email' | 'object' | 'array';
  required: boolean;
  placeholder?: string;
  description?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  enumValues?: string[];
  validate?: boolean;  // For foreign key relationships
  showOn?: string[];   // Where to show field (e.g., ['form', 'list'])
}

interface FormSchema {
  formFields: Record<string, BackendFieldDefinition>;
}
```

### Form State
```typescript
interface FormState {
  formData: Record<string, any>;
  errors: Record<string, string>;
  isSubmitting: boolean;
  dirtyFields: Set<string>;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property 1: BaseForm Reduces Code Duplication
*For any* form module that is refactored to use BaseForm, the resulting code SHALL be at least 60% smaller than the manual implementation version.

**Validates: Requirements 1.5**

### Property 2: Form Validation Consistency
*For any* form using BaseForm with a schema, validation errors SHALL be displayed consistently for all field types (string, number, boolean, enum, email).

**Validates: Requirements 5.1, 5.2, 5.3**

### Property 3: Custom Field Rendering Fallback
*For any* custom field that returns null from renderCustomField, BaseForm SHALL render the field using default rendering based on field type.

**Validates: Requirements 3.2, 3.3**

### Property 4: Field Section Organization
*For any* form with fieldSections defined, BaseForm SHALL render fields grouped by section with section headers in the order specified.

**Validates: Requirements 4.1, 4.2, 4.4, 4.5**

### Property 5: Form Submission Round Trip
*For any* entity submitted through a refactored form, the entity SHALL be successfully saved to the store and the form SHALL close after submission.

**Validates: Requirements 6.1, 6.2, 6.3, 6.4**

### Property 6: Backward Compatibility
*For any* form with a legacy onSubmit callback, the callback SHALL be called after successful submission with the saved entity data.

**Validates: Requirements 2.5, 6.5**

### Property 7: Field Exclusion
*For any* form with excludeFields specified, those fields SHALL not be rendered in the form and SHALL not be included in form submission.

**Validates: Requirements 1.2**

### Property 8: Error Clearing on Input
*For any* field with a validation error, the error SHALL be cleared when the user modifies the field value.

**Validates: Requirements 5.2**

## Error Handling

### Validation Errors
- Required field validation: Display "Field is required" message
- Type validation: Display type-specific error (e.g., "must be a number")
- Pattern validation: Display "format is invalid" message
- Range validation: Display min/max constraints
- Enum validation: Display allowed values

### Submission Errors
- API errors: Display error message from server response
- Network errors: Display "Failed to connect" message
- Validation errors: Display field-level errors from API
- Auto-dismiss: Error toast auto-dismisses after 7 seconds

### Error Display
- Field-level errors: Displayed below field with red styling
- Form-level errors: Displayed as toast notification
- First error focus: Form scrolls to and focuses first field with error

## Testing Strategy

### Verification Approach
- Manual testing of form rendering and submission
- Verify field validation works correctly
- Verify custom field rendering displays properly
- Verify form submission success and error cases
- Verify field section organization displays correctly
- Verify error clearing on input change

## Implementation Phases

### Phase 1: Form Refactoring
- **1.1 DeviceForm**: Remove manual validation, field rendering, error handling
- **1.2 LocationForm**: Same as DeviceForm
- **1.3 UserForm**: Same as DeviceForm, handle password field special case
- **1.4 Form Tests**: Update tests to verify new implementations

### Phase 2: List Configuration Extraction
- **2.1 Extract Common Patterns**: Identify and document common list patterns
- **2.2 Standardize Delete Handlers**: Create reusable delete handler pattern
- **2.3 Standardize Permission Checks**: Ensure consistent permission checking
- **2.4 Standardize Custom Rendering**: Document custom column rendering patterns
- **2.5 List Tests**: Update tests to verify list functionality

### Phase 3: Code Cleanup
- **3.1 Remove Duplication**: Remove duplicate code from list modules
- **3.2 Simplify List Components**: Reduce list component code by extracting config

### Phase 4: Verification
- **4.1 Verify Metrics**: Measure code reduction in forms and lists
- **4.2 Verify Consistency**: Ensure all modules follow the same pattern
- **4.3 Manual Testing**: Test all forms and lists work correctly

## Migration Path

### For Each Form Module:
1. Keep existing form component file
2. Replace implementation with BaseForm usage
3. Move custom field logic to renderCustomField
4. Define fieldSections for field organization
5. Update tests to verify new implementation
6. Verify backward compatibility with onSubmit callbacks

### Backward Compatibility
- All existing onSubmit callbacks continue to work
- All existing form props remain supported
- No breaking changes to form interfaces
- Existing tests should pass without modification

## Success Criteria

### Forms
1. All form modules use BaseForm component
2. Form code duplication eliminated (60%+ reduction)
3. All forms follow consistent pattern
4. All form tests pass

### Lists
1. All list modules use DataList + useBaseList consistently
2. List configuration extracted to config files
3. Delete handlers follow consistent pattern
4. Permission checks follow consistent pattern
5. Custom rendering follows consistent pattern
6. List code duplication eliminated (40%+ reduction)
7. All list tests pass

### Overall
1. No breaking changes to form or list interfaces
2. All forms and lists function correctly
3. Code reduction achieved in both forms and lists
