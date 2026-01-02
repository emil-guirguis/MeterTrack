/**
 * Location Form
 * 
 * Uses the dynamic schema-based BaseForm to render the location form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the location schema.
 */

import React, { useState } from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { useFormTabs } from '@framework/components/form/hooks';
import { useLocationsEnhanced } from './locationsStore';
import type { Location } from '../../types/entities';

interface LocationFormProps {
  location?: Location;
  onSubmit?: (data: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

export const LocationForm: React.FC<LocationFormProps> = ({
  location,
  onSubmit,
  onCancel,
  loading = false,
}) => {
  const locations = useLocationsEnhanced();

  // Use schema from cache (prefetched at login)
  const { schema } = useSchema('location');

  // Initialize activeTab state - will be set to first tab once schema loads
  const [activeTab, setActiveTab] = useState<string>('');

  // Get all tabs from schema (using formTabs)
  const { tabList } = useFormTabs(schema?.formTabs, activeTab || 'dummy');
  
  // Set activeTab to first tab from schema on first load
  React.useEffect(() => {
    if (!activeTab && tabList?.length > 0) {
      setActiveTab(tabList[0]);
    }
  }, [tabList, activeTab]);

  // Use the useFormTabs hook to organize fields into tabs and sections for the active tab
  const { fieldSections } = useFormTabs(schema?.formTabs, activeTab);

  return (
    <BaseForm
      schemaName="location"
      entity={location}
      store={locations}
      onCancel={onCancel}
      onLegacySubmit={onSubmit}
      className="location-form"
      fieldSections={fieldSections}
      loading={loading}
    />
  );
};

export default LocationForm;
