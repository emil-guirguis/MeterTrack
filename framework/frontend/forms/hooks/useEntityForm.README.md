# useEntityForm Hook

A reusable React hook for managing entity form initialization and state in both create and edit modes.

## Overview

The `useEntityForm` hook simplifies the common pattern of initializing form data from an entity for editing, or with default values for creating new entities. It automatically handles prop changes and provides helper functions for updating form fields.

## Features

- ✅ **Automatic Initialization**: Initializes form data based on entity presence (edit vs create mode)
- ✅ **Prop Change Handling**: Automatically updates form when entity prop changes
- ✅ **Nested Field Support**: Update nested fields using dot notation (e.g., `'address.street'`)
- ✅ **Type Safety**: Full TypeScript support with generic types
- ✅ **Mode Detection**: Automatically detects edit vs create mode
- ✅ **Reset Functionality**: Reset form to initial state at any time

## Installation

The hook is part of the framework's forms module:

```typescript
import { useEntityForm } from '@framework/forms';
```

## Basic Usage

```typescript
import React from 'react';
import { useEntityForm } from '@framework/forms';

interface Contact {
  id: string;
  name: string;
  email: string;
}

interface ContactFormData {
  name: string;
  email: string;
}

const ContactForm = ({ contact }: { contact?: Contact }) => {
  const { formData, isEditMode, updateField } = useEntityForm<Contact, ContactFormData>({
    entity: contact,
    entityToFormData: (contact) => ({
      name: contact.name || '',
      email: contact.email || '',
    }),
    getDefaultFormData: () => ({
      name: '',
      email: '',
    }),
  });

  return (
    <form>
      <input
        value={formData.name}
        onChange={(e) => updateField('name', e.target.value)}
      />
      <input
        value={formData.email}
        onChange={(e) => updateField('email', e.target.value)}
      />
      <button type="submit">
        {isEditMode ? 'Update' : 'Create'}
      </button>
    </form>
  );
};
```

## API Reference

### Configuration

```typescript
interface EntityFormConfig<TEntity, TFormData> {
  entity?: TEntity;
  entityToFormData: (entity: TEntity) => TFormData;
  getDefaultFormData: () => TFormData;
  onInitialize?: (formData: TFormData, mode: 'create' | 'edit') => void;
}
```

#### Parameters

- **`entity`** (optional): The entity to edit. If undefined, the form operates in create mode.
- **`entityToFormData`**: Function to transform entity data to form data structure. Called when entity is provided.
- **`getDefaultFormData`**: Function to provide default/empty form data. Called when entity is undefined.
- **`onInitialize`** (optional): Callback invoked when form data is initialized, receives the form data and mode.

### Return Value

```typescript
interface EntityFormReturn<TFormData> {
  formData: TFormData;
  setFormData: React.Dispatch<React.SetStateAction<TFormData>>;
  isEditMode: boolean;
  updateField: (field: string, value: any) => void;
  resetForm: () => void;
}
```

#### Properties

- **`formData`**: Current form data state
- **`setFormData`**: React state setter for form data (for complex updates)
- **`isEditMode`**: Boolean indicating edit mode (true) or create mode (false)
- **`updateField`**: Function to update a single field (supports dot notation for nested fields)
- **`resetForm`**: Function to reset form to initial state based on current entity

## Advanced Usage

### Nested Fields

Use dot notation to update nested fields:

```typescript
const { formData, updateField } = useEntityForm({
  entity: user,
  entityToFormData: (user) => ({
    name: user.name || '',
    address: {
      street: user.address?.street || '',
      city: user.address?.city || '',
    },
  }),
  getDefaultFormData: () => ({
    name: '',
    address: {
      street: '',
      city: '',
    },
  }),
});

// Update nested field
<input
  value={formData.address.street}
  onChange={(e) => updateField('address.street', e.target.value)}
/>
```

### Complex State Updates

For complex state updates involving multiple fields, use `setFormData`:

```typescript
const { formData, setFormData, updateField } = useEntityForm({
  // ... config
});

const addTag = () => {
  const tag = formData.tagInput.trim();
  if (tag && !formData.tags.includes(tag)) {
    setFormData(prev => ({
      ...prev,
      tags: [...prev.tags, tag],
      tagInput: '',
    }));
  }
};
```

### Initialization Callback

Use the `onInitialize` callback for logging or side effects:

```typescript
const { formData } = useEntityForm({
  entity: product,
  entityToFormData: (product) => ({ /* ... */ }),
  getDefaultFormData: () => ({ /* ... */ }),
  onInitialize: (formData, mode) => {
    console.log(`Form initialized in ${mode} mode:`, formData);
  },
});
```

### Reset Form

Reset the form to its initial state:

```typescript
const { formData, resetForm } = useEntityForm({
  // ... config
});

<button type="button" onClick={resetForm}>
  Reset
</button>
```

## Migration Guide

### Before (Manual Implementation)

```typescript
const ContactForm = ({ contact }: { contact?: Contact }) => {
  const initializeFormData = useCallback((contactData: Contact | undefined) => {
    if (!contactData) {
      return { name: '', email: '' };
    }
    return {
      name: contactData.name || '',
      email: contactData.email || '',
    };
  }, []);

  const [formData, setFormData] = useState(() => initializeFormData(contact));

  useEffect(() => {
    setFormData(initializeFormData(contact));
  }, [contact, initializeFormData]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ... rest of form
};
```

### After (Using useEntityForm)

```typescript
const ContactForm = ({ contact }: { contact?: Contact }) => {
  const { formData, updateField, isEditMode } = useEntityForm<Contact, ContactFormData>({
    entity: contact,
    entityToFormData: (contact) => ({
      name: contact.name || '',
      email: contact.email || '',
    }),
    getDefaultFormData: () => ({
      name: '',
      email: '',
    }),
  });

  // ... rest of form
};
```

## Benefits

1. **Reduced Boilerplate**: Eliminates repetitive initialization logic
2. **Consistent Pattern**: Standardizes form initialization across the application
3. **Type Safety**: Full TypeScript support prevents errors
4. **Automatic Updates**: Handles entity prop changes automatically
5. **Flexible**: Works with simple and complex form structures

## Best Practices

1. **Define Clear Types**: Always define separate types for entity and form data
2. **Handle Missing Data**: Use fallback values in `entityToFormData` for optional fields
3. **Use Dot Notation**: Leverage dot notation for nested field updates
4. **Memoize Callbacks**: The hook already memoizes internal functions, no need to wrap in useCallback
5. **Combine with Validation**: Use alongside validation libraries for complete form management

## Examples

See `useEntityForm.example.tsx` for comprehensive examples including:
- Simple forms
- Forms with nested data
- Forms with initialization callbacks
- Forms with complex state management

## Related Hooks

- **`useBaseForm`**: Comprehensive form hook with validation and submission handling
- **`useBaseList`**: List management hook that pairs well with entity forms

## Requirements Satisfied

This hook satisfies the following requirements from the form-data-loading-fix spec:

- **Requirement 4.1**: Form initializes state using entity values when provided
- **Requirement 4.2**: Form initializes with default values when entity is undefined
- **Requirement 4.3**: Form updates state via useEffect when entity prop changes
- **Requirement 4.5**: Form handles missing properties gracefully through transformation function


## Field Validation (Development Mode)

The `useEntityForm` hook includes automatic field validation that helps catch mismatches between your form fields and backend entity structure during development.

### How It Works

When you pass an entity to the hook in edit mode, it automatically compares the form data fields with the entity fields and logs warnings to the console if there are mismatches.

### Configuration

```typescript
const { formData, updateField } = useEntityForm({
  entity: contact,
  entityName: 'Contact', // Used in validation messages
  validateFields: true,  // Enable validation (default: true in development)
  entityToFormData: (contact) => ({
    name: contact.name || '',
    email: contact.email || '',
  }),
  getDefaultFormData: () => ({
    name: '',
    email: '',
  }),
});
```

### What Gets Validated

The validation checks for:

1. **Form fields that don't exist in the entity** - These fields won't be populated when editing
2. **Entity fields that aren't in the form** - These fields are available but not being used (verbose mode only)

### Example Console Output

If your form has fields that don't match the backend entity, you'll see warnings like:

```
[Field Validation] Contact form has fields that don't exist in backend entity:
['address', 'website', 'contactPerson']

These fields will not be populated when editing. Check your backend model or remove these fields from the form.
```

### Common Issues This Catches

1. **Nested vs Flat Fields**
   ```typescript
   // Backend has flat fields
   { street: string, city: string, state: string }
   
   // But form uses nested object
   { address: { street: string, city: string, state: string } }
   ```

2. **Field Name Mismatches**
   ```typescript
   // Backend uses 'zip'
   { zip: string }
   
   // But form uses 'zipCode'
   { zipCode: string }
   ```

3. **Extra Fields Not in Backend**
   ```typescript
   // Form has fields that don't exist in backend
   { website: string, tags: string[] }
   ```

### Manual Validation

You can also use the validation utilities directly:

```typescript
import { validateFormFields, validateField, logEntityStructure } from '@framework/forms';

// Validate all fields
validateFormFields(formData, entityData, 'Contact', {
  ignoreFields: ['tagInput'], // Fields to ignore
  verbose: true,              // Show all mismatches
});

// Validate a single field
const exists = validateField('email', entityData, 'Contact');

// Log entity structure for debugging
logEntityStructure(entityData, 'Contact');
```

### Disabling Validation

Validation only runs in development mode and can be disabled:

```typescript
const { formData } = useEntityForm({
  entity: contact,
  validateFields: false, // Disable validation
  // ... other config
});
```

### Best Practices

1. **Match Backend Structure** - Keep your form fields aligned with your backend entity model
2. **Use Flat Fields** - Avoid nested objects in form data unless your backend uses them
3. **Check Console** - Review validation warnings during development
4. **Fix Mismatches** - Update either your form or backend model to match
