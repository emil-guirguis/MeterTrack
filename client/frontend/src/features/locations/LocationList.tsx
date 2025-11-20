import React from 'react';
import { DataList } from '@framework/lists/components';
import { useLocationsEnhanced } from './locationsStore';
import { useBaseList } from '@framework/lists/hooks';
import { Permission } from '../../types/auth';
import type { Location } from '../../types/entities';
import {
  locationColumns,
  locationFilters,
  locationStats,
  createLocationBulkActions,
  locationExportConfig,
} from './locationConfig';
import { showConfirmation } from '@framework/shared/utils/confirmationHelper';
import './LocationList.css';

interface LocationListProps {
  onLocationEdit?: (location: Location) => void;
  onLocationCreate?: () => void;
}

export const LocationList: React.FC<LocationListProps> = ({
  onLocationEdit,
  onLocationCreate,
}) => {
  const locations = useLocationsEnhanced();
  
  // Mock auth context that allows all permissions (temporary for development)
  const mockAuthContext = {
    checkPermission: () => true,
    user: { id: '1', name: 'Dev User' }
  };
  
  // Custom delete handler for locations
  const handleLocationDelete = (location: Location) => {
    showConfirmation({
      type: 'danger',
      title: 'Delete Location',
      message: `Delete location "${location.name}"? This cannot be undone.`,
      confirmText: 'Delete',
      onConfirm: async () => {
        await locations.deleteItem(location.id);
        await locations.fetchItems();
      }
    });
  };
  
  const baseList = useBaseList<Location, ReturnType<typeof useLocationsEnhanced>>({
    entityName: 'location',
    entityNamePlural: 'locations',
    useStore: useLocationsEnhanced,
    features: {
      allowCreate: true,
      allowEdit: true,
      allowDelete: true,
      allowBulkActions: true,
      allowExport: true,
      allowImport: false,
      allowSearch: true,
      allowFilters: true,
      allowStats: true,
    },
    permissions: {
      create: Permission.LOCATION_CREATE,
      update: Permission.LOCATION_UPDATE,
      delete: Permission.LOCATION_DELETE,
    },
    columns: locationColumns,
    filters: locationFilters,
    stats: locationStats,
    bulkActions: createLocationBulkActions(
      { bulkUpdateStatus: locations.bulkUpdateStatus },
      (items) => baseList.handleExport(items)
    ),
    export: locationExportConfig,
    onEdit: onLocationEdit,
    onCreate: onLocationCreate,
    authContext: mockAuthContext,
  });

  return (
    <div className="location-list">
      <DataList
        title="Locations"
        filters={baseList.renderFilters()}
        headerActions={baseList.renderHeaderActions()}
        stats={baseList.renderStats()}
        data={baseList.data}
        columns={baseList.columns}
        loading={baseList.loading}
        error={baseList.error}
        emptyMessage="No locations found. Create your first location to get started."
        onEdit={baseList.handleEdit}
        onDelete={handleLocationDelete}
        onSelect={baseList.bulkActions.length > 0 ? () => {} : undefined}
        bulkActions={baseList.bulkActions}
        pagination={baseList.pagination}
      />
      {baseList.renderExportModal()}
      {baseList.renderImportModal()}
    </div>
  );
};