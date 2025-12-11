import React from 'react';
import { DataList } from '@framework/components/list/DataList';
import { useDevicesEnhanced } from './devicesStore';
import { useBaseList } from '@framework/components/list/hooks/useBaseList';
import type { Device } from './deviceConfig';
import { Permission } from '../../types/auth';
import {
  deviceColumns,
  deviceFilters,
  deviceStats,
  createDeviceBulkActions,
  deviceExportConfig,
} from './deviceConfig';
import { showConfirmation } from '@framework/utils/confirmationHelper';
import './DeviceList.css';

interface DeviceListProps {
  onDeviceSelect?: (device: Device) => void;
  onDeviceEdit?: (device: Device) => void;
  onDeviceCreate?: () => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  onDeviceSelect,
  onDeviceEdit,
  onDeviceCreate
}) => {
  const devices = useDevicesEnhanced();

  const handleDeviceDelete = (device: Device) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Device',
      message: `Delete device "${device.description}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await devices.deleteItem(device.id);
        await devices.fetchItems();
      }
    });
  };

  const mockAuthContext = {
    checkPermission: () => true,
    user: { id: '1', name: 'Dev User' }
  };

  const baseList = useBaseList<Device, any>({
    entityName: 'device',
    entityNamePlural: 'devices',
    useStore: useDevicesEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.DEVICE_CREATE,
      update: Permission.DEVICE_UPDATE,
      delete: Permission.DEVICE_DELETE,
    },
    columns: deviceColumns,
    filters: deviceFilters,
    stats: deviceStats,
    export: deviceExportConfig,
    onEdit: onDeviceEdit,
    onCreate: onDeviceCreate,
    authContext: mockAuthContext,
  });

  const safeData = Array.isArray(baseList.data) ? baseList.data : [];

  return (
    <div className="device-list">
      <DataList
        title="Devices"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={safeData}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No devices found. Create your first device to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleDeviceDelete}
        onSelect={baseList.bulkActions.length > 0 && onDeviceSelect ? (items) => onDeviceSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
