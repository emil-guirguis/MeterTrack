/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useCallback, useState } from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { useMetersEnhanced, type Meter } from './metersStore';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import { ElementsGrid } from './ElementsGrid';
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
  const baseValidationDataProvider = useValidationDataProvider();
  
  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('meter');

  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  // Track active tab for conditional rendering of Elements grid
  const [activeTab, setActiveTab] = useState<string>('');

  return (
    <FormContainer>
      <div className="form-container__content">
        <BaseForm
          schemaName="meter"
          entity={meter}
          store={meters}
          onCancel={onCancel}
          onSubmit={onSubmit}
          className="meter-form"
          loading={loading}
          validationDataProvider={validationDataProvider}
          showTabs={true}
          onTabChange={setActiveTab}
          renderCustomField={(fieldName, fieldDef, value, error, isDisabled, onChange) => {
            console.log(`[MeterForm] renderCustomField called for: ${fieldName}`, {
              fieldName,
              hasMeterId: !!meter?.meter_id,
              meterId: meter?.meter_id,
              fieldDefType: fieldDef?.type,
            });
            
            // When rendering the "elements" field, show the ElementsGrid instead
            if (fieldName === 'elements' && meter?.meter_id) {
              console.log(`[MeterForm] Rendering ElementsGrid for meter ${meter.meter_id}`);
              return (
                <ElementsGrid
                  meterId={Number(meter.meter_id)}
                  onError={(error) => console.error('ElementsGrid error:', error)}
                  onSuccess={(message) => console.log('ElementsGrid success:', message)}
                />
              );
            }
            // Return null to let BaseForm render the default field
            return null;
          }}
        />
      </div>
    </FormContainer>
  );
};

export default MeterForm;
