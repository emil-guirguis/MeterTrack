/**
 * Device Configuration
 * 
 * Centralized configuration for Device entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * This configuration is shared between DeviceForm and DeviceList components.
 */

import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import { field } from '@framework/forms/utils/formSchema';
import { defineEntitySchema } from '@framework/forms/utils/entitySchema';
import {
  createTwoLineColumn,
} from '../../config/listHelpers';

// ============================================================================
// UNIFIED SCHEMA DEFINITION
// ============================================================================

/**
 * Device entity schema - single source of truth for Device entity
 * Defines form fields, entity fields, and legacy field mappings
 */
export const deviceSchema = defineEntitySchema({
  formFields: {
    description: field({ type: 'string', default: '', required: true, label: 'Description' }),
    manufacturer: field({ type: 'string', default: '', required: true, label: 'Manufacturer' }),
    model_number: field({ type: 'string', default: '', required: true, label: 'Model Number' }),
    type: field({ type: 'string', default: '', required: true, label: 'Type' }),
    register_map: field({ type: 'string', default: '', label: 'Register Map' }),
  },
  
  entityFields: {
    id: { type: 'string' as const, default: '', readOnly: true },
    createdat: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedat: { type: 'date' as const, default: new Date(), readOnly: true },
  },
  
  legacyFields: {
    createdAt: { maps: 'createdat' },
    updatedAt: { maps: 'updatedat' },
  },
  
  entityName: 'Device',
  description: 'Device entity for hardware devices and equipment',
} as const);

/**
 * Device form schema - exported for backward compatibility
 * Used by DeviceForm component
 */
export const deviceFormSchema = deviceSchema.form;

/**
 * Device TypeScript type - inferred from schema with explicit entity fields
 */
export type Device = typeof deviceSchema._entityType & {
  id: string;
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
