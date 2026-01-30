import React, { useState, useEffect } from 'react';
import type { Report } from './types';
import './ReportForm.css';

interface ReportFormProps {
  report?: Report;
  onSubmit: (data: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const REPORT_TYPES = [
  { value: 'meter_readings', label: 'Meter Readings' },
  { value: 'usage_summary', label: 'Usage Summary' },
  { value: 'daily_summary', label: 'Daily Summary' },
];

const CRON_PRESETS = [
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 9 * * 1', label: 'Weekly on Monday at 9 AM' },
  { value: '0 9 1 * *', label: 'Monthly on 1st at 9 AM' },
  { value: '0 0 * * *', label: 'Daily at Midnight' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
];

export const ReportForm: React.FC<ReportFormProps> = ({
  report,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [formData, setFormData] = useState<Omit<Report, 'report_id' | 'created_at' | 'updated_at'>>({
    name: '',
    type: 'meter_readings',
    schedule: '0 9 * * *',
    recipients: [],
    config: {},
    enabled: true,
  });

  const [recipientInput, setRecipientInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (report) {
      setFormData({
        name: report.name,
        type: report.type,
        schedule: report.schedule,
        recipients: report.recipients,
        config: report.config,
        enabled: report.enabled,
      });
    }
  }, [report]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Report name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Report name must not exceed 255 characters';
    }

    if (!formData.type) {
      newErrors.type = 'Report type is required';
    }

    if (!formData.schedule.trim()) {
      newErrors.schedule = 'Schedule is required';
    }

    if (formData.recipients.length === 0) {
      newErrors.recipients = 'At least one recipient is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleAddRecipient = () => {
    const email = recipientInput.trim();
    if (!email) return;

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setErrors(prev => ({ ...prev, recipientInput: 'Invalid email format' }));
      return;
    }

    if (formData.recipients.includes(email)) {
      setErrors(prev => ({ ...prev, recipientInput: 'Email already added' }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      recipients: [...prev.recipients, email],
    }));
    setRecipientInput('');
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors.recipientInput;
      return newErrors;
    });
  };

  const handleRemoveRecipient = (email: string) => {
    setFormData(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email),
    }));
  };

  return (
    <form className="report-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="name" className="form-label">
          Report Name <span className="required">*</span>
        </label>
        <input
          id="name"
          type="text"
          className={`form-input ${errors.name ? 'form-input--error' : ''}`}
          value={formData.name}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, name: e.target.value }));
            if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
          }}
          placeholder="e.g., Monthly Usage Report"
          disabled={loading}
        />
        {errors.name && <span className="form-error">{errors.name}</span>}
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="type" className="form-label">
            Report Type <span className="required">*</span>
          </label>
          <select
            id="type"
            className={`form-select ${errors.type ? 'form-select--error' : ''}`}
            value={formData.type}
            onChange={(e) => {
              setFormData(prev => ({ ...prev, type: e.target.value }));
              if (errors.type) setErrors(prev => ({ ...prev, type: '' }));
            }}
            disabled={loading}
          >
            {REPORT_TYPES.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.type && <span className="form-error">{errors.type}</span>}
        </div>

        <div className="form-group">
          <label htmlFor="enabled" className="form-label">
            <input
              id="enabled"
              type="checkbox"
              className="form-checkbox"
              checked={formData.enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, enabled: e.target.checked }))}
              disabled={loading}
            />
            <span>Enabled</span>
          </label>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="schedule" className="form-label">
          Schedule (Cron Expression) <span className="required">*</span>
        </label>
        <select
          id="schedule"
          className={`form-select ${errors.schedule ? 'form-select--error' : ''}`}
          value={formData.schedule}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, schedule: e.target.value }));
            if (errors.schedule) setErrors(prev => ({ ...prev, schedule: '' }));
          }}
          disabled={loading}
        >
          <option value="">Select a preset or enter custom...</option>
          {CRON_PRESETS.map(preset => (
            <option key={preset.value} value={preset.value}>
              {preset.label} ({preset.value})
            </option>
          ))}
        </select>
        <input
          type="text"
          className={`form-input form-input--secondary ${errors.schedule ? 'form-input--error' : ''}`}
          value={formData.schedule}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, schedule: e.target.value }));
            if (errors.schedule) setErrors(prev => ({ ...prev, schedule: '' }));
          }}
          placeholder="0 9 * * * (Daily at 9 AM)"
          disabled={loading}
        />
        <small className="form-help">
          Format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)
        </small>
        {errors.schedule && <span className="form-error">{errors.schedule}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="recipients" className="form-label">
          Email Recipients <span className="required">*</span>
        </label>
        <div className="recipients-input-group">
          <input
            id="recipients"
            type="email"
            className={`form-input ${errors.recipientInput ? 'form-input--error' : ''}`}
            value={recipientInput}
            onChange={(e) => {
              setRecipientInput(e.target.value);
              if (errors.recipientInput) setErrors(prev => ({ ...prev, recipientInput: '' }));
            }}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddRecipient();
              }
            }}
            placeholder="Enter email address"
            disabled={loading}
          />
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleAddRecipient}
            disabled={loading || !recipientInput.trim()}
          >
            Add
          </button>
        </div>
        {errors.recipientInput && <span className="form-error">{errors.recipientInput}</span>}

        {formData.recipients.length > 0 && (
          <div className="recipients-list">
            {formData.recipients.map((email, idx) => (
              <div key={idx} className="recipient-tag">
                <span>{email}</span>
                <button
                  type="button"
                  className="recipient-tag__remove"
                  onClick={() => handleRemoveRecipient(email)}
                  disabled={loading}
                  aria-label={`Remove ${email}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {errors.recipients && <span className="form-error">{errors.recipients}</span>}
      </div>

      <div className="form-actions">
        <button
          type="submit"
          className="btn btn--primary"
          disabled={loading}
        >
          {loading ? 'Saving...' : report ? 'Update Report' : 'Create Report'}
        </button>
        <button
          type="button"
          className="btn btn--secondary"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

export default ReportForm;
