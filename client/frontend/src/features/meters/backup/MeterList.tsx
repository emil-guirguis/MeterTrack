import React from 'react';
import { DataList } from '@framework/lists/components';
import { useMetersEnhanced } from './metersStore';
import { useBaseList } from '@framework/lists/hooks';
import { useAuth } from '../../hooks/useAuth';
import { Permission } from '../../types/auth';
import type { Meter } from './meterConfig';
import {
  meterColumns,
  meterFilters,
  createMeterBulkActions,
  meterExportConfig,
} from './meterConfig';
import { showConfirmation } from '@framework/shared/utils/confirmationHelper';
import './MeterList.css';

interface MeterListProps {
  onMeterEdit?: (meter: Meter) => void;
  onMeterCreate?: () => void;
}

export const MeterList: React.FC<MeterListProps> = ({
  onMeterEdit,
  onMeterCreate,
}) => {
  const meters = useMetersEnhanced();
  const auth = useAuth();
  
  // Custom delete handler for meters
  const handleMeterDelete = (meter: Meter) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Meter',
      message: `Delete meter "${meter.meterId}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await meters.deleteItem(meter.id);
        await meters.fetchItems();
      }
    });
  };
  
  const baseList = useBaseList<Meter, ReturnType<typeof useMetersEnhanced>>({
    entityName: 'meter',
    entityNamePlural: 'meters',
    useStore: useMetersEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
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
      delete: Permission.METER_DELETE,
    },
    columns: meterColumns,
    filters: meterFilters,
    bulkActions: createMeterBulkActions(
      { bulkUpdateStatus: meters.bulkUpdateStatus },
      (items) => baseList.handleExport(items)
    ),
    export: meterExportConfig,
    onEdit: onMeterEdit,
    onCreate: onMeterCreate,
    authContext: auth,
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
        onDelete={handleMeterDelete}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};
