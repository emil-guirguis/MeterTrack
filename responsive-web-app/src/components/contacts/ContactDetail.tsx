import React from 'react';
import type { Contact } from '../../types/entities';
import './ContactDetail.css';

interface ContactDetailProps {
  contact: Contact;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
  loading?: boolean;
}

export const ContactDetail: React.FC<ContactDetailProps> = ({
  contact,
  onEdit,
  onDelete,
  onClose,
  loading = false,
}) => {
  const handleEmailClick = () => {
    window.location.href = `mailto:${contact.email}`;
  };

  const handlePhoneClick = () => {
    window.location.href = `tel:${contact.phone}`;
  };

  const handleWebsiteClick = () => {
    if (contact.website) {
      window.open(contact.website, '_blank', 'noopener,noreferrer');
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="contact-detail contact-detail--loading">
        <div className="contact-detail__spinner" />
        <p>Loading contact details...</p>
      </div>
    );
  }

  return (
    <div className="contact-detail">
      {/* Header */}
      <div className="contact-detail__header">
        <div className="contact-detail__header-content">
          <div className="contact-detail__title-section">
            <h1 className="contact-detail__title">{contact.name}</h1>
            <div className="contact-detail__subtitle">
              <span className={`badge badge--${contact.type === 'customer' ? 'primary' : 'secondary'}`}>
                {contact.type.charAt(0).toUpperCase() + contact.type.slice(1)}
              </span>
              <span className={`status-indicator status-indicator--${contact.status}`}>
                <span className={`status-dot status-dot--${contact.status}`}></span>
                {contact.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
          
          <div className="contact-detail__actions">
            {onEdit && (
              <button
                type="button"
                onClick={onEdit}
                className="contact-detail__btn contact-detail__btn--primary"
                aria-label="Edit contact"
              >
                ✏️ Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="contact-detail__btn contact-detail__btn--danger"
                aria-label="Delete contact"
              >
                🗑️ Delete
              </button>
            )}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="contact-detail__btn contact-detail__btn--secondary"
                aria-label="Close details"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="contact-detail__content">
        <div className="contact-detail__main">
          <div className="contact-detail__sections">
            {/* Contact Information */}
            <div className="contact-detail__section">
              <h3 className="contact-detail__section-title">👤 Contact Information</h3>
              <div className="contact-detail__section-content">
                <div className="contact-detail__contact-item">
                  <strong>Contact Person:</strong> {contact.contactPerson}
                </div>
                <div className="contact-detail__contact-item">
                  <strong>Email:</strong> 
                  <button 
                    onClick={handleEmailClick}
                    className="contact-detail__link"
                    aria-label={`Send email to ${contact.email}`}
                  >
                    {contact.email}
                  </button>
                </div>
                <div className="contact-detail__contact-item">
                  <strong>Phone:</strong> 
                  <button 
                    onClick={handlePhoneClick}
                    className="contact-detail__link"
                    aria-label={`Call ${contact.phone}`}
                  >
                    {contact.phone}
                  </button>
                </div>
                {contact.website && (
                  <div className="contact-detail__contact-item">
                    <strong>Website:</strong> 
                    <button 
                      onClick={handleWebsiteClick}
                      className="contact-detail__link"
                      aria-label={`Visit ${contact.website}`}
                    >
                      {contact.website}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Address Information */}
            <div className="contact-detail__section">
              <h3 className="contact-detail__section-title">📍 Address</h3>
              <div className="contact-detail__section-content">
                <div className="contact-detail__address">
                  <div>{contact.address.street}</div>
                  <div>{contact.address.city}, {contact.address.state} {contact.address.zipCode}</div>
                  <div>{contact.address.country}</div>
                </div>
              </div>
            </div>

            {/* Business Information */}
            <div className="contact-detail__section">
              <h3 className="contact-detail__section-title">🏢 Business Information</h3>
              <div className="contact-detail__section-content">
                <div className="contact-detail__details-grid">
                  {contact.businessType && (
                    <div className="contact-detail__detail-item">
                      <strong>Business Type:</strong>
                      <span>{contact.businessType}</span>
                    </div>
                  )}
                  {contact.industry && (
                    <div className="contact-detail__detail-item">
                      <strong>Industry:</strong>
                      <span>{contact.industry}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Tags */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="contact-detail__section">
                <h3 className="contact-detail__section-title">🏷️ Tags</h3>
                <div className="contact-detail__section-content">
                  <div className="contact-detail__tags">
                    {contact.tags.map((tag, index) => (
                      <span key={index} className="badge badge--neutral">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Notes */}
            {contact.notes && (
              <div className="contact-detail__section">
                <h3 className="contact-detail__section-title">📝 Notes</h3>
                <div className="contact-detail__section-content">
                  <div className="contact-detail__notes">
                    {contact.notes}
                  </div>
                </div>
              </div>
            )}

            {/* Metadata */}
            <div className="contact-detail__section">
              <h3 className="contact-detail__section-title">ℹ️ Details</h3>
              <div className="contact-detail__section-content">
                <div className="contact-detail__details-grid">
                  <div className="contact-detail__detail-item">
                    <strong>Created:</strong>
                    <span>{formatDate(contact.createdAt)}</span>
                  </div>
                  <div className="contact-detail__detail-item">
                    <strong>Last Updated:</strong>
                    <span>{formatDate(contact.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};