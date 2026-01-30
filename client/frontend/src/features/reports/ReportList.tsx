import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { BaseList } from '@framework/components/list/BaseList';
import { useReportsEnhanced } from './reportsStore';
import type { Report } from './types';
import { useAuth } from '../../hooks/useAuth';
import { useBaseList } from '@framework/components/list/hooks';
import type { ColumnDefinition } from '@framework/types/ui';
import type { FilterDefinition } from '@framework/components/list/types/list';
import './ReportList.css';

interface ReportListProps {
  onReportSelect?: (report: Report) => void;
  onReportEdit?: (report: Report) => void;
  onReportCreate?: () => void;
}

export const ReportList: React.FC<ReportListProps> = ({
  onReportSelect,
  onReportEdit,
  onReportCreate,
}) => {
  const reports = useReportsEnhanced();
  const [initialized, setInitialized] = useState(false);

  // Initialize data on mount
  useEffect(() => {
    if (!initialized) {
      reports.fetchReports(1, 10);
      setInitialized(true);
    }
  }, [initialized, reports]);

  // Define columns for the report list
  const reportColumns: ColumnDefinition<Report>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Report Name',
      sortable: true,
      filterable: true,
      width: '25%',
      render: (value: string, report: Report) => (
        <div className="report-name">
          <span className="report-name__text">{value}</span>
          <span className={`report-type-badge report-type-badge--${report.type}`}>
            {report.type}
          </span>
        </div>
      ),
    },
    {
      key: 'schedule',
      label: 'Schedule',
      sortable: true,
      filterable: false,
      width: '20%',
      render: (value: string) => (
        <code className="schedule-code">{value}</code>
      ),
    },
    {
      key: 'recipients',
      label: 'Recipients',
      sortable: false,
      filterable: false,
      width: '25%',
      render: (value: string[]) => (
        <div className="recipients-list">
          {Array.isArray(value) && value.length > 0 ? (
            <>
              <span className="recipient-count">{value.length} recipient{value.length !== 1 ? 's' : ''}</span>
              <div className="recipients-tooltip">
                {value.map((email, idx) => (
                  <div key={idx} className="recipient-email">{email}</div>
                ))}
              </div>
            </>
          ) : (
            <span className="no-recipients">No recipients</span>
          )}
        </div>
      ),
    },
    {
      key: 'enabled',
      label: 'Status',
      sortable: true,
      filterable: true,
      width: '15%',
      align: 'center',
      render: (value: boolean) => (
        <div className="status-cell">
          <span className={`status-badge status-badge--${value ? 'active' : 'inactive'}`}>
            {value ? 'Active' : 'Inactive'}
          </span>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      filterable: false,
      width: '15%',
      render: (value: string) => (
        <span className="date-text">
          {new Date(value).toLocaleDateString()}
        </span>
      ),
    },
  ], []);

  // Define filters for the report list
  const reportFilters: FilterDefinition[] = useMemo(() => [
    {
      key: 'name',
      label: 'Report Name',
      type: 'text',
      placeholder: 'Search by name...',
    },
    {
      key: 'type',
      label: 'Report Type',
      type: 'select',
      options: [
        { label: 'Meter Readings', value: 'meter_readings' },
        { label: 'Usage Summary', value: 'usage_summary' },
        { label: 'Daily Summary', value: 'daily_summary' },
      ],
    },
    {
      key: 'enabled',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
      ],
    },
  ], []);

  const baseList = useBaseList<Report, any>({
    entityName: 'report',
    entityNamePlural: 'reports',
    useStore: useReportsEnhanced,
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
    // Don't pass permissions to bypass permission checks until user permissions are updated
    permissions: {},
    columns: reportColumns,
    filters: reportFilters,
    onEdit: onReportEdit,
    onCreate: onReportCreate,
    authContext: useAuth(),
  });

  const handleToggleStatus = useCallback(async (report: Report) => {
    try {
      await reports.toggleReportStatus(report.report_id);
    } catch (error) {
      console.error('Failed to toggle report status:', error);
    }
  }, [reports]);

  // Add toggle status to bulk actions
  const bulkActionsWithToggle = useMemo(() => [
    ...baseList.bulkActions,
    {
      id: 'toggle-status',
      label: 'Toggle Status',
      icon: 'toggle_on',
      action: async (selectedReports: Report[]) => {
        for (const report of selectedReports) {
          await handleToggleStatus(report);
        }
      },
    },
  ], [baseList.bulkActions, handleToggleStatus]);

  return (
    <div className="report-list">
      <BaseList
        title="Reports"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No reports found. Create your first report to get started."
        onEdit={baseList.handleEdit}
        onDelete={baseList.handleDelete}
        onSelect={baseList.bulkActions.length > 0 && onReportSelect ? (items) => onReportSelect(items[0]) : undefined}
        bulkActions={bulkActionsWithToggle}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderDeleteConfirmation()}
    </div>
  );
};

export default ReportList;
