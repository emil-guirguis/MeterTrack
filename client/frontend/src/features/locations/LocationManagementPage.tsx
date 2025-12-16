import React from 'react';
import { EntityManagementPage, FormModal } from '@framework/components/modal';
import { LocationList } from './LocationList';
import { LocationForm } from './LocationForm';
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
