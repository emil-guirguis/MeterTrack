# Implementation Plan

- [x] 1. Rename UserFormDynamic to UserForm




  - Rename the component file and update all imports
  - _Requirements: 3.1, 3.2, 5.1_

- [x] 1.1 Rename UserFormDynamic.tsx to UserForm.tsx


  - Rename the file from `UserFormDynamic.tsx` to `UserForm.tsx`
  - Update the component name and export
  - _Requirements: 3.1_

- [x] 1.2 Update UserManagementPage to use UserForm


  - Update import statement to use `UserForm` instead of `UserFormDynamic`
  - _Requirements: 5.1_


- [x] 2. Create LocationForm with dynamic schema loading

  - Create new form component based on UserForm pattern
  - _Requirements: 1.1, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 2.1 Create LocationForm.tsx component


  - Copy UserForm.tsx as template
  - Adapt for Location entity (use `useSchema('location')`)
  - Update props interface to `LocationFormProps`
  - _Requirements: 1.1, 3.1, 3.2_

- [x] 2.2 Remove schema from locationConfig.ts


  - Remove `locationSchema` definition
  - Remove `defineEntitySchema` import
  - Keep list configuration (columns, filters, stats, bulkActions, exportConfig)
  - _Requirements: 2.1, 2.5_

- [x] 2.3 Update Location pages to use LocationForm


  - Find and update all Location form usages
  - Update import statements
  - _Requirements: 5.1, 5.2_


-

- [x] 3. Create MeterForm with dynamic schema loading



  - Create new form component based on UserForm pattern
  - _Requirements: 1.2, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 3.1 Create MeterForm.tsx component


  - Copy UserForm.tsx as template
  - Adapt for Meter entity (use `useSchema('meter')`)
  - Update props interface to `MeterFormProps`
  - _Requirements: 1.2, 3.1, 3.2_

- [x] 3.2 Remove schema from meterConfig.ts


  - Remove `meterSchema` definition
  - Remove `defineEntitySchema` import
  - Keep list configuration
  - _Requirements: 2.2, 2.5_

- [x] 3.3 Update Meter pages to use MeterForm


  - Find and update all Meter form usages
  - Update import statements
  - _Requirements: 5.1, 5.2_




- [x] 4. Create ContactForm with dynamic schema loading



  - Create new form component based on UserForm pattern
  - _Requirements: 1.3, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 4.1 Create ContactForm.tsx component


  - Copy UserForm.tsx as template
  - Adapt for Contact entity (use `useSchema('contact')`)
  - Update props interface to `ContactFormProps`
  - _Requirements: 1.3, 3.1, 3.2_

- [x] 4.2 Remove schema from contactConfig.ts


  - Remove `contactSchema` definition
  - Remove `defineEntitySchema` import
  - Keep list configuration
  - _Requirements: 2.3, 2.5_

- [x] 4.3 Update Contact pages to use ContactForm


  - Find and update all Contact form usages
  - Update import statements
  - _Requirements: 5.1, 5.2_




- [x] 5. Create DeviceForm with dynamic schema loading



  - Create new form component based on UserForm pattern
  - _Requirements: 1.4, 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Create DeviceForm.tsx component


  - Copy UserForm.tsx as template
  - Adapt for Device entity (use `useSchema('device')`)
  - Update props interface to `DeviceFormProps`
  - _Requirements: 1.4, 3.1, 3.2_

- [x] 5.2 Remove schema from deviceConfig.ts


  - Remove `deviceSchema` definition
  - Remove `defineEntitySchema` import
  - Keep list configuration
  - _Requirements: 2.4, 2.5_

- [x] 5.3 Update Device pages to use DeviceForm


  - Find and update all Device form usages
  - Update import statements
  - _Requirements: 5.1, 5.2_




- [x] 6. Checkpoint - Verify all forms work




  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Move old static forms to backup





  - Move old form components to `client/frontend/src/features/backup/`
  - Keep for reference but don't use in production
  - _Requirements: 5.4_
