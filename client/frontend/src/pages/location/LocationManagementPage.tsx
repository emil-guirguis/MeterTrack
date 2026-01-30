import { useState, useCallback } from 'react';
import { AppLayoutWrapper } from '../../components/layout';
import { LocationList } from '../../features/locations/LocationList';
import { LocationForm } from '../../features/locations/LocationForm';
import { useLocationsEnhanced } from '../../features/locations/locationsStore';
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
  const [formLoading, setFormLoading] = useState(false);

  // Set page title
  usePageTitle('Location Management');

  // Check permissions
  const canCreate = checkPermission(Permission.LOCATION_CREATE);
  const canUpdate = checkPermission(Permission.LOCATION_UPDATE);
  const canView = checkPermission(  Permission.LOCATION_READ);

  // Handle location selection for viewing details
  const handleLocationEdit = useCallback((location: Location) => {
    if (!canUpdate) return;
    
    setSelectedLocation(location);
    setViewMode('edit');
  }, [canUpdate]);

  // Handle location creation
  const handleLocationCreate = useCallback(() => {
    if (!canCreate) return;
    
    setSelectedLocation(null);
    setViewMode('create');
  }, [canCreate]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: LocationCreateRequest | LocationUpdateRequest) => {
    setFormLoading(true);
    
    try {
      if (viewMode === 'create') {
        await locations.createLocation(data as LocationCreateRequest);
      } else if (viewMode === 'edit' && selectedLocation) {
        const updateData = data as LocationUpdateRequest;
        await locations.updateLocation(String(updateData.location_id), updateData);
      }
      
      // Return to list
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
    setViewMode('list');
    setSelectedLocation(null);
  }, []);

  // Render different views based on current mode
  const renderContent = () => {
    switch (viewMode) {
      case 'create':
      case 'edit':
        return (
          <div className="location-management-page__form-container">
            <LocationForm
              location={selectedLocation || undefined}
              onSubmit={handleFormSubmit}
              onCancel={handleFormCancel}
              loading={formLoading}
            />
          </div>
        );
      
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
      <AppLayoutWrapper 
        title="Location Management" 
        breadcrumbs={breadcrumbs}
      >
        <div className="location-management-page">
          <div className="location-management-page__no-access">
            <h2>Access Denied</h2>
            <p>You don't have permission to view location information.</p>
          </div>
        </div>
      </AppLayoutWrapper>
    );
  }

  return (
    <AppLayoutWrapper 
      title="Location Management" 
      breadcrumbs={breadcrumbs}
    >
      <div className="location-management-page">
        {/* Main Content */}
        <div className="location-management-page__content">
          {renderContent()}
        </div>
      </div>
    </AppLayoutWrapper>
  );
};