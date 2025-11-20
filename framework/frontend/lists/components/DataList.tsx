import type { ReactNode } from 'react';
import { useState } from 'react';
import { DataTable } from './DataTable';
import type { DataTableProps, ColumnDefinition, BulkAction } from '../types/ui';
import './ListFilters.css';
import './DataList.css';

interface DataListProps<T> {
  title?: string;
  filters?: ReactNode;
  headerActions?: ReactNode;
  stats?: ReactNode;
  data: T[];
  columns: ColumnDefinition<T>[];
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  onView?: (item: T) => void;
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  onSelect?: (selected: T[]) => void;
  bulkActions?: BulkAction<T>[];
  pagination?: DataTableProps<T>['pagination'];
  responsive?: boolean;
  striped?: boolean;
  hoverable?: boolean;
}

export function DataList<T extends Record<string, any>>({
  title,
  filters,
  headerActions,
  stats,
  data,
  columns,
  loading,
  error,
  emptyMessage,
  onView,
  onEdit,
  onDelete,
  onSelect,
  bulkActions,
  pagination,
  responsive = true,
  striped = true,
  hoverable = true,
}: DataListProps<T>) {
  const [actionsCollapsed, setActionsCollapsed] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  return (
    <div className="data-list">
      if{filters && (
        <div className="user-list__filters">{/* reuse existing filter styles */}
          {filters}
        </div>
      )}

      <div className="list__main-content">
        <div className="list__content">
          <DataTable
            data={data}
            columns={columns}
            loading={loading}
            error={error}
            emptyMessage={emptyMessage}
            onView={onView}
            onEdit={onEdit}
            onDelete={onDelete}
            onSelect={onSelect}
            bulkActions={bulkActions}
            pagination={pagination}
            headerActions={headerActions}
            responsive={responsive}
            striped={striped}
            hoverable={hoverable}
          />
        </div>

        <div className="list__sidebar">
          {headerActions && (
            <div className="list__sidebar-card">
              <div 
                className="list__sidebar-card__header"
                onClick={() => setActionsCollapsed(!actionsCollapsed)}
              >
                <h3 className="list__sidebar-card__title">Actions</h3>
                <span className="list__sidebar-card__toggle">
                  {actionsCollapsed ? '▼' : '▲'}
                </span>
              </div>
              {!actionsCollapsed && (
                <div className="list__sidebar-card__content">
                  {headerActions}
                </div>
              )}
            </div>
          )}

          {stats && (
            <div className="list__sidebar-card">
              <div 
                className="list__sidebar-card__header"
                onClick={() => setStatsCollapsed(!statsCollapsed)}
              >
                <h3 className="list__sidebar-card__title">Stats</h3>
                <span className="list__sidebar-card__toggle">
                  {statsCollapsed ? '▼' : '▲'}
                </span>
              </div>
              {!statsCollapsed && (
                <div className="list__sidebar-card__content">
                  {stats}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DataList;
