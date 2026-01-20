/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useCallback } from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
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
  

  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

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
          renderCustomField={(fieldName, _fieldDef, _value, _error, _isDisabled, _onChange) => {
            console.log(`[MeterForm] renderCustomField - fieldName: ${fieldName}`, {
              meter_id: meter?.meter_id,
              id: meter?.id,
              meter: meter,
              hasMeterId: !!meter?.meter_id,
            });
            
            // When rendering the "elements" field, show the ElementsGrid instead
            if (fieldName === 'elements') {
              const meterId = meter?.meter_id || meter?.id;
              console.log(`[MeterForm] Rendering elements field`, {
                meter_id: meterId,
                shouldRenderGrid: !!meterId,
              });
              
              if (meterId) {
                console.log(`[MeterForm] ✅ Rendering ElementsGrid for meter ${meterId}`);
                return (
                  <div className="meter-form__elements-grid">
                    <ElementsGrid
                      meterId={Number(meterId)}
                      onError={(error) => console.error('ElementsGrid error:', error)}
                      onSuccess={(message) => console.log('ElementsGrid success:', message)}
                    />
                  </div>
                );
              } else {
                console.log(`[MeterForm] ❌ No meter_id, returning placeholder`);
                return <div>Save the meter first to manage elements</div>;
              }
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
