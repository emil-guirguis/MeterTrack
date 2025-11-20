# Card-Based Form Sections Update

## Summary
Updated the framework to provide card-based styling for form sections across the entire system, giving forms a modern, clean appearance similar to popular design systems.

## Changes Made

### Framework Updates

#### 1. FormSection.css (`framework/frontend/forms/components/FormSection.css`)
- **Updated**: Card-based styling with white background, border, rounded corners, and subtle shadow
- **Removed**: Border-bottom separator style
- **Added**: Box shadow for depth (`0 1px 3px rgba(0, 0, 0, 0.05)`)
- **Updated**: Border radius to 8px for consistency
- **Updated**: Spacing between sections to 1.5rem

#### 2. BaseForm.css (`framework/frontend/forms/components/BaseForm.css`)
- **Added**: `.base-form` and `.form-container` classes
- **Purpose**: Provides light gray background for forms containing card sections
- **Features**: 
  - Max width: 800px
  - Padding: 2rem (responsive)
  - Background: Light gray (#f9fafb)
  - Border radius: 8px
  - Responsive adjustments for tablet and mobile

#### 3. Documentation
- **Created**: `framework/frontend/forms/CARD_FORMS_GUIDE.md`
- **Contains**: Usage examples, styling details, CSS variables, and migration guide

### Client Updates

#### ContactForm.tsx
- **Added**: `base-form` class to form element
- **Purpose**: Applies framework's form container styling

#### ContactForm.css
- **Updated**: Section styles to match framework card design
- **Added**: Comments indicating framework inheritance
- **Maintained**: Contact-specific customizations

## Visual Changes

### Before
- Sections separated by horizontal border lines
- Flat appearance
- Less visual hierarchy

### After
- Sections appear as distinct white cards
- Light gray form background
- Subtle shadows for depth
- Clear visual separation between sections
- Modern, clean appearance

## Design Specifications

### Card Sections
```css
background: #ffffff (white)
border: 1px solid #e5e7eb (light gray)
border-radius: 8px
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05)
padding: 1.5rem
margin-bottom: 1.5rem
```

### Form Container
```css
background: #f9fafb (light gray)
max-width: 800px
padding: 2rem
border-radius: 8px
```

## Usage for Developers

### Option 1: Use Framework Components (Recommended)
```tsx
import { FormSection } from '@framework/forms/components';
import '@framework/forms/components/BaseForm.css';

<form className="base-form">
  <FormSection title="Section Title">
    {/* fields */}
  </FormSection>
</form>
```

### Option 2: Use Framework CSS Classes
```tsx
import '@framework/forms/components/BaseForm.css';
import '@framework/forms/components/FormSection.css';

<form className="base-form">
  <div className="form-section">
    <h3 className="form-section__title">Section Title</h3>
    {/* fields */}
  </div>
</form>
```

## Benefits

1. **Consistency**: All forms across the system now have the same modern appearance
2. **Maintainability**: Centralized styling in the framework
3. **Flexibility**: Can be customized via CSS variables
4. **Responsive**: Automatically adjusts for different screen sizes
5. **Accessibility**: Maintains proper semantic structure
6. **Visual Hierarchy**: Clear separation between form sections

## Next Steps

To apply this styling to other forms in the system:
1. Import `@framework/forms/components/BaseForm.css`
2. Add `base-form` class to your form element
3. Use `FormSection` component or `form-section` class for sections
4. Remove any custom border-bottom separator styles

## Files Modified

- `framework/frontend/forms/components/FormSection.css`
- `framework/frontend/forms/components/BaseForm.css`
- `client/frontend/src/features/contacts/ContactForm.tsx`
- `client/frontend/src/features/contacts/ContactForm.css`

## Files Created

- `framework/frontend/forms/CARD_FORMS_GUIDE.md`
- `.utils/.howto/card-based-forms-update.md` (this file)
