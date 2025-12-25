/**
 * Validation Field Select Component
 * 
 * Generic framework component for rendering validation fields (foreign key relationships)
 * Uses FormField with MUI Select for Material Design 3 styling
 * 
 * Configuration is provided via fieldDef.validationSource which specifies:
 * - source: 'auth' | 'api' | 'static'
 * - entityName: name of the entity to fetch (e.g., 'location', 'device')
 * - labelField: field to use as label (e.g., 'name')
 * - valueField: field to use as value (default: 'id')
 */

import React, { useState, useEffect } from 'react';
import { FormField } from '../formfield/FormField';

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

  // Determine placeholder text
  let placeholderText = `Select ${fieldDef.label}`;
  if (loading) {
    placeholderText = 'Loading...';
  } else if (options.length === 0) {
    placeholderText = `No ${fieldDef.label.toLowerCase()} available`;
  }

  // Convert options to FormField format
  const formFieldOptions = options.map((option) => ({
    value: option.id,
    label: option.label,
  }));

  return (
    <div className={`${className}__field`}>
      <FormField
        name={fieldName}
        label={fieldDef.label}
        type="select"
        value={value || ''}
        error={error}
        touched={!!error}
        help={fieldDef.description}
        required={fieldDef.required}
        disabled={isDisabled || loading}
        placeholder={placeholderText}
        options={formFieldOptions}
        onChange={(e: any) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        onBlur={() => {}}
      />
    </div>
  );
};

export default ValidationFieldSelect;
