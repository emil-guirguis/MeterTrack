/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the meter schema.
 */

import React, { useRef, useCallback } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { JsonGridEditor } from '@framework/components/grid';
import { useMetersEnhanced } from './metersStore';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import type { Meter } from './meterConfig';

interface MeterFormProps {
  meter?: Meter;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const meters = useMetersEnhanced();
  const registerMapFileInputRef = useRef<HTMLInputElement>(null);
  const baseValidationDataProvider = useValidationDataProvider();
  
  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  const fieldSections: Record<string, string[]> = {
    'Basic Information': [
      'name',
      'type',
      'serial_number',
      'location_id',
      'device_id',
    ],
    'Network Settings': [
      'ip',
      'port',
    ],
    'Status & Configuration': [
      'status',
      'installation_date',
      'register_map',
    ],
    'Additional Information': [
      'notes',
    ],
  };

  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => {
    // Custom rendering for register_map (JSON field)
    if (fieldName === 'register_map' && (fieldDef.type === 'object' || fieldDef.type === 'json')) {
      const gridData = Array.isArray(value) ? value : (value ? [value] : []);

      return (
        <div key={fieldName} className="base-form__field">
          <div className="base-form__field-header">
            <label className="base-form__label">
              {fieldDef.label}
              {fieldDef.required && <span className="base-form__required">*</span>}
            </label>
            <div className="base-form__field-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => registerMapFileInputRef.current?.click()}
                disabled={isDisabled}
              >
                📁 Import CSV
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  if (meter?.device_id) {
                    console.log('Load defaults from device:', meter.device_id);
                  }
                }}
                disabled={isDisabled}
              >
                ⚙️ Default from Device
              </button>
            </div>
          </div>
          <JsonGridEditor
            data={gridData}
            onChange={onChange}
            readOnly={isDisabled}
            fileInputRef={registerMapFileInputRef}
          />
          {error && <span className="base-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="base-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <BaseForm
      schemaName="meter"
      entity={meter}
      store={meters}
      onCancel={onCancel}
      onLegacySubmit={onSubmit}
      className="meter-form"
      fieldSections={fieldSections}
      loading={loading}
      renderCustomField={renderCustomField}
      fieldsToClean={['id', 'active', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags', 'tenant_id']}
      validationDataProvider={validationDataProvider}
    />
  );
};

export default MeterForm;
