import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Building } from '../../types/entities';
import { Permission } from '../../types/auth';
import './BuildingDetail.css';

interface BuildingDetailProps {
  building: Building;
  onEdit?: () => void;
  onBack: () => void;
}

export const BuildingDetail: React.FC<BuildingDetailProps> = ({
  building,
  onEdit,
  onBack,
}) => {
  const { checkPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'meters' | 'history'>('overview');

  const canUpdate = checkPermission(Permission.BUILDING_UPDATE);

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return '✅';
      case 'inactive': return '❌';
      case 'maintenance': return '🔧';
      default: return '❓';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'office': return '🏢';
      case 'warehouse': return '🏭';
      case 'retail': return '🏪';
      case 'residential': return '🏠';
      case 'industrial': return '🏗️';
      default: return '🏢';
    }
  };

  return (
    <div className="building-detail">
      {/* Header */}
      <div className="building-detail__header">
        <div className="building-detail__header-left">
          <button
            type="button"
            onClick={onBack}
            className="building-detail__back-btn"
            aria-label="Back to buildings list"
          >
            ← Back to Buildings
          </button>
          <div className="building-detail__title-section">
            <h1 className="building-detail__title">
              {getTypeIcon(building.type)} {building.name}
            </h1>
            <div className="building-detail__subtitle">
              <span className={`building-detail__status building-detail__status--${building.status}`}>
                {getStatusIcon(building.status)} {building.status.charAt(0).toUpperCase() + building.status.slice(1)}
              </span>
              <span className="building-detail__type">
                {building.type.charAt(0).toUpperCase() + building.type.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="building-detail__actions">
          {canUpdate && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="building-detail__btn building-detail__btn--primary"
            >
              ✏️ Edit Building
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="building-detail__tabs">
        <button
          type="button"
          className={`building-detail__tab ${activeTab === 'overview' ? 'building-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={`building-detail__tab ${activeTab === 'equipment' ? 'building-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment ({building.equipmentCount})
        </button>
        <button
          type="button"
          className={`building-detail__tab ${activeTab === 'meters' ? 'building-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('meters')}
        >
          Meters ({building.meterCount})
        </button>
        <button
          type="button"
          className={`building-detail__tab ${activeTab === 'history' ? 'building-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="building-detail__content">
        {activeTab === 'overview' && (
          <div className="building-detail__overview">
            {/* Quick Stats */}
            <div className="building-detail__stats">
              <div className="building-detail__stat">
                <span className="building-detail__stat-value">{building.equipmentCount}</span>
                <span className="building-detail__stat-label">Equipment Items</span>
              </div>
              <div className="building-detail__stat">
                <span className="building-detail__stat-value">{building.meterCount}</span>
                <span className="building-detail__stat-label">Meters</span>
              </div>
              {building.squareFootage && (
                <div className="building-detail__stat">
                  <span className="building-detail__stat-value">{building.squareFootage.toLocaleString()}</span>
                  <span className="building-detail__stat-label">Square Feet</span>
                </div>
              )}
              {building.yearBuilt && (
                <div className="building-detail__stat">
                  <span className="building-detail__stat-value">{building.yearBuilt}</span>
                  <span className="building-detail__stat-label">Year Built</span>
                </div>
              )}
            </div>

            {/* Information Sections */}
            <div className="building-detail__sections">
              {/* Address Information */}
              <div className="building-detail__section">
                <h3 className="building-detail__section-title">📍 Address</h3>
                <div className="building-detail__section-content">
                  <div className="building-detail__address">
                    <div>{building.address.street}</div>
                    <div>{building.address.city}, {building.address.state} {building.address.zipCode}</div>
                    <div>{building.address.country}</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="building-detail__section">
                <h3 className="building-detail__section-title">📞 Contact Information</h3>
                <div className="building-detail__section-content">
                  {building.contactInfo.primaryContact && (
                    <div className="building-detail__contact-item">
                      <strong>Primary Contact:</strong> {building.contactInfo.primaryContact}
                    </div>
                  )}
                  <div className="building-detail__contact-item">
                    <strong>Email:</strong> 
                    <a href={`mailto:${building.contactInfo.email}`} className="building-detail__link">
                      {building.contactInfo.email}
                    </a>
                  </div>
                  <div className="building-detail__contact-item">
                    <strong>Phone:</strong> 
                    <a href={`tel:${building.contactInfo.phone}`} className="building-detail__link">
                      {building.contactInfo.phone}
                    </a>
                  </div>
                  {building.contactInfo.website && (
                    <div className="building-detail__contact-item">
                      <strong>Website:</strong> 
                      <a 
                        href={building.contactInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="building-detail__link"
                      >
                        {building.contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Building Details */}
              <div className="building-detail__section">
                <h3 className="building-detail__section-title">🏢 Building Details</h3>
                <div className="building-detail__section-content">
                  <div className="building-detail__details-grid">
                    <div className="building-detail__detail-item">
                      <strong>Type:</strong> {building.type.charAt(0).toUpperCase() + building.type.slice(1)}
                    </div>
                    <div className="building-detail__detail-item">
                      <strong>Status:</strong> {building.status.charAt(0).toUpperCase() + building.status.slice(1)}
                    </div>
                    {building.totalFloors && (
                      <div className="building-detail__detail-item">
                        <strong>Total Floors:</strong> {building.totalFloors}
                      </div>
                    )}
                    {building.totalUnits && (
                      <div className="building-detail__detail-item">
                        <strong>Total Units:</strong> {building.totalUnits}
                      </div>
                    )}
                    {building.squareFootage && (
                      <div className="building-detail__detail-item">
                        <strong>Square Footage:</strong> {building.squareFootage.toLocaleString()} sq ft
                      </div>
                    )}
                    {building.yearBuilt && (
                      <div className="building-detail__detail-item">
                        <strong>Year Built:</strong> {building.yearBuilt}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {building.description && (
                <div className="building-detail__section">
                  <h3 className="building-detail__section-title">📝 Description</h3>
                  <div className="building-detail__section-content">
                    <p className="building-detail__description">{building.description}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {building.notes && (
                <div className="building-detail__section">
                  <h3 className="building-detail__section-title">📋 Notes</h3>
                  <div className="building-detail__section-content">
                    <p className="building-detail__notes">{building.notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="building-detail__section">
                <h3 className="building-detail__section-title">🕒 Timestamps</h3>
                <div className="building-detail__section-content">
                  <div className="building-detail__detail-item">
                    <strong>Created:</strong> {formatDate(building.createdAt)}
                  </div>
                  <div className="building-detail__detail-item">
                    <strong>Last Updated:</strong> {formatDate(building.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="building-detail__equipment">
            <div className="building-detail__placeholder">
              <h3>Equipment Management</h3>
              <p>Equipment list and management will be available once the Equipment module is implemented.</p>
              <p>Current equipment count: <strong>{building.equipmentCount}</strong></p>
            </div>
          </div>
        )}

        {activeTab === 'meters' && (
          <div className="building-detail__meters">
            <div className="building-detail__placeholder">
              <h3>Meter Management</h3>
              <p>Meter list and readings will be available once the Meter module is implemented.</p>
              <p>Current meter count: <strong>{building.meterCount}</strong></p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="building-detail__history">
            <div className="building-detail__placeholder">
              <h3>Building History</h3>
              <p>Building change history and audit logs will be available in a future update.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};