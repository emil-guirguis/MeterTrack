import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '../common/DataTable';
import { FormModal } from '../common/FormModal';
import { useUsersEnhanced } from '../../store/entities/usersStore';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import { UserRole, Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
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
  const { checkPermission } = useAuth();
  const users = useUsersEnhanced();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.USER_CREATE);
  const canUpdate = checkPermission(Permission.USER_UPDATE);
  const canDelete = checkPermission(Permission.USER_DELETE);

  // Load users on component mount
  useEffect(() => {
    users.fetchItems();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const filters: Record<string, any> = {};
    
    if (roleFilter) filters.role = roleFilter;
    if (statusFilter) filters.status = statusFilter;
    
    users.setFilters(filters);
    users.setSearch(searchQuery);
    users.fetchItems();
  }, [searchQuery, roleFilter, statusFilter]);

  // Define table columns
  const columns: ColumnDefinition<User>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value, user) => (
        <div className="user-list__name-cell">
          <div className="user-list__name">{value}</div>
          <div className="user-list__email">{user.email}</div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <span className={`user-list__role user-list__role--${value}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      ),
      responsive: 'hide-mobile',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`user-list__status user-list__status--${value}`}>
          {value === 'active' ? '✅ Active' : '❌ Inactive'}
        </span>
      ),
    },
    {
      key: 'lastLogin',
      label: 'Last Login',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never',
      responsive: 'hide-mobile',
    },
    {
      key: 'createdAt',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
      responsive: 'hide-tablet',
    },
  ], []);

  // Define bulk actions
  const bulkActions: BulkAction<User>[] = useMemo(() => {
    const actions: BulkAction<User>[] = [];

    if (canUpdate) {
      actions.push(
        {
          key: 'activate',
          label: 'Activate',
          icon: '✅',
          color: 'success',
          action: async (selectedUsers) => {
            const userIds = selectedUsers.map(u => u.id);
            await users.bulkUpdateStatus(userIds, 'active');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to activate the selected users?',
        },
        {
          key: 'deactivate',
          label: 'Deactivate',
          icon: '❌',
          color: 'warning',
          action: async (selectedUsers) => {
            const userIds = selectedUsers.map(u => u.id);
            await users.bulkUpdateStatus(userIds, 'inactive');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to deactivate the selected users?',
        }
      );
    }

    actions.push({
      key: 'export',
      label: 'Export CSV',
      icon: '📄',
      color: 'primary',
      action: async (selectedUsers) => {
        exportUsersToCSV(selectedUsers);
      },
    });

    return actions;
  }, [canUpdate, users]);

  // Handle user actions
  const handleUserView = useCallback((user: User) => {
    onUserSelect?.(user);
  }, [onUserSelect]);

  const handleUserEdit = useCallback((user: User) => {
    if (!canUpdate) return;
    onUserEdit?.(user);
  }, [canUpdate, onUserEdit]);

  const handleUserDelete = useCallback(async (user: User) => {
    if (!canDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete user "${user.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      await users.deleteUser(user.id);
    }
  }, [canDelete, users]);

  // Export functionality
  const exportUsersToCSV = useCallback((usersToExport: User[]) => {
    const headers = ['Name', 'Email', 'Role', 'Status', 'Last Login', 'Created'];
    const csvContent = [
      headers.join(','),
      ...usersToExport.map(user => [
        `"${user.name}"`,
        `"${user.email}"`,
        user.role,
        user.status,
        user.lastLogin ? new Date(user.lastLogin).toISOString() : '',
        new Date(user.createdAt).toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllUsers = useCallback(() => {
    exportUsersToCSV(users.items);
    setShowExportModal(false);
  }, [users.items, exportUsersToCSV]);

  return (
    <div className="user-list">
      {/* Header */}
      <div className="user-list__header">
        <div className="user-list__title-section">
          <h2 className="user-list__title">Users</h2>
          <p className="user-list__subtitle">
            Manage user accounts and permissions
          </p>
        </div>
        
        <div className="user-list__actions">
          <button
            type="button"
            className="user-list__btn user-list__btn--secondary"
            onClick={() => setShowExportModal(true)}
          >
            📄 Export CSV
          </button>
          
          {canCreate && (
            <button
              type="button"
              className="user-list__btn user-list__btn--primary"
              onClick={onUserCreate}
            >
              ➕ Add User
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="user-list__filters">
        <div className="user-list__search">
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="user-list__search-input"
          />
        </div>
        
        <div className="user-list__filter-group">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="user-list__filter-select"
            aria-label="Filter by role"
          >
            <option value="">All Roles</option>
            <option value={UserRole.ADMIN}>Admin</option>
            <option value={UserRole.MANAGER}>Manager</option>
            <option value={UserRole.TECHNICIAN}>Technician</option>
            <option value={UserRole.VIEWER}>Viewer</option>
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="user-list__filter-select"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          {(roleFilter || statusFilter || searchQuery) && (
            <button
              type="button"
              className="user-list__clear-filters"
              onClick={() => {
                setRoleFilter('');
                setStatusFilter('');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="user-list__stats">
        <div className="user-list__stat">
          <span className="user-list__stat-value">{users.activeUsers.length}</span>
          <span className="user-list__stat-label">Active Users</span>
        </div>
        <div className="user-list__stat">
          <span className="user-list__stat-value">{users.inactiveUsers.length}</span>
          <span className="user-list__stat-label">Inactive Users</span>
        </div>
        <div className="user-list__stat">
          <span className="user-list__stat-value">{users.adminUsers.length}</span>
          <span className="user-list__stat-label">Administrators</span>
        </div>
        <div className="user-list__stat">
          <span className="user-list__stat-value">{users.items.length}</span>
          <span className="user-list__stat-label">Total Users</span>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users.items}
        columns={columns}
        loading={users.list.loading}
        error={users.list.error || undefined}
        emptyMessage="No users found. Create your first user to get started."
        onView={handleUserView}
        onEdit={canUpdate ? handleUserEdit : undefined}
        onDelete={canDelete ? handleUserDelete : undefined}
        onSelect={bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={bulkActions}
        pagination={{
          currentPage: users.list.page,
          pageSize: users.list.pageSize,
          total: users.list.total,
          onPageChange: (page) => {
            users.setPage(page);
            users.fetchItems();
          },
          onPageSizeChange: (size) => {
            users.setPageSize(size);
            users.fetchItems();
          },
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />

      {/* Export Modal */}
      <FormModal
        isOpen={showExportModal}
        title="Export Users"
        onClose={() => setShowExportModal(false)}
        onSubmit={exportAllUsers}
      >
        <div className="user-list__export-content">
          <p>Export all users to CSV format?</p>
          <p className="user-list__export-info">
            This will include: Name, Email, Role, Status, Last Login, and Created Date
          </p>
          <p className="user-list__export-count">
            <strong>{users.items.length} users</strong> will be exported.
          </p>
        </div>
      </FormModal>
    </div>
  );
};