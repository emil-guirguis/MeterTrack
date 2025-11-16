import type { ReactNode } from 'react';
import { DataTable } from './DataTable';
import type { DataTableProps, ColumnDefinition, BulkAction } from '../../types/ui';
import './ListFilters.css';

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
  return (
    <div className="data-list">
      <div className="data-list__header">
        <div className="data-list__header-left">
          {headerActions && (
            <div className="data-list__header-actions">
              {headerActions}
            </div>
          )}
        </div>
        {title && (
          <div className="data-list__title-section">
            <h2 className="data-list__title">{title}</h2>
          </div>
        )}
      </div>

      {filters && (
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
          {stats}
        </div>
      </div>
    </div>
  );
}

export default DataList;
