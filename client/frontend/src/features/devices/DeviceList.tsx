import React from 'react';
import { DataList } from '@framework/lists/components/DataList';
import { useDevicesEnhanced } from './devicesStore';
import { useBaseList } from '@framework/lists/hooks/useBaseList';
import type { Device } from './deviceConfig';
import { Permission } from '../../types/auth';
import {
  deviceColumns,
  deviceFilters,
  deviceStats,
  createDeviceBulkActions,
  deviceExportConfig,
} from './deviceConfig';
import { showConfirmation } from '@framework/shared/utils/confirmationHelper';
import './DeviceList.css';
import '../../components/common/ListStats.css';
import '../../components/common/TableCellStyles.css';

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





  // Custom delete handler for devices
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

  // Mock auth context that allows all permissions (temporary for development)
  const mockAuthContext = {
    checkPermission: () => true,
    user: { id: '1', name: 'Dev User' }
  };

  // Initialize base list hook with device configuration
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



  // Safety check - ensure data is always an array
  const safeData = Array.isArray(baseList.data) ? baseList.data : [];

  // Debug: Check data structure and permissions
  console.log('DeviceList debug:', {
    dataLength: safeData.length,
    firstItem: safeData[0],
    columns: baseList.columns,
    canCreate: baseList.canCreate,
    headerActions: baseList.renderHeaderActions(),
    onDeviceCreate: onDeviceCreate,
  });

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
