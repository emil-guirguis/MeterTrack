/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 */

import React, { useRef } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { JsonGridEditor } from '@framework/components/grid';
import { useMetersEnhanced } from './metersStore';
import type { Meter } from './meterConfig';
import './MeterForm.css';

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

  const fieldSections: Record<string, string[]> = {
    'Basic Information': ['type', 'name', 'serial_number', 'device_id', 'device'],
    'Configuration': ['register_map'],
    'Network Settings': ['ip', 'port'],
    'Additional Information': [],
  };

  const renderCustomField = (fieldName: string, fieldDef: any, value: any, error: string | undefined, isDisabled: boolean, onChange: (value: any) => void) => {
    // Custom rendering for object fields (register_map)
    if (fieldDef.type === 'object') {
      const gridData = Array.isArray(value) ? value : (value ? [value] : []);
      
      return (
        <div key={fieldName} className="meter-form__field">
          <div className="meter-form__field-header">
            <label className="meter-form__label">
              {fieldDef.label}
              {fieldDef.required && <span className="meter-form__required">*</span>}
            </label>
            <div className="meter-form__field-actions">
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
          {error && <span className="meter-form__error">{error}</span>}
          {fieldDef.description && (
            <div className="meter-form__helper-text">{fieldDef.description}</div>
          )}
        </div>
      );
    }
    
    return null; // Use default rendering for other fields
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
      fieldsToClean={['id', 'active', 'status', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags']}
    />
  );
};

export default MeterForm;
