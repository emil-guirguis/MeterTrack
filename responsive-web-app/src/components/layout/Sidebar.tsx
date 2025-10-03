import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import type { SidebarProps } from '../../types/ui';
import './Sidebar.css';

const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed,
  isMobile,
  menuItems,
  currentPath,
  onToggle,
  onNavigate
}) => {
  const navigate = useNavigate();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const asideRef = useRef<HTMLElement | null>(null);

  const handleItemClick = (item: any) => {
    const hasChildren = item.children && item.children.length > 0;

    // When the sidebar is collapsed on desktop, clicking a parent menu
    // should not auto-expand its submenu. Return early in that case.
    if (hasChildren && isCollapsed && !isMobile) {
      console.debug('[Sidebar] click on parent item while collapsed (desktop) - ignoring expand for', item.id);
      return;
    }

    if (hasChildren) {
      // Toggle submenu
      setExpandedItems(prev => 
        prev.includes(item.id) 
          ? prev.filter(id => id !== item.id)
          : [...prev, item.id]
      );
    } else {
      // Navigate to page
      navigate(item.path);
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

  const renderMenuItem = (item: any, level = 0) => {
    const isActive = isItemActive(item);
    const isExpanded = expandedItems.includes(item.id);
    const hasChildren = item.children && item.children.length > 0;

    return (
      <li key={item.id} className={`sidebar-item ${level > 0 ? 'sidebar-item--child' : ''}`}>
        <div
          className={`sidebar-link ${isActive ? 'active' : ''} ${hasChildren ? 'has-children' : ''}`}
          onClick={(e) => {
            // Prevent clicks from bubbling to ancestor handlers which might
            // toggle or expand the sidebar. Keep the sidebar collapsed state
            // controlled only by the explicit toggle button.
            e.preventDefault();
            e.stopPropagation();
            // Use error-level logging so it's visible even if debug is filtered
            console.error('[Sidebar] menu item clicked:', item.id, 'isCollapsed=', isCollapsed, 'isMobile=', isMobile);
            // Brief visual flash on the sidebar to confirm the handler ran
            try {
              if (asideRef.current) {
                asideRef.current.classList.add('sidebar-debug-active');
                window.setTimeout(() => asideRef.current && asideRef.current.classList.remove('sidebar-debug-active'), 300);
              }
            } catch (e) {
              // ignore
            }
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
              {getIconElement(item.icon)}
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
    <>
      <aside 
        ref={asideRef}
        className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isMobile ? 'mobile' : ''}`}
        aria-label="Main navigation"
      >
        <div className="sidebar__header">
          {(!isCollapsed || isMobile) && (
            <div className="sidebar__brand">
              <span className="brand-icon">🏢</span>
              <span className="brand-text">MeterIt</span>
            </div>
          )}
          
          {!isMobile && (
            <button
              className="sidebar__toggle"
              onClick={onToggle}
              aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              type="button"
            >
              {/* Use a single glyph and rotate it via CSS for a smooth animation */}
              <span className={`toggle-icon ${isCollapsed ? 'collapsed' : ''}`}>
                ◀
              </span>
            </button>
          )}
        </div>

        <nav className="sidebar__nav">
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
    </>
  );
};

export default Sidebar;