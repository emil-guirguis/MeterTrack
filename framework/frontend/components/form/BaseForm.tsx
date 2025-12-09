import React, { useState } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import type { SidebarSectionProps } from '../sidebar/Sidebar';
import { useSchema } from './utils/schemaLoader';
import type { BackendFieldDefinition } from './utils/schemaLoader';
import { createFormSchema } from './utils/formSchema';
import { useEntityFormWithStore } from './hooks/useEntityFormWithStore';
import './BaseForm.css';

export interface BaseFormProps {
  children?: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  className?: string;
  sidebarSections?: SidebarSectionProps[];
  sidebarChildren?: React.ReactNode;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isSubmitting?: boolean;
  isDisabled?: boolean;
  showActionSidebar?: boolean;
  // Dynamic schema form props
  schemaName?: string;
  entity?: any;
  store?: any;
  onLegacySubmit?: (data: any) => Promise<void>;
  renderCustomField?: (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => React.ReactNode | null;
  fieldSections?: Record<string, string[]>;
  loading?: boolean;
  excludeFields?: string[];
  fieldsToClean?: string[];
}

/**
 * Base Form Component
 * 
 * Provides a consistent form layout with:
 * - Main content area for form fields
 * - Right sidebar for actions and metadata
 * - Collapsible action sections
 * - Responsive design
 * - Optional dynamic schema-based form rendering
 * 
 * @example
 * ```tsx
 * // Manual form with children
 * <BaseForm
 *   onSubmit={handleSubmit}
 *   className="contact-form"
 * >
 *   Form fields go here
 * </BaseForm>
 * 
 * // Dynamic schema form
 * <BaseForm
 *   schemaName="contact"
 *   entity={contact}
 *   store={contactsStore}
 *   onCancel={handleCancel}
 *   fieldSections={{
 *     'Basic Info': ['name', 'email'],
 *     'Address': ['street', 'city'],
 *   }}
 *   className="contact-form"
 * />
 * ```
 */
export const BaseForm: React.FC<BaseFormProps> = ({
  children,
  onSubmit,
  className = '',
  sidebarSections = [],
  sidebarChildren,
  submitLabel = 'Save',
  cancelLabel = 'Cancel',
  onCancel,
  isSubmitting = false,
  isDisabled = false,
  showActionSidebar = false,
  // Dynamic schema form props
  schemaName,
  entity,
  store,
  onLegacySubmit,
  renderCustomField,
  fieldSections,
  loading = false,
  excludeFields = [],
  fieldsToClean = ['id', 'active', 'createdat', 'updatedat', 'createdAt', 'updatedAt'],
}) => {
  const formClassName = className ? `base-form ${className}` : 'base-form';
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Dynamic schema form logic
  const isDynamicForm = !!schemaName;
  const { schema, loading: schemaLoading, error: schemaError } = useSchema(isDynamicForm ? schemaName! : '');

  const form = isDynamicForm
    ? useEntityFormWithStore<any, any>({
        entity: schema ? entity : undefined,
        store,
        entityToFormData: (entityData) => {
          if (!schema) return {};
          const formSchema = createFormSchema(schema.formFields);
          return formSchema.fromApi(entityData);
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
          const cleanData = { ...apiData };
          fieldsToClean.forEach(field => {
            delete cleanData[field];
          });
          return cleanData;
        },
        updateStrategy: 'optimistic',
        onSuccess: async (savedEntity, mode) => {
          console.log(`[BaseForm] ${mode} successful:`, savedEntity.id);
          if (onLegacySubmit) {
            await onLegacySubmit(savedEntity);
          }
          onCancel?.();
        },
        onError: (error, mode) => {
          console.error(`[BaseForm] ${mode} failed:`, error);
        },
      })
    : null;

  const validateForm = (): boolean => {
    if (!isDynamicForm || !schema) return true;

    const newErrors: Record<string, string> = {};

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      if (excludeFields.includes(fieldName)) return;

      const value = form?.formData?.[fieldName];
      const backendFieldDef = fieldDef as BackendFieldDefinition & { validation?: boolean; showon?: string[] };

      if (backendFieldDef.showon && !backendFieldDef.showon.includes('form')) {
        return;
      }

      if (backendFieldDef.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = `${backendFieldDef.label} is required`;
        return;
      }

      if (backendFieldDef.validation === false) {
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
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

        if (backendFieldDef.type === 'email' && typeof value === 'string') {
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
            newErrors[fieldName] = 'Please enter a valid email address';
          }
        }

        if (backendFieldDef.enumValues && !backendFieldDef.enumValues.includes(value)) {
          newErrors[fieldName] = `${backendFieldDef.label} must be one of: ${backendFieldDef.enumValues.join(', ')}`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDynamicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || form?.isSubmitting) {
      return;
    }

    try {
      await form?.handleSubmit();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    form?.setFormData?.((prev: any) => ({
      ...prev,
      [field]: value,
    }));

    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const renderField = (fieldName: string, fieldDef: any) => {
    const value = form?.formData?.[fieldName];
    const error = errors[fieldName];
    const isFormDisabled = loading || !!form?.isSubmitting;

    const customField = renderCustomField?.(fieldName, fieldDef, value, error, isFormDisabled, (val) =>
      handleInputChange(fieldName, val)
    );
    if (customField !== null && customField !== undefined) {
      return customField;
    }

    const baseClassName = className.split('__')[0] || 'form';
    const fieldClassName = `${baseClassName}__field`;
    const labelClassName = `${baseClassName}__label`;
    const inputClassName = `${baseClassName}__input`;
    const errorClassName = `${baseClassName}__error`;
    const helperClassName = `${baseClassName}__helper-text`;
    const checkboxClassName = `${baseClassName}__checkbox`;
    const selectClassName = `${baseClassName}__select`;
    const textareaClassName = `${baseClassName}__textarea`;
    const requiredClassName = `${baseClassName}__required`;

    if (fieldDef.type === 'boolean') {
      return (
        <div key={fieldName} className={fieldClassName}>
          <label htmlFor={fieldName} className={labelClassName}>
            <input
              type="checkbox"
              id={fieldName}
              checked={value || false}
              onChange={(e) => handleInputChange(fieldName, e.target.checked)}
              disabled={isFormDisabled}
              className={checkboxClassName}
            />
            {fieldDef.label}
            {fieldDef.required && <span className={requiredClassName}>*</span>}
          </label>
          {error && <span className={errorClassName}>{error}</span>}
          {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
        </div>
      );
    }

    if (fieldDef.enumValues) {
      return (
        <div key={fieldName} className={fieldClassName}>
          <label htmlFor={fieldName} className={labelClassName}>
            {fieldDef.label}
            {fieldDef.required && <span className={requiredClassName}>*</span>}
          </label>
          <select
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`${selectClassName} ${error ? `${inputClassName}--error` : ''}`}
            disabled={isFormDisabled}
          >
            <option value="">Select {fieldDef.label}</option>
            {fieldDef.enumValues.map((enumValue: string) => (
              <option key={enumValue} value={enumValue}>
                {enumValue.charAt(0).toUpperCase() + enumValue.slice(1)}
              </option>
            ))}
          </select>
          {error && <span className={errorClassName}>{error}</span>}
          {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
        </div>
      );
    }

    if (['description', 'notes'].includes(fieldName)) {
      return (
        <div key={fieldName} className={fieldClassName}>
          <label htmlFor={fieldName} className={labelClassName}>
            {fieldDef.label}
            {fieldDef.required && <span className={requiredClassName}>*</span>}
          </label>
          <textarea
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`${textareaClassName} ${error ? `${inputClassName}--error` : ''}`}
            placeholder={fieldDef.placeholder}
            disabled={isFormDisabled}
            rows={4}
          />
          {error && <span className={errorClassName}>{error}</span>}
          {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
        </div>
      );
    }

    if (fieldDef.type === 'number') {
      return (
        <div key={fieldName} className={fieldClassName}>
          <label htmlFor={fieldName} className={labelClassName}>
            {fieldDef.label}
            {fieldDef.required && <span className={requiredClassName}>*</span>}
          </label>
          <input
            type="number"
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, parseInt(e.target.value) || 0)}
            className={`${inputClassName} ${error ? `${inputClassName}--error` : ''}`}
            placeholder={fieldDef.placeholder}
            min={fieldDef.min}
            max={fieldDef.max}
            disabled={isFormDisabled}
          />
          {error && <span className={errorClassName}>{error}</span>}
          {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
        </div>
      );
    }

    if (fieldDef.type === 'email') {
      return (
        <div key={fieldName} className={fieldClassName}>
          <label htmlFor={fieldName} className={labelClassName}>
            {fieldDef.label}
            {fieldDef.required && <span className={requiredClassName}>*</span>}
          </label>
          <input
            type="email"
            id={fieldName}
            value={value || ''}
            onChange={(e) => handleInputChange(fieldName, e.target.value)}
            className={`${inputClassName} ${error ? `${inputClassName}--error` : ''}`}
            placeholder={fieldDef.placeholder}
            maxLength={fieldDef.maxLength}
            disabled={isFormDisabled}
          />
          {error && <span className={errorClassName}>{error}</span>}
          {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
        </div>
      );
    }

    // Disable autocomplete for address fields to prevent Chrome's save address dialog
    const addressFields = ['street', 'street2', 'city', 'state', 'zip', 'country', 'address'];
    const isAddressField = addressFields.includes(fieldName.toLowerCase());

    return (
      <div key={fieldName} className={fieldClassName}>
        <label htmlFor={fieldName} className={labelClassName}>
          {fieldDef.label}
          {fieldDef.required && <span className={requiredClassName}>*</span>}
        </label>
        <input
          type="text"
          id={fieldName}
          value={value || ''}
          onChange={(e) => handleInputChange(fieldName, e.target.value)}
          className={`${inputClassName} ${error ? `${inputClassName}--error` : ''}`}
          placeholder={fieldDef.placeholder}
          maxLength={fieldDef.maxLength}
          disabled={isFormDisabled}
          autoComplete={isAddressField ? 'off' : undefined}
        />
        {error && <span className={errorClassName}>{error}</span>}
        {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
      </div>
    );
  };

  // Dynamic form loading state
  if (isDynamicForm && schemaLoading) {
    return (
      <div className={formClassName}>
        <div className="form-loading">Loading form schema...</div>
      </div>
    );
  }

  // Dynamic form error state
  if (isDynamicForm && schemaError) {
    return (
      <div className={formClassName}>
        <div className="form-error-banner">
          <span className="error-icon">⚠️</span>
          <span>Failed to load form schema: {schemaError.message}</span>
        </div>
      </div>
    );
  }

  if (isDynamicForm && !schema) {
    return null;
  }

  // Build sidebar sections with actions conditionally included
  const allSidebarSections: SidebarSectionProps[] = showActionSidebar
    ? [
        {
          title: 'Actions',
          content: (
            <div className="base-form__actions">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  disabled={isSubmitting || isDisabled}
                  className="base-form__btn base-form__btn--secondary"
                >
                  {cancelLabel}
                </button>
              )}
              <button
                type="submit"
                disabled={isSubmitting || isDisabled}
                className="base-form__btn base-form__btn--primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="base-form__spinner" />
                    {submitLabel}
                  </>
                ) : (
                  submitLabel
                )}
              </button>
            </div>
          ),
          collapsible: true,
          defaultCollapsed: false,
        },
        ...sidebarSections,
      ]
    : sidebarSections;

  const handleFormSubmit = isDynamicForm ? handleDynamicSubmit : onSubmit;

  // Render dynamic form sections
  const formContent = isDynamicForm ? (
    <>
      {Object.entries(fieldSections || { 'Fields': Object.keys(schema?.formFields || {}).filter(f => !excludeFields.includes(f)) }).map(
        ([sectionTitle, fieldNames]) => {
          const visibleFields = fieldNames.filter(f => !excludeFields.includes(f));
          if (visibleFields.length === 0) return null;

          return (
            <div key={sectionTitle} className={`${className}__section`}>
              <h3 className={`${className}__section-title`}>{sectionTitle}</h3>
              {visibleFields.map(fieldName => {
                const fieldDef = schema?.formFields?.[fieldName];
                return fieldDef ? renderField(fieldName, fieldDef) : null;
              })}
            </div>
          );
        }
      )}
    </>
  ) : (
    children
  );

  return (
    <form onSubmit={handleFormSubmit} className={formClassName}>
      <div className="base-form__main">
        {formContent}
      </div>

      <Sidebar sections={allSidebarSections}>
        {sidebarChildren}
      </Sidebar>
    </form>
  );
};

export default BaseForm;
