import React from 'react';
import { EntityManagementPage } from '@framework/components/modal';

import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { useUsersEnhanced } from './usersStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { User } from '../../types/auth';

export const UserManagementPage: React.FC = () => (
  <EntityManagementPage<User & { id?: string | number }, ReturnType<typeof useUsersEnhanced>>
    title="User Management"
    entityName="user"
    ListComponent={UserList}
    FormComponent={UserForm}
    useStore={useUsersEnhanced}
    LayoutComponent={AppLayoutWrapper}
  />
);
