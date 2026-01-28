/**
 * Meter Reading Configuration
 * 
 * Read-only configuration for MeterReading entity including:
 * - List columns, filters, stats
 * - Export configuration
 * 
 * Note: Meter readings are read-only (no form/create/edit functionality)
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, ExportConfig } from '@framework/components/list/types/list';
import {
  createDateColumn,
} from '../../config/listHelpers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * MeterReading TypeScript type
 */
export interface MeterReading {
  meter_reading_id: string;
  meter_id: number;
  tenant_id: number;
  created_at: string | Date;
  sync_status?: string | null;
  
  // Energy metrics
  active_energy?: number | null;
  active_energy_export?: number | null;
  apparent_energy?: number | null;
  apparent_energy_export?: number | null;
  reactive_energy?: number | null;
  reactive_energy_export?: number | null;
  
  // Power metrics
  power?: number | null;
  power_phase_a?: number | null;
  power_phase_b?: number | null;
  power_phase_c?: number | null;
  apparent_power?: number | null;
  reactive_power?: number | null;
  
  // Current metrics
  current?: number | null;
  current_line_a?: number | null;
  current_line_b?: number | null;
  current_line_c?: number | null;
  
  // Voltage metrics
  voltage_a_n?: number | null;
  voltage_b_n?: number | null;
  voltage_c_n?: number | null;
  voltage_p_n?: number | null;
  
  // Power factor metrics
  power_factor?: number | null;
  power_factor_phase_a?: number | null;
  power_factor_phase_b?: number | null;
  power_factor_phase_c?: number | null;
  
  // Other metrics
  frequency?: number | null;
  maximum_demand_real?: number | null;
  voltage_thd?: number | null;
  
  // Sync/system fields
  meter_element_id?: number | null;
  is_synchronized?: boolean | null;
  retry_count?: number | null;
  
  // Additional fields
  [key: string]: any;
}

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for meter reading list
 */
export const meterReadingColumns: ColumnDefinition<MeterReading>[] = [
  {
    key: 'created_at' as keyof MeterReading,
    label: 'Reading Time',
    sortable: true,
    render: (value) => {
      if (!value) return React.createElement('span', { className: 'text-muted' }, '—');
      const date = new Date(value);
      // Format as YYYY-MM-DD HH:MM:SS (military time)
      const formatted = date.toISOString().replace('T', ' ').substring(0, 19);
      return React.createElement('span', { className: 'font-mono text-sm' }, formatted);
    },
  },
  
  {
    key: 'active_energy' as keyof MeterReading,
    label: 'Active Energy (kWh)',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const energy = value as number | null;
      if (energy === null || energy === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, energy.toFixed(2));
    },
  },
  
  {
    key: 'power' as keyof MeterReading,
    label: 'Power (kW)',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const power = value as number | null;
      if (power === null || power === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, (power / 1000).toFixed(2));
    },
  },
  
  {
    key: 'voltage_p_n' as keyof MeterReading,
    label: 'Voltage (V)',
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const voltage = value as number | null;
      if (voltage === null || voltage === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, voltage.toFixed(1));
    },
  },
  
  {
    key: 'current' as keyof MeterReading,
    label: 'Current (A)',
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const current = value as number | null;
      if (current === null || current === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, current.toFixed(2));
    },
  },
];

/**
 * Filter definitions for meter reading list
 */
export const meterReadingFilters: FilterDefinition[] = [
  {
    key: 'meter_id',
    label: 'Meter ID',
    type: 'text',
    placeholder: 'Filter by meter ID',
  },
];

/**
 * Stats definitions for meter reading list
 */
export const meterReadingStats: StatDefinition<MeterReading>[] = [
  {
    label: 'Total Readings',
    value: (items) => Array.isArray(items) ? items.length : 0,
  },
  {
    label: 'Total Active Energy (kWh)',
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const total = items.reduce((sum, item) => sum + (item.active_energy || 0), 0);
      return total.toFixed(2);
    },
  },
  {
    label: 'Avg Power (kW)',
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const validItems = items.filter(item => item.power !== null && item.power !== undefined);
      if (validItems.length === 0) return '0.00';
      const avg = validItems.reduce((sum, item) => sum + ((item.power || 0) / 1000), 0) / validItems.length;
      return avg.toFixed(2);
    },
  },
  {
    label: 'Avg Power Factor',
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const validItems = items.filter(item => item.power_factor !== null && item.power_factor !== undefined);
      if (validItems.length === 0) return '0.00';
      const avg = validItems.reduce((sum, item) => sum + (item.power_factor || 0), 0) / validItems.length;
      return avg.toFixed(2);
    },
  },
];

/**
 * Export configuration for meter reading list
 */
export const meterReadingExportConfig: ExportConfig<MeterReading> = {
  filename: (date: string) => `meter_reading_export_${date}.csv`,
  headers: [
    'Meter ID',
    'Reading Time',
    'Active Energy (kWh)',
    'Power (kW)',
    'Voltage (V)',
    'Current (A)',
    'Power Factor',
    'Frequency (Hz)',
    'Sync Status',
  ],
  mapRow: (reading: MeterReading) => [
    reading.meter_id?.toString() || '',
    new Date(reading.created_at).toISOString().replace('T', ' ').substring(0, 19),
    reading.active_energy?.toString() || '',
    (reading.power ? reading.power / 1000 : 0).toFixed(2),
    reading.voltage_p_n?.toString() || '',
    reading.current?.toString() || '',
    reading.power_factor?.toString() || '',
    reading.frequency?.toString() || '',
    reading.sync_status || '',
  ],
  includeInfo: 'Meter reading export with energy, power, voltage, current, and power factor data',
};
