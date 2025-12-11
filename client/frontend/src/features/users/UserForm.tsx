/**
 * User Form
 * 
 * Uses the dynamic schema-based BaseForm to render the user form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the user schema.
 */

import React from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useUsersEnhanced } from './usersStore';
import type { User } from '../../types/auth';

interface UserFormProps {
  user?: User;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const users = useUsersEnhanced();

  const fieldSections: Record<string, string[]> = {
    'Basic Information': [
      'name',
      'email',
    ],
    'Role & Access': [
      'role',
      'status',
    ],
  };

  return (
    <BaseForm
      schemaName="user"
      entity={user}
      store={users}
      onCancel={onCancel}
      onLegacySubmit={onSubmit}
      className="user-form"
      fieldSections={fieldSections}
      loading={loading}
      fieldsToClean={['id', 'active', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags', 'tenant_id', 'passwordHash', 'lastLogin']}
      excludeFields={['passwordHash', 'lastLogin', 'permissions']}
    />
  );
};

export default UserForm;
