# Card-Based Form Sections Guide

The framework now provides card-based styling for form sections, giving your forms a modern, clean appearance with visual separation between sections.

## Quick Start

### 1. Using Framework Components (Recommended)

```tsx
import { FormSection, FormField } from '@framework/forms/components';
import '@framework/forms/components/BaseForm.css';

export const MyForm = () => {
  return (
    <form className="base-form">
      <FormSection title="Personal Information">
        <FormField
          name="name"
          label="Name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
        <FormField
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          onBlur={handleBlur}
          required
        />
      </FormSection>

      <FormSection title="Address" description="Optional shipping information">
        <FormField
          name="street"
          label="Street Address"
          type="text"
          value={formData.street}
          onChange={handleChange}
          onBlur={handleBlur}
        />
      </FormSection>
    </form>
  );
};
```

### 2. Using Custom Sections

If you need custom section markup, you can still use the framework styles:

```tsx
import '@framework/forms/components/BaseForm.css';
import '@framework/forms/components/FormSection.css';

export const MyForm = () => {
  return (
    <form className="base-form">
      <div className="form-section">
        <div className="form-section__header">
          <h3 className="form-section__title">My Section</h3>
        </div>
        <div className="form-section__content">
          {/* Your custom fields */}
        </div>
      </div>
    </form>
  );
};
```

## Styling Details

### Form Container
- **Class**: `.base-form` or `.form-container`
- **Background**: Light gray (`#f9fafb`)
- **Max Width**: 800px
- **Padding**: 2rem (responsive)
- **Border Radius**: 8px

### Form Sections (Cards)
- **Class**: `.form-section`
- **Background**: White (`#ffffff`)
- **Border**: 1px solid light gray
- **Border Radius**: 8px
- **Shadow**: Subtle shadow for depth
- **Spacing**: 1.5rem between sections
- **Padding**: 1.5rem inside

### Visual Hierarchy
Each section appears as a distinct card with:
- White background that stands out from the form's light gray background
- Subtle border and shadow for depth
- Proper spacing between sections
- Clean, modern appearance

## CSS Variables

You can customize the appearance using CSS variables:

```css
:root {
  --color-background: #f9fafb;  /* Form background */
  --color-surface: #ffffff;      /* Section card background */
  --color-border: #e5e7eb;       /* Border color */
  --color-text-primary: #111827; /* Text color */
}
```

## Responsive Design

The framework automatically adjusts padding and spacing for different screen sizes:
- **Desktop**: Full padding and spacing
- **Tablet** (≤768px): Reduced padding
- **Mobile** (≤480px): Minimal padding for small screens

## Migration from Old Style

If you have existing forms with border-bottom separators, update them to use card sections:

**Before:**
```css
.my-form__section {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 1.5rem;
}
```

**After:**
```css
.my-form__section {
  /* Use framework styles or extend them */
  @extend .form-section;
}
```

Or simply add the `form-section` class to your section elements.
