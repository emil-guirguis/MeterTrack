/**
 * Meter Form
 * 
 * Uses the dynamic schema-based BaseForm to render the meter form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Fields are automatically organized into tabs and sections based on formGrouping metadata.
 */

import React, { useCallback, useState } from 'react';
import { BaseForm, FormContainer } from '@framework/components/form';
import { useMetersEnhanced, type Meter } from './metersStore';
import { useValidationDataProvider } from '../../hooks/useValidationDataProvider';
import { ElementsGrid } from './ElementsGrid';
import { CombinedMetersTab } from './CombinedMetersTab';
import './MeterForm.css';

interface MeterFormProps {
  meter?: Meter;
  meterType?: 'physical' | 'virtual' | null;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const MeterForm: React.FC<MeterFormProps> = ({
  meter,
  meterType,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const meters = useMetersEnhanced();
  const baseValidationDataProvider = useValidationDataProvider();
  const [isParentSaved, setIsParentSaved] = useState(!!meter?.meter_id);
  

  // Memoize the provider function to prevent unnecessary re-renders of ValidationFieldSelect
  const validationDataProvider = useCallback(
    (entityName: string, fieldDef: any) => baseValidationDataProvider(entityName, fieldDef),
    [baseValidationDataProvider]
  );

  // Handle parent meter save
  const handleParentSave = useCallback(async () => {
    // This will be called when the first meter is selected in CombinedMetersTab
    // The parent meter should already be saved by this point
    setIsParentSaved(true);
  }, []);

  // Determine meter type from meter object or meterType prop
  // Priority: meter.meter_type > meterType prop > null
  const determinedMeterType = meter?.meter_type || meterType || null;

  // Determine if meter is virtual
  const isVirtual = meter?.meter_type === 'virtual' || meterType === 'virtual';
  const meterId = meter?.meter_id || meter?.id;

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
          meterType={determinedMeterType}
          excludeFields={isVirtual ? ['serial_number', 'device_id', 'ip', 'port', 'elements'] : ['elements']}
          fieldsToClean={['id', 'elements']}
          renderCustomField={(fieldName, _fieldDef, _value, _error, _isDisabled, _onChange) => {
            console.log(`[MeterForm] renderCustomField - fieldName: ${fieldName}`, {
              meter_id: meter?.meter_id,
              id: meter?.id,
              meter: meter,
              hasMeterId: !!meter?.meter_id,
              isVirtual,
            });
            
            // When rendering the "elements" field, show ElementsGrid for physical meters or CombinedMetersTab for virtual meters
            if (fieldName === 'elements') {
              console.log(`[MeterForm] Rendering elements field`, {
                meter_id: meterId,
                isVirtual,
                shouldRenderGrid: !!meterId,
              });
              
              if (!meterId) {
                console.log(`[MeterForm] ❌ No meter_id, returning placeholder`);
                return <div>Save the meter first to manage elements</div>;
              }

              // For virtual meters, show CombinedMetersTab
              if (isVirtual) {
                console.log(`[MeterForm] ✅ Rendering CombinedMetersTab for virtual meter ${meterId}`);
                return (
                  <div className="meter-form__combined-meters-tab">
                    <CombinedMetersTab
                      meterId={meterId}
                      isVirtual={true}
                      isParentSaved={isParentSaved}
                      onParentSave={handleParentSave}
                      onError={(error) => console.error('CombinedMetersTab error:', error)}
                    />
                  </div>
                );
              }

              // For physical meters, show ElementsGrid
              console.log(`[MeterForm] ✅ Rendering ElementsGrid for physical meter ${meterId}`);
              return (
                <div className="meter-form__elements-grid">
                  <ElementsGrid
                    meterId={Number(meterId)}
                    onError={(error) => console.error('ElementsGrid error:', error)}
                    onSuccess={(message) => console.log('ElementsGrid success:', message)}
                  />
                </div>
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
