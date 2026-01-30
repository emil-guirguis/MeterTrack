import React from 'react';
import { EntityManagementPage } from '@framework/components/modal';
import { FormModal } from '@framework/components/modal';
import { AppLayoutWrapper } from '../../components/layout/AppLayoutWrapper';
import { useMetersEnhanced, type Meter } from './metersStore';
import { MeterList } from './MeterList';
import { MeterForm } from './MeterForm';

export const MeterManagementPage: React.FC = () => (
  <EntityManagementPage<Meter, ReturnType<typeof useMetersEnhanced>>
    title="Meter Management"
    entityName="meter"
    ListComponent={MeterList}
    FormComponent={MeterForm}
    useStore={useMetersEnhanced}
    LayoutComponent={AppLayoutWrapper}
    ModalComponent={FormModal}
    formProps={{ modalSize: 'xl' }}
  />
);
