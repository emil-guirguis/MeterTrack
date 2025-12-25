# FormField CSS - Quick Reference Card

## Color Variables

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

### Borders & Outlines
```css
--md-color-outline: #79747e;
--md-color-outline-variant: #cac4d0;
--md-color-border: #d1d5db;
--md-color-border-light: #e5e7eb;
--md-color-border-lighter: #f3f4f6;
```

### Surfaces & Backgrounds
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

## Common Patterns

### Basic Input
```css
.my-input {
  width: 100%;
  padding: 1.25rem 1rem 0.75rem 1rem;
  border: 1px solid var(--md-color-outline);
  border-radius: 4px;
  font-size: 1rem;
  color: var(--md-color-on-surface);
  background-color: var(--md-color-surface);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.my-input:focus {
  outline: none;
  border-color: var(--md-color-primary);
  box-shadow: 0 0 0 1px var(--md-color-primary);
}
```

### Button
```css
.my-button {
  padding: 0.75rem 1rem;
  border: 1px solid var(--md-color-border);
  border-radius: 4px;
  background-color: var(--md-color-surface);
  color: var(--md-color-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.my-button:hover:not(:disabled) {
  background-color: var(--md-color-background-light);
  border-color: var(--md-color-secondary);
}

.my-button:focus:not(:disabled) {
  outline: none;
  border-color: var(--md-color-secondary);
  box-shadow: 0 0 0 1px var(--md-color-secondary);
}

.my-button:disabled {
  opacity: 0.38;
  cursor: not-allowed;
}
```

### Error State
```css
.my-input--error {
  border-color: var(--md-color-error);
}

.my-input--error:focus {
  border-color: var(--md-color-error);
  box-shadow: 0 0 0 1px var(--md-color-error);
}

.my-error-message {
  color: var(--md-color-error);
  font-size: 0.75rem;
  margin-top: 0.375rem;
}
```

### Disabled State
```css
.my-input:disabled {
  background-color: var(--md-color-surface-dim);
  color: var(--md-color-on-surface-variant);
  cursor: not-allowed;
  opacity: 0.38;
  border-color: var(--md-color-outline);
}
```

## Spacing

### Base Spacing
```css
.form-field {
  margin-bottom: 1.5rem;  /* Applied to all fields */
}
```

### Section Spacing
```css
.form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;  /* Between fields in section */
}
```

### Component Spacing
```css
.my-component {
  display: flex;
  gap: 0.5rem;  /* Between component elements */
}
```

## Responsive Breakpoints

```css
/* Desktop (> 1024px) */
@media (min-width: 1025px) {
  /* 3-column layout */
}

/* Tablet (768px - 1024px) */
@media (max-width: 1024px) {
  /* 2-column layout */
}

/* Mobile (640px - 768px) */
@media (max-width: 768px) {
  /* 1-column layout */
}

/* Small Mobile (< 640px) */
@media (max-width: 640px) {
  /* Full-width layout */
  font-size: 16px;  /* iOS zoom prevention */
}
```

## Accessibility

### Focus Visible
```css
.my-element:focus-visible {
  outline: 2px solid var(--md-color-secondary);
  outline-offset: 2px;
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  .my-element {
    transition: none;
  }
}
```

### High Contrast
```css
@media (prefers-contrast: high) {
  .my-element {
    border-width: 2px;
  }
}
```

## DO's and DON'Ts

### ✅ DO
```css
/* Use CSS variables */
border: 1px solid var(--md-color-border);

/* Use base spacing */
margin-bottom: 1.5rem;

/* Use component-specific styles */
.my-button { /* button-specific */ }

/* Use semantic colors */
color: var(--md-color-error);  /* for errors */
```

### ❌ DON'T
```css
/* Don't hardcode colors */
border: 1px solid #d1d5db;

/* Don't redefine base spacing */
.form-field { margin-bottom: 1.5rem; }

/* Don't duplicate color variables */
:root { --md-color-border: #d1d5db; }

/* Don't use wrong colors */
color: #dc2626;  /* Use --md-color-error instead */
```

## File Locations

```
framework/frontend/components/formfield/
├── FormField.css                 ← All colors & base styles
├── DatePickerButton.css          ← Button-specific only
├── DatePickerModal.css           ← Modal-specific only
├── NumberSpinner.css             ← Spinner-specific only
├── CountrySelect.css             ← Select-specific only
├── EmailLink.css                 ← Link-specific only
├── PhoneLink.css                 ← Link-specific only
└── URLLink.css                   ← Link-specific only
```

## Quick Checklist

When creating a new component:
- [ ] Use colors from FormField.css
- [ ] Don't define `:root` colors
- [ ] Use `margin-bottom: 1.5rem` for fields
- [ ] Use `gap` for component spacing
- [ ] Add focus states
- [ ] Add disabled states
- [ ] Add error states
- [ ] Test on mobile
- [ ] Test accessibility

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Colors not applying | Use `var(--md-color-*)` instead of hardcoded colors |
| Spacing wrong | Don't override `.form-field` margin-bottom |
| Button misaligned | Use `flex-shrink: 0` and `align-items: center` |
| Focus ring missing | Add `:focus` or `:focus-visible` styles |
| Mobile looks bad | Check responsive breakpoints |
| Colors inconsistent | Use variables from FormField.css |

## Transition Timing

```css
/* Standard transition */
transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);

/* Fast transition */
transition: all 0.15s ease-in-out;

/* Slow transition */
transition: all 0.3s ease-in-out;
```

## Z-Index Scale

```css
--z-dropdown: 100;
--z-modal: 1000;
--z-tooltip: 1100;
--z-notification: 1200;
```

## Print Styles

```css
@media print {
  .my-element {
    border: 1px solid #000;
    background: white;
    color: black;
    box-shadow: none;
  }
}
```

---

**Print this card and keep it handy!**

For more details, see:
- DEVELOPER_GUIDE.md - Full patterns and examples
- ARCHITECTURE.md - CSS structure and hierarchy
- BEFORE_AFTER.md - Code comparisons
