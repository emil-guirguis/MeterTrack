/**
 * Dynamic Meter Form
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
import { useMetersEnhanced } from './metersStore';
import type { Meter } from './meterConfig';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import '@framework/forms/components/BaseForm.css';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  onSubmit: legacyOnSubmit,
  onCancel,
  loading = false,
}) => {
  const { checkPermission } = useAuth();
  
  // Load schema from backend
  const { schema, loading: schemaLoading, error: schemaError } = useSchema('meter');
  
  const meters = useMetersEnhanced();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const canCreate = checkPermission(Permission.METER_CREATE);
  const canUpdate = checkPermission(Permission.METER_UPDATE);

  // Use the framework hook for form management with optimistic updates
  const form = useEntityFormWithStore<Meter, any>({
    entity: meter,
    store: meters,
    entityToFormData: (meterData) => {
      if (!schema) return {};
      const formSchema = createFormSchema(schema.formFields);
      return formSchema.fromApi(meterData);
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
      console.log(`[MeterForm] ${mode} successful:`, savedEntity.id);
      // Call legacy onSubmit if provided for backward compatibility
      if (legacyOnSubmit) {
        await legacyOnSubmit(savedEntity);
      }
      onCancel(); // Close the form
    },
    onError: (error, mode) => {
      console.error(`[MeterForm] ${mode} failed:`, error);
    },
  });

  const isFormDisabled = loading || form.isSubmitting;

  // Validation
  const validateForm = (): boolean => {
    if (!schema) return false;
    
    const newErrors: Record<string, string> = {};

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      const value = form.formData[fieldName];
      const backendFieldDef = fieldDef as BackendFieldDefinition;

      // Required check
      if (backendFieldDef.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = `${backendFieldDef.label} is required`;
        return;
      }

      // Type-specific validation
      if (value !== undefined && value !== null && value !== '') {
        // Number validation
        if (backendFieldDef.type === 'number') {
          if (typeof value !== 'number') {
            newErrors[fieldName] = `${backendFieldDef.label} must be a number`;
          } else {
            if (backendFieldDef.min !== null && backendFieldDef.min !== undefined && value < backendFieldDef.min) {
              newErrors[fieldName] = `${backendFieldDef.label} must be at least ${backendFieldDef.min}`;
            }
            if (backendFieldDef.max !== null && backendFieldDef.max !== undefined && value > backendFieldDef.max) {
              newErrors[fieldName] = `${backendFieldDef.label} must be at most ${backendFieldDef.max}`;
            }
          }
        }

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

        // Enum validation
        if (backendFieldDef.enumValues && !backendFieldDef.enumValues.includes(value)) {
          newErrors[fieldName] = `${backendFieldDef.label} must be one of: ${backendFieldDef.enumValues.join(', ')}`;
        }
      }
    });

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
    const value = form.formData[fieldName];
    const error = errors[fieldName];

    // Select field for enums
    if (fieldDef.enumValues) {
      return (
        <div key={fieldName} className="form-group">
          <label htmlFor={fieldName}>
            {fieldDef.label}
            {fieldDef.required && ' *'}
          </label>
          <select
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={error ? 'form-control form-control--error' : 'form-control'}
            disabled={isFormDisabled}
          >
            <option value="">Select {fieldDef.label}</option>
            {fieldDef.enumValues.map((enumValue: string) => (
              <option key={enumValue} value={enumValue}>
                {enumValue.charAt(0).toUpperCase() + enumValue.slice(1)}
              </option>
            ))}
          </select>
          {error && <div className="form-error">{error}</div>}
          {fieldDef.description && (
            <div className="form-helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Boolean field (checkbox)
    if (fieldDef.type === 'boolean') {
      return (
        <div key={fieldName} className="form-group form-group--checkbox">
          <label htmlFor={fieldName}>
            <input
              type="checkbox"
              id={fieldName}
              checked={value || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              disabled={isFormDisabled}
            />
            <span>{fieldDef.label}</span>
            {fieldDef.required && ' *'}
          </label>
          {error && <div className="form-error">{error}</div>}
          {fieldDef.description && (
            <div className="form-helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Date field
    if (fieldDef.type === 'date') {
      return (
        <div key={fieldName} className="form-group">
          <label htmlFor={fieldName}>
            {fieldDef.label}
            {fieldDef.required && ' *'}
          </label>
          <input
            type="date"
            id={fieldName}
            value={value ? (typeof value === 'string' ? value.split('T')[0] : value) : ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={error ? 'form-control form-control--error' : 'form-control'}
            disabled={isFormDisabled}
          />
          {error && <div className="form-error">{error}</div>}
          {fieldDef.description && (
            <div className="form-helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Number field
    if (fieldDef.type === 'number') {
      return (
        <div key={fieldName} className="form-group">
          <label htmlFor={fieldName}>
            {fieldDef.label}
            {fieldDef.required && ' *'}
          </label>
          <input
            type="number"
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
            className={error ? 'form-control form-control--error' : 'form-control'}
            placeholder={fieldDef.placeholder}
            min={fieldDef.min}
            max={fieldDef.max}
            disabled={isFormDisabled}
          />
          {error && <div className="form-error">{error}</div>}
          {fieldDef.description && (
            <div className="form-helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Object field (JSON textarea)
    if (fieldDef.type === 'object') {
      return (
        <div key={fieldName} className="form-group">
          <label htmlFor={fieldName}>
            {fieldDef.label}
            {fieldDef.required && ' *'}
          </label>
          <textarea
            id={fieldName}
            value={value ? JSON.stringify(value, null, 2) : ''}
            onChange={(e) => {
              try {
                const parsed = e.target.value ? JSON.parse(e.target.value) : null;
                handleInputChange(fieldName, parsed);
              } catch {
                // Keep the raw value if JSON is invalid
                handleInputChange(fieldName, e.target.value);
              }
            }}
            className={error ? 'form-control form-control--error' : 'form-control'}
            placeholder={fieldDef.placeholder || 'Enter JSON object'}
            rows={5}
            disabled={isFormDisabled}
          />
          {error && <div className="form-error">{error}</div>}
          {fieldDef.description && (
            <div className="form-helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Textarea for long text
    if (fieldName.toLowerCase().includes('notes') || fieldName.toLowerCase().includes('description')) {
      return (
        <div key={fieldName} className="form-group">
          <label htmlFor={fieldName}>
            {fieldDef.label}
            {fieldDef.required && ' *'}
          </label>
          <textarea
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={error ? 'form-control form-control--error' : 'form-control'}
            placeholder={fieldDef.placeholder}
            maxLength={fieldDef.maxLength}
            rows={3}
            disabled={isFormDisabled}
          />
          {error && <div className="form-error">{error}</div>}
          {fieldDef.description && (
            <div className="form-helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Text field (default)
    return (
      <div key={fieldName} className="form-group">
        <label htmlFor={fieldName}>
          {fieldDef.label}
          {fieldDef.required && ' *'}
        </label>
        <input
          type="text"
          id={fieldName}
          value={value || ''}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className={error ? 'form-control form-control--error' : 'form-control'}
          placeholder={fieldDef.placeholder}
          maxLength={fieldDef.maxLength}
          disabled={isFormDisabled}
        />
        {error && <div className="form-error">{error}</div>}
        {fieldDef.description && (
          <div className="form-helper-text">{fieldDef.description}</div>
        )}
      </div>
    );
  };

  // Loading state
  if (schemaLoading) {
    return (
      <div className="meter-form">
        <div className="form-loading">Loading form schema...</div>
      </div>
    );
  }

  // Error state
  if (schemaError) {
    return (
      <div className="meter-form">
        <div className="form-error-banner">
          <span className="error-icon">⚠️</span>
          <span>Failed to load form schema: {schemaError.message}</span>
        </div>
      </div>
    );
  }

  // Permission check
  if (meter && !canUpdate) {
    return <div className="error-message">You don't have permission to edit meters.</div>;
  }

  if (!meter && !canCreate) {
    return <div className="error-message">You don't have permission to create meters.</div>;
  }

  if (!schema) {
    return null;
  }

  return (
    <div className="meter-form">
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h3>Meter Information</h3>
          <p className="form-section-description">{schema.description}</p>
          
          {/* Render all form fields dynamically from schema */}
          {Object.entries(schema.formFields).map(([fieldName, fieldDef]) =>
            renderField(fieldName, fieldDef)
          )}
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn--secondary"
            disabled={isFormDisabled}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn--primary"
            disabled={isFormDisabled}
          >
            {form.isSubmitting ? 'Saving...' : meter ? 'Update Meter' : 'Create Meter'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeterForm;
