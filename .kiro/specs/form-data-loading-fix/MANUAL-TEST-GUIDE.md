# Manual Testing Guide - Edit Flow End-to-End

## Prerequisites

✅ Frontend server running on: http://localhost:5174/  
✅ Backend server running on: http://localhost:3001/  
✅ Automated tests passed: 5/5

## Quick Start

1. Open browser and navigate to: **http://localhost:5174/**
2. Navigate to **Contact Management** page
3. Open **Developer Tools** (F12)
4. Go to **Console** tab
5. Follow the test cases below

---

## Test Case 1: Edit First Contact

### Steps
1. Clear the console (Ctrl+L)
2. Locate the first contact in the list
3. Click the **Edit** button (✏️) for that contact
4. Observe the console logs
5. Observe the modal and form fields

### Expected Console Logs (in order)
```
[DataTable] Edit clicked for item: {id: "...", name: "...", ...}
[ContactManagementPage] handleEdit called with contact: {id: "...", ...}
[ContactManagementPage] Setting editing contact: {id: "...", ...}
[FormModal] Rendering with isOpen: true title: Edit Contact
[ContactForm] Rendering with contact: ... ...
[ContactForm] Initializing form with contact data: ...
```

### Expected UI Behavior
- ✅ Modal opens with title "Edit Contact"
- ✅ All form fields are populated:
  - Name field has contact's name
  - Email field has contact's email
  - Phone field has contact's phone
  - Address fields have contact's address
  - Status dropdown shows correct status
- ✅ No empty fields (except optional ones)

### Verification Checklist
- [ ] Console shows all expected logs
- [ ] Modal opens successfully
- [ ] Form title is "Edit Contact"
- [ ] All fields are populated with correct data
- [ ] Contact object in logs contains all properties

---

## Test Case 2: Edit Different Contact

### Steps
1. Close the modal from Test Case 1
2. Clear the console
3. Click the **Edit** button for a **different** contact
4. Observe the console logs
5. Verify form shows the new contact's data

### Expected Behavior
- ✅ Same console log sequence as Test Case 1
- ✅ Modal opens with the second contact's data
- ✅ Form fields show the second contact's data (NOT the first)
- ✅ No stale data from previous contact

### Verification Checklist
- [ ] Console shows correct logs for second contact
- [ ] Form displays second contact's name
- [ ] Form displays second contact's email
- [ ] Form displays second contact's phone
- [ ] No data from first contact is visible

---

## Test Case 3: Edit Third Contact

### Steps
1. Close the modal
2. Clear the console
3. Click the **Edit** button for a **third** contact
4. Verify form shows the third contact's data

### Verification Checklist
- [ ] Console shows correct logs
- [ ] Form displays third contact's data
- [ ] No stale data from previous contacts

---

## Test Case 4: Verify Data Flow Integrity

### Steps
1. Edit any contact
2. In the console, examine the logged contact objects
3. Compare the contact object at each stage

### What to Check
Look at the console logs and verify:
- `[DataTable]` log shows complete contact object with all properties
- `[ContactManagementPage]` log shows the same contact object
- `[ContactForm]` log shows the same contact ID and name

### Verification Checklist
- [ ] Contact object has `id` property
- [ ] Contact object has `name` property
- [ ] Contact object has `email` property
- [ ] Contact object has `phone` property
- [ ] Contact object has address-related properties
- [ ] Same contact object appears in all logs
- [ ] No data is lost during propagation

---

## Test Case 5: Verify Form Key Stability

### Steps
1. Edit a contact
2. Note the contact ID from the console logs
3. Close the modal
4. Edit the **same** contact again
5. Note the contact ID again
6. Edit a **different** contact
7. Note the new contact ID

### Expected Behavior
- ✅ Form key is based on contact ID (visible in React DevTools)
- ✅ Form key is the same when editing the same contact
- ✅ Form key changes when editing different contacts

### Verification Checklist
- [ ] Same contact shows same key on multiple edits
- [ ] Different contacts show different keys
- [ ] Form properly remounts when contact changes

---

## Test Case 6: Test Create Flow

### Steps
1. Close any open modals
2. Clear the console
3. Click the **Create** or **Add Contact** button
4. Observe the console logs
5. Verify form is empty

### Expected Console Logs
```
[FormModal] Rendering with isOpen: true title: Create New Contact
[ContactForm] Rendering with contact: undefined undefined
[ContactForm] Initializing empty form (create mode)
```

### Expected UI Behavior
- ✅ Modal opens with title "Create New Contact"
- ✅ All form fields are empty (or have default values)
- ✅ No data from previously edited contacts

### Verification Checklist
- [ ] Console shows create mode logs
- [ ] Modal title is "Create New Contact"
- [ ] All fields are empty
- [ ] No stale data visible

---

## Test Case 7: Switch Between Edit and Create

### Steps
1. Edit a contact (any contact)
2. Verify form shows contact data
3. Close the modal
4. Click **Create** button
5. Verify form is empty
6. Close the modal
7. Edit a different contact
8. Verify form shows new contact data

### Verification Checklist
- [ ] Edit shows populated form
- [ ] Create shows empty form
- [ ] Switching back to edit shows correct data
- [ ] No data leaks between operations

---

## Advanced Testing (Optional)

### Test Rapid Switching
1. Quickly edit Contact A
2. Immediately close and edit Contact B
3. Immediately close and edit Contact C
4. Verify each shows correct data

### Test Form Persistence
1. Edit a contact
2. Modify a field (don't save)
3. Close the modal
4. Edit the same contact again
5. Verify form shows original data (not modified)

### Test Console Log Cleanup
1. Edit multiple contacts
2. Check console for excessive logging
3. Verify logs are clear and helpful
4. No duplicate or redundant logs

---

## Troubleshooting

### If Modal Doesn't Open
- Check console for errors
- Verify `showForm` state is being set
- Check `[ContactManagementPage]` logs

### If Form Fields Are Empty
- Check `[ContactForm]` logs
- Verify contact object is passed correctly
- Check if `initializeFormData` is called
- Verify contact prop is not undefined

### If Wrong Data Shows
- Check form key in React DevTools
- Verify state is cleared between operations
- Check `setTimeout` is working correctly

### If Console Logs Are Missing
- Verify you're on the correct page
- Check if logging was removed
- Refresh the page and try again

---

## Success Criteria

All test cases should pass with:
- ✅ Modal opens on edit click
- ✅ Form fields are populated with correct data
- ✅ Console logs show complete data flow
- ✅ Multiple contacts can be edited successfully
- ✅ No stale data between operations
- ✅ Create mode shows empty form
- ✅ Switching between edit and create works correctly

---

## Reporting Issues

If any test case fails, document:
1. Which test case failed
2. What was expected
3. What actually happened
4. Console logs (copy/paste)
5. Screenshots if applicable

---

## Next Steps

After completing manual testing:
1. ✅ Mark Task 6 as complete
2. ✅ Proceed to Task 7: Test create flow
3. ✅ Proceed to Task 8: Test switching between operations

---

## Notes

- All previous implementation tasks (1-5) are complete
- Task 3 (Fix ContactManagementPage edit handler) was already implemented
- Console logging is enabled for debugging
- Form uses stable key pattern: `key={editingContact?.id || 'new-contact'}`
- Automated tests have already verified the core functionality
- Manual testing confirms the user experience
