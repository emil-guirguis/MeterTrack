/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useCallback, useState } from 'react';
import { BaseForm, FormContainer, FormTabs } from '@framework/components/form';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { useFormTabs } from '@framework/components/form/hooks';
import { useMetersEnhanced } from './metersStore';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import { ElementsGrid } from './ElementsGrid';
import type { Meter } from './meterConfig';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

type TabType = string;

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const meters = useMetersEnhanced();
  const baseValidationDataProvider = useValidationDataProvider();
  
  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('meter');

  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

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
    <FormContainer>
      <FormTabs
        tabs={allTabs}
        tabList={tabList}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      
      <div className="form-container__content">
        {activeTab === 'Elements' && meter?.id ? (
          <ElementsGrid
            meterId={Number(meter.id)}
            onError={(error) => console.error('ElementsGrid error:', error)}
            onSuccess={(message) => console.log('ElementsGrid success:', message)}
          />
        ) : (
          <BaseForm
            schemaName="meter"
            entity={meter}
            store={meters}
            onCancel={onCancel}
            onLegacySubmit={onSubmit}
            className="meter-form"
            fieldSections={fieldSections}
            loading={loading}
            validationDataProvider={validationDataProvider}
            showSidebar={false}
            showTabs={false}
          />
        )}
      </div>
    </FormContainer>
  );
};

export default MeterForm;
