import React from 'react';
import './SettingsForm.css';

export interface SystemConfigFormProps {
  values: any;
  onChange: (field: string, value: any) => void;
  onSubmit: () => void;
  onCancel: () => void;
  loading?: boolean;
  error?: string | null;
}

const SystemConfigForm: React.FC<SystemConfigFormProps> = ({ values, onChange, onSubmit, onCancel, loading, error }) => {
  return (
    <form className="settings-form" onSubmit={e => { e.preventDefault(); onSubmit(); }}>
      {error && <div className="settings-form__error">{error}</div>}
      <div className="settings-form__section">
        <h3 className="settings-form__section-title">System Configuration</h3>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Timezone</label>
            <input
              type="text"
              value={values.timezone || ''}
              onChange={e => onChange('timezone', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="e.g. America/New_York"
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Date Format</label>
            <input
              type="text"
              value={values.dateFormat || ''}
              onChange={e => onChange('dateFormat', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="e.g. MM/DD/YYYY"
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Time Format</label>
            <select
              value={values.timeFormat || '12h'}
              onChange={e => onChange('timeFormat', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              title="Time Format"
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Currency</label>
            <input
              type="text"
              value={values.currency || ''}
              onChange={e => onChange('currency', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="e.g. USD"
            />
          </div>
        </div>
        <div className="settings-form__row">
          <div className="settings-form__field">
            <label className="settings-form__label">Language</label>
            <input
              type="text"
              value={values.language || ''}
              onChange={e => onChange('language', e.target.value)}
              className="settings-form__input"
              disabled={loading}
              placeholder="e.g. en"
            />
          </div>
          <div className="settings-form__field">
            <label className="settings-form__label">Default Page Size</label>
            <input
              type="number"
              value={values.defaultPageSize || 20}
              onChange={e => onChange('defaultPageSize', Number(e.target.value))}
              className="settings-form__input"
              disabled={loading}
              min={1}
              max={100}
              placeholder="20"
              title="Default Page Size"
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

export default SystemConfigForm;
