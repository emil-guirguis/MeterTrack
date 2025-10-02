import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { DataTable } from '../common/DataTable';
import { FormModal } from '../common/FormModal';
import { useEquipmentEnhanced } from '../../store/entities/equipmentStore';
import { useAuth } from '../../hooks/useAuth';
import type { Equipment } from '../../types/entities';
import { Permission } from '../../types/auth';
import type { ColumnDefinition, BulkAction } from '../../types/ui';
import './EquipmentList.css';
import '../common/ListStats.css';
import '../common/TableCellStyles.css';

interface EquipmentListProps {
  onEquipmentSelect?: (equipment: Equipment) => void;
  onEquipmentEdit?: (equipment: Equipment) => void;
  onEquipmentCreate?: () => void;
}

export const EquipmentList: React.FC<EquipmentListProps> = ({
  onEquipmentSelect,
  onEquipmentEdit,
  onEquipmentCreate,
}) => {
  const { checkPermission } = useAuth();
  const equipment = useEquipmentEnhanced();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [buildingFilter, setBuildingFilter] = useState<string>('');
  const [showExportModal, setShowExportModal] = useState(false);

  // Check permissions
  const canCreate = checkPermission(Permission.EQUIPMENT_CREATE);
  const canUpdate = checkPermission(Permission.EQUIPMENT_UPDATE);
  const canDelete = checkPermission(Permission.EQUIPMENT_DELETE);

  // Load equipment on component mount
  useEffect(() => {
    equipment.fetchItems();
  }, []);

  // Apply filters and search
  useEffect(() => {
    const filters: Record<string, any> = {};
    
    if (typeFilter) filters.type = typeFilter;
    if (statusFilter) filters.status = statusFilter;
    if (buildingFilter) filters.buildingId = buildingFilter;
    
    equipment.setFilters(filters);
    equipment.setSearch(searchQuery);
    equipment.fetchItems();
  }, [searchQuery, typeFilter, statusFilter, buildingFilter]);

  // Define table columns
  const columns: ColumnDefinition<Equipment>[] = useMemo(() => [
    {
      key: 'name',
      label: 'Equipment Name',
      sortable: true,
      render: (value, item) => (
        <div className="table-cell--two-line">
          <div className="table-cell__primary">{value}</div>
          <div className="table-cell__secondary">{item.type}</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <span className={`badge badge--rounded badge--${value === 'operational' ? 'success' : value === 'maintenance' ? 'warning' : 'error'}`}>
          {value === 'operational' ? 'Operational' : 
           value === 'maintenance' ? 'Maintenance' : 
           'Offline'}
        </span>
      ),
    },
    {
      key: 'buildingName',
      label: 'Building',
      sortable: true,
      render: (value) => value || 'Unassigned',
      responsive: 'hide-mobile',
    },
    {
      key: 'manufacturer',
      label: 'Manufacturer',
      sortable: true,
      render: (value) => value || 'N/A',
      responsive: 'hide-tablet',
    },
    {
      key: 'model',
      label: 'Model',
      sortable: true,
      render: (value) => value || 'N/A',
      responsive: 'hide-tablet',
    },
    {
      key: 'installDate',
      label: 'Install Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
      responsive: 'hide-mobile',
    },
    {
      key: 'lastMaintenance',
      label: 'Last Maintenance',
      sortable: true,
      render: (value) => value ? new Date(value).toLocaleDateString() : 'Never',
      responsive: 'hide-tablet',
    },
  ], []);

  // Define bulk actions
  const bulkActions: BulkAction<Equipment>[] = useMemo(() => {
    const actions: BulkAction<Equipment>[] = [];

    if (canUpdate) {
      actions.push(
        {
          key: 'operational',
          label: 'Set Operational',
          icon: '✅',
          color: 'success',
          action: async (selectedEquipment) => {
            const equipmentIds = selectedEquipment.map(e => e.id);
            await equipment.bulkUpdateStatus(equipmentIds, 'operational');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to set the selected equipment as operational?',
        },
        {
          key: 'maintenance',
          label: 'Set Maintenance',
          icon: '🔧',
          color: 'warning',
          action: async (selectedEquipment) => {
            const equipmentIds = selectedEquipment.map(e => e.id);
            await equipment.bulkUpdateStatus(equipmentIds, 'maintenance');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to set the selected equipment to maintenance mode?',
        },
        {
          key: 'offline',
          label: 'Set Offline',
          icon: '❌',
          color: 'error',
          action: async (selectedEquipment) => {
            const equipmentIds = selectedEquipment.map(e => e.id);
            await equipment.bulkUpdateStatus(equipmentIds, 'offline');
          },
          confirm: true,
          confirmMessage: 'Are you sure you want to set the selected equipment as offline?',
        }
      );
    }

    actions.push({
      key: 'export',
      label: 'Export CSV',
      icon: '📄',
      color: 'primary',
      action: async (selectedEquipment) => {
        exportEquipmentToCSV(selectedEquipment);
      },
    });

    return actions;
  }, [canUpdate, equipment]);

  // Handle equipment actions
  const handleEquipmentView = useCallback((item: Equipment) => {
    onEquipmentSelect?.(item);
  }, [onEquipmentSelect]);

  const handleEquipmentEdit = useCallback((item: Equipment) => {
    if (!canUpdate) return;
    onEquipmentEdit?.(item);
  }, [canUpdate, onEquipmentEdit]);

  const handleEquipmentDelete = useCallback(async (item: Equipment) => {
    if (!canDelete) return;
    
    const confirmed = window.confirm(
      `Are you sure you want to delete equipment "${item.name}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      await equipment.deleteEquipment(item.id);
    }
  }, [canDelete, equipment]);

  // Export functionality
  const exportEquipmentToCSV = useCallback((equipmentToExport: Equipment[]) => {
    const headers = [
      'Name', 'Type', 'Status', 'Building', 'Manufacturer', 'Model', 
      'Serial Number', 'Install Date', 'Last Maintenance', 'Location', 'Created'
    ];
    const csvContent = [
      headers.join(','),
      ...equipmentToExport.map(item => [
        `"${item.name}"`,
        item.type,
        item.status,
        `"${item.buildingName || 'Unassigned'}"`,
        item.manufacturer || '',
        item.model || '',
        item.serialNumber || '',
        new Date(item.installDate).toISOString().split('T')[0],
        item.lastMaintenance ? new Date(item.lastMaintenance).toISOString().split('T')[0] : '',
        `"${item.location || ''}"`,
        new Date(item.createdAt).toISOString(),
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `equipment_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const exportAllEquipment = useCallback(() => {
    exportEquipmentToCSV(equipment.items);
    setShowExportModal(false);
  }, [equipment.items, exportEquipmentToCSV]);

  // Get unique types and buildings for filters
  const uniqueTypes = useMemo(() => {
    const types = equipment.items.map(e => e.type);
    return [...new Set(types)].sort();
  }, [equipment.items]);

  const uniqueBuildings = useMemo(() => {
    const buildings = equipment.items
      .filter(e => e.buildingName)
      .map(e => ({ id: e.buildingId, name: e.buildingName! }));
    const uniqueBuildings = buildings.filter((building, index, self) => 
      index === self.findIndex(b => b.id === building.id)
    );
    return uniqueBuildings.sort((a, b) => a.name.localeCompare(b.name));
  }, [equipment.items]);

  return (
    <div className="equipment-list">
      {/* Header */}
      <div className="equipment-list__header">
        <div className="equipment-list__title-section">
          <h2 className="equipment-list__title">Equipment</h2>

        </div>
        
        <div className="equipment-list__actions">
          <button
            type="button"
            className="equipment-list__btn equipment-list__btn--secondary"
            onClick={() => setShowExportModal(true)}
          >
            📄 Export CSV
          </button>
          
          {canCreate && (
            <button
              type="button"
              className="equipment-list__btn equipment-list__btn--primary"
              onClick={onEquipmentCreate}
            >
              ➕ Add Equipment
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="equipment-list__filters">
        <div className="equipment-list__search">
          <input
            type="text"
            placeholder="Search equipment by name, type, or manufacturer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="equipment-list__search-input"
          />
        </div>
        
        <div className="equipment-list__filter-group">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="equipment-list__filter-select"
            aria-label="Filter by type"
          >
            <option value="">All Types</option>
            {uniqueTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="equipment-list__filter-select"
            aria-label="Filter by status"
          >
            <option value="">All Status</option>
            <option value="operational">Operational</option>
            <option value="maintenance">Maintenance</option>
            <option value="offline">Offline</option>
          </select>
          
          <select
            value={buildingFilter}
            onChange={(e) => setBuildingFilter(e.target.value)}
            className="equipment-list__filter-select"
            aria-label="Filter by building"
          >
            <option value="">All Buildings</option>
            {uniqueBuildings.map(building => (
              <option key={building.id} value={building.id}>{building.name}</option>
            ))}
          </select>
          
          {(typeFilter || statusFilter || buildingFilter || searchQuery) && (
            <button
              type="button"
              className="equipment-list__clear-filters"
              onClick={() => {
                setTypeFilter('');
                setStatusFilter('');
                setBuildingFilter('');
                setSearchQuery('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content with Stats Sidebar */}
      <div className="list__main-content">
        <div className="list__content">
          {/* Data Table */}
      <DataTable
        data={equipment.items}
        columns={columns}
        loading={equipment.list.loading}
        error={equipment.list.error || undefined}
        emptyMessage="No equipment found. Add your first equipment to get started."
        onView={handleEquipmentView}
        onEdit={canUpdate ? handleEquipmentEdit : undefined}
        onDelete={canDelete ? handleEquipmentDelete : undefined}
        onSelect={bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={bulkActions}
        pagination={{
          currentPage: equipment.list.page,
          pageSize: equipment.list.pageSize,
          total: equipment.list.total,
          onPageChange: (page) => {
            equipment.setPage(page);
            equipment.fetchItems();
          },
          onPageSizeChange: (size) => {
            equipment.setPageSize(size);
            equipment.fetchItems();
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
              <span className="list__stat-value">{equipment.operationalEquipment.length}</span>
              <span className="list__stat-label">Operational</span>
            </div>
            <div className="list__stat">
              <span className="list__stat-value">{equipment.maintenanceEquipment.length}</span>
              <span className="list__stat-label">In Maintenance</span>
            </div>
            <div className="list__stat">
              <span className="list__stat-value">{equipment.offlineEquipment.length}</span>
              <span className="list__stat-label">Offline</span>
            </div>
            <div className="list__stat">
              <span className="list__stat-value">{equipment.items.length}</span>
              <span className="list__stat-label">Total Equipment</span>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <FormModal
        isOpen={showExportModal}
        title="Export Equipment"
        onClose={() => setShowExportModal(false)}
        onSubmit={exportAllEquipment}
      >
        <div className="equipment-list__export-content">
          <p>Export all equipment to CSV format?</p>
          <p className="equipment-list__export-info">
            This will include: Name, Type, Status, Building, Manufacturer, Model, Serial Number, Install Date, and Last Maintenance
          </p>
          <p className="equipment-list__export-count">
            <strong>{equipment.items.length} equipment items</strong> will be exported.
          </p>
        </div>
      </FormModal>
    </div>
  );
};