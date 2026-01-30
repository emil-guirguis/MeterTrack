import React from 'react';
import type { EmailTemplate } from '../types/entities';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/components/list/types/list';
import type { ColumnDefinition } from '../types/ui';
import { renderTwoLineCell, renderStatusBadge, renderDateCell } from '../utils/renderHelpers';

// Email Template Column Definitions
export const emailTemplateColumns: ColumnDefinition<EmailTemplate>[] = [
  {
    key: 'name',
    label: 'Name',
    sortable: true,
    render: (value, template) => renderTwoLineCell(value as string, template.category),
  },
  {
    key: 'subject',
    label: 'Subject',
    sortable: true,
    render: (value) => React.createElement(
      'div',
      { className: 'table-cell--truncate table-cell--subject' },
      value
    ),
    responsive: 'hide-mobile',
  },
  {
    key: 'status',
    label: 'Status',
    sortable: true,
    render: (value) => renderStatusBadge(value as string),
  },
  {
    key: 'usageCount',
    label: 'Usage',
    sortable: true,
    render: (value) => React.createElement(
      'span',
      { className: 'table-cell--numeric' },
      value || 0
    ),
    responsive: 'hide-mobile',
  },
  {
    key: 'lastUsed',
    label: 'Last Used',
    sortable: true,
    render: (value) => value ? renderDateCell(value as Date) : 'Never',
    responsive: 'hide-tablet',
  },
  {
    key: 'updatedAt',
    label: 'Updated',
    sortable: true,
    render: (value) => renderDateCell(value as Date),
    responsive: 'hide-tablet',
  },
];

// Email Template Filter Definitions
export const emailTemplateFilters: FilterDefinition[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' },
      { value: 'draft', label: 'Draft' },
    ],
    placeholder: 'All Status',
  },
  {
    key: 'category',
    label: 'Category',
    type: 'select',
    options: [
      { value: 'meter_readings', label: 'Meter Readings' },
      { value: 'meter_errors', label: 'Meter Errors' },
      { value: 'maintenance', label: 'Maintenance' },
      { value: 'general', label: 'General' },
    ],
    placeholder: 'All Categories',
  },
];

// Email Template Stats Definitions
export const emailTemplateStats: StatDefinition<EmailTemplate>[] = [
  {
    label: 'Active Templates',
    value: (items: EmailTemplate[]) => Array.isArray(items) ? items.filter(t => t.status === 'active').length : 0,
  },
  {
    label: 'Inactive Templates',
    value: (items: EmailTemplate[]) => Array.isArray(items) ? items.filter(t => t.status === 'inactive').length : 0,
  },
  {
    label: 'Draft Templates',
    value: (items: EmailTemplate[]) => Array.isArray(items) ? items.filter(t => t.status === 'draft').length : 0,
  },
  {
    label: 'Total Templates',
    value: (items: EmailTemplate[]) => Array.isArray(items) ? items.length : 0,
  },
];

// Email Template Bulk Actions
export const emailTemplateBulkActions: BulkActionConfig<EmailTemplate>[] = [
  {
    id: 'activate',
    label: 'Activate',
    icon: '✅',
    color: 'success',
    confirm: true,
    confirmMessage: 'Are you sure you want to activate the selected templates?',
    action: async (items: EmailTemplate[], store: any) => {
      const templateIds = items.map((t: EmailTemplate) => t.id);
      await store.bulkUpdateStatus(templateIds, 'active');
    },
  },
  {
    id: 'deactivate',
    label: 'Deactivate',
    icon: '❌',
    color: 'warning',
    confirm: true,
    confirmMessage: 'Are you sure you want to deactivate the selected templates?',
    action: async (items: EmailTemplate[], store: any) => {
      const templateIds = items.map((t: EmailTemplate) => t.id);
      await store.bulkUpdateStatus(templateIds, 'inactive');
    },
  },
  {
    id: 'set-draft',
    label: 'Set as Draft',
    icon: '📝',
    color: 'secondary',
    confirm: true,
    confirmMessage: 'Are you sure you want to set the selected templates as draft?',
    action: async (items: EmailTemplate[], store: any) => {
      const templateIds = items.map((t: EmailTemplate) => t.id);
      await store.bulkUpdateStatus(templateIds, 'draft');
    },
  },
];

// Email Template Export Configuration
export const emailTemplateExportConfig: ExportConfig<EmailTemplate> = {
  filename: (date: string) => `email-templates-export-${date}.csv`,
  headers: ['Name', 'Subject', 'Category', 'Status', 'Usage Count', 'Last Used', 'Created', 'Updated'],
  mapRow: (template: EmailTemplate) => [
    template.name,
    template.subject,
    template.category,
    template.status,
    template.usageCount || 0,
    template.lastUsed ? new Date(template.lastUsed).toISOString() : '',
    new Date(template.createdAt).toISOString(),
    new Date(template.updatedAt).toISOString(),
  ],
  includeInfo: 'Email template data including name, subject, category, status, usage statistics, and timestamps',
};
