/**
 * Device Form
 * 
 * Uses the dynamic schema-based BaseForm to render the device form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the device schema.
 */

import React, { useRef } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { JsonGridEditor } from '@framework/components/json_grid';
import { useDevicesEnhanced } from './devicesStore';
import type { Device } from './deviceConfig';

interface DeviceFormProps {
  device?: Device;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  device,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const devices = useDevicesEnhanced();
  const registerMapFileInputRef = useRef<HTMLInputElement>(null);

  const fieldSections: Record<string, string[]> = {
    'Device Information': [
      'type',
      'manufacturer',
      'model_number',
      'description',
    ],
    'Configuration': [
      'register_map',
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
                  if (device?.id) {
                    console.log('Load defaults from device:', device.id);
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
      schemaName="device"
      entity={device}
      store={devices}
      onCancel={onCancel}
      onLegacySubmit={onSubmit}
      className="device-form"
      fieldSections={fieldSections}
      loading={loading}
      renderCustomField={renderCustomField}
      fieldsToClean={['id', 'active', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags', 'tenant_id']}
    />
  );
};

export default DeviceForm;
