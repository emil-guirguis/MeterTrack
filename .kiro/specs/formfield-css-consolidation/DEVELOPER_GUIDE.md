# FormField CSS - Developer Guide

## Quick Reference

### When Creating a New FormField Component

**DO:**
```css
/* MyCustomField.css */
/* Only include component-specific styles */

.my-custom-field {
  display: flex;
  gap: 0.5rem;
}

.my-custom-field__button {
  padding: 0.5rem 1rem;
  border: 1px solid var(--md-color-border);
  background-color: var(--md-color-surface);
  color: var(--md-color-text-secondary);
}

.my-custom-field__button:hover {
  background-color: var(--md-color-background-light);
}
```

**DON'T:**
```css
/* ❌ Don't redefine colors */
:root {
  --md-color-border: #d1d5db;
  --md-color-surface: #ffffff;
}

/* ❌ Don't redefine base spacing */
.my-custom-field {
  margin-bottom: 1.5rem;
}
```

## Available Color Variables

All colors are defined in `FormField.css` and available globally:

### Primary Colors
```css
--md-color-primary: #6200ea;
--md-color-secondary: #3b82f6;
--md-color-secondary-dark: #2563eb;
--md-color-secondary-darker: #1d4ed8;
```

### Status Colors
```css
--md-color-error: #b3261e;
--md-color-success: #10b981;
```

### Border & Outline
```css
--md-color-outline: #79747e;
--md-color-outline-variant: #cac4d0;
--md-color-border: #d1d5db;
--md-color-border-light: #e5e7eb;
--md-color-border-lighter: #f3f4f6;
```

### Surface & Background
```css
--md-color-surface: #fffbfe;
--md-color-surface-dim: #ded8e1;
--md-color-background-light: #f0f9ff;
--md-color-background-lighter: #e0f2fe;
--md-color-background-highlight: #fefce8;
```

### Text Colors
```css
--md-color-on-surface: #1c1b1f;
--md-color-on-surface-variant: #49454e;
--md-color-text-primary: #1f2937;
--md-color-text-secondary: #6b7280;
--md-color-text-disabled: #9ca3af;
```

### Focus & Overlay
```css
--md-color-focus-ring: rgba(59, 130, 246, 0.1);
--md-color-error-ring: rgba(239, 68, 68, 0.1);
--md-color-success-ring: rgba(16, 185, 129, 0.1);
--md-color-overlay: rgba(0, 0, 0, 0.5);
```

### Legacy Aliases (for backward compatibility)
```css
--color-primary: #3b82f6;
--color-error: #ef4444;
--color-border: #e5e7eb;
--color-text-primary: #111827;
--color-text-secondary: #6b7280;
--color-text-disabled: #9ca3af;
--color-text-placeholder: #9ca3af;
--color-surface: #ffffff;
--color-background-disabled: #f9fafb;
```

## Base Spacing

All form fields automatically get:
```css
.form-field {
  margin-bottom: 1.5rem;
}
```

**Don't override this** unless you have a specific reason. Use flexbox `gap` or grid `gap` in parent containers instead.

## Component Structure Example

### DatePickerButton
```
FormField.css (base)
  ├─ .form-field (spacing, layout)
  ├─ .form-field__input (styling)
  └─ .form-field__label (styling)

DatePickerButton.css (component-specific)
  └─ .date-picker-button (button layout & sizing)
      ├─ :hover
      ├─ :focus
      └─ :disabled
```

## Common Patterns

### Button in FormField
```css
.my-field__button {
  padding: 0.75rem 1rem;
  border: 1px solid var(--md-color-border);
  border-left: none;
  border-radius: 0 4px 4px 0;
  background-color: var(--md-color-surface);
  color: var(--md-color-secondary);
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.my-field__button:hover:not(:disabled) {
  background-color: var(--md-color-background-light);
  border-color: var(--md-color-secondary);
}

.my-field__button:focus:not(:disabled) {
  outline: none;
  border-color: var(--md-color-secondary);
  box-shadow: 0 0 0 1px var(--md-color-secondary);
}

.my-field__button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
```

### Input with Error State
```css
.my-field__input {
  width: 100%;
  padding: 1.25rem 1rem 0.75rem 1rem;
  border: 1px solid var(--md-color-outline);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--md-color-on-surface);
  background-color: var(--md-color-surface);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.my-field__input:focus {
  outline: none;
  border-color: var(--md-color-primary);
  box-shadow: 0 0 0 1px var(--md-color-primary);
}

.my-field__input--error {
  border-color: var(--md-color-error);
}

.my-field__input--error:focus {
  border-color: var(--md-color-error);
  box-shadow: 0 0 0 1px var(--md-color-error);
}
```

## Responsive Design

Base FormField.css includes responsive breakpoints:
- `@media (max-width: 640px)` - Mobile
- `@media (max-width: 480px)` - Small mobile (iOS zoom prevention)

Add component-specific responsive styles in your component CSS file:
```css
@media (max-width: 640px) {
  .my-field__button {
    width: 2rem;
    height: 2rem;
  }
}
```

## Accessibility

Base FormField.css includes:
- `:focus-visible` support
- High contrast mode support (`@media (prefers-contrast: high)`)
- Reduced motion support (`@media (prefers-reduced-motion: reduce)`)
- Print styles

Use these in your component CSS:
```css
.my-field__button:focus-visible {
  outline: 2px solid var(--md-color-secondary);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  .my-field__button {
    transition: none;
  }
}
```

## Troubleshooting

### Colors not applying?
- Check that FormField.css is imported before your component CSS
- Use `var(--md-color-*)` variables instead of hardcoded colors
- Verify CSS specificity isn't being overridden

### Spacing issues?
- Don't override `.form-field` margin-bottom
- Use parent container `gap` or `margin` instead
- Check MeterForm.css for section-specific spacing

### Button alignment?
- Use flexbox with `align-items: center`
- Set `flex-shrink: 0` to prevent button squishing
- Use `gap` for spacing between elements

## File Organization

```
framework/frontend/components/formfield/
├── FormField.css                 (base - all colors & spacing)
├── FormField.tsx
├── DatePickerButton.css          (component-specific)
├── DatePickerButton.tsx
├── DatePickerModal.css           (component-specific)
├── DatePickerModal.tsx
├── NumberSpinner.css             (component-specific)
├── NumberSpinner.tsx
├── CountrySelect.css             (component-specific)
├── CountrySelect.tsx
├── EmailLink.css                 (component-specific)
├── EmailLink.tsx
├── PhoneLink.css                 (component-specific)
├── PhoneLink.tsx
├── URLLink.css                   (component-specific)
└── URLLink.tsx
```

Each component CSS file should be **minimal** and contain **only** component-specific styles.
