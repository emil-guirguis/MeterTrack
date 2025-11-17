/**
 * Contact List Configuration
 * 
 * Defines columns, filters, stats, bulk actions, and export configuration
 * for the ContactList component using the list framework.
 */

import React from 'react';
import type { Contact } from '../types/entities';
import type { ColumnDefinition } from '../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
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
      secondaryRender: (contact: Contact) => {
        const category = contact.category || 'unknown';
        const badgeClass = category === 'customer' ? 'badge--primary' : 'badge--secondary';
        return React.createElement('span', { className: `badge ${badgeClass}` }, 
          category.charAt(0).toUpperCase() + category.slice(1)
        );
      },
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
        .map((item: Contact) => (item as any).industry)
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
  
];

/**
 * Stats definitions for contact list
 */
export const contactStats: StatDefinition<Contact>[] = [
  {
    label: 'Customers',
    value: (items: Contact[]) => items.filter((c: Contact) => c.category === 'customer').length,
  },
  {
    label: 'Vendors',
    value: (items: Contact[]) => items.filter((c: Contact) => c.category === 'vendor').length,
  },
  {
    label: 'Active Contacts',
    value: (items: Contact[]) => items.filter((c: Contact) => c.status === 'active').length,
  },
  {
    label: 'Industries',
    value: (items: Contact[]) => {
      const industries = new Set(items.map((c: Contact) => (c as any).industry).filter(Boolean));
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
    'Email',
    'Phone',
    'Status',
    'Street',
    'City',
    'State',
    'Zip Code',
    'Country',
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
