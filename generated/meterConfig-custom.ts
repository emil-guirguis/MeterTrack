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
    device: field({ type: 'string', default: '', required: true, label: 'Device Manufacturer' }), // Populated from device relationship
    model: field({ type: 'string', default: '', required: true, label: 'Model' }), // Populated from device relationship
    device_id: field({ type: 'string', default: '', required: true, label: 'Device ID' }),
    ip: field({ type: 'string', default: '', required: true, label: 'IP Address' }),
    portNumber: field({ type: 'number', default: 502, required: true, label: 'Port Number' }),
    slaveId: field({ type: 'number', default: 1, label: 'Slave ID' }), // Modbus slave ID, not in database
    type: field({ type: 'string', default: 'electric', required: true, label: 'Meter Type' }),
    location: field({ type: 'string', default: '', label: 'Location' }), // Computed from location relationship
    description: field({ type: 'string', default: '', label: 'Description' }),
    register_map: field({ type: 'string' as any, default: null, label: 'Register Map' })
  },
  
  entityFields: {
    id: { type: 'string' as const, default: undefined, readOnly: true },
    locationId: { type: 'string' as const, default: undefined },
    locationName: { type: 'string' as const, default: undefined }, // Computed from location relationship
    status: { 
      type: 'string' as const,
      enumValues: ['active', 'inactive', 'maintenance'] as const,
      default: 'active' as const
    },
    installDate: { type: 'date' as const, default: new Date() },
    configuration: { type: 'string' as any as const, default: undefined }, // Computed configuration object
    lastReading: { type: 'string' as any as const, default: undefined, readOnly: true }, // Computed from readings relationship
    notes: { type: 'string' as const, default: undefined },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedAt: { type: 'date' as const, default: new Date(), readOnly: true },
    createdBy: { type: 'string' as any as const, default: undefined, readOnly: true }, // User relationship
    updatedBy: { type: 'string' as any as const, default: undefined, readOnly: true } // User relationship
  },
  
  entityName: 'Meter',
  description: 'Meter entity for managing meter records',
} as const);

/**
 * Meter form schema - exported for backward compatibility
 * Used by MeterForm component
 */
export const meterFormSchema = meterSchema.form;

// Add your existing types, columns, filters, and export config here...
// (Keep the rest of your existing meterConfig.ts content)
