/**
 * Meter Configuration
 * 
 * Centralized configuration for Meter entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * This configuration is shared between MeterForm and MeterList components.
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import { field } from '@framework/forms/utils/formSchema';
import { defineEntitySchema } from '@framework/forms/utils/entitySchema';
import {
  createStatusColumn,
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';

// ============================================================================
// UNIFIED SCHEMA DEFINITION
// ============================================================================

/**
 * Meter entity schema - single source of truth for Meter entity
 * Defines form fields, entity fields, and legacy field mappings
 */
export const meterSchema = defineEntitySchema({
  formFields: {
    meterId: field({ type: 'string', default: '', required: true, label: 'Meter ID' }),
    serialNumber: field({ type: 'string', default: '', required: true, label: 'Serial Number' }),
    device: field({ type: 'string', default: '', required: true, label: 'Device Manufacturer' }),
    model: field({ type: 'string', default: '', required: true, label: 'Model' }),
    device_id: field({ type: 'string', default: '', required: true, label: 'Device ID' }),
    ip: field({ type: 'string', default: '', required: true, label: 'IP Address' }),
    portNumber: field({ type: 'number', default: 502, required: true, label: 'Port Number' }),
    slaveId: field({ type: 'number', default: 1, label: 'Slave ID' }),
    type: field({ 
      type: 'string', 
      default: 'electric', 
      required: true, 
      label: 'Meter Type'
    }),
    location: field({ type: 'string', default: '', label: 'Location' }),
    description: field({ type: 'string', default: '', label: 'Description' }),
    register_map: field({ type: 'string' as any, default: null, label: 'Register Map' }),
  },
  
  entityFields: {
    id: { type: 'string' as const, default: '', readOnly: true },
    locationId: { type: 'string' as const, default: undefined },
    locationName: { type: 'string' as const, default: undefined },
    status: { 
      type: 'string' as const,
      enumValues: ['active', 'inactive', 'maintenance'] as const,
      default: 'active' as const
    },
    installDate: { type: 'date' as const, default: new Date() },
    configuration: { 
      type: 'string' as any, 
      default: {
        readingInterval: 15,
        units: 'kWh',
        multiplier: 1,
        registers: [],
        communicationProtocol: 'modbus',
        baudRate: 9600,
        slaveId: 1,
        ipAddress: '',
        port: 502,
      }
    },
    lastReading: { 
      type: 'string' as any, 
      default: undefined,
      readOnly: true
    },
    notes: { type: 'string' as const, default: '' },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedAt: { type: 'date' as const, default: new Date(), readOnly: true },
    createdBy: { type: 'string' as any, default: undefined, readOnly: true },
    updatedBy: { type: 'string' as any, default: undefined, readOnly: true },
  },
  
  entityName: 'Meter',
  description: 'Meter entity for managing electric, gas, water, and other utility meters',
} as const);

/**
 * Meter form schema - exported for backward compatibility
 * Used by MeterForm component
 */
export const meterFormSchema = meterSchema.form;

/**
 * MeterConfig type for configuration object
 */
export interface MeterConfig {
  readingInterval: number;
  units: string;
  multiplier: number;
  registers?: number[];
  communicationProtocol?: string;
  baudRate?: number;
  slaveId?: number;
  ipAddress?: string;
  port?: number;
}

/**
 * MeterReading type for last reading
 */
export interface MeterReading {
  value: number;
  timestamp: Date;
  unit: string;
  quality: 'good' | 'estimated' | 'questionable';
}

/**
 * RegisterMap types for meter configuration
 */
export interface RegisterMapField {
  name: string;
  register: number;
  absoluteAddress: number;
  description: string;
  units?: string;
  functionality?: string;
  dataType: 'uint16' | 'uint32' | 'int16' | 'int32' | 'float32' | 'string';
  readWrite: 'R' | 'W' | 'R/W';
  bacnetObject?: string;
  bacnetObjectType?: string;
  bacnetObjectName?: string;
  systemElement?: string;
  valueRange?: string;
  publicNotes?: string;
  models?: string;
}

export interface RegisterMap {
  description?: string;
  fields: RegisterMapField[];
}

/**
 * Meter TypeScript type - inferred from schema with explicit entity fields
 */
export type Meter = typeof meterSchema._entityType & {
  id: string;
  meterId: string;
  serialNumber: string;
  device: string;
  model: string;
  device_id: string;
  ip: string;
  portNumber: number;
  slaveId?: number;
  type: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  locationId?: string;
  locationName?: string;
  location?: string;
  configuration: MeterConfig;
  lastReading?: MeterReading;
  status: 'active' | 'inactive' | 'maintenance';
  installDate: Date;
  description?: string;
  notes?: string;
  register_map?: RegisterMap | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: {
    id: string;
    name: string;
    email: string;
  };
  updatedBy?: {
    id: string;
    name: string;
    email: string;
  };
};

/**
 * Create meter request type for form submission
 */
export interface CreateMeterRequest {
  meterId: string;
  device: string;
  model: string;
  device_id: string;
  ip: string;
  serialNumber: string;
  portNumber: number;
  slaveId?: number;
  location?: string;
  description?: string;
  type?: 'electric' | 'gas' | 'water' | 'steam' | 'other';
  register_map?: RegisterMap | null;
}

/**
 * Update meter request type
 */
export interface UpdateMeterRequest extends Partial<CreateMeterRequest> {
  status?: 'active' | 'inactive' | 'maintenance';
}

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

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
