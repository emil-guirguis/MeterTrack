/**
 * Dynamic User Form
 * 
 * This form loads its schema from the backend API instead of
 * having a hardcoded schema definition.
 * 
 * Benefits:
 * - No duplicate schema definitions
 * - Schema changes in backend automatically reflect in frontend
 * - Single source of truth
 */

import React, { useState } from 'react';
import { useSchema } from '@framework/forms/utils/schemaLoader';
import type { BackendFieldDefinition } from '@framework/forms/utils/schemaLoader';
import { createFormSchema } from '@framework/forms/utils/formSchema';
import { useEntityFormWithStore } from '@framework/forms/hooks/useEntityFormWithStore';
import { useUsersEnhanced } from './usersStore';
import type { User } from '../../types/auth';
import '@framework/forms/components/BaseForm.css';
import './UserForm.css';

interface UserFormProps {
  user?: User;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const UserForm: React.FC<UserFormProps> = ({
  user,
  onSubmit: legacyOnSubmit,
  onCancel,
  loading = false,
}) => {
  // Load schema from backend
  const { schema, loading: schemaLoading, error: schemaError } = useSchema('user');
  
  const users = useUsersEnhanced();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Use the framework hook for form management with optimistic updates
  const form = useEntityFormWithStore<User, any>({
    entity: user,
    store: users,
    entityToFormData: (userData) => {
      if (!schema) return {};
      const formSchema = createFormSchema(schema.formFields);
      return formSchema.fromApi(userData);
    },
    getDefaultFormData: () => {
      if (!schema) return {};
      const formSchema = createFormSchema(schema.formFields);
      return formSchema.getDefaults();
    },
    formDataToEntity: (formData) => {
      if (!schema) return {};
      const formSchema = createFormSchema(schema.formFields);
      const apiData = formSchema.toApi(formData);
      // Remove fields that shouldn't be sent to the API
      const { id, createdat, updatedat, createdAt, updatedAt, ...cleanData } = apiData;
      return cleanData;
    },
    updateStrategy: 'optimistic',
    onSuccess: async (savedEntity, mode) => {
      console.log(`[UserForm] ${mode} successful:`, savedEntity.id);
      // Call legacy onSubmit if provided for backward compatibility
      if (legacyOnSubmit) {
        await legacyOnSubmit(savedEntity);
      }
      onCancel(); // Close the form
    },
    onError: (error, mode) => {
      console.error(`[UserForm] ${mode} failed:`, error);
    },
  });

  const isFormDisabled = loading || form.isSubmitting;

  // Validation
  const validateForm = (): boolean => {
    if (!schema) return false;
    
    const newErrors: Record<string, string> = {};

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      // Skip password hash field - it's read-only
      if (fieldName === 'passwordHash') return;

      const value = form.formData[fieldName];
      const backendFieldDef = fieldDef as BackendFieldDefinition;

      // Required check
      if (backendFieldDef.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = `${backendFieldDef.label} is required`;
        return;
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        // String validation
        if (backendFieldDef.type === 'string' && typeof value === 'string') {
          if (backendFieldDef.minLength && value.length < backendFieldDef.minLength) {
            newErrors[fieldName] = `${backendFieldDef.label} must be at least ${backendFieldDef.minLength} characters`;
          }
          if (backendFieldDef.maxLength && value.length > backendFieldDef.maxLength) {
            newErrors[fieldName] = `${backendFieldDef.label} must be at most ${backendFieldDef.maxLength} characters`;
          }
          if (backendFieldDef.pattern && !new RegExp(backendFieldDef.pattern).test(value)) {
            newErrors[fieldName] = `${backendFieldDef.label} format is invalid`;
          }
        }

        // Email validation
        if (backendFieldDef.type === 'email' && typeof value === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors[fieldName] = 'Please enter a valid email address';
          }
        }

        // Enum validation
        if (backendFieldDef.enumValues && !backendFieldDef.enumValues.includes(value)) {
          newErrors[fieldName] = `${backendFieldDef.label} must be one of: ${backendFieldDef.enumValues.join(', ')}`;
        }
      }
    });

    // Password validation for new users
    if (!user) {
      if (!password) {
        newErrors.password = 'Password is required';
      } else if (password.length < 4) {
        newErrors.password = 'Password must be at least 4 characters';
      }

      if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || form.isSubmitting) {
      return;
    }

    try {
      await form.handleSubmit();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    form.setFormData((prev: any) => ({
      ...prev,
      [field]: value,
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Render field based on schema definition
  const renderField = (fieldName: string, fieldDef: any) => {
    // Skip password hash field - it's managed separately
    if (fieldName === 'passwordHash' || fieldName === 'lastLogin') return null;

    const value = form.formData[fieldName];
    const error = errors[fieldName];

    // Boolean field (checkbox)
    if (fieldDef.type === 'boolean') {
      return (
        <div key={fieldName} className="user-form__field">
          <label htmlFor={fieldName} className="user-form__label">
            <input
              type="checkbox"
              id={fieldName}
              checked={value || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              disabled={isFormDisabled}
              className="user-form__checkbox"
            />
            {fieldDef.label}
            {fieldDef.required && <span className="user-form__required">*</span>}
          </label>
          {error && <span className="user-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="user-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Select field for enums
    if (fieldDef.enumValues) {
      return (
        <div key={fieldName} className="user-form__field">
          <label htmlFor={fieldName} className="user-form__label">
            {fieldDef.label}
            {fieldDef.required && <span className="user-form__required">*</span>}
          </label>
          <select
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`user-form__select ${error ? 'user-form__input--error' : ''}`}
            disabled={isFormDisabled}
          >
            <option value="">Select {fieldDef.label}</option>
            {fieldDef.enumValues.map((enumValue: string) => (
              <option key={enumValue} value={enumValue}>
                {enumValue.charAt(0).toUpperCase() + enumValue.slice(1)}
              </option>
            ))}
          </select>
          {error && <span className="user-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="user-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Email field
    if (fieldDef.type === 'email') {
      return (
        <div key={fieldName} className="user-form__field">
          <label htmlFor={fieldName} className="user-form__label">
            {fieldDef.label}
            {fieldDef.required && <span className="user-form__required">*</span>}
          </label>
          <input
            type="email"
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`user-form__input ${error ? 'user-form__input--error' : ''}`}
            placeholder={fieldDef.placeholder}
            maxLength={fieldDef.maxLength}
            disabled={isFormDisabled}
          />
          {error && <span className="user-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="user-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Array field (permissions)
    if (fieldDef.type === 'array' && fieldName === 'permissions') {
      // For now, skip rendering permissions - can be enhanced later
      return null;
    }

    // Text field (default)
    return (
      <div key={fieldName} className="user-form__field">
        <label htmlFor={fieldName} className="user-form__label">
          {fieldDef.label}
          {fieldDef.required && <span className="user-form__required">*</span>}
        </label>
        <input
          type="text"
          id={fieldName}
          value={value || ''}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className={`user-form__input ${error ? 'user-form__input--error' : ''}`}
          placeholder={fieldDef.placeholder}
          maxLength={fieldDef.maxLength}
          disabled={isFormDisabled}
        />
        {error && <span className="user-form__error">{error}</span>}
        {fieldDef.description && (
          <div className="user-form__helper-text">{fieldDef.description}</div>
        )}
      </div>
    );
  };

  // Loading state
  if (schemaLoading) {
    return (
      <div className="user-form base-form">
        <div className="form-loading">Loading form schema...</div>
      </div>
    );
  }

  // Error state
  if (schemaError) {
    return (
      <div className="user-form base-form">
        <div className="form-error-banner">
          <span className="error-icon">⚠️</span>
          <span>Failed to load form schema: {schemaError.message}</span>
        </div>
      </div>
    );
  }

  if (!schema) {
    return null;
  }

  // Group fields by section for better organization
  const basicInfoFields = ['name', 'email'];
  const roleAccessFields = ['role', 'status'];

  return (
    <form onSubmit={handleSubmit} className="user-form base-form">
      <div className="user-form__section">
        <h3 className="user-form__section-title">Basic Information</h3>
        
        {basicInfoFields.map(fieldName => {
          const fieldDef = schema.formFields[fieldName];
          return fieldDef ? renderField(fieldName, fieldDef) : null;
        })}
      </div>

      <div className="user-form__section">
        <h3 className="user-form__section-title">Role & Access</h3>
        
        {roleAccessFields.map(fieldName => {
          const fieldDef = schema.formFields[fieldName];
          return fieldDef ? renderField(fieldName, fieldDef) : null;
        })}
      </div>

      {!user && (
        <div className="user-form__section">
          <h3 className="user-form__section-title">Password</h3>
          
          <div className="user-form__field">
            <label htmlFor="password" className="user-form__label">
              Password <span className="user-form__required">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) {
                  setErrors(prev => ({ ...prev, password: '' }));
                }
              }}
              className={`user-form__input ${errors.password ? 'user-form__input--error' : ''}`}
              placeholder="Enter password"
              disabled={isFormDisabled}
            />
            {errors.password && <span className="user-form__error">{errors.password}</span>}
          </div>

          <div className="user-form__field">
            <label htmlFor="confirmPassword" className="user-form__label">
              Confirm Password <span className="user-form__required">*</span>
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) {
                  setErrors(prev => ({ ...prev, confirmPassword: '' }));
                }
              }}
              className={`user-form__input ${errors.confirmPassword ? 'user-form__input--error' : ''}`}
              placeholder="Confirm password"
              disabled={isFormDisabled}
            />
            {errors.confirmPassword && <span className="user-form__error">{errors.confirmPassword}</span>}
          </div>
        </div>
      )}

      <div className="user-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={isFormDisabled}
          className="user-form__btn user-form__btn--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isFormDisabled}
          className="user-form__btn user-form__btn--primary"
        >
          {form.isSubmitting ? (
            <>
              <span className="user-form__spinner" />
              {user ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            user ? 'Update User' : 'Create User'
          )}
        </button>
      </div>
    </form>
  );
};

export default UserForm;

