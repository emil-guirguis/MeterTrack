/**
 * Contact Configuration
 * 
 * Centralized configuration for Contact entity including:
 * - Stats, bulk actions, and export configuration
 * 
 * Schema is loaded dynamically from the backend via useSchema('contact')
 * List columns and filters are auto-generated from the schema.
 */

import type { StatDefinition, BulkActionConfig, ExportConfig } from '@framework/components/list/types/list';
import { Permission } from '../../types/auth';
import {
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';
import type { Contact } from './types';

// ============================================================================
// STATS DEFINITIONS
// ============================================================================

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

// ============================================================================
// BULK ACTIONS
// ============================================================================

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

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

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
