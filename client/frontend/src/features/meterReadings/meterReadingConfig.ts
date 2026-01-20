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
  tenantid: string;
  id: string;
  meterId: string;
  timestamp: string | Date;
  
  // Connection/device meta
  ip?: string | null;
  deviceIP?: string | null;
  port?: number | null;
  slaveId?: number | null;
  source?: string | null;
  
  // Shorthand UI metrics
  V?: number | null;
  A?: number | null;
  dPF?: number | null;
  kW?: number | null;
  kWh?: number | null;
  kVAh?: number | null;
  kVARh?: number | null;
  
  // Core metrics
  energy?: number | null;
  voltage?: number | null;
  current?: number | null;
  power?: number | null;
  frequency?: number | null;
  powerFactor?: number | null;
  
  // Quality
  quality?: 'good' | 'estimated' | 'questionable' | null;
  
  // Additional fields (phase data, etc.)
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
    key: 'meterId' as keyof MeterReading,
    label: 'Meter ID',
    sortable: true,
    render: (value) => {
      const meterId = String(value || 'N/A');
      return React.createElement('span', 
        { className: 'font-mono text-sm' },
        meterId
      );
    },
  },
  
  createDateColumn<MeterReading>('timestamp', 'Reading Time', {
    sortable: true,
    format: 'datetime',
  }),
  
  {
    key: 'kWh' as keyof MeterReading,
    label: 'Energy (kWh)',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const kwh = value as number | null;
      if (kwh === null || kwh === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, kwh.toFixed(2));
    },
  },
  
  {
    key: 'kW' as keyof MeterReading,
    label: 'Power (kW)',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const kw = value as number | null;
      if (kw === null || kw === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, kw.toFixed(2));
    },
  },
  
  {
    key: 'V' as keyof MeterReading,
    label: 'Voltage (V)',
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const v = value as number | null;
      if (v === null || v === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, v.toFixed(1));
    },
  },
  
  {
    key: 'A' as keyof MeterReading,
    label: 'Current (A)',
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const a = value as number | null;
      if (a === null || a === undefined) return React.createElement('span', { className: 'text-muted' }, '—');
      return React.createElement('span', { className: 'font-mono' }, a.toFixed(2));
    },
  },
  
  {
    key: 'quality' as keyof MeterReading,
    label: 'Quality',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const quality = value as string | null;
      const getQualityVariant = (q: string | null) => {
        switch (q) {
          case 'good': return 'success';
          case 'estimated': return 'warning';
          case 'questionable': return 'error';
          default: return 'neutral';
        }
      };
      const label = quality || 'unknown';
      return React.createElement('span', 
        { className: `badge badge--${getQualityVariant(quality)} badge--uppercase` },
        label
      );
    },
  },
];

/**
 * Filter definitions for meter reading list
 */
export const meterReadingFilters: FilterDefinition[] = [
  {
    key: 'meterId',
    label: 'Meter ID',
    type: 'text',
    placeholder: 'Filter by meter ID',
  },
  {
    key: 'quality',
    label: 'Quality',
    type: 'select',
    options: [
      { label: 'Good', value: 'good' },
      { label: 'Estimated', value: 'estimated' },
      { label: 'Questionable', value: 'questionable' },
    ],
    placeholder: 'All Qualities',
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
    label: 'Total Energy (kWh)',
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const total = items.reduce((sum, item) => sum + (item.kWh || 0), 0);
      return total.toFixed(2);
    },
  },
  {
    label: 'Avg Power (kW)',
    value: (items) => {
      if (!Array.isArray(items)) return '0.00';
      const validItems = items.filter(item => item.kW !== null && item.kW !== undefined);
      if (validItems.length === 0) return '0.00';
      const avg = validItems.reduce((sum, item) => sum + (item.kW || 0), 0) / validItems.length;
      return avg.toFixed(2);
    },
  },
  {
    label: 'Good Quality',
    value: (items) => Array.isArray(items) ? items.filter(item => item.quality === 'good').length : 0,
  },
];

/**
 * Export configuration for meter reading list
 */
export const meterReadingExportConfig: ExportConfig<MeterReading> = {
  filename: (date: string) => `meter_reading_export_${date}.csv`,
  headers: [
    'Tenant ID',
    'Meter ID',
    'Timestamp',
    'Energy (kWh)',
    'Power (kW)',
    'Voltage (V)',
    'Current (A)',
    'Power Factor',
    'Quality',
    'Source',
  ],
  mapRow: (reading: MeterReading) => [
    reading.tenantId,
    reading.meterId,
    new Date(reading.timestamp).toISOString(),
    reading.kWh?.toString() || '',
    reading.kW?.toString() || '',
    reading.V?.toString() || '',
    reading.A?.toString() || '',
    reading.dPF?.toString() || '',
    reading.quality || '',
    reading.source || '',
  ],
  includeInfo: 'Meter reading export with energy, power, voltage, current, and quality data',
};
