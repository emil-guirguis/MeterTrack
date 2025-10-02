import { useState, useMemo, useCallback } from 'react';
import type { DataTableProps, ColumnDefinition, BulkAction } from '../../types/ui';
import { useResponsive } from '../../hooks/useResponsive';
import './DataTable.css';

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  loading = false,
  error,
  emptyMessage = 'No data available',
  onEdit,
  onDelete,
  onView,
  onSelect,
  pagination,
  bulkActions = [],
  responsive = true,
  striped = true,
  hoverable = true,
}: DataTableProps<T>) {
  const { isMobile } = useResponsive();
  const [selectedItems, setSelectedItems] = useState<T[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);

  // Handle sorting
  const handleSort = useCallback((key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  }, [sortConfig]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Handle selection
  const handleSelectAll = useCallback((checked: boolean) => {
    const newSelection = checked ? [...sortedData] : [];
    setSelectedItems(newSelection);
    onSelect?.(newSelection);
  }, [sortedData, onSelect]);

  const handleSelectItem = useCallback((item: T, checked: boolean) => {
    const newSelection = checked
      ? [...selectedItems, item]
      : selectedItems.filter(selected => selected.id !== item.id);
    
    setSelectedItems(newSelection);
    onSelect?.(newSelection);
  }, [selectedItems, onSelect]);

  // Handle bulk actions
  const handleBulkAction = useCallback(async (action: BulkAction<T>) => {
    if (selectedItems.length === 0) return;
    
    if (action.confirm) {
      const confirmed = window.confirm(
        action.confirmMessage || `Are you sure you want to ${action.label.toLowerCase()} ${selectedItems.length} item(s)?`
      );
      if (!confirmed) return;
    }
    
    try {
      await action.action(selectedItems);
      setSelectedItems([]);
      onSelect?.([]);
    } catch (error) {
      console.error('Bulk action failed:', error);
    }
  }, [selectedItems, onSelect]);

  // Get visible columns based on responsive settings
  const visibleColumns = useMemo(() => {
    if (!responsive) return columns;
    
    return columns.filter(column => {
      if (!column.responsive) return true;
      if (column.responsive === 'always-show') return true;
      if (column.responsive === 'hide-mobile' && isMobile) return false;
      if (column.responsive === 'hide-tablet' && (isMobile || !isMobile)) return false;
      return true;
    });
  }, [columns, responsive, isMobile]);

  // Render cell content
  const renderCell = useCallback((column: ColumnDefinition<T>, item: T, index: number) => {
    const value = typeof column.key === 'string' && column.key.includes('.') 
      ? column.key.split('.').reduce((obj, key) => obj?.[key], item)
      : item[column.key as keyof T];
    
    if (column.render) {
      return column.render(value, item, index);
    }
    
    return value != null ? String(value) : '';
  }, []);

  // Render action buttons
  const renderActions = useCallback((item: T) => {
    const hasActions = onView || onEdit || onDelete;
    if (!hasActions) return null;

    return (
      <div className="data-table__actions">
        {onView && (
          <button
            className="data-table__action-btn data-table__action-btn--view"
            onClick={(e) => {
              e.stopPropagation();
              onView(item);
            }}
            title="View"
          >
            👁️
          </button>
        )}
        {onEdit && (
          <button
            className="data-table__action-btn data-table__action-btn--edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(item);
            }}
            title="Edit"
          >
            ✏️
          </button>
        )}
        {onDelete && (
          <button
            className="data-table__action-btn data-table__action-btn--delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(item);
            }}
            title="Delete"
          >
            🗑️
          </button>
        )}
      </div>
    );
  }, [onView, onEdit, onDelete]);

  // Loading state
  if (loading) {
    return (
      <div className="data-table__loading">
        <div className="data-table__spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="data-table__error">
        <p>Error: {error}</p>
      </div>
    );
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className="data-table__empty">
        <p>{emptyMessage}</p>
      </div>
    );
  }

  // Mobile card view
  if (responsive && isMobile) {
    return (
      <div className="data-table data-table--mobile">
        {/* Bulk actions for mobile */}
        {bulkActions.length > 0 && selectedItems.length > 0 && (
          <div className="data-table__bulk-actions">
            <span className="data-table__selected-count">
              {selectedItems.length} selected
            </span>
            {bulkActions.map(action => (
              <button
                key={action.key}
                className={`data-table__bulk-btn data-table__bulk-btn--${action.color || 'primary'}`}
                onClick={() => handleBulkAction(action)}
              >
                {action.icon && <span className="data-table__bulk-icon">{action.icon}</span>}
                {action.label}
              </button>
            ))}
          </div>
        )}

        <div className="data-table__cards">
          {sortedData.map((item, index) => (
            <div key={item.id || index} className="data-table__card">
              {onSelect && (
                <div className="data-table__card-select">
                  <input
                    type="checkbox"
                    checked={selectedItems.some(selected => selected.id === item.id)}
                    onChange={(e) => handleSelectItem(item, e.target.checked)}
                    aria-label={`Select item ${item.id || index}`}
                  />
                </div>
              )}
              
              <div className="data-table__card-content">
                {visibleColumns.map(column => (
                  <div key={column.key.toString()} className="data-table__card-field">
                    <span className="data-table__card-label">{column.label}:</span>
                    <span className="data-table__card-value">
                      {renderCell(column, item, index)}
                    </span>
                  </div>
                ))}
              </div>
              
              {renderActions(item) && (
                <div className="data-table__card-actions">
                  {renderActions(item)}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Pagination for mobile */}
        {pagination && (
          <div className="data-table__pagination data-table__pagination--mobile">
            <button
              className="data-table__page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </button>
            <span className="data-table__page-info">
              Page {pagination.currentPage} of {Math.ceil(pagination.total / pagination.pageSize)}
            </span>
            <button
              className="data-table__page-btn"
              disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className="data-table">
      {/* Bulk actions */}
      {bulkActions.length > 0 && selectedItems.length > 0 && (
        <div className="data-table__bulk-actions">
          <span className="data-table__selected-count">
            {selectedItems.length} selected
          </span>
          {bulkActions.map(action => (
            <button
              key={action.key}
              className={`data-table__bulk-btn data-table__bulk-btn--${action.color || 'primary'}`}
              onClick={() => handleBulkAction(action)}
            >
              {action.icon && <span className="data-table__bulk-icon">{action.icon}</span>}
              {action.label}
            </button>
          ))}
        </div>
      )}

      <div className="data-table__wrapper">
        <table 
          className={`
            data-table__table
            ${striped ? 'data-table__table--striped' : ''}
            ${hoverable ? 'data-table__table--hoverable' : ''}
          `.trim()}
        >
          <thead className="data-table__head">
            <tr className="data-table__row">
              {onSelect && (
                <th className="data-table__header data-table__header--select">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === sortedData.length && sortedData.length > 0}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all items"
                  />
                </th>
              )}
              
              {visibleColumns.map(column => (
                <th
                  key={column.key.toString()}
                  className={`
                    data-table__header
                    ${column.sortable ? 'data-table__header--sortable' : ''}
                    ${column.className || ''}
                  `.trim()}
                  style={{
                    width: column.width,
                    minWidth: column.minWidth,
                    textAlign: column.align || 'left'
                  }}
                  onClick={column.sortable ? () => handleSort(column.key.toString()) : undefined}
                >
                  <span className="data-table__header-content">
                    {column.label}
                    {column.sortable && sortConfig?.key === column.key && (
                      <span className="data-table__sort-indicator">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              
              {(onView || onEdit || onDelete) && (
                <th className="data-table__header data-table__header--actions">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          
          <tbody className="data-table__body">
            {sortedData.map((item, index) => (
              <tr 
                key={item.id || index} 
                className={`data-table__row ${onView ? 'data-table__row--clickable' : ''}`}
                onClick={onView ? () => onView(item) : undefined}
                style={onView ? { cursor: 'pointer' } : undefined}
              >
                {onSelect && (
                  <td className="data-table__cell data-table__cell--select">
                    <input
                      type="checkbox"
                      checked={selectedItems.some(selected => selected.id === item.id)}
                      onChange={(e) => handleSelectItem(item, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Select item ${item.id || index}`}
                    />
                  </td>
                )}
                
                {visibleColumns.map(column => (
                  <td
                    key={column.key.toString()}
                    className={`data-table__cell ${column.className || ''}`}
                    style={{ textAlign: column.align || 'left' }}
                  >
                    {renderCell(column, item, index)}
                  </td>
                ))}
                
                {(onView || onEdit || onDelete) && (
                  <td className="data-table__cell data-table__cell--actions">
                    {renderActions(item)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="data-table__pagination">
          <div className="data-table__pagination-info">
            Showing {((pagination.currentPage - 1) * pagination.pageSize) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.total)} of{' '}
            {pagination.total} entries
          </div>
          
          <div className="data-table__pagination-controls">
            <button
              className="data-table__page-btn"
              disabled={pagination.currentPage === 1}
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
            >
              Previous
            </button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, Math.ceil(pagination.total / pagination.pageSize)) }, (_, i) => {
              const pageNum = pagination.currentPage - 2 + i;
              if (pageNum < 1 || pageNum > Math.ceil(pagination.total / pagination.pageSize)) return null;
              
              return (
                <button
                  key={pageNum}
                  className={`data-table__page-btn ${pageNum === pagination.currentPage ? 'data-table__page-btn--active' : ''}`}
                  onClick={() => pagination.onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              className="data-table__page-btn"
              disabled={pagination.currentPage >= Math.ceil(pagination.total / pagination.pageSize)}
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
            >
              Next
            </button>
          </div>
          
          {pagination.showSizeChanger && (
            <div className="data-table__page-size">
              <select
                value={pagination.pageSize}
                onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
                className="data-table__page-size-select"
                aria-label="Items per page"
              >
                {(pagination.pageSizeOptions || [10, 25, 50, 100]).map(size => (
                  <option key={size} value={size}>
                    {size} per page
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}