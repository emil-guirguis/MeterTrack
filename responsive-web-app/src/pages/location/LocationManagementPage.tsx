import React, { useState, useCallback } from 'react';
import { AppLayout } from '../../components/layout';
import { LocationList } from '../../components/location/LocationList';
import { LocationForm } from '../../components/location/LocationForm';
import { FormModal } from '../../components/common/FormModal';
import { useLocationsEnhanced } from '../../store/entities/locationStore';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Location, LocationCreateRequest, LocationUpdateRequest } from '../../types/entities';
import { Permission } from '../../types/auth';
import './LocationManagementPage.css';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export const LocationManagementPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const locations = useLocationsEnhanced();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Set page title
  usePageTitle('Location Management');

  // Check permissions
  const canCreate = checkPermission(Permission.LOCATION_CREATE);
  const canUpdate = checkPermission(Permission.LOCATION_UPDATE);
  const canView = checkPermission(  Permission.LOCATION_READ);

  // Handle location selection for viewing details
  const handleLocationSelect = useCallback((location: Location) => {
    if (!canView) return;
    
    setSelectedLocation(location);
    setViewMode('detail');
  }, [canView]);

  // Handle location edit
  const handleLocationEdit = useCallback((location: Location) => {
    if (!canUpdate) return;
    
    setSelectedLocation(location);
    setViewMode('edit');
    setShowFormModal(true);
  }, [canUpdate]);

  // Handle location creation
  const handleLocationCreate = useCallback(() => {
    if (!canCreate) return;
    
    setSelectedLocation(null);
    setViewMode('create');
    setShowFormModal(true);
  }, [canCreate]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: LocationCreateRequest | LocationUpdateRequest) => {
    setFormLoading(true);
    
    try {
      if (viewMode === 'create') {
        await locations.createLocation(data as LocationCreateRequest);
      } else if (viewMode === 'edit' && selectedLocation) {
        const updateData = data as LocationUpdateRequest;
        await locations.updateLocation(updateData.id, updateData);
      }
      
      // Close modal and return to list
      setShowFormModal(false);
      setViewMode('list');
      setSelectedLocation(null);
      
      // Refresh the locations list
      await locations.fetchItems();
      
    } catch (error) {
      console.error('Error saving location:', error);
      // Error handling is managed by the store
    } finally {
      setFormLoading(false);
    }
  }, [viewMode, selectedLocation, locations]);

  // Handle form cancellation
  const handleFormCancel = useCallback(() => {
    setShowFormModal(false);
    setViewMode('list');
    setSelectedLocation(null);
  }, []);

  // Handle back to list navigation
  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedLocation(null);
  }, []);

  // Handle location detail edit
  const handleDetailEdit = useCallback(() => {
    if (!canUpdate || !selectedLocation) return;
    
    setViewMode('edit');
    setShowFormModal(true);
  }, [canUpdate, selectedLocation]);

  // Render different views based on current mode
  const renderContent = () => {
    switch (viewMode) {
      
      case 'list':
      default:
        return (
          <LocationList
            onLocationEdit={handleLocationEdit}
            onLocationCreate={handleLocationCreate}
          />
        );
    }
  };

  // Breadcrumb configuration
  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Location Management', path: '/location' },
  ];

  // Don't render if user doesn't have read permission
  if (!canView) {
    return (
      <AppLayout 
        title="Location Management" 
        breadcrumbs={breadcrumbs}
      >
        <div className="location-management-page">
          <div className="location-management-page__no-access">
            <h2>Access Denied</h2>
            <p>You don't have permission to view location information.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Location Management" 
      breadcrumbs={breadcrumbs}
    >
      <div className="location-management-page">
        {/* Main Content */}
        <div className="location-management-page__content">
          {renderContent()}
        </div>

        {/* Form Modal */}
        <FormModal
          isOpen={showFormModal}
          title={viewMode === 'create' ? 'Create New Location' : 'Edit Location'}
          onClose={handleFormCancel}
          onSubmit={() => {}} // FormModal requires this prop, but LocationForm handles its own submission
          size="lg"
        >
          <LocationForm
            location={selectedLocation || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={formLoading}
          />
        </FormModal>
      </div>
    </AppLayout>
  );
};