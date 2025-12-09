import React from 'react';
import { EntityManagementPage } from '@framework/shared/components';
import { DeviceList } from './DeviceList';
import { DeviceForm } from './DeviceForm';
import { FormModal } from '@framework/shared/components';
import { useDevicesEnhanced } from './devicesStore';
import AppLayoutWrapper from '../../components/layout/AppLayoutWrapper';

import type { Device } from './deviceConfig';

export const DeviceManagementPage: React.FC = () => (
  <EntityManagementPage<Device, ReturnType<typeof useDevicesEnhanced>>
    title="Device Management"
    entityName="device"
    ListComponent={DeviceList as unknown as React.ComponentType<any>}
    FormComponent={DeviceForm}
    useStore={useDevicesEnhanced}
    LayoutComponent={AppLayoutWrapper}
    ModalComponent={FormModal}
    formProps={{ modalSize: 'xl' }}
  />
);
