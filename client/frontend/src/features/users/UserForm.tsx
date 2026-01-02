/**
 * User Form
 * 
 * Uses the dynamic schema-based BaseForm to render the user form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the user schema.
 */

import React, { useCallback, useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { useFormTabs } from '@framework/components/form/hooks';
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

  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('user');

  // Initialize activeTab state - will be set to first tab once schema loads
  const [activeTab, setActiveTab] = useState<string>('');

  // Get all tabs from schema (using formTabs)
  const { tabs: allTabs, tabList } = useFormTabs(schema?.formTabs, activeTab || 'dummy');
  
  // Set activeTab to first tab from schema on first load
  React.useEffect(() => {
    if (!activeTab && tabList?.length > 0) {
      setActiveTab(tabList[0]);
    }
  }, [tabList, activeTab]);

  // Use the useFormTabs hook to organize fields into tabs and sections for the active tab
  const { fieldSections } = useFormTabs(schema?.formTabs, activeTab);

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
      excludeFields={['passwordHash', 'lastLogin']}
      renderCustomField={renderCustomField}
    />
  );
};

export default UserForm;
