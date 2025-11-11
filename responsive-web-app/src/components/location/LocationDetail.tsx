import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import type { Location } from '../../types/entities';
import { Permission } from '../../types/auth';
import './LocationDetail.css';

interface LocationDetailProps {
  location: Location;
  onEdit?: () => void;
  onBack: () => void;
}

export const LocationDetail: React.FC<LocationDetailProps> = ({
  location,
  onEdit,
  onBack,
}) => {
  const { checkPermission } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'equipment' | 'meters' | 'history'>('overview');

  const canUpdate = checkPermission(Permission.LOCATION_UPDATE);

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
    <div className="location-detail">
      {/* Header */}
      <div className="location-detail__header">
        <div className="location-detail__header-left">
          <button
            type="button"
            onClick={onBack}
            className="location-detail__back-btn"
            aria-label="Back to locations list"
          >
            ← Back to Locations
          </button>
          <div className="location-detail__title-section">
            <h1 className="location-detail__title">
              {getTypeIcon(location.type)} {location.name}
            </h1>
            <div className="location-detail__subtitle">
              <span className={`location-detail__status location-detail__status--${location.status}`}>
                {getStatusIcon(location.status)} {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
              </span>
              <span className="location-detail__type">
                {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
              </span>
            </div>
          </div>
        </div>
        
        <div className="location-detail__actions">
          {canUpdate && onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="location-detail__btn location-detail__btn--primary"
            >
              ✏️ Edit Location
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="location-detail__tabs">
        <button
          type="button"
          className={`location-detail__tab ${activeTab === 'overview' ? 'location-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          type="button"
          className={`location-detail__tab ${activeTab === 'equipment' ? 'location-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          Equipment ({location.equipmentCount})
        </button>
        <button
          type="button"
          className={`location-detail__tab ${activeTab === 'meters' ? 'location-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('meters')}
        >
          Meters ({location.meterCount})
        </button>
        <button
          type="button"
          className={`location-detail__tab ${activeTab === 'history' ? 'location-detail__tab--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
      </div>

      {/* Content */}
      <div className="location-detail__content">
        {activeTab === 'overview' && (
          <div className="location-detail__overview">
            {/* Quick Stats */}
            <div className="location-detail__stats">
              <div className="location-detail__stat">
                <span className="location-detail__stat-value">{location.equipmentCount}</span>
                <span className="location-detail__stat-label">Equipment Items</span>
              </div>
              <div className="location-detail__stat">
                <span className="location-detail__stat-value">{location.meterCount}</span>
                <span className="location-detail__stat-label">Meters</span>
              </div>
              {location.squareFootage && (
                <div className="location-detail__stat">
                  <span className="location-detail__stat-value">{location.squareFootage.toLocaleString()}</span>
                  <span className="location-detail__stat-label">Square Feet</span>
                </div>
              )}
              {location.yearBuilt && (
                <div className="location-detail__stat">
                  <span className="location-detail__stat-value">{location.yearBuilt}</span>
                  <span className="location-detail__stat-label">Year Built</span>
                </div>
              )}
            </div>

            {/* Information Sections */}
            <div className="location-detail__sections">
              {/* Address Information */}
              <div className="location-detail__section">
                <h3 className="location-detail__section-title">📍 Address</h3>
                <div className="location-detail__section-content">
                  <div className="location-detail__address">
                    <div>{location.address.street}</div>
                    <div>{location.address.city}, {location.address.state} {location.address.zipCode}</div>
                    <div>{location.address.country}</div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="location-detail__section">
                <h3 className="location-detail__section-title">📞 Contact Information</h3>
                <div className="location-detail__section-content">
                  {location.contactInfo.primaryContact && (
                    <div className="location-detail__contact-item">
                      <strong>Primary Contact:</strong> {location.contactInfo.primaryContact}
                    </div>
                  )}
                  <div className="location-detail__contact-item">
                    <strong>Email:</strong> 
                    <a href={`mailto:${location.contactInfo.email}`} className="location-detail__link">
                      {location.contactInfo.email}
                    </a>
                  </div>
                  <div className="location-detail__contact-item">
                    <strong>Phone:</strong> 
                    <a href={`tel:${location.contactInfo.phone}`} className="location-detail__link">
                      {location.contactInfo.phone}
                    </a>
                  </div>
                  {location.contactInfo.website && (
                    <div className="location-detail__contact-item">
                      <strong>Website:</strong> 
                      <a 
                        href={location.contactInfo.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="location-detail__link"
                      >
                        {location.contactInfo.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Location Details */}
              <div className="location-detail__section">
                <h3 className="location-detail__section-title">🏢 Location Details</h3>
                <div className="location-detail__section-content">
                  <div className="location-detail__details-grid">
                    <div className="location-detail__detail-item">
                      <strong>Type:</strong> {location.type.charAt(0).toUpperCase() + location.type.slice(1)}
                    </div>
                    <div className="location-detail__detail-item">
                      <strong>Status:</strong> {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                    </div>
                    {location.totalFloors && (
                      <div className="location-detail__detail-item">
                        <strong>Total Floors:</strong> {location.totalFloors}
                      </div>
                    )}
                    {location.totalUnits && (
                      <div className="location-detail__detail-item">
                        <strong>Total Units:</strong> {location.totalUnits}
                      </div>
                    )}
                    {location.squareFootage && (
                      <div className="location-detail__detail-item">
                        <strong>Square Footage:</strong> {location.squareFootage.toLocaleString()} sq ft
                      </div>
                    )}
                    {location.yearBuilt && (
                      <div className="location-detail__detail-item">
                        <strong>Year Built:</strong> {location.yearBuilt}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              {location.description && (
                <div className="location-detail__section">
                  <h3 className="location-detail__section-title">📝 Description</h3>
                  <div className="location-detail__section-content">
                    <p className="location-detail__description">{location.description}</p>
                  </div>
                </div>
              )}

              {/* Notes */}
              {location.notes && (
                <div className="location-detail__section">
                  <h3 className="location-detail__section-title">📋 Notes</h3>
                  <div className="location-detail__section-content">
                    <p className="location-detail__notes">{location.notes}</p>
                  </div>
                </div>
              )}

              {/* Timestamps */}
              <div className="location-detail__section">
                <h3 className="location-detail__section-title">🕒 Timestamps</h3>
                <div className="location-detail__section-content">
                  <div className="location-detail__detail-item">
                    <strong>Created:</strong> {formatDate(location.createdAt)}
                  </div>
                  <div className="location-detail__detail-item">
                    <strong>Last Updated:</strong> {formatDate(location.updatedAt)}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'equipment' && (
          <div className="location-detail__equipment">
            <div className="location-detail__placeholder">
              <h3>Equipment Management</h3>
              <p>Equipment list and management will be available once the Equipment module is implemented.</p>
              <p>Current equipment count: <strong>{location.equipmentCount}</strong></p>
            </div>
          </div>
        )}

        {activeTab === 'meters' && (
          <div className="location-detail__meters">
            <div className="location-detail__placeholder">
              <h3>Meter Management</h3>
              <p>Meter list and readings will be available once the Meter module is implemented.</p>
              <p>Current meter count: <strong>{location.meterCount}</strong></p>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="location-detail__history">
            <div className="location-detail__placeholder">
              <h3>Location History</h3>
              <p>Location change history and audit logs will be available in a future update.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};