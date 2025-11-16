# Design Document: Simple Confirmation Modal Helper

## Overview

Create a simple helper function `showConfirmation()` that displays a confirmation modal and executes a callback if the user confirms. This helper will be used across all list components to provide consistent confirmation dialogs.

## Architecture

```
showConfirmation(config) → displays modal → user confirms/cancels → executes callback or closes
```

## Components and Interfaces

### 1. showConfirmation Helper Function (Framework - NEW)

**File:** `framework/frontend/shared/utils/confirmationHelper.tsx`

**Simple Implementation:**
```typescript
import { ConfirmationModal } from '../components/ConfirmationModal';
import { createRoot } from 'react-dom/client';

interface ConfirmationConfig {
  type?: 'danger' | 'warning' | 'info';
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
}

export function showConfirmation(config: ConfirmationConfig): void {
  const {
    type = 'danger',
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm
  } = config;

  // Create modal container
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);

  const cleanup = () => {
    root.unmount();
    document.body.removeChild(container);
  };

  const handleConfirm = async () => {
    cleanup();
    await onConfirm();
  };

  const handleCancel = () => {
    cleanup();
  };

  root.render(
    <ConfirmationModal
      isOpen={true}
      type={type}
      title={title}
      message={message}
      confirmText={confirmText}
      cancelText={cancelText}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
}
```

### 2. Usage in List Components

**UserList Example (Inactivate User):**
```typescript
import { showConfirmation } from '@framework/shared/utils/confirmationHelper';

const handleUserDelete = (user: User) => {
  showConfirmation({
    type: 'warning',
    title: 'Inactivate User',
    message: `Inactivate user "${user.name}"?`,
    confirmText: 'Inactivate',
    onConfirm: async () => {
      await users.updateItem(user.id, { ...user, active: false });
      await users.fetchItems();
    }
  });
};

<DataList onDelete={handleUserDelete} ... />
```

**LocationList Example (Delete Location):**
```typescript
import { showConfirmation } from '@framework/shared/utils/confirmationHelper';

const handleLocationDelete = (location: Location) => {
  showConfirmation({
    type: 'danger',
    title: 'Delete Location',
    message: `Delete location "${location.name}"? This cannot be undone.`,
    confirmText: 'Delete',
    onConfirm: async () => {
      await locations.deleteItem(location.id);
      await locations.fetchItems();
    }
  });
};

<DataList onDelete={handleLocationDelete} ... />
```

## Implementation Notes

- Simple function, no hooks or state management needed
- Uses React portals to render modal outside component tree
- Cleans up after itself automatically
- Can be called from anywhere in the application
- Works with existing ConfirmationModal component

## Testing Strategy

1. Test showConfirmation displays modal with correct props
2. Test confirm button executes callback
3. Test cancel button closes modal without executing callback
4. Test cleanup removes modal from DOM
5. Test in UserList with inactivate behavior
6. Test in LocationList with delete behavior
