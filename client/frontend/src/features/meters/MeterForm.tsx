/**
 * Meter Form
 * 
 * Multi-tab form for managing meter information.
 * Organized into tabs: Basic Info, Network, Register Map, and Additional Info.
 */

import React, { useRef, useCallback, useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { JsonGridEditor } from '@framework/components/grid';
import { useMetersEnhanced } from './metersStore';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import type { Meter } from './meterConfig';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type TabType = 'basic' | 'network' | 'register' | 'additional';

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('basic');
  const meters = useMetersEnhanced();
  const registerMapFileInputRef = useRef<HTMLInputElement>(null);
  const baseValidationDataProvider = useValidationDataProvider();
  
  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  // Define tabs with their sections
  const tabs: Record<TabType, { label: string; sections: Record<string, { fields: string[]; maxWidth?: string }> }> = {
    basic: {
      label: 'General',
      sections: {
        'Basic Information': {
          fields: [
            'name',
            'device_id',
            'location_id',
            'type',
            'serial_number',
          ],
        },
        'Network Settings': {
          fields: [
            'ip',
            'port',
          ],
        },
        'Status & Configuration': {
          fields: [
            'active',
            'installation_date',
          ],
        },
      },
    },
    network: {
      label: 'Register Map',
      sections: {
        'Register Map': {
          fields: [
            'register_map',
          ],
        },
      },
    },
    register: {
      label: 'Elements',
      sections: {

      },
    },
    additional: {
      label: 'Notes',
      sections: {
        '': {
          fields: [
            'notes',
          ],
        },
      },
    },
  };

  // Get field sections for active tab
  const fieldSections = tabs[activeTab].sections;

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
        <div key={fieldName} className="base-form__field meter-form__register-map">
          <div className="meter-form__field-header">
            <label className="base-form__label">
              {fieldDef.label}
              {fieldDef.required && <span className="base-form__required">*</span>}
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
    <div className="meter-form-container">
      {/* Tab Navigation */}
      <div className="meter-form__tabs">
        {(Object.entries(tabs) as Array<[TabType, typeof tabs[TabType]]>).map(([tabKey, tab]) => (
          <button
            key={tabKey}
            className={`meter-form__tab ${activeTab === tabKey ? 'meter-form__tab--active' : ''}`}
            onClick={() => setActiveTab(tabKey)}
            type="button"
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="meter-form__content">
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
          showSidebar={false}
        />
      </div>
    </div>
  );
};

export default MeterForm;
