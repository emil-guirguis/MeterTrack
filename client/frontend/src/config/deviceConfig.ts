/**
 * Device List Configuration
 * 
 * Defines columns, filters, stats, bulk actions, and export configuration
 * for the DeviceList component using the list framework.
 */

import type { Device } from '../types/device';
import type { ColumnDefinition } from '../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '../types/list';
import { Permission } from '../types/auth';
import {
  createTwoLineColumn,
} from './listHelpers';

/**
 * Column definitions for device list
 */
export const deviceColumns: ColumnDefinition<Device>[] = [
  createTwoLineColumn<Device>(
    'type',
    'Device Type',
    'manufacturer',
    {
      sortable: true,
      secondaryRender: (device) => device.manufacturer || '',
    }
  ),
  
  {
    key: 'model_number' as keyof Device,
    label: 'Model Number',
    sortable: true,
    render: (_, device) => device.model_number || '-',
  },
  
  {
    key: 'description' as keyof Device,
    label: 'Description',
    sortable: false,
    responsive: 'hide-mobile',
    render: (_, device) => device.description || '-',
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
    value: (items) => items.length,
  },
  {
    label: 'Device Types',
    value: (items) => {
      const types = new Set(items.map(d => d.type).filter(Boolean));
      return types.size;
    },
  },
  {
    label: 'Manufacturers',
    value: (items) => {
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
