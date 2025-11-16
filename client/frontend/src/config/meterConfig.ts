/**
 * Meter List Configuration
 * 
 * Defines columns, filters, bulk actions, and export configuration
 * for the MeterList component using the list framework.
 */

import React from 'react';
import type { Meter } from '../types/entities';
import type { ColumnDefinition } from '../types/ui';
import type { FilterDefinition, BulkActionConfig, ExportConfig } from '../types/list';
import { Permission } from '../types/auth';
import {
  createStatusColumn,
  createStandardStatusActions,
  createExportAction,
} from './listHelpers';

/**
 * Column definitions for meter list
 * Note: Connection test functionality is handled separately in the component
 */
export const meterColumns: ColumnDefinition<Meter>[] = [
  {
    key: 'location' as keyof Meter,
    label: 'Location',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => value || 'Not specified',
  },
  
  {
    key: 'ip' as keyof Meter,
    label: 'Address',
    sortable: true,
    render: (_, meter) => 
      React.createElement('div', { className: 'table-cell--two-line' },
        React.createElement('div', { className: 'table-cell__primary' },
          `${meter.ip || 'Unknown'} ${meter.serialNumber || ''}`
        )
      ),
  },
  
  // Connection column - will be customized in the component to add test button
  {
    key: 'configuration' as keyof Meter,
    label: 'Connection',
    sortable: false,
    responsive: 'hide-mobile',
    render: (value) => {
      const config = value as Meter['configuration'];
      return React.createElement('div', { className: 'table-cell--two-line' },
        React.createElement('div', { className: 'table-cell__primary' },
          `${config?.ipAddress || 'Not configured'}:${config?.port || 502}`
        ),
        config?.ipAddress && React.createElement('div', { className: 'table-cell__secondary' },
          `Slave ID: ${config?.slaveId || 1}`
        )
      );
    },
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
    meter.serialNumber || '',
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
