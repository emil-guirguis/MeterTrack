# List Component Framework Examples

## Overview

This document provides complete, working examples of list components using the List Component Framework. Each example demonstrates different features and use cases.

## Table of Contents

- [Example 1: Basic List](#example-1-basic-list)
- [Example 2: Read-Only List](#example-2-read-only-list)
- [Example 3: List with Import](#example-3-list-with-import)
- [Example 4: List with Custom Actions](#example-4-list-with-custom-actions)
- [Example 5: Simple Dashboard List](#example-5-simple-dashboard-list)
- [Example 6: Advanced List with All Features](#example-6-advanced-list-with-all-features)

---

## Example 1: Basic List

A simple list with CRUD operations, search, and filters.

### Configuration File

```typescript
// src/config/productConfig.ts
import type { Product } from '@/types/entities';
import type { ColumnDefinition, FilterDefinition, ExportConfig } from '@/types/list';
import { Permission } from '@/types/auth';
import { renderStatusBadge, renderTwoLineCell, renderDateCell } from '@/utils/renderHelpers';

export const productColumns: ColumnDefinition<Product>[] = [
  {
    key: 'name',
    label: 'Product',
    sortable: true,
    render: (product) => renderTwoLineCell(product.name, product.sku),
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'price',
    label: 'Price',
    sortable: true,
    render: (product) => `$${product.price.toFixed(2)}`,
  },
  {
    key: 'stock',
    label: 'Stock',
    sortable: true,
    render: (product) => {
      const color = product.stock > 10 ? 'success' : product.stock > 0 ? 'warning' : 'error';
      return <span className={`badge badge-${color}`}>{product.stock}</span>;
    },
  },
  {
    key: 'status',
    label: 'Status',
    render: (product) => renderStatusBadge(product.status),
  },
];

export const productFilters: FilterDefinition[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search products...',
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { label: 'All Categories', value: '' },
      { label: 'Electronics', value: 'electronics' },
      { label: 'Clothing', value: 'clothing' },
      { label: 'Food', value: 'food' },
      { label: 'Books', value: 'books' },
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
];

export const productExportConfig: ExportConfig<Product> = {
  filename: (date) => `products-${date}.csv`,
  headers: ['Name', 'SKU', 'Category', 'Price', 'Stock', 'Status'],
  mapRow: (product) => [
    product.name,
    product.sku,
    product.category,
    product.price.toFixed(2),
    product.stock.toString(),
    product.status,
  ],
};
```

### Component File

```typescript
// src/components/products/ProductList.tsx
import React from 'react';
import { useProductsEnhanced } from '@/store/entities/productsStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import { Permission } from '@/types/auth';
import type { Product } from '@/types/entities';
import {
  productColumns,
  productFilters,
  productExportConfig,
} from '@/config/productConfig';

interface ProductListProps {
  onProductEdit?: (product: Product) => void;
  onProductCreate?: () => void;
}

export const ProductList: React.FC<ProductListProps> = ({
  onProductEdit,
  onProductCreate,
}) => {
  const baseList = useBaseList<Product, ReturnType<typeof useProductsEnhanced>>({
    entityName: 'product',
    entityNamePlural: 'products',
    useStore: useProductsEnhanced,
    columns: productColumns,
    filters: productFilters,
    export: productExportConfig,
    permissions: {
      create: Permission.PRODUCT_CREATE,
      update: Permission.PRODUCT_UPDATE,
      delete: Permission.PRODUCT_DELETE,
    },
    onEdit: onProductEdit,
    onCreate: onProductCreate,
  });

  return (
    <div className="product-list">
      <DataList
        title="Products"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No products found. Add your first product to get started."
        onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
        onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
```

---

## Example 2: Read-Only List

A read-only list for dashboards or reports with export capability.

### Configuration File

```typescript
// src/config/reportConfig.ts
import type { Report } from '@/types/entities';
import type { ColumnDefinition, StatDefinition, ExportConfig } from '@/types/list';
import { renderDateCell, renderStatusBadge } from '@/utils/renderHelpers';

export const reportColumns: ColumnDefinition<Report>[] = [
  {
    key: 'name',
    label: 'Report Name',
    sortable: true,
  },
  {
    key: 'type',
    label: 'Type',
    sortable: true,
  },
  {
    key: 'generatedAt',
    label: 'Generated',
    sortable: true,
    render: (report) => renderDateCell(report.generatedAt),
  },
  {
    key: 'status',
    label: 'Status',
    render: (report) => renderStatusBadge(report.status, {
      completed: 'success',
      processing: 'warning',
      failed: 'error',
    }),
  },
  {
    key: 'size',
    label: 'Size',
    render: (report) => `${(report.size / 1024).toFixed(2)} KB`,
  },
];

export const reportStats: StatDefinition<Report>[] = [
  {
    label: 'Total Reports',
    value: (items) => items.length,
  },
  {
    label: 'Completed',
    value: (items) => items.filter(r => r.status === 'completed').length,
  },
  {
    label: 'Processing',
    value: (items) => items.filter(r => r.status === 'processing').length,
  },
  {
    label: 'Failed',
    value: (items) => items.filter(r => r.status === 'failed').length,
  },
];

export const reportExportConfig: ExportConfig<Report> = {
  filename: (date) => `reports-${date}.csv`,
  headers: ['Name', 'Type', 'Generated', 'Status', 'Size (KB)'],
  mapRow: (report) => [
    report.name,
    report.type,
    new Date(report.generatedAt).toLocaleString(),
    report.status,
    (report.size / 1024).toFixed(2),
  ],
};
```

### Component File

```typescript
// src/components/reports/ReportList.tsx
import React from 'react';
import { useReportsEnhanced } from '@/store/entities/reportsStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import type { Report } from '@/types/entities';
import {
  reportColumns,
  reportStats,
  reportExportConfig,
} from '@/config/reportConfig';

export const ReportList: React.FC = () => {
  const baseList = useBaseList<Report, ReturnType<typeof useReportsEnhanced>>({
    entityName: 'report',
    entityNamePlural: 'reports',
    useStore: useReportsEnhanced,
    columns: reportColumns,
    stats: reportStats,
    export: reportExportConfig,
    features: {
      allowCreate: false,
      allowEdit: false,
      allowDelete: false,
      allowBulkActions: false,
      allowExport: true,
      allowStats: true,
    },
  });

  return (
    <div className="report-list">
      <DataList
        title="Reports"
        stats={baseList.renderStats()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No reports available."
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
```

---

## Example 3: List with Import

A list with CSV import functionality for bulk data entry.


### Configuration File

```typescript
// src/config/customerConfig.ts
import type { Customer } from '@/types/entities';
import type { 
  ColumnDefinition, 
  FilterDefinition, 
  ExportConfig,
  ImportConfig 
} from '@/types/list';
import { Permission } from '@/types/auth';
import { renderTwoLineCell, renderStatusBadge, renderDateCell } from '@/utils/renderHelpers';

export const customerColumns: ColumnDefinition<Customer>[] = [
  {
    key: 'name',
    label: 'Customer',
    sortable: true,
    render: (customer) => renderTwoLineCell(customer.name, customer.email),
  },
  {
    key: 'company',
    label: 'Company',
    sortable: true,
  },
  {
    key: 'phone',
    label: 'Phone',
    hideOnMobile: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (customer) => renderStatusBadge(customer.status),
  },
  {
    key: 'createdAt',
    label: 'Created',
    sortable: true,
    render: (customer) => renderDateCell(customer.createdAt),
    hideOnMobile: true,
  },
];

export const customerFilters: FilterDefinition[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search customers...',
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
];

export const customerExportConfig: ExportConfig<Customer> = {
  filename: (date) => `customers-${date}.csv`,
  headers: ['Name', 'Email', 'Company', 'Phone', 'Status'],
  mapRow: (customer) => [
    customer.name,
    customer.email,
    customer.company || '',
    customer.phone || '',
    customer.status,
  ],
};

export const customerImportConfig: ImportConfig<Customer> = {
  templateFilename: 'customer-import-template.csv',
  templateHeaders: ['Name', 'Email', 'Company', 'Phone', 'Status'],
  
  validateRow: (row, rowIndex) => {
    const errors: string[] = [];
    
    // Validate name (required)
    if (!row[0] || row[0].trim() === '') {
      errors.push('Name is required');
    }
    
    // Validate email (required and format)
    if (!row[1] || !row[1].includes('@')) {
      errors.push('Valid email is required');
    }
    
    // Validate status (optional but must be valid if provided)
    if (row[4] && !['active', 'inactive'].includes(row[4].toLowerCase())) {
      errors.push('Status must be "active" or "inactive"');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  mapRow: (row) => ({
    name: row[0].trim(),
    email: row[1].trim().toLowerCase(),
    company: row[2]?.trim() || undefined,
    phone: row[3]?.trim() || undefined,
    status: row[4]?.toLowerCase() || 'active',
  }),
  
  onImport: async (items) => {
    try {
      const results = await customersStore.bulkCreate(items);
      return {
        success: results.failed === 0,
        imported: results.imported,
        failed: results.failed,
        errors: results.errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: items.length,
        errors: [{ row: 0, message: 'Import failed: ' + error.message }],
      };
    }
  },
  
  instructions: 'Upload a CSV file with columns: Name, Email, Company, Phone, Status. Name and Email are required.',
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedExtensions: ['.csv'],
};
```

### Component File

```typescript
// src/components/customers/CustomerList.tsx
import React from 'react';
import { useCustomersEnhanced } from '@/store/entities/customersStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import { Permission } from '@/types/auth';
import type { Customer } from '@/types/entities';
import {
  customerColumns,
  customerFilters,
  customerExportConfig,
  customerImportConfig,
} from '@/config/customerConfig';

interface CustomerListProps {
  onCustomerEdit?: (customer: Customer) => void;
  onCustomerCreate?: () => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({
  onCustomerEdit,
  onCustomerCreate,
}) => {
  const baseList = useBaseList<Customer, ReturnType<typeof useCustomersEnhanced>>({
    entityName: 'customer',
    entityNamePlural: 'customers',
    useStore: useCustomersEnhanced,
    columns: customerColumns,
    filters: customerFilters,
    export: customerExportConfig,
    import: customerImportConfig,
    features: {
      allowImport: true, // Enable import functionality
    },
    permissions: {
      create: Permission.CUSTOMER_CREATE,
      update: Permission.CUSTOMER_UPDATE,
      delete: Permission.CUSTOMER_DELETE,
    },
    onEdit: onCustomerEdit,
    onCreate: onCustomerCreate,
  });

  return (
    <div className="customer-list">
      <DataList
        title="Customers"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No customers found. Add customers manually or import from CSV."
        onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
        onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};
```

---

## Example 4: List with Custom Actions

A list with custom bulk actions and entity-specific operations.

### Configuration File

```typescript
// src/config/orderConfig.ts
import type { Order } from '@/types/entities';
import type { 
  ColumnDefinition, 
  FilterDefinition, 
  BulkActionConfig,
  StatDefinition,
  ExportConfig 
} from '@/types/list';
import { Permission } from '@/types/auth';
import { renderTwoLineCell, renderStatusBadge, renderDateCell } from '@/utils/renderHelpers';

export const orderColumns: ColumnDefinition<Order>[] = [
  {
    key: 'orderNumber',
    label: 'Order',
    sortable: true,
    render: (order) => renderTwoLineCell(
      `#${order.orderNumber}`,
      order.customerName
    ),
  },
  {
    key: 'total',
    label: 'Total',
    sortable: true,
    render: (order) => `$${order.total.toFixed(2)}`,
  },
  {
    key: 'status',
    label: 'Status',
    render: (order) => renderStatusBadge(order.status, {
      pending: 'warning',
      processing: 'primary',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error',
    }),
  },
  {
    key: 'orderDate',
    label: 'Order Date',
    sortable: true,
    render: (order) => renderDateCell(order.orderDate),
    hideOnMobile: true,
  },
];

export const orderFilters: FilterDefinition[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search orders...',
  },
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'All Statuses', value: '' },
      { label: 'Pending', value: 'pending' },
      { label: 'Processing', value: 'processing' },
      { label: 'Shipped', value: 'shipped' },
      { label: 'Delivered', value: 'delivered' },
      { label: 'Cancelled', value: 'cancelled' },
    ],
  },
  {
    key: 'dateRange',
    label: 'Date Range',
    type: 'select',
    options: [
      { label: 'All Time', value: '' },
      { label: 'Today', value: 'today' },
      { label: 'This Week', value: 'week' },
      { label: 'This Month', value: 'month' },
    ],
  },
];

export const orderStats: StatDefinition<Order>[] = [
  {
    label: 'Total Orders',
    value: (items) => items.length,
  },
  {
    label: 'Pending',
    value: (items) => items.filter(o => o.status === 'pending').length,
  },
  {
    label: 'Processing',
    value: (items) => items.filter(o => o.status === 'processing').length,
  },
  {
    label: 'Total Revenue',
    value: (items) => items.reduce((sum, o) => sum + o.total, 0),
    format: (value) => `$${Number(value).toFixed(2)}`,
  },
];

export const orderBulkActions: BulkActionConfig<Order>[] = [
  {
    id: 'mark-processing',
    label: 'Mark as Processing',
    icon: 'refresh',
    color: 'primary',
    confirm: true,
    confirmMessage: (items) => `Mark ${items.length} order(s) as processing?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'processing');
    },
    requirePermission: Permission.ORDER_UPDATE,
  },
  {
    id: 'mark-shipped',
    label: 'Mark as Shipped',
    icon: 'local_shipping',
    color: 'info',
    confirm: true,
    confirmMessage: (items) => `Mark ${items.length} order(s) as shipped?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'shipped');
    },
    requirePermission: Permission.ORDER_UPDATE,
  },
  {
    id: 'cancel-orders',
    label: 'Cancel Orders',
    icon: 'cancel',
    color: 'error',
    confirm: true,
    confirmMessage: (items) => 
      `Cancel ${items.length} order(s)? This action cannot be undone.`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'cancelled');
    },
    requirePermission: Permission.ORDER_DELETE,
  },
  {
    id: 'generate-invoices',
    label: 'Generate Invoices',
    icon: 'receipt',
    color: 'secondary',
    confirm: false,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.generateInvoices(ids);
      alert(`Generated ${items.length} invoice(s)`);
    },
    requirePermission: Permission.ORDER_UPDATE,
  },
];

export const orderExportConfig: ExportConfig<Order> = {
  filename: (date) => `orders-${date}.csv`,
  headers: ['Order Number', 'Customer', 'Total', 'Status', 'Order Date'],
  mapRow: (order) => [
    order.orderNumber,
    order.customerName,
    order.total.toFixed(2),
    order.status,
    new Date(order.orderDate).toLocaleDateString(),
  ],
};
```

### Component File

```typescript
// src/components/orders/OrderList.tsx
import React from 'react';
import { useOrdersEnhanced } from '@/store/entities/ordersStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import { Permission } from '@/types/auth';
import type { Order } from '@/types/entities';
import {
  orderColumns,
  orderFilters,
  orderStats,
  orderBulkActions,
  orderExportConfig,
} from '@/config/orderConfig';

interface OrderListProps {
  onOrderEdit?: (order: Order) => void;
  onOrderCreate?: () => void;
}

export const OrderList: React.FC<OrderListProps> = ({
  onOrderEdit,
  onOrderCreate,
}) => {
  const baseList = useBaseList<Order, ReturnType<typeof useOrdersEnhanced>>({
    entityName: 'order',
    entityNamePlural: 'orders',
    useStore: useOrdersEnhanced,
    columns: orderColumns,
    filters: orderFilters,
    stats: orderStats,
    bulkActions: orderBulkActions,
    export: orderExportConfig,
    permissions: {
      create: Permission.ORDER_CREATE,
      update: Permission.ORDER_UPDATE,
      delete: Permission.ORDER_DELETE,
    },
    onEdit: onOrderEdit,
    onCreate: onOrderCreate,
  });

  return (
    <div className="order-list">
      <DataList
        title="Orders"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No orders found. Create your first order to get started."
        onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
        onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
```

---

## Example 5: Simple Dashboard List

A minimal list for dashboard widgets with limited features.

### Configuration File

```typescript
// src/config/activityConfig.ts
import type { Activity } from '@/types/entities';
import type { ColumnDefinition } from '@/types/list';
import { renderDateCell } from '@/utils/renderHelpers';

export const activityColumns: ColumnDefinition<Activity>[] = [
  {
    key: 'description',
    label: 'Activity',
  },
  {
    key: 'user',
    label: 'User',
    hideOnMobile: true,
  },
  {
    key: 'timestamp',
    label: 'Time',
    render: (activity) => renderDateCell(activity.timestamp),
  },
];
```

### Component File

```typescript
// src/components/dashboard/RecentActivityList.tsx
import React from 'react';
import { useActivitiesEnhanced } from '@/store/entities/activitiesStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import type { Activity } from '@/types/entities';
import { activityColumns } from '@/config/activityConfig';

export const RecentActivityList: React.FC = () => {
  const baseList = useBaseList<Activity, ReturnType<typeof useActivitiesEnhanced>>({
    entityName: 'activity',
    entityNamePlural: 'activities',
    useStore: useActivitiesEnhanced,
    columns: activityColumns,
    features: {
      allowCreate: false,
      allowEdit: false,
      allowDelete: false,
      allowBulkActions: false,
      allowExport: false,
      allowSearch: false,
      allowFilters: false,
      allowStats: false,
      allowPagination: false,
    },
  });

  return (
    <div className="recent-activity-list">
      <DataList
        title="Recent Activity"
        data={baseList.data.slice(0, 10)} // Show only 10 most recent
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No recent activity."
      />
    </div>
  );
};
```

---

## Example 6: Advanced List with All Features

A comprehensive list demonstrating all framework features.

### Configuration File

```typescript
// src/config/assetConfig.ts
import type { Asset } from '@/types/entities';
import type { 
  ColumnDefinition, 
  FilterDefinition, 
  StatDefinition,
  BulkActionConfig,
  ExportConfig,
  ImportConfig 
} from '@/types/list';
import { Permission } from '@/types/auth';
import { 
  renderTwoLineCell, 
  renderStatusBadge, 
  renderDateCell,
  renderBadgeList 
} from '@/utils/renderHelpers';
import { extractUniqueValues } from '@/utils/listHelpers';

export const assetColumns: ColumnDefinition<Asset>[] = [
  {
    key: 'name',
    label: 'Asset',
    sortable: true,
    render: (asset) => renderTwoLineCell(asset.name, asset.serialNumber),
  },
  {
    key: 'category',
    label: 'Category',
    sortable: true,
  },
  {
    key: 'location',
    label: 'Location',
    sortable: true,
    hideOnMobile: true,
  },
  {
    key: 'status',
    label: 'Status',
    render: (asset) => renderStatusBadge(asset.status, {
      active: 'success',
      inactive: 'secondary',
      maintenance: 'warning',
      retired: 'error',
    }),
  },
  {
    key: 'tags',
    label: 'Tags',
    render: (asset) => renderBadgeList(asset.tags || []),
    hideOnMobile: true,
  },
  {
    key: 'lastMaintenance',
    label: 'Last Maintenance',
    sortable: true,
    render: (asset) => renderDateCell(asset.lastMaintenance),
    hideOnMobile: true,
    hideOnTablet: true,
  },
];

export const assetFilters: FilterDefinition[] = [
  {
    key: 'search',
    label: 'Search',
    type: 'text',
    placeholder: 'Search assets...',
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: (items) => [
      { label: 'All Categories', value: '' },
      ...extractUniqueValues(items, 'category').map(cat => ({
        label: cat,
        value: cat,
      })),
    ],
  },
  {
    key: 'location',
    label: 'Location',
    type: 'select',
    options: (items) => [
      { label: 'All Locations', value: '' },
      ...extractUniqueValues(items, 'location').map(loc => ({
        label: loc,
        value: loc,
      })),
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
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Retired', value: 'retired' },
    ],
  },
];

export const assetStats: StatDefinition<Asset>[] = [
  {
    label: 'Total Assets',
    value: (items) => items.length,
  },
  {
    label: 'Active',
    value: (items) => items.filter(a => a.status === 'active').length,
  },
  {
    label: 'In Maintenance',
    value: (items) => items.filter(a => a.status === 'maintenance').length,
  },
  {
    label: 'Needs Maintenance',
    value: (items) => {
      const now = new Date();
      const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));
      return items.filter(a => 
        new Date(a.lastMaintenance) < sixMonthsAgo && 
        a.status === 'active'
      ).length;
    },
  },
];

export const assetBulkActions: BulkActionConfig<Asset>[] = [
  {
    id: 'activate',
    label: 'Activate',
    icon: 'check_circle',
    color: 'success',
    confirm: true,
    confirmMessage: (items) => `Activate ${items.length} asset(s)?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'active');
    },
    requirePermission: Permission.ASSET_UPDATE,
  },
  {
    id: 'maintenance',
    label: 'Mark for Maintenance',
    icon: 'build',
    color: 'warning',
    confirm: true,
    confirmMessage: (items) => `Mark ${items.length} asset(s) for maintenance?`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'maintenance');
    },
    requirePermission: Permission.ASSET_UPDATE,
  },
  {
    id: 'retire',
    label: 'Retire Assets',
    icon: 'archive',
    color: 'error',
    confirm: true,
    confirmMessage: (items) => 
      `Retire ${items.length} asset(s)? They will be moved to retired status.`,
    action: async (items, store) => {
      const ids = items.map(item => item.id);
      await store.bulkUpdateStatus(ids, 'retired');
    },
    requirePermission: Permission.ASSET_UPDATE,
  },
  {
    id: 'assign-location',
    label: 'Assign Location',
    icon: 'place',
    color: 'primary',
    confirm: false,
    action: async (items, store) => {
      const location = prompt('Enter location:');
      if (location) {
        const ids = items.map(item => item.id);
        await store.bulkUpdateLocation(ids, location);
      }
    },
    requirePermission: Permission.ASSET_UPDATE,
  },
];

export const assetExportConfig: ExportConfig<Asset> = {
  filename: (date) => `assets-${date}.csv`,
  headers: [
    'Name',
    'Serial Number',
    'Category',
    'Location',
    'Status',
    'Tags',
    'Last Maintenance',
    'Purchase Date',
    'Value',
  ],
  mapRow: (asset) => [
    asset.name,
    asset.serialNumber,
    asset.category,
    asset.location,
    asset.status,
    (asset.tags || []).join('; '),
    new Date(asset.lastMaintenance).toLocaleDateString(),
    new Date(asset.purchaseDate).toLocaleDateString(),
    asset.value.toFixed(2),
  ],
  includeInfo: 'Asset inventory export from MeterIt',
};

export const assetImportConfig: ImportConfig<Asset> = {
  templateFilename: 'asset-import-template.csv',
  templateHeaders: [
    'Name',
    'Serial Number',
    'Category',
    'Location',
    'Status',
    'Purchase Date',
    'Value',
  ],
  
  validateRow: (row, rowIndex) => {
    const errors: string[] = [];
    
    if (!row[0]?.trim()) errors.push('Name is required');
    if (!row[1]?.trim()) errors.push('Serial Number is required');
    if (!row[2]?.trim()) errors.push('Category is required');
    if (!row[3]?.trim()) errors.push('Location is required');
    
    if (row[4] && !['active', 'inactive', 'maintenance', 'retired'].includes(row[4].toLowerCase())) {
      errors.push('Status must be active, inactive, maintenance, or retired');
    }
    
    if (row[6] && isNaN(parseFloat(row[6]))) {
      errors.push('Value must be a number');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined,
    };
  },
  
  mapRow: (row) => ({
    name: row[0].trim(),
    serialNumber: row[1].trim(),
    category: row[2].trim(),
    location: row[3].trim(),
    status: row[4]?.toLowerCase() || 'active',
    purchaseDate: row[5] ? new Date(row[5]).toISOString() : new Date().toISOString(),
    value: row[6] ? parseFloat(row[6]) : 0,
  }),
  
  onImport: async (items) => {
    try {
      const results = await assetsStore.bulkCreate(items);
      return {
        success: results.failed === 0,
        imported: results.imported,
        failed: results.failed,
        errors: results.errors,
      };
    } catch (error) {
      return {
        success: false,
        imported: 0,
        failed: items.length,
        errors: [{ row: 0, message: 'Import failed: ' + error.message }],
      };
    }
  },
  
  instructions: 'Upload a CSV file with asset information. Name, Serial Number, Category, and Location are required.',
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.csv'],
};
```

### Component File

```typescript
// src/components/assets/AssetList.tsx
import React from 'react';
import { useAssetsEnhanced } from '@/store/entities/assetsStore';
import { useBaseList } from '@/hooks/useBaseList';
import { DataList } from '@/components/common/DataList';
import { Permission } from '@/types/auth';
import type { Asset } from '@/types/entities';
import {
  assetColumns,
  assetFilters,
  assetStats,
  assetBulkActions,
  assetExportConfig,
  assetImportConfig,
} from '@/config/assetConfig';

interface AssetListProps {
  onAssetEdit?: (asset: Asset) => void;
  onAssetCreate?: () => void;
  onAssetSelect?: (asset: Asset) => void;
}

export const AssetList: React.FC<AssetListProps> = ({
  onAssetEdit,
  onAssetCreate,
  onAssetSelect,
}) => {
  const baseList = useBaseList<Asset, ReturnType<typeof useAssetsEnhanced>>({
    entityName: 'asset',
    entityNamePlural: 'assets',
    useStore: useAssetsEnhanced,
    columns: assetColumns,
    filters: assetFilters,
    stats: assetStats,
    bulkActions: assetBulkActions,
    export: assetExportConfig,
    import: assetImportConfig,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: true,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.ASSET_CREATE,
      update: Permission.ASSET_UPDATE,
      delete: Permission.ASSET_DELETE,
    },
    onEdit: onAssetEdit,
    onCreate: onAssetCreate,
    onSelect: onAssetSelect,
  });

  return (
    <div className="asset-list">
      <DataList
        title="Assets"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No assets found. Add assets manually or import from CSV."
        onEdit={baseList.canUpdate ? baseList.handleEdit : undefined}
        onDelete={baseList.canDelete ? baseList.handleDelete : undefined}
        onSelect={onAssetSelect}
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

## Summary

These examples demonstrate the flexibility and power of the List Component Framework:

1. **Example 1 (Basic List)**: Simple CRUD operations with search and filters
2. **Example 2 (Read-Only List)**: Dashboard view with stats and export only
3. **Example 3 (List with Import)**: Bulk data entry via CSV import
4. **Example 4 (Custom Actions)**: Entity-specific bulk operations
5. **Example 5 (Simple Dashboard)**: Minimal widget with limited features
6. **Example 6 (Advanced List)**: All features combined

Each example shows how to:
- Structure configuration files
- Use the `useBaseList` hook
- Configure features and permissions
- Implement custom logic when needed
- Keep components clean and maintainable

For more information, see:
- [Framework Documentation](./LIST_FRAMEWORK_DOCUMENTATION.md)
- [Migration Guide](./MIGRATION_GUIDE.md)
