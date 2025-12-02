import React from 'react';
import { DataList } from '@framework/lists/components';
import { useMeterReadingsEnhanced } from './meterReadingsStore';
import { useBaseList } from '@framework/lists/hooks';
import { useAuth } from '../../hooks/useAuth';
import type { MeterReading } from './meterReadingConfig';
import { Permission } from '../../types/auth';
import {
  meterReadingColumns,
  meterReadingFilters,
  meterReadingStats,
  meterReadingExportConfig,
} from './meterReadingConfig';
import './MeterReadingList.css';
import '../../components/common/ListStats.css';
import '../../components/common/TableCellStyles.css';

interface MeterReadingListProps {
  onMeterReadingSelect?: (reading: MeterReading) => void;
}

export const MeterReadingList: React.FC<MeterReadingListProps> = ({
  onMeterReadingSelect,
}) => {
  const meterReadings = useMeterReadingsEnhanced();
  const auth = useAuth();
  
  // Initialize base list hook with meter reading configuration
  // Note: Read-only - no create/edit/delete operations
  const baseList = useBaseList<MeterReading, any>({
    entityName: 'meter reading',
    entityNamePlural: 'meter readings',
    useStore: useMeterReadingsEnhanced,
    features: {
      allowCreate: false,      // Read-only
      allowEdit: false,        // Read-only
      allowDelete: false,      // Read-only
      allowBulkActions: false, // Read-only
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.METER_READ,
      update: Permission.METER_READ,
      delete: Permission.METER_READ,
    },
    columns: meterReadingColumns,
    filters: meterReadingFilters,
    stats: meterReadingStats,
    bulkActions: [],
    export: meterReadingExportConfig,
    authContext: auth,
  });

  return (
    <div className="meter-reading-list">
      <DataList
        title="Meter Readings"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No meter readings found."
        onSelect={onMeterReadingSelect}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
    </div>
  );
};
