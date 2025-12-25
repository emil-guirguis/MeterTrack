# Special Fields MUI Styling Fix - Email, Phone, Country

## Problem
Special field types (email, tel, country) were using custom components that rendered native HTML elements instead of MUI components:
- **Email**: EmailLink component with native `<input type="email">`
- **Phone**: PhoneLink component with native `<input type="tel">`
- **Country**: CountrySelect component with native `<select>`

Result: Inconsistent styling compared to other form fields using MUI.

## Solution
Refactored FormField to use MUI components directly for all special field types:

### Changes Made

#### File: `framework/frontend/components/formfield/FormField.tsx`

**Email Field:**
```typescript
// Before: Used EmailLink component with native input
case 'email':
  if (value && value.trim() !== '' && !isEmailEditing) {
    return <EmailLink ... />
  }
  return <TextField type="email" ... />

// After: Direct MUI TextField
case 'email':
  return (
    <TextField
      type="email"
      variant="outlined"
      ...
    />
  )
```

**Phone Field:**
```typescript
// Before: Used PhoneLink component with native input
case 'tel':
  if (value && value.trim() !== '') {
    return <PhoneLink ... />
  }
  return <TextField type="tel" ... />

// After: Direct MUI TextField
case 'tel':
  return (
    <TextField
      type="tel"
      variant="outlined"
      ...
    />
  )
```

**Country Field:**
```typescript
// Before: Used CountrySelect component with native select
case 'country':
  return <CountrySelect ... />

// After: MUI Select with country list
case 'country':
  return (
    <FormControl variant="outlined">
      <InputLabel>{label}</InputLabel>
      <Select>
        {countries.map(country => (
          <MenuItem key={country.code} value={country.name}>
            {country.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  )
```

**Removed Imports:**
- EmailLink (no longer needed)
- PhoneLink (no longer needed)
- CountrySelect (no longer needed)
- Box (no longer needed)
- useState (no longer needed)

## Result
✅ Email fields now use MUI TextField with Material Design 3 styling
✅ Phone fields now use MUI TextField with Material Design 3 styling
✅ Country fields now use MUI Select with Material Design 3 styling
✅ All form fields now consistently use MUI components
✅ Removed dependency on custom HTML-based components
✅ Simplified FormField component (removed special case logic)

## Benefits
- Consistent Material Design 3 appearance across all field types
- Simplified codebase (removed EmailLink, PhoneLink, CountrySelect components)
- Better maintainability
- All fields now follow the same MUI pattern
