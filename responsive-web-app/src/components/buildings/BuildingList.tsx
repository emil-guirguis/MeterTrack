import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '../common/DataTable';
import { FormModal } from '../common/FormModal';
import { useBuildingsEnhanced } from '../../store/entities/buildingsStore';
import { useAuth } from '../../hooks/useAuth';
import type { Building } from '../../types/entities';
import { Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
import './BuildingList.css';
import '../common/ListStats.css';
import '../common/TableCellStyles.css';

interface BuildingListProps {
  onBuildingSelect?: (building: Building) => void;
  onBuildingEdit?: (building: Building) => void;
  onBuildingCreate?: () => void;
}

export const BuildingList: React.FC<BuildingListProps> = ({
  onBuildingSelect,
  onBuildingEdit,
  onBuildingCreate,
}) => {
  const { checkPermission } = useAuth();
  const buildings = useBuildingsEnhanced();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.BUILDING_CREATE);
  const canUpdate = checkPermission(Permission.BUILDING_UPDATE);
  const canDelete = checkPermission(Permission.BUILDING_DELETE);

  // Load buildings on component mount
  useEffect(() => {
    buildings.fetchItems();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const filters: Record<string, any> = {};
    
    if (typeFilter) filters.type = typeFilter;
    if (statusFilter) filters.status = statusFilter;
    if (cityFilter) filters.city = cityFilter;
    
    buildings.setFilters(filters);
    buildings.setSearch(searchQuery);
    buildings.fetchItems();
  }, [searchQuery, typeFilter, statusFilter, cityFilter]);

  // Define table columns
  const columns: ColumnDefinition<Building>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Building Name',
      sortable: true,
      render: (value, building) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">{value}</div>
          <div className="table-cell__secondary">
            {building.address.street}, {building.address.city}, {building.address.state}
          </div>
        </div>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      render: (value) => {
        const getTypeVariant = (type: string) => {
          switch (type) {
            case 'office': return 'info';
            case 'warehouse': return 'warning';
            case 'retail': return 'success';
            case 'residential': return 'primary';
            case 'industrial': return 'secondary';
            default: return 'neutral';
          }
        };
        return (
          <span className={`badge badge--${getTypeVariant(value)}`}>
            {value.charAt(0).toUpperCase() + value.slice(1)}
          </span>
        );
      },
      responsive: 'hide-mobile',
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`status-indicator status-indicator--${value}`}>
          <span className={`status-dot status-dot--${value}`}></span>
          {value === 'active' ? 'Active' : 
           value === 'inactive' ? 'Inactive' : 
           'Maintenance'}
        </span>
      ),
    },
    {
      key: 'address.city',
      label: 'Location',
      sortable: true,
      render: (_, building) => (
        <div className="building-list__location">
          <div>{building.address.city}, {building.address.state}</div>
          <div className="building-list__zip">{building.address.zipCode}</div>
        </div>
      ),
      responsive: 'hide-mobile',
    },
    {
      key: 'equipmentCount',
      label: 'Equipment',
      sortable: true,
      render: (value) => (
        <span className="building-list__count">
          {value} {value === 1 ? 'item' : 'items'}
        </span>
      ),
      responsive: 'hide-tablet',
    },
    {
      key: 'meterCount',
      label: 'Meters',
      sortable: true,
      render: (value) => (
        <span className="building-list__count">
          {value} {value === 1 ? 'meter' : 'meters'}
        </span>
      ),
      responsive: 'hide-tablet',
    },
    {
      key: 'squareFootage',
      label: 'Size',
      sortable: true,
      render: (value) => value ? `${value.toLocaleString()} sq ft` : 'N/A',
      responsive: 'hide-mobile',
    },
  ], []);

  // Define bulk actions
  const bulkActions: BulkAction<Building>[] = useMemo(() => {
    const actions: BulkAction<Building>[] = [];

    if (canUpdate) {
      actions.push(
        {
          key: 'activate',
          label: 'Activate',
          icon: '✅',
          color: 'success',
          action: async (selectedBuildings) => {
            const buildingIds = selectedBuildings.map(b => b.id);
            await buildings.bulkUpdateStatus(buildingIds, 'active');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to activate the selected buildings?',
        },
        {
          key: 'deactivate',
          label: 'Deactivate',
          icon: '❌',
          color: 'warning',
          action: async (selectedBuildings) => {
            const buildingIds = selectedBuildings.map(b => b.id);
            await buildings.bulkUpdateStatus(buildingIds, 'inactive');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to deactivate the selected buildings?',
        },
        {
          key: 'maintenance',
          label: 'Set Maintenance',
          icon: '🔧',
          color: 'warning',
          action: async (selectedBuildings) => {
            const buildingIds = selectedBuildings.map(b => b.id);
            await buildings.bulkUpdateStatus(buildingIds, 'maintenance');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to set the selected buildings to maintenance mode?',
        }
      );
    }

    actions.push({
      key: 'export',
      label: 'Export CSV',
      icon: '📄',
      color: 'primary',
      action: async (selectedBuildings) => {
        exportBuildingsToCSV(selectedBuildings);
      },
    });

    return actions;
  }, [canUpdate, buildings]);

  // Handle building actions
  const handleBuildingView = useCallback((building: Building) => {
    onBuildingSelect?.(building);
  }, [onBuildingSelect]);

  const handleBuildingEdit = useCallback((building: Building) => {
    if (!canUpdate) return;
    onBuildingEdit?.(building);
  }, [canUpdate, onBuildingEdit]);

  const handleBuildingDelete = useCallback(async (building: Building) => {
    if (!canDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete building "${building.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      await buildings.deleteBuilding(building.id);
    }
  }, [canDelete, buildings]);

  // Export functionality
  const exportBuildingsToCSV = useCallback((buildingsToExport: Building[]) => {
    const headers = [
      'Name', 'Type', 'Status', 'Street', 'City', 'State', 'Zip Code', 
      'Square Footage', 'Equipment Count', 'Meter Count', 'Year Built', 'Created'
    ];
    const csvContent = [
      headers.join(','),
      ...buildingsToExport.map(building => [
        `"${building.name}"`,
        building.type,
        building.status,
        `"${building.address.street}"`,
        `"${building.address.city}"`,
        building.address.state,
        building.address.zipCode,
        building.squareFootage || 0,
        building.equipmentCount,
        building.meterCount,
        building.yearBuilt || '',
        new Date(building.createdAt).toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `buildings_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllBuildings = useCallback(() => {
    exportBuildingsToCSV(buildings.items);
    setShowExportModal(false);
  }, [buildings.items, exportBuildingsToCSV]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = buildings.items.map(b => b.address.city);
    return [...new Set(cities)].sort();
  }, [buildings.items]);

  return (
    <div className="building-list">
      {/* Header */}
      <div className="building-list__header">
        <div className="building-list__title-section">
          <h2 className="building-list__title">Buildings</h2>
          <p className="building-list__subtitle">
            Manage building properties and their associated equipment
          </p>
        </div>
        
        <div className="building-list__actions">
          <button
            type="button"
            className="building-list__btn building-list__btn--secondary"
            onClick={() => setShowExportModal(true)}
          >
            📄 Export CSV
          </button>
          
          {canCreate && (
            <button
              type="button"
              className="building-list__btn building-list__btn--primary"
              onClick={onBuildingCreate}
            >
              ➕ Add Building
            </button>
          )}
        </div>
      </div>

      {/* Main Content with Stats Sidebar */}
      <div className="list__main-content">
        <div className="list__content">
          {/* Filters */}
          <div className="building-list__filters">
            <div className="building-list__search">
              <input
                type="text"
                placeholder="Search buildings by name, address, or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="building-list__search-input"
              />
            </div>
            
            <div className="building-list__filter-group">
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="building-list__filter-select"
                aria-label="Filter by type"
              >
                <option value="">All Types</option>
                <option value="office">Office</option>
                <option value="warehouse">Warehouse</option>
                <option value="retail">Retail</option>
                <option value="residential">Residential</option>
                <option value="industrial">Industrial</option>
              </select>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="building-list__filter-select"
                aria-label="Filter by status"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="maintenance">Maintenance</option>
              </select>
              
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="building-list__filter-select"
                aria-label="Filter by city"
              >
                <option value="">All Cities</option>
                {uniqueCities.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
              
              {(typeFilter || statusFilter || cityFilter || searchQuery) && (
                <button
                  type="button"
                  className="building-list__clear-filters"
                  onClick={() => {
                    setTypeFilter('');
                    setStatusFilter('');
                    setCityFilter('');
                    setSearchQuery('');
                  }}
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Data Table */}
      <DataTable
        data={buildings.items}
        columns={columns}
        loading={buildings.list.loading}
        error={buildings.list.error || undefined}
        emptyMessage="No buildings found. Create your first building to get started."
        onView={handleBuildingView}
        onEdit={canUpdate ? handleBuildingEdit : undefined}
        onDelete={canDelete ? handleBuildingDelete : undefined}
        onSelect={bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={bulkActions}
        pagination={{
          currentPage: buildings.list.page,
          pageSize: buildings.list.pageSize,
          total: buildings.list.total,
          onPageChange: (page) => {
            buildings.setPage(page);
            buildings.fetchItems();
          },
          onPageSizeChange: (size) => {
            buildings.setPageSize(size);
            buildings.fetchItems();
          },
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />
        </div>

        {/* Stats Sidebar */}
        <div className="list__sidebar">
          <div className="list__stats">
            <div className="list__stat">
              <span className="list__stat-value">{buildings.activeBuildings.length}</span>
              <span className="list__stat-label">Active Buildings</span>
            </div>
            <div className="list__stat">
              <span className="list__stat-value">{buildings.officeBuildings.length}</span>
              <span className="list__stat-label">Office Buildings</span>
            </div>
            <div className="list__stat">
              <span className="list__stat-value">{buildings.warehouseBuildings.length}</span>
              <span className="list__stat-label">Warehouses</span>
            </div>
            <div className="list__stat">
              <span className="list__stat-value">{buildings.totalSquareFootage.toLocaleString()}</span>
              <span className="list__stat-label">Total Sq Ft</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <FormModal
        isOpen={showExportModal}
        title="Export Buildings"
        onClose={() => setShowExportModal(false)}
        onSubmit={exportAllBuildings}
      >
        <div className="building-list__export-content">
          <p>Export all buildings to CSV format?</p>
          <p className="building-list__export-info">
            This will include: Name, Type, Status, Address, Square Footage, Equipment Count, Meter Count, and Created Date
          </p>
          <p className="building-list__export-count">
            <strong>{buildings.items.length} buildings</strong> will be exported.
          </p>
        </div>
      </FormModal>
    </div>
  );
};