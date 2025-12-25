import React, { useState } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import type { SidebarSectionProps } from '../sidebar/Sidebar';
import { useSchema, clearSchemaCache } from './utils/schemaLoader';
import type { BackendFieldDefinition } from './utils/schemaLoader';
import { createFormSchema } from './utils/formSchema';
import { useEntityFormWithStore } from './hooks/useEntityFormWithStore';
import { ValidationFieldSelect } from '../validationfieldselect/ValidationFieldSelect';
import { FormField } from '../formfield/FormField';
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
  showSidebar?: boolean;
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
  fieldSections?: Record<string, string[] | { fields: string[]; maxWidth?: string }>;
  loading?: boolean;
  excludeFields?: string[];
  fieldsToClean?: string[];
  validationDataProvider?: (entityName: string, fieldDef: any) => Promise<Array<{ id: any; label: string }>>;
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
  showSidebar = false,
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
  validationDataProvider,
}) => {
  const formClassName = className ? `base-form ${className}` : 'base-form';
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Clear schema cache when form mounts to ensure fresh schema
  React.useEffect(() => {
    if (schemaName) {
      clearSchemaCache(schemaName);
    }
  }, [schemaName]);

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
          const formData = formSchema.fromApi(entityData);
          
          // Also include entityFields data
          Object.entries(schema.entityFields || {}).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.showOn?.includes('form')) {
              formData[fieldName] = entityData[fieldName];
            }
          });
          
          return formData;
        },
        getDefaultFormData: () => {
          if (!schema) return {};
          const formSchema = createFormSchema(schema.formFields);
          const defaults = formSchema.getDefaults();
          
          // Also include entityFields defaults
          Object.entries(schema.entityFields || {}).forEach(([fieldName, fieldDef]) => {
            if (fieldDef.showOn?.includes('form')) {
              defaults[fieldName] = fieldDef.default;
            }
          });
          
          return defaults;
        },
        formDataToEntity: (formData) => {
          if (!schema) return {};
          const formSchema = createFormSchema(schema.formFields);
          const apiData = formSchema.toApi(formData);
          const cleanData = { ...apiData };
          fieldsToClean.forEach(field => {
            delete cleanData[field];
          });
          
          // For updates, only include dirty fields
          if (entity && form?.dirtyFields && form.dirtyFields.size > 0) {
            const filteredData: any = {};
            form.dirtyFields.forEach(field => {
              if (field in cleanData) {
                filteredData[field] = cleanData[field];
              }
            });
            console.log('[FORM] Dirty fields:', Array.from(form.dirtyFields));
            console.log('[FORM] Filtered data (only dirty fields):', filteredData);
            return filteredData;
          }
          
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
          
          // Extract API error details
          let errorMessage = error.message || `Failed to ${mode} record`;
          let apiErrors: any = null;
          let errorDetails = '';
          
          if ('response' in error) {
            const response = (error as any).response;
            console.log('[BaseForm] Response object:', response);
            
            if (response?.data?.errors) {
              apiErrors = response.data.errors;
              // Format validation errors
              if (Array.isArray(apiErrors)) {
                errorDetails = apiErrors
                  .map((err: any) => `${err.path}: ${err.msg}`)
                  .join('<br/>');
              } else {
                errorDetails = JSON.stringify(apiErrors, null, 2);
              }
            }
            if (response?.data?.message) {
              errorMessage = response.data.message;
            }
          }
          
          // Display error toast
          console.error(`[BaseForm] Error details:`, { errorMessage, apiErrors, errorDetails });
          
          // Show error notification
          const errorNotification = document.createElement('div');
          errorNotification.className = 'form-error-toast';
          errorNotification.innerHTML = `
            <div class="form-error-toast__content">
              <span class="form-error-toast__icon">⚠️</span>
              <div class="form-error-toast__message">
                <strong>${errorMessage}</strong>
                ${errorDetails ? `<div class="form-error-toast__details">${errorDetails}</div>` : ''}
              </div>
              <button class="form-error-toast__close" onclick="this.parentElement.parentElement.remove()">✕</button>
            </div>
          `;
          document.body.appendChild(errorNotification);
          
          // Auto-remove after 7 seconds (longer for detailed errors)
          setTimeout(() => {
            if (errorNotification.parentElement) {
              errorNotification.remove();
            }
          }, 7000);
        },
      })
    : null;

  const validateForm = (): { isValid: boolean; newErrors: Record<string, string> } => {
    if (!isDynamicForm || !schema) return { isValid: true, newErrors: {} };

    const newErrors: Record<string, string> = {};

    console.log('[VALIDATION] Starting form validation...');
    console.log('[VALIDATION] Form data:', form?.formData);
    console.log('[VALIDATION] Schema fields:', Object.keys(schema.formFields));

    Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
      if (excludeFields.includes(fieldName)) {
        console.log(`[VALIDATION] Skipping excluded field: ${fieldName}`);
        return;
      }

      const value = form?.formData?.[fieldName];
      const backendFieldDef = fieldDef as BackendFieldDefinition & { validation?: boolean };

      console.log(`[VALIDATION] Checking field: ${fieldName}, value: ${value}, required: ${backendFieldDef.required}, showOn: ${backendFieldDef.showOn}`);

      if (backendFieldDef.showOn && !backendFieldDef.showOn.includes('form')) {
        console.log(`[VALIDATION] Skipping field not shown on form: ${fieldName}`);
        return;
      }

      if (backendFieldDef.required && (value === undefined || value === null || value === '')) {
        newErrors[fieldName] = `${backendFieldDef.label} is required`;
        console.log(`[VALIDATION] ❌ Required field missing: ${fieldName} (${backendFieldDef.label})`);
        return;
      }

      if (backendFieldDef.validation === false) {
        return;
      }

      // Skip validation for foreign key fields (validate: true) - they're validated by the backend
      if (backendFieldDef.validate === true) {
        return;
      }

      if (value !== undefined && value !== null && value !== '') {
        if (backendFieldDef.type === 'number') {
          // Convert string to number for validation
          const numValue = typeof value === 'string' ? parseFloat(value) : value;
          if (isNaN(numValue)) {
            newErrors[fieldName] = `${backendFieldDef.label} must be a number`;
          } else {
            if (backendFieldDef.min !== null && backendFieldDef.min !== undefined && numValue < backendFieldDef.min) {
              newErrors[fieldName] = `${backendFieldDef.label} must be at least ${backendFieldDef.min}`;
            }
            if (backendFieldDef.max !== null && backendFieldDef.max !== undefined && numValue > backendFieldDef.max) {
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

        // Validate enum values - check against original enumValues
        if (backendFieldDef.enumValues) {
          const enumValues = backendFieldDef.enumValues;
          if (!enumValues.includes(value)) {
            newErrors[fieldName] = `${backendFieldDef.label} must be one of: ${enumValues.join(', ')}`;
          }
        }
      }
    });

    const isValid = Object.keys(newErrors).length === 0;
    
    console.log('[VALIDATION] Setting errors:', newErrors);
    setErrors(newErrors);
    
    if (!isValid) {
      console.log('[VALIDATION] ❌ Form validation FAILED. Errors:', newErrors);
    } else {
      console.log('[VALIDATION] ✅ Form validation PASSED');
    }
    
    return { isValid, newErrors };
  };

  const handleDynamicSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('========================================');
    console.log('[FORM SUBMIT] Form submission triggered');
    console.log('[FORM SUBMIT] Schema name:', schemaName);
    console.log('[FORM SUBMIT] Form data:', JSON.stringify(form?.formData, null, 2));
    console.log('[FORM SUBMIT] Entity:', JSON.stringify(entity, null, 2));
    console.log('========================================');

    // Validate form and get validation result with errors
    const { isValid, newErrors } = validateForm();
    
    if (!isValid || form?.isSubmitting) {
      console.log('[FORM SUBMIT] Validation failed or already submitting');
      console.log('[FORM SUBMIT] Validation errors:', newErrors);
      
      // Focus on the first field with an error - use newErrors directly
      if (Object.keys(newErrors).length > 0) {
        const firstErrorField = Object.keys(newErrors)[0];
        console.log('[FORM SUBMIT] First error field:', firstErrorField);
        
        // Use setTimeout to ensure DOM is updated
        setTimeout(() => {
          const errorElement = document.getElementById(firstErrorField);
          if (errorElement) {
            console.log('[FORM SUBMIT] Focusing on field:', firstErrorField);
            errorElement.focus();
            errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          } else {
            console.warn('[FORM SUBMIT] Could not find element with id:', firstErrorField);
          }
        }, 100);
      }
      return;
    }

    try {
      console.log('[FORM SUBMIT] Calling handleSubmit...');
      await form?.handleSubmit();
      console.log('[FORM SUBMIT] Submit completed successfully');
    } catch (error) {
      console.error('[FORM SUBMIT] Form submission error:', error);
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

    // Handle validation fields (foreign key relationships)
    if (fieldDef.validate === true && fieldDef.type === 'number') {
      return (
        <ValidationFieldSelect
          key={fieldName}
          fieldName={fieldName}
          fieldDef={fieldDef}
          value={value}
          error={error}
          isDisabled={isFormDisabled}
          onChange={(val) => handleInputChange(fieldName, val)}
          className={className}
          validationDataProvider={validationDataProvider}
        />
      );
    }

    // Determine field type - handle special cases
    let fieldType = fieldDef.type || 'text';
    let fieldOptions = fieldDef.options;

    // Convert boolean to checkbox
    if (fieldType === 'boolean') {
      fieldType = 'checkbox';
    }

    // Convert enumValues to select with options
    if (fieldDef.enumValues && !fieldOptions) {
      fieldType = 'select';
      fieldOptions = fieldDef.enumValues.map((val: string) => ({
        value: val,
        label: val.charAt(0).toUpperCase() + val.slice(1),
      }));
    }

    // Convert description/notes fields to textarea
    if (['description', 'notes'].includes(fieldName) && fieldType === 'text') {
      fieldType = 'textarea';
    }

    // Disable autocomplete for address fields to prevent Chrome's save address dialog
    const addressFields = ['street', 'street2', 'city', 'state', 'zip', 'country', 'address'];
    const isAddressField = addressFields.includes(fieldName.toLowerCase());

    return (
      <div key={fieldName} className={`${className}__field`}>
        <FormField
          name={isAddressField ? `field_${fieldName}` : fieldName}
          label={fieldDef.label}
          type={fieldType === 'phone' ? 'tel' : fieldType}
          value={fieldType === 'checkbox' ? (value || false) : (value || '')}
          error={error}
          touched={!!error}
          help={fieldDef.description}
          required={fieldDef.required}
          disabled={isFormDisabled}
          placeholder={fieldDef.placeholder}
          options={fieldOptions}
          min={fieldDef.min}
          max={fieldDef.max}
          step={fieldDef.step}
          rows={fieldDef.rows || (fieldType === 'textarea' ? 4 : undefined)}
          onChange={(e: any) => {
            if (fieldType === 'checkbox') {
              handleInputChange(fieldName, e.target.checked);
            } else {
              handleInputChange(fieldName, e.target.value);
            }
          }}
          onBlur={() => {}}
        />
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
  const allSidebarSections: SidebarSectionProps[] = showSidebar
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
        ([sectionTitle, sectionConfig]) => {
          // Handle both old format (array of strings) and new format (object with fields and maxWidth)
          let fieldNames: string[] = [];
          let maxWidth: string | undefined;
          
          if (Array.isArray(sectionConfig)) {
            fieldNames = sectionConfig;
          } else if (typeof sectionConfig === 'object' && sectionConfig !== null && 'fields' in sectionConfig) {
            fieldNames = sectionConfig.fields;
            maxWidth = sectionConfig.maxWidth;
          }
          
          const visibleFields = fieldNames.filter(f => !excludeFields.includes(f));
          if (visibleFields.length === 0) return null;

          const sectionStyle = maxWidth ? { maxWidth } : undefined;

          return (
            <div key={sectionTitle} className={`${className}__section`} style={sectionStyle}>
              <h3 className={`${className}__section-title`}>{sectionTitle}</h3>
              {visibleFields.map(fieldName => {
                // Check formFields first, then entityFields
                const fieldDef = schema?.formFields?.[fieldName] || schema?.entityFields?.[fieldName];
                return fieldDef ? renderField(fieldName, fieldDef) : null;
              })}
            </div>
          );
        }
      )}
      
      {/* Render entity fields that have showOn: ['form'] but are not in fieldSections */}
      {Object.entries(schema?.entityFields || {}).some(([fieldName, fieldDef]) => 
        fieldDef.showOn?.includes('form') && 
        !excludeFields.includes(fieldName) &&
        !Object.values(fieldSections || {}).flat().includes(fieldName)
      ) && (
        <div className={`${className}__section`}>
          {Object.entries(schema?.entityFields || {}).map(([fieldName, fieldDef]) => {
            if (!fieldDef.showOn?.includes('form') || excludeFields.includes(fieldName)) {
              return null;
            }
            // Skip if already in fieldSections
            if (Object.values(fieldSections || {}).flat().includes(fieldName)) {
              return null;
            }
            
            return renderField(fieldName, fieldDef);
          })}
        </div>
      )}
    </>
  ) : (
    children
  );

  return (
    <form onSubmit={handleFormSubmit} className={formClassName} autoComplete="off">
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
