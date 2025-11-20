/**
 * User Configuration
 * 
 * Centralized configuration for User entity including:
 * - Form schema (field definitions, validation, API mapping)
 * - List columns, filters, stats
 * - Bulk actions and export configuration
 * 
 * This configuration is shared between UserForm and UserList components.
 */

import React from 'react';
import type { ColumnDefinition } from '../../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '@framework/lists/types/list';
import { Permission, UserRole as UserRoleEnum, type Permission as PermissionType } from '../../types/auth';
import { field } from '@framework/forms/utils/formSchema';
import { defineEntitySchema } from '@framework/forms/utils/entitySchema';
import {
  createTwoLineColumn,
  createStatusColumn,
  createDateColumn,
  createStatusFilter,
  createStandardStatusActions,
  createExportAction,
} from '../../config/listHelpers';

// ============================================================================
// UNIFIED SCHEMA DEFINITION
// ============================================================================

/**
 * User entity schema - single source of truth for User entity
 * Defines form fields, entity fields, and legacy field mappings
 */
export const userSchema = defineEntitySchema({
  formFields: {
    name: field({ type: 'string', default: '', required: true, label: 'Full Name' }),
    email: field({ type: 'email', default: '', required: true, label: 'Email Address' }),
  },
  
  entityFields: {
    id: { type: 'string' as const, default: '', readOnly: true },
    client: { type: 'string' as const, default: '' },
    role: { 
      type: 'string' as const,
      enumValues: ['admin', 'manager', 'technician', 'viewer'] as const,
      default: 'viewer' as const
    },
    status: { 
      type: 'string' as const,
      enumValues: ['active', 'inactive'] as const,
      default: 'active' as const
    },
    permissions: { type: 'string' as any, default: [] as string[] },
    lastLogin: { type: 'date' as const, default: undefined as any },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    updatedAt: { type: 'date' as const, default: new Date(), readOnly: true },
  },
  
  entityName: 'User',
  description: 'User entity for authentication and authorization',
} as const);

/**
 * User form schema - exported for backward compatibility
 * Used by UserForm component
 */
export const userFormSchema = userSchema.form;

/**
 * UserRole type - matches the enum values in the schema
 */
export type UserRole = 'admin' | 'manager' | 'technician' | 'viewer';

/**
 * User TypeScript type - inferred from schema with explicit entity fields
 */
export type User = typeof userSchema._entityType & {
  id: string;
  email: string;
  name: string;
  client: string;
  role: UserRole;
  permissions: PermissionType[];
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
};

// ============================================================================
// LIST CONFIGURATION
// ============================================================================

/**
 * Column definitions for user list
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
    responsive: 'hide-mobile',
    render: (value) => {
      const role = value as UserRole;
      const getRoleVariant = (role: string) => {
        switch (role) {
          case 'admin': return 'error';
          case 'manager': return 'warning';
          case 'technician': return 'info';
          case 'viewer': return 'success';
          default: return 'neutral';
        }
      };
      return React.createElement('span', 
        { className: `badge badge--${getRoleVariant(role)} badge--uppercase` },
        role.charAt(0).toUpperCase() + role.slice(1)
      );
    },
  },
  
  createStatusColumn<User>('status', 'Status', {
    labels: {
      active: 'Active',
      inactive: 'Inactive',
    },
  }),
  
  createDateColumn<User>('lastLogin', 'Last Login', {
    responsive: 'hide-mobile',
    fallback: 'Never',
  }),
  
  createDateColumn<User>('createdAt', 'Created', {
    responsive: 'hide-tablet',
  }),
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
      { label: 'Admin', value: UserRoleEnum.ADMIN },
      { label: 'Manager', value: UserRoleEnum.MANAGER },
      { label: 'Technician', value: UserRoleEnum.TECHNICIAN },
      { label: 'Viewer', value: UserRoleEnum.VIEWER },
    ],
    placeholder: 'All Roles',
  },
  
  createStatusFilter(),
];

/**
 * Stats definitions for user list
 */
export const userStats: StatDefinition<User>[] = [
  {
    label: 'Active Users',
    value: (items, store) => store?.activeUsers?.length ?? items.filter(u => u.status === 'active').length,
  },
  {
    label: 'Inactive Users',
    value: (items, store) => store?.inactiveUsers?.length ?? items.filter(u => u.status === 'inactive').length,
  },
  {
    label: 'Administrators',
    value: (items, store) => store?.adminUsers?.length ?? items.filter(u => u.role === 'admin').length,
  },
  {
    label: 'Total Users',
    value: (items) => items.length,
  },
];

/**
 * Bulk action configurations for user list
 */
export function createUserBulkActions(
  store: { bulkUpdateStatus: (ids: string[], status: string) => Promise<void> },
  exportFunction: (items: User[]) => void
): BulkActionConfig<User>[] {
  return [
    ...createStandardStatusActions<User>(
      'user',
      'users',
      store.bulkUpdateStatus,
      { requirePermission: Permission.USER_UPDATE }
    ),
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
    'Status',
    'Last Login',
    'Created',
  ],
  mapRow: (user: User) => [
    user.name,
    user.email,
    user.role,
    user.status,
    user.lastLogin ? new Date(user.lastLogin).toISOString() : '',
    new Date(user.createdAt).toISOString(),
  ],
  includeInfo: 'User export with name, email, role, status, and login information',
};
