# FormField CSS Architecture

## CSS Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    FormField.css (Base)                     │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ :root - All Color Variables                          │  │
│  │ ├─ Primary colors                                    │  │
│  │ ├─ Error & success colors                            │  │
│  │ ├─ Border & outline colors                           │  │
│  │ ├─ Surface & background colors                       │  │
│  │ ├─ Text colors                                       │  │
│  │ ├─ Focus & overlay colors                            │  │
│  │ └─ Legacy color aliases                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Base Styles                                          │  │
│  │ ├─ .form-field (spacing: margin-bottom: 1.5rem)     │  │
│  │ ├─ .form-field__label (floating label animation)    │  │
│  │ ├─ .form-field__input (base input styling)          │  │
│  │ ├─ .form-field__textarea (textarea styling)         │  │
│  │ ├─ .form-field__select (select styling)             │  │
│  │ ├─ .form-field__checkbox (checkbox styling)         │  │
│  │ ├─ .form-field__radio (radio styling)               │  │
│  │ └─ .form-field__error (error message styling)       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ State Styles                                         │  │
│  │ ├─ :focus (focus state)                             │  │
│  │ ├─ :disabled (disabled state)                       │  │
│  │ ├─ --error (error state)                            │  │
│  │ └─ :placeholder-shown (placeholder state)           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Responsive & Accessibility                          │  │
│  │ ├─ @media (max-width: 640px) - Mobile               │  │
│  │ ├─ @media (max-width: 480px) - Small mobile         │  │
│  │ ├─ @media (prefers-reduced-motion: reduce)          │  │
│  │ ├─ @media (prefers-contrast: high)                  │  │
│  │ └─ @media print                                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
         ↓ Inherited by all component-specific CSS ↓
```

## Component-Specific CSS Files

```
┌──────────────────────────────────────────────────────────────┐
│           Component-Specific CSS Files                       │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DatePickerButton.css                                │   │
│  │ ├─ .date-picker-button (button layout & sizing)    │   │
│  │ ├─ :hover, :focus, :active, :disabled states      │   │
│  │ └─ @media responsive styles                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ DatePickerModal.css                                 │   │
│  │ ├─ .date-picker-modal (modal layout)               │   │
│  │ ├─ .date-picker-modal__calendar (calendar grid)    │   │
│  │ ├─ .date-picker-modal__day (day cell styling)      │   │
│  │ ├─ .date-picker-modal__year (year picker)          │   │
│  │ └─ @media responsive styles                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ NumberSpinner.css                                   │   │
│  │ ├─ .number-spinner (flex layout)                   │   │
│  │ ├─ .number-spinner__button (button styling)        │   │
│  │ ├─ .number-spinner__button--up (up button)         │   │
│  │ ├─ .number-spinner__button--down (down button)     │   │
│  │ └─ @media responsive styles                        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CountrySelect.css                                   │   │
│  │ ├─ .country-select-wrapper (wrapper)               │   │
│  │ ├─ .country-select (select styling)                │   │
│  │ ├─ .country-select--error (error state)            │   │
│  │ └─ .country-select-error (error message)           │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ EmailLink.css                                       │   │
│  │ ├─ .email-link__wrapper (wrapper)                  │   │
│  │ ├─ .email-link__input (input styling)              │   │
│  │ ├─ .email-link__link (link styling)                │   │
│  │ └─ State styles (:hover, :focus, :disabled)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ PhoneLink.css                                       │   │
│  │ ├─ .phone-link__wrapper (wrapper)                  │   │
│  │ ├─ .phone-link__input (input styling)              │   │
│  │ ├─ .phone-link__link (link styling)                │   │
│  │ └─ State styles (:hover, :focus, :disabled)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ URLLink.css                                         │   │
│  │ ├─ .url-link (link styling)                        │   │
│  │ ├─ .url-link__input (input styling)                │   │
│  │ └─ State styles (:hover, :focus, :disabled)        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## CSS Cascade Flow

```
User Agent Styles
        ↓
FormField.css (Base)
├─ :root (color variables)
├─ .form-field (spacing)
├─ .form-field__input (base styling)
├─ .form-field__input:focus (focus state)
├─ .form-field__input--error (error state)
└─ @media queries (responsive)
        ↓
Component-Specific CSS
├─ DatePickerButton.css
│  ├─ .date-picker-button (component layout)
│  ├─ .date-picker-button:hover (component hover)
│  └─ @media queries (component responsive)
├─ NumberSpinner.css
│  ├─ .number-spinner (component layout)
│  ├─ .number-spinner__button (component button)
│  └─ @media queries (component responsive)
└─ [Other component CSS files]
        ↓
Computed Styles (Applied to DOM)
```

## Color Variable Organization

```
FormField.css :root
│
├─ Primary Colors
│  ├─ --md-color-primary: #6200ea
│  ├─ --md-color-secondary: #3b82f6
│  ├─ --md-color-secondary-dark: #2563eb
│  └─ --md-color-secondary-darker: #1d4ed8
│
├─ Status Colors
│  ├─ --md-color-error: #b3261e
│  └─ --md-color-success: #10b981
│
├─ Border & Outline
│  ├─ --md-color-outline: #79747e
│  ├─ --md-color-outline-variant: #cac4d0
│  ├─ --md-color-border: #d1d5db
│  ├─ --md-color-border-light: #e5e7eb
│  └─ --md-color-border-lighter: #f3f4f6
│
├─ Surface & Background
│  ├─ --md-color-surface: #fffbfe
│  ├─ --md-color-surface-dim: #ded8e1
│  ├─ --md-color-background-light: #f0f9ff
│  ├─ --md-color-background-lighter: #e0f2fe
│  └─ --md-color-background-highlight: #fefce8
│
├─ Text Colors
│  ├─ --md-color-on-surface: #1c1b1f
│  ├─ --md-color-on-surface-variant: #49454e
│  ├─ --md-color-text-primary: #1f2937
│  ├─ --md-color-text-secondary: #6b7280
│  └─ --md-color-text-disabled: #9ca3af
│
├─ Focus & Overlay
│  ├─ --md-color-focus-ring: rgba(59, 130, 246, 0.1)
│  ├─ --md-color-error-ring: rgba(239, 68, 68, 0.1)
│  ├─ --md-color-success-ring: rgba(16, 185, 129, 0.1)
│  └─ --md-color-overlay: rgba(0, 0, 0, 0.5)
│
└─ Legacy Aliases (Backward Compatibility)
   ├─ --color-primary: #3b82f6
   ├─ --color-error: #ef4444
   ├─ --color-border: #e5e7eb
   ├─ --color-text-primary: #111827
   ├─ --color-text-secondary: #6b7280
   ├─ --color-text-disabled: #9ca3af
   ├─ --color-text-placeholder: #9ca3af
   ├─ --color-surface: #ffffff
   └─ --color-background-disabled: #f9fafb
```

## Component Composition Example

### DatePickerButton Component

```
┌─────────────────────────────────────────────────────┐
│ DatePickerButton Component                          │
│                                                     │
│ ┌──────────────────────────────────────────────┐   │
│ │ FormField.css (Base)                         │   │
│ │ ├─ Color variables                           │   │
│ │ ├─ .form-field (spacing: 1.5rem bottom)      │   │
│ │ └─ Focus/disabled states                     │   │
│ └──────────────────────────────────────────────┘   │
│                    ↓ Inherited                      │
│ ┌──────────────────────────────────────────────┐   │
│ │ DatePickerButton.css (Component-Specific)   │   │
│ │ ├─ .date-picker-button (2.5rem × 2.5rem)    │   │
│ │ ├─ Button layout & positioning               │   │
│ │ ├─ Hover/focus/active states                 │   │
│ │ └─ Responsive sizing                         │   │
│ └──────────────────────────────────────────────┘   │
│                    ↓ Combined                       │
│ ┌──────────────────────────────────────────────┐   │
│ │ Final Rendered Button                        │   │
│ │ ├─ Uses colors from FormField.css            │   │
│ │ ├─ Uses spacing from FormField.css           │   │
│ │ ├─ Uses component-specific sizing            │   │
│ │ └─ All states properly styled                │   │
│ └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Spacing Model

```
┌─────────────────────────────────────────────────────┐
│ Form Section                                        │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ FormField 1                                  │  │
│  │ ├─ Label                                     │  │
│  │ ├─ Input                                     │  │
│  │ └─ Error message                             │  │
│  │                                              │  │
│  │ margin-bottom: 1.5rem (from FormField.css)  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ FormField 2                                  │  │
│  │ ├─ Label                                     │  │
│  │ ├─ Input                                     │  │
│  │ └─ Error message                             │  │
│  │                                              │  │
│  │ margin-bottom: 1.5rem (from FormField.css)  │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
│  ┌──────────────────────────────────────────────┐  │
│  │ FormField 3                                  │  │
│  │ ├─ Label                                     │  │
│  │ ├─ Input                                     │  │
│  │ └─ Error message                             │  │
│  │                                              │  │
│  │ margin-bottom: 0 (last field)                │  │
│  └──────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Responsive Breakpoints

```
Desktop (> 1024px)
├─ 3-column layout
├─ Full-size buttons
└─ Standard spacing

Tablet (768px - 1024px)
├─ 2-column layout
├─ Medium-size buttons
└─ Adjusted spacing

Mobile (640px - 768px)
├─ 1-column layout
├─ Smaller buttons
└─ Reduced spacing

Small Mobile (< 640px)
├─ Full-width layout
├─ Minimal buttons
├─ Minimal spacing
└─ 16px font size (iOS zoom prevention)
```

## CSS Specificity

```
FormField.css
├─ Element selectors (low specificity)
│  └─ .form-field__input { }
│
├─ Class selectors (medium specificity)
│  └─ .form-field__input:focus { }
│
└─ Pseudo-class selectors (medium specificity)
   └─ .form-field__input:disabled { }

Component CSS
├─ Element selectors (low specificity)
│  └─ .date-picker-button { }
│
└─ Pseudo-class selectors (medium specificity)
   └─ .date-picker-button:hover { }

Result: No specificity conflicts, clean cascade
```

---

This architecture ensures:
- ✅ Single source of truth for colors
- ✅ Consistent spacing across all fields
- ✅ Easy to maintain and update
- ✅ Scalable for new components
- ✅ No specificity conflicts
- ✅ Responsive and accessible
