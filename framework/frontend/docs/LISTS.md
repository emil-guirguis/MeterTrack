# Lists Framework

A comprehensive framework for building data-driven lists and tables with filtering, sorting, pagination, bulk actions, and export/import capabilities.

## Features

- **Data Management**: Complete CRUD operations with state management
- **Filtering**: Advanced filtering with multiple filter types (text, select, date range, number range)
- **Sorting**: Multi-column sorting with customizable sort functions
- **Pagination**: Client-side and server-side pagination support
- **Search**: Global search across all columns
- **Bulk Actions**: Select multiple items and perform batch operations
- **Export/Import**: CSV export and import with validation
- **Permissions**: Role-based access control for actions
- **Responsive**: Mobile-friendly table layouts
- **Accessible**: WCAG 2.1 AA compliant
- **Customizable**: Extensive configuration options

## Quick Start

```tsx
import { useBaseList, DataList } from '../../../framework/frontend/lists';
import { useAuth } from '../contexts/AuthContext';
import { useContactStore } from '../store/contactStore';

function ContactList() {
  const authContext = useAuth();
  
  const listProps = useBaseList({
    entityName: 'contact',
    entityNamePlural: 'contacts',
    useStore: useContactStore,
    authContext,
    columns: [
      { key: 'name', label: 'Name', sortable: true },
      { key: 'email', label: 'Email', sortable: true },
      { key: 'phone', label: 'Phone' },
      { key: 'company', label: 'Company', sortable: true }
    ],
    filters: [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' }
        ]
      }
    ],
    bulkActions: [
      {
        id: 'delete',
        label: 'Delete',
        icon: 'trash',
        action: async (items) => {
          await deleteContacts(items.map(i => i.id));
        },
        requiresPermission: 'contacts.delete'
      }
    ]
  });

  return <DataList {...listProps} />;
}
```

## Core Concepts

### useBaseList Hook

The `useBaseList` hook is the heart of the lists framework. It manages all list state and provides props for the DataList component.

```tsx
const listProps = useBaseList<Contact, ContactStore>({
  // Required
  entityName: 'contact',
  entityNamePlural: 'contacts',
  useStore: useContactStore,
  columns: [...],
  
  // Optional
  authContext: useAuth(),
  features: {
    create: true,
    edit: true,
    delete: true,
    search: true,
    filters: true,
    export: true,
    import: true,
    bulkActions: true,
    pagination: true
  },
  permissions: {
    create: 'contacts.create',
    edit: 'contacts.edit',
    delete: 'contacts.delete',
    export: 'contacts.export'
  },
  filters: [...],
  stats: [...],
  bulkActions: [...],
  export: {...},
  import: {...},
  onEdit: (item) => navigate(`/contacts/${item.id}/edit`),
  onCreate: () => navigate('/contacts/new'),
  onSelect: (item) => navigate(`/contacts/${item.id}`)
});
```

### Column Definitions

Columns define how data is displayed in the table:

```tsx
const columns: ColumnDefinition<Contact>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    width: '200px',
    render: (value, item) => (
      <strong>{value}</strong>
    )
  },
  {
    key: 'email',
    label: 'Email',
    sortable: true,
    searchable: true
  },
  {
    key: 'status',
    label: 'Status',
    render: (value) => (
      <span className={`status-${value}`}>
        {value}
      </span>
    )
  },
  {
    key: 'actions',
    label: 'Actions',
    render: (_, item) => (
      <button onClick={() => handleEdit(item)}>
        Edit
      </button>
    )
  }
];
```

### Filter Definitions

Filters allow users to narrow down the list:

```tsx
const filters: FilterDefinition[] = [
  // Text filter
  {
    key: 'name',
    label: 'Name',
    type: 'text',
    placeholder: 'Search by name'
  },
  
  // Select filter
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ]
  },
  
  // Date range filter
  {
    key: 'createdAt',
    label: 'Created Date',
    type: 'dateRange'
  },
  
  // Number range filter
  {
    key: 'age',
    label: 'Age',
    type: 'numberRange',
    min: 0,
    max: 100
  },
  
  // Boolean filter
  {
    key: 'verified',
    label: 'Verified',
    type: 'boolean'
  }
];
```

### Bulk Actions

Define actions that can be performed on multiple selected items:

```tsx
const bulkActions: BulkActionConfig<Contact>[] = [
  {
    id: 'delete',
    label: 'Delete',
    icon: 'trash',
    variant: 'danger',
    requiresPermission: 'contacts.delete',
    confirmMessage: 'Are you sure you want to delete {count} contacts?',
    action: async (items) => {
      await deleteContacts(items.map(i => i.id));
    }
  },
  {
    id: 'export',
    label: 'Export Selected',
    icon: 'download',
    action: async (items) => {
      exportToCSV(items);
    }
  },
  {
    id: 'tag',
    label: 'Add Tag',
    icon: 'tag',
    action: async (items) => {
      const tag = await promptForTag();
      await addTagToContacts(items.map(i => i.id), tag);
    }
  }
];
```

### Statistics

Display summary statistics above the list:

```tsx
const stats: StatDefinition<Contact>[] = [
  {
    key: 'total',
    label: 'Total Contacts',
    calculate: (items) => items.length,
    format: (value) => value.toLocaleString()
  },
  {
    key: 'active',
    label: 'Active',
    calculate: (items) => items.filter(i => i.status === 'active').length,
    icon: 'check-circle',
    variant: 'success'
  },
  {
    key: 'revenue',
    label: 'Total Revenue',
    calculate: (items) => items.reduce((sum, i) => sum + i.revenue, 0),
    format: (value) => `$${value.toLocaleString()}`
  }
];
```

## Components

### DataList

The main list component that renders the complete list UI:

```tsx
<DataList
  items={items}
  columns={columns}
  loading={loading}
  error={error}
  selectedItems={selectedItems}
  onSelectionChange={handleSelectionChange}
  onSort={handleSort}
  onFilter={handleFilter}
  onSearch={handleSearch}
  onPageChange={handlePageChange}
  // ... other props from useBaseList
/>
```

### DataTable

The table component used by DataList (can be used standalone):

```tsx
<DataTable
  items={items}
  columns={columns}
  selectedItems={selectedItems}
  onSelectionChange={handleSelectionChange}
  onSort={handleSort}
  sortColumn={sortColumn}
  sortDirection={sortDirection}
  onRowClick={handleRowClick}
  loading={loading}
  emptyMessage="No items found"
/>
```

## Export/Import

### CSV Export

```tsx
const exportConfig: ExportConfig<Contact> = {
  filename: 'contacts',
  columns: [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' }
  ],
  transform: (item) => ({
    ...item,
    phone: formatPhoneNumber(item.phone)
  })
};
```

### CSV Import

```tsx
const importConfig: ImportConfig<Contact> = {
  requiredColumns: ['name', 'email'],
  columnMapping: {
    'Full Name': 'name',
    'Email Address': 'email',
    'Phone Number': 'phone'
  },
  validate: (row) => {
    if (!isValidEmail(row.email)) {
      return { valid: false, error: 'Invalid email' };
    }
    return { valid: true };
  },
  transform: (row) => ({
    ...row,
    phone: normalizePhoneNumber(row.phone)
  })
};
```

## Utilities

### List Helpers

```tsx
import {
  sortItems,
  filterItems,
  searchItems,
  paginateItems
} from '../../../framework/frontend/lists/utils/listHelpers';

// Sort items
const sorted = sortItems(items, 'name', 'asc');

// Filter items
const filtered = filterItems(items, { status: 'active' });

// Search items
const searched = searchItems(items, 'john', ['name', 'email']);

// Paginate items
const paginated = paginateItems(items, 1, 20);
```

### Export Helpers

```tsx
import {
  generateCSV,
  downloadCSV,
  exportToCSV
} from '../../../framework/frontend/lists/utils/exportHelpers';

// Generate CSV content
const csv = generateCSV(headers, rows, info);

// Download CSV file
downloadCSV(csvContent, 'contacts.csv');

// Complete export
exportToCSV(items, columns, 'contacts');
```

### Import Helpers

```tsx
import {
  parseCSV,
  validateCSV,
  importFromCSV
} from '../../../framework/frontend/lists/utils/importHelpers';

// Parse CSV file
const data = await parseCSV(file);

// Validate CSV data
const validation = validateCSV(data, requiredColumns);

// Complete import
const result = await importFromCSV(file, config);
```

## Configuration Builders

### Column Builder

```tsx
import { buildColumn } from '../../../framework/frontend/lists/config/listColumns';

const columns = [
  buildColumn('name', 'Name', { sortable: true, searchable: true }),
  buildColumn('email', 'Email', { sortable: true }),
  buildColumn('status', 'Status', {
    render: (value) => <StatusBadge status={value} />
  })
];
```

### Filter Builder

```tsx
import { buildFilter } from '../../../framework/frontend/lists/config/listFilters';

const filters = [
  buildFilter.text('name', 'Name'),
  buildFilter.select('status', 'Status', statusOptions),
  buildFilter.dateRange('createdAt', 'Created Date'),
  buildFilter.numberRange('age', 'Age', 0, 100)
];
```

### Bulk Action Builder

```tsx
import { buildBulkAction } from '../../../framework/frontend/lists/config/listBulkActions';

const bulkActions = [
  buildBulkAction.delete('contacts.delete', handleDelete),
  buildBulkAction.export(handleExport),
  buildBulkAction.custom('tag', 'Add Tag', 'tag', handleTag)
];
```

## Auth Context Integration

The framework requires an auth context for permission checks:

```tsx
interface AuthContextProvider {
  checkPermission: (permission: string) => boolean;
  user?: User;
}

// Your auth context
const authContext = {
  checkPermission: (permission) => {
    return currentUser.permissions.includes(permission);
  },
  user: currentUser
};

// Pass to useBaseList
const listProps = useBaseList({
  // ... other config
  authContext
});
```

## Permissions

Control feature visibility based on permissions:

```tsx
const listProps = useBaseList({
  // ... other config
  permissions: {
    create: 'contacts.create',
    edit: 'contacts.edit',
    delete: 'contacts.delete',
    export: 'contacts.export',
    import: 'contacts.import'
  }
});
```

## Advanced Features

### Custom Renderers

```tsx
const columns = [
  {
    key: 'avatar',
    label: 'Avatar',
    render: (value, item) => (
      <img src={value} alt={item.name} className="avatar" />
    )
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (tags) => (
      <div className="tags">
        {tags.map(tag => (
          <span key={tag} className="tag">{tag}</span>
        ))}
      </div>
    )
  }
];
```

### Custom Sort Functions

```tsx
const columns = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    sortFn: (a, b) => {
      // Custom sort logic
      return a.lastName.localeCompare(b.lastName);
    }
  }
];
```

### Custom Filter Functions

```tsx
const filters = [
  {
    key: 'custom',
    label: 'Custom Filter',
    type: 'custom',
    filterFn: (item, value) => {
      // Custom filter logic
      return item.score > value;
    }
  }
];
```

## Performance Optimization

- Use `React.memo` for expensive row renderers
- Implement virtual scrolling for large lists (1000+ items)
- Use server-side pagination for very large datasets
- Debounce search and filter inputs
- Cache computed values with `useMemo`

See [PERFORMANCE_OPTIMIZATIONS.md](./PERFORMANCE_OPTIMIZATIONS.md) for detailed optimization strategies.

## Styling

The framework uses CSS modules and CSS variables for styling:

```css
:root {
  --list-border-color: #e5e7eb;
  --list-header-bg: #f9fafb;
  --list-row-hover: #f3f4f6;
  --list-selected-bg: #dbeafe;
}
```

## Accessibility

- Keyboard navigation (Tab, Enter, Space, Arrow keys)
- Screen reader support with ARIA labels
- Focus management
- High contrast mode support
- Minimum touch target sizes (44px)

## Migration Guide

See [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) for detailed instructions on migrating existing list components to use this framework.

## Examples

See [EXAMPLES.md](./EXAMPLES.md) for complete working examples of:
- Basic list
- List with filters
- List with bulk actions
- List with export/import
- Custom renderers
- Server-side pagination

## API Reference

### Types

All types are exported from `types/list.ts` and `types/ui.ts`:

```tsx
import type {
  ColumnDefinition,
  FilterDefinition,
  BulkActionConfig,
  StatDefinition,
  ExportConfig,
  ImportConfig,
  ListFeatures,
  ListPermissions
} from '../../../framework/frontend/lists';
```

## Requirements

This framework satisfies requirements 1.1-11.5 from the framework migration specification.

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- ES2020+ features
- CSS Grid and Flexbox support

## License

Part of the MeterItPro framework project.
