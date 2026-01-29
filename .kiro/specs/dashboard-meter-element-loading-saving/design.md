# Dashboard Meter Element Loading/Saving - Design

## Problem Analysis

### Current Issues

1. **Duplicate API Endpoint**
   - `GET /api/dashboard/meters/:meterId/elements` defined twice in `dashboard.js`
   - Lines 1065-1143 and 1144-1200 have conflicting implementations
   - Second definition overrides first, causing unpredictable behavior

2. **Field Name Mismatch**
   - Backend returns: `{ meter_element_id, element, name, meter_id }`
   - Frontend expects: `{ id, element, name, meter_id }`
   - Frontend code tries to access `element.id` which is undefined
   - Dropdown population fails silently

3. **Type Inconsistency**
   - Form initialization converts `meter_element_id` to string: `card.meter_element_id?.toString()`
   - Select component value is string but MenuItem values are numbers
   - React controlled component warnings occur
   - Selected value doesn't match any MenuItem, dropdown appears empty

4. **Form Data Binding**
   - When meter is selected, `meter_element_id` is cleared to empty string
   - When editing, meter_element_id is converted to string
   - Select component can't match string value to numeric MenuItem values
   - Validation fails because field appears empty

## Solution Design

### 1. Fix Backend API Response (dashboard.js)

**Action:** Remove duplicate endpoint and standardize response

```javascript
// Keep only ONE implementation of GET /api/dashboard/meters/:meterId/elements
// Standardize response format to match frontend expectations

router.get('/meters/:meterId/elements', requirePermission('dashboard:read'), asyncHandler(async (req, res) => {
  // ... validation code ...
  
  const elements = await MeterElements.findAll({
    where: { meter_id: meterId, tenant_id: tenantId },
    limit: 1000
  });

  res.json({
    success: true,
    data: elements.rows.map(el => ({
      id: el.meter_element_id || el.id,  // Map to 'id' for frontend
      meter_element_id: el.meter_element_id || el.id,  // Keep for clarity
      element: el.element,
      name: el.name,
      meter_id: el.meter_id
    }))
  });
}));
```

**Changes:**
- Remove lines 1144-1200 (duplicate endpoint)
- Add `id` field to response mapping
- Keep `meter_element_id` for backward compatibility
- Ensure consistent field ordering

### 2. Fix Frontend Form Initialization (DashboardCardModal.tsx)

**Action:** Keep meter_element_id as number, don't convert to string

```typescript
// Current (WRONG):
meter_element_id: card.meter_element_id?.toString() || ''

// Fixed (CORRECT):
meter_element_id: card.meter_element_id || ''
```

**Changes:**
- Remove `.toString()` conversion
- Keep as number or empty string
- Ensure type consistency throughout form lifecycle

### 3. Fix Select Component Value Binding (DashboardCardModal.tsx)

**Action:** Ensure Select value is always a number when meter_element_id exists

```typescript
// In Select component:
<Select
  label="Meter Element *"
  name="meter_element_id"
  value={formData.meter_element_id ? Number(formData.meter_element_id) : ''}
  onChange={handleFieldChange}
>
  <MenuItem value="">
    <em>-- Select a meter element --</em>
  </MenuItem>
  {meterElements && meterElements.map(element => (
    <MenuItem key={element.id} value={element.id}>
      {element.element ? `${element.element} - ${element.name}` : element.name}
    </MenuItem>
  ))}
</Select>
```

**Changes:**
- Convert value to number when present: `Number(formData.meter_element_id)`
- Use `element.id` from response (which now includes the mapped id field)
- Ensure MenuItem values are numbers

### 4. Fix Form Submission (DashboardCardModal.tsx)

**Action:** Ensure meter_element_id is sent as number to backend

```typescript
// In handleSubmit:
const submitData = {
  ...formData,
  meter_element_id: formData.meter_element_id ? Number(formData.meter_element_id) : null
};
```

**Changes:**
- Convert to number before submission
- Handle empty/null case
- Ensure backend receives correct type

### 5. Fix Validation Logic (DashboardCardModal.tsx)

**Action:** Update validation to work with correct field names

```typescript
if (formData.meter_element_id) {
  const selectedElement = meterElements.find(
    el => el.id === Number(formData.meter_element_id)
  );
  if (!selectedElement) {
    newErrors.meter_element_id = 'Selected meter element is not available';
  }
}
```

**Changes:**
- Use `el.id` instead of `el.meter_element_id`
- Ensure numeric comparison
- Clear error message

## Data Flow (Fixed)

### Creating a Card
1. User selects meter → `onMeterSelect(meterId)` called
2. API: `GET /dashboard/meters/{meterId}/elements`
3. Backend returns: `[{ id: 1, meter_element_id: 1, element: 'Power', name: 'Main Power', meter_id: 5 }, ...]`
4. Frontend stores in `meterElements` state
5. Dropdown renders with `element.id` (now defined)
6. User selects element → `formData.meter_element_id = 1` (number)
7. Form submitted with `meter_element_id: 1`
8. Backend validates and saves

### Editing a Card
1. Card loaded with `meter_element_id: 1` (number)
2. Form initializes: `meter_element_id: 1` (stays as number)
3. Meter elements fetched for that meter
4. Select value: `Number(1)` = `1`
5. MenuItem values: `element.id` = `1`
6. **Result**: Dropdown correctly shows selected element

## Implementation Steps

1. **Backend (dashboard.js)**
   - Remove duplicate endpoint (lines 1144-1200)
   - Update response mapping to include `id` field
   - Add logging to verify response format

2. **Frontend (DashboardCardModal.tsx)**
   - Remove `.toString()` from form initialization
   - Update Select component value binding
   - Update MenuItem rendering to use `element.id`
   - Update form submission to ensure numeric type
   - Update validation logic

3. **Testing**
   - Create new dashboard card with meter element
   - Edit existing dashboard card and verify meter element loads
   - Verify meter element persists after save
   - Check browser console for no errors/warnings

## Files to Modify

- `client/backend/src/routes/dashboard.js` - Remove duplicate endpoint, fix response format
- `framework/frontend/dashboards/components/DashboardCardModal.tsx` - Fix form initialization, Select binding, validation

## Backward Compatibility

- Response includes both `id` and `meter_element_id` for compatibility
- Existing cards with meter_element_id will continue to work
- No database schema changes required
