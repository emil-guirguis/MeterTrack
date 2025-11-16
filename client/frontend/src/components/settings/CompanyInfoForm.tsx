import React, { useEffect } from 'react';
import { CountrySelect } from '../common';
import Toast from '../common/Toast';
import { useBaseForm } from '../../../../../framework/frontend/forms/hooks/useBaseForm';
import { FormSection } from '../../../../../framework/frontend/forms/components/FormSection';
import { FormField } from '../../../../../framework/frontend/forms/components/FormField';
import { FormActions } from '../../../../../framework/frontend/forms/components/FormActions';
import { validators } from '../../../../../framework/frontend/forms/utils/validation';
import './SettingsForm.css';

export interface CompanyInfoFormProps {
  values: any;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const CompanyInfoForm: React.FC<CompanyInfoFormProps> = ({ values, onChange, onSubmit, onCancel, loading, error }) => {
  // Use the framework's useBaseForm hook
  const form = useBaseForm({
    initialValues: values,
    validationSchema: {
      name: [validators.required('Company name is required')],
      url: [validators.url('Please enter a valid URL')],
      'address.zipCode': [validators.zipCode('Please enter a valid ZIP code')],
    },
    onSubmit: async (formValues) => {
      // Sync form values back to parent
      Object.keys(formValues).forEach(key => {
        if (key.includes('.')) {
          onChange(key, (formValues as any)[key]);
        } else {
          onChange(key, (formValues as any)[key]);
        }
      });
      onSubmit();
    },
  });

  // Sync parent values to form when they change
  useEffect(() => {
    form.setValues(values);
  }, [values]);

  // Sync form changes back to parent
  const handleFieldChange = (field: string, value: any) => {
    form.setFieldValue(field, value);
    onChange(field, value);
  };

  return (
    <form className="settings-form" onSubmit={form.handleSubmit}>
      {/* Show error as a toast notification */}
      {error && <Toast message={error} type="error" />}
      
      <FormSection title="Company Information">
        <div className="settings-form__row">
          <div className="settings-form__field">
            <FormField
              {...form.getFieldProps('name')}
              label="Company Name"
              type="text"
              placeholder="Enter company name"
              required
              disabled={loading}
              error={form.getFieldMeta('name').error}
              touched={form.getFieldMeta('name').touched}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('name', e.target.value)}
            />
          </div>
          <div className="settings-form__field">
            <FormField
              {...form.getFieldProps('url')}
              label="Website URL"
              type="url"
              placeholder="Enter website URL"
              disabled={loading}
              error={form.getFieldMeta('url').error}
              touched={form.getFieldMeta('url').touched}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('url', e.target.value)}
            />
          </div>
        </div>
        
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Address Line 1</label>
            <input
              type="text"
              value={values.address?.street || ''}
              onChange={e => handleFieldChange('address.street', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter street address"
              title="Address Line 1"
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Address Line 2</label>
            <input
              type="text"
              value={values.address?.street2 || ''}
              onChange={e => handleFieldChange('address.street2', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter address line 2"
              title="Address Line 2"
            />
          </div>
        </div>
        
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">City</label>
            <input
              type="text"
              value={values.address?.city || ''}
              onChange={e => handleFieldChange('address.city', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter city"
              title="City"
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">State</label>
            <input
              type="text"
              value={values.address?.state || ''}
              onChange={e => handleFieldChange('address.state', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter state"
              title="State"
            />
          </div>
        </div>
        
        <div className="settings-form__row">
          <div className="settings-form__field">
            <FormField
              {...form.getFieldProps('address.zipCode')}
              label="Zip Code"
              type="text"
              placeholder="Enter zip code"
              disabled={loading}
              error={form.getFieldMeta('address.zipCode').error}
              touched={form.getFieldMeta('address.zipCode').touched}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFieldChange('address.zipCode', e.target.value)}
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Country</label>
            <CountrySelect
              value={values.address?.country || ''}
              onChange={value => handleFieldChange('address.country', value)}
              disabled={loading}
              required
              className="settings-form__input"
            />
          </div>
        </div>
      </FormSection>
      
      <FormActions
        onCancel={onCancel}
        submitLabel="Save"
        cancelLabel="Cancel"
        isSubmitting={loading}
        isDisabled={loading}
      />
    </form>
  );
};

export default CompanyInfoForm;
