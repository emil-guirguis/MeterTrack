# Implementation Plan

- [x] 1. Update type definitions for device_id support





  - Add device_id field to CreateMeterRequest interface in meter.ts
  - Add device_id field to UpdateMeterRequest interface in meter.ts
  - Ensure device_id is typed as string (required for new meters)
  - _Requirements: 1.4, 1.5_

- [x] 2. Integrate device store into MeterForm component





  - [x] 2.1 Import useDevice hook from device store

    - Add import statement for useDevice hook
    - Initialize device hook in MeterForm component
    - _Requirements: 1.1_
  

  - [x] 2.2 Fetch devices on component mount






    - Add useEffect to call devices.fetchItems() on mount
    - Handle loading state during device fetch
    - _Requirements: 1.1, 2.2_
  

  - [x] 2.3 Add selectedDeviceId to form state





    - Initialize selectedDeviceId state with meter?.device_id for edit mode
    - Update formData to include device_id field
    - _Requirements: 1.4, 4.1_


- [x] 3. Replace brand and model fields with device dropdown





  - [x] 3.1 Remove hardcoded brand dropdown

    - Remove existing brand select element with hardcoded options
    - Remove brand validation logic for hardcoded values
    - _Requirements: 5.1_
  

  - [x] 3.2 Remove free-text model input field

    - Remove existing model text input element
    - Remove model validation logic for text input
    - _Requirements: 5.1_
  

  - [x] 3.3 Implement device selection dropdown

    - Create select element with device options
    - Format options as "brand - model_number"
    - Bind dropdown value to selectedDeviceId state
    - Implement onChange handler to update selectedDeviceId
    - _Requirements: 1.2, 5.1, 5.2, 5.3_
  

  - [x] 3.4 Populate brand and model from selected device

    - Create handleDeviceChange function
    - Find selected device from devices.items array
    - Update formData.device with selected device's brand
    - Update formData.model with selected device's model_number
    - Update formData.device_id with selected device's id
    - _Requirements: 1.3, 1.4_

- [x] 4. Implement device loading and error states






  - [x] 4.1 Add loading indicator for device fetch

    - Display loading message while devices.loading is true
    - Disable device dropdown during loading
    - Disable submit button while devices are loading
    - _Requirements: 2.2, 2.4_
  

  - [x] 4.2 Handle device load failure

    - Check devices.error state
    - Display error banner with retry button
    - Implement retry functionality to call devices.fetchItems()
    - _Requirements: 2.1_
  

  - [x] 4.3 Handle empty device list

    - Check if devices.items.length === 0 after loading
    - Display info message prompting user to create devices
    - Add link to device management page (/devices)
    - _Requirements: 2.3_


- [x] 5. Update form validation logic





  - [x] 5.1 Add device selection validation

    - Add validation check for selectedDeviceId in validateForm function
    - Display error message "Device selection is required" if not selected
    - Add device field to errors state object
    - _Requirements: 3.1, 3.2_
  

  - [x] 5.2 Clear validation errors on device selection

    - Update handleDeviceChange to clear device error
    - Ensure error clears when user selects valid device
    - _Requirements: 3.3_
  

  - [x] 5.3 Add required field indicator

    - Add asterisk (*) to device dropdown label
    - Apply error styling when validation fails
    - _Requirements: 3.4_

- [x] 6. Handle edit mode and backward compatibility





  - [x] 6.1 Pre-select device in edit mode


    - Check if meter.device_id exists when editing
    - Set selectedDeviceId to meter.device_id
    - Ensure dropdown shows correct device on load
    - _Requirements: 4.1, 4.3_
  
  - [x] 6.2 Handle orphaned device references

    - Check if device_id exists but device not found in devices.items
    - Display warning message for missing device
    - Clear selectedDeviceId and require new selection
    - _Requirements: 4.2_
  
  - [x] 6.3 Support legacy meters without device_id

    - Check if meter has device and model but no device_id
    - Allow form to load with existing brand/model values
    - Require device selection for updates
    - _Requirements: 4.4_


- [x] 7. Update form submission logic




  - [x] 7.1 Include device_id in submission payload

    - Ensure formData.device_id is included in onSubmit call
    - Verify device, model, and device_id are all populated
    - _Requirements: 1.5_
  
  - [x] 7.2 Verify validation prevents submission without device


    - Test that validateForm returns false without device selection
    - Ensure submit button is disabled or submission blocked
    - _Requirements: 3.2_

- [x] 8. Add navigation link to device management






  - [x] 8.1 Add link in empty state message

    - Create link element pointing to /devices route
    - Style link consistently with existing app links
    - _Requirements: 5.4_
  
  - [x] 8.2 Add helper text with device management link


    - Add informational text near device dropdown
    - Include link for users who need to add new devices
    - Position appropriately in form layout
    - _Requirements: 5.4_

- [ ]* 9. Add unit tests for device validation
  - [ ]* 9.1 Test device loading on mount
    - Verify devices.fetchItems() called on component mount
    - Verify loading indicator displays during fetch
    - Verify dropdown populates after successful load
    - _Requirements: 1.1, 2.2_
  
  - [ ]* 9.2 Test device selection behavior
    - Verify selecting device updates selectedDeviceId
    - Verify brand and model fields populate correctly
    - Verify device_id is set in formData
    - _Requirements: 1.3, 1.4_
  
  - [ ]* 9.3 Test validation logic
    - Verify error displays when no device selected
    - Verify form submission blocked without device
    - Verify error clears when device selected
    - _Requirements: 3.1, 3.2, 3.3_
  
  - [ ]* 9.4 Test edit mode functionality
    - Verify device pre-selected when editing meter
    - Verify warning for orphaned device reference
    - Verify user can change device selection
    - _Requirements: 4.1, 4.2, 4.3_
  
  - [ ]* 9.5 Test error handling
    - Verify error message on device load failure
    - Verify empty state message when no devices
    - Verify retry functionality
    - _Requirements: 2.1, 2.3_


- [x] 10. Verify integration and styling





  - [x] 10.1 Verify form styling consistency

    - Ensure device dropdown matches existing form field styling
    - Verify error states display correctly
    - Check responsive behavior on mobile
    - _Requirements: 5.2, 5.3_
  

  - [x] 10.2 Test complete create meter flow

    - Create new meter with device selection
    - Verify meter saves with device_id
    - Verify meter displays correctly after creation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  

  - [x] 10.3 Test complete edit meter flow

    - Edit existing meter with device_id
    - Verify device pre-selected
    - Change device selection and save
    - Verify updated meter has new device_id
    - _Requirements: 4.1, 4.3_
