import React from 'react';
import { EntityManagementPage } from '@framework/shared/components/EntityManagementPage';
import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { FormModal } from '@framework/shared/components/FormModal';
import { useUsersEnhanced } from './usersStore';
import AppLayout from '../../components/layout/AppLayout';
import type { User } from '../../types/auth';

export const UserManagementPage: React.FC = () => (
  <EntityManagementPage<User, ReturnType<typeof useUsersEnhanced>>
    title="User Management"
    entityName="user"
    ListComponent={UserList}
    FormComponent={UserForm}
    useStore={useUsersEnhanced}
    LayoutComponent={AppLayout}
    ModalComponent={FormModal}
  />
);
