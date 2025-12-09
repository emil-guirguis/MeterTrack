# useEntityFormWithStore Hook

The `useEntityFormWithStore` hook combines entity form management with automatic API integration through entity stores. It eliminates the need to manually wire up create/update API calls in your components.

## Features

- **Automatic API Calls** - Handles create/update operations automatically
- **Store Integration** - Works with any entity store that has create/update methods
- **List Refresh** - Automatically refreshes the list after save
- **Error Handling** - Built-in error handling with callbacks
- **Type Safety** - Full TypeScript support
- **Success Callbacks** - Execute custom logic after successful save

## Basic Usage

```typescript
import { useEntityFormWithStore } from '@framework/forms';
import { useContactsEnhanced } from '../../store/entities/contactsStore';

const ContactForm = ({ contact, onClose }) => {
  const contacts = useContactsEnhanced();
  
  const form = useEntityFormWithStore({
    entity: contact,
    store: contacts,
    entityToFormData: (contact) => ({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
    }),
    getDefaultFormData: () => ({
      name: '',
      email: '',
      phone: '',
    }),
    onSuccess: () => {
      onClose(); // Close form after save
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <input
        type="text"
        value={form.formData.name}
        onChange={(e) => form.updateField('name', e.target.value)}
      />
      <input
        type="email"
        value={form.formData.email}
        onChange={(e) => form.updateField('email', e.target.value)}
      />
      <button type="submit" disabled={form.isSubmitting}>
        {form.isEditMode ? 'Update' : 'Create'}
      </button>
    </form>
  );
};
```

## Configuration

### Required Props

- **entity** - The entity being edited (undefined for create mode)
- **store** - Entity store with create/update methods
- **entityToFormData** - Function to convert entity to form data
- **getDefaultFormData** - Function to get default form data for create mode

### Optional Props

- **onSuccess** - Callback after successful save `(savedEntity, mode) => void`
- **onError** - Callback on error `(error, mode) => void`
- **formDataToEntity** - Transform form data before saving
- **refreshAfterSave** - Whether to refresh list after save (default: true)
- **entityName** - Name for validation messages
- **validateFields** - Enable field validation (default: true)
- **createMethodName** - Custom create method name (default: 'createItem')
- **updateMethodName** - Custom update method name (default: 'updateItem')

## Return Values

All values from `useEntityForm` plus:

- **handleSubmit** - Form submission handler
- **isSubmitting** - Whether form is currently submitting
- **submitError** - Error from last submission

## Advanced Usage

### Custom Data Transformation

```typescript
const form = useEntityFormWithStore({
  entity: contact,
  store: contacts,
  entityToFormData: (contact) => ({
    name: contact.name || '',
    email: contact.email || '',
  }),
  getDefaultFormData: () => ({
    name: '',
    email: '',
  }),
  // Transform form data before sending to API
  formDataToEntity: (formData) => ({
    name: formData.name.trim(),
    email: formData.email.toLowerCase(),
    updatedAt: new Date().toISOString(),
  }),
});
```

### Error Handling

```typescript
const form = useEntityFormWithStore({
  entity: contact,
  store: contacts,
  entityToFormData: (contact) => ({ /* ... */ }),
  getDefaultFormData: () => ({ /* ... */ }),
  onError: (error, mode) => {
    console.error(`Failed to ${mode} contact:`, error);
    // Show error notification
    showNotification({
      type: 'error',
      message: `Failed to ${mode} contact: ${error.message}`,
    });
  },
});
```

### Custom Store Methods

If your store uses different method names:

```typescript
const form = useEntityFormWithStore({
  entity: contact,
  store: contacts,
  createMethodName: 'createContact', // Instead of 'createItem'
  updateMethodName: 'updateContact', // Instead of 'updateItem'
  entityToFormData: (contact) => ({ /* ... */ }),
  getDefaultFormData: () => ({ /* ... */ }),
});
```

### Disable Auto-Refresh

```typescript
const form = useEntityFormWithStore({
  entity: contact,
  store: contacts,
  refreshAfterSave: false, // Don't refresh list after save
  entityToFormData: (contact) => ({ /* ... */ }),
  getDefaultFormData: () => ({ /* ... */ }),
  onSuccess: (savedEntity) => {
    // Manually update UI or navigate
    navigate(`/contacts/${savedEntity.id}`);
  },
});
```

## Store Requirements

Your entity store must have at least one of these method pairs:

### Option 1: Standard Names
```typescript
interface EntityStore<T> {
  createItem: (data: Partial<T>) => Promise<T>;
  updateItem: (id: string, data: Partial<T>) => Promise<T>;
  fetchItems?: () => Promise<void>; // Optional, for auto-refresh
}
```

### Option 2: Short Names
```typescript
interface EntityStore<T> {
  create: (data: Partial<T>) => Promise<T>;
  update: (id: string, data: Partial<T>) => Promise<T>;
  fetchItems?: () => Promise<void>; // Optional, for auto-refresh
}
```

### Option 3: Custom Names
```typescript
interface EntityStore<T> {
  createContact: (data: Partial<T>) => Promise<T>;
  updateContact: (id: string, data: Partial<T>) => Promise<T>;
}

// Then specify in config:
const form = useEntityFormWithStore({
  createMethodName: 'createContact',
  updateMethodName: 'updateContact',
  // ...
});
```

## Complete Example

```typescript
import React, { useState } from 'react';
import { useEntityFormWithStore } from '@framework/forms';
import { useContactsEnhanced } from '../../store/entities/contactsStore';
import type { Contact } from '../../types/entities';

interface ContactFormProps {
  contact?: Contact;
  onClose: () => void;
}

export const ContactForm: React.FC<ContactFormProps> = ({ contact, onClose }) => {
  const contacts = useContactsEnhanced();
  
  const form = useEntityFormWithStore({
    entity: contact,
    store: contacts,
    entityName: 'Contact',
    entityToFormData: (contact) => ({
      name: contact.name || '',
      email: contact.email || '',
      phone: contact.phone || '',
      company: contact.company || '',
    }),
    getDefaultFormData: () => ({
      name: '',
      email: '',
      phone: '',
      company: '',
    }),
    onSuccess: (savedContact, mode) => {
      console.log(`Contact ${mode}d successfully:`, savedContact);
      onClose();
    },
    onError: (error, mode) => {
      alert(`Failed to ${mode} contact: ${error.message}`);
    },
  });
  
  return (
    <form onSubmit={form.handleSubmit} className="contact-form">
      <div>
        <label>Name *</label>
        <input
          type="text"
          value={form.formData.name}
          onChange={(e) => form.updateField('name', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Email *</label>
        <input
          type="email"
          value={form.formData.email}
          onChange={(e) => form.updateField('email', e.target.value)}
          required
        />
      </div>
      
      <div>
        <label>Phone</label>
        <input
          type="tel"
          value={form.formData.phone}
          onChange={(e) => form.updateField('phone', e.target.value)}
        />
      </div>
      
      <div>
        <label>Company</label>
        <input
          type="text"
          value={form.formData.company}
          onChange={(e) => form.updateField('company', e.target.value)}
        />
      </div>
      
      {form.submitError && (
        <div className="error">
          Error: {form.submitError.message}
        </div>
      )}
      
      <div className="actions">
        <button type="button" onClick={onClose}>
          Cancel
        </button>
        <button type="submit" disabled={form.isSubmitting}>
          {form.isSubmitting ? 'Saving...' : form.isEditMode ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};
```

## Comparison with Manual Approach

### Before (Manual API Wiring)

```typescript
const ContactManagementPage = () => {
  const contacts = useContactsEnhanced();
  const [editingContact, setEditingContact] = useState(null);
  
  const handleSubmit = async (data) => {
    try {
      if (editingContact) {
        await contacts.updateContact(editingContact.id, data);
      } else {
        await contacts.createContact(data);
      }
      setEditingContact(null);
      await contacts.fetchItems();
    } catch (error) {
      console.error(error);
    }
  };
  
  return <ContactForm contact={editingContact} onSubmit={handleSubmit} />;
};
```

### After (Framework Handles It)

```typescript
const ContactForm = ({ contact, onClose }) => {
  const contacts = useContactsEnhanced();
  
  const form = useEntityFormWithStore({
    entity: contact,
    store: contacts,
    entityToFormData: (c) => ({ /* ... */ }),
    getDefaultFormData: () => ({ /* ... */ }),
    onSuccess: onClose,
  });
  
  return <form onSubmit={form.handleSubmit}>{/* ... */}</form>;
};
```

## Benefits

1. **Less Boilerplate** - No need to manually wire up create/update logic
2. **Consistent Pattern** - All forms follow the same pattern
3. **Automatic Refresh** - List refreshes automatically after save
4. **Error Handling** - Built-in error handling with callbacks
5. **Type Safety** - Full TypeScript support with generics
6. **Validation** - Automatic field validation against backend schema
