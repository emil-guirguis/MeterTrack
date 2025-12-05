/**
 * Device Configuration
 * 
 * Centralized configuration for Device entity including:
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * Schema is now loaded dynamically from the backend API.
 * This configuration is shared between DeviceForm and DeviceList components.
 */

import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import {
  createStatusColumn,
  createTwoLineColumn,
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';

// ============================================================================
// TYPE DEFINITION
// ============================================================================

/**
 * Device TypeScript type
 */
export type Device = {
  id: string;
  type: string;
  manufacturer: string;
  model_number: string;
  description?: string;
  register_map?: string;
  createdat: Date;
  updatedat: Date;
  createdAt?: Date;
  updatedAt?: Date;
};

// ============================================================================
// LIST CONFIGURATION
// ============================================================================


/**
 * Column definitions for device list
 */
export const deviceColumns: ColumnDefinition<Device>[] = [
  createTwoLineColumn<Device>(
    'type',
    'Device Type',
    'manufacturer',
    {
      responsive: 'hide-mobile',
      fallback: 'N/A',
    }
  ),

  {
    key: 'model_number' as keyof Device,
    label: 'Model Number',
    sortable: true,
    responsive: 'hide-tablet',
    render: (_, device) => (device as any).model_number || 'N/A',
  },

  {
    key: 'description' as keyof Device,
    label: 'Description',
    sortable: false,
    responsive: 'hide-mobile',
    render: (_, device) => (device as any).description || 'N/A',
  },
];

/**
 * Filter definitions for device list
 */
export const deviceFilters: FilterDefinition[] = [
  {
    key: 'type',
    label: 'Device Type',
    type: 'select',
    options: (items: Device[]) => {
      const uniqueValues = items
        .map(item => item.type)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

      return uniqueValues.map(value => ({
        label: String(value),
        value: String(value),
      }));
    },
    placeholder: 'All Types',
  },

  {
    key: 'manufacturer',
    label: 'Manufacturer',
    type: 'select',
    options: (items: Device[]) => {
      const uniqueValues = items
        .map(item => item.manufacturer)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

      return uniqueValues.map(value => ({
        label: String(value),
        value: String(value),
      }));
    },
    placeholder: 'All Manufacturers',
  },
];

/**
 * Stats definitions for device list
 */
export const deviceStats: StatDefinition<Device>[] = [
  {
    label: 'Total Devices',
    value: (items) => Array.isArray(items) ? items.length : 0,
  },
  {
    label: 'Device Types',
    value: (items) => {
      if (!Array.isArray(items)) return 0;
      const types = new Set(items.map(d => d.type).filter(Boolean));
      return types.size;
    },
  },
  {
    label: 'Manufacturers',
    value: (items) => {
      if (!Array.isArray(items)) return 0;
      const manufacturers = new Set(items.map(d => d.manufacturer).filter(Boolean));
      return manufacturers.size;
    },
  },
];

/**
 * Bulk action configurations for device list
 */
export function createDeviceBulkActions(
  store: { bulkDelete: (ids: string[]) => Promise<void> }
): BulkActionConfig<Device>[] {
  return [
    {
      id: 'delete',
      label: 'Delete Selected',
      icon: 'delete',
      color: 'error',
      confirm: true,
      confirmMessage: (items: Device[]) =>
        `Are you sure you want to delete ${items.length} device(s)? This action cannot be undone.`,
      action: async (items: Device[]) => {
        const ids = items.map(item => item.id);
        await store.bulkDelete(ids);
      },
      requirePermission: Permission.DEVICE_DELETE,
    },
  ];
}

/**
 * Export configuration for device list
 */
export const deviceExportConfig: ExportConfig<Device> = {
  filename: (date: string) => `devices_export_${date}.csv`,
  headers: [
    'Type',
    'Manufacturer',
    'Model Number',
    'Description',
    'Created',
    'Updated',
  ],
  mapRow: (device: Device) => [
    device.type,
    device.manufacturer,
    device.model_number || '',
    device.description || '',
    device.createdAt ? new Date(device.createdAt).toISOString() : '',
    device.updatedAt ? new Date(device.updatedAt).toISOString() : '',
  ],
  includeInfo: 'Device export with full details including type, manufacturer, model, and metadata',
};
