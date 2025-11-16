# List Component Framework Migration Guide

## Overview

This guide walks you through migrating existing list components to use the new List Component Framework. The framework eliminates code duplication and provides consistent functionality across all entity list views.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Migration Steps](#migration-steps)
- [Before and After Examples](#before-and-after-examples)
- [Common Patterns](#common-patterns)
- [Common Pitfalls](#common-pitfalls)
- [Checklist](#checklist)

---

## Prerequisites

Before migrating, ensure you have:

1. **Enhanced Store**: Your entity store follows the EnhancedStore interface pattern
2. **Permissions**: Permission constants defined for your entity (if applicable)
3. **DataList Component**: Your component uses the DataList component for rendering
4. **TypeScript**: Your component is written in TypeScript

---

## Migration Steps

### Step 1: Create Configuration Files

Create a new configuration file for your entity in `src/config/`:

```typescript
// src/config/contactConfig.ts
import type { Contact } from '@/types/entities';
import type { 
  ColumnDefinition, 
  FilterDefinition, 
  StatDefinition,
  BulkActionConfig,
  ExportConfig 
} from '@/types/list';
import { Permission } from '@/types/auth';
import { renderStatusBadge, renderTwoLineCell, renderDateCell } from '@/utils/renderHelpers';

// Column definitions
export const contactColumns: ColumnDefinition<Contact>[] = [
  {
    key: 'name',
    label: 'Contact',
    sortable: true,
    render: (contact) => renderTwoLineCell(contact.name, contact.email),
  },
  // ... more columns
];

// Filter definitions
export const contactFilters: FilterDefinition[] = [
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { label: 'All Roles', value: '' },
      { label: 'Admin', value: 'admin' },
      // ... more options
    ],
  },
  // ... more filters
];

// Stats definitions
export const contactStats: StatDefinition<Contact>[] = [
  {
    label: 'Total Contacts',
    value: (items) => items.length,
  },
  // ... more stats
];

// Bulk actions
export const contactBulkActions: BulkActionConfig<Contact>[] = [
  {
    id: 'activate',
    label: 'Activate',
    color: 'success',
    confirm: true,
    confirmMessage: (items) => `Activate ${items.length} contact(s)?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'active');
    },
    requirePermission: Permission.CONTACT_UPDATE,
  },
  // ... more bulk actions
];

// Export configuration
export const contactExportConfig: ExportConfig<Contact> = {
  filename: (date) => `contacts-${date}.csv`,
  headers: ['Name', 'Email', 'Phone', 'Role', 'Status'],
  mapRow: (contact) => [
    contact.name,
    contact.email,
    contact.phone || '',
    contact.role,
    contact.status,
  ],
};
```


### Step 2: Import Required Dependencies

Update your component imports:

```typescript
// Add these imports
import { useBaseList } from '@/hooks/useBaseList';
import { 
  contactColumns, 
  contactFilters, 
  contactStats,
  contactBulkActions,
  contactExportConfig 
} from '@/config/contactConfig';
import type { Contact } from '@/types/entities';
import { Permission } from '@/types/auth';
```

### Step 3: Replace State Management

Replace all custom state management with the `useBaseList` hook:

```typescript
// BEFORE: Custom state management
const [searchQuery, setSearchQuery] = useState('');
const [roleFilter, setRoleFilter] = useState<string>('');
const [statusFilter, setStatusFilter] = useState<string>('');
const [showExportModal, setShowExportModal] = useState(false);

// AFTER: Use baseList hook
const baseList = useBaseList<Contact, ReturnType<typeof useContactsEnhanced>>({
  entityName: 'contact',
  entityNamePlural: 'contacts',
  useStore: useContactsEnhanced,
  columns: contactColumns,
  filters: contactFilters,
  stats: contactStats,
  bulkActions: contactBulkActions,
  export: contactExportConfig,
  permissions: {
    create: Permission.CONTACT_CREATE,
    update: Permission.CONTACT_UPDATE,
    delete: Permission.CONTACT_DELETE,
  },
  onEdit: onContactEdit,
  onCreate: onContactCreate,
});
```

### Step 4: Update Render Logic

Replace custom render logic with baseList render helpers:

```typescript
// BEFORE: Custom filter rendering
<div className="list__filters">
  <input
    type="text"
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    placeholder="Search contacts..."
  />
  <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
    <option value="">All Roles</option>
    <option value="admin">Admin</option>
    <option value="user">User</option>
  </select>
</div>

// AFTER: Use render helper
<DataList
  filters={baseList.renderFilters()}
  // ...
/>
```

### Step 5: Update Action Handlers

Replace custom handlers with baseList handlers:

```typescript
// BEFORE: Custom delete handler
const handleDelete = async (contact: Contact) => {
  if (!checkPermission(Permission.CONTACT_DELETE)) return;
  
  const confirmed = window.confirm(
    `Are you sure you want to delete ${contact.name}?`
  );
  
  if (confirmed) {
    try {
      await contacts.deleteItem(contact.id);
    } catch (error) {
      alert('Failed to delete contact');
    }
  }
};

// AFTER: Use baseList handler
// No custom code needed - baseList.handleDelete is already implemented
<DataList
  onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
  // ...
/>
```

### Step 6: Update DataList Props

Update your DataList component to use baseList properties:

```typescript
<DataList
  title="Contacts"
  filters={baseList.renderFilters()}
  headerActions={baseList.renderHeaderActions()}
  stats={baseList.renderStats()}
  data={baseList.data}
  columns={baseList.columns}
  loading={baseList.loading}
  error={baseList.error}
  emptyMessage="No contacts found. Create your first contact to get started."
  onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
  onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
  onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
  bulkActions={baseList.bulkActions}
  pagination={baseList.pagination}
/>
```

### Step 7: Add Modal Rendering

Add export and import modals at the end of your component:

```typescript
return (
  <div className="contact-list">
    <DataList {...props} />
    {baseList.renderExportModal()}
    {baseList.renderImportModal()}
  </div>
);
```

### Step 8: Remove Unused Code

Remove all the code that's now handled by the framework:
- Custom state declarations
- Custom filter handlers
- Custom CRUD handlers
- Custom permission checks
- Custom export logic
- Custom bulk action logic

---

## Before and After Examples

### Example 1: ContactList Component

#### Before (150+ lines)

```typescript
import React, { useState, useEffect } from 'react';
import { useContactsEnhanced } from '@/store/entities/contactsStore';
import { useAuth } from '@/hooks/useAuth';
import { DataList } from '@/components/common/DataList';
import { Permission } from '@/types/auth';
import type { Contact } from '@/types/entities';

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactCreate?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onContactSelect,
  onContactEdit,
  onContactCreate,
}) => {
  const { checkPermission } = useAuth();
  const contacts = useContactsEnhanced();
  
  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);
  
  // Permission checks
  const canCreate = checkPermission(Permission.CONTACT_CREATE);
  const canUpdate = checkPermission(Permission.CONTACT_UPDATE);
  const canDelete = checkPermission(Permission.CONTACT_DELETE);
  
  // Fetch data
  useEffect(() => {
    contacts.fetchItems();
  }, []);
  
  // Update filters
  useEffect(() => {
    contacts.setSearch(searchQuery);
  }, [searchQuery]);
  
  useEffect(() => {
    contacts.setFilters({
      role: roleFilter,
      status: statusFilter,
    });
  }, [roleFilter, statusFilter]);
  
  // Handlers
  const handleEdit = (contact: Contact) => {
    if (!canUpdate) return;
    onContactEdit?.(contact);
  };
  
  const handleDelete = async (contact: Contact) => {
    if (!canDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete ${contact.name}?`
    );
    
    if (confirmed) {
      try {
        await contacts.deleteItem(contact.id);
      } catch (error) {
        alert('Failed to delete contact');
      }
    }
  };
  
  const handleCreate = () => {
    if (!canCreate) return;
    onContactCreate?.();
  };
  
  const handleExport = () => {
    // Export logic...
  };
  
  // Column definitions
  const columns = [
    {
      key: 'name',
      label: 'Contact',
      sortable: true,
      render: (contact: Contact) => (
        <div>
          <div className="font-medium">{contact.name}</div>
          <div className="text-sm text-gray-500">{contact.email}</div>
        </div>
      ),
    },
    // ... more columns
  ];
  
  // Render filters
  const renderFilters = () => (
    <div className="list__filters">
      <input
        type="text"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Search contacts..."
      />
      <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
        <option value="">All Roles</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
      </select>
      <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
        <option value="">All Statuses</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
    </div>
  );
  
  // Render header actions
  const renderHeaderActions = () => (
    <div className="list__header-actions">
      {canCreate && (
        <button onClick={handleCreate}>Add Contact</button>
      )}
      <button onClick={handleExport}>Export CSV</button>
    </div>
  );
  
  return (
    <div className="contact-list">
      <DataList
        title="Contacts"
        filters={renderFilters()}
        headerActions={renderHeaderActions()}
        data={contacts.items}
        columns={columns}
        loading={contacts.list.loading}
        error={contacts.list.error}
        emptyMessage="No contacts found."
        onEdit={canUpdate ? handleEdit : undefined}
        onDelete={canDelete ? handleDelete : undefined}
        pagination={{
          page: contacts.list.page,
          pageSize: contacts.list.pageSize,
          total: contacts.list.total,
          onPageChange: contacts.setPage,
          onPageSizeChange: contacts.setPageSize,
        }}
      />
    </div>
  );
};
```

#### After (40 lines)

```typescript
import React from 'react';
import { useContactsEnhanced } from '@/store/entities/contactsStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import { Permission } from '@/types/auth';
import type { Contact } from '@/types/entities';
import {
  contactColumns,
  contactFilters,
  contactStats,
  contactBulkActions,
  contactExportConfig,
} from '@/config/contactConfig';

interface ContactListProps {
  onContactSelect?: (contact: Contact) => void;
  onContactEdit?: (contact: Contact) => void;
  onContactCreate?: () => void;
}

export const ContactList: React.FC<ContactListProps> = ({
  onContactSelect,
  onContactEdit,
  onContactCreate,
}) => {
  const baseList = useBaseList<Contact, ReturnType<typeof useContactsEnhanced>>({
    entityName: 'contact',
    entityNamePlural: 'contacts',
    useStore: useContactsEnhanced,
    columns: contactColumns,
    filters: contactFilters,
    stats: contactStats,
    bulkActions: contactBulkActions,
    export: contactExportConfig,
    permissions: {
      create: Permission.CONTACT_CREATE,
      update: Permission.CONTACT_UPDATE,
      delete: Permission.CONTACT_DELETE,
    },
    onEdit: onContactEdit,
    onCreate: onContactCreate,
  });

  return (
    <div className="contact-list">
      <DataList
        title="Contacts"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No contacts found. Create your first contact to get started."
        onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
        onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};
```

**Result:** Reduced from 150+ lines to 40 lines (73% reduction)


### Example 2: Read-Only List (Dashboard View)

#### Before

```typescript
export const DashboardMeterList: React.FC = () => {
  const meters = useMetersEnhanced();
  const [searchQuery, setSearchQuery] = useState('');
  
  useEffect(() => {
    meters.fetchItems();
  }, []);
  
  const columns = [
    { key: 'name', label: 'Meter', sortable: true },
    { key: 'location', label: 'Location' },
    { key: 'status', label: 'Status' },
  ];
  
  return (
    <DataList
      title="Meters"
      data={meters.items}
      columns={columns}
      loading={meters.list.loading}
      // No edit/delete actions for read-only view
    />
  );
};
```

#### After

```typescript
export const DashboardMeterList: React.FC = () => {
  const baseList = useBaseList<Meter, ReturnType<typeof useMetersEnhanced>>({
    entityName: 'meter',
    entityNamePlural: 'meters',
    useStore: useMetersEnhanced,
    columns: meterColumns,
    features: {
      allowCreate: false,
      allowEdit: false,
      allowDelete: false,
      allowBulkActions: false,
      allowExport: true, // Still allow export
      allowStats: true,
    },
    stats: meterStats,
    export: meterExportConfig,
  });

  return (
    <div className="dashboard-meter-list">
      <DataList
        title="Meters"
        stats={baseList.renderStats()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
```

---

## Common Patterns

### Pattern 1: Custom Column Rendering

**Before:**
```typescript
const columns = [
  {
    key: 'name',
    label: 'Contact',
    render: (contact: Contact) => (
      <div>
        <div className="font-medium">{contact.name}</div>
        <div className="text-sm text-gray-500">{contact.email}</div>
      </div>
    ),
  },
];
```

**After:**
```typescript
import { renderTwoLineCell } from '@/utils/renderHelpers';

export const contactColumns: ColumnDefinition<Contact>[] = [
  {
    key: 'name',
    label: 'Contact',
    sortable: true,
    render: (contact) => renderTwoLineCell(contact.name, contact.email),
  },
];
```

### Pattern 2: Status Badge Rendering

**Before:**
```typescript
const columns = [
  {
    key: 'status',
    label: 'Status',
    render: (item: Contact) => {
      const colorMap = {
        active: 'success',
        inactive: 'secondary',
        maintenance: 'warning',
      };
      return <Badge color={colorMap[item.status]}>{item.status}</Badge>;
    },
  },
];
```

**After:**
```typescript
import { renderStatusBadge } from '@/utils/renderHelpers';

export const contactColumns: ColumnDefinition<Contact>[] = [
  {
    key: 'status',
    label: 'Status',
    render: (contact) => renderStatusBadge(contact.status),
  },
];
```

### Pattern 3: Dynamic Filter Options

**Before:**
```typescript
const [locations, setLocations] = useState<string[]>([]);

useEffect(() => {
  const uniqueLocations = [...new Set(devices.items.map(d => d.locationName))];
  setLocations(uniqueLocations);
}, [devices.items]);

const renderFilters = () => (
  <select value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}>
    <option value="">All Locations</option>
    {locations.map(loc => (
      <option key={loc} value={loc}>{loc}</option>
    ))}
  </select>
);
```

**After:**
```typescript
import { extractUniqueValues } from '@/utils/listHelpers';

export const deviceFilters: FilterDefinition[] = [
  {
    key: 'location',
    label: 'Location',
    type: 'select',
    options: (items) => [
      { label: 'All Locations', value: '' },
      ...extractUniqueValues(items, 'locationName').map(loc => ({
        label: loc,
        value: loc,
      })),
    ],
  },
];
```

### Pattern 4: Bulk Status Updates

**Before:**
```typescript
const handleBulkActivate = async (selectedItems: Contact[]) => {
  const confirmed = window.confirm(
    `Activate ${selectedItems.length} contact(s)?`
  );
  
  if (confirmed) {
    try {
      const ids = selectedItems.map(item => item.id);
      await contacts.bulkUpdateStatus(ids, 'active');
      await contacts.fetchItems();
    } catch (error) {
      alert('Failed to activate contacts');
    }
  }
};
```

**After:**
```typescript
import { createActivateBulkAction } from '@/config/listBulkActions';

export const contactBulkActions: BulkActionConfig<Contact>[] = [
  createActivateBulkAction<Contact>(Permission.CONTACT_UPDATE),
  // Framework handles confirmation, execution, and refresh
];
```

### Pattern 5: CSV Export

**Before:**
```typescript
const handleExport = () => {
  const headers = ['Name', 'Email', 'Phone', 'Role'];
  const rows = contacts.items.map(c => [
    c.name,
    c.email,
    c.phone || '',
    c.role,
  ]);
  
  let csv = headers.join(',') + '\n';
  rows.forEach(row => {
    csv += row.map(val => `"${val}"`).join(',') + '\n';
  });
  
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
  link.click();
};
```

**After:**
```typescript
export const contactExportConfig: ExportConfig<Contact> = {
  filename: (date) => `contacts-${date}.csv`,
  headers: ['Name', 'Email', 'Phone', 'Role'],
  mapRow: (contact) => [
    contact.name,
    contact.email,
    contact.phone || '',
    contact.role,
  ],
};

// Framework handles CSV generation, escaping, and download
```

### Pattern 6: Permission-Based UI

**Before:**
```typescript
const { checkPermission } = useAuth();
const canCreate = checkPermission(Permission.CONTACT_CREATE);
const canUpdate = checkPermission(Permission.CONTACT_UPDATE);
const canDelete = checkPermission(Permission.CONTACT_DELETE);

return (
  <DataList
    onEdit={canUpdate ? handleEdit : undefined}
    onDelete={canDelete ? handleDelete : undefined}
  />
);
```

**After:**
```typescript
const baseList = useBaseList({
  // ...
  permissions: {
    create: Permission.CONTACT_CREATE,
    update: Permission.CONTACT_UPDATE,
    delete: Permission.CONTACT_DELETE,
  },
});

return (
  <DataList
    onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
    onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
  />
);
```

---

## Common Pitfalls

### Pitfall 1: Missing Type Parameters

**Problem:**
```typescript
// TypeScript error: Type parameters required
const baseList = useBaseList({
  entityName: 'contact',
  // ...
});
```

**Solution:**
```typescript
// Always provide type parameters
const baseList = useBaseList<Contact, ReturnType<typeof useContactsEnhanced>>({
  entityName: 'contact',
  // ...
});
```

### Pitfall 2: Incorrect Store Interface

**Problem:**
```typescript
// Store doesn't implement required methods
const store = {
  items: [],
  fetchItems: () => {},
  // Missing: setSearch, setFilters, setPage, etc.
};
```

**Solution:**
Ensure your store implements the EnhancedStore interface:
```typescript
interface EnhancedStore<T> {
  items: T[];
  list: {
    loading: boolean;
    error: string | null;
    page: number;
    pageSize: number;
    total: number;
  };
  fetchItems: () => Promise<void>;
  setSearch: (query: string) => void;
  setFilters: (filters: Record<string, any>) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  deleteItem?: (id: string) => Promise<void>;
  bulkUpdateStatus?: (ids: string[], status: string) => Promise<void>;
}
```

### Pitfall 3: Filter Key Mismatch

**Problem:**
```typescript
// Filter key doesn't match store filter key
const filters: FilterDefinition[] = [
  {
    key: 'status', // Component uses 'status'
    // ...
  },
];

// But store expects 'statusFilter'
store.setFilters({ statusFilter: 'active' });
```

**Solution:**
Use `storeKey` to map filter keys:
```typescript
const filters: FilterDefinition[] = [
  {
    key: 'status',
    storeKey: 'statusFilter', // Maps to store key
    // ...
  },
];
```

### Pitfall 4: Forgetting to Render Modals

**Problem:**
```typescript
return (
  <div>
    <DataList {...props} />
    {/* Missing export/import modals */}
  </div>
);
```

**Solution:**
Always render modals at the end:
```typescript
return (
  <div>
    <DataList {...props} />
    {baseList.renderExportModal()}
    {baseList.renderImportModal()}
  </div>
);
```

### Pitfall 5: Not Using Memoization

**Problem:**
```typescript
// Recreating config objects on every render
const baseList = useBaseList({
  columns: [{ key: 'name', label: 'Name' }], // New array every render
  filters: [{ key: 'status', label: 'Status' }], // New array every render
});
```

**Solution:**
Use `useMemo` or move config to separate file:
```typescript
// Option 1: useMemo
const columns = useMemo(() => contactColumns, []);
const filters = useMemo(() => contactFilters, []);

// Option 2: Import from config file (preferred)
import { contactColumns, contactFilters } from '@/config/contactConfig';
```

### Pitfall 6: Overriding Framework Behavior

**Problem:**
```typescript
// Trying to override framework handlers
const handleDelete = (item: Contact) => {
  // Custom delete logic
};

<DataList onDelete={handleDelete} /> // Bypasses framework
```

**Solution:**
Use callbacks in config instead:
```typescript
const baseList = useBaseList({
  // ...
  onEdit: (item) => {
    // Custom logic before/after edit
    console.log('Editing:', item);
    // Framework handles the rest
  },
});
```

### Pitfall 7: Feature Flags vs Permissions Confusion

**Problem:**
```typescript
// Thinking feature flags check permissions
features: {
  allowDelete: false, // This doesn't check permissions!
}
```

**Solution:**
Understand the difference:
```typescript
// Feature flags control UI visibility (no permission check)
features: {
  allowDelete: false, // Hide delete button regardless of permissions
}

// Permissions enforce authorization
permissions: {
  delete: Permission.CONTACT_DELETE, // Check user permission
}

// Final check combines both:
// canDelete = allowDelete && hasPermission(delete)
```

---

## Checklist

Use this checklist when migrating a list component:

### Configuration
- [ ] Created config file in `src/config/`
- [ ] Defined column configurations
- [ ] Defined filter configurations (if applicable)
- [ ] Defined stats configurations (if applicable)
- [ ] Defined bulk action configurations (if applicable)
- [ ] Defined export configuration (if applicable)
- [ ] Defined import configuration (if applicable)

### Component
- [ ] Imported `useBaseList` hook
- [ ] Imported configuration objects
- [ ] Replaced custom state with `useBaseList`
- [ ] Updated DataList props to use baseList properties
- [ ] Added export modal rendering
- [ ] Added import modal rendering (if applicable)
- [ ] Removed unused custom code

### Permissions
- [ ] Defined permissions in config
- [ ] Used `baseList.canCreate`, `canUpdate`, `canDelete` for conditional rendering
- [ ] Removed custom permission checks

### Testing
- [ ] Tested search functionality
- [ ] Tested filter functionality
- [ ] Tested sorting (if applicable)
- [ ] Tested pagination
- [ ] Tested CRUD operations
- [ ] Tested bulk actions (if applicable)
- [ ] Tested export functionality
- [ ] Tested import functionality (if applicable)
- [ ] Tested permission-based visibility
- [ ] Tested error handling

### Code Quality
- [ ] Removed all unused imports
- [ ] Removed all unused state variables
- [ ] Removed all unused handlers
- [ ] Added proper TypeScript types
- [ ] Used memoization for config objects
- [ ] Followed naming conventions

---

## Getting Help

If you encounter issues during migration:

1. **Check the Documentation**: Review [LIST_FRAMEWORK_DOCUMENTATION.md](./LIST_FRAMEWORK_DOCUMENTATION.md)
2. **Review Examples**: See [EXAMPLES.md](./EXAMPLES.md) for complete implementations
3. **Check Existing Migrations**: Look at already-migrated components (ContactList, UserList, etc.)
4. **Common Issues**: Review the [Common Pitfalls](#common-pitfalls) section above

---

## Next Steps

After migrating your component:

1. Test thoroughly in development
2. Review code with team members
3. Update any related documentation
4. Consider migrating related components
5. Share learnings with the team

Happy migrating! 🚀
