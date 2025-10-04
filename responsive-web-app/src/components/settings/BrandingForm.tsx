import React from 'react';
import './SettingsForm.css';

export interface BrandingFormProps {
  values: any;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const BrandingForm: React.FC<BrandingFormProps> = ({ values, onChange, onSubmit, onCancel, loading, error }) => {
  return (
    <form className="settings-form" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="settings-form__error">{error}</div>}
      <div className="settings-form__section">
        <h3 className="settings-form__section-title">Branding</h3>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Primary Color</label>
            <input
              type="color"
              value={values.primaryColor || '#2563eb'}
              onChange={e => onChange('primaryColor', e.target.value)}
              className="settings-form__input"
              disabled={loading}
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Secondary Color</label>
            <input
              type="color"
              value={values.secondaryColor || '#64748b'}
              onChange={e => onChange('secondaryColor', e.target.value)}
              className="settings-form__input"
              disabled={loading}
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Accent Color</label>
            <input
              type="color"
              value={values.accentColor || '#f59e0b'}
              onChange={e => onChange('accentColor', e.target.value)}
              className="settings-form__input"
              disabled={loading}
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Logo URL</label>
            <input
              type="text"
              value={values.logoUrl || ''}
              onChange={e => onChange('logoUrl', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Favicon URL</label>
            <input
              type="text"
              value={values.faviconUrl || ''}
              onChange={e => onChange('faviconUrl', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="https://..."
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Custom CSS</label>
            <textarea
              value={values.customCSS || ''}
              onChange={e => onChange('customCSS', e.target.value)}
              className="settings-form__input"
              rows={3}
              disabled={loading}
              placeholder="Paste custom CSS here..."
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

export default BrandingForm;
