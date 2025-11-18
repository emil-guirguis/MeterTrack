import React from 'react';
import { EntityManagementPage } from '@framework/shared/components/EntityManagementPage';
import { MeterList } from './MeterList';
import { MeterForm } from './MeterForm';
import { FormModal } from '@framework/shared/components/FormModal';
import { useMetersEnhanced } from './metersStore';
import AppLayout from '../../components/layout/AppLayout';
import type { Meter } from '../../types/entities';

export const MeterManagementPage: React.FC = () => (
  <EntityManagementPage<Meter, ReturnType<typeof useMetersEnhanced>>
    title="Meter Management"
    entityName="meter"
    ListComponent={MeterList}
    FormComponent={MeterForm}
    useStore={useMetersEnhanced}
    LayoutComponent={AppLayout}
    ModalComponent={FormModal}
  />
);
