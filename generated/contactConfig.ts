/**
 * Contact Configuration
 * 
 * Centralized configuration for Contact entity including:
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
 * Contact entity schema - single source of truth for Contact entity
 * Defines form fields, entity fields, and legacy field mappings
 */
export const contactSchema = defineEntitySchema({
  formFields: {
    name: field({ type: 'string', default: '', required: true, label: 'Name' }),
    company: field({ type: 'string', default: '', label: 'Company' }),
    role: field({ type: 'string', default: '', label: 'Role' }),
    email: field({ type: 'string', default: '', required: true, label: 'Email' }),
    phone: field({ type: 'string', default: '', label: 'Phone' }),
    street: field({ type: 'string', default: '', label: 'Street' }),
    street2: field({ type: 'string', default: '', label: 'Street2' }),
    city: field({ type: 'string', default: '', label: 'City' }),
    state: field({ type: 'string', default: '', label: 'State' }),
    zip: field({ type: 'string', default: '', label: 'Zip' }),
    country: field({ type: 'string', default: '', label: 'Country' }),
    active: field({ type: 'boolean', default: false, label: 'Active' }),
    notes: field({ type: 'string', default: '', label: 'Notes' }),
    tenantId: field({ type: 'number', default: 0, label: 'Tenant Id' })
  },
  
  entityFields: {
    id: { type: 'number' as const, default: 0, readOnly: true },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedAt: { type: 'date' as const, default: new Date(), readOnly: true }
  },
  
  entityName: 'Contact',
  description: 'Contact entity for managing contact records',
} as const);

/**
 * Contact form schema - exported for backward compatibility
 * Used by ContactForm component
 */
export const contactFormSchema = contactSchema.form;

/**
 * Contact TypeScript type - inferred from schema
 */
export type Contact = typeof contactSchema._entityType & {
  id: number;
  name: string;
  company?: string;
  role?: string;
  email: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  active?: boolean;
  notes?: string;
  createdAt: date;
  updatedAt: date;
  tenantId: number;
};

/**
 * Create contact request type for form submission
 */
export interface CreateContactRequest {
  name: string;
  company?: string;
  role?: string;
  email: string;
  phone?: string;
  street?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  active?: boolean;
  notes?: string;
  tenantId?: number;
}

/**
 * Update contact request type
 */
export interface UpdateContactRequest extends Partial<CreateContactRequest> {
  id?: string;
}

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for contact list
 */
export const contactColumns: ColumnDefinition<Contact>[] = [
  // TODO: Customize columns based on your needs
  {
    key: 'id' as keyof Contact,
    label: 'ID',
    sortable: true,
  },
  {
    key: 'name' as keyof Contact,
    label: 'Name',
    sortable: true,
  },
  {
    key: 'company' as keyof Contact,
    label: 'Company',
    sortable: true,
  },
  {
    key: 'role' as keyof Contact,
    label: 'Role',
    sortable: true,
  },
];

/**
 * Filter definitions for contact list
 */
export const contactFilters: FilterDefinition[] = [
  // TODO: Add filters based on your needs
];

/**
 * Export configuration for contact list
 */
export const contactExportConfig: ExportConfig<Contact> = {
  filename: (date: string) => `contact_export_${date}.csv`,
  headers: [
    'Id',
    'Name',
    'Company',
    'Role',
    'Email',
    'Phone',
    'Street',
    'Street2',
    'City',
    'State',
    'Zip',
    'Country',
    'Active',
    'Notes',
    'Created At',
    'Updated At',
    'Tenant Id'
  ],
  mapRow: (contact: Contact) => [
    contact.id || '',
    contact.name || '',
    contact.company || '',
    contact.role || '',
    contact.email || '',
    contact.phone || '',
    contact.street || '',
    contact.street2 || '',
    contact.city || '',
    contact.state || '',
    contact.zip || '',
    contact.country || '',
    contact.active || '',
    contact.notes || '',
    contact.createdAt ? new Date(contact.createdAt).toISOString() : '',
    contact.updatedAt ? new Date(contact.updatedAt).toISOString() : '',
    contact.tenantId || ''
  ],
  includeInfo: 'Contact export with full details',
};
