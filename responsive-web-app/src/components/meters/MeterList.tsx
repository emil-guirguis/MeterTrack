import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataList from '../common/DataList';
import { useMetersEnhanced } from '../../store/entities/metersStore';
import { useAuth } from '../../hooks/useAuth';
import type { Meter } from '../../types/entities';
import { Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
import './MeterList.css';
import '../common/ListStats.css';
import '../common/TableCellStyles.css';
import { tokenStorage } from '../../utils/tokenStorage';

interface MeterListProps {
  onMeterSelect?: (meter: Meter) => void;
  onMeterEdit?: (meter: Meter) => void;
  onMeterCreate?: () => void;
}

export const MeterList: React.FC<MeterListProps> = ({
  onMeterSelect,
  onMeterEdit,
}) => {
  const { checkPermission } = useAuth();
  const meters = useMetersEnhanced();
  
  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Check permissions
  const canUpdate = checkPermission(Permission.METER_UPDATE);
  const canRead = checkPermission(Permission.METER_READ);

  // Load meters on component mount
  useEffect(() => {
    meters.fetchItems();
  }, []);

  // Test meter connection
  const handleTestConnection = useCallback(async (meter: Meter) => {
    if (!canRead) return;
    
    setTestingConnection(meter.id);
    try {
      const authToken = tokenStorage.getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const response = await fetch(`/api/meters/${meter.id}/test-connection`, {
        method: 'POST',
        headers
      });
      
      const result = await response.json();
      
      if (result.success && result.data.connected) {
        alert('Connection successful!');
      } else {
        alert(`Connection failed: ${result.data?.error || result.message}`);
      }
    } catch (error) {
      alert('Connection test failed');
    } finally {
      setTestingConnection(null);
    }
  }, [canRead]);

  // Define table columns - use the actual meter fields that exist
  const columns: ColumnDefinition<Meter>[] = useMemo(() => [
    {
      key: 'serialNumber',
      label: 'Meter ID',
      sortable: true,
      render: (value, meter) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">
            {meter.brand || 'Unknown'} {meter.model || ''}
          </div>
          <div className="table-cell__secondary">{value}</div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => (
        <span className={`badge badge--${value === 'electric' ? 'primary' : value === 'gas' ? 'warning' : 'info'} badge--uppercase`}>
          {value}
        </span>
      ),
    },
    {
      key: 'configuration',
      label: 'Connection',
      sortable: false,
      render: (value, meter) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">
            {value?.ipAddress || 'Not configured'}:{value?.port || 502}
          </div>
          {value?.ipAddress && (
            <div className="table-cell__secondary">
              Slave ID: {value?.slaveId || 1}
              {canRead && (
                <button
                  className={`btn btn--xs btn--outline-primary table-cell__connection-test ${testingConnection === meter.id ? 'btn--loading' : ''}`}
                  onClick={() => handleTestConnection(meter)}
                  disabled={testingConnection === meter.id}
                >
                  {testingConnection === meter.id ? 'Testing...' : 'Test'}
                </button>
              )}
            </div>
          )}
        </div>
      ),
      responsive: 'hide-mobile',
    },
    {
      key: 'location',
      label: 'Location',
      sortable: true,
      render: (value) => value || 'Not specified',
      responsive: 'hide-mobile',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`status-indicator status-indicator--${value}`}>
          <span className={`status-dot status-dot--${value}`}></span>
          {value === 'active' ? 'Active' : value === 'inactive' ? 'Inactive' : 'Maintenance'}
        </span>
      ),
    },
    {
      key: 'lastReading',
      label: 'Last Reading',
      sortable: true,
      render: (value) => {
        if (!value) return 'No data';
        return (
          <div className="table-cell--two-line">
            <div className="table-cell__primary">{value.value} {value.unit}</div>
            <div className="table-cell__secondary">
              {new Date(value.timestamp).toLocaleDateString()}
            </div>
          </div>
        );
      },
      responsive: 'hide-tablet',
    },
  ], [canRead, testingConnection, handleTestConnection]);

  // Define bulk actions
  const bulkActions: BulkAction<Meter>[] = useMemo(() => {
    const actions: BulkAction<Meter>[] = [];

    if (canUpdate) {
      actions.push(
        {
          key: 'activate',
          label: 'Activate',
          icon: '✅',
          color: 'success',
          action: async (selectedMeters) => {
            const meterIds = selectedMeters.map(m => m.id);
            await meters.bulkUpdateStatus(meterIds, 'active');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to activate the selected meters?',
        },
        {
          key: 'deactivate',
          label: 'Deactivate',
          icon: '❌',
          color: 'warning',
          action: async (selectedMeters) => {
            const meterIds = selectedMeters.map(m => m.id);
            await meters.bulkUpdateStatus(meterIds, 'inactive');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to deactivate the selected meters?',
        },
        {
          key: 'maintenance',
          label: 'Set Maintenance',
          icon: '🔧',
          color: 'warning',
          action: async (selectedMeters) => {
            const meterIds = selectedMeters.map(m => m.id);
            await meters.bulkUpdateStatus(meterIds, 'maintenance');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to set the selected meters to maintenance mode?',
        }
      );
    }

    return actions;
  }, [canUpdate, meters]);

  return (
    <div className="meter-list">
      <DataList
        title="Meters"
        data={meters.items}
        columns={columns}
        loading={meters.loading}
        error={meters.error || undefined}
        onEdit={onMeterEdit}
        onView={onMeterSelect}
        bulkActions={bulkActions}
      />
    </div>
  );
};

export default MeterList;