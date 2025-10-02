import React, { useState, useEffect, useCallback } from 'react';
import type { FormModalProps } from '../../types/ui';
import { useResponsive } from '../../hooks/useResponsive';
import './FormModal.css';

export function FormModal<T extends Record<string, any>>({
  isOpen,
  title,
  data,
  loading = false,
  error,
  onClose,
  onSubmit,
  children,
  size = 'md',
  fullScreen = false,
}: FormModalProps<T>) {
  const { isMobile } = useResponsive();

  // Auto full screen on mobile
  const shouldFullScreen = fullScreen || isMobile;

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, loading, onClose]);

  // Handle backdrop click
  const handleBackdropClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && !loading) {
      onClose();
    }
  }, [loading, onClose]);



  if (!isOpen) return null;

  return (
    <div 
      className={`
        form-modal__backdrop
        ${shouldFullScreen ? 'form-modal__backdrop--fullscreen' : ''}
      `.trim()}
      onClick={handleBackdropClick}
    >
      <div 
        className={`
          form-modal
          form-modal--${size}
          ${shouldFullScreen ? 'form-modal--fullscreen' : ''}
          ${loading ? 'form-modal--loading' : ''}
        `.trim()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="form-modal-title"
      >
        {/* Header */}
        <div className="form-modal__header">
          <h2 id="form-modal-title" className="form-modal__title">
            {title}
          </h2>
          <button
            type="button"
            className="form-modal__close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="form-modal__error">
            <span className="form-modal__error-icon">⚠️</span>
            <span className="form-modal__error-message">{error}</span>
          </div>
        )}

        {/* Content */}
        <div className="form-modal__content">
          {children}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="form-modal__loading-overlay">
            <div className="form-modal__loading-content">
              <div className="form-modal__spinner form-modal__spinner--large"></div>
              <p>Loading...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}