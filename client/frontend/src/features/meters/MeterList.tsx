import React, { useState, useCallback, useMemo } from 'react';
import { DataList } from '@framework/lists/components';
import { useMetersEnhanced } from './metersStore';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/lists/hooks';
import type { Meter } from './meterConfig';
import { Permission } from '../../types/auth';
import type { ColumnDefinition } from '@framework/lists/types';
import { meterColumns, meterFilters, createMeterBulkActions, meterExportConfig } from './meterConfig';
import './MeterList.css';
import '../../components/common/ListStats.css';
import '../../components/common/TableCellStyles.css';
import { tokenStorage } from '../../utils/tokenStorage';

interface MeterListProps {
  onMeterSelect?: (meter: Meter) => void;
  onMeterEdit?: (meter: Meter) => void;
  onMeterCreate?: () => void;
}

export const MeterList: React.FC<MeterListProps> = ({
  onMeterSelect,
  onMeterEdit,
  onMeterCreate,
}) => {
  const { checkPermission } = useAuth();
  const meters = useMetersEnhanced();

  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Check permissions
  const canRead = checkPermission(Permission.METER_READ);

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
      } else {
        alert(`Connection failed: ${result.data?.error || result.message}`);
      }
    } catch (error) {
    } finally {
      setTestingConnection(null);
    }
  }, [canRead]);

  // Customize columns to add connection test button
  const customColumns: ColumnDefinition<Meter>[] = useMemo(() => {
    return meterColumns.map(col => {
      if (col.key === 'configuration') {
        return {
          ...col,
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
                      type="button"
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
        };
      }
      return col;
    });
  }, [canRead, testingConnection, handleTestConnection]);

  // Mock auth context that allows all permissions (temporary for development)
  const mockAuthContext = {
    checkPermission: () => true,
    user: { id: '1', name: 'Dev User' }
  };
  
  // Wrap bulkUpdateStatus to match expected signature
  const bulkUpdateStatusWrapper = async (ids: string[], status: string) => {
    await meters.bulkUpdateStatus(ids, status as Meter['status']);
  };

  // Initialize base list hook
  const baseList = useBaseList<Meter, any>({
    entityName: 'meter',
    entityNamePlural: 'meters',
    useStore: useMetersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: false, // Meters typically shouldn't be deleted
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: false, // No stats for meters in current implementation
    },
    permissions: {
      create: Permission.METER_CREATE,
      update: Permission.METER_UPDATE,
      read: Permission.METER_READ,
    },
    columns: customColumns,
    filters: meterFilters,
    bulkActions: createMeterBulkActions(
      { bulkUpdateStatus: bulkUpdateStatusWrapper },
      (items) => baseList.handleExport(items)
    ),
    export: meterExportConfig,
    onEdit: onMeterEdit,
    onCreate: onMeterCreate,
    authContext: mockAuthContext,
  });

  return (
    <div className="meter-list">
      <DataList
        title="Meters"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No meters found. Create your first meter to get started."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        onSelect={baseList.bulkActions.length > 0 && onMeterSelect ? (items) => onMeterSelect(items[0]) : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};

export default MeterList;