import type { ReactNode } from 'react';
import { DataTable } from '../datatable/DataTable';
import { Sidebar } from '@framework/components/sidebar';
import type { DataTableProps, ColumnDefinition, BulkAction } from './types/ui';
import type { SidebarSectionProps } from '@framework/components/sidebar';
import './BaseList.css';

export interface BaseListProps<T> {
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
  className?: string;
}

/**
 * Base List Component
 * 
 * Provides a consistent list layout with:
 * - Filters section
 * - Main content area with data table
 * - Right sidebar with collapsible action pane and stats
 * - Responsive design
 * 
 * All module lists should inherit from this component.
 * 
 * @example
 * ```tsx
 * <BaseList
 *   title="Meters"
 *   data={meters}
 *   columns={meterColumns}
 *   filters={<FilterComponent />}
 *   headerActions={<ActionsComponent />}
 *   stats={<StatsComponent />}
 *   onEdit={handleEdit}
 * />
 * ```
 */
export function BaseList<T extends Record<string, any>>({
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
  className = '',
}: BaseListProps<T>) {
  // Build sidebar sections
  const sidebarSections: SidebarSectionProps[] = [];

  if (headerActions) {
    sidebarSections.push({
      title: 'Actions',
      content: headerActions,
      collapsible: true,
      defaultCollapsed: false,
    });
  }

  if (stats) {
    sidebarSections.push({
      title: 'Stats',
      content: stats,
      collapsible: true,
      defaultCollapsed: false,
    });
  }

  return (
    <div className={`data-list ${className}`}>
      {filters && (
        <div className="base-list__filters">{/* reuse existing filter styles */}
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

        {sidebarSections.length > 0 && (
          <Sidebar sections={sidebarSections} />
        )}
      </div>
    </div>
  );
}

export default BaseList;
