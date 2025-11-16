/**
 * User List Configuration
 * 
 * Defines columns, filters, stats, bulk actions, and export configuration
 * for the UserList component using the list framework.
 */

import React from 'react';
import type { User, UserRole } from '../types/auth';
import type { ColumnDefinition } from '../types/ui';
import type { FilterDefinition, StatDefinition, BulkActionConfig, ExportConfig } from '../types/list';
import { Permission, UserRole as UserRoleEnum } from '../types/auth';
import {
  createTwoLineColumn,
  createStatusColumn,
  createDateColumn,
  createStatusFilter,
  createStandardStatusActions,
  createExportAction,
} from './listHelpers';

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
