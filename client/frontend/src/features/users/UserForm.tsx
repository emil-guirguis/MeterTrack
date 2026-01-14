/**
 * User Form
 * 
 * Uses the dynamic schema-based BaseForm to render the user form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the user schema.
 */

import React, { useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { JSONBPermissionsRenderer } from '@framework/components/jsonbfield';
import { useUsersEnhanced } from './usersStore';
import type { User } from '../../types/auth';
import { Permission } from '../../types/auth';
import { ChangePasswordModal } from '../../components/auth/ChangePasswordModal';
import authService from '../../services/authService';
import {
  Box,
  Typography,
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

  // Custom field renderer for permissions and password reset actions
  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => {
    // Render permissions field
    if (fieldName === 'permissions') {
      return (
        <JSONBPermissionsRenderer
          name={fieldName}
          label={fieldDef.label}
          value={value}
          error={error}
          disabled={isDisabled}
          required={fieldDef.required}
          description={fieldDef.description}
          onChange={onChange}
        />
      );
    }

    // Render password reset action buttons
    if (fieldName === 'password_reset_actions' && user?.users_id) {
      return (
        <Box>
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

          {/* Password Action Buttons - Vertical Layout */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {/* Change Password Button */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Lock />}
              onClick={() => setShowChangePasswordModal(true)}
              disabled={loading}
              sx={{ justifyContent: 'flex-start' }}
            >
              Change Password
            </Button>

            {/* Reset Password Button (Admin Only) */}
            <Button
              fullWidth
              variant="outlined"
              startIcon={<VpnKey />}
              onClick={handleAdminResetPassword}
              disabled={loading || resetPasswordLoading}
              sx={{ justifyContent: 'flex-start' }}
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
          </Box>

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
        </Box>
      );
    }

    return null;
  };

  return (
    <Box>
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
