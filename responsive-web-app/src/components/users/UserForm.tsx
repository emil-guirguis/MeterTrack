import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { User } from '../../types/auth';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../../types/auth';
import './UserForm.css';

interface UserFormProps {
  user?: User | null;
  onSubmit: (userData: Partial<User>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

interface UserFormData {
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'inactive';
  password?: string;
  confirmPassword?: string;
  sendInvitation: boolean;
  customPermissions: Permission[];
}

interface ValidationErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  role?: string;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit,
  onCancel,
  loading = false,
  error,
}) => {
  const { user: currentUser, checkPermission } = useAuth();
  const isEditing = !!user;
  
  // Form state
  const [formData, setFormData] = useState<UserFormData>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || UserRole.VIEWER,
    status: user?.status || 'active',
    password: '',
    confirmPassword: '',
    sendInvitation: !isEditing,
    customPermissions: user?.permissions || [],
  });

  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');

  // Check permissions
  const canManageRoles = checkPermission(Permission.USER_UPDATE) && 
    (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.MANAGER);
  const canSetCustomPermissions = currentUser?.role === UserRole.ADMIN;

  // Update form when user prop changes
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        password: '',
        confirmPassword: '',
        sendInvitation: false,
        customPermissions: user.permissions,
      });
    }
  }, [user]);

  // Generate random password
  const generatePassword = useCallback(() => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    // Ensure at least one of each type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // Uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // Lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // Number
    password += '!@#$%^&*'[Math.floor(Math.random() * 8)]; // Special char
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    const shuffled = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setGeneratedPassword(shuffled);
    setFormData(prev => ({
      ...prev,
      password: shuffled,
      confirmPassword: shuffled,
    }));
  }, []);

  // Handle form field changes
  const handleFieldChange = useCallback((field: keyof UserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear validation error for this field
    if (validationErrors[field as keyof ValidationErrors]) {
      setValidationErrors(prev => ({ ...prev, [field]: undefined }));
    }
  }, [validationErrors]);

  // Handle role change - update permissions automatically
  const handleRoleChange = useCallback((role: UserRole) => {
    const rolePermissions = ROLE_PERMISSIONS[role] || [];
    setFormData(prev => ({
      ...prev,
      role,
      customPermissions: rolePermissions,
    }));
  }, []);

  // Handle permission toggle
  const handlePermissionToggle = useCallback((permission: Permission) => {
    setFormData(prev => ({
      ...prev,
      customPermissions: prev.customPermissions.includes(permission)
        ? prev.customPermissions.filter(p => p !== permission)
        : [...prev.customPermissions, permission],
    }));
  }, []);

  // Validate form
  const validateForm = useCallback((): boolean => {
    const errors: ValidationErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

    // Email validation
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Password validation (only for new users or when password is provided)
    if (!isEditing || formData.password) {
      if (!formData.password) {
        errors.password = 'Password is required';
      } else if (formData.password.length < 4) {
        errors.password = 'Password must be at least 4 characters';
      } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
        errors.password = 'Password must contain uppercase, lowercase, and number';
      }

      if (formData.password !== formData.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    // Role validation
    if (!formData.role) {
      errors.role = 'Role is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData, isEditing]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    const userData: Partial<User> = {
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      role: formData.role,
      status: formData.status,
      permissions: formData.customPermissions,
    };

    // Include password for new users or when password is changed
    if (!isEditing || formData.password) {
      (userData as any).password = formData.password;
      (userData as any).sendInvitation = formData.sendInvitation;
    }

    await onSubmit(userData);
  }, [formData, validateForm, onSubmit, isEditing]);



  // Get available permissions grouped by category
  const permissionGroups = {
    'User Management': [
      Permission.USER_CREATE,
      Permission.USER_READ,
      Permission.USER_UPDATE,
      Permission.USER_DELETE,
    ],
    'Location Management': [
      Permission.LOCATION_CREATE,
      Permission.LOCATION_READ,
      Permission.LOCATION_UPDATE,
      Permission.LOCATION_DELETE,
    ],
    'Equipment Management': [
      Permission.EQUIPMENT_CREATE,
      Permission.EQUIPMENT_READ,
      Permission.EQUIPMENT_UPDATE,
      Permission.EQUIPMENT_DELETE,
    ],
    'Contact Management': [
      Permission.CONTACT_CREATE,
      Permission.CONTACT_READ,
      Permission.CONTACT_UPDATE,
      Permission.CONTACT_DELETE,
    ],
    'Meter Management': [
      Permission.METER_CREATE,
      Permission.METER_READ,
      Permission.METER_UPDATE,
      Permission.METER_DELETE,
    ],
    'Settings & Templates': [
      Permission.SETTINGS_READ,
      Permission.SETTINGS_UPDATE,
      Permission.TEMPLATE_CREATE,
      Permission.TEMPLATE_READ,
      Permission.TEMPLATE_UPDATE,
      Permission.TEMPLATE_DELETE,
    ],
  };

  return (
    <div className="user-form">
      {error && (
        <div className="user-form__error">
          <span className="user-form__error-icon">⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Basic Information */}
      <div className="user-form__section">
        <h3 className="user-form__section-title">Basic Information</h3>
        
        <div className="user-form__row">
          <div className="user-form__field">
            <label htmlFor="name" className="user-form__label">
              Full Name <span className="user-form__required">*</span>
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleFieldChange('name', e.target.value)}
              placeholder="Enter full name"
              required
              disabled={loading}
              className={`user-form__input ${validationErrors.name ? 'user-form__input--error' : ''}`}
            />
            {validationErrors.name && (
              <span className="user-form__error">{validationErrors.name}</span>
            )}
          </div>

          <div className="user-form__field">
            <label htmlFor="email" className="user-form__label">
              Email Address <span className="user-form__required">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(e) => handleFieldChange('email', e.target.value)}
              placeholder="Enter email address"
              required
              disabled={loading}
              className={`user-form__input ${validationErrors.email ? 'user-form__input--error' : ''}`}
            />
            {validationErrors.email && (
              <span className="user-form__error">{validationErrors.email}</span>
            )}
          </div>
        </div>
      </div>

      {/* Role and Status */}
      <div className="user-form__section">
        <h3 className="user-form__section-title">Role & Access</h3>
        
        <div className="user-form__row">
          <div className="user-form__field">
            <label htmlFor="role" className="user-form__label">
              Role <span className="user-form__required">*</span>
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={(e) => handleRoleChange(e.target.value as UserRole)}
              required
              disabled={loading || !canManageRoles}
              className={`user-form__select ${validationErrors.role ? 'user-form__select--error' : ''}`}
            >
              <option value={UserRole.VIEWER}>Viewer - Read-only access</option>
              <option value={UserRole.TECHNICIAN}>Technician - Equipment & meter management</option>
              <option value={UserRole.MANAGER}>Manager - Full business operations</option>
              {currentUser?.role === UserRole.ADMIN && (
                <option value={UserRole.ADMIN}>Administrator - Full system access</option>
              )}
            </select>
            {validationErrors.role && (
              <span className="user-form__error">{validationErrors.role}</span>
            )}
          </div>

          <div className="user-form__field">
            <label htmlFor="status" className="user-form__label">Status</label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={(e) => handleFieldChange('status', e.target.value)}
              disabled={loading}
              className="user-form__select"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Password Section */}
      {(!isEditing || showAdvanced) && (
        <div className="user-form__section">
          <h3 className="user-form__section-title">
            {isEditing ? 'Change Password' : 'Password'}
          </h3>
          
          <div className="user-form__password-generator">
            <button
              type="button"
              onClick={generatePassword}
              className="user-form__generate-btn"
              disabled={loading}
            >
              🎲 Generate Secure Password
            </button>
            {generatedPassword && (
              <div className="user-form__generated-password">
                <span>Generated: </span>
                <code>{generatedPassword}</code>
              </div>
            )}
          </div>

          <div className="user-form__row">
            <div className="user-form__field">
              <label htmlFor="password" className="user-form__label">
                Password {!isEditing && <span className="user-form__required">*</span>}
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleFieldChange('password', e.target.value)}
                placeholder="Enter password"
                required={!isEditing}
                disabled={loading}
                className={`user-form__input ${validationErrors.password ? 'user-form__input--error' : ''}`}
              />
              {validationErrors.password && (
                <span className="user-form__error">{validationErrors.password}</span>
              )}
            </div>

            <div className="user-form__field">
              <label htmlFor="confirmPassword" className="user-form__label">
                Confirm Password {!isEditing && <span className="user-form__required">*</span>}
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleFieldChange('confirmPassword', e.target.value)}
                placeholder="Confirm password"
                required={!isEditing}
                disabled={loading}
                className={`user-form__input ${validationErrors.confirmPassword ? 'user-form__input--error' : ''}`}
              />
              {validationErrors.confirmPassword && (
                <span className="user-form__error">{validationErrors.confirmPassword}</span>
              )}
            </div>
          </div>

          {!isEditing && (
            <div className="user-form__field">
              <label className="user-form__checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.sendInvitation}
                  onChange={(e) => handleFieldChange('sendInvitation', e.target.checked)}
                  disabled={loading}
                />
                <span>Send email invitation with login credentials</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Advanced Options */}
      {isEditing && !showAdvanced && (
        <div className="user-form__section">
          <button
            type="button"
            onClick={() => setShowAdvanced(true)}
            className="user-form__advanced-toggle"
            disabled={loading}
          >
            ⚙️ Advanced Options
          </button>
        </div>
      )}

      {/* Custom Permissions */}
      {canSetCustomPermissions && (
        <div className="user-form__section">
          <h3 className="user-form__section-title">Custom Permissions</h3>
          <p className="user-form__section-description">
            Override default role permissions with custom access controls.
          </p>
          
          <div className="user-form__permissions">
            {Object.entries(permissionGroups).map(([groupName, permissions]) => (
              <div key={groupName} className="user-form__permission-group">
                <h4 className="user-form__permission-group-title">{groupName}</h4>
                <div className="user-form__permission-list">
                  {permissions.map(permission => (
                    <label key={permission} className="user-form__permission-item">
                      <input
                        type="checkbox"
                        checked={formData.customPermissions.includes(permission)}
                        onChange={() => handlePermissionToggle(permission)}
                        disabled={loading}
                      />
                      <span className="user-form__permission-label">
                        {permission.replace(':', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Actions */}
      <div className="user-form__actions">
        <button
          type="button"
          onClick={onCancel}
          className="user-form__btn user-form__btn--secondary"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="user-form__btn user-form__btn--primary"
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="user-form__spinner"></span>
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update User' : 'Create User'
          )}
        </button>
      </div>
    </div>
  );
};