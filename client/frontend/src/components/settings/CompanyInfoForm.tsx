import React from 'react';
import { CountrySelect } from '../common';
import Toast from '../common/Toast';
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
  return (
    <form className="settings-form" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
      {/* Show error as a toast notification */}
      {error && <Toast message={error} type="error" />}
      <div className="settings-form__section">
        <h3 className="settings-form__section-title">Company Information</h3>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Company Name</label>
            <input
              type="text"
              value={values.name || ''}
              onChange={e => onChange('name', e.target.value)}
              className="settings-form__input"
              required
              disabled={loading}
              placeholder="Enter company name"
              title="Company Name"
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Website URL</label>
            <input
              type="text"
              value={values.url || ''}
              onChange={e => onChange('url', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter website URL"
              title="Website URL"
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Address Line 1</label>
            <input
              type="text"
              value={values.address?.street || ''}
              onChange={e => onChange('address.street', e.target.value)}
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
              onChange={e => onChange('address.street2', e.target.value)}
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
              onChange={e => onChange('address.city', e.target.value)}
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
              onChange={e => onChange('address.state', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter state"
              title="State"
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Zip Code</label>
            <input
              type="text"
              value={values.address?.zipCode || ''}
              onChange={e => onChange('address.zipCode', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="Enter zip code"
              title="Zip Code"
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Country</label>
            <CountrySelect
              value={values.address?.country || ''}
              onChange={value => onChange('address.country', value)}
              disabled={loading}
              required
              className="settings-form__input"
            />
          </div>
        </div>
      </div>
      <div className="settings-form__actions">
        <button type="button" className="settings-form__btn settings-form__btn--secondary" onClick={onCancel} disabled={loading}>Cancel</button>
        <button type="submit" className="settings-form__btn settings-form__btn--primary" disabled={loading}>Save</button>
      </div>
    </form>
  );
};

export default CompanyInfoForm;
