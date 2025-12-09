/**
 * Dynamic Contact Form
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
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import type { BackendFieldDefinition } from '@framework/components/form/utils/schemaLoader';
import { createFormSchema } from '@framework/components/form/utils/formSchema';
import { useEntityFormWithStore } from '@framework/components/form/hooks/useEntityFormWithStore';
import { useContactsEnhanced } from './contactsStore';
import type { Contact } from './contactConfig';
import '@framework/components/form/BaseForm.css';
import './ContactForm.css';

interface ContactFormProps {
  contact?: Contact;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  contact,
  onSubmit: legacyOnSubmit,
  onCancel,
  loading = false,
}) => {
  // Load schema from backend
  const { schema, loading: schemaLoading, error: schemaError } = useSchema('contact');
  
  const contacts = useContactsEnhanced();
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Don't initialize form until schema is loaded
  // This prevents the race condition where entityToFormData is called before schema loads
  const form = useEntityFormWithStore<Contact, any>({
    entity: schema ? contact : undefined, // Only pass entity when schema is ready
    store: contacts,
    entityToFormData: (contactData) => {
      if (!schema) {
        console.warn('[ContactForm] entityToFormData called without schema - this should not happen');
        return {};
      }
      const formSchema = createFormSchema(schema.formFields);
      return formSchema.fromApi(contactData);
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
      const { id, active, status, createdat, updatedat, createdAt, updatedAt, tags, ...cleanData } = apiData;
      return cleanData;
    },
    updateStrategy: 'optimistic',
    onSuccess: async (savedEntity, mode) => {
      console.log(`[ContactForm] ${mode} successful:`, savedEntity.id);
      // Call legacy onSubmit if provided for backward compatibility
      if (legacyOnSubmit) {
        await legacyOnSubmit(savedEntity);
      }
      onCancel(); // Close the form
    },
    onError: (error, mode) => {
      console.error(`[ContactForm] ${mode} failed:`, error);
    },
  });

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
    const isFormDisabled = loading || form.isSubmitting;

    // Boolean field (checkbox)
    if (fieldDef.type === 'boolean') {
      return (
        <div key={fieldName} className="contact-form__field">
          <label htmlFor={fieldName} className="contact-form__label">
            <input
              type="checkbox"
              id={fieldName}
              checked={value || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              disabled={isFormDisabled}
              className="contact-form__checkbox"
            />
            {fieldDef.label}
            {fieldDef.required && <span className="contact-form__required">*</span>}
          </label>
          {error && <span className="contact-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="contact-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Select field for enums
    if (fieldDef.enumValues) {
      return (
        <div key={fieldName} className="contact-form__field">
          <label htmlFor={fieldName} className="contact-form__label">
            {fieldDef.label}
            {fieldDef.required && <span className="contact-form__required">*</span>}
          </label>
          <select
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`contact-form__select ${error ? 'contact-form__input--error' : ''}`}
            disabled={isFormDisabled}
          >
            <option value="">Select {fieldDef.label}</option>
            {fieldDef.enumValues.map((enumValue: string) => (
              <option key={enumValue} value={enumValue}>
                {enumValue.charAt(0).toUpperCase() + enumValue.slice(1)}
              </option>
            ))}
          </select>
          {error && <span className="contact-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="contact-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Textarea for notes field
    if (fieldName === 'notes') {
      return (
        <div key={fieldName} className="contact-form__field">
          <label htmlFor={fieldName} className="contact-form__label">
            {fieldDef.label}
            {fieldDef.required && <span className="contact-form__required">*</span>}
          </label>
          <textarea
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`contact-form__textarea ${error ? 'contact-form__input--error' : ''}`}
            placeholder={fieldDef.placeholder}
            disabled={isFormDisabled}
            rows={4}
          />
          {error && <span className="contact-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="contact-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Number field
    if (fieldDef.type === 'number') {
      return (
        <div key={fieldName} className="contact-form__field">
          <label htmlFor={fieldName} className="contact-form__label">
            {fieldDef.label}
            {fieldDef.required && <span className="contact-form__required">*</span>}
          </label>
          <input
            type="number"
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
            className={`contact-form__input ${error ? 'contact-form__input--error' : ''}`}
            placeholder={fieldDef.placeholder}
            min={fieldDef.min}
            max={fieldDef.max}
            disabled={isFormDisabled}
          />
          {error && <span className="contact-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="contact-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Email field
    if (fieldDef.type === 'email') {
      return (
        <div key={fieldName} className="contact-form__field">
          <label htmlFor={fieldName} className="contact-form__label">
            {fieldDef.label}
            {fieldDef.required && <span className="contact-form__required">*</span>}
          </label>
          <input
            type="email"
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`contact-form__input ${error ? 'contact-form__input--error' : ''}`}
            placeholder={fieldDef.placeholder}
            maxLength={fieldDef.maxLength}
            disabled={isFormDisabled}
          />
          {error && <span className="contact-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="contact-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    // Text field (default)
    return (
      <div key={fieldName} className="contact-form__field">
        <label htmlFor={fieldName} className="contact-form__label">
          {fieldDef.label}
          {fieldDef.required && <span className="contact-form__required">*</span>}
        </label>
        <input
          type="text"
          id={fieldName}
          value={value || ''}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className={`contact-form__input ${error ? 'contact-form__input--error' : ''}`}
          placeholder={fieldDef.placeholder}
          maxLength={fieldDef.maxLength}
          disabled={isFormDisabled}
        />
        {error && <span className="contact-form__error">{error}</span>}
        {fieldDef.description && (
          <div className="contact-form__helper-text">{fieldDef.description}</div>
        )}
      </div>
    );
  };

  // Loading state
  if (schemaLoading) {
    return (
      <div className="contact-form base-form">
        <div className="form-loading">Loading form schema...</div>
      </div>
    );
  }

  // Error state
  if (schemaError) {
    return (
      <div className="contact-form base-form">
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
  const contactInfoFields = ['name', 'company', 'role', 'email', 'phone'];
  const addressFields = ['street', 'street2', 'city', 'state', 'zip', 'country'];
  const additionalFields = ['active', 'notes'];

  return (
    <form onSubmit={handleSubmit} className="contact-form base-form">
      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Contact Information</h3>
        
        {contactInfoFields.map(fieldName => {
          const fieldDef = schema.formFields[fieldName];
          return fieldDef ? renderField(fieldName, fieldDef) : null;
        })}
      </div>

      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Address</h3>
        
        {addressFields.map(fieldName => {
          const fieldDef = schema.formFields[fieldName];
          return fieldDef ? renderField(fieldName, fieldDef) : null;
        })}
      </div>

      <div className="contact-form__section">
        <h3 className="contact-form__section-title">Additional Information</h3>
        
        {additionalFields.map(fieldName => {
          const fieldDef = schema.formFields[fieldName];
          return fieldDef ? renderField(fieldName, fieldDef) : null;
        })}
      </div>

      <div className="contact-form__actions">
        <button
          type="button"
          onClick={onCancel}
          disabled={loading || form.isSubmitting}
          className="contact-form__btn contact-form__btn--secondary"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading || form.isSubmitting}
          className="contact-form__btn contact-form__btn--primary"
        >
          {form.isSubmitting ? (
            <>
              <span className="contact-form__spinner" />
              {contact ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            contact ? 'Update Contact' : 'Create Contact'
          )}
        </button>
      </div>
    </form>
  );
};

export default ContactForm;
