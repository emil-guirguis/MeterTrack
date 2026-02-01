# Implementation Tasks: Virtual Meter Field Visibility

## Task Overview

This spec has been implemented with the following changes:

1. ✅ **MeterWithSchema.js** - Added `visibleFor` properties to fields and sections
2. ✅ **useFormTabs.ts** - Enhanced to filter sections and fields based on `visibleFor`
3. ✅ **BaseForm.tsx** - Already supports `meterType` prop (no changes needed)
4. ✅ **MeterForm.tsx** - Already passes `meterType` to BaseForm (no changes needed)

## Completed Tasks

### Task 1: Update MeterWithSchema to Define Field Visibility
- [x] 1.1 Add `visibleFor: ['physical']` to Serial Number field
- [x] 1.2 Add `visibleFor: ['physical']` to Device field
- [x] 1.3 Add `visibleFor: ['physical']` to Network section
- [x] 1.4 Verify Name, Location, and Status fields remain visible for all types

**Status:** ✅ COMPLETED

### Task 2: Enhance useFormTabs Hook to Filter Sections
- [x] 2.1 Update Section interface to include optional `visibleFor` property
- [x] 2.2 Add section filtering logic in processFormTabs function
- [x] 2.3 Filter sections based on `visibleFor` and `meterType`
- [x] 2.4 Maintain backward compatibility for sections without `visibleFor`

**Status:** ✅ COMPLETED

### Task 3: Enhance useFormTabs Hook to Filter Fields
- [x] 3.1 Update FieldRef interface to include optional `visibleFor` property
- [x] 3.2 Add field filtering logic in processFormTabs function
- [x] 3.3 Filter fields based on `visibleFor` and `meterType`
- [x] 3.4 Maintain backward compatibility for fields without `visibleFor`

**Status:** ✅ COMPLETED

### Task 4: Write Unit Tests for Field Filtering
- [ ] 4.1 Test field filtering with `visibleFor: ['physical']` and `meterType='virtual'`
- [ ] 4.2 Test field filtering with `visibleFor: ['physical']` and `meterType='physical'`
- [ ] 4.3 Test field filtering with no `visibleFor` property
- [ ] 4.4 Test field filtering with `meterType=null` or `undefined`

**Status:** NOT STARTED

### Task 5: Write Unit Tests for Section Filtering
- [ ] 5.1 Test section filtering with `visibleFor: ['physical']` and `meterType='virtual'`
- [ ] 5.2 Test section filtering with `visibleFor: ['physical']` and `meterType='physical'`
- [ ] 5.3 Test section filtering with no `visibleFor` property
- [ ] 5.4 Test section filtering with `meterType=null` or `undefined`

**Status:** NOT STARTED

### Task 6: Write Property-Based Tests
- [ ] 6.1 Property test: Virtual meter field visibility
- [ ] 6.2 Property test: Physical meter field visibility
- [ ] 6.3 Property test: Field filtering logic
- [ ] 6.4 Property test: Section filtering logic
- [ ] 6.5 Property test: Backward compatibility

**Status:** NOT STARTED

### Task 7: Integration Testing
- [ ] 7.1 Test virtual meter form rendering (verify device fields are hidden)
- [ ] 7.2 Test physical meter form rendering (verify device fields are shown)
- [ ] 7.3 Test switching between meter types
- [ ] 7.4 Test form submission with hidden fields

**Status:** NOT STARTED

### Task 8: Manual Testing and Verification
- [ ] 8.1 Navigate to Meter > Add Meter > Virtual Meter
- [ ] 8.2 Verify Network section is not visible
- [ ] 8.3 Verify Serial Number field is not visible
- [ ] 8.4 Verify Device field is not visible
- [ ] 8.5 Verify Name, Location, and Status fields are visible
- [ ] 8.6 Test adding a physical meter to verify all fields are visible

**Status:** NOT STARTED

## Implementation Summary

### Changes Made

#### 1. MeterWithSchema.js
- Added `visibleFor: ['physical']` to Serial Number field (line ~107)
- Added `visibleFor: ['physical']` to Device field (line ~120)
- Added `visibleFor: ['physical']` to Network section (line ~135)

#### 2. useFormTabs.ts
- Updated FieldRef interface to include `visibleFor?: ('physical' | 'virtual')[]` (line ~13)
- Updated Section interface to include `visibleFor?: ('physical' | 'virtual')[]` (line ~19)
- Added section filtering logic in processFormTabs (lines ~140-147)
- Added field filtering logic in processFormTabs (lines ~160-167)

#### 3. BaseForm.tsx
- Already has `meterType` prop defined (line ~58)
- Already passes `meterType` to useFormTabs (line ~180)

#### 4. MeterForm.tsx
- Already determines meter type from meter object or meterType prop (line ~53)
- Already passes `meterType` to BaseForm (line ~72)

## How to Verify

### Quick Test
1. Open the application
2. Navigate to Meters page
3. Click "Add Meter"
4. Select "Virtual Meter"
5. Verify that:
   - Network section is NOT visible
   - Serial Number field is NOT visible
   - Device field is NOT visible
   - Name, Location, and Status fields ARE visible

### Detailed Test
1. Add a virtual meter and verify field visibility
2. Add a physical meter and verify all fields are visible
3. Edit an existing virtual meter and verify field visibility
4. Edit an existing physical meter and verify all fields are visible

## Notes

- The implementation is backward compatible - existing schemas without `visibleFor` properties continue to work unchanged
- The filtering logic is centralized in the useFormTabs hook, making it reusable across different forms
- The feature extends the existing conditional tab display feature to support field-level visibility
