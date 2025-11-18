/**
 * Contact Configuration
 * 
 * Centralized configuration for Contact entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * This configuration is shared between ContactForm and ContactList components.
 */

import type { Contact } from '../../types/entities';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission } from '../../types/auth';
import { createFormSchema, field } from '@framework/forms/utils/formSchema';
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
// FORM CONFIGURATION
// ============================================================================

/**
 * Contact form schema - defines all fields, validation, and API mapping
 * Used by ContactForm component
 */
export const contactFormSchema = createFormSchema({
  name: field({ type: 'string', default: '', required: true, label: 'Name' }),
  company: field({ type: 'string', default: '', label: 'Company' }),
  role: field({ type: 'string', default: '', label: 'Role' }),
  email: field({ type: 'email', default: '', required: true, label: 'Email' }),
  phone: field({ type: 'phone', default: '', required: true, label: 'Phone' }),
  street: field({ type: 'string', default: '', label: 'Street Address' }),
  street2: field({ type: 'string', default: '', label: 'Street Address 2' }),
  city: field({ type: 'string', default: '', label: 'City' }),
  state: field({ type: 'string', default: '', label: 'State' }),
  zip: field({
    type: 'string',
    default: '',
    label: 'ZIP Code',
    apiField: 'zip'
  }),
  country: field({ type: 'string', default: 'US', label: 'Country' }),
  notes: field({ type: 'string', default: '', label: 'Notes' }),
});

/**
 * Country options for form dropdown
 */
export const countryOptions = [
  { value: 'US', label: 'United States' },
  { value: 'CA', label: 'Canada' },
  { value: 'GB', label: 'United Kingdom' },
  { value: 'AU', label: 'Australia' },
  { value: 'DE', label: 'Germany' },
  { value: 'FR', label: 'France' },
  { value: 'JP', label: 'Japan' },
];

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
