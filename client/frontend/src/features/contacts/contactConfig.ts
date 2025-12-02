/**
 * Contact Configuration
 * 
 * Centralized configuration for Contact entity including:
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * Schema is now loaded dynamically from the backend via useSchema('contact')
 * This configuration is shared between ContactForm and ContactList components.
 */

import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
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
} from '../../config/listHelpers';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Contact TypeScript type
 * Schema is loaded dynamically from backend, but we need the type for TypeScript
 */
export type Contact = {
  id: string;
  name: string;
  company?: string;
  role?: string;
  email: string;
  phone: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  notes?: string;
  category: 'customer' | 'vendor' | 'contractor' | 'technician' | 'client';
  status: 'active' | 'inactive';
  createdat: Date;
  updatedat: Date;
  tags?: string[];
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for contact list
 */
export const contactColumns: ColumnDefinition<Contact>[] = [
  createTwoLineColumn<Contact>(
    'name',
    'Contact',
    'company',
    {
      responsive: 'hide-mobile',
      fallback: 'N/A',
    }
  ),


  createPhoneColumn<Contact>('phone', 'Phone', {
    responsive: 'hide-mobile',
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

  createStatusColumn<Contact>('active', 'Status', {
    labels: {
      active: 'Active',
      inactive: 'Inactive',
    },
    indicatorLight: true,
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
    value: (items: Contact[]) => Array.isArray(items) ? items.filter((c: Contact) => c.category === 'customer').length : 0,
  },
  {
    label: 'Vendors',
    value: (items: Contact[]) => Array.isArray(items) ? items.filter((c: Contact) => c.category === 'vendor').length : 0,
  },
  {
    label: 'Active Contacts',
    value: (items: Contact[]) => Array.isArray(items) ? items.filter((c: Contact) => c.status === 'active').length : 0,
  },
  {
    label: 'Industries',
    value: (items: Contact[]) => {
      if (!Array.isArray(items)) return 0;
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
    contact.street || '',
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
