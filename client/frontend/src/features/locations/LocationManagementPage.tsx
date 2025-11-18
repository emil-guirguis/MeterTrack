import React from 'react';
import { EntityManagementPage } from '@framework/shared/components/EntityManagementPage';
import { LocationList } from './LocationList';
import { LocationForm } from './LocationForm';
import { FormModal } from '@framework/shared/components/FormModal';
import { useLocationsEnhanced } from './locationsStore';
import AppLayout from '../../components/layout/AppLayout';
import type { Location } from '../../types/entities';

export const LocationManagementPage: React.FC = () => (
  <EntityManagementPage<Location, ReturnType<typeof useLocationsEnhanced>>
    title="Location Management"
    entityName="location"
    ListComponent={LocationList}
    FormComponent={LocationForm}
    useStore={useLocationsEnhanced}
    LayoutComponent={AppLayout}
    ModalComponent={FormModal}
  />
);
