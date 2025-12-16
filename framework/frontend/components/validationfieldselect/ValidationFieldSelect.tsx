/**
 * Validation Field Select Component
 * 
 * Generic framework component for rendering validation fields (foreign key relationships)
 * Inherits styling from FormField pattern
 * 
 * Configuration is provided via fieldDef.validationSource which specifies:
 * - source: 'auth' | 'api' | 'static'
 * - entityName: name of the entity to fetch (e.g., 'location', 'device')
 * - labelField: field to use as label (e.g., 'name')
 * - valueField: field to use as value (default: 'id')
 */

import React, { useState, useEffect } from 'react';

export interface ValidationFieldSelectProps {
  fieldName: string;
  fieldDef: any;
  value: any;
  error: string | undefined;
  isDisabled: boolean;
  onChange: (value: any) => void;
  className: string;
  validationDataProvider?: (entityName: string, fieldDef: any) => Promise<Array<{ id: any; label: string }>>;
}

export const ValidationFieldSelect: React.FC<ValidationFieldSelectProps> = ({
  fieldName,
  fieldDef,
  value,
  error,
  isDisabled,
  onChange,
  className,
  validationDataProvider,
}) => {
  const [options, setOptions] = useState<Array<{ id: any; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Load options from validation data provider
  useEffect(() => {
    console.log(`🔄 [ValidationFieldSelect] ${fieldName}: useEffect triggered, validate=${fieldDef?.validate}, hasProvider=${!!validationDataProvider}`);
    
    if (!fieldDef?.validate) {
      console.log(`[ValidationFieldSelect] ${fieldName}: validate is not true, skipping`);
      return;
    }

    if (!validationDataProvider) {
      console.warn(`[ValidationFieldSelect] ${fieldName}: No validationDataProvider supplied`);
      setOptions([]);
      return;
    }

    const loadOptions = async () => {
      try {
        setLoading(true);

        // Map field names to entity names (e.g., 'location_id' -> 'location')
        const entityName = fieldName.replace('_id', '');

        console.log(`[ValidationFieldSelect] ${fieldName}: Calling validationDataProvider for entityName=${entityName}`);

        // Call the provider to get validation data
        const data = await validationDataProvider(entityName, fieldDef);
        
        console.log(`✅ [ValidationFieldSelect] ${fieldName}: Retrieved ${data?.length || 0} options`);
        if (data && data.length > 0) {
          data.forEach((item: any, idx: number) => {
            console.log(`  [${idx}] ID: ${item.id}, Label: ${item.label}`);
          });
        }
        setOptions(data || []);
      } catch (err) {
        console.error(`[ValidationFieldSelect] ${fieldName}: Error fetching validation data:`, err);
        setOptions([]);
      } finally {
        setLoading(false);
      }
    };

    loadOptions();
  }, [fieldName, fieldDef?.validate, validationDataProvider]);

  console.log(`[ValidationFieldSelect] ${fieldName}:`, { 
    value, 
    optionsCount: options.length, 
    loading,
    isDisabled,
    error 
  });

  const baseClassName = className.split('__')[0] || 'form';
  const fieldClassName = `${baseClassName}__field`;
  const labelClassName = `${baseClassName}__label`;
  const inputClassName = `${baseClassName}__input`;
  const errorClassName = `${baseClassName}__error`;
  const helperClassName = `${baseClassName}__helper-text`;
  const selectClassName = `${baseClassName}__select`;
  const requiredClassName = `${baseClassName}__required`;

  // Determine placeholder text
  let placeholderText = `Select ${fieldDef.label}`;
  if (loading) {
    placeholderText = 'Loading...';
  } else if (options.length === 0) {
    placeholderText = `No ${fieldDef.label.toLowerCase()} available`;
  }

  return (
    <div className={fieldClassName}>
      <label htmlFor={fieldName} className={`${labelClassName} ${error ? `${labelClassName}--error` : ''}`}>
        {fieldDef.label}
        {fieldDef.required && <span className={requiredClassName}>*</span>}
      </label>
      <select
        id={fieldName}
        value={value ? String(value) : ''}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        className={`${selectClassName} ${error ? `${inputClassName}--error` : ''}`}
        disabled={isDisabled}
        {...(error && { 'aria-invalid': 'true' })}
        aria-describedby={error ? `${fieldName}-error` : undefined}
      >
        <option value="">
          {placeholderText}
        </option>
        {options.map((option) => (
          <option key={option.id} value={String(option.id)}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span id={`${fieldName}-error`} className={errorClassName}>{error}</span>}
      {fieldDef.description && <div className={helperClassName}>{fieldDef.description}</div>}
    </div>
  );
};

export default ValidationFieldSelect;
