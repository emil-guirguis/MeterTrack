/**
 * Location Form
 * 
 * Uses the dynamic schema-based BaseForm to render the location form.
 * All validation, field rendering, and form management is handled by BaseForm.
 * Includes all required fields from the location schema.
 */

import React from 'react';
import { BaseForm } from '@framework/components/form/BaseForm';
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

  const fieldSections: Record<string, string[]> = {
    'Basic Information': [
      'name',
      'type',
      'status',
    ],
    'Address': [
      'street',
      'street2',
      'city',
      'state',
      'zip',
      'country',
    ],
    'Additional Information': [
      'squareFootage',
      'contactId',
      'active',
      'notes',
    ],
  };

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
      fieldsToClean={['id', 'active', 'createdat', 'updatedat', 'createdAt', 'updatedAt', 'tags', 'tenant_id']}
    />
  );
};

export default LocationForm;
