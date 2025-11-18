import React, { useState } from 'react';
import { MeterList, MeterForm } from '../components/meters';
import { useMetersEnhanced } from '../store/entities/metersStore';
import { FormModal } from '@framework/shared/components';
import type { Meter, CreateMeterRequest } from '../types/meter';
import './MetersPage.css';

type ViewMode = 'list' | 'create' | 'edit' | 'view';

const MetersPage: React.FC = () => {
  const meters = useMetersEnhanced();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedMeter, setSelectedMeter] = useState<Meter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateMeter = () => {
    setSelectedMeter(null);
    setViewMode('create');
  };

  const handleEditMeter = (meter: any) => {
    setSelectedMeter(meter);
    setViewMode('edit');
  };

  const handleViewMeter = (meter: any) => {
    setSelectedMeter(meter);
    setViewMode('view');
  };

  const handleFormSubmit = async (data: CreateMeterRequest) => {
    setIsSubmitting(true);
    try {
      if (viewMode === 'create') {
        await meters.createMeter(data);
      } else if (viewMode === 'edit' && selectedMeter) {
        await meters.updateMeter(selectedMeter.id, data);
      }
      setViewMode('list');
      setSelectedMeter(null);
    } catch (error) {
      console.error('Meter form submission error:', error);
      // Error handling is already done in the store with notifications
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormCancel = () => {
    setViewMode('list');
    setSelectedMeter(null);
  };

  const renderMeterDetails = (meter: Meter) => (
    <div className="meter-details">
      <div className="meter-details__header">
        <h3>{meter.meterId}</h3>
        <div className="meter-details__actions">
          <button 
            className="btn btn--secondary btn--sm"
            onClick={() => handleEditMeter(meter)}
          >
            Edit
          </button>
          <button 
            className="btn btn--secondary btn--sm"
            onClick={() => setViewMode('list')}
          >
            Back to List
          </button>
        </div>
      </div>

      <div className="meter-details__content">
        <div className="detail-section">
          <h4>Basic Information</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Device:</label>
              <span>{meter.device}</span>
            </div>
            <div className="detail-item">
              <label>Model:</label>
              <span>{meter.model}</span>
            </div>
            <div className="detail-item">
              <label>Serial Number:</label>
              <span>{meter.serialNumber}</span>
            </div>
            <div className="detail-item">
              <label>Type:</label>
              <span className={`badge badge--${meter.type === 'electric' ? 'primary' : meter.type === 'gas' ? 'warning' : 'info'}`}>
                {meter.type}
              </span>
            </div>
            <div className="detail-item">
              <label>Status:</label>
              <span className={`status-indicator status-indicator--${meter.status}`}>
                <span className={`status-dot status-dot--${meter.status}`}></span>
                {meter.status}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-section">
          <h4>Connection Settings</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>IP Address:</label>
              <span>{meter.ip}</span>
            </div>
            <div className="detail-item">
              <label>Port:</label>
              <span>{meter.portNumber}</span>
            </div>
            <div className="detail-item">
              <label>Slave ID:</label>
              <span>{meter.slaveId || 1}</span>
            </div>
            <div className="detail-item">
              <label>Protocol:</label>
              <span>Modbus TCP</span>
            </div>
          </div>
        </div>

        {(meter.location || meter.description) && (
          <div className="detail-section">
            <h4>Location & Description</h4>
            <div className="detail-grid">
              {meter.location && (
                <div className="detail-item detail-item--full">
                  <label>Location:</label>
                  <span>{meter.location}</span>
                </div>
              )}
              {meter.description && (
                <div className="detail-item detail-item--full">
                  <label>Description:</label>
                  <span>{meter.description}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h4>Last Reading</h4>
          <div className="detail-grid">
            <div className="detail-item">
              <label>Value:</label>
              <span>No readings available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="meters-page">
      <div className="page-header">
        <div className="page-header__content">
          <h1>Meter Management</h1>
          <p>Manage and monitor your facility meters</p>
        </div>
        {viewMode === 'list' && (
          <div className="page-header__actions">
            <button 
              className="btn btn--primary"
              onClick={handleCreateMeter}
            >
              + Add Meter
            </button>
          </div>
        )}
      </div>

      <div className="page-content">
        {viewMode === 'list' && (
          <MeterList
            onMeterCreate={handleCreateMeter}
            onMeterEdit={handleEditMeter}
            onMeterSelect={handleViewMeter}
          />
        )}

        {viewMode === 'view' && selectedMeter && renderMeterDetails(selectedMeter)}
      </div>

      {/* Create/Edit Modal */}
      {(viewMode === 'create' || viewMode === 'edit') && (
        <FormModal
          isOpen={true}
          title={viewMode === 'create' ? 'Add New Meter' : 'Edit Meter'}
          onClose={handleFormCancel}
          onSubmit={() => {}} // No-op since form handles its own submission
          size="lg"
        >
          <MeterForm
            meter={selectedMeter || undefined}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
            loading={isSubmitting}
          />
        </FormModal>
      )}
    </div>
  );
};

export default MetersPage;
