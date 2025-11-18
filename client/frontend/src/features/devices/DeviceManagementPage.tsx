import React from 'react';
import { EntityManagementPage } from '@framework/shared/components/EntityManagementPage';
import { DeviceList } from './DeviceList';
import { DeviceForm } from './DeviceForm';
import { FormModal } from '@framework/shared/components/FormModal';
import { useDevicesEnhanced } from './devicesStore';
import AppLayout from '../../components/layout/AppLayout';
import type { Device } from '../../types/device';

export const DeviceManagementPage: React.FC = () => (
  <EntityManagementPage<Device, ReturnType<typeof useDevicesEnhanced>>
    title="Device Management"
    entityName="device"
    ListComponent={DeviceList}
    FormComponent={DeviceForm}
    useStore={useDevicesEnhanced}
    LayoutComponent={AppLayout}
    ModalComponent={FormModal}
  />
);
