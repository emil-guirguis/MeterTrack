/**
 * Device Form
 * 
 * Uses the dynamic schema-based BaseForm to render the device form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { FormTabs } from '@framework/components/form/FormTabs';
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

  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('device');

  // Initialize activeTab state - will be set to first tab once schema loads
  const [activeTab, setActiveTab] = useState<TabType>('');

  // Get all tabs from schema (using formTabs)
  const { tabs: allTabs, tabList } = useFormTabs(schema?.formTabs, activeTab || 'dummy');
  
  // Set activeTab to first tab from schema on first load
  React.useEffect(() => {
    if (!activeTab && tabList?.length > 0) {
      setActiveTab(tabList[0]);
    }
  }, [tabList, activeTab]);

  // Use the useFormTabs hook to organize fields into tabs and sections for the active tab
  const { fieldSections } = useFormTabs(schema?.formTabs, activeTab);

  return (
    <div className="device-form-container">
      {/* Tab Navigation */}
      <FormTabs
        tabs={allTabs}
        tabList={tabList}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        className="device-form__tabs"
      />

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
            showTabs={false}
          />
        )}
      </div>
    </div>
  );
};

export default DeviceForm;
