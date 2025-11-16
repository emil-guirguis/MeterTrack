import React from 'react';
import type { FormFieldConfig } from '../types/form';
import './FormField.css';

export interface FormFieldProps extends Omit<FormFieldConfig, 'name'> {
  name: string;
  value: any;
  error?: string;
  touched?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  onBlur: (e: React.FocusEvent) => void;
  className?: string;
}

/**
 * Reusable form field component with validation and error display
 */
export const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  value,
  error,
  touched,
  placeholder,
  required,
  disabled,
  options,
  rows = 4,
  min,
  max,
  step,
  onChange,
  onBlur,
  className = '',
}) => {
  const showError = touched && error;
  const fieldId = `field-${name}`;
  const errorId = `${fieldId}-error`;

  const baseClassName = 'form-field';
  const inputClassName = `${baseClassName}__input ${showError ? `${baseClassName}__input--error` : ''} ${className}`;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={fieldId}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            rows={rows}
            className={`${baseClassName}__textarea ${showError ? `${baseClassName}__textarea--error` : ''}`}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
          />
        );

      case 'select':
        return (
          <select
            id={fieldId}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            required={required}
            disabled={disabled}
            className={`${baseClassName}__select ${showError ? `${baseClassName}__select--error` : ''}`}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'checkbox':
        return (
          <label className={`${baseClassName}__checkbox-label`}>
            <input
              id={fieldId}
              type="checkbox"
              name={name}
              checked={!!value}
              onChange={onChange}
              onBlur={onBlur}
              disabled={disabled}
              className={`${baseClassName}__checkbox`}
              aria-invalid={showError}
              aria-describedby={showError ? errorId : undefined}
            />
            <span>{label}</span>
          </label>
        );

      case 'radio':
        return (
          <div className={`${baseClassName}__radio-group`}>
            {options?.map(option => (
              <label key={option.value} className={`${baseClassName}__radio-label`}>
                <input
                  type="radio"
                  name={name}
                  value={option.value}
                  checked={value === option.value}
                  onChange={onChange}
                  onBlur={onBlur}
                  disabled={disabled}
                  className={`${baseClassName}__radio`}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <input
            id={fieldId}
            type={type}
            name={name}
            value={value ?? ''}
            onChange={onChange}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            min={min}
            max={max}
            step={step}
            className={inputClassName}
            aria-invalid={showError}
            aria-describedby={showError ? errorId : undefined}
          />
        );
    }
  };

  // For checkbox and radio, we don't need the standard label wrapper
  if (type === 'checkbox' || type === 'radio') {
    return (
      <div className={`${baseClassName} ${baseClassName}--${type}`}>
        {renderInput()}
        {showError && (
          <span id={errorId} className={`${baseClassName}__error`} role="alert">
            {error}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={baseClassName}>
      <label htmlFor={fieldId} className={`${baseClassName}__label`}>
        {label}
        {required && <span className={`${baseClassName}__required`}>*</span>}
      </label>
      {renderInput()}
      {showError && (
        <span id={errorId} className={`${baseClassName}__error`} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};
