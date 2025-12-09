import React, { useState, useRef, useEffect } from 'react';
import type { HeaderProps } from '../types';
import { HamburgerIcon } from './HamburgerIcon';
import { getIconElement } from '../../utils/iconHelper';
import { getAppVersion, formatVersion } from '../../utils/version';

import './Header.css';

/**
 * Header Component
 * 
 * Framework-provided header component with:
 * - Responsive layout
 * - User menu dropdown
 * - Notifications dropdown
 * - Sidebar toggle button
 * - Branding display
 */
export const Header: React.FC<HeaderProps> = ({
  user,
  notifications = [],
  onLogout,
  isMobile,
  showSidebarElements = false,
  sidebarBrand,
  onToggleSidebar,
  sidebarCollapsed = false
}) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (userMenuOpen) setUserMenuOpen(false);
        if (notificationsOpen) setNotificationsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [userMenuOpen, notificationsOpen]);

  const unreadNotifications = notifications.filter(n => !n.id.includes('read')).length;

  return (
    <header
      className={`app-header ${showSidebarElements ? 'show-sidebar-elements' : ''}`}
      role="banner"
      aria-label="Main application header"
    >
      {/* Left side - Sidebar elements when needed */}
      {showSidebarElements && (
        <div className="app-header__left" role="navigation" aria-label="Primary navigation">
          <button
            className="app-header__menu-toggle"
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Open navigation menu' : 'Close navigation menu'}
            {...(!sidebarCollapsed ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
            aria-controls="main-navigation"
            aria-haspopup="menu"
            type="button"
          >
            <HamburgerIcon isOpen={!sidebarCollapsed} />
          </button>

          {sidebarBrand && (
            <div className="app-header__brand" role="img" aria-label={`${sidebarBrand.text} application`}>
              <span className="brand-text">{sidebarBrand.text}</span>
            </div>
          )}
        </div>
      )}

      {/* Center - Page title when sidebar elements are shown */}
      {showSidebarElements && (
        <div className="app-header__center">
          {/* Title can be added here when needed */}
        </div>
      )}

      {/* Right side - Search, User menu and notifications */}
      <div className="app-header__right">
        {/* Search Bar */}
        <div className="app-header__search">
          <div className="search-container">
            {getIconElement('search', 'search-icon')}
            <input
              type="search"
              className="search-input"
              placeholder="Search..."
              aria-label="Search"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="app-header__notifications" ref={notificationsRef}>
          <button
            className={`notification-button ${unreadNotifications > 0 ? 'has-notifications' : ''}`}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
            {...(notificationsOpen ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
            aria-controls="notifications-dropdown"
            aria-haspopup="menu"
            type="button"
          >
            {getIconElement('notifications', 'icon notification-icon')}
            {unreadNotifications > 0 && (
              <span className="notification-badge" aria-hidden="true">{unreadNotifications}</span>
            )}
          </button>

          {notificationsOpen && (
            <div
              className="notifications-dropdown"
              id="notifications-dropdown"
              role="region"
              aria-label="Notifications menu"
            >
              <div className="notifications-header">
                <h3>Notifications</h3>
                {unreadNotifications > 0 && (
                  <span className="unread-count">{unreadNotifications} unread</span>
                )}
              </div>
              <div className="notifications-list">
                {notifications.length > 0 ? (
                  notifications.slice(0, 5).map((notification) => (
                    <div key={notification.id} className="notification-item">
                      <div className={`notification-type ${notification.type}`}>
                        {notification.type === 'success' && getIconElement('check_circle', 'notification-icon')}
                        {notification.type === 'error' && getIconElement('error', 'notification-icon')}
                        {notification.type === 'warning' && getIconElement('warning', 'notification-icon')}
                        {notification.type === 'info' && getIconElement('info', 'notification-icon')}
                      </div>
                      <div className="notification-content">
                        <div className="notification-title">{notification.title}</div>
                        {notification.message && (
                          <div className="notification-message">{notification.message}</div>
                        )}
                        <div className="notification-time">
                          {notification.createdAt.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="no-notifications">
                    {getIconElement('notifications', 'icon')}
                    <p>No notifications</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Menu */}
        {user && (
          <div className="app-header__user-menu" ref={userMenuRef}>
            <button
              className="user-menu-trigger"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label={`User menu for ${user.name}`}
              {...(userMenuOpen ? { 'aria-expanded': 'true' } : { 'aria-expanded': 'false' })}
              aria-controls="user-menu-dropdown"
              aria-haspopup="menu"
              type="button"
            >
              <div className="user-avatar">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} />
                ) : (
                  <span className="avatar-initials">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </span>
                )}
              </div>
              {!isMobile && (
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-email">{user.email}</div>
                </div>
              )}
              <span className={`dropdown-arrow ${userMenuOpen ? 'open' : ''}`}>▼</span>
            </button>

            {userMenuOpen && (
              <div
                className="user-menu-dropdown"
                id="user-menu-dropdown"
                role="region"
                aria-label="User account menu"
              >
                <div className="user-menu-header">
                  <div className="user-avatar-large">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} />
                    ) : (
                      <span className="avatar-initials">
                        {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div className="user-details">
                    <div className="user-name">{user.name}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                </div>
                <div className="user-menu-divider"></div>
                <div className="user-menu-items" role="menu">
                  <button className="user-menu-item" type="button" role="menuitem">
                    {getIconElement('person', 'icon')}
                    Profile
                  </button>
                  <button className="user-menu-item" type="button" role="menuitem">
                    {getIconElement('settings', 'icon')}
                    Settings
                  </button>
                  <button className="user-menu-item" type="button" role="menuitem">
                    {getIconElement('info', 'icon')}
                    Help
                  </button>
                  <div className="user-menu-divider" role="separator"></div>
                  <button
                    className="user-menu-item logout-item"
                    onClick={onLogout}
                    type="button"
                    role="menuitem"
                  >
                    {getIconElement('lock', 'icon')}
                    Log Out
                  </button>
                </div>
                <div className="user-menu-divider" role="separator"></div>
                <div className="user-menu-footer">
                  <div className="app-version">
                    <span className="version-number">{formatVersion(getAppVersion())}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
