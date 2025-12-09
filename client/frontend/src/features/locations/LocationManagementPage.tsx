import React from 'react';
import { EntityManagementPage } from '@framework/shared/components';
import { LocationList } from './LocationList';
import { LocationForm } from './LocationForm';
import { FormModal } from '@framework/shared/components';
import { useLocationsEnhanced } from './locationsStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';
import type { Location } from '../../types/entities';

export const LocationManagementPage: React.FC = () => (
  <EntityManagementPage<Location, ReturnType<typeof useLocationsEnhanced>>
    title="Location Management"
    entityName="location"
    ListComponent={LocationList}
    FormComponent={LocationForm}
    useStore={useLocationsEnhanced}
    LayoutComponent={AppLayoutWrapper}
    ModalComponent={FormModal}
  />
);
