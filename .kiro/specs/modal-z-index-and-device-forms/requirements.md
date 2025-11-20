# Requirements Document

## Introduction

This feature addresses two critical UI issues in the device management interface: (1) delete confirmation modals appearing behind form modals due to z-index conflicts, and (2) device edit/create forms not displaying when triggered from the device list. The solution involves establishing a proper z-index hierarchy for modal layers and implementing the missing form modal integration for device management.

## Glossary

- **Modal**: The primary framework component used for displaying forms and content in an overlay dialog
- **ConfirmationModal**: A specialized modal component for displaying confirmation dialogs (delete, warning, etc.)
- **Z-Index**: CSS property that controls the stacking order of positioned elements
- **Modal Layer**: A conceptual layer in the z-index hierarchy for different types of modals
- **DeviceList**: The list component that displays devices with edit/delete actions
- **DeviceForm**: The form component for creating and editing device records
- **Form Modal**: A modal dialog that contains a form for data entry

## Requirements

### Requirement 1: Modal Z-Index Hierarchy

**User Story:** As a user, I want confirmation dialogs to always appear on top of form modals, so that I can see and interact with confirmations without obstruction.

#### Acceptance Criteria

1. THE System SHALL assign z-index 1000 to the base Modal component backdrop
2. THE System SHALL assign z-index 1100 to the ConfirmationModal component backdrop
3. WHEN a ConfirmationModal is displayed while a Modal is open, THE ConfirmationModal SHALL render above the Modal
4. WHEN multiple modals are stacked, THE System SHALL maintain visual hierarchy with higher z-index values appearing on top
5. THE System SHALL ensure all modal backdrops prevent interaction with underlying content

### Requirement 2: Device Form Modal Integration

**User Story:** As a user, I want to see a form modal when I click edit or create on a device, so that I can modify device information.

#### Acceptance Criteria

1. WHEN a user clicks the create button in DeviceList, THE System SHALL display a modal containing an empty DeviceForm
2. WHEN a user clicks the edit button on a device row, THE System SHALL display a modal containing a DeviceForm populated with the device's data
3. WHEN the DeviceForm is submitted successfully, THE System SHALL close the modal and refresh the device list
4. WHEN a user clicks cancel or the close button on the form modal, THE System SHALL close the modal without saving changes
5. THE System SHALL display appropriate modal titles ("Create New Device" or "Edit Device") based on the operation mode

### Requirement 3: Device Management Page Integration

**User Story:** As a developer, I want the DeviceManagementPage to use the EntityManagementPage framework component, so that device management follows the same pattern as other entities.

#### Acceptance Criteria

1. THE DeviceManagementPage SHALL use the EntityManagementPage component with DeviceList and DeviceForm
2. THE System SHALL pass the useDevicesEnhanced store hook to EntityManagementPage
3. THE System SHALL handle device creation through the EntityManagementPage's form submission flow
4. THE System SHALL handle device updates through the EntityManagementPage's form submission flow
5. THE System SHALL maintain existing device list features (filters, stats, bulk actions) when using EntityManagementPage

### Requirement 4: Delete Confirmation Z-Index

**User Story:** As a user, I want delete confirmations to appear on top of any open modals, so that I can clearly see the confirmation dialog.

#### Acceptance Criteria

1. WHEN a user clicks delete on a device while a form modal is open, THE ConfirmationModal SHALL appear above the form modal
2. WHEN a user confirms deletion, THE System SHALL close the ConfirmationModal and execute the delete operation
3. WHEN a user cancels deletion, THE System SHALL close the ConfirmationModal and return focus to the underlying modal
4. THE System SHALL prevent interaction with the form modal while the ConfirmationModal is displayed
5. THE System SHALL maintain proper backdrop opacity for visual separation between modal layers
