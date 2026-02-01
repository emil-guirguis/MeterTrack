# Fix Applied: Elements Field Cleaning

## Problem
The frontend was still sending `"elements": null` in the API payload when creating meters, even though:
1. MeterForm was passing `fieldsToClean={['id', 'elements']}`
2. The `elements` field was defined with `dbField: null` in the schema

This caused the error: "Column 'elements' does not exist in table 'meter'"

## Root Cause
In `BaseForm.tsx`, the `formDataToEntity` function was:
1. Calling `formSchema.toApi(formData)` which included the `elements` field
2. Then trying to delete it from the result

However, the `formSchema.toApi()` function includes ALL fields from formData, even if they're not in the schema. So the `elements` field was being included before the cleanup logic could remove it.

## Solution
Modified the `formDataToEntity` function in `framework/frontend/components/form/BaseForm.tsx` to:
1. **Filter out fields with `dbField: null` BEFORE calling `toApi()`**
2. This prevents custom-rendered fields like "elements" from being included in the API payload

### Code Change
```typescript
// CRITICAL: Filter out fields with dbField: null BEFORE calling toApi()
// This prevents custom-rendered fields like "elements" from being included in the API payload
const cleanFormData: any = { ...formData };
Object.entries(allFormFields).forEach(([fieldName, fieldDef]: [string, any]) => {
  if (fieldDef.dbField === null) {
    delete cleanFormData[fieldName];
  }
});

const formSchema = createFormSchema(allFormFields);
const apiData = formSchema.toApi(cleanFormData);
```

## Files Modified
- `framework/frontend/components/form/BaseForm.tsx` (lines 335-375)

## Testing
1. Create a physical meter - should work without errors
2. Create a virtual meter - should hide device fields and save successfully
3. Check browser console - should NOT see `"elements": null` in the API request payload

## Backend Status
The backend already has a fallback that deletes the `elements` field (line 363 in `client/backend/src/routes/meters.js`), but this fix prevents it from being sent in the first place.
