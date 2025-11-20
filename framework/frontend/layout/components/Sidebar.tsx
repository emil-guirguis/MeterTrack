import React, { useState, useRef } from 'react';
import type { SidebarProps } from '../types';
import { getIconElement } from '../../shared/utils/iconHelper';
import './Sidebar.css';

/**
 * Sidebar Component
 * 
 * Framework-provided sidebar navigation component with:
 * - Collapsible state
 * - Nested menu items
 * - Active state highlighting
 * - Tooltips in collapsed mode
 * - Responsive behavior
 */
export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobile,
  menuItems,
  currentPath,
  onToggle,
  onNavigate
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const asideRef = useRef<HTMLElement | null>(null);

  const handleItemClick = (item: any) => {
    const hasChildren = item.children && item.children.length > 0;

    if (hasChildren) {
      // When collapsed, clicking expands the sidebar first, then toggle submenu
      if (isCollapsed && !isMobile) {
        onToggle(); // Expand the sidebar
        // Also expand the submenu
        setExpandedItems(prev => 
          prev.includes(item.id) 
            ? prev
            : [...prev, item.id]
        );
      } else {
        // Toggle submenu when sidebar is expanded
        setExpandedItems(prev => 
          prev.includes(item.id) 
            ? prev.filter(id => id !== item.id)
            : [...prev, item.id]
        );
      }
    } else {
      // Navigate to page - let parent handle navigation
      onNavigate(item.path);
    }
  };

  const isItemActive = (item: any): boolean => {
    if (item.path === currentPath) return true;
    if (item.children) {
      return item.children.some((child: any) => child.path === currentPath);
    }
    return false;
  };

  const renderMenuItem = (item: any, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} className={`sidebar-item ${level > 0 ? 'sidebar-item--child' : ''}`}>
        <div
          className={`sidebar-link ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleItemClick(item);
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              handleItemClick(item);
            }
          }}
        >
          <div className="sidebar-link__content">
            <span className="sidebar-icon">
              {getIconElement(item.id)}
            </span>
            {(!isCollapsed || isMobile) && (
              <>
                <span className="sidebar-label">{item.label}</span>
                {item.badge && (
                  <span className="sidebar-badge">{item.badge}</span>
                )}
                {hasChildren && (
                  <span className={`sidebar-arrow ${isExpanded ? 'expanded' : ''}`}>
                    ▼
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Submenu */}
        {hasChildren && (!isCollapsed || isMobile) && (
          <ul className={`sidebar-submenu ${isExpanded ? 'expanded' : ''}`}>
            {item.children.map((child: any) => renderMenuItem(child, level + 1))}
          </ul>
        )}

        {/* Tooltip for collapsed state */}
        {isCollapsed && !isMobile && (
          <div className="sidebar-tooltip">
            {item.label}
            {item.badge && <span className="tooltip-badge">{item.badge}</span>}
          </div>
        )}
      </li>
    );
  };

  return (
    <aside 
      ref={asideRef}
      className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
      aria-label="Main navigation"
    >
      <div className="sidebar__header">
        {/* Only show toggle button on desktop */}
        {!isMobile && (
          <button
            className="sidebar__toggle"
            onClick={onToggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            type="button"
          >
            <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
              ◀
            </span>
          </button>
        )}
      </div>

      <nav className="sidebar__nav" id="main-navigation">
        <ul className="sidebar-menu">
          {menuItems.map(item => renderMenuItem(item))}
        </ul>
      </nav>

      <div className="sidebar__footer">
        {(!isCollapsed || isMobile) && (
          <div className="sidebar-footer-content">
            <div className="app-version">
              <span className="version-label">Version</span>
              <span className="version-number">1.0.0</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
