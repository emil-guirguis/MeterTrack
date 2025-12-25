# Device Registers Tab - End-to-End Testing Guide

## Overview

This guide provides step-by-step instructions for manually testing the Device Registers Tab feature. All core functionality has been implemented and unit/property tests are passing. This E2E testing validates the complete user workflow.

## Prerequisites

- Backend server running on `http://localhost:3001`
- Frontend application running on `http://localhost:5173`
- User logged in with valid credentials
- At least one device created in the system
- At least 3 registers created in the system

## Test Scenarios

### Scenario 1: View Registers Tab ✅

**Objective:** Verify that the Registers tab appears in the Device Form and loads registers correctly.

**Steps:**
1. Navigate to the Devices management page
2. Click on an existing device to open the Device Form
3. Verify that a "Registers" tab appears in the tab navigation
4. Click on the "Registers" tab
5. Verify that:
   - A loading indicator appears briefly
   - The grid displays with columns: Number, Name, Unit, Field Name
   - All registers associated with the device are displayed
   - An "Add Register" button appears in the header

**Expected Result:** ✅ Registers tab displays all associated registers in a grid format

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 2: Empty State ✅

**Objective:** Verify that the empty state message displays when no registers are associated.

**Steps:**
1. Create a new device (or use one with no registers)
2. Open the Device Form
3. Click on the "Registers" tab
4. Verify that:
   - A loading indicator appears briefly
   - An empty state message displays: "No registers associated with this device"
   - The "Add Register" button is still visible

**Expected Result:** ✅ Empty state message displays correctly

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 3: Add Register ✅

**Objective:** Verify that users can add a new register to a device.

**Steps:**
1. Open a device with at least one register already associated
2. Click on the "Registers" tab
3. Click the "Add Register" button
4. Verify that:
   - A modal dialog appears with title "Add Register"
   - A dropdown shows available registers (excluding already-associated ones)
5. Select a register from the dropdown
6. Click the "Add" button
7. Verify that:
   - The modal closes
   - The new register appears in the grid
   - A success message appears (if implemented)
   - The grid updates immediately

**Expected Result:** ✅ New register is added and appears in the grid

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 4: Duplicate Prevention ✅

**Objective:** Verify that duplicate registers cannot be added.

**Steps:**
1. Open a device with at least one register
2. Click on the "Registers" tab
3. Click the "Add Register" button
4. Verify that:
   - The dropdown only shows registers NOT already associated
   - Already-associated registers are filtered out
5. Try to add a register that's already associated (if possible through API)
6. Verify that:
   - An error message appears: "Register is already associated with this device"
   - The register is not added to the grid

**Expected Result:** ✅ Duplicate registers are prevented

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 5: Edit Register Value ✅

**Objective:** Verify that users can edit register values inline.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Click on a cell in the grid (e.g., the "Name" column)
4. Verify that:
   - The cell enters edit mode
   - A TextField appears with the current value
   - The cell background changes to indicate edit mode
   - The focus color matches the form field focus color
5. Modify the value
6. Press Enter to save
7. Verify that:
   - The cell exits edit mode
   - The new value is displayed
   - A success message appears (if implemented)
   - The value is persisted to the backend

**Expected Result:** ✅ Register value is edited and saved

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 6: Cancel Edit ✅

**Objective:** Verify that users can cancel editing without saving.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Click on a cell to enter edit mode
4. Modify the value
5. Press Escape key
6. Verify that:
   - The cell exits edit mode
   - The original value is restored
   - No changes are saved

**Expected Result:** ✅ Edit is cancelled and original value is preserved

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 7: Delete Register ✅

**Objective:** Verify that users can delete registers from a device.

**Steps:**
1. Open a device with at least 2 registers
2. Click on the "Registers" tab
3. Click the delete button (trash icon) on a register row
4. Verify that:
   - A confirmation dialog appears
   - The dialog asks for confirmation to delete
5. Click "Delete" button in the dialog
6. Verify that:
   - The dialog closes
   - The register is removed from the grid
   - A success message appears (if implemented)
   - The register count decreases

**Expected Result:** ✅ Register is deleted from the device

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 8: Cancel Delete ✅

**Objective:** Verify that users can cancel deletion.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Click the delete button on a register row
4. Verify that a confirmation dialog appears
5. Click "Cancel" button
6. Verify that:
   - The dialog closes
   - The register remains in the grid
   - No changes are made

**Expected Result:** ✅ Delete is cancelled and register is preserved

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 9: Error Handling - Load Error ✅

**Objective:** Verify that load errors are handled gracefully.

**Steps:**
1. Open a device
2. Click on the "Registers" tab
3. Simulate a network error (e.g., stop backend server)
4. Verify that:
   - An error message appears: "Failed to load registers"
   - A "Retry" button appears
5. Restart the backend server
6. Click the "Retry" button
7. Verify that:
   - The registers load successfully
   - The error message disappears

**Expected Result:** ✅ Error is handled and retry works

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 10: Error Handling - Save Error ✅

**Objective:** Verify that save errors are handled gracefully.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Click on a cell to edit
4. Modify the value
5. Simulate a network error (e.g., stop backend server)
6. Press Enter to save
7. Verify that:
   - An error message appears
   - The cell remains in edit mode
   - The original value is preserved
8. Restart the backend server
9. Try saving again
10. Verify that the save succeeds

**Expected Result:** ✅ Save error is handled gracefully

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 11: Error Handling - Delete Error ✅

**Objective:** Verify that delete errors are handled gracefully.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Click the delete button on a register
4. Simulate a network error
5. Click "Delete" in the confirmation dialog
6. Verify that:
   - An error message appears
   - The register remains in the grid
   - The confirmation dialog closes
7. Restart the backend server
8. Try deleting again
9. Verify that the delete succeeds

**Expected Result:** ✅ Delete error is handled gracefully

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 12: Focus Color Consistency ✅

**Objective:** Verify that cell focus colors match form field focus colors.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Click on a cell to enter edit mode
4. Verify that the TextField has focus
5. Compare the focus color with other form fields in the Basic tab
6. Verify that:
   - The focus color is consistent
   - The box-shadow is applied
   - The focus indicator is visible

**Expected Result:** ✅ Focus colors are consistent

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 13: Loading Indicator ✅

**Objective:** Verify that loading indicators display correctly.

**Steps:**
1. Open a device
2. Click on the "Registers" tab
3. Verify that a loading indicator (spinner) appears briefly
4. Wait for registers to load
5. Verify that the loading indicator disappears
6. Click the "Add Register" button
7. Verify that a loading indicator appears in the modal while fetching available registers

**Expected Result:** ✅ Loading indicators display correctly

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 14: Tab Navigation ✅

**Objective:** Verify that tab navigation works correctly.

**Steps:**
1. Open a device form
2. Click on the "Registers" tab
3. Verify that registers load
4. Click on the "Basic" tab
5. Verify that the form switches to the Basic tab
6. Click on the "Registers" tab again
7. Verify that:
   - The Registers tab is displayed
   - Registers are still loaded (or reload if needed)
   - The grid state is preserved

**Expected Result:** ✅ Tab navigation works correctly

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 15: Form Submission ✅

**Objective:** Verify that form submission doesn't include register changes.

**Steps:**
1. Open a device form
2. Modify a field in the Basic tab (e.g., description)
3. Click on the "Registers" tab
4. Add or delete a register
5. Click the "Save" button (or submit the form)
6. Verify that:
   - The device is saved with the Basic tab changes
   - The register changes are saved separately (not as part of device submission)
   - No errors occur

**Expected Result:** ✅ Form submission works correctly

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 16: Many Registers ✅

**Objective:** Verify that the grid handles many registers correctly.

**Steps:**
1. Create a device with many registers (10+)
2. Open the device form
3. Click on the "Registers" tab
4. Verify that:
   - All registers load
   - The grid is scrollable
   - Performance is acceptable
   - No UI glitches occur

**Expected Result:** ✅ Grid handles many registers correctly

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 17: Accessibility ✅

**Objective:** Verify that the feature is accessible.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Test keyboard navigation:
   - Tab through the grid cells
   - Verify that focus is visible
   - Verify that buttons are accessible
4. Test with a screen reader (if available):
   - Verify that column headers are announced
   - Verify that cell values are announced
   - Verify that buttons are announced

**Expected Result:** ✅ Feature is accessible

**Pass/Fail:** [ ] Pass [ ] Fail

---

### Scenario 18: Responsive Design ✅

**Objective:** Verify that the feature is responsive.

**Steps:**
1. Open a device with registers
2. Click on the "Registers" tab
3. Test on different screen sizes:
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)
4. Verify that:
   - The grid is readable on all sizes
   - Buttons are accessible on all sizes
   - No horizontal scrolling on mobile (if possible)
   - Layout adapts correctly

**Expected Result:** ✅ Feature is responsive

**Pass/Fail:** [ ] Pass [ ] Fail

---

## Test Summary

### Test Results

| Scenario | Status | Notes |
|----------|--------|-------|
| 1. View Registers Tab | [ ] | |
| 2. Empty State | [ ] | |
| 3. Add Register | [ ] | |
| 4. Duplicate Prevention | [ ] | |
| 5. Edit Register Value | [ ] | |
| 6. Cancel Edit | [ ] | |
| 7. Delete Register | [ ] | |
| 8. Cancel Delete | [ ] | |
| 9. Error Handling - Load | [ ] | |
| 10. Error Handling - Save | [ ] | |
| 11. Error Handling - Delete | [ ] | |
| 12. Focus Color Consistency | [ ] | |
| 13. Loading Indicator | [ ] | |
| 14. Tab Navigation | [ ] | |
| 15. Form Submission | [ ] | |
| 16. Many Registers | [ ] | |
| 17. Accessibility | [ ] | |
| 18. Responsive Design | [ ] | |

### Overall Status

**Total Tests:** 18
**Passed:** [ ]
**Failed:** [ ]
**Skipped:** [ ]

**Overall Result:** [ ] PASS [ ] FAIL

---

## Issues Found

### Critical Issues
(List any critical issues that prevent the feature from working)

1. 
2. 
3. 

### Major Issues
(List any major issues that affect functionality)

1. 
2. 
3. 

### Minor Issues
(List any minor issues or improvements)

1. 
2. 
3. 

---

## Sign-Off

**Tested By:** ___________________
**Date:** ___________________
**Status:** [ ] APPROVED [ ] REJECTED

**Comments:**
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Notes

- All tests should be performed in a clean environment
- Clear browser cache before testing
- Test with different user roles if applicable
- Document any issues found with screenshots if possible
- Verify fixes before re-testing

---

**Test Guide Version:** 1.0
**Last Updated:** December 16, 2025
**Status:** READY FOR TESTING
