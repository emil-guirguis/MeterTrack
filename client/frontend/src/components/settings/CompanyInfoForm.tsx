import React from 'react';
import { CountrySelect, Toast } from '@framework/components/common';
import { FormSection } from '@framework/components/form/FormSection';
import { FormField } from '@framework/components/form/FormField';
import { FormActions } from '@framework/components/form/FormActions';
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
  // Sync form changes back to parent
  const handleFieldChange = (field: string, value: any) => {
    onChange(field, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit();
  };

  return (
    <form className="settings-form" onSubmit={handleSubmit}>
      {/* Show error as a toast notification */}
      {error && <Toast message={error} type="error" />}
      
      <FormSection title="Company Information">
        <div className="settings-form__row">
          <div className="settings-form__field">
            <FormField
              name="name"
              label="Company Name"
              type="text"
              placeholder="Enter company name"
              value={values.name || ''}
              required
              disabled={loading}
              onChange={(e: any) => handleFieldChange('name', e.target.value)}
              onBlur={() => {}}
            />
          </div>
          <div className="settings-form__field">
            <FormField
              name="url"
              label="Website URL"
              type="url"
              placeholder="Enter website URL"
              value={values.url || ''}
              disabled={loading}
              onChange={(e: any) => handleFieldChange('url', e.target.value)}
              onBlur={() => {}}
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
              name="address.zipCode"
              label="Zip Code"
              type="text"
              placeholder="Enter zip code"
              value={values.address?.zipCode || ''}
              disabled={loading}
              onChange={(e: any) => handleFieldChange('address.zipCode', e.target.value)}
              onBlur={() => {}}
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
