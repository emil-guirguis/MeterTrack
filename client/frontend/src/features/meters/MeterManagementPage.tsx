import React from 'react';
import { EntityManagementPage } from '@framework/shared/components';
import { MeterList } from './MeterList';
import { MeterForm } from './MeterForm';
import { FormModal } from '@framework/shared/components';
import { useMetersEnhanced } from './metersStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';

import type { Meter } from './meterConfig';

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
