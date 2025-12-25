# ValidationFieldSelect MUI Styling Fix

## Problem
The ValidationFieldSelect component (used for foreign key relationships like Device and Location) was rendering a native HTML `<select>` element instead of using MUI components, resulting in inconsistent styling compared to other form fields.

## Solution
Refactored ValidationFieldSelect to use FormField with MUI Select component:

### Changes Made

#### File: `framework/frontend/components/validationfieldselect/ValidationFieldSelect.tsx`

**Before:**
- Rendered native HTML `<select>` element
- Used custom CSS classes for styling
- Inconsistent with other form fields

**After:**
- Uses FormField component with `type="select"`
- Leverages MUI Select for Material Design 3 styling
- Consistent appearance with all other form fields
- Same validation and error handling

```typescript
// Before: Native HTML select
<select
  id={fieldName}
  value={value ? String(value) : ''}
  onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
  className={`${selectClassName} ${error ? `${inputClassName}--error` : ''}`}
  disabled={isDisabled}
>
  <option value="">{placeholderText}</option>
  {options.map((option) => (
    <option key={option.id} value={String(option.id)}>
      {option.label}
    </option>
  ))}
</select>

// After: FormField with MUI Select
<FormField
  name={fieldName}
  label={fieldDef.label}
  type="select"
  value={value || ''}
  error={error}
  touched={!!error}
  help={fieldDef.description}
  required={fieldDef.required}
  disabled={isDisabled || loading}
  placeholder={placeholderText}
  options={formFieldOptions}
  onChange={(e: any) => onChange(e.target.value ? parseInt(e.target.value) : null)}
  onBlur={() => {}}
/>
```

## Result
✅ ValidationFieldSelect now uses MUI Select component
✅ Material Design 3 outlined styling applied
✅ Consistent appearance with all other form fields
✅ Device, Location, and other foreign key fields now have proper MUI styling
✅ All form fields now use FormField component
