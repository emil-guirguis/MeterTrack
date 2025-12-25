# Design Document: Enhanced FormField with Date Picker, Number Spinner, and Link Support

## Overview

This design enhances the FormField component to provide specialized UI controls for different field types:
- **Date fields**: Interactive calendar date picker with modal interface
- **Number fields**: Spinner controls (up/down arrows) for value adjustment
- **Email fields**: Clickable mailto links with edit mode toggle
- **URL fields**: Clickable links that open in new tabs with protocol handling

The implementation leverages Material-UI components already available in the project and maintains backward compatibility with existing FormField usage.

## Architecture

### Component Structure

```
FormField (enhanced)
├── Input/Textarea/Select (base input)
├── DatePickerButton (new)
│   └── DatePickerModal
│       ├── Calendar Navigation
│       ├── Month/Year Display
│       ├── Date Grid
│       └── Close/Cancel Controls
├── NumberSpinner (new)
│   ├── Up Arrow Button
│   └── Down Arrow Button
├── EmailLink (new)
│   ├── Link Display (read mode)
│   └── Input Field (edit mode)
└── URLLink (new)
    ├── Link Display (read mode)
    └── Input Field (edit mode)
```

### Data Flow

1. **Date Picker Flow**:
   - User clicks calendar button → Modal opens
   - User navigates months/years → Calendar updates
   - User selects date → Value updates → Modal closes

2. **Number Spinner Flow**:
   - User clicks up/down arrow → Value increments/decrements
   - Constraints (min/max) are checked before updating
   - onChange callback fires with new value

3. **Email/URL Link Flow**:
   - Component renders in display mode as link
   - User clicks to edit → Switches to input mode
   - User saves/blurs → Switches back to link mode

## Components and Interfaces

### Enhanced FormField Props

```typescript
export interface FormFieldProps {
  name: string;
  label?: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select' | 
         'checkbox' | 'radio' | 'date' | 'time' | 'url' | 'tel' | 'search';
  value: any;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  options?: FormFieldOption[];
  rows?: number;
  min?: number | string;
  max?: number | string;
  step?: number | string;
  onChange: (e: React.ChangeEvent<...>) => void;
  onBlur: (e: React.FocusEvent) => void;
  className?: string;
}
```

### New Sub-Components

#### DatePickerButton Component
- Renders calendar icon button next to date input
- Opens DatePickerModal on click
- Displays selected date in ISO 8601 format

#### DatePickerModal Component
- Modal dialog with calendar interface
- Month/year navigation controls
- Date grid with disabled dates outside min/max range
- Currently selected date highlighted
- Close button, Escape key, and backdrop click handling

#### NumberSpinner Component
- Up/down arrow buttons flanking number input
- Increments/decrements by step value
- Respects min/max constraints
- Disabled state when at boundaries

#### EmailLink Component
- Displays email as blue hyperlink in read mode
- Shows standard email input in edit mode
- Generates mailto: links
- Handles empty values gracefully

#### URLLink Component
- Displays URL as blue hyperlink in read mode
- Shows standard URL input in edit mode
- Opens links in new tab (target="_blank")
- Prepends https:// if protocol missing
- Handles empty values gracefully

## Data Models

### Date Value Model
```typescript
interface DateValue {
  value: string; // ISO 8601 format: YYYY-MM-DD
  isValid: boolean;
  error?: string;
}
```

### Number Value Model
```typescript
interface NumberValue {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  isValid: boolean;
  error?: string;
}
```

### Link Value Model
```typescript
interface LinkValue {
  value: string;
  isEditing: boolean;
  isValid: boolean;
  error?: string;
}
```

## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Date Picker Properties

**Property 1: Calendar button appears for date fields**
*For any* FormField with type 'date', the rendered component should contain a calendar button element adjacent to the input field.
**Validates: Requirements 1.1**

**Property 2: Date selection updates value in ISO format**
*For any* date value selected from the calendar, the FormField input value should be updated to that date in ISO 8601 format (YYYY-MM-DD).
**Validates: Requirements 1.3**

**Property 3: Modal closes after date selection**
*For any* date selection from the calendar, the modal should automatically close after the value is updated.
**Validates: Requirements 1.4**

**Property 4: Selected date is highlighted in calendar**
*For any* FormField with an existing date value, opening the date picker should display that date highlighted in the calendar.
**Validates: Requirements 1.5**

**Property 5: Month navigation advances correctly**
*For any* month in the calendar, clicking the next month button should advance to the following month, and clicking previous should go to the prior month.
**Validates: Requirements 2.2, 2.3**

**Property 6: Year selection returns to month view**
*For any* year selected from the year picker, the calendar should return to month view displaying that year.
**Validates: Requirements 2.5**

**Property 7: Modal closes without value change**
*For any* FormField with an initial date value, closing the modal via close button, Escape key, or backdrop click should preserve the original value.
**Validates: Requirements 3.2, 3.3, 3.4**

**Property 8: Disabled dates respect constraints**
*For any* date field with min and max constraints, dates outside the allowed range should be disabled and unselectable in the calendar.
**Validates: Requirements 4.1**

**Property 9: Validation errors clear on valid selection**
*For any* FormField with a validation error, selecting a valid date from the calendar should clear the error message.
**Validates: Requirements 4.4**

### Number Spinner Properties

**Property 10: Spinner buttons appear for number fields**
*For any* FormField with type 'number', the rendered component should contain up and down arrow buttons adjacent to the input field.
**Validates: Requirements 5.1**

**Property 11: Up arrow increments by step**
*For any* number field with a step value, clicking the up arrow should increase the value by exactly that step amount.
**Validates: Requirements 5.2**

**Property 12: Down arrow decrements by step**
*For any* number field with a step value, clicking the down arrow should decrease the value by exactly that step amount.
**Validates: Requirements 5.3**

**Property 13: Max constraint prevents increment**
*For any* number field with a max value, clicking the up arrow when at or above the max should not increase the value beyond the maximum.
**Validates: Requirements 5.4**

**Property 14: Min constraint prevents decrement**
*For any* number field with a min value, clicking the down arrow when at or below the min should not decrease the value below the minimum.
**Validates: Requirements 5.5**

### Email Link Properties

**Property 15: Email displays as blue link**
*For any* FormField with type 'email' and a non-empty value, the component should render the email as a blue hyperlink with pointer cursor styling.
**Validates: Requirements 6.1**

**Property 16: Email link generates mailto**
*For any* email value, the rendered link should have an href attribute starting with 'mailto:' followed by the email address.
**Validates: Requirements 6.2**

**Property 17: Edit mode shows input field**
*For any* email field in edit mode, the component should display a standard email input field instead of a link.
**Validates: Requirements 6.3**

**Property 18: Empty email shows input field**
*For any* email field with an empty value, the component should display an input field without creating a link.
**Validates: Requirements 6.4**

### URL Link Properties

**Property 19: URL displays as blue link**
*For any* FormField with type 'url' and a non-empty value, the component should render the URL as a blue hyperlink with pointer cursor styling.
**Validates: Requirements 7.1**

**Property 20: URL link opens in new tab**
*For any* URL value, the rendered link should have target="_blank" to open in a new browser tab.
**Validates: Requirements 7.2**

**Property 21: Edit mode shows input field**
*For any* URL field in edit mode, the component should display a standard URL input field instead of a link.
**Validates: Requirements 7.3**

**Property 22: Empty URL shows input field**
*For any* URL field with an empty value, the component should display an input field without creating a link.
**Validates: Requirements 7.4**

**Property 23: Protocol is prepended to URLs**
*For any* URL value without a protocol prefix, the component should prepend 'https://' before opening the link in a browser.
**Validates: Requirements 7.5**

## Error Handling

### Date Picker Errors
- Invalid date format: Display validation error message
- Date outside min/max range: Disable in calendar, show error if manually entered
- Required field empty: Show required field error

### Number Spinner Errors
- Value exceeds max: Clamp to max, show warning if applicable
- Value below min: Clamp to min, show warning if applicable
- Non-numeric input: Show validation error

### Email/URL Link Errors
- Invalid email format: Show validation error, display as input field
- Invalid URL format: Show validation error, display as input field
- Empty required field: Show required field error

## Testing Strategy

### Unit Testing Approach
- Test individual components in isolation
- Verify correct rendering of UI elements (buttons, links, inputs)
- Test state transitions (edit mode, modal open/close)
- Test constraint enforcement (min/max, required fields)
- Test error message display and clearing

### Property-Based Testing Approach
- Use Vitest with fast-check for property-based tests
- Generate random dates, numbers, emails, and URLs
- Verify properties hold across all generated inputs
- Test edge cases: boundary values, empty values, special characters
- Minimum 100 iterations per property test
- Each property test tagged with requirement reference

### Test Coverage Areas
1. **Date Picker**: Calendar rendering, navigation, selection, modal behavior, constraints
2. **Number Spinner**: Increment/decrement, constraints, boundary conditions
3. **Email Links**: Link generation, edit mode, validation
4. **URL Links**: Link generation, protocol handling, edit mode, validation
5. **Integration**: FormField with validation, error handling, onChange callbacks

### Testing Libraries
- **Unit Tests**: Vitest + React Testing Library
- **Property-Based Tests**: fast-check (already in dependencies)
- **Accessibility**: jest-axe for a11y testing

