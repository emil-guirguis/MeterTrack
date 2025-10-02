import React, { useState, useCallback } from 'react';
import { AppLayout } from '../../components/layout';
import { BuildingList } from '../../components/buildings/BuildingList';
import { BuildingForm } from '../../components/buildings/BuildingForm';
import { BuildingDetail } from '../../components/buildings/BuildingDetail';
import { FormModal } from '../../components/common/FormModal';
import { useBuildingsEnhanced } from '../../store/entities/buildingsStore';
import { useAuth } from '../../hooks/useAuth';
import { usePageTitle } from '../../hooks/usePageTitle';
import type { Building, BuildingCreateRequest, BuildingUpdateRequest } from '../../types/entities';
import { Permission } from '../../types/auth';
import './BuildingManagementPage.css';

type ViewMode = 'list' | 'detail' | 'create' | 'edit';

export const BuildingManagementPage: React.FC = () => {
  const { checkPermission } = useAuth();
  const buildings = useBuildingsEnhanced();
  
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [showFormModal, setShowFormModal] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // Set page title
  usePageTitle('Building Management');

  // Check permissions
  const canCreate = checkPermission(Permission.BUILDING_CREATE);
  const canUpdate = checkPermission(Permission.BUILDING_UPDATE);
  const canView = checkPermission(Permission.BUILDING_READ);

  // Handle building selection for viewing details
  const handleBuildingSelect = useCallback((building: Building) => {
    if (!canView) return;
    
    setSelectedBuilding(building);
    setViewMode('detail');
  }, [canView]);

  // Handle building edit
  const handleBuildingEdit = useCallback((building: Building) => {
    if (!canUpdate) return;
    
    setSelectedBuilding(building);
    setViewMode('edit');
    setShowFormModal(true);
  }, [canUpdate]);

  // Handle building creation
  const handleBuildingCreate = useCallback(() => {
    if (!canCreate) return;
    
    setSelectedBuilding(null);
    setViewMode('create');
    setShowFormModal(true);
  }, [canCreate]);

  // Handle form submission
  const handleFormSubmit = useCallback(async (data: BuildingCreateRequest | BuildingUpdateRequest) => {
    setFormLoading(true);
    
    try {
      if (viewMode === 'create') {
        await buildings.createBuilding(data as BuildingCreateRequest);
      } else if (viewMode === 'edit' && selectedBuilding) {
        const updateData = data as BuildingUpdateRequest;
        await buildings.updateBuilding(updateData.id, updateData);
      }
      
      // Close modal and return to list
      setShowFormModal(false);
      setViewMode('list');
      setSelectedBuilding(null);
      
      // Refresh the buildings list
      await buildings.fetchItems();
      
    } catch (error) {
      console.error('Error saving building:', error);
      // Error handling is managed by the store
    } finally {
      setFormLoading(false);
    }
  }, [viewMode, selectedBuilding, buildings]);

  // Handle form cancellation
  const handleFormCancel = useCallback(() => {
    setShowFormModal(false);
    setViewMode('list');
    setSelectedBuilding(null);
  }, []);

  // Handle back to list navigation
  const handleBackToList = useCallback(() => {
    setViewMode('list');
    setSelectedBuilding(null);
  }, []);

  // Handle building detail edit
  const handleDetailEdit = useCallback(() => {
    if (!canUpdate || !selectedBuilding) return;
    
    setViewMode('edit');
    setShowFormModal(true);
  }, [canUpdate, selectedBuilding]);

  // Render different views based on current mode
  const renderContent = () => {
    switch (viewMode) {
      case 'detail':
        return selectedBuilding ? (
          <BuildingDetail
            building={selectedBuilding}
            onEdit={canUpdate ? handleDetailEdit : undefined}
            onBack={handleBackToList}
          />
        ) : null;

      case 'list':
      default:
        return (
          <BuildingList
            onBuildingSelect={handleBuildingSelect}
            onBuildingEdit={handleBuildingEdit}
            onBuildingCreate={handleBuildingCreate}
          />
        );
    }
  };

  // Breadcrumb configuration
  const breadcrumbs = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Building Management', path: '/buildings' },
  ];

  // Don't render if user doesn't have read permission
  if (!canView) {
    return (
      <AppLayout 
        title="Building Management" 
        breadcrumbs={breadcrumbs}
      >
        <div className="building-management-page">
          <div className="building-management-page__no-access">
            <h2>Access Denied</h2>
            <p>You don't have permission to view building information.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout 
      title="Building Management" 
      breadcrumbs={breadcrumbs}
    >
      <div className="building-management-page">
        {/* Main Content */}
        <div className="building-management-page__content">
          {renderContent()}
        </div>

        {/* Form Modal */}
        <FormModal
          isOpen={showFormModal}
          title={viewMode === 'create' ? 'Create New Building' : 'Edit Building'}
          onClose={handleFormCancel}
          onSubmit={() => {}} // FormModal requires this prop, but BuildingForm handles its own submission
          size="lg"
        >
          <BuildingForm
            building={selectedBuilding || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={formLoading}
          />
        </FormModal>
      </div>
    </AppLayout>
  );
};