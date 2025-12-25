/**
 * Device Form
 * 
 * Uses the dynamic schema-based BaseForm to render the device form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { useFormTabs } from '@framework/components/form/hooks';
import { useDevicesEnhanced } from './devicesStore';
import { RegistersGrid } from './RegistersGrid';
import type { Device } from './deviceConfig';
import './DeviceForm.css';

interface DeviceFormProps {
  device?: Device;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type TabType = string;

export const DeviceForm: React.FC<DeviceFormProps> = ({
  device,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const devices = useDevicesEnhanced();
  const [activeTab, setActiveTab] = useState<TabType>('Basic');

  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('device');

  // Debug: Log schema when it loads
  React.useEffect(() => {
    if (schema) {
      console.log('[DeviceForm] Schema loaded:', schema);
      console.log('[DeviceForm] Form fields:', Object.keys(schema.formFields));
      Object.entries(schema.formFields).forEach(([fieldName, fieldDef]) => {
        console.log(`[DeviceForm] Field: ${fieldName}`, {
          showOn: (fieldDef as any).showOn,
          formGrouping: (fieldDef as any).formGrouping,
          required: (fieldDef as any).required,
        });
      });
    }
  }, [schema]);

  // Use the useFormTabs hook to organize fields into tabs and sections
  const { tabs, tabList, fieldSections } = useFormTabs(schema?.formFields, activeTab);

  return (
    <div className="device-form-container">
      {/* Tab Navigation */}
      {tabList.length > 1 && (
        <div className="device-form__tabs">
          {tabList.map((tabName) => (
            <button
              key={tabName}
              className={`device-form__tab ${activeTab === tabName ? 'device-form__tab--active' : ''}`}
              onClick={() => setActiveTab(tabName)}
              type="button"
            >
              {tabs[tabName].label}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="device-form__content">
        {activeTab === 'Registers' && device?.id ? (
          <RegistersGrid
            deviceId={Number(device.id)}
            onError={(error) => console.error('RegistersGrid error:', error)}
            onSuccess={(message) => console.log('RegistersGrid success:', message)}
          />
        ) : (
          <BaseForm
            schemaName="device"
            entity={device}
            store={devices}
            onCancel={onCancel}
            onLegacySubmit={onSubmit}
            className="device-form"
            fieldSections={fieldSections}
            loading={loading}
            fieldsToClean={['id', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags']}
          />
        )}
      </div>
    </div>
  );
};

export default DeviceForm;
