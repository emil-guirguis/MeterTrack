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
  const [activeTab, setActiveTab] = useState<TabType>('Basic');
  const meters = useMetersEnhanced();
  const baseValidationDataProvider = useValidationDataProvider();
  
  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('meter');

  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  // Use the useFormTabs hook to organize fields into tabs and sections
  const { tabs, tabList, fieldSections } = useFormTabs(schema?.formFields, activeTab);

  const renderCustomField = (
    fieldName: string,
    fieldDef: any,
    value: any,
    error: string | undefined,
    isDisabled: boolean,
    onChange: (value: any) => void
  ) => {
    return null;
  };

  return (
    <FormContainer>
      <FormTabs
        tabs={tabs}
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
            renderCustomField={renderCustomField}
            fieldsToClean={['id', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags', 'tenant_id']}
            validationDataProvider={validationDataProvider}
            showSidebar={false}
          />
        )}
      </div>
    </FormContainer>
  );
};

export default MeterForm;
