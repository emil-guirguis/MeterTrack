/**
 * Device Configuration
 * 
 * Centralized configuration for Device entity including:
 * - Stats, bulk actions, and export configuration
 * 
 * Schema is now loaded dynamically from the backend API.
 * Columns and filters are auto-generated from the schema using showOn: ['list'].
 * This configuration is shared between DeviceForm and DeviceList components.
 */

import type { StatDefinition, BulkActionConfig, ExportConfig } from '@framework/components/list/types/list';
import { Permission } from '../../types/auth';

// ============================================================================
// TYPE DEFINITION
// ============================================================================

/**
 * Device TypeScript type
 */
export type Device = {
  id: string;
  manufacturer: string;
  model_number: string;
  description?: string;
  type: string;
  active?: boolean;
  created_at?: Date;
  updated_at?: Date;
};

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

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
    'Manufacturer',
    'Model Number',
    'Description',
    'Type',
    'Active',
    'Created',
    'Updated',
  ],
  mapRow: (device: Device) => [
    device.type,
    device.manufacturer,
    device.model_number || '',
    device.description || '',
    device.active ? 'Yes' : 'No',
    device.created_at ? new Date(device.created_at).toISOString() : '',
    device.updated_at ? new Date(device.updated_at).toISOString() : '',
  ],
  includeInfo: 'Device export with full details including type, manufacturer, model, and metadata',
};
