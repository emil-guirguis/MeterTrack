/**
 * Location Configuration
 * 
 * Centralized configuration for Location entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * This configuration is shared between LocationForm and LocationList components.
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import { field } from '@framework/forms/utils/formSchema';
import { defineEntitySchema } from '@framework/forms/utils/entitySchema';
import type { Location } from '../../types/entities';
import {
  createTwoLineColumn,
  createStatusColumn,
  createStatusFilter,
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';

// ============================================================================
// UNIFIED SCHEMA DEFINITION
// ============================================================================

/**
 * Location entity schema - single source of truth for Location entity
 * Defines form fields, entity fields, and legacy field mappings
 */
export const locationSchema = defineEntitySchema({
  formFields: {
    name: field({ type: 'string', default: '', required: true, label: 'Location Name' }),
    type: field({ 
      type: 'string', 
      default: 'office', 
      required: true, 
      label: 'Location Type'
    }),
    status: field({ 
      type: 'string', 
      default: 'active', 
      required: true, 
      label: 'Status'
    }),
    // Address fields (nested object)
    'address.street': field({ type: 'string', default: '', required: true, label: 'Street Address' }),
    'address.city': field({ type: 'string', default: '', required: true, label: 'City' }),
    'address.state': field({ type: 'string', default: '', required: true, label: 'State' }),
    'address.zipCode': field({ type: 'string', default: '', required: true, label: 'ZIP Code' }),
    'address.country': field({ type: 'string', default: 'US', required: true, label: 'Country' }),
    // Contact info fields (nested object)
    'contactInfo.email': field({ type: 'email', default: '', required: true, label: 'Email' }),
    'contactInfo.phone': field({ type: 'phone', default: '', required: true, label: 'Phone' }),
    'contactInfo.website': field({ type: 'url', default: '', label: 'Website' }),
    'contactInfo.primaryContact': field({ type: 'string', default: '', label: 'Primary Contact' }),
    // Optional location details
    squareFootage: field({ type: 'number', default: undefined, label: 'Square Footage' }),
    yearBuilt: field({ type: 'number', default: undefined, label: 'Year Built' }),
    totalFloors: field({ type: 'number', default: undefined, label: 'Total Floors' }),
    totalUnits: field({ type: 'number', default: undefined, label: 'Total Units' }),
    description: field({ type: 'string', default: '', label: 'Description' }),
    notes: field({ type: 'string', default: '', label: 'Notes' }),
  },
  
  entityFields: {
    id: { type: 'string' as const, default: '', readOnly: true },
    meterCount: { type: 'number' as const, default: 0, readOnly: true },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedAt: { type: 'date' as const, default: new Date(), readOnly: true },
  },
  
  entityName: 'Location',
  description: 'Location entity for managing physical locations including offices, warehouses, and other facilities',
} as const);

/**
 * Location form schema - exported for backward compatibility
 * Used by LocationForm component
 */
export const locationFormSchema = locationSchema.form;

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for location list
 */
export const locationColumns: ColumnDefinition<Location>[] = [
  createTwoLineColumn<Location>(
    'name',
    'Location Name',
    'address',
    {
      sortable: true,
      secondaryRender: (location: Location) => 
        `${location.address.street}, ${location.address.city}, ${location.address.state}`,
    }
  ),
  
  {
    key: 'type' as keyof Location,
    label: 'Type',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => {
      const type = value as string;
      const getTypeVariant = (type: string) => {
        switch (type) {
          case 'office': return 'info';
          case 'warehouse': return 'warning';
          case 'retail': return 'success';
          case 'residential': return 'primary';
          case 'industrial': return 'secondary';
          default: return 'neutral';
        }
      };
      return React.createElement('span', 
        { className: `badge badge--${getTypeVariant(type)}` },
        type.charAt(0).toUpperCase() + type.slice(1)
      );
    },
  },
  
  createStatusColumn<Location>('status', 'Status', {
    labels: {
      active: 'Active',
      inactive: 'Inactive',
      maintenance: 'Maintenance',
    },
  }),
  
  {
    key: 'address' as keyof Location,
    label: 'Location',
    sortable: true,
    responsive: 'hide-mobile',
    render: (_, location) => 
      React.createElement('div', { className: 'location-list__location' },
        React.createElement('div', null, `${location.address.city}, ${location.address.state}`),
        React.createElement('div', { className: 'location-list__zip' }, location.address.zipCode)
      ),
  },
  
  {
    key: 'meterCount' as keyof Location,
    label: 'Meters',
    sortable: true,
    responsive: 'hide-tablet',
    render: (value) => {
      const count = value as number;
      return React.createElement('span', { className: 'location-list__count' },
        `${count} ${count === 1 ? 'meter' : 'meters'}`
      );
    },
  },
  
  {
    key: 'squareFootage' as keyof Location,
    label: 'Size',
    sortable: true,
    responsive: 'hide-mobile',
    render: (value) => value ? `${(value as number).toLocaleString()} sq ft` : 'N/A',
  },
];

/**
 * Filter definitions for location list
 */
export const locationFilters: FilterDefinition[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'Office', value: 'office' },
      { label: 'Warehouse', value: 'warehouse' },
      { label: 'Retail', value: 'retail' },
      { label: 'Residential', value: 'residential' },
      { label: 'Industrial', value: 'industrial' },
    ],
    placeholder: 'All Types',
  },
  
  createStatusFilter('status', {
    includeOther: true,
  }),
  
  {
    key: 'city',
    label: 'City',
    type: 'select',
    options: (items: Location[]) => {
      const cities = items
        .map(item => item.address.city)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      
      return cities.map(city => ({
        label: city,
        value: city,
      }));
    },
    placeholder: 'All Cities',
    storeKey: 'city',
  },
];

/**
 * Stats definitions for location list
 */
export const locationStats: StatDefinition<Location>[] = [
  {
    label: 'Active Locations',
    value: (items, store) => store?.activeLocations?.length ?? items.filter(l => l.status === 'active').length,
  },
  {
    label: 'Office Locations',
    value: (items, store) => store?.officeLocations?.length ?? items.filter(l => l.type === 'office').length,
  },
  {
    label: 'Warehouses',
    value: (items, store) => store?.warehouseLocations?.length ?? items.filter(l => l.type === 'warehouse').length,
  },
  {
    label: 'Total Sq Ft',
    value: (items, store) => {
      const total = store?.totalSquareFootage ?? items.reduce((sum, l) => sum + (l.squareFootage || 0), 0);
      return total.toLocaleString();
    },
  },
];

/**
 * Bulk action configurations for location list
 */
export function createLocationBulkActions(
  store: { bulkUpdateStatus: (ids: string[], status: string) => Promise<void> },
  exportFunction: (items: Location[]) => void
): BulkActionConfig<Location>[] {
  return [
    ...createStandardStatusActions<Location>(
      'location',
      'locations',
      store.bulkUpdateStatus,
      { 
        requirePermission: Permission.LOCATION_UPDATE,
        includeMaintenance: true,
      }
    ),
    createExportAction<Location>(exportFunction),
  ];
}

/**
 * Export configuration for location list
 */
export const locationExportConfig: ExportConfig<Location> = {
  filename: (date: string) => `locations_export_${date}.csv`,
  headers: [
    'Name',
    'Type',
    'Status',
    'Street',
    'City',
    'State',
    'Zip Code',
    'Square Footage',
    'Meter Count',
    'Year Built',
    'Created',
  ],
  mapRow: (location: Location) => [
    location.name,
    location.type,
    location.status,
    location.address.street,
    location.address.city,
    location.address.state,
    location.address.zipCode,
    location.squareFootage || 0,
    location.meterCount,
    location.yearBuilt || '',
    new Date(location.createdAt).toISOString(),
  ],
  includeInfo: 'Location export with full details including address, square footage, meter count, and metadata',
};
