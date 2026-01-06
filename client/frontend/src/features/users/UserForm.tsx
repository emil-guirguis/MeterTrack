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
import {
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Paper,
  Grid
} from '@mui/material';

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

  // Group permissions by module
  const groupPermissionsByModule = () => {
    const permissionsList = Object.values(Permission) as string[];
    const grouped: Record<string, string[]> = {};

    permissionsList.forEach((permission) => {
      const [module] = permission.split(':');
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(permission);
    });

    return grouped;
  };

  // Format module name for display
  const formatModuleName = (module: string): string => {
    const names: Record<string, string> = {
      user: 'User',
      location: 'Location',
      contact: 'Contact',
      meter: 'Meter',
      device: 'Device',
      settings: 'Settings',
      template: 'Email Templates'
    };
    return names[module] || module;
  };

  // Format action name for display
  const formatActionName = (action: string): string => {
    return action.charAt(0).toUpperCase() + action.slice(1);
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

    const groupedPermissions = groupPermissionsByModule();
    const selectedPermissions = Array.isArray(value) ? value : [];
    const moduleOrder = ['user', 'location', 'contact', 'meter', 'device', 'template', 'settings'];

    return (
      <Box key={fieldName} className="user-form__field">
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
          {fieldDef.label}
          {fieldDef.required && <span className="user-form__required">*</span>}
        </Typography>

        <Box className="user-form__permissions-container">
          {moduleOrder.map((module) => {
            const permissions = groupedPermissions[module];
            if (!permissions) return null;

            return (
              <Paper
                key={module}
                className="user-form__permission-group"
                elevation={0}
                sx={{
                  p: 2.5,
                  backgroundColor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    fontWeight: 600,
                    mb: 2,
                    pb: 1.5,
                    borderBottom: '2px solid',
                    borderColor: 'primary.main',
                    color: 'text.primary'
                  }}
                >
                  {formatModuleName(module)}
                </Typography>

                <Grid
                  container
                  spacing={2}
                  className="user-form__permission-group-items"
                >
                  {permissions.map((permission) => {
                    const [, action] = permission.split(':');
                    return (
                      <Grid item xs={12} sm={6} md={4} key={permission}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={selectedPermissions.includes(permission)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  onChange([...selectedPermissions, permission]);
                                } else {
                                  onChange(
                                    selectedPermissions.filter((p) => p !== permission)
                                  );
                                }
                              }}
                              disabled={isDisabled}
                              size="medium"
                              sx={{
                                '&.Mui-checked': {
                                  color: 'primary.main'
                                }
                              }}
                            />
                          }
                          label={
                            <Typography variant="body2" sx={{ ml: 0.5 }}>
                              {formatActionName(action)}
                            </Typography>
                          }
                          sx={{
                            m: 0,
                            width: '100%',
                            '&:hover': {
                              backgroundColor: 'action.hover',
                              borderRadius: 0.5
                            }
                          }}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            );
          })}
        </Box>

        {error && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'error.main',
              mt: 1
            }}
          >
            {error}
          </Typography>
        )}

        {fieldDef.description && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: 'text.secondary',
              mt: 1
            }}
          >
            {fieldDef.description}
          </Typography>
        )}
      </Box>
    );
  };

  return (
    <BaseForm
      schemaName="user"
      entity={user}
      store={users}
      onCancel={onCancel}
      onSubmit={onSubmit}
      className="user-form"
      loading={loading}
      excludeFields={user?.id ? ['passwordHash', 'lastLogin', 'password'] : ['passwordHash', 'lastLogin']}
      renderCustomField={renderCustomField}
      showTabs={true}
    />
  );
};

export default UserForm;
