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
            onSubmit={onSubmit}
            className="meter-form"
            loading={loading}
            validationDataProvider={validationDataProvider}
            showTabs={true}
            onTabChange={setActiveTab}
          />
        )}
      </div>
    </FormContainer>
  );
};

export default MeterForm;
