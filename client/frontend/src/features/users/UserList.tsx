import React from 'react';
import { BaseList } from '@framework/components/list';
import { useUsersEnhanced } from './usersStore';
import { useBaseList } from '@framework/components/list/hooks';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import { Permission } from '../../types/auth';
import {
  userColumns,
  userFilters,
  userStats,
  createUserBulkActions,
  userExportConfig,
} from './userConfig';
import { showConfirmation } from '@framework/utils/confirmationHelper';
import './UserList.css';

interface UserListProps {
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserCreate?: () => void;
}

export const UserList: React.FC<UserListProps> = ({
  onUserSelect,
  onUserEdit,
  onUserCreate,
}) => {
  const users = useUsersEnhanced();
  const auth = useAuth();

  const handleUserDelete = (user: User) => {
    showConfirmation({
      type: 'warning',
      title: 'Inactivate User',
      message: `Inactivate user "${user.name}"?`,
      confirmText: 'Inactivate',
      onConfirm: async () => {
        //bawait users.updateItem(user.id, { active: 'inactive' });
        await users.fetchItems();
      }
    });
  };

  const baseList = useBaseList<User, any>({
    entityName: 'user',
    entityNamePlural: 'users',
    useStore: useUsersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.USER_CREATE,
      update: Permission.USER_UPDATE,
      delete: Permission.USER_DELETE,
    },
    columns: userColumns,
    filters: userFilters,
    stats: userStats,
    bulkActions: createUserBulkActions(
      { bulkUpdateStatus: async (ids: string[], status: string) => {
        await users.bulkUpdateStatus(ids, status as 'active' | 'inactive');
      }},
      (items) => baseList.handleExport(items)
    ),
    export: userExportConfig,
    onEdit: onUserEdit,
    onCreate: onUserCreate,
    authContext: auth,
  });

  return (
    <div className="user-list">
      <BaseList
        title="Users"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No users found. Create your first user to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleUserDelete}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};