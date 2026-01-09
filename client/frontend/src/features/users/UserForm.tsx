/**
 * User Form
 * 
 * Uses the dynamic schema-based BaseForm to render the user form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the user schema.
 */

import React, { useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useUsersEnhanced } from './usersStore';
import type { User } from '../../types/auth';
import { Permission } from '../../types/auth';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import authService from '../../services/authService';
import {
  FormControlLabel,
  Checkbox,
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Alert,
  CircularProgress
} from '@mui/material';
import { Lock, VpnKey } from '@mui/icons-material';

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
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [resetPasswordLoading, setResetPasswordLoading] = useState(false);
  const [resetPasswordError, setResetPasswordError] = useState<string>('');
  const [resetPasswordSuccess, setResetPasswordSuccess] = useState<string>('');

  // Handle admin password reset
  const handleAdminResetPassword = async () => {
    if (!user?.users_id) return;

    setResetPasswordLoading(true);
    setResetPasswordError('');
    setResetPasswordSuccess('');

    try {
      await authService.adminResetPassword(parseInt(user.users_id, 10));
      setResetPasswordSuccess('Password reset link has been sent to the user');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setResetPasswordSuccess('');
      }, 3000);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      setResetPasswordError(errorMessage);
    } finally {
      setResetPasswordLoading(false);
    }
  };

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
    <Box>
      {/* Password Action Buttons - Only show when editing an existing user */}
      {user?.users_id && (
        <Box sx={{ mb: 3 }}>
          {/* Error Alert */}
          {resetPasswordError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {resetPasswordError}
            </Alert>
          )}

          {/* Success Alert */}
          {resetPasswordSuccess && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {resetPasswordSuccess}
            </Alert>
          )}

          {/* Password Action Buttons */}
          <Paper
            elevation={0}
            sx={{
              p: 2,
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
              Password Management
            </Typography>

            <Grid container spacing={2}>
              {/* Change Password Button */}
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Lock />}
                  onClick={() => setShowChangePasswordModal(true)}
                  disabled={loading}
                >
                  Change Password
                </Button>
              </Grid>

              {/* Reset Password Button (Admin Only) */}
              <Grid item xs={12} sm={6}>
                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<VpnKey />}
                  onClick={handleAdminResetPassword}
                  disabled={loading || resetPasswordLoading}
                >
                  {resetPasswordLoading ? (
                    <>
                      <CircularProgress size={20} sx={{ mr: 1 }} />
                      Sending...
                    </>
                  ) : (
                    'Reset Password'
                  )}
                </Button>
              </Grid>
            </Grid>

            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: 'text.secondary',
                mt: 2
              }}
            >
              • <strong>Change Password:</strong> Update your own password
              <br />
              • <strong>Reset Password:</strong> Send a password reset link to the user
            </Typography>
          </Paper>
        </Box>
      )}

      {/* Change Password Modal */}
      <ChangePasswordModal
        open={showChangePasswordModal}
        onClose={() => setShowChangePasswordModal(false)}
        onSuccess={() => {
          setShowChangePasswordModal(false);
        }}
      />

      {/* User Form */}
      <BaseForm
        schemaName="user"
        entity={user}
        store={users}
        onCancel={onCancel}
        onSubmit={onSubmit}
        className="user-form"
        loading={loading}
        excludeFields={user?.users_id ? ['passwordHash', 'lastLogin', 'password'] : ['passwordHash', 'lastLogin']}
        renderCustomField={renderCustomField}
        showTabs={true}
      />
    </Box>
  );
};

export default UserForm;
