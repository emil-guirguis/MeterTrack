import React, { useMemo } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useDevicesEnhanced } from './devicesStore';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import { generateColumnsFromSchema, generateFiltersFromSchema } from '@framework/components/list/utils/schemaColumnGenerator';
import type { Device } from './deviceConfig';
import { Permission } from '../../types/auth';
import { deviceStats, deviceExportConfig, createDeviceBulkActions } from './deviceConfig';
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
  onDeviceCreate,
}) => {
  const auth = useAuth();
  const devices = useDevicesEnhanced();
  const { schema } = useSchema('device');

  // Dynamically generate columns from schema based on showOn: ['list']
  const columns = useMemo(() => {
    if (!schema) return [];
    return generateColumnsFromSchema<Device>(schema.formFields, {
      fieldOrder: ['manufacturer', 'modelNumber', 'description', 'type' ],
      responsive: 'hide-mobile',
    });
  }, [schema]);

  // Dynamically generate filters from schema based on showOn: ['list'] and enumValues
  const filters = useMemo(() => {
    if (!schema) return [];
    return generateFiltersFromSchema(schema.formFields, {
      fieldOrder: ['type', 'manufacturer'],
    });
  }, [schema]);

  const handleDeviceDelete = (device: Device) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Device',
      message: `Delete device "${device.description}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await devices.deleteItem(device.id);
        await devices.fetchItems();
      },
    });
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
      create: false,//Permission.DEVICE_CREATE,
      update: false,//Permission.DEVICE_UPDATE,
      delete: false,//Permission.DEVICE_DELETE,
    },
    columns,
    filters,
    stats: deviceStats,
    bulkActions: createDeviceBulkActions({ bulkDelete: async (ids: string[]) => {
      await Promise.all(ids.map(id => devices.deleteItem(id)));
    }}),
    export: deviceExportConfig,
    authContext: auth,
    onEdit: onDeviceEdit,
    onCreate: onDeviceCreate,
  });

  const safeData = Array.isArray(baseList.data) ? baseList.data : [];

  return (
    <div className="device-list">
      <BaseList
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
        onSelect={baseList.bulkActions.length > 0 && onDeviceSelect ? (items: Device[]) => onDeviceSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
