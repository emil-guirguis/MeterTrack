# Test Guide: Elements Field Cleaning Fix

## Setup
- Backend: Running on http://localhost:3000
- Frontend: Running on http://localhost:5173

## Test 1: Create a Physical Meter

### Steps
1. Navigate to Meters page
2. Click "Create Meter" or "New Meter"
3. Select meter type: **Physical**
4. Fill in required fields:
   - Name: "Test Physical Meter"
   - Identifier: "test-physical-001"
   - Serial Number: "SN123456"
   - Device: Select a device
   - Network section: Fill in IP and Port
5. Click "Save"

### Expected Result
✅ Meter should be created successfully without errors
✅ No "Column 'elements' does not exist" error
✅ Browser console should show the API request payload WITHOUT `"elements": null`

### How to Check Console
1. Open browser DevTools (F12)
2. Go to Network tab
3. Look for the POST request to `/api/meters`
4. Click on it and view the Request body
5. Verify that `elements` field is NOT present

---

## Test 2: Create a Virtual Meter

### Steps
1. Navigate to Meters page
2. Click "Create Meter" or "New Meter"
3. Select meter type: **Virtual**
4. Fill in required fields:
   - Name: "Test Virtual Meter"
   - Identifier: "test-virtual-001"
5. Verify that these fields are HIDDEN:
   - Serial Number ❌ (should not be visible)
   - Device ❌ (should not be visible)
   - Network section (IP, Port) ❌ (should not be visible)
6. Click "Save"

### Expected Result
✅ Meter should be created successfully without errors
✅ No "Column 'elements' does not exist" error
✅ Device-related fields should be hidden
✅ Browser console should show the API request payload WITHOUT `"elements": null`

---

## Test 3: Edit an Existing Meter

### Steps
1. Navigate to Meters page
2. Click on an existing meter to edit
3. Verify the form loads correctly
4. Make a small change (e.g., update notes)
5. Click "Save"

### Expected Result
✅ Meter should be updated successfully
✅ No errors in the console
✅ Form should not include `elements` field in the API request

---

## Debugging

### If the fix doesn't work:

1. **Check the API request payload:**
   - Open DevTools Network tab
   - Look for POST `/api/meters`
   - Check if `elements` is still in the request body
   - If yes, the frontend fix didn't work

2. **Check the backend logs:**
   - Look for `[METER CREATE] Request body:` log
   - Verify if `elements` is in the received data
   - The backend should delete it anyway (line 363 in meters.js)

3. **Check the browser console:**
   - Look for any JavaScript errors
   - Check if the form is properly initialized
   - Verify that `fieldsToClean` is being applied

### Key Log Messages to Look For

**Frontend (Browser Console):**
```
[BaseForm] Form data updated: { field, oldValue, newValue, newData }
[FORM SUBMIT] Form submission triggered
[FORM SUBMIT] Form data: { ... }
```

**Backend (Terminal):**
```
[METER CREATE] Request body: { ... }
[METER CREATE] Before delete - meterData keys: [...]
[METER CREATE] After delete - meterData keys: [...]
```

---

## Success Criteria

✅ Physical meters can be created without errors
✅ Virtual meters can be created without errors
✅ Device-related fields are hidden for virtual meters
✅ No "Column 'elements' does not exist" error
✅ API request payload does NOT include `elements` field
✅ Existing meters can be edited without errors
