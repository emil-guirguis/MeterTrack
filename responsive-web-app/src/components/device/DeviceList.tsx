import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataList from '../common/DataList';
import { FormModal } from '../common/FormModal';
import { DeviceForm } from './DeviceForm';
import { deviceService } from '../../services/deviceService';
import type { Device } from '../../types/device';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
import './DeviceList.css';

interface DeviceListProps {
  onDeviceEdit?: (device: Device) => void;
  onDeviceCreate?: () => void;
}

export const DeviceList: React.FC<DeviceListProps> = ({
  onDeviceEdit,
  onDeviceCreate
}) => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formDevice, setFormDevice] = useState<Device | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  // Load devices
  const loadDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await deviceService.getAll();
      setDevices(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load devices';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  // Pagination
  const totalItems = devices.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedDevices = devices.slice(startIndex, endIndex);

  const pagination = {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    onPageChange: setCurrentPage,
    onPageSizeChange: (newSize: number) => {
      setPageSize(newSize);
      setCurrentPage(1);
    },
  };

  // Column definitions
  const columns: ColumnDefinition<Device>[] = useMemo(() => [
    {
      key: 'brand',
      label: 'Brand',
      sortable: true,
      render: (_value, device) => device.brand,
    },
    {
      key: 'model_number',
      label: 'Model Number',
      sortable: true,
      render: (_value, device) => device.model_number || '-',
    },
    {
      key: 'description',
      label: 'Description',
      sortable: false,
      render: (_value, device) => device.description || '-',
    },
  ], []);

  // Bulk actions
  const bulkActions: BulkAction<Device>[] = useMemo(() => [
    {
      id: 'delete',
      label: 'Delete',
      icon: 'delete',
      color: 'error',
      confirm: true,
      confirmMessage: 'Are you sure you want to delete the selected devices?',
      action: async (selectedDevices: Device[]) => {
        const confirmed = window.confirm('Are you sure you want to delete the selected devices? This action cannot be undone.');
        if (confirmed) {
          try {
            await Promise.all(selectedDevices.map(device => deviceService.delete(device.id)));
            await loadDevices();
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to delete devices';
            alert(errorMessage);
          }
        }
      },

    },
  ], [loadDevices]);



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

  // Handle device delete
  const handleDeviceDelete = useCallback(async (device: Device) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete device "${device.model_number}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await deviceService.delete(device.id);
        await loadDevices();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete device';
        alert(errorMessage);
      }
    }
  }, [loadDevices]);

  // Handle form submit
  const handleFormSubmit = useCallback(async (data: Partial<Device>) => {
    if (formDevice) {
      await deviceService.update(formDevice.id, data);
    } else {
      await deviceService.create(data as any);
    }
    setShowFormModal(false);
    setFormDevice(null);
    await loadDevices();
  }, [formDevice, loadDevices]);

  // Handle form cancel
  const handleFormCancel = useCallback(() => {
    setShowFormModal(false);
    setFormDevice(null);
  }, []);

  return (
    <div className="device-list">
      <div className="device-list__header">
        <button
          type="button"
          className="device-list__btn device-list__btn--primary"
          onClick={handleDeviceCreate}
          aria-label="Add a new device"
        >
          ➕ Add Device
        </button>
      </div>
      
      <DataList
        data={paginatedDevices as any[]}
        columns={columns as any[]}
        loading={loading}
        error={error || undefined}
        onEdit={handleDeviceEdit as any}
        onDelete={handleDeviceDelete as any}
        bulkActions={bulkActions as any[]}
        pagination={pagination as any}
        emptyMessage="No devices found"
      />

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
