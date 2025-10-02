import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import type { MenuItem } from '../../types/ui';
import './MobileNav.css';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
}

const MobileNav: React.FC<MobileNavProps> = ({
  isOpen,
  onClose,
  menuItems
}) => {
  const { user, logout, checkPermission } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile nav when route changes
  useEffect(() => {
    onClose();
  }, [location.pathname, onClose]);

  // Prevent body scroll when mobile nav is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const handleItemClick = (item: MenuItem) => {
    navigate(item.path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const getIconElement = (iconName: string) => {
    const iconMap: Record<string, string> = {
      dashboard: '📊',
      users: '👥',
      building: '🏢',
      equipment: '⚙️',
      contacts: '📞',
      meter: '📏',
      template: '📧',
      settings: '⚙️'
    };
    return iconMap[iconName] || '📄';
  };

  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredPermission) return true;
    return checkPermission(item.requiredPermission as any);
  });

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="mobile-nav-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Mobile Navigation Drawer */}
      <nav 
        className={`mobile-nav ${isOpen ? 'open' : ''}`}
        aria-label="Mobile navigation"
        role="navigation"
      >
        {/* Header */}
        <div className="mobile-nav__header">
          <div className="mobile-nav__brand">
            <span className="brand-icon">🏢</span>
            <span className="brand-text">Business App</span>
          </div>
          <button
            className="mobile-nav__close"
            onClick={onClose}
            aria-label="Close navigation"
            type="button"
          >
            <span className="close-icon">✕</span>
          </button>
        </div>

        {/* User Info */}
        {user && (
          <div className="mobile-nav__user">
            <div className="user-avatar">
              <span className="avatar-initials">
                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </span>
            </div>
            <div className="user-details">
              <div className="user-name">{user.name}</div>
              <div className="user-email">{user.email}</div>
              <div className="user-role">{user.role}</div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <div className="mobile-nav__menu">
          <ul className="mobile-menu-list">
            {filteredMenuItems.map((item) => (
              <li key={item.id} className="mobile-menu-item">
                <button
                  className={`mobile-menu-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                  onClick={() => handleItemClick(item)}
                  type="button"
                >
                  <span className="menu-icon">
                    {getIconElement(item.icon)}
                  </span>
                  <span className="menu-label">{item.label}</span>
                  {item.badge && (
                    <span className="menu-badge">{item.badge}</span>
                  )}
                  <span className="menu-arrow">›</span>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Quick Actions */}
        <div className="mobile-nav__actions">
          <button 
            className="mobile-action-button"
            onClick={() => {
              navigate('/profile');
              onClose();
            }}
            type="button"
          >
            <span className="action-icon">👤</span>
            <span className="action-label">Profile</span>
          </button>
          <button 
            className="mobile-action-button"
            onClick={() => {
              navigate('/settings');
              onClose();
            }}
            type="button"
          >
            <span className="action-icon">⚙️</span>
            <span className="action-label">Settings</span>
          </button>
          <button 
            className="mobile-action-button"
            onClick={() => {
              navigate('/help');
              onClose();
            }}
            type="button"
          >
            <span className="action-icon">❓</span>
            <span className="action-label">Help</span>
          </button>
        </div>

        {/* Footer */}
        <div className="mobile-nav__footer">
          <button
            className="mobile-logout-button"
            onClick={handleLogout}
            type="button"
          >
            <span className="logout-icon">🚪</span>
            <span className="logout-label">Sign Out</span>
          </button>
          <div className="app-version">
            <span>Version 1.0.0</span>
          </div>
        </div>
      </nav>
    </>
  );
};

export default MobileNav;