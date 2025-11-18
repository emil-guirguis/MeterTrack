import React from 'react';
import { DataList } from '@framework/lists/components/DataList';
import { useDevicesEnhanced } from './devicesStore';
import { useBaseList } from '@framework/lists/hooks/useBaseList';
import type { Device } from '../../types/device';
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
  onDeviceSelect?: (contact: Device) => void;
  onDeviceEdit?: (device: Device) => void;
  onDeviceCreate?: () => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  onContactSelect,
  onDeviceEdit,
  onDeviceCreate
}) => {
  const store = useDevicesEnhanced();
  const [showFormModal, setShowFormModal] = useState(false);
  const [formDevice, setFormDevice] = useState<Device | null>(null);

  // Handle device edit
  const handleDeviceEdit = useCallback((device: Device) => {
    setFormDevice(device);
    setShowFormModal(true);
    onDeviceEdit?.(device);
  }, [onDeviceEdit]);

  // Handle device creation
  const handleDeviceCreate = useCallback(() => {
    setFormDevice(null);
    setShowFormModal(true);
    onDeviceCreate?.();
  }, [onDeviceCreate]);

  // Handle form submit
  const handleFormSubmit = useCallback(async (data: Partial<Device>) => {
    if (formDevice) {
      await store.updateDevice(formDevice.id, data);
    } else {
      await store.createDevice(data);
    }
    setShowFormModal(false);
    setFormDevice(null);
  }, [formDevice, store]);

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setShowFormModal(false);
    setFormDevice(null);
  }, []);

  // Initialize base list hook
  const baseList = useBaseList<Device, ReturnType<typeof useDevicesEnhanced>>({
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
    bulkActions: createDeviceBulkActions(store),
    export: deviceExportConfig,
    onEdit: handleDeviceEdit,
    onCreate: handleDeviceCreate,
  });

  return (
    <div className="device-list">
      <DataList
        title="Devices"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No devices found. Create your first device to get started."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}

      {/* Form Modal */}
      {showFormModal && (
        <FormModal
          isOpen={showFormModal}
          title={formDevice ? 'Edit Device' : 'Create Device'}
          onClose={handleFormCancel}
          onSubmit={() => { }}
          size="md"
        >
          <DeviceForm
            device={formDevice || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </FormModal>
      )}
    </div>
  );
};

export default DeviceList;
