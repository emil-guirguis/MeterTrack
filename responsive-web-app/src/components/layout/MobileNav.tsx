import React, { useEffect, useRef } from 'react';
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
  // Mock user for testing - replace with real useAuth when backend is available
  const mockUser = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    role: 'admin' as const,
    permissions: [],
    status: 'active' as const,
    createdAt: new Date(),
    updatedAt: new Date()
  };
  
  const user = mockUser;
  const logout = () => console.log('Logout clicked');
  const checkPermission = () => true;
  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile nav when route changes (but not on initial render)
  const prevPathname = useRef(location.pathname);
  useEffect(() => {
    if (prevPathname.current !== location.pathname && prevPathname.current !== undefined) {
      onClose();
    }
    prevPathname.current = location.pathname;
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
        id="main-navigation"
      >




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