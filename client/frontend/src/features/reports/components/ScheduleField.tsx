import React from 'react';
import './ScheduleField.css';

const CRON_PRESETS = [
  { value: '0 9 * * *', label: 'Daily at 9 AM' },
  { value: '0 9 * * 1', label: 'Weekly on Monday at 9 AM' },
  { value: '0 9 1 * *', label: 'Monthly on 1st at 9 AM' },
  { value: '0 0 * * *', label: 'Daily at Midnight' },
  { value: '0 */6 * * *', label: 'Every 6 hours' },
];

interface ScheduleFieldProps {
  value: string;
  error?: string;
  isDisabled: boolean;
  onChange: (value: string) => void;
}

/**
 * ScheduleField Component
 * 
 * Custom field renderer for managing cron schedule expressions.
 * Provides preset dropdown and custom expression input with validation.
 * 
 * **Validates: Requirements 4.1, 4.2, 4.3, 4.4, 4.5**
 */
export const ScheduleField: React.FC<ScheduleFieldProps> = ({
  value,
  error,
  isDisabled,
  onChange,
}) => {
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const presetValue = e.target.value;
    if (presetValue) {
      onChange(presetValue);
    }
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className="schedule-field">
      <div className="schedule-field__preset">
        <label htmlFor="schedule-preset" className="form-label">
          Preset Schedules
        </label>
        <select
          id="schedule-preset"
          className={`form-select ${error ? 'form-select--error' : ''}`}
          value={value}
          onChange={handlePresetChange}
          disabled={isDisabled}
        >
          <option value="">Select a preset or enter custom...</option>
          {CRON_PRESETS.map(preset => (
            <option key={preset.value} value={preset.value}>
              {preset.label} ({preset.value})
            </option>
          ))}
        </select>
      </div>

      <div className="schedule-field__custom">
        <label htmlFor="schedule-custom" className="form-label">
          Custom Cron Expression
        </label>
        <input
          id="schedule-custom"
          type="text"
          className={`form-input ${error ? 'form-input--error' : ''}`}
          value={value}
          onChange={handleCustomChange}
          placeholder="0 9 * * * (Daily at 9 AM)"
          disabled={isDisabled}
        />
      </div>

      <small className="form-help">
        Format: minute hour day month day-of-week. Examples: 0 9 * * * (Daily at 9 AM), 0 9 * * 1 (Weekly on Monday)
      </small>

      {error && <span className="form-error">{error}</span>}
    </div>
  );
};

export default ScheduleField;
