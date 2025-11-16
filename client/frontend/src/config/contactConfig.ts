/**
 * Contact List Configuration
 * 
 * Defines columns, filters, stats, bulk actions, and export configuration
 * for the ContactList component using the list framework.
 */

import React from 'react';
import type { Contact } from '../types/entities';
import type { ColumnDefinition } from '../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '../types/list';
import { Permission } from '../types/auth';
import {
  createTwoLineColumn,
  createPhoneColumn,
  createStatusColumn,
  createLocationColumn,
  createBadgeListColumn,
  createRoleFilter,
  createStatusFilter,
  createStandardStatusActions,
  createExportAction,
} from './listHelpers';

/**
 * Column definitions for contact list
 */
export const contactColumns: ColumnDefinition<Contact>[] = [
  createTwoLineColumn<Contact>(
    'name',
    'Contact Name',
    'category',
    {
      sortable: true,
      secondaryRender: (contact) => {
        const category = contact.category || 'unknown';
        const badgeClass = category === 'customer' ? 'badge--primary' : 'badge--secondary';
        return React.createElement('span', { className: `badge ${badgeClass}` }, 
          category.charAt(0).toUpperCase() + category.slice(1)
        );
      },
    }
  ),
  
  createTwoLineColumn<Contact>(
    'contactPerson',
    'Contact Person',
    'email',
    {
      sortable: true,
      secondaryRender: (contact) => contact.company || contact.role || contact.email || '',
    }
  ),
  
  createPhoneColumn<Contact>('phone', 'Phone', {
    responsive: 'hide-mobile',
  }),
  
  createStatusColumn<Contact>('status', 'Status', {
    labels: {
      active: 'Active',
      inactive: 'Inactive',
    },
  }),
  
  createLocationColumn<Contact>(
    'city',
    'state',
    'Location',
    {
      zipKey: 'zip',
      responsive: 'hide-mobile',
      fallback: 'N/A',
    }
  ),
  
  {
    key: 'notes' as keyof Contact,
    label: 'Industry',
    sortable: true,
    responsive: 'hide-tablet',
    render: (_, contact) => (contact as any).industry || 'N/A',
  },
  
  {
    key: 'notes' as keyof Contact,
    label: 'Business Type',
    sortable: true,
    responsive: 'hide-tablet',
    render: (_, contact) => (contact as any).businessType || 'N/A',
  },
  
  createBadgeListColumn<Contact>('tags', 'Tags', {
    sortable: false,
    responsive: 'hide-mobile',
    maxVisible: 2,
    variant: 'neutral',
    emptyText: 'No tags',
  }),
];

/**
 * Filter definitions for contact list
 */
export const contactFilters: FilterDefinition[] = [
  createRoleFilter('category', [
    { label: 'Customer', value: 'customer' },
    { label: 'Vendor', value: 'vendor' },
  ]),
  
  createStatusFilter(),
  
  {
    key: 'industry',
    label: 'Industry',
    type: 'select',
    options: (items: Contact[]) => {
      const uniqueValues = items
        .map(item => (item as any).industry)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      
      return uniqueValues.map(value => ({
        label: String(value),
        value: String(value),
      }));
    },
    placeholder: 'All Industries',
  },
  
  {
    key: 'businessType',
    label: 'Business Type',
    type: 'select',
    options: (items: Contact[]) => {
      const uniqueValues = items
        .map(item => (item as any).businessType)
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index)
        .sort();
      
      return uniqueValues.map(value => ({
        label: String(value),
        value: String(value),
      }));
    },
    placeholder: 'All Business Types',
  },
];

/**
 * Stats definitions for contact list
 */
export const contactStats: StatDefinition<Contact>[] = [
  {
    label: 'Customers',
    value: (items) => items.filter(c => c.category === 'customer').length,
  },
  {
    label: 'Vendors',
    value: (items) => items.filter(c => c.category === 'vendor').length,
  },
  {
    label: 'Active Contacts',
    value: (items) => items.filter(c => c.status === 'active').length,
  },
  {
    label: 'Industries',
    value: (items) => {
      const industries = new Set(items.map(c => (c as any).industry).filter(Boolean));
      return industries.size;
    },
  },
];

/**
 * Bulk action configurations for contact list
 */
export function createContactBulkActions(
  store: { bulkUpdateStatus: (ids: string[], status: string) => Promise<void> },
  exportFunction: (items: Contact[]) => void
): BulkActionConfig<Contact>[] {
  return [
    ...createStandardStatusActions<Contact>(
      'contact',
      'contacts',
      store.bulkUpdateStatus,
      { requirePermission: Permission.CONTACT_UPDATE }
    ),
    createExportAction<Contact>(exportFunction),
  ];
}

/**
 * Export configuration for contact list
 */
export const contactExportConfig: ExportConfig<Contact> = {
  filename: (date: string) => `contacts_export_${date}.csv`,
  headers: [
    'Name',
    'Type',
    'Contact Person',
    'Email',
    'Phone',
    'Status',
    'Street',
    'City',
    'State',
    'Zip Code',
    'Country',
    'Business Type',
    'Industry',
    'Website',
    'Tags',
    'Notes',
    'Created',
  ],
  mapRow: (contact: Contact) => [
    contact.name,
    contact.category,
    contact.company || contact.role || '',
    contact.email,
    contact.phone,
    contact.status,
    contact.address || '',
    contact.city || '',
    contact.state || '',
    contact.zip || '',
    contact.country || '',
    (contact as any).businessType || '',
    (contact as any).industry || '',
    (contact as any).website || '',
    contact.tags ? contact.tags.join(';') : '',
    contact.notes || '',
    new Date(contact.createdat).toISOString(),
  ],
  includeInfo: 'Contact export with full details including address, business info, and metadata',
};
