/**
 * User Configuration
 * 
 * Centralized configuration for User entity including:
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * Schema is loaded dynamically from the backend via useSchema('user')
 * List columns and filters are auto-generated from the schema.
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/components/list/types/list';
import {
  createTwoLineColumn,
  createExportAction,
} from '../../config/listHelpers';

// ============================================================================
// TYPE DEFINITION
// ============================================================================

/**
 * User TypeScript type - matches UserWithSchema
 */
export type User = {
  id: number;
  email: string;
  name: string;
  role: 'Admin' | 'Manager' | 'Technician' | 'Viewer';
  active: boolean;
};

export type UserRole = 'Admin' | 'Manager' | 'Technician' | 'Viewer';

// ============================================================================
// LIST CONFIGURATION - AUTO-GENERATED FROM SCHEMA
// ============================================================================

/**
 * Column definitions for user list - auto-generated from schema
 * Only includes fields marked with showOn: ['list'] in UserWithSchema
 */
export const userColumns: ColumnDefinition<User>[] = [
  createTwoLineColumn<User>(
    'name',
    'Name',
    'email',
    {
      sortable: true,
    }
  ),
  
  {
    key: 'role' as keyof User,
    label: 'Role',
    sortable: true,
    render: (value) => {
      const role = value as UserRole;
      const getRoleVariant = (role: string) => {
        switch (role) {
          case 'Admin': return 'error';
          case 'Manager': return 'warning';
          case 'Technician': return 'info';
          case 'Viewer': return 'success';
          default: return 'neutral';
        }
      };
      return React.createElement('span', 
        { className: `badge badge--${getRoleVariant(role)} badge--uppercase` },
        role
      );
    },
  },
  
  {
    key: 'active' as keyof User,
    label: 'Active',
    sortable: true,
    render: (value) => {
      const isActive = value as boolean;
      return React.createElement('span', 
        { 
          className: `status-indicator status-indicator--${isActive ? 'active' : 'inactive'}`,
          title: isActive ? 'Active' : 'Inactive'
        },
        React.createElement('span', { className: 'status-indicator__circle' })
      );
    },
  },
];

/**
 * Filter definitions for user list
 */
export const userFilters: FilterDefinition[] = [
  {
    key: 'role',
    label: 'Role',
    type: 'select',
    options: [
      { label: 'Admin', value: 'Admin' },
      { label: 'Manager', value: 'Manager' },
      { label: 'Technician', value: 'Technician' },
      { label: 'Viewer', value: 'Viewer' },
    ],
    placeholder: 'All Roles',
  },
  {
    key: 'active',
    label: 'Status',
    type: 'select',
    options: [
      { label: 'Active', value: 'true' },
      { label: 'Inactive', value: 'false' },
    ],
    placeholder: 'All Statuses',
  },
];

/**
 * Stats definitions for user list
 */
export const userStats: StatDefinition<User>[] = [
  {
    label: 'Total Users',
    value: (items) => Array.isArray(items) ? items.length : 0,
  },
  {
    label: 'Active Users',
    value: (items) => Array.isArray(items) ? items.filter(u => u.active).length : 0,
  },
  {
    label: 'Administrators',
    value: (items) => Array.isArray(items) ? items.filter(u => u.role === 'Admin').length : 0,
  },
];

/**
 * Bulk action configurations for user list
 */
export function createUserBulkActions(
  _store: any,
  exportFunction: (items: User[]) => void
): BulkActionConfig<User>[] {
  return [
    createExportAction<User>(exportFunction),
  ];
}

/**
 * Export configuration for user list
 */
export const userExportConfig: ExportConfig<User> = {
  filename: (date: string) => `users_export_${date}.csv`,
  headers: [
    'Name',
    'Email',
    'Role',
    'Active',
  ],
  mapRow: (user: User) => [
    user.name,
    user.email,
    user.role,
    user.active ? 'Yes' : 'No',
  ],
  includeInfo: 'User export with name, email, role, and status information',
};
