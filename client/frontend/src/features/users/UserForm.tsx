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
import { Permission } from '../../types/auth';

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
      'active',
      'permissions',
    ],
  };

  // Custom field renderer for permissions
  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => {
    if (fieldName !== 'permissions') {
      return null;
    }

    const permissionsList = Object.values(Permission) as string[];
    const selectedPermissions = Array.isArray(value) ? value : [];

    return (
      <div key={fieldName} className="user-form__field">
        <label className="user-form__label">
          {fieldDef.label}
          {fieldDef.required && <span className="user-form__required">*</span>}
        </label>
        <div className="user-form__permissions-grid">
          {permissionsList.map((permission) => (
            <label key={permission} className="user-form__permission-checkbox">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(permission)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onChange([...selectedPermissions, permission]);
                  } else {
                    onChange(selectedPermissions.filter((p) => p !== permission));
                  }
                }}
                disabled={isDisabled}
              />
              <span>{permission}</span>
            </label>
          ))}
        </div>
        {error && <span className="user-form__error">{error}</span>}
        {fieldDef.description && <div className="user-form__helper-text">{fieldDef.description}</div>}
      </div>
    );
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
      fieldsToClean={['id', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags', 'tenant_id', 'passwordHash', 'lastLogin']}
      excludeFields={['passwordHash', 'lastLogin']}
      renderCustomField={renderCustomField}
    />
  );
};

export default UserForm;
