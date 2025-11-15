import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DataList from '../common/DataList';
import { FormModal } from '../common/FormModal';
// import { LocationForm } from './LocationForm';
// import { locationService } from '../../services/locationService';
import { useLocationsEnhanced } from '../../store/entities/locationStore';
import { useAuth } from '../../hooks/useAuth';
import type { Location } from '../../types/entities';
import { Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
import './LocationList.css';

interface LocationListProps {
  onLocationEdit?: (location: Location) => void;
  onLocationCreate?: () => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  onLocationEdit,
  onLocationCreate,
}) => {
  const { checkPermission } = useAuth();
  const locations = useLocationsEnhanced();
  const [error, setError] = useState<string | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formLocation, setFormLocation] = useState<Location | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);


  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [cityFilter, setCityFilter] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.LOCATION_CREATE);
  const canUpdate = checkPermission(Permission.LOCATION_UPDATE);
  const canDelete = checkPermission(Permission.LOCATION_DELETE);

  // Load locations on component mount
  useEffect(() => {
    locations.fetchItems();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const filters: Record<string, any> = {};

    if (typeFilter) filters.type = typeFilter;
    if (statusFilter) filters.status = statusFilter;
    if (cityFilter) filters.city = cityFilter;

    locations.setFilters(filters);
    locations.setSearch(searchQuery);
    locations.fetchItems();
  }, [searchQuery, typeFilter, statusFilter, cityFilter]);

  // Define table columns
  const columns: ColumnDefinition<Location>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Location Name',
      sortable: true,
      render: (value, location) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">{value}</div>
          <div className="table-cell__secondary">
            {location.address.street}, {location.address.city}, {location.address.state}
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
      render: (_, location) => (
        <div className="location-list__location">
          <div>{location.address.city}, {location.address.state}</div>
          <div className="location-list__zip">{location.address.zipCode}</div>
        </div>
      ),
      responsive: 'hide-mobile',
    },
    {
      key: 'meterCount',
      label: 'Meters',
      sortable: true,
      render: (value) => (
        <span className="location-list__count">
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
  const bulkActions: BulkAction<Location>[] = useMemo(() => {
    const actions: BulkAction<Location>[] = [];

    if (canUpdate) {
      actions.push(
        {
          id: 'activate',
          label: 'Activate',
          icon: '✅',
          color: 'success',
          action: async (selectedLocations) => {
            const locationIds = selectedLocations.map(b => b.id);
            await locations.bulkUpdateStatus(locationIds, 'active');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to activate the selected locations?',
        },
        {
          id: 'deactivate',
          label: 'Deactivate',
          icon: '❌',
          color: 'warning',
          action: async (selectedLocations) => {
            const locationIds = selectedLocations.map(b => b.id);
            await locations.bulkUpdateStatus(locationIds, 'inactive');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to deactivate the selected locations?',
        },
        {
          id: 'maintenance',
          label: 'Set Maintenance',
          icon: '🔧',
          color: 'warning',
          action: async (selectedLocations) => {
            const locationIds = selectedLocations.map(b => b.id);
            await locations.bulkUpdateStatus(locationIds, 'maintenance');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to set the selected locations to maintenance mode?',
        }
      );
    }

    actions.push({
      id: 'export',
      label: 'Export CSV',
      icon: '📄',
      color: 'primary',
      action: async (selectedLocations) => {
        exportLocationsToCSV(selectedLocations);
      },
    });

    return actions;
  }, [canUpdate, locations]);

  // Handle location actions
  const handleLocationEdit = useCallback((location: Location) => {
    if (!canUpdate) return;
    onLocationEdit?.(location);
  }, [canUpdate, onLocationEdit]);

  const handleLocationDelete = useCallback(async (location: Location) => {
    if (!canDelete) return;

    const confirmed = window.confirm(
      `Are you sure you want to delete location "${location.name}"? This action cannot be undone.`
    );

    if (confirmed) {
      try {
        await locations.deleteLocation(location.id);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete location';
        alert(errorMessage);
      }
    }
  }, [canDelete, locations]);

  // Export functionality
  const exportLocationsToCSV = useCallback((locationsToExport: Location[]) => {
    const headers = [
      'Name', 'Type', 'Status', 'Street', 'City', 'State', 'Zip Code',
      'Square Footage', 'Meter Count', 'Year Built', 'Created'
    ];
    const csvContent = [
      headers.join(','),
      ...locationsToExport.map(location => [
        `"${location.name}"`,
        location.type,
        location.status,
        `"${location.address.street}"`,
        `"${location.address.city}"`,
        location.address.state,
        location.address.zipCode,
        location.squareFootage || 0,
        location.meterCount,
        location.yearBuilt || '',
        new Date(location.createdAt).toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `locations_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllLocations = useCallback(() => {
    exportLocationsToCSV(locations.items);
    setShowExportModal(false);
  }, [locations.items, exportLocationsToCSV]);

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = locations.items.map(b => b.address.city);
    return [...new Set(cities)].sort();
  }, [locations.items]);

  const filters = (
    <>
      <div className="location-list__search">
        <input
          type="text"
          placeholder="Search locations by name, address, or city..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="location-list__search-input"
        />
      </div>

      <div className="location-list__filter-group">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="location-list__filter-select"
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
          className="location-list__filter-select"
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
          className="location-list__filter-select"
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
            className="location-list__clear-filters"
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
    </>
  );

  const headerActions = (
    <div className="data-table__header-actions-inline">
      <button
        type="button"
        className="location-list__btn location-list__btn--secondary"
        onClick={() => setShowExportModal(true)}
        aria-label="Export locations to CSV"
      >
        📄 Export CSV
      </button>

      {canCreate && (
        <button
          type="button"
          className="location-list__btn location-list__btn--primary"
          onClick={onLocationCreate}
          aria-label="Add a location"
        >
          ➕ Add Location
        </button>
      )}
    </div>
  );

  const stats = (
    <div className="list__stats">
      <div className="list__stat">
        <span className="list__stat-value">{locations.activeLocations.length}</span>
        <span className="list__stat-label">Active Locations</span>
      </div>
      <div className="list__stat">
        <span className="list__stat-value">{locations.officeLocations.length}</span>
        <span className="list__stat-label">Office Locations</span>
      </div>
      <div className="list__stat">
        <span className="list__stat-value">{locations.warehouseLocations.length}</span>
        <span className="list__stat-label">Warehouses</span>
      </div>
      <div className="list__stat">
        <span className="list__stat-value">{locations.totalSquareFootage.toLocaleString()}</span>
        <span className="list__stat-label">Total Sq Ft</span>
      </div>
    </div>
  );

  return (
    <div className="location-list">
      <DataList
        title="Locations"
        filters={filters}
        headerActions={headerActions}
        stats={stats}
        data={locations.items}
        columns={columns}
        loading={locations.list.loading}
        error={locations.list.error || undefined}
        emptyMessage="No locations found. Create your first location to get started."
        onEdit={canUpdate ? handleLocationEdit : undefined}
        onDelete={canDelete ? handleLocationDelete : undefined}
        onSelect={bulkActions.length > 0 ? () => { } : undefined}
        bulkActions={bulkActions}
        pagination={{
          currentPage: locations.list.page,
          pageSize: locations.list.pageSize,
          total: locations.list.total,
          onPageChange: (page) => {
            locations.setPage(page);
            locations.fetchItems();
          },
          onPageSizeChange: (size) => {
            locations.setPageSize(size);
            locations.fetchItems();
          },
          showSizeChanger: true,
          pageSizeOptions: [10, 25, 50, 100],
        }}
      />

      {/* Export Modal */}
      <FormModal
        isOpen={showExportModal}
        title="Export Locations"
        onClose={() => setShowExportModal(false)}
        onSubmit={exportAllLocations}
      >
        <div className="location-list__export-content">
          <p>Export all locations to CSV format?</p>
          <p className="location-list__export-info">
            This will include: Name, Type, Status, Address, Square Footage, Meter Count, and Created Date
          </p>
          <p className="location-list__export-count">
            <strong>{locations.items.length} locations</strong> will be exported.
          </p>
        </div>
      </FormModal>
    </div>
  );
};