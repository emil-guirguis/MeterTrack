/**
 * Meter Configuration
 * 
 * Centralized configuration for Meter entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * Generated from database schema
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
    name: field({ type: 'string', default: '', required: true, label: 'Name' }),
    type: field({ type: 'string', default: '', required: true, label: 'Type' }),
    serialNumber: field({ type: 'string', default: '', label: 'Serial Number' }),
    installationDate: field({ type: 'date', default: new Date(), label: 'Installation Date' }),
    deviceId: field({ type: 'number', default: 0, label: 'Device Id' }),
    locationId: field({ type: 'number', default: 0, label: 'Location Id' }),
    ip: field({ type: 'string', default: '', label: 'Ip' }),
    port: field({ type: 'number', default: 0, label: 'Port' }),
    protocol: field({ type: 'string', default: '', label: 'Protocol' }),
    status: field({ type: 'string', default: '', label: 'Status' }),
    nextMaintenance: field({ type: 'date', default: new Date(), label: 'Next Maintenance' }),
    lastMaintenance: field({ type: 'date', default: new Date(), label: 'Last Maintenance' }),
    maintenanceInterval: field({ type: 'string', default: '', label: 'Maintenance Interval' }),
    maintenanceNotes: field({ type: 'string', default: '', label: 'Maintenance Notes' }),
    registerMap: field({ type: 'object', default: '', label: 'Register Map' }),
    notes: field({ type: 'string', default: '', label: 'Notes' }),
    active: field({ type: 'boolean', default: false, label: 'Active' })
  },
  
  entityFields: {
    id: { type: 'number' as const, default: 0, readOnly: true },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedAt: { type: 'date' as const, default: new Date(), readOnly: true }
  },
  
  entityName: 'Meter',
  description: 'Meter entity for managing meter records',
} as const);

/**
 * Meter form schema - exported for backward compatibility
 * Used by MeterForm component
 */
export const meterFormSchema = meterSchema.form;

/**
 * Meter TypeScript type - inferred from schema
 */
export type Meter = typeof meterSchema._entityType & {
  id: number;
  name: string;
  type: string;
  serialNumber?: string;
  installationDate?: date;
  deviceId?: number;
  locationId?: number;
  ip?: string;
  port?: number;
  protocol?: string;
  status: string;
  nextMaintenance?: date;
  lastMaintenance?: date;
  maintenanceInterval?: string;
  maintenanceNotes?: string;
  registerMap?: object;
  notes?: string;
  active?: boolean;
  createdAt: date;
  updatedAt: date;
};

/**
 * Create meter request type for form submission
 */
export interface CreateMeterRequest {
  name: string;
  type: string;
  serialNumber?: string;
  installationDate?: date;
  deviceId?: number;
  locationId?: number;
  ip?: string;
  port?: number;
  protocol?: string;
  status?: string;
  nextMaintenance?: date;
  lastMaintenance?: date;
  maintenanceInterval?: string;
  maintenanceNotes?: string;
  registerMap?: object;
  notes?: string;
  active?: boolean;
}

/**
 * Update meter request type
 */
export interface UpdateMeterRequest extends Partial<CreateMeterRequest> {
  id?: string;
}

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for meter list
 */
export const meterColumns: ColumnDefinition<Meter>[] = [
  // TODO: Customize columns based on your needs
  {
    key: 'id' as keyof Meter,
    label: 'ID',
    sortable: true,
  },
  {
    key: 'name' as keyof Meter,
    label: 'Name',
    sortable: true,
  },
  {
    key: 'type' as keyof Meter,
    label: 'Type',
    sortable: true,
  },
  {
    key: 'serialNumber' as keyof Meter,
    label: 'Serial Number',
    sortable: true,
  },
];

/**
 * Filter definitions for meter list
 */
export const meterFilters: FilterDefinition[] = [
  // TODO: Add filters based on your needs
];

/**
 * Export configuration for meter list
 */
export const meterExportConfig: ExportConfig<Meter> = {
  filename: (date: string) => `meter_export_${date}.csv`,
  headers: [
    'Id',
    'Name',
    'Type',
    'Serial Number',
    'Installation Date',
    'Device Id',
    'Location Id',
    'Ip',
    'Port',
    'Protocol',
    'Status',
    'Next Maintenance',
    'Last Maintenance',
    'Maintenance Interval',
    'Maintenance Notes',
    'Register Map',
    'Notes',
    'Active',
    'Created At',
    'Updated At'
  ],
  mapRow: (meter: Meter) => [
    meter.id || '',
    meter.name || '',
    meter.type || '',
    meter.serialNumber || '',
    meter.installationDate ? new Date(meter.installationDate).toISOString() : '',
    meter.deviceId || '',
    meter.locationId || '',
    meter.ip || '',
    meter.port || '',
    meter.protocol || '',
    meter.status || '',
    meter.nextMaintenance ? new Date(meter.nextMaintenance).toISOString() : '',
    meter.lastMaintenance ? new Date(meter.lastMaintenance).toISOString() : '',
    meter.maintenanceInterval || '',
    meter.maintenanceNotes || '',
    meter.registerMap || '',
    meter.notes || '',
    meter.active || '',
    meter.createdAt ? new Date(meter.createdAt).toISOString() : '',
    meter.updatedAt ? new Date(meter.updatedAt).toISOString() : ''
  ],
  includeInfo: 'Meter export with full details',
};
