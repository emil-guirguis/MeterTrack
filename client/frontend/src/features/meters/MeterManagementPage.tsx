import React from 'react';
import { EntityManagementPage, FormModal } from '@framework/components/modal';

import { MeterList } from './MeterList';
import { MeterForm } from './MeterForm';
import { useMetersEnhanced, type Meter } from './metersStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';

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
