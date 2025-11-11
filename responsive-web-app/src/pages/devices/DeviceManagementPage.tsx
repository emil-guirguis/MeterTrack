import React from 'react';
import { AppLayout } from '../../components/layout';
import { DeviceList } from '../../components/device/DeviceList';

export const DeviceManagementPage: React.FC = () => {
  // Breadcrumb configuration
  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Device Management', path: '/devices' },
  ];

  return (
    <AppLayout 
      title="Device Management" 
      breadcrumbs={breadcrumbs}
    >
      <div className="device-management-page">
        <DeviceList />
      </div>
    </AppLayout>
  );
};

export default DeviceManagementPage;
