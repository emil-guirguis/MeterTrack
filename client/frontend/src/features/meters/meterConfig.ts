/**
 * Meter Configuration
 * 
 * Centralized configuration for Meter entity including:
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * Schema is now loaded dynamically from the backend API.
 * This configuration is shared between MeterForm and MeterList components.
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import {
  createStatusColumn,
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';
import type {
  Meter,
  CreateMeterRequest,
  UpdateMeterRequest,
  MeterConfig,
  MeterReading,
  RegisterMap,
  RegisterMapField,
} from '../../config/meterFieldTypes';
// Re-export types for use in other components
export type { Meter, CreateMeterRequest, UpdateMeterRequest, MeterConfig, MeterReading, RegisterMap, RegisterMapField };

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for meter list
 * Note: Connection test functionality is handled separately in the component
 */
export const meterColumns: ColumnDefinition<Meter>[] = [
  {
    key: 'name' as keyof Meter,
    label: 'Description',
    sortable: false,
    responsive: 'hide-mobile',
    render: (value) => value || 'N/A',
  },

  {
    key: 'type' as keyof Meter,
    label: 'Type',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      if (!value) return 'N/A';
      const typeLabels: Record<string, string> = {
        electric: 'Electric',
        gas: 'Gas',
        water: 'Water',
        steam: 'Steam',
        other: 'Other',
      };
      return typeLabels[value] || value;
    },
  },

  {
    key: 'location' as keyof Meter,
    label: 'Location',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => value || 'Not specified',
  },

  {
    key: 'ip' as keyof Meter,
    label: 'IP Address',
    sortable: true,
    render: (value) => value || 'Unknown',
  },

  {
    key: 'serial_number' as keyof Meter,
    label: 'Serial Number',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => value || 'N/A',
  },

  createStatusColumn<Meter>('status', 'Status', {
    labels: {
      active: 'Active',
      inactive: 'Inactive',
      maintenance: 'Maintenance',
    },
  }),

  {
    key: 'lastReading' as keyof Meter,
    label: 'Last Reading',
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      if (!value) return 'No data';
      const reading = value as Meter['lastReading'];
      if (!reading) return 'No data';
      return React.createElement('div', { className: 'table-cell--two-line' },
        React.createElement('div', { className: 'table-cell__primary' },
          `${reading.value} ${reading.unit}`
        ),
        React.createElement('div', { className: 'table-cell__secondary' },
          new Date(reading.timestamp).toLocaleDateString()
        )
      );
    },
  },
];

/**
 * Filter definitions for meter list
 */
export const meterFilters: FilterDefinition[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'Electric', value: 'electric' },
      { label: 'Gas', value: 'gas' },
      { label: 'Water', value: 'water' },
      { label: 'Steam', value: 'steam' },
      { label: 'Other', value: 'other' },
    ],
    placeholder: 'All Types',
  },

  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Maintenance', value: 'maintenance' },
    ],
    placeholder: 'All Statuses',
  },

  {
    key: 'locationId',
    label: 'Location',
    type: 'select',
    options: (items: Meter[]) => {
      const locations = items
        .map(item => item.location)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();

      return locations.map(location => ({
        label: location as string,
        value: location as string,
      }));
    },
    placeholder: 'All Locations',
  },
];

/**
 * Bulk action configurations for meter list
 */
export function createMeterBulkActions(
  store: { bulkUpdateStatus: (ids: string[], status: string) => Promise<void> },
  exportFunction: (items: Meter[]) => void
): BulkActionConfig<Meter>[] {
  return [
    ...createStandardStatusActions<Meter>(
      'meter',
      'meters',
      store.bulkUpdateStatus,
      {
        requirePermission: Permission.METER_UPDATE,
        includeMaintenance: true,
      }
    ),
    createExportAction<Meter>(exportFunction),
  ];
}

/**
 * Export configuration for meter list
 */
export const meterExportConfig: ExportConfig<Meter> = {
  filename: (date: string) => `meters_export_${date}.csv`,
  headers: [
    'Location',
    'IP Address',
    'Serial Number',
    'Type',
    'Status',
    'Configuration IP',
    'Configuration Port',
    'Slave ID',
    'Last Reading Value',
    'Last Reading Unit',
    'Last Reading Timestamp',
    'Last Reading Quality',
    'Created',
  ],
  mapRow: (meter: Meter) => [
    meter.location || '',
    meter.ip || '',
    meter.serial_number || '',
    meter.type || '',
    meter.status,
    meter.configuration?.ipAddress || '',
    meter.configuration?.port || 502,
    meter.configuration?.slaveId || 1,
    meter.lastReading?.value || '',
    meter.lastReading?.unit || '',
    meter.lastReading?.timestamp ? new Date(meter.lastReading.timestamp).toISOString() : '',
    meter.lastReading?.quality || '',
    new Date(meter.createdAt).toISOString(),
  ],
  includeInfo: 'Meter export with full details including configuration, last reading, and metadata',
};
