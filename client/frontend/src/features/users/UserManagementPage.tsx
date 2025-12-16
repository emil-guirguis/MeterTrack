import React from 'react';
import { EntityManagementPage, FormModal } from '@framework/components/modal';

import { UserList } from './UserList';
import { UserForm } from './UserForm';
import { useUsersEnhanced } from './usersStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { User } from '../../types/auth';

export const UserManagementPage: React.FC = () => (
  <EntityManagementPage<User, ReturnType<typeof useUsersEnhanced>>
    title="User Management"
    entityName="user"
    ListComponent={UserList}
    FormComponent={UserForm}
    useStore={useUsersEnhanced}
    LayoutComponent={AppLayoutWrapper}
    ModalComponent={FormModal}
  />
);
