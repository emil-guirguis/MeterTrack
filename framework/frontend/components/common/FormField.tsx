import React, { forwardRef } from 'react';
import type { FormFieldProps } from '../list/types/ui';
import './FormField.css';

export const FormField = forwardRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement, FormFieldProps>(
  ({
    name,
    label,
    type = 'text',
    placeholder,
    required = false,
    disabled = false,
    error,
    help,
    options = [],
    multiple = false,
    rows = 3,
    accept,
    min,
    max,
    step,
    pattern,
    autoComplete,
    className = '',
    ...props
  }, ref) => {
    const fieldId = `field-${name}`;
    const errorId = error ? `${fieldId}-error` : undefined;
    const helpId = help ? `${fieldId}-help` : undefined;

    const baseInputProps = {
      id: fieldId,
      name,
      required,
      disabled,
      placeholder,
      className: `
        form-field__input
        ${error ? 'form-field__input--error' : ''}
        ${className}
      `.trim(),
      'aria-describedby': [errorId, helpId].filter(Boolean).join(' ') || undefined,
      'aria-invalid': error ? true : undefined,
      autoComplete,
      ...props,
    };

    const renderInput = () => {
      switch (type) {
        case 'textarea':
          return (
            <textarea
              {...baseInputProps}
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              className={`${baseInputProps.className} form-field__textarea`}
            />
          );

        case 'select':
          return (
            <select
              {...baseInputProps}
              ref={ref as React.Ref<HTMLSelectElement>}
              multiple={multiple}
              className={`${baseInputProps.className} form-field__select`}
            >
              {placeholder && !multiple && (
                <option value="" disabled>
                  {placeholder}
                </option>
              )}
              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}
                >
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'checkbox':
          return (
            <label className="form-field__checkbox-label">
              <input
                {...baseInputProps}
                ref={ref as React.Ref<HTMLInputElement>}
                type="checkbox"
                className={`form-field__checkbox ${className}`}
              />
              {label}
            </label>
          );

        case 'radio':
          return (
            <div className="form-field__radio-group">
              {options.map((option) => (
                <label key={option.value} className="form-field__radio-label">
                  <input
                    {...baseInputProps}
                    ref={ref as React.Ref<HTMLInputElement>}
                    type="radio"
                    value={option.value}
                    disabled={disabled || option.disabled}
                    className={`form-field__radio ${className}`}
                  />
                  {option.label}
                </label>
              ))}
            </div>
          );

        case 'file':
          return (
            <input
              {...baseInputProps}
              ref={ref as React.Ref<HTMLInputElement>}
              type="file"
              accept={accept}
              multiple={multiple}
              className={`${baseInputProps.className} form-field__file`}
            />
          );

        case 'number':
          return (
            <input
              {...baseInputProps}
              ref={ref as React.Ref<HTMLInputElement>}
              type="number"
              min={min}
              max={max}
              step={step}
            />
          );

        case 'date':
          return (
            <input
              {...baseInputProps}
              ref={ref as React.Ref<HTMLInputElement>}
              type="date"
              min={min}
              max={max}
            />
          );

        default:
          return (
            <input
              {...baseInputProps}
              ref={ref as React.Ref<HTMLInputElement>}
              type={type}
              pattern={pattern}
              min={min}
              max={max}
              step={step}
            />
          );
      }
    };

    // For checkbox and radio, the label is handled differently
    if (type === 'checkbox') {
      return (
        <div className="form-field">
          {renderInput()}
          {error && (
            <span id={errorId} className="form-field__error" role="alert">
              {error}
            </span>
          )}
          {help && (
            <span id={helpId} className="form-field__help">
              {help}
            </span>
          )}
        </div>
      );
    }

    if (type === 'radio') {
      return (
        <div className="form-field">
          <fieldset className="form-field__fieldset">
            <legend className={`form-field__legend ${required ? 'form-field__legend--required' : ''}`}>
              {label}
            </legend>
            {renderInput()}
          </fieldset>
          {error && (
            <span id={errorId} className="form-field__error" role="alert">
              {error}
            </span>
          )}
          {help && (
            <span id={helpId} className="form-field__help">
              {help}
            </span>
          )}
        </div>
      );
    }

    // Standard field layout
    return (
      <div className="form-field">
        <label
          htmlFor={fieldId}
          className={`form-field__label ${required ? 'form-field__label--required' : ''}`}
        >
          {label}
        </label>
        {renderInput()}
        {error && (
          <span id={errorId} className="form-field__error" role="alert">
            {error}
          </span>
        )}
        {help && (
          <span id={helpId} className="form-field__help">
            {help}
          </span>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';
