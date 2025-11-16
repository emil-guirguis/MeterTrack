# List Component Framework Documentation

## Overview

The List Component Framework provides a reusable, type-safe foundation for building consistent entity list views across the application. It eliminates code duplication by providing a single `useBaseList` hook that encapsulates common list functionality including filtering, searching, pagination, bulk actions, exports, imports, and CRUD operations.

## Table of Contents

- [Quick Start](#quick-start)
- [useBaseList Hook API](#usebaselist-hook-api)
- [Configuration Options](#configuration-options)
- [Feature Flags vs Permissions](#feature-flags-vs-permissions)
- [Helper Utilities](#helper-utilities)
- [Column Definitions](#column-definitions)
- [Filter Definitions](#filter-definitions)
- [Bulk Actions](#bulk-actions)
- [Export Configuration](#export-configuration)
- [Import Configuration](#import-configuration)
- [Stats Configuration](#stats-configuration)

---

## Quick Start

```typescript
import { useBaseList } from '@/hooks/useBaseList';
import { useContactsEnhanced } from '@/store/entities/contactsStore';
import { Permission } from '@/types/auth';
import type { Contact } from '@/types/entities';

export const ContactList: React.FC = () => {
  const baseList = useBaseList<Contact, ReturnType<typeof useContactsEnhanced>>({
    entityName: 'contact',
    entityNamePlural: 'contacts',
    useStore: useContactsEnhanced,
    columns: contactColumns,
    permissions: {
      create: Permission.CONTACT_CREATE,
      update: Permission.CONTACT_UPDATE,
      delete: Permission.CONTACT_DELETE,
    },
  });

  return (
    <div className="contact-list">
      <DataList
        title="Contacts"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
        onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};
```

---

## useBaseList Hook API

### Hook Signature

```typescript
function useBaseList<T, StoreType>(
  config: BaseListConfig<T, StoreType>
): BaseListReturn<T>
```

### Type Parameters

- `T` - The entity type (e.g., `Contact`, `User`, `Meter`)
- `StoreType` - The return type of the store hook (e.g., `ReturnType<typeof useContactsEnhanced>`)

### Returns: BaseListReturn<T>

```typescript
interface BaseListReturn<T> {
  // State
  searchQuery: string;
  filters: Record<string, any>;
  showExportModal: boolean;
  showImportModal: boolean;
  
  // State Setters
  setSearchQuery: (query: string) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  setShowExportModal: (show: boolean) => void;
  setShowImportModal: (show: boolean) => void;
  
  // Computed Permissions (combines features + permissions)
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canExport: boolean;
  canImport: boolean;
  canBulkAction: boolean;
  
  // Action Handlers
  handleEdit: (item: T) => void;
  handleDelete: (item: T) => void;
  handleCreate: () => void;
  handleExport: (items: T[]) => void;
  handleExportAll: () => void;
  handleImport: (file: File) => Promise<void>;
  
  // Render Helpers
  renderFilters: () => ReactNode;
  renderHeaderActions: () => ReactNode;
  renderStats: () => ReactNode;
  renderExportModal: () => ReactNode;
  renderImportModal: () => ReactNode;
  
  // Data from Store
  columns: ColumnDefinition<T>[];
  bulkActions: BulkAction<T>[];
  data: T[];
  loading: boolean;
  error: string | undefined;
  pagination: PaginationConfig;
}
```

---

## Configuration Options

### BaseListConfig<T, StoreType>

```typescript
interface BaseListConfig<T, StoreType> {
  // Required: Entity Configuration
  entityName: string;
  entityNamePlural: string;
  useStore: () => StoreType;
  columns: ColumnDefinition<T>[];
  
  // Optional: Feature Flags
  features?: {
    allowCreate?: boolean;        // Default: true
    allowEdit?: boolean;          // Default: true
    allowDelete?: boolean;        // Default: true
    allowBulkActions?: boolean;   // Default: true
    allowExport?: boolean;        // Default: true
    allowImport?: boolean;        // Default: false
    allowSearch?: boolean;        // Default: true
    allowFilters?: boolean;       // Default: true
    allowStats?: boolean;         // Default: true
    allowPagination?: boolean;    // Default: true
    allowSelection?: boolean;     // Default: true
  };
  
  // Optional: Security Permissions
  permissions?: {
    create?: Permission;
    read?: Permission;
    update?: Permission;
    delete?: Permission;
  };
  
  // Optional: UI Configuration
  filters?: FilterDefinition[];
  stats?: StatDefinition<T>[];
  bulkActions?: BulkActionConfig<T>[];
  export?: ExportConfig<T>;
  import?: ImportConfig<T>;
  
  // Optional: Callbacks
  onEdit?: (item: T) => void;
  onCreate?: () => void;
  onSelect?: (item: T) => void;
}
```

### Entity Configuration

**entityName** (required)
- Singular name of the entity (e.g., 'contact', 'user', 'meter')
- Used in confirmation messages and UI labels

**entityNamePlural** (required)
- Plural name of the entity (e.g., 'contacts', 'users', 'meters')
- Used in export filenames and UI labels

**useStore** (required)
- Hook that returns the entity store
- Must follow the EnhancedStore interface pattern

**columns** (required)
- Array of column definitions for the table
- See [Column Definitions](#column-definitions) section

---

## Feature Flags vs Permissions

The framework distinguishes between **feature flags** (UI control) and **security permissions** (authorization).

### Feature Flags

Feature flags control UI visibility and functionality at the component level, independent of user permissions.

```typescript
features: {
  allowCreate: false,      // Hide create button
  allowEdit: false,        // Hide edit actions
  allowDelete: false,      // Hide delete actions
  allowBulkActions: false, // Disable bulk actions
  allowExport: true,       // Show export functionality
  allowImport: false,      // Hide import functionality
  allowSearch: true,       // Show search input
  allowFilters: true,      // Show filter controls
  allowStats: true,        // Show stats display
}
```

**Use Cases:**
- **Read-only dashboard**: Set `allowEdit: false`, `allowDelete: false`, `allowCreate: false`
- **Export-only view**: Set `allowEdit: false`, `allowDelete: false`, `allowExport: true`
- **Simple list**: Set `allowBulkActions: false`, `allowStats: false`
- **Import-enabled list**: Set `allowImport: true` with import configuration

### Security Permissions

Permissions enforce authorization based on user roles via `useAuth().checkPermission()`.

```typescript
permissions: {
  create: Permission.CONTACT_CREATE,
  update: Permission.CONTACT_UPDATE,
  delete: Permission.CONTACT_DELETE,
}
```

### Combined Logic

The final visibility check combines both feature flags and permissions:

```typescript
// Internal logic (you don't need to implement this)
const canDelete = (features?.allowDelete ?? true) && checkPermission(permissions?.delete);
const canEdit = (features?.allowEdit ?? true) && checkPermission(permissions?.update);
const canCreate = (features?.allowCreate ?? true) && checkPermission(permissions?.create);
const canExport = (features?.allowExport ?? true); // No permission check
const canImport = (features?.allowImport ?? false) && checkPermission(permissions?.create);
```

**Key Points:**
- Feature flags default to `true` (except `allowImport` which defaults to `false`)
- Permissions always take precedence over feature flags
- If a user lacks permission, the action is hidden even if the feature flag is `true`
- Export doesn't require permissions (it's a read-only operation)
- Import requires create permission (it creates new entities)

---

## Helper Utilities

### List Helpers (`utils/listHelpers.ts`)

**buildFilters(filters: Record<string, any>): Record<string, any>**
- Constructs filter object for store
- Removes empty/null values
- Maps filter keys to store keys

```typescript
import { buildFilters } from '@/utils/listHelpers';

const filters = buildFilters({
  role: 'admin',
  status: 'active',
  search: '',  // Will be removed
});
// Result: { role: 'admin', status: 'active' }
```

**extractUniqueValues<T>(items: T[], key: keyof T): any[]**
- Extracts unique values from array of objects
- Useful for generating filter options dynamically

```typescript
import { extractUniqueValues } from '@/utils/listHelpers';

const roles = extractUniqueValues(contacts, 'role');
// Result: ['admin', 'user', 'viewer']
```

**debounceSearch(callback: Function, delay: number): Function**
- Creates debounced version of search callback
- Default delay: 300ms

```typescript
import { debounceSearch } from '@/utils/listHelpers';

const debouncedSearch = debounceSearch((query) => {
  store.setSearch(query);
}, 300);
```

### Export Helpers (`utils/exportHelpers.ts`)

**generateCSV(data: any[][], headers: string[]): string**
- Generates CSV string from 2D array
- Handles special characters, quotes, and line breaks
- Properly escapes CSV values

```typescript
import { generateCSV } from '@/utils/exportHelpers';

const csv = generateCSV(
  [['John Doe', 'john@example.com'], ['Jane Smith', 'jane@example.com']],
  ['Name', 'Email']
);
```

**downloadCSV(csv: string, filename: string): void**
- Triggers browser download of CSV file
- Creates blob and temporary download link

```typescript
import { downloadCSV } from '@/utils/exportHelpers';

downloadCSV(csvContent, 'contacts-2024-01-15.csv');
```

**escapeCSVValue(value: any): string**
- Escapes special characters for CSV
- Handles quotes, commas, and newlines

### Import Helpers (`utils/importHelpers.ts`)

**parseCSV(file: File): Promise<string[][]>**
- Parses CSV file into 2D array
- Handles quoted values and special characters

```typescript
import { parseCSV } from '@/utils/importHelpers';

const rows = await parseCSV(file);
// Result: [['Name', 'Email'], ['John', 'john@example.com']]
```

**validateImportData(rows: string[][], validator: Function): ValidationResult**
- Validates parsed CSV data
- Returns validation result with errors

**generateImportTemplate(headers: string[], filename: string): void**
- Generates and downloads CSV template
- Helps users format their import files correctly

### Render Helpers (`utils/renderHelpers.tsx`)

**renderStatusBadge(status: string, colorMap?: Record<string, string>): ReactNode**
- Renders status badge with appropriate color
- Default colors: active=success, inactive=secondary, maintenance=warning

```typescript
import { renderStatusBadge } from '@/utils/renderHelpers';

// In column definition
{
  key: 'status',
  label: 'Status',
  render: (item) => renderStatusBadge(item.status),
}
```

**renderTwoLineCell(line1: string, line2: string): ReactNode**
- Renders two-line table cell
- First line is bold, second line is muted

```typescript
import { renderTwoLineCell } from '@/utils/renderHelpers';

// In column definition
{
  key: 'name',
  label: 'Contact',
  render: (item) => renderTwoLineCell(item.name, item.email),
}
```

**renderDateCell(date: string | Date): ReactNode**
- Formats and renders date
- Handles null/undefined values

**renderBadgeList(items: string[], colorMap?: Record<string, string>): ReactNode**
- Renders list of badges
- Useful for tags, roles, or categories

---

## Column Definitions

### ColumnDefinition<T>

```typescript
interface ColumnDefinition<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
  hideOnMobile?: boolean;
  hideOnTablet?: boolean;
  hideOnDesktop?: boolean;
}
```

### Example Column Configurations

```typescript
import { renderStatusBadge, renderTwoLineCell, renderDateCell } from '@/utils/renderHelpers';

const contactColumns: ColumnDefinition<Contact>[] = [
  {
    key: 'name',
    label: 'Contact',
    sortable: true,
    render: (contact) => renderTwoLineCell(contact.name, contact.email),
  },
  {
    key: 'role',
    label: 'Role',
    sortable: true,
    render: (contact) => renderStatusBadge(contact.role, {
      admin: 'error',
      user: 'primary',
      viewer: 'secondary',
    }),
  },
  {
    key: 'phone',
    label: 'Phone',
    hideOnMobile: true,
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    render: (contact) => renderDateCell(contact.createdAt),
    hideOnMobile: true,
  },
];
```

### Helper Functions (`config/listColumns.ts`)

The framework provides helper functions for common column patterns:

```typescript
import { createTwoLineColumn, createStatusColumn, createDateColumn } from '@/config/listColumns';

const columns = [
  createTwoLineColumn<Contact>('name', 'Contact', 'name', 'email'),
  createStatusColumn<Contact>('status', 'Status'),
  createDateColumn<Contact>('createdAt', 'Created', true),
];
```

---

## Filter Definitions

### FilterDefinition

```typescript
interface FilterDefinition {
  key: string;
  label: string;
  type: 'select' | 'text' | 'date' | 'multiselect';
  options?: FilterOption[] | ((items: any[]) => FilterOption[]);
  placeholder?: string;
  className?: string;
  storeKey?: string; // Maps to store filter key if different
}

interface FilterOption {
  label: string;
  value: any;
}
```

### Example Filter Configurations

```typescript
const contactFilters: FilterDefinition[] = [
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { label: 'All Roles', value: '' },
      { label: 'Admin', value: 'admin' },
      { label: 'User', value: 'user' },
      { label: 'Viewer', value: 'viewer' },
    ],
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All Statuses', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
    ],
  },
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search contacts...',
  },
];
```

### Dynamic Filter Options

```typescript
const deviceFilters: FilterDefinition[] = [
  {
    key: 'location',
    label: 'Location',
    type: 'select',
    // Generate options dynamically from data
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

### Helper Functions (`config/listFilters.ts`)

```typescript
import { createSelectFilter, createSearchFilter, createStatusFilter } from '@/config/listFilters';

const filters = [
  createSearchFilter('search', 'Search contacts...'),
  createStatusFilter('status'),
  createSelectFilter('role', 'Role', [
    { label: 'Admin', value: 'admin' },
    { label: 'User', value: 'user' },
  ]),
];
```

---

## Bulk Actions

### BulkActionConfig<T>

```typescript
interface BulkActionConfig<T> {
  id: string;
  label: string;
  icon?: string;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  confirm?: boolean;
  confirmMessage?: string | ((items: T[]) => string);
  action: (items: T[], store: any) => Promise<void>;
  requirePermission?: Permission;
}
```

### Example Bulk Action Configurations

```typescript
const contactBulkActions: BulkActionConfig<Contact>[] = [
  {
    id: 'activate',
    label: 'Activate',
    icon: 'check',
    color: 'success',
    confirm: true,
    confirmMessage: (items) => `Activate ${items.length} contact(s)?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'active');
    },
    requirePermission: Permission.CONTACT_UPDATE,
  },
  {
    id: 'deactivate',
    label: 'Deactivate',
    icon: 'block',
    color: 'warning',
    confirm: true,
    confirmMessage: (items) => `Deactivate ${items.length} contact(s)?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'inactive');
    },
    requirePermission: Permission.CONTACT_UPDATE,
  },
];
```

### Standard Bulk Actions (`config/listBulkActions.ts`)

```typescript
import { createActivateBulkAction, createDeactivateBulkAction } from '@/config/listBulkActions';

const bulkActions = [
  createActivateBulkAction<Contact>(Permission.CONTACT_UPDATE),
  createDeactivateBulkAction<Contact>(Permission.CONTACT_UPDATE),
];
```

---

## Export Configuration

### ExportConfig<T>

```typescript
interface ExportConfig<T> {
  filename: (date: string) => string;
  headers: string[];
  mapRow: (item: T) => any[];
  includeInfo?: string;
}
```

### Example Export Configuration

```typescript
const contactExportConfig: ExportConfig<Contact> = {
  filename: (date) => `contacts-${date}.csv`,
  headers: ['Name', 'Email', 'Phone', 'Role', 'Status', 'Created'],
  mapRow: (contact) => [
    contact.name,
    contact.email,
    contact.phone || '',
    contact.role,
    contact.status,
    new Date(contact.createdAt).toLocaleDateString(),
  ],
  includeInfo: 'Exported from MeterIt Contact Management',
};
```

### Usage in Component

```typescript
const baseList = useBaseList({
  // ... other config
  export: contactExportConfig,
});

// Export functionality is automatically available
// - baseList.handleExport(selectedItems)
// - baseList.handleExportAll()
// - baseList.renderExportModal()
```

---

## Import Configuration

### ImportConfig<T>

```typescript
interface ImportConfig<T> {
  templateFilename: string;
  templateHeaders: string[];
  validateRow: (row: any[], rowIndex: number) => ValidationResult;
  mapRow: (row: any[]) => Partial<T>;
  onImport: (items: Partial<T>[]) => Promise<ImportResult>;
  instructions?: string;
  maxFileSize?: number; // in bytes
  allowedExtensions?: string[]; // default: ['.csv']
}

interface ValidationResult {
  valid: boolean;
  errors?: string[];
}

interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors?: Array<{ row: number; message: string }>;
}
```

### Example Import Configuration

```typescript
const contactImportConfig: ImportConfig<Contact> = {
  templateFilename: 'contact-import-template.csv',
  templateHeaders: ['Name', 'Email', 'Phone', 'Role'],
  
  validateRow: (row, rowIndex) => {
    const errors: string[] = [];
    
    if (!row[0] || row[0].trim() === '') {
      errors.push('Name is required');
    }
    
    if (!row[1] || !row[1].includes('@')) {
      errors.push('Valid email is required');
    }
    
    if (row[3] && !['admin', 'user', 'viewer'].includes(row[3])) {
      errors.push('Role must be admin, user, or viewer');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  mapRow: (row) => ({
    name: row[0],
    email: row[1],
    phone: row[2] || undefined,
    role: row[3] || 'user',
  }),
  
  onImport: async (items) => {
    const results = await contactsStore.bulkCreate(items);
    return {
      success: results.failed === 0,
      imported: results.imported,
      failed: results.failed,
      errors: results.errors,
    };
  },
  
  instructions: 'Upload a CSV file with columns: Name, Email, Phone, Role',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ['.csv'],
};
```

---

## Stats Configuration

### StatDefinition<T>

```typescript
interface StatDefinition<T> {
  label: string;
  value: (items: T[], store: any) => number | string;
  format?: (value: number | string) => string;
}
```

### Example Stats Configuration

```typescript
const contactStats: StatDefinition<Contact>[] = [
  {
    label: 'Total Contacts',
    value: (items) => items.length,
  },
  {
    label: 'Active',
    value: (items) => items.filter(c => c.status === 'active').length,
  },
  {
    label: 'Admins',
    value: (items) => items.filter(c => c.role === 'admin').length,
  },
  {
    label: 'This Month',
    value: (items) => {
      const thisMonth = new Date().getMonth();
      return items.filter(c => 
        new Date(c.createdAt).getMonth() === thisMonth
      ).length;
    },
  },
];
```

### Usage in Component

```typescript
const baseList = useBaseList({
  // ... other config
  stats: contactStats,
  features: {
    allowStats: true, // Enable stats display
  },
});

// Stats are automatically rendered
// - baseList.renderStats()
```

---

## Best Practices

### 1. Type Safety

Always use TypeScript generics for type safety:

```typescript
const baseList = useBaseList<Contact, ReturnType<typeof useContactsEnhanced>>({
  // Configuration is now type-safe
});
```

### 2. Configuration Organization

Keep configuration in separate files:

```
src/config/
  contactConfig.ts    // All contact-related configs
  userConfig.ts       // All user-related configs
  listColumns.ts      // Shared column helpers
  listFilters.ts      // Shared filter helpers
  listBulkActions.ts  // Shared bulk action helpers
```

### 3. Permission Checks

Always specify permissions for entities that require authorization:

```typescript
permissions: {
  create: Permission.CONTACT_CREATE,
  update: Permission.CONTACT_UPDATE,
  delete: Permission.CONTACT_DELETE,
}
```

### 4. Feature Flags for Variants

Use feature flags to create list variants:

```typescript
// Read-only dashboard variant
features: {
  allowCreate: false,
  allowEdit: false,
  allowDelete: false,
  allowBulkActions: false,
  allowExport: true,
}
```

### 5. Error Handling

The framework handles errors automatically, but you can customize error messages:

```typescript
onEdit: (item) => {
  try {
    // Custom edit logic
  } catch (error) {
    console.error('Edit failed:', error);
    // Framework will show default error
  }
}
```

### 6. Performance

Use memoization for expensive computations:

```typescript
const columns = useMemo(() => contactColumns, []);
const filters = useMemo(() => contactFilters, []);
const stats = useMemo(() => contactStats, []);
```

---

## Troubleshooting

### Issue: Filters not working

**Solution:** Ensure your store implements the `setFilters` method and filter keys match:

```typescript
// In store
setFilters: (filters: Record<string, any>) => {
  set({ filters });
  get().fetchItems();
}

// In filter definition
{
  key: 'status', // Must match store filter key
  storeKey: 'statusFilter', // Use if store key is different
}
```

### Issue: Bulk actions not showing

**Solution:** Check feature flags and permissions:

```typescript
features: {
  allowBulkActions: true, // Must be true
}

// And ensure user has required permissions
bulkActions: [{
  requirePermission: Permission.CONTACT_UPDATE,
}]
```

### Issue: Export not working

**Solution:** Verify export configuration is complete:

```typescript
export: {
  filename: (date) => `export-${date}.csv`,
  headers: ['Column1', 'Column2'],
  mapRow: (item) => [item.field1, item.field2],
}
```

### Issue: TypeScript errors

**Solution:** Ensure proper generic types:

```typescript
// Correct
useBaseList<Contact, ReturnType<typeof useContactsEnhanced>>({...})

// Incorrect
useBaseList({...}) // Missing type parameters
```

---

## Additional Resources

- [Migration Guide](./MIGRATION_GUIDE.md) - Step-by-step migration instructions
- [Examples](./EXAMPLES.md) - Complete example implementations
- [API Reference](./API_REFERENCE.md) - Detailed API documentation
