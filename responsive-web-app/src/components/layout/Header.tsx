import React, { useState, useRef, useEffect } from 'react';
import type { HeaderProps } from '../../types/ui';
import './Header.css';

const Header: React.FC<HeaderProps> = ({
  user,
  notifications = [],
  onLogout,
  isMobile
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

  const unreadNotifications = notifications.filter(n => !n.id.includes('read')).length;

  return (
    <header className="app-header">

      <div className="app-header__right">
        {/* Notifications */}
        <div className="app-header__notifications" ref={notificationsRef}>
          <button
            className={`notification-button ${unreadNotifications > 0 ? 'has-notifications' : ''}`}
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            aria-label={`Notifications ${unreadNotifications > 0 ? `(${unreadNotifications} unread)` : ''}`}
            type="button"
          >
            <span className="icon notification-icon">🔔</span>
            {unreadNotifications > 0 && (
              <span className="notification-badge">{unreadNotifications}</span>
            )}
          </button>

          {notificationsOpen && (
            <div className="notifications-dropdown">
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
                        <span className="notification-icon">
                          {notification.type === 'success' && '✅'}
                          {notification.type === 'error' && '❌'}
                          {notification.type === 'warning' && '⚠️'}
                          {notification.type === 'info' && 'ℹ️'}
                        </span>
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
                    <span className="icon">📭</span>
                    <p>No notifications</p>
                  </div>
                )}
              </div>
              {notifications.length > 5 && (
                <div className="notifications-footer">
                  <button className="view-all-button">View all notifications</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User Menu */}
        {user && (
          <div className="app-header__user-menu" ref={userMenuRef}>
            <button
              className="user-menu-trigger"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              aria-label="User menu"
              {...(userMenuOpen ? { 'aria-expanded': true } : { 'aria-expanded': false })}
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
              <div className="user-menu-dropdown">
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
                <div className="user-menu-items">
                  <button className="user-menu-item" type="button">
                    <span className="icon">👤</span>
                    Profile
                  </button>
                  <button className="user-menu-item" type="button">
                    <span className="icon">⚙️</span>
                    Settings
                  </button>
                  <button className="user-menu-item" type="button">
                    <span className="icon">❓</span>
                    Help
                  </button>
                </div>
                <div className="user-menu-divider"></div>
                <button 
                  className="user-menu-item logout-item" 
                  onClick={onLogout}
                  type="button"
                >
                  <span className="icon">🚪</span>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;