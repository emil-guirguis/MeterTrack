# Forms Framework

A comprehensive framework for building forms with validation, error handling, and permission-based field visibility.

## Features

- **State Management**: Centralized form state with change tracking
- **Validation**: Field-level and form-level validation with custom rules
- **Error Handling**: Display validation errors inline and as summaries
- **Permissions**: Role-based field visibility and editability
- **Auto-save**: Optional auto-save functionality
- **Dirty Tracking**: Track unsaved changes
- **Async Validation**: Support for server-side validation
- **Field Dependencies**: Show/hide fields based on other field values
- **Transformation**: Transform data before submission
- **Accessibility**: WCAG 2.1 AA compliant form controls

## Quick Start

```tsx
import { useBaseForm, FormField, FormActions } from '../../../framework/frontend/forms';

function ContactForm({ contact, onSave }) {
  const form = useBaseForm({
    initialValues: contact || {
      name: '',
      email: '',
      phone: '',
      company: ''
    },
    validationSchema: {
      name: [
        { type: 'required', message: 'Name is required' }
      ],
      email: [
        { type: 'required', message: 'Email is required' },
        { type: 'email', message: 'Invalid email format' }
      ],
      phone: [
        { type: 'pattern', value: /^\d{10}$/, message: 'Phone must be 10 digits' }
      ]
    },
    onSubmit: async (values) => {
      await onSave(values);
    }
  });

  return (
    <form onSubmit={form.handleSubmit}>
      <FormField
        label="Name"
        name="name"
        value={form.values.name}
        error={form.errors.name}
        onChange={form.handleChange}
        required
      />
      
      <FormField
        label="Email"
        name="email"
        type="email"
        value={form.values.email}
        error={form.errors.email}
        onChange={form.handleChange}
        required
      />
      
      <FormField
        label="Phone"
        name="phone"
        type="tel"
        value={form.values.phone}
        error={form.errors.phone}
        onChange={form.handleChange}
      />
      
      <FormActions
        onSubmit={form.handleSubmit}
        onCancel={() => history.back()}
        isSubmitting={form.isSubmitting}
        isDirty={form.isDirty}
      />
    </form>
  );
}
```

## Core Concepts

### useBaseForm Hook

The `useBaseForm` hook manages all form state and provides methods for form operations:

```tsx
const form = useBaseForm<ContactFormData>({
  // Required
  initialValues: {
    name: '',
    email: ''
  },
  onSubmit: async (values) => {
    await saveContact(values);
  },
  
  // Optional
  validationSchema: {...},
  authContext: useAuth(),
  permissions: {
    read: 'contacts.read',
    update: 'contacts.update'
  },
  validateOnChange: true,
  validateOnBlur: true,
  autoSave: false,
  autoSaveDelay: 1000,
  transformBeforeSubmit: (values) => ({
    ...values,
    phone: normalizePhone(values.phone)
  })
});
```

**Returns:**
- `values` - Current form values
- `errors` - Validation errors
- `touched` - Fields that have been touched
- `isDirty` - Whether form has unsaved changes
- `isValid` - Whether form is valid
- `isSubmitting` - Whether form is being submitted
- `handleChange` - Change handler for fields
- `handleBlur` - Blur handler for fields
- `handleSubmit` - Submit handler
- `setFieldValue` - Set a specific field value
- `setFieldError` - Set a specific field error
- `setFieldTouched` - Mark a field as touched
- `resetForm` - Reset form to initial values
- `validateField` - Validate a specific field
- `validateForm` - Validate entire form

## Validation

### Validation Rules

Built-in validation rules:

```tsx
const validationSchema = {
  // Required field
  name: [
    { type: 'required', message: 'Name is required' }
  ],
  
  // Email validation
  email: [
    { type: 'required', message: 'Email is required' },
    { type: 'email', message: 'Invalid email format' }
  ],
  
  // Minimum length
  password: [
    { type: 'required', message: 'Password is required' },
    { type: 'min', value: 8, message: 'Password must be at least 8 characters' }
  ],
  
  // Maximum length
  bio: [
    { type: 'max', value: 500, message: 'Bio must be less than 500 characters' }
  ],
  
  // Pattern matching
  phone: [
    { type: 'pattern', value: /^\d{10}$/, message: 'Phone must be 10 digits' }
  ],
  
  // Custom validation
  age: [
    {
      type: 'custom',
      message: 'Must be 18 or older',
      validator: (value) => value >= 18
    }
  ],
  
  // Async validation
  username: [
    {
      type: 'custom',
      message: 'Username already taken',
      validator: async (value) => {
        const available = await checkUsernameAvailability(value);
        return available;
      }
    }
  ]
};
```

### Field-Level Validation

Validate individual fields:

```tsx
const validateEmail = (value: string): string | undefined => {
  if (!value) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    return 'Invalid email format';
  }
  return undefined;
};

<FormField
  name="email"
  validate={validateEmail}
  {...form.getFieldProps('email')}
/>
```

### Form-Level Validation

Validate the entire form:

```tsx
const form = useBaseForm({
  initialValues: {...},
  validate: (values) => {
    const errors: Record<string, string> = {};
    
    if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    if (values.startDate > values.endDate) {
      errors.endDate = 'End date must be after start date';
    }
    
    return errors;
  },
  onSubmit: async (values) => {...}
});
```

## Components

### FormField

Reusable form field component with label, input, and error display:

```tsx
<FormField
  label="Email"
  name="email"
  type="email"
  value={form.values.email}
  error={form.errors.email}
  onChange={form.handleChange}
  onBlur={form.handleBlur}
  required
  disabled={form.isSubmitting}
  placeholder="Enter your email"
  helpText="We'll never share your email"
/>
```

**Props:**
- `label` - Field label
- `name` - Field name
- `type` - Input type (text, email, password, number, tel, url, date, etc.)
- `value` - Current value
- `error` - Error message
- `onChange` - Change handler
- `onBlur` - Blur handler
- `required` - Whether field is required
- `disabled` - Whether field is disabled
- `placeholder` - Placeholder text
- `helpText` - Help text below field
- `className` - Custom CSS class

### FormSection

Group related fields together:

```tsx
<FormSection
  title="Personal Information"
  description="Enter your personal details"
  collapsible
  defaultExpanded
>
  <FormField name="firstName" label="First Name" {...form.getFieldProps('firstName')} />
  <FormField name="lastName" label="Last Name" {...form.getFieldProps('lastName')} />
  <FormField name="email" label="Email" {...form.getFieldProps('email')} />
</FormSection>
```

### FormActions

Submit and cancel buttons with loading states:

```tsx
<FormActions
  onSubmit={form.handleSubmit}
  onCancel={() => navigate(-1)}
  submitLabel="Save Contact"
  cancelLabel="Cancel"
  isSubmitting={form.isSubmitting}
  isDirty={form.isDirty}
  showCancelConfirm={form.isDirty}
  cancelConfirmMessage="You have unsaved changes. Are you sure you want to cancel?"
/>
```

## Advanced Features

### Conditional Fields

Show/hide fields based on other field values:

```tsx
const form = useBaseForm({
  initialValues: {
    accountType: 'personal',
    companyName: ''
  },
  // ...
});

return (
  <form>
    <FormField
      name="accountType"
      label="Account Type"
      type="select"
      options={[
        { value: 'personal', label: 'Personal' },
        { value: 'business', label: 'Business' }
      ]}
      {...form.getFieldProps('accountType')}
    />
    
    {form.values.accountType === 'business' && (
      <FormField
        name="companyName"
        label="Company Name"
        {...form.getFieldProps('companyName')}
      />
    )}
  </form>
);
```

### Field Dependencies

Validate fields based on other field values:

```tsx
const validationSchema = {
  password: [
    { type: 'required', message: 'Password is required' },
    { type: 'min', value: 8, message: 'Password must be at least 8 characters' }
  ],
  confirmPassword: [
    { type: 'required', message: 'Please confirm password' },
    {
      type: 'custom',
      message: 'Passwords do not match',
      validator: (value, allValues) => value === allValues.password
    }
  ]
};
```

### Auto-Save

Automatically save form data after a delay:

```tsx
const form = useBaseForm({
  initialValues: {...},
  autoSave: true,
  autoSaveDelay: 2000, // Save after 2 seconds of inactivity
  onAutoSave: async (values) => {
    await saveDraft(values);
    toast.success('Draft saved');
  },
  onSubmit: async (values) => {...}
});
```

### Data Transformation

Transform data before submission:

```tsx
const form = useBaseForm({
  initialValues: {...},
  transformBeforeSubmit: (values) => ({
    ...values,
    phone: normalizePhoneNumber(values.phone),
    email: values.email.toLowerCase().trim(),
    tags: values.tags.split(',').map(t => t.trim())
  }),
  onSubmit: async (transformedValues) => {
    await saveContact(transformedValues);
  }
});
```

### Permission-Based Fields

Control field visibility and editability based on permissions:

```tsx
const form = useBaseForm({
  initialValues: {...},
  authContext: useAuth(),
  permissions: {
    read: 'contacts.read',
    update: 'contacts.update'
  },
  fieldPermissions: {
    salary: {
      read: 'contacts.view_salary',
      update: 'contacts.edit_salary'
    },
    ssn: {
      read: 'contacts.view_sensitive',
      update: 'contacts.edit_sensitive'
    }
  },
  onSubmit: async (values) => {...}
});

// Field will only be visible if user has permission
{form.canReadField('salary') && (
  <FormField
    name="salary"
    label="Salary"
    disabled={!form.canUpdateField('salary')}
    {...form.getFieldProps('salary')}
  />
)}
```

## Utilities

### Validation Utilities

```tsx
import {
  validateEmail,
  validatePhone,
  validateURL,
  validateRequired,
  validateMin,
  validateMax,
  validatePattern
} from '../../../framework/frontend/forms/utils/validation';

// Validate email
const emailError = validateEmail('test@example.com');

// Validate phone
const phoneError = validatePhone('1234567890');

// Validate required
const requiredError = validateRequired('', 'Name is required');
```

### Transformation Utilities

```tsx
import {
  normalizePhoneNumber,
  normalizeEmail,
  trimWhitespace,
  capitalizeWords
} from '../../../framework/frontend/forms/utils/transformation';

// Normalize phone number
const phone = normalizePhoneNumber('(123) 456-7890'); // "1234567890"

// Normalize email
const email = normalizeEmail('  Test@Example.COM  '); // "test@example.com"

// Capitalize words
const name = capitalizeWords('john doe'); // "John Doe"
```

## Error Handling

### Display Errors

```tsx
// Inline errors (automatically shown by FormField)
<FormField
  name="email"
  error={form.errors.email}
  {...form.getFieldProps('email')}
/>

// Error summary at top of form
{Object.keys(form.errors).length > 0 && (
  <div className="error-summary">
    <h3>Please fix the following errors:</h3>
    <ul>
      {Object.entries(form.errors).map(([field, error]) => (
        <li key={field}>{error}</li>
      ))}
    </ul>
  </div>
)}

// Server errors
const form = useBaseForm({
  initialValues: {...},
  onSubmit: async (values) => {
    try {
      await saveContact(values);
    } catch (error) {
      if (error.validationErrors) {
        // Set field-specific errors from server
        Object.entries(error.validationErrors).forEach(([field, message]) => {
          form.setFieldError(field, message);
        });
      } else {
        // Set general form error
        form.setFormError(error.message);
      }
    }
  }
});
```

## Styling

The framework uses CSS modules for styling:

```css
/* FormField.css */
.field {
  margin-bottom: 1rem;
}

.label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.input {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--color-border);
  border-radius: 4px;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-light);
}

.error {
  color: var(--color-error);
  font-size: 0.875rem;
  margin-top: 0.25rem;
}

.input.hasError {
  border-color: var(--color-error);
}
```

## Accessibility

- Proper label associations with `htmlFor`
- ARIA attributes for errors (`aria-invalid`, `aria-describedby`)
- Keyboard navigation support
- Focus management
- Screen reader announcements for errors
- Required field indicators

## Best Practices

1. **Always validate on submit** - Even if you validate on change/blur
2. **Provide clear error messages** - Tell users exactly what's wrong and how to fix it
3. **Use appropriate input types** - email, tel, url, etc. for better mobile experience
4. **Mark required fields** - Use visual indicators (asterisk, "required" text)
5. **Disable submit while submitting** - Prevent duplicate submissions
6. **Show loading states** - Let users know the form is processing
7. **Preserve data on errors** - Don't clear the form if submission fails
8. **Use auto-save for long forms** - Prevent data loss
9. **Group related fields** - Use FormSection for better organization
10. **Test with keyboard only** - Ensure full keyboard accessibility

## Migration Guide

### Migrating from Existing Forms

```tsx
// Before
function ContactForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Manual validation
    const newErrors = {};
    if (!name) newErrors.name = 'Name is required';
    if (!email) newErrors.email = 'Email is required';
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    await saveContact({ name, email });
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input value={name} onChange={e => setName(e.target.value)} />
      {errors.name && <span>{errors.name}</span>}
      {/* ... */}
    </form>
  );
}

// After
function ContactForm() {
  const form = useBaseForm({
    initialValues: { name: '', email: '' },
    validationSchema: {
      name: [{ type: 'required', message: 'Name is required' }],
      email: [{ type: 'required', message: 'Email is required' }]
    },
    onSubmit: async (values) => {
      await saveContact(values);
    }
  });
  
  return (
    <form onSubmit={form.handleSubmit}>
      <FormField name="name" label="Name" {...form.getFieldProps('name')} />
      <FormField name="email" label="Email" {...form.getFieldProps('email')} />
      <FormActions onSubmit={form.handleSubmit} isSubmitting={form.isSubmitting} />
    </form>
  );
}
```

## Examples

Complete examples available in the framework:

- Basic form with validation
- Multi-step form
- Form with conditional fields
- Form with auto-save
- Form with file upload
- Form with dynamic fields (add/remove)
- Form with server-side validation

## API Reference

### Types

```tsx
import type {
  ValidationSchema,
  ValidationRule,
  FormPermissions,
  FieldPermissions,
  FormValues,
  FormErrors
} from '../../../framework/frontend/forms';
```

## Requirements

This framework satisfies requirements 12.1-12.6 from the framework migration specification.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- Native form validation API

## License

Part of the MeterItPro framework project.
