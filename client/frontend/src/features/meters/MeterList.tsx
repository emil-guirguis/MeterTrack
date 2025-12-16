import React, { useState, useCallback, useMemo } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useMetersEnhanced } from './metersStore';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/components/list/hooks';
import { useSchema } from '@framework/components/form/utils/schemaLoader';
import type { Meter } from './meterConfig';
import { Permission } from '../../types/auth';
import type { ColumnDefinition } from '@framework/components/list/types';
import { meterColumns, meterFilters, createMeterBulkActions, meterExportConfig } from './meterConfig';
import './MeterList.css';
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
  const { schema } = useSchema('meter');
  const [testingConnection, setTestingConnection] = useState<string | null>(null);
  const canRead = checkPermission(Permission.METER_READ);

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
      if (!result.success || !result.data.connected) {
        alert(`Connection failed: ${result.data?.error || result.message}`);
      }
    } catch (error) {
      console.error('Connection test error:', error);
    } finally {
      setTestingConnection(null);
    }
  }, [canRead]);

  const customColumns: ColumnDefinition<Meter>[] = useMemo(() => {
    let filteredColumns = meterColumns;
    if (schema?.formFields) {
      filteredColumns = meterColumns.filter(col => {
        const fieldConfig = schema.formFields[col.key as string] as any;
        return !fieldConfig?.showon || fieldConfig.showon.includes('list');
      });
    }
    return filteredColumns.map(col => {
      if (col.key === 'configuration') {
        return {
          ...col,
          render: (value: { ipAddress?: string; port?: number; slaveId?: number }, meter) => (
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
  }, [canRead, testingConnection, handleTestConnection, schema]);

  const auth = useAuth();
  const bulkUpdateStatusWrapper = async (ids: string[], status: string) => {
    await meters.bulkUpdateStatus(ids, status as Meter['status']);
  };

  const baseList = useBaseList<Meter, any>({
    entityName: 'meter',
    entityNamePlural: 'meters',
    useStore: useMetersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: false,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: false,
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
    authContext: auth,
  });

  return (
    <div className="meter-list">
      <BaseList
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