# Implementation Plan

- [x] 1. Create showConfirmation helper function





  - Create new file `framework/frontend/shared/utils/confirmationHelper.tsx`
  - Implement showConfirmation function that accepts ConfirmationConfig (type, title, message, confirmText, cancelText, onConfirm)
  - Create modal container div and append to document.body
  - Use createRoot to render ConfirmationModal
  - Implement cleanup function to unmount and remove container
  - Handle confirm action: cleanup then execute onConfirm callback
  - Handle cancel action: cleanup only
  - Export showConfirmation function and ConfirmationConfig interface
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
- [x] 2. Update UserList to use showConfirmation for inactivate




- [ ] 2. Update UserList to use showConfirmation for inactivate

  - Import showConfirmation from framework
  - Create handleUserDelete function that calls showConfirmation
  - Configure with type 'warning', title 'Inactivate User', message 'Inactivate user "[name]"?', confirmText 'Inactivate'
  - In onConfirm callback, update user's active flag to false
  - Pass handleUserDelete as onDelete prop to DataList
  - Remove any existing renderDeleteConfirmation calls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_


- [x] 3. Update LocationList to use showConfirmation for delete




  - Import showConfirmation from framework
  - Create handleLocationDelete function that calls showConfirmation
  - Configure with type 'danger', title 'Delete Location', message 'Delete location "[name]"? This cannot be undone.', confirmText 'Delete'
  - In onConfirm callback, call locations.deleteItem and fetchItems
  - Pass handleLocationDelete as onDelete prop to DataList
  - Remove any existing renderDeleteConfirmation calls
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 4. Update ContactList to use showConfirmation





  - Import showConfirmation from framework
  - Create handleContactDelete function that calls showConfirmation
  - Configure with type 'danger', title 'Delete Contact', message 'Delete contact "[name]"? This cannot be undone.', confirmText 'Delete'
  - In onConfirm callback, call contacts.deleteItem and fetchItems
  - Pass handleContactDelete as onDelete prop to DataList
  - Remove existing renderDeleteConfirmation call
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 5. Update EmailTemplateList to use showConfirmation
  - Import showConfirmation from framework
  - Replace existing delete dialog with showConfirmation call in handleDelete function
  - Configure with type 'danger', title 'Delete Template', message 'Delete template "[name]"? This cannot be undone.', confirmText 'Delete'
  - In onConfirm callback, call templateService.deleteTemplate and loadTemplates
  - Remove deleteDialogOpen state and related Dialog component
  - Remove confirmDelete function
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_

- [ ] 6. Update DeviceList to use showConfirmation
  - Import showConfirmation from framework
  - Create handleDeviceDelete function in DeviceList component
  - Configure with type 'danger', title 'Delete Device', message 'Delete device "[name]"? This cannot be undone.', confirmText 'Delete'
  - In onConfirm callback, call store.deleteDevice and refresh the list
  - Pass handleDeviceDelete as onDelete prop to baseList configuration
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5_
